"""Market data routes."""
from __future__ import annotations

import logging
from typing import Optional

import pandas as pd
import ta
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
        
    # Dynamically fetch using yfinance for non-cached or newly searched symbols!
    try:
        t = yf.Ticker(symbol)
        fi = t.fast_info
        
        price = fi.last_price
        prev = fi.previous_close
        
        info = {}
        if price is None or prev is None:
            # Fallback to info dictionary if fast_info doesn't have it
            info = t.info
            price = info.get("currentPrice") or info.get("regularMarketPrice") or price
            prev = info.get("previousClose") or info.get("regularMarketPreviousClose") or prev
            
        if price is None or prev is None:
            raise HTTPException(status_code=404, detail=f"Symbol {symbol} has no price data.")
            
        change = price - prev
        change_pct = (change / prev * 100) if prev else 0.0
        
        if not info:
            try:
                info = t.info
            except Exception:
                pass
                
        name = info.get("longName") or info.get("shortName") or symbol
        exchange = "NSE" if symbol.endswith(".NS") else ("BSE" if symbol.endswith(".BO") else "US")
        
        from models import Quote
        from market_hours import is_market_open, now_ist
        
        q_obj = Quote(
            symbol=symbol,
            name=name,
            exchange=exchange,
            price=float(price),
            change=float(change),
            change_pct=float(change_pct),
            volume=int(fi.last_volume or info.get("regularMarketVolume") or 0),
            high_52w=float(fi.year_high or info.get("fiftyTwoWeekHigh") or price),
            low_52w=float(fi.year_low or info.get("fiftyTwoWeekLow") or price),
            market_cap=fi.market_cap or info.get("marketCap"),
            timestamp=now_ist(),
            stale=not is_market_open(),
        )
        cache_set(f"quote:{symbol}", q_obj.model_dump(), ttl=60)
        return q_obj.model_dump()
    except Exception as e:
        log.exception("Dynamic quote fetch failed for %s", symbol)
        raise HTTPException(status_code=404, detail=f"Could not load quote for {symbol}: {e}")


@router.get("/gainers")
def get_gainers(exchange: str = "NSE", n: int = 10):
    data = cache_get(f"gainers:{exchange}") or []
    return data[:n]


@router.get("/losers")
def get_losers(exchange: str = "NSE", n: int = 10):
    data = cache_get(f"losers:{exchange}") or []
    return data[:n]


_RANGE_MAP = {
    "1D": ("1d",  "5m",  3600),
    "5D": ("5d",  "1h",  3600),
    "1W": ("5d",  "1h",  3600),
    "1M": ("1mo", "1d",  86400),
    "3M": ("3mo", "1d",  86400),
    "6M": ("6mo", "1d",  86400),
    "1Y": ("1y",  "1d",  86400),
    "2Y": ("2y",  "1wk", 86400),
    "5Y": ("5y",  "1wk", 86400),
}


@router.get("/chart")
def get_chart(symbol: str, range: str = "1D"):
    if range not in _RANGE_MAP:
        raise HTTPException(status_code=400, detail="range must be one of 1D, 5D, 1W, 1M, 3M, 6M, 1Y, 2Y, 5Y")
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


