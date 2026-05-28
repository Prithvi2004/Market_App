"""Poll yfinance in batches → Redis + SQLite. Optimized to use fast_info for speed."""
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

# Real BSE equivalents of NIFTY50 symbols (.NS → .BO)
BSE_NIFTY50 = [sym.replace(".NS", ".BO") for sym in NIFTY50]


def get_last_poll_time() -> Optional[datetime]:
    return _last_poll_time


def _chunks(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


def _quote_from_fast(symbol: str, fast: dict, info: dict) -> Optional[Quote]:
    """Build a Quote from fast_info + optional info dict."""
    try:
        price = fast.get("last_price") or info.get("regularMarketPrice") or info.get("currentPrice")
        prev  = fast.get("previous_close") or info.get("regularMarketPreviousClose") or info.get("previousClose")
        if price is None or prev is None:
            return None
        change = price - prev
        change_pct = (change / prev * 100) if prev else 0.0

        # Use static metadata for NSE symbols; derive from yfinance for BSE
        bse_sym = symbol.replace(".BO", ".NS")
        if symbol.endswith(".NS") and symbol in SYMBOL_META:
            name, _ = SYMBOL_META[symbol]
        elif symbol.endswith(".BO") and bse_sym in SYMBOL_META:
            name, _ = SYMBOL_META[bse_sym]
        elif symbol in INDEX_NAMES:
            name = INDEX_NAMES[symbol]
        else:
            name = info.get("shortName") or info.get("longName") or symbol

        exchange = "INDEX" if symbol.startswith("^") else ("NSE" if symbol.endswith(".NS") else "BSE")
        return Quote(
            symbol=symbol,
            name=name,
            exchange=exchange,
            price=float(price),
            change=float(change),
            change_pct=float(change_pct),
            volume=int(fast.get("last_volume") or info.get("regularMarketVolume") or 0),
            high_52w=float(fast.get("year_high") or info.get("fiftyTwoWeekHigh") or price),
            low_52w=float(fast.get("year_low") or info.get("fiftyTwoWeekLow") or price),
            market_cap=fast.get("market_cap") or info.get("marketCap"),
            timestamp=now_ist(),
            stale=not is_market_open(),
        )
    except Exception as e:
        log.debug("quote build failed for %s: %s", symbol, e)
        return None


def _fetch_ticker_safe(sym: str) -> tuple[dict, dict]:
    """Fetch fast_info with one retry on 429/connection errors."""
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
                    wait = 10 if "429" in err else 5
                    log.warning("Rate-limit/connection hit for %s, backing off %ds", sym, wait)
                    _time.sleep(wait)
                    continue
            raise
    return {}, {}


def _poll_symbol_batch(symbols: list[str]) -> dict[str, Quote]:
    """Poll a batch of symbols via yfinance Tickers, return dict of symbol→Quote."""
    quotes: dict[str, Quote] = {}
    try:
        tickers_obj = yf.Tickers(" ".join(symbols))
    except Exception as e:
        log.warning("yfinance Tickers init failed: %s", e)
        tickers_obj = None

    for sym in symbols:
        try:
            fast, info = {}, {}
            if tickers_obj:
                t = tickers_obj.tickers.get(sym)
                if t:
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
            else:
                fast, info = _fetch_ticker_safe(sym)

            q = _quote_from_fast(sym, fast, info)
            if q is None:
                # Mark existing cache as stale rather than removing it
                cached = cache_get(f"quote:{sym}")
                if cached:
                    cached["stale"] = True
                    cache_set(f"quote:{sym}", cached, ttl=600)
                continue
            quotes[sym] = q
            cache_set(f"quote:{sym}", q.model_dump(), ttl=settings.quote_ttl)
        except Exception as e:
            log.debug("per-symbol fetch failed for %s: %s", sym, e)

    return quotes


def poll_quotes() -> None:
    global _last_poll_time
    log.info("Polling quotes (market_open=%s)", is_market_open())

    # ── Poll Indices ──
    all_symbols = INDICES + NIFTY50 + BSE_NIFTY50
    nse_quotes: dict[str, Quote] = {}
    bse_quotes: dict[str, Quote] = {}

    for batch in _chunks(INDICES + NIFTY50, 50):
        result = _poll_symbol_batch(batch)
        for sym, q in result.items():
            if sym in NIFTY50:
                nse_quotes[sym] = q
            # Indices cached inside _poll_symbol_batch already

    # ── Poll BSE (real .BO data) in separate batches ──
    for batch in _chunks(BSE_NIFTY50, 30):  # smaller batches for BSE
        result = _poll_symbol_batch(batch)
        for sym, q in result.items():
            bse_quotes[sym] = q

    # ── NSE indices snapshot ──
    idx_list = [cache_get(f"quote:{s}") for s in INDICES]
    idx_list = [q for q in idx_list if q]
    if idx_list:
        cache_set("indices", idx_list, ttl=settings.quote_ttl)

    # ── NSE Gainers / Losers ──
    n50 = list(nse_quotes.values())
    if n50:
        n50_sorted = sorted(n50, key=lambda q: q.change_pct, reverse=True)
        gainers = [q.model_dump() for q in n50_sorted[:10]]
        losers  = [q.model_dump() for q in sorted(n50, key=lambda q: q.change_pct)[:10]]
        cache_set("gainers:NSE", gainers, ttl=settings.quote_ttl)
        cache_set("losers:NSE", losers, ttl=settings.quote_ttl)
        cache_set("all_quotes:NSE", {q.symbol: q.model_dump() for q in n50}, ttl=settings.quote_ttl)

    # ── BSE Gainers / Losers (real data) ──
    b50 = list(bse_quotes.values())
    if b50:
        b50_sorted = sorted(b50, key=lambda q: q.change_pct, reverse=True)
        bse_gainers = [q.model_dump() for q in b50_sorted[:10]]
        bse_losers  = [q.model_dump() for q in sorted(b50, key=lambda q: q.change_pct)[:10]]
        cache_set("gainers:BSE", bse_gainers, ttl=settings.quote_ttl)
        cache_set("losers:BSE", bse_losers, ttl=settings.quote_ttl)
        cache_set("all_quotes:BSE", {q.symbol: q.model_dump() for q in b50}, ttl=settings.quote_ttl)

    _last_poll_time = now_ist()
    log.info("Polled %d NSE + %d BSE symbols", len(nse_quotes), len(bse_quotes))


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
