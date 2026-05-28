"""Portfolio valuation endpoint."""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from cache import cache_get
from config import NIFTY50, SYMBOL_META

log = logging.getLogger(__name__)
router = APIRouter()


class Holding(BaseModel):
    symbol: str
    qty: float
    buy_price: float


class HoldingResult(BaseModel):
    symbol: str
    name: str
    qty: float
    buy_price: float
    current_price: Optional[float]
    current_value: Optional[float]
    invested: float
    pnl: Optional[float]
    pnl_pct: Optional[float]
    change_pct: Optional[float]
    stale: bool = False


class PortfolioResult(BaseModel):
    holdings: list[HoldingResult]
    total_invested: float
    total_current_value: Optional[float]
    total_pnl: Optional[float]
    total_pnl_pct: Optional[float]


@router.post("/portfolio/value", response_model=PortfolioResult)
def portfolio_value(holdings: list[Holding]):
    """Accept a list of holdings and return live P&L from cache."""
    results: list[HoldingResult] = []
    total_invested = 0.0
    total_value = 0.0
    any_live = False

    for h in holdings:
        invested = h.qty * h.buy_price
        total_invested += invested
        quote = cache_get(f"quote:{h.symbol}")
        name, _ = SYMBOL_META.get(h.symbol, (h.symbol, ""))
        if quote:
            cp = float(quote.get("price", 0))
            cv = cp * h.qty
            pnl = cv - invested
            pnl_pct = (pnl / invested * 100) if invested else 0.0
            total_value += cv
            any_live = True
            results.append(HoldingResult(
                symbol=h.symbol, name=name,
                qty=h.qty, buy_price=h.buy_price,
                current_price=cp, current_value=cv,
                invested=invested, pnl=pnl, pnl_pct=pnl_pct,
                change_pct=float(quote.get("change_pct", 0)),
                stale=bool(quote.get("stale", False)),
            ))
        else:
            results.append(HoldingResult(
                symbol=h.symbol, name=name,
                qty=h.qty, buy_price=h.buy_price,
                current_price=None, current_value=None,
                invested=invested, pnl=None, pnl_pct=None,
                change_pct=None, stale=True,
            ))

    total_pnl = (total_value - total_invested) if any_live else None
    total_pnl_pct = (total_pnl / total_invested * 100) if (any_live and total_invested) else None

    return PortfolioResult(
        holdings=results,
        total_invested=total_invested,
        total_current_value=total_value if any_live else None,
        total_pnl=total_pnl,
        total_pnl_pct=total_pnl_pct,
    )
