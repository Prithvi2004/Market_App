"""News ingestion: RSS feeds + newsdata.io + gnews → dedup → sentiment + ticker extraction → SQLite."""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from time import mktime
from typing import Optional

import feedparser
import httpx

from cache import cache_delete
from config import RSS_FEEDS, settings
from database import get_session
from ingestion.sentiment import score as score_sentiment
from ingestion.ticker_extractor import extract_tickers
from market_hours import now_ist
from models import NewsArticleDB

log = logging.getLogger(__name__)

NATIONAL_KW = (
    "rbi", "government", "budget", "gdp", "inflation", "modi",
    "finance ministry", "sebi", "nse", "bse", "sensex", "nifty",
    "rupee", "repo rate", "monetary policy", "india", "indian",
    "cabinet", "parliament", "lok sabha", "rajya sabha",
)
INTERNATIONAL_KW = (
    "fed", "federal reserve", "ecb", "china", "us market", "nasdaq",
    "dow", "wall street", "europe", "japan", "global", "world",
    "dollar", "crude oil", "opec", "treasury", "imf", "world bank",
)


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
        v = getattr(entry, key, None) or (entry.get(key) if hasattr(entry, "get") else None)
        if v:
            try:
                return datetime.fromtimestamp(mktime(v))
            except Exception:
                pass
    return now_ist().replace(tzinfo=None)


def _save_article(session, aid: str, title: str, summary: str, url: str,
                  source: str, published_at: datetime, category: Optional[str] = None) -> bool:
    """Dedup + NLP + save. Returns True if newly inserted."""
    if session.get(NewsArticleDB, aid):
        return False
    text_for_analysis = f"{title}. {summary[:300]}"
    cat = category or _categorize(f"{title} {summary}")
    tickers = extract_tickers(text_for_analysis)
    sentiment, label = score_sentiment(text_for_analysis)
    row = NewsArticleDB(
        id=aid, title=title, summary=summary[:600],
        url=url, source=source,
        published_at=published_at,
        category=cat,
        tickers=json.dumps(tickers),
        sentiment=sentiment, sentiment_label=label,
        fetched_at=now_ist().replace(tzinfo=None),
    )
    session.add(row)
    return True


def _fetch_rss(session) -> int:
    inserted = 0
    for url in RSS_FEEDS:
        try:
            feed = feedparser.parse(url)
            source = feed.feed.get("title", url)
            for entry in feed.entries[:30]:
                link = entry.get("link", "")
                if not link:
                    continue
                aid = _article_id(link)
                title = entry.get("title", "").strip()
                summary = (entry.get("summary") or entry.get("description") or "").strip()
                pub = _published_dt(entry)
                if _save_article(session, aid, title, summary, link, source, pub):
                    inserted += 1
        except Exception as e:
            log.warning("RSS fetch failed for %s: %s", url, e)
    return inserted


def _fetch_newsdata(session) -> int:
    """Fetch from newsdata.io free tier — 200 req/day."""
    if not settings.newsdata_api_key:
        return 0
    inserted = 0
    try:
        params = {
            "apikey": settings.newsdata_api_key,
            "country": "in",
            "category": "business,technology",
            "language": "en",
        }
        resp = httpx.get(
            "https://newsdata.io/api/1/latest",
            params=params,
            timeout=15.0,
        )
        if resp.status_code != 200:
            log.warning("newsdata.io returned %d", resp.status_code)
            return 0
        data = resp.json()
        for art in data.get("results", []):
            link = art.get("link") or art.get("source_url", "")
            if not link:
                continue
            aid = _article_id(link)
            title = (art.get("title") or "").strip()
            summary = (art.get("description") or art.get("content") or "").strip()
            source = art.get("source_id") or art.get("source_name") or "newsdata"
            pub_str = art.get("pubDate") or ""
            try:
                pub = datetime.fromisoformat(pub_str.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                pub = now_ist().replace(tzinfo=None)
            if _save_article(session, aid, title, summary, link, source, pub):
                inserted += 1
    except Exception as e:
        log.warning("newsdata.io fetch failed: %s", e)
    return inserted


def _fetch_gnews(session) -> int:
    """Fetch from gnews.io free tier — 100 req/day."""
    if not settings.gnews_api_key:
        return 0
    inserted = 0
    try:
        params = {
            "token": settings.gnews_api_key,
            "topic": "business",
            "country": "in",
            "lang": "en",
            "max": 10,
        }
        resp = httpx.get(
            "https://gnews.io/api/v4/top-headlines",
            params=params,
            timeout=15.0,
        )
        if resp.status_code != 200:
            log.warning("gnews returned %d", resp.status_code)
            return 0
        data = resp.json()
        for art in data.get("articles", []):
            link = art.get("url", "")
            if not link:
                continue
            aid = _article_id(link)
            title = (art.get("title") or "").strip()
            summary = (art.get("description") or art.get("content") or "").strip()
            source = art.get("source", {}).get("name") or "gnews"
            pub_str = art.get("publishedAt") or ""
            try:
                pub = datetime.fromisoformat(pub_str.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                pub = now_ist().replace(tzinfo=None)
            if _save_article(session, aid, title, summary, link, source, pub):
                inserted += 1
    except Exception as e:
        log.warning("gnews fetch failed: %s", e)
    return inserted


def fetch_all() -> int:
    inserted = 0
    with get_session() as session:
        inserted += _fetch_rss(session)
        inserted += _fetch_newsdata(session)
        inserted += _fetch_gnews(session)
        session.commit()
    if inserted:
        cache_delete("news:latest")
        log.info("Inserted %d new articles", inserted)
    return inserted
