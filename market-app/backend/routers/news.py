"""News routes."""
from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Query
from sqlmodel import select

from cache import cache_get, cache_set
from database import get_session
from models import NewsArticleDB

router = APIRouter()


def _row_to_dict(r: NewsArticleDB) -> dict:
    return {
        "id": r.id,
        "title": r.title,
        "summary": r.summary,
        "url": r.url,
        "source": r.source,
        "published_at": r.published_at.isoformat(),
        "category": r.category,
        "tickers": json.loads(r.tickers or "[]"),
        "sentiment": r.sentiment,
        "sentiment_label": r.sentiment_label,
    }


@router.get("/news")
def get_news(
    ticker: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 20,
):
    cache_key = None
    if ticker and not category:
        cache_key = f"news:ticker:{ticker}"
        cached = cache_get(cache_key)
        if cached:
            return cached[:limit]
    with get_session() as session:
        stmt = select(NewsArticleDB).order_by(NewsArticleDB.published_at.desc())
        rows = session.exec(stmt).all()
    out = []
    for r in rows:
        if category and r.category != category:
            continue
        if ticker:
            try:
                if ticker not in json.loads(r.tickers or "[]"):
                    continue
            except Exception:
                continue
        out.append(_row_to_dict(r))
        if len(out) >= max(limit, 50):
            break
    if cache_key:
        cache_set(cache_key, out, ttl=300)
    return out[:limit]


@router.get("/news/latest")
def get_latest(limit: int = 30):
    cached = cache_get("news:latest")
    if cached:
        return cached[:limit]
    with get_session() as session:
        rows = session.exec(
            select(NewsArticleDB).order_by(NewsArticleDB.published_at.desc()).limit(max(limit, 50))
        ).all()
    out = [_row_to_dict(r) for r in rows]
    cache_set("news:latest", out, ttl=300)
    return out[:limit]


@router.get("/sentiment")
def sentiment_summary():
    """Aggregate counts for the last 100 articles."""
    with get_session() as session:
        rows = session.exec(
            select(NewsArticleDB).order_by(NewsArticleDB.published_at.desc()).limit(100)
        ).all()
    out = {"positive": 0, "neutral": 0, "negative": 0, "total": len(rows)}
    for r in rows:
        out[r.sentiment_label] = out.get(r.sentiment_label, 0) + 1
    return out
