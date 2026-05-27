"""Poll yfinance in batches → Redis + SQLite."""
from __future__ import annotations

import logging
from datetime import datetime

import yfinance as yf
from sqlmodel import select

from cache import cache_set, cache_get
from config import INDEX_NAMES, INDICES, NIFTY50, SYMBOL_META
from database import get_session
from market_hours import is_market_open, now_ist
from models import OHLCVRecord, Quote

log = logging.getLogger(__name__)


def _chunks(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


def _quote_from_info(symbol: str, info: dict, fast: dict) -> Quote | None:
    try:
        price = fast.get("last_price") or info.get("regularMarketPrice") or info.get("currentPrice")
        prev = fast.get("previous_close") or info.get("regularMarketPreviousClose") or info.get("previousClose")
        if price is None or prev is None:
            return None
        change = price - prev
        change_pct = (change / prev * 100) if prev else 0.0
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
            market_cap=info.get("marketCap"),
            timestamp=now_ist(),
            stale=not is_market_open(),
        )
    except Exception as e:
        log.debug("quote build failed for %s: %s", symbol, e)
        return None


def poll_quotes() -> None:
    log.info("Polling quotes (market_open=%s)", is_market_open())
    symbols = INDICES + NIFTY50
    quotes: dict[str, Quote] = {}

    for batch in _chunks(symbols, 50):
        try:
            tickers = yf.Tickers(" ".join(batch))
        except Exception as e:
            log.warning("yfinance Tickers init failed: %s", e)
            continue
        for sym in batch:
            try:
                t = tickers.tickers.get(sym) or yf.Ticker(sym)
                fast = {}
                try:
                    fi = t.fast_info
                    fast = {
                        "last_price": getattr(fi, "last_price", None),
                        "previous_close": getattr(fi, "previous_close", None),
                        "last_volume": getattr(fi, "last_volume", None),
                        "year_high": getattr(fi, "year_high", None),
                        "year_low": getattr(fi, "year_low", None),
                    }
                except Exception:
                    pass
                info = {}
                try:
                    info = t.info or {}
                except Exception:
                    pass
                q = _quote_from_info(sym, info, fast)
                if q is None:
                    cached = cache_get(f"quote:{sym}")
                    if cached:
                        cached["stale"] = True
                        cache_set(f"quote:{sym}", cached, ttl=600)
                    continue
                quotes[sym] = q
                cache_set(f"quote:{sym}", q.model_dump(), ttl=120)
            except Exception as e:
                log.debug("per-symbol fetch failed for %s: %s", sym, e)

    # Indices snapshot
    idx_list = [quotes[s].model_dump() for s in INDICES if s in quotes]
    if idx_list:
        cache_set("indices", idx_list, ttl=120)

    # Gainers / losers across NIFTY50
    n50 = [quotes[s] for s in NIFTY50 if s in quotes]
    n50_sorted = sorted(n50, key=lambda q: q.change_pct, reverse=True)
    gainers = [q.model_dump() for q in n50_sorted[:10]]
    losers = [q.model_dump() for q in sorted(n50, key=lambda q: q.change_pct)[:10]]
    cache_set("gainers:NSE", gainers, ttl=300)
    cache_set("losers:NSE", losers, ttl=300)

    log.info("Polled %d symbols", len(quotes))


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
