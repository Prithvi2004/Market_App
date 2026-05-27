"""Market hours + small helpers."""
from __future__ import annotations

from datetime import datetime, time, timedelta, timezone

IST = timezone(timedelta(hours=5, minutes=30))


def now_ist() -> datetime:
    return datetime.now(IST)


def market_status() -> str:
    """Return 'pre' | 'open' | 'closed' for NSE/BSE."""
    n = now_ist()
    if n.weekday() >= 5:
        return "closed"
    t = n.time()
    if time(9, 0) <= t < time(9, 15):
        return "pre"
    if time(9, 15) <= t <= time(15, 30):
        return "open"
    return "closed"


def is_market_open() -> bool:
    return market_status() == "open"