@router.get("/fundamentals/{symbol}")
def get_fundamentals(symbol: str):
    """Fetch fundamental data for a symbol: P/E, EPS, dividend, ROE, beta, etc. Cached 3600s."""
    cache_key = f"fundamentals:{symbol}"
    cached = cache_get(cache_key)
    if cached:
        return cached
    try:
        t = yf.Ticker(symbol)
        info = t.info or {}
        fi = t.fast_info
        price = getattr(fi, "last_price", None) or info.get("currentPrice") or info.get("regularMarketPrice")
        year_high = getattr(fi, "year_high", None) or info.get("fiftyTwoWeekHigh")
        year_low  = getattr(fi, "year_low",  None) or info.get("fiftyTwoWeekLow")

        div_yield = info.get("dividendYield")
        profit_margin = info.get("profitMargins")
        roe = info.get("returnOnEquity")
        inst_hold = info.get("heldPercentInstitutions")

        result = {
            "symbol": symbol,
            "name": info.get("longName") or info.get("shortName") or symbol,
            "sector": info.get("sector") or (SYMBOL_META.get(symbol, (symbol, "Unknown"))[1]),
            "industry": info.get("industry") or "—",
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE") or info.get("forwardPE"),
            "forward_pe": info.get("forwardPE"),
            "pb_ratio": info.get("priceToBook"),
            "eps": info.get("trailingEps") or info.get("forwardEps"),
            "dividend_yield": round(div_yield * 100, 2) if div_yield else None,
            "dividend_rate": info.get("dividendRate"),
            "revenue": info.get("totalRevenue"),
            "profit_margin": round(profit_margin * 100, 2) if profit_margin else None,
            "roe": round(roe * 100, 2) if roe else None,
            "debt_to_equity": info.get("debtToEquity"),
            "current_ratio": info.get("currentRatio"),
            "beta": info.get("beta"),
            "52w_high": year_high,
            "52w_low":  year_low,
            "52w_position_pct": (
                round(((price - year_low) / (year_high - year_low)) * 100, 1)
                if price and year_high and year_low and year_high != year_low else None
            ),
            "price": float(price) if price else None,
            "book_value": info.get("bookValue"),
            "shares_outstanding": info.get("sharesOutstanding"),
            "float_shares": info.get("floatShares"),
            "held_by_institutions": round(inst_hold * 100, 2) if inst_hold else None,
            "analyst_recommendation": info.get("recommendationKey"),
            "target_price": info.get("targetMeanPrice"),
            "target_high": info.get("targetHighPrice"),
            "target_low": info.get("targetLowPrice"),
            "num_analysts": info.get("numberOfAnalystOpinions"),
        }
        cache_set(cache_key, result, ttl=3600)
        return result
    except Exception as e:
        log.exception("Fundamentals fetch failed for %s", symbol)
        raise HTTPException(status_code=502, detail=f"Could not load fundamentals for {symbol}: {e}")


@router.get("/peers/{symbol}")
def get_peers(symbol: str):
    """Return same-sector NIFTY50 peers with their cached quotes, sorted by market cap."""
    # Normalize: accept both .NS and .BO
    ns_sym = symbol.replace(".BO", ".NS")
    sector = SYMBOL_META.get(ns_sym, (symbol, None))[1]
    if not sector:
        return []
    peers = [
        s for s in NIFTY50
        if SYMBOL_META.get(s, (s, None))[1] == sector and s != ns_sym
    ]
    result = []
    for s in peers:
        q = cache_get(f"quote:{s}")
        if q:
            result.append({
                "symbol": s,
                "name": SYMBOL_META.get(s, (s, ""))[0],
                "sector": sector,
                "price": q.get("price"),
                "change": q.get("change"),
                "change_pct": q.get("change_pct"),
                "market_cap": q.get("market_cap"),
                "volume": q.get("volume"),
                "high_52w": q.get("high_52w"),
                "low_52w": q.get("low_52w"),
            })
    return sorted(result, key=lambda x: x.get("market_cap") or 0, reverse=True)


