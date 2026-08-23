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


class EarningsEventDB(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str = Field(index=True)
    company_name: str
    event_type: str  # "Q-Results" | "Major Announcement"
    event_title: str
    announcement_date: str
    period: str
    segment: str  # "Mainboard" | "SME"
    revenue_cr: float
    revenue_yoy_pct: float
    revenue_qoq_pct: float
    pat_cr: float
    pat_yoy_pct: float
    pat_qoq_pct: float
    ebitda_margin_pct: float
    estimate_verdict: str  # "MEGA BEAT" | "BEAT" | "IN-LINE" | "MISS"
    surprise_pct: float
    key_highlights: str  # JSON array string
    short_term_rating: str  # "VERY HIGH" | "HIGH" | "MODERATE"
    source_url: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


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


# ---------- Added for Advanced Analytics Suite ----------

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class CopilotChatRequest(BaseModel):
    symbol: str
    history: list[ChatMessage] = []
    user_query: str


class CompareExplainRequest(BaseModel):
    target_symbol: str
    compare_symbols: list[str]


class PortfolioHolding(BaseModel):
    symbol: str
    quantity: float
    price: float


class PortfolioRiskRequest(BaseModel):
    holdings: list[PortfolioHolding]
    period: str = "1y"
