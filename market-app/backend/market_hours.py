"""Market hours + IST helpers + NSE holiday calendar."""
from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from config import NSE_HOLIDAYS

IST = timezone(timedelta(hours=5, minutes=30))


def now_ist() -> datetime:
    return datetime.now(IST)


def market_status() -> str:
    """Return 'pre' | 'open' | 'closed' | 'holiday' for NSE/BSE."""
    n = now_ist()
    date_str = n.strftime("%Y-%m-%d")
    if n.weekday() >= 5:
        return "closed"
    if date_str in NSE_HOLIDAYS:
        return "holiday"
    t = n.time()
    if time(9, 0) <= t < time(9, 15):
        return "pre"
    if time(9, 15) <= t <= time(15, 30):
        return "open"
    return "closed"


def is_market_open() -> bool:
    return market_status() == "open"


def next_open_ist() -> str:
    """Return ISO string of next market open (for display)."""
    n = now_ist()
    for delta in range(1, 8):
        candidate = n + timedelta(days=delta)
        ds = candidate.strftime("%Y-%m-%d")
        if candidate.weekday() < 5 and ds not in NSE_HOLIDAYS:
            return candidate.replace(hour=9, minute=15, second=0, microsecond=0).isoformat()
    return "unknown"
