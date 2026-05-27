"""SQLModel tables and Pydantic response schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel


# ---------- SQLite tables ----------

class NewsArticleDB(SQLModel, table=True):
    id: str = Field(primary_key=True)  # sha256[:16] of URL
    title: str
    summary: str
    url: str
    source: str
    published_at: datetime
    category: str  # "national" | "international" | "sector"
    tickers: str  # JSON array string
    sentiment: float
    sentiment_label: str
    fetched_at: datetime


class OHLCVRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str = Field(index=True)
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


# ---------- Pydantic response schemas ----------

class Quote(BaseModel):
    symbol: str
    name: str
    exchange: str
    price: float
    change: float
    change_pct: float
    volume: int
    high_52w: float
    low_52w: float
    market_cap: Optional[float] = None
    timestamp: datetime
    stale: bool = False


class NewsArticle(BaseModel):
    id: str
    title: str
    summary: str
    url: str
    source: str
    published_at: datetime
    category: str
    tickers: list[str]
    sentiment: float
    sentiment_label: str


class ExplainRequest(BaseModel):
    symbol: str
    timeframe: str = "1D"
    include_news: bool = True


class ExplainResponse(BaseModel):
    symbol: str
    narrative: str
    key_drivers: list[str]
    sources: list[dict]
    confidence: str
    generated_at: datetime


class ImpactRequest(BaseModel):
    headline: str
    summary: str = ""


class SearchHit(BaseModel):
    symbol: str
    name: str
    exchange: str
