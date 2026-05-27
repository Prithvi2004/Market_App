"""Market data routes."""
from __future__ import annotations

import logging
from typing import Optional

import yfinance as yf
from fastapi import APIRouter, HTTPException, Query

from cache import cache_get, cache_set
from config import INDEX_NAMES, INDICES, NIFTY50, SYMBOL_META
from ingestion.ticker_extractor import search_symbols
from market_hours import is_market_open, market_status, now_ist

log = logging.getLogger(__name__)
router = APIRouter()


@router.get("/indices")
def get_indices():
    data = cache_get("indices")
    if data:
        return data
    # Cold start: at least return shells from config so UI isn't empty
    return [
        {
            "symbol": s, "name": INDEX_NAMES[s], "exchange": "INDEX",
            "price": 0, "change": 0, "change_pct": 0, "volume": 0,
            "high_52w": 0, "low_52w": 0, "market_cap": None,
            "timestamp": now_ist().isoformat(), "stale": True,
        }
        for s in INDICES
    ]


@router.get("/quote")
def get_quote(symbol: str):
    q = cache_get(f"quote:{symbol}")
    if q:
        return q
    raise HTTPException(status_code=404, detail=f"No cached quote for {symbol}. Wait for the next poll cycle.")


@router.get("/gainers")
def get_gainers(exchange: str = "NSE", n: int = 10):
    data = cache_get(f"gainers:{exchange}") or []
    return data[:n]


@router.get("/losers")
def get_losers(exchange: str = "NSE", n: int = 10):
    data = cache_get(f"losers:{exchange}") or []
    return data[:n]


_RANGE_MAP = {
    "1D": ("1d", "5m", 3600),
    "1W": ("5d", "1h", 3600),
    "1M": ("1mo", "1d", 86400),
    "1Y": ("1y", "1d", 86400),
}


@router.get("/chart")
def get_chart(symbol: str, range: str = "1D"):
    if range not in _RANGE_MAP:
        raise HTTPException(status_code=400, detail="range must be one of 1D, 1W, 1M, 1Y")
    cache_key = f"chart:{symbol}:{range}"
    cached = cache_get(cache_key)
    if cached:
        return cached
    period, interval, ttl = _RANGE_MAP[range]
    try:
        hist = yf.Ticker(symbol).history(period=period, interval=interval)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"yfinance error: {e}")
    if hist.empty:
        return []
    out = [
        {
            "t": idx.isoformat(),
            "o": float(row["Open"]), "h": float(row["High"]),
            "l": float(row["Low"]), "c": float(row["Close"]),
            "v": int(row["Volume"]),
        }
        for idx, row in hist.iterrows()
    ]
    cache_set(cache_key, out, ttl=ttl)
    return out


@router.get("/search")
def search(q: str = Query(..., min_length=1)):
    return search_symbols(q, limit=15)


@router.get("/status")
def status():
    return {
        "market_status": market_status(),
        "is_open": is_market_open(),
        "now_ist": now_ist().isoformat(),
    }


@router.get("/symbols")
def list_symbols():
    return [
        {"symbol": s, "name": SYMBOL_META[s][0], "sector": SYMBOL_META[s][1], "exchange": "NSE"}
        for s in NIFTY50
    ]


@router.get("/sectors")
def sector_summary(exchange: Optional[str] = "NSE"):
    """Aggregate avg change_pct per sector for the heatmap."""
    out: dict[str, dict] = {}
    for sym in NIFTY50:
        name, sector = SYMBOL_META.get(sym, (sym, "Other"))
        q = cache_get(f"quote:{sym}")
        if not q:
            continue
        d = out.setdefault(sector, {"sector": sector, "count": 0, "sum_pct": 0.0})
        d["count"] += 1
        d["sum_pct"] += float(q.get("change_pct", 0))
    return [
        {"sector": k, "avg_change_pct": (v["sum_pct"] / v["count"]) if v["count"] else 0.0, "count": v["count"]}
        for k, v in sorted(out.items())
    ]
