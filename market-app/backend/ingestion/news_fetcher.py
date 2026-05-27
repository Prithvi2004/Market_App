"""RSS news ingestion → dedup → sentiment + ticker extraction → SQLite."""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime
from time import mktime

import feedparser

from cache import cache_delete
from config import RSS_FEEDS
from database import get_session
from ingestion.sentiment import score as score_sentiment
from ingestion.ticker_extractor import extract_tickers
from market_hours import now_ist
from models import NewsArticleDB

log = logging.getLogger(__name__)

NATIONAL_KW = ("rbi", "government", "budget", "gdp", "inflation", "modi", "finance ministry", "sebi")
INTERNATIONAL_KW = ("fed", "ecb", "china", "us market", "nasdaq", "dow", "wall street", "europe", "japan")


def _categorize(text: str) -> str:
    t = (text or "").lower()
    if any(k in t for k in NATIONAL_KW):
        return "national"
    if any(k in t for k in INTERNATIONAL_KW):
        return "international"
    return "sector"


def _article_id(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]


def _published_dt(entry) -> datetime:
    for key in ("published_parsed", "updated_parsed"):
        v = getattr(entry, key, None) or entry.get(key) if hasattr(entry, "get") else None
        if v:
            try:
                return datetime.fromtimestamp(mktime(v))
            except Exception:
                pass
    return now_ist().replace(tzinfo=None)


def fetch_all() -> int:
    inserted = 0
    with get_session() as session:
        for url in RSS_FEEDS:
            try:
                feed = feedparser.parse(url)
                source = feed.feed.get("title", url)
                for entry in feed.entries[:30]:
                    link = entry.get("link", "")
                    if not link:
                        continue
                    aid = _article_id(link)
                    existing = session.get(NewsArticleDB, aid)
                    if existing:
                        continue
                    title = entry.get("title", "").strip()
                    summary = (entry.get("summary") or entry.get("description") or "").strip()
                    text_for_analysis = f"{title}. {summary[:200]}"
                    category = _categorize(f"{title} {summary}")
                    tickers = extract_tickers(f"{title}. {summary}")
                    sentiment, label = score_sentiment(text_for_analysis)
                    row = NewsArticleDB(
                        id=aid, title=title, summary=summary[:600],
                        url=link, source=source,
                        published_at=_published_dt(entry),
                        category=category,
                        tickers=json.dumps(tickers),
                        sentiment=sentiment, sentiment_label=label,
                        fetched_at=now_ist().replace(tzinfo=None),
                    )
                    session.add(row)
                    inserted += 1
            except Exception as e:
                log.warning("RSS fetch failed for %s: %s", url, e)
        session.commit()

    if inserted:
        cache_delete("news:latest")
        log.info("Inserted %d new articles", inserted)
    return inserted
