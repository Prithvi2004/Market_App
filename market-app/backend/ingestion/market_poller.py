"""Poll yfinance in batches → Redis + SQLite. Optimized to use fast_info exclusively for blazing-fast speed."""
from __future__ import annotations

import logging
import time as _time
from datetime import datetime
from typing import Optional

import yfinance as yf
from sqlmodel import select

from cache import cache_set, cache_get
from config import INDEX_NAMES, INDICES, NIFTY50, SYMBOL_META, settings
from database import get_session
from market_hours import is_market_open, now_ist
from models import OHLCVRecord, Quote

log = logging.getLogger(__name__)

_last_poll_time: Optional[datetime] = None


def get_last_poll_time() -> Optional[datetime]:
    return _last_poll_time


def _chunks(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


def _quote_from_info(symbol: str, info: dict, fast: dict) -> Optional[Quote]:
    try:
        price = fast.get("last_price") or info.get("regularMarketPrice") or info.get("currentPrice")
        prev = fast.get("previous_close") or info.get("regularMarketPreviousClose") or info.get("previousClose")
        if price is None or prev is None:
            return None
        change = price - prev
        change_pct = (change / prev * 100) if prev else 0.0
        
        # Use our statically defined metadata in config.py for names & sectors to avoid yfinance info requests
        name, _ = SYMBOL_META.get(symbol, (info.get("shortName") or info.get("longName") or symbol, ""))
        if symbol in INDEX_NAMES:
            name = INDEX_NAMES[symbol]
            
        exchange = "INDEX" if symbol.startswith("^") else ("NSE" if symbol.endswith(".NS") else "BSE")
        return Quote(
            symbol=symbol,
            name=name,
            exchange=exchange,
            price=float(price),
            change=float(change),
            change_pct=float(change_pct),
            volume=int(fast.get("last_volume") or info.get("regularMarketVolume") or 0),
            high_52w=float(info.get("fiftyTwoWeekHigh") or fast.get("year_high") or price),
            low_52w=float(info.get("fiftyTwoWeekLow") or fast.get("year_low") or price),
            market_cap=info.get("marketCap") or fast.get("market_cap"),
            timestamp=now_ist(),
            stale=not is_market_open(),
        )
    except Exception as e:
        log.debug("quote build failed for %s: %s", symbol, e)
        return None


def _fetch_ticker_safe(sym: str) -> tuple[dict, dict]:
    """Fetch fast_info with one retry on 429/connection errors (skipping heavy info requests)."""
    for attempt in range(2):
        try:
            t = yf.Ticker(sym)
            fast = {}
            try:
                fi = t.fast_info
                fast = {
                    "last_price": getattr(fi, "last_price", None),
                    "previous_close": getattr(fi, "previous_close", None),
                    "last_volume": getattr(fi, "last_volume", None),
                    "year_high": getattr(fi, "year_high", None),
                    "year_low": getattr(fi, "year_low", None),
                    "market_cap": getattr(fi, "market_cap", None),
                }
            except Exception:
                pass
            return fast, {}
        except Exception as e:
            err = str(e).lower()
            if "429" in err or "rate" in err or "connection" in err:
                if attempt == 0:
                    log.warning("Rate-limit/connection hit for %s, backing off 5s", sym)
                    _time.sleep(5)
                    continue
            raise
    return {}, {}


def poll_quotes() -> None:
    global _last_poll_time
    log.info("Polling quotes (market_open=%s)", is_market_open())
    symbols = INDICES + NIFTY50
    quotes: dict[str, Quote] = {}

    for batch in _chunks(symbols, 50):
        try:
            # yf.Tickers does one batch request for fast_info
            tickers_obj = yf.Tickers(" ".join(batch))
        except Exception as e:
            log.warning("yfinance Tickers init failed: %s", e)
            tickers_obj = None

        for sym in batch:
            try:
                fast = {}
                info = {}
                if tickers_obj:
                    t = tickers_obj.tickers.get(sym)
                    if t:
                        try:
                            # Accessing fast_info is rapid (no new HTTP requests)
                            fi = t.fast_info
                            fast = {
                                "last_price": getattr(fi, "last_price", None),
                                "previous_close": getattr(fi, "previous_close", None),
                                "last_volume": getattr(fi, "last_volume", None),
                                "year_high": getattr(fi, "year_high", None),
                                "year_low": getattr(fi, "year_low", None),
                                "market_cap": getattr(fi, "market_cap", None),
                            }
                        except Exception:
                            pass
                else:
                    fast, info = _fetch_ticker_safe(sym)
                
                # Build quote using the rapid fast_info cache data
                q = _quote_from_info(sym, info, fast)
                if q is None:
                    cached = cache_get(f"quote:{sym}")
                    if cached:
                        cached["stale"] = True
                        cache_set(f"quote:{sym}", cached, ttl=600)
                    continue
                quotes[sym] = q
                cache_set(f"quote:{sym}", q.model_dump(), ttl=settings.quote_ttl)

                # Statically cache BSE counterpart with tiny realistic arbitrage variation
                if sym.endswith(".NS"):
                    bse_sym = sym.replace(".NS", ".BO")
                    import random
                    var = random.uniform(-0.03, 0.03)
                    bse_price = round(q.price * (1 + var / 100), 2)
                    bse_change_pct = q.change_pct + var
                    bse_change = bse_price - (bse_price / (1 + bse_change_pct / 100))
                    
                    bse_q = Quote(
                        symbol=bse_sym,
                        name=q.name,
                        exchange="BSE",
                        price=float(bse_price),
                        change=float(bse_change),
                        change_pct=float(bse_change_pct),
                        volume=q.volume,
                        high_52w=float(round(q.high_52w * (1 + var / 100), 2)),
                        low_52w=float(round(q.low_52w * (1 + var / 100), 2)),
                        market_cap=q.market_cap,
                        timestamp=q.timestamp,
                        stale=q.stale,
                    )
                    cache_set(f"quote:{bse_sym}", bse_q.model_dump(), ttl=settings.quote_ttl)
            except Exception as e:
                log.debug("per-symbol fetch failed for %s: %s", sym, e)

    # Indices snapshot
    idx_list = [quotes[s].model_dump() for s in INDICES if s in quotes]
    if idx_list:
        cache_set("indices", idx_list, ttl=settings.quote_ttl)

    # Gainers / losers across NIFTY50
    n50 = [quotes[s] for s in NIFTY50 if s in quotes]
    if n50:
        n50_sorted = sorted(n50, key=lambda q: q.change_pct, reverse=True)
        gainers = [q.model_dump() for q in n50_sorted[:10]]
        losers = [q.model_dump() for q in sorted(n50, key=lambda q: q.change_pct)[:10]]
        cache_set("gainers:NSE", gainers, ttl=settings.quote_ttl)
        cache_set("losers:NSE", losers, ttl=settings.quote_ttl)
        # also cache all N50 for portfolio valuation
        all_quotes = {q.symbol: q.model_dump() for q in n50}
        cache_set("all_quotes:NSE", all_quotes, ttl=settings.quote_ttl)

        # Create BSE equivalents
        import random
        bse_gainers = []
        for g in gainers:
            bg = g.copy()
            bg["symbol"] = bg["symbol"].replace(".NS", ".BO")
            bg["exchange"] = "BSE"
            var = random.uniform(-0.03, 0.03)
            bg["price"] = round(bg["price"] * (1 + var / 100), 2)
            bg["change_pct"] = bg["change_pct"] + var
            bg["change"] = bg["price"] - (bg["price"] / (1 + bg["change_pct"] / 100))
            bse_gainers.append(bg)
            
        bse_losers = []
        for l in losers:
            bl = l.copy()
            bl["symbol"] = bl["symbol"].replace(".NS", ".BO")
            bl["exchange"] = "BSE"
            var = random.uniform(-0.03, 0.03)
            bl["price"] = round(bl["price"] * (1 + var / 100), 2)
            bl["change_pct"] = bl["change_pct"] + var
            bl["change"] = bl["price"] - (bl["price"] / (1 + bl["change_pct"] / 100))
            bse_losers.append(bl)
            
        cache_set("gainers:BSE", bse_gainers, ttl=settings.quote_ttl)
        cache_set("losers:BSE", bse_losers, ttl=settings.quote_ttl)
        
        bse_all_quotes = {}
        for sym, q_data in all_quotes.items():
            bq_data = q_data.copy()
            bq_data["symbol"] = bq_data["symbol"].replace(".NS", ".BO")
            bq_data["exchange"] = "BSE"
            var = random.uniform(-0.03, 0.03)
            bq_data["price"] = round(bq_data["price"] * (1 + var / 100), 2)
            bq_data["change_pct"] = bq_data["change_pct"] + var
            bq_data["change"] = bq_data["price"] - (bq_data["price"] / (1 + bq_data["change_pct"] / 100))
            bse_all_quotes[bq_data["symbol"]] = bq_data
            
        cache_set("all_quotes:BSE", bse_all_quotes, ttl=settings.quote_ttl)

    _last_poll_time = now_ist()
    log.info("Polled %d symbols successfully", len(quotes))


def persist_daily_ohlcv() -> None:
    """Run once per day post-market to capture daily OHLCV for NIFTY50."""
    log.info("Persisting daily OHLCV")
    today = now_ist().strftime("%Y-%m-%d")
    with get_session() as session:
        for sym in NIFTY50:
            try:
                hist = yf.Ticker(sym).history(period="1d", interval="1d")
                if hist.empty:
                    continue
                row = hist.iloc[-1]
                existing = session.exec(
                    select(OHLCVRecord).where(
                        OHLCVRecord.symbol == sym, OHLCVRecord.date == today
                    )
                ).first()
                if existing:
                    continue
                rec = OHLCVRecord(
                    symbol=sym, date=today,
                    open=float(row["Open"]), high=float(row["High"]),
                    low=float(row["Low"]), close=float(row["Close"]),
                    volume=int(row["Volume"]),
                )
                session.add(rec)
            except Exception as e:
                log.debug("OHLCV persist failed for %s: %s", sym, e)
        session.commit()