@router.get("/indicators/{symbol}")
def get_indicators(symbol: str, range: str = "3M"):
    """Calculate technical indicators using pandas-ta server-side."""
    if range not in _RANGE_MAP:
        raise HTTPException(status_code=400, detail="range must be one of 1D, 5D, 1W, 1M, 3M, 6M, 1Y, 2Y, 5Y")
    
    period, interval, ttl = _RANGE_MAP[range]
    calc_period = "1y"
    calc_interval = "1d"
    if interval == "1wk":
        calc_period = "5y"
        calc_interval = "1wk"
    elif interval in ["5m", "1h"]:
        calc_period = period
        calc_interval = interval

    cache_key = f"indicators_ta:{symbol}:{calc_period}:{calc_interval}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    try:
        hist = yf.Ticker(symbol).history(period=calc_period, interval=calc_interval)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"yfinance error: {e}")
    
    if hist.empty or len(hist) < 20:
        raise HTTPException(status_code=404, detail=f"Insufficient history to calculate indicators for {symbol}")

    try:
        df = hist.copy()
        
        # Calculate indicators via pandas-ta
        ema9 = df.ta.ema(length=9)
        ema20 = df.ta.ema(length=20)
        ema50 = df.ta.ema(length=50)
        ema200 = df.ta.ema(length=200) if len(df) >= 200 else pd.Series(index=df.index, dtype='float64')
        rsi = df.ta.rsi(length=14)
        macd = df.ta.macd(fast=12, slow=26, signal=9)
        bb = df.ta.bbands(length=20, std=2)
        atr = df.ta.atr(length=14)
        adx = df.ta.adx(length=14)
        cmf = df.ta.cmf(length=20)
        cci = df.ta.cci(length=20)
        willr = df.ta.willr(length=14)
        ichimoku, _ = df.ta.ichimoku(tenkan=9, kijun=26, senkou=52)

        # Map history length for alignment
        req_hist = yf.Ticker(symbol).history(period=period, interval=interval)
        req_len = len(req_hist) if not req_hist.empty else len(df)
        
        result = []
        indices = df.index[-req_len:]
        for idx in indices:
            row_idx = df.index.get_loc(idx)
            
            def get_val(series, pos):
                if series is None or pos >= len(series):
                    return None
                val = series.iloc[pos]
                return float(val) if not pd.isna(val) else None

            macd_val = None
            macd_h = None
            macd_s = None
            if macd is not None and not macd.empty:
                macd_val = get_val(macd.iloc[:, 0], row_idx)
                macd_h = get_val(macd.iloc[:, 1], row_idx)
                macd_s = get_val(macd.iloc[:, 2], row_idx)

            bb_l = None
            bb_m = None
            bb_u = None
            if bb is not None and not bb.empty:
                bb_l = get_val(bb.iloc[:, 0], row_idx)
                bb_m = get_val(bb.iloc[:, 1], row_idx)
                bb_u = get_val(bb.iloc[:, 2], row_idx)

            adx_val = None
            dmp_val = None
            dmn_val = None
            if adx is not None and not adx.empty:
                adx_val = get_val(adx.iloc[:, 0], row_idx)
                dmp_val = get_val(adx.iloc[:, 1], row_idx)
                dmn_val = get_val(adx.iloc[:, 2], row_idx)

            tenkan_val = None
            kijun_val = None
            span_a_val = None
            span_b_val = None
            chikou_val = None
            if ichimoku is not None and not ichimoku.empty:
                tenkan_val = get_val(ichimoku.iloc[:, 0], row_idx)
                kijun_val = get_val(ichimoku.iloc[:, 1], row_idx)
                span_a_val = get_val(ichimoku.iloc[:, 2], row_idx)
                span_b_val = get_val(ichimoku.iloc[:, 3], row_idx)
                chikou_val = get_val(ichimoku.iloc[:, 4], row_idx)

            result.append({
                "time": idx.isoformat(),
                "close": float(df["Close"].iloc[row_idx]),
                "ema9": get_val(ema9, row_idx),
                "ema20": get_val(ema20, row_idx),
                "ema50": get_val(ema50, row_idx),
                "ema200": get_val(ema200, row_idx),
                "rsi": get_val(rsi, row_idx),
                "macd": macd_val,
                "macd_h": macd_h,
                "macd_s": macd_s,
                "bb_lower": bb_l,
                "bb_middle": bb_m,
                "bb_upper": bb_u,
                "atr": get_val(atr, row_idx),
                "adx": adx_val,
                "di_plus": dmp_val,
                "di_minus": dmn_val,
                "cmf": get_val(cmf, row_idx),
                "cci": get_val(cci, row_idx),
                "williams_r": get_val(willr, row_idx),
                "ichimoku_tenkan": tenkan_val,
                "ichimoku_kijun": kijun_val,
                "ichimoku_span_a": span_a_val,
                "ichimoku_span_b": span_b_val,
                "ichimoku_chikou": chikou_val,
            })

        cache_set(cache_key, result, ttl=ttl)
        return result
    except Exception as e:
        log.exception("Pandas-ta indicators calculation failed for %s", symbol)
        raise HTTPException(status_code=500, detail=f"Could not calculate indicators: {e}")
