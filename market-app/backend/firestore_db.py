"""
Google Cloud Firestore Comprehensive Database Layer for MarketPulse App.
Redirects and persists ALL core data models (News, Q-Results, IPO Hub, Screener Alerts, Conglomerate Ripples) into Firestore.
"""
from __future__ import annotations

import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from config import settings

log = logging.getLogger(__name__)

_firestore_db = None
_using_firestore = False


def _init_firestore_client():
    global _firestore_db, _using_firestore

    # Check 1: Environment variable FIREBASE_CREDENTIALS_JSON (ideal for Render deployment)
    cred_json_str = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if cred_json_str:
        try:
            cred_dict = json.loads(cred_json_str)
            import firebase_admin
            from firebase_admin import credentials, firestore as fa_firestore
            if not firebase_admin._apps:
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
            _firestore_db = fa_firestore.client()
            _using_firestore = True
            log.info("🔥 Firebase Admin SDK initialized successfully via FIREBASE_CREDENTIALS_JSON env var.")
            return
        except Exception as e:
            log.info("FIREBASE_CREDENTIALS_JSON init notice: %s", e)

    # Check 2: Local serviceAccountKey.json file
    cred_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "serviceAccountKey.json"))
    if not os.path.exists(cred_path):
        cred_path = settings.firebase_credentials_path

    if os.path.exists(cred_path):
        # Attempt 1: firebase_admin
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore as fa_firestore
            if not firebase_admin._apps:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            _firestore_db = fa_firestore.client()
            _using_firestore = True
            log.info("🔥 Firebase Admin SDK initialized successfully using %s", cred_path)
            return
        except Exception as e:
            log.info("firebase_admin init notice: %s. Trying google-cloud-firestore...", e)

        # Attempt 2: google-cloud-firestore
        try:
            from google.cloud import firestore
            from google.oauth2 import service_account
            creds = service_account.Credentials.from_service_account_file(cred_path)
            _firestore_db = firestore.Client(credentials=creds, project=creds.project_id)
            _using_firestore = True
            log.info("🔥 Google Cloud Firestore initialized successfully using %s (Project: %s)", cred_path, creds.project_id)
            return
        except Exception as e:
            log.info("google-cloud-firestore init notice: %s", e)

    log.info("Google Firestore credentials file '%s' not found. Operating with fallback DB layer.", cred_path)


_init_firestore_client()


def is_firestore_active() -> bool:
    return _using_firestore and _firestore_db is not None


# ---------------------------------------------------------------------------
# 1. NEWS ARTICLES FIRESTORE OPERATIONS ('news_articles')
# ---------------------------------------------------------------------------

def save_news_article_firestore(
    aid: str,
    title: str,
    summary: str,
    url: str,
    source: str,
    published_at: datetime,
    category: str,
    tickers: List[str],
    sentiment: float,
    sentiment_label: str
) -> bool:
    """Save news article to Firestore collection 'news_articles'."""
    if not is_firestore_active():
        return False

    try:
        doc_ref = _firestore_db.collection("news_articles").document(aid)
        doc_ref.set({
            "id": aid,
            "title": title,
            "summary": summary[:600],
            "url": url,
            "source": source,
            "published_at": published_at,
            "category": category,
            "tickers": tickers,
            "sentiment": sentiment,
            "sentiment_label": sentiment_label,
            "fetched_at": datetime.utcnow()
        }, merge=True)
        return True
    except Exception as e:
        log.warning("Firestore save_news_article_firestore error: %s", e)
        return False


def get_latest_news_firestore(limit: int = 30) -> List[Dict[str, Any]]:
    """Query latest news articles from Firestore collection 'news_articles'."""
    if not is_firestore_active():
        return []

    try:
        try:
            from google.cloud.firestore import Query
            direction = Query.DESCENDING
        except ImportError:
            from firebase_admin.firestore import Query
            direction = Query.DESCENDING

        query = (
            _firestore_db.collection("news_articles")
            .order_by("published_at", direction=direction)
            .limit(limit)
        )
        docs = query.stream()
        results = []
        for doc in docs:
            d = doc.to_dict()
            pub = d.get("published_at")
            if isinstance(pub, datetime):
                d["published_at"] = pub.isoformat()
            results.append(d)
        return results
    except Exception as e:
        log.warning("Firestore get_latest_news_firestore error: %s", e)
        return []


def get_news_by_ticker_firestore(ticker: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Query news articles by ticker array in Firestore."""
    if not is_firestore_active():
        return []

    try:
        try:
            from google.cloud.firestore import Query
            direction = Query.DESCENDING
        except ImportError:
            from firebase_admin.firestore import Query
            direction = Query.DESCENDING

        query = (
            _firestore_db.collection("news_articles")
            .where("tickers", "array_contains", ticker)
            .order_by("published_at", direction=direction)
            .limit(limit)
        )
        docs = query.stream()
        results = []
        for doc in docs:
            d = doc.to_dict()
            pub = d.get("published_at")
            if isinstance(pub, datetime):
                d["published_at"] = pub.isoformat()
            results.append(d)
        return results
    except Exception as e:
        log.warning("Firestore get_news_by_ticker_firestore error: %s", e)
        return []


# ---------------------------------------------------------------------------
# 2. Q-RESULTS & EARNINGS FIRESTORE OPERATIONS ('earnings_events')
# ---------------------------------------------------------------------------

def save_earnings_event_firestore(event: Dict[str, Any]) -> bool:
    """Save earnings event disclosure to Firestore collection 'earnings_events'."""
    if not is_firestore_active():
        return False

    try:
        sym = event.get("symbol", "UNKNOWN").replace(".", "_")
        doc_id = f"{sym}_{event.get('announcement_date', 'date')}_{hash(event.get('event_title', '')) & 0xffff}"
        doc_ref = _firestore_db.collection("earnings_events").document(doc_id)
        doc_ref.set(event, merge=True)
        return True
    except Exception as e:
        log.warning("Firestore save_earnings_event_firestore error: %s", e)
        return False


def get_live_earnings_firestore(
    category_filter: Optional[str] = None,
    verdict_filter: Optional[str] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """Query live earnings events from Firestore collection 'earnings_events'."""
    if not is_firestore_active():
        return []

    try:
        try:
            from google.cloud.firestore import Query
            direction = Query.DESCENDING
        except ImportError:
            from firebase_admin.firestore import Query
            direction = Query.DESCENDING

        query = _firestore_db.collection("earnings_events").order_by("announcement_date", direction=direction).limit(limit)
        docs = query.stream()
        results = []
        for doc in docs:
            d = doc.to_dict()

            if category_filter and category_filter.upper() != "ALL":
                c_upper = category_filter.upper()
                if c_upper == "Q-RESULTS" and d.get("event_type") != "Q-Results":
                    continue
                elif c_upper in ("DIVIDENDS", "CORPORATE ACTION", "MAJOR ANNOUNCEMENT") and d.get("event_type") != "Major Announcement":
                    continue

            if verdict_filter and verdict_filter.upper() != "ALL":
                if d.get("estimate_verdict", "").upper() != verdict_filter.upper():
                    continue

            results.append(d)
        return results
    except Exception as e:
        log.warning("Firestore get_live_earnings_firestore error: %s", e)
        return []


# ---------------------------------------------------------------------------
# 3. IPO HUB FIRESTORE OPERATIONS ('ipo_hub')
# ---------------------------------------------------------------------------

def save_ipo_event_firestore(ipo_dict: Dict[str, Any]) -> bool:
    """Save IPO event to Firestore collection 'ipo_hub'."""
    if not is_firestore_active():
        return False

    try:
        sym = ipo_dict.get("symbol", "UNKNOWN").replace(".", "_")
        doc_ref = _firestore_db.collection("ipo_hub").document(sym)
        doc_ref.set(ipo_dict, merge=True)
        return True
    except Exception as e:
        log.warning("Firestore save_ipo_event_firestore error: %s", e)
        return False


def get_live_ipos_firestore(status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """Query live IPOs from Firestore collection 'ipo_hub'."""
    if not is_firestore_active():
        return []

    try:
        docs = _firestore_db.collection("ipo_hub").stream()
        results = []
        for doc in docs:
            d = doc.to_dict()
            if status_filter and status_filter.upper() != "ALL":
                if d.get("status", "").upper() != status_filter.upper():
                    continue
            results.append(d)
        return results
    except Exception as e:
        log.warning("Firestore get_live_ipos_firestore error: %s", e)
        return []


# ---------------------------------------------------------------------------
# 4. SCREENER ALERTS & SIGNALS FIRESTORE OPERATIONS ('screener_alerts')
# ---------------------------------------------------------------------------

def save_screener_alert_firestore(alert_dict: Dict[str, Any]) -> bool:
    """Save technical breakout alert to Firestore collection 'screener_alerts'."""
    if not is_firestore_active():
        return False

    try:
        sym = alert_dict.get("symbol", "UNKNOWN").replace(".", "_")
        doc_ref = _firestore_db.collection("screener_alerts").document(sym)
        doc_ref.set(alert_dict, merge=True)
        return True
    except Exception as e:
        log.warning("Firestore save_screener_alert_firestore error: %s", e)
        return False


def get_screener_alerts_firestore() -> List[Dict[str, Any]]:
    """Query screener alerts from Firestore collection 'screener_alerts'."""
    if not is_firestore_active():
        return []

    try:
        docs = _firestore_db.collection("screener_alerts").stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        log.warning("Firestore get_screener_alerts_firestore error: %s", e)
        return []


# ---------------------------------------------------------------------------
# 5. STOCK QUOTES & HISTORICAL DATA FIRESTORE OPERATIONS ('stock_quotes')
# ---------------------------------------------------------------------------

def save_stock_quote_firestore(quote_dict: Dict[str, Any]) -> bool:
    """Save stock quote to Firestore collection 'stock_quotes'."""
    if not is_firestore_active():
        return False

    try:
        sym = quote_dict.get("symbol", "UNKNOWN").replace(".", "_")
        doc_ref = _firestore_db.collection("stock_quotes").document(sym)
        doc_ref.set(quote_dict, merge=True)
        return True
    except Exception as e:
        log.warning("Firestore save_stock_quote_firestore error: %s", e)
        return False


# ---------------------------------------------------------------------------
# 6. CONGLOMERATE RIPPLE ANALYSIS FIRESTORE OPERATIONS ('conglomerate_ripples')
# ---------------------------------------------------------------------------

def save_ripple_analysis_firestore(symbol: str, analysis_dict: Dict[str, Any]) -> bool:
    """Save conglomerate ripple analysis to Firestore collection 'conglomerate_ripples'."""
    if not is_firestore_active():
        return False

    try:
        sym = symbol.replace(".", "_")
        doc_ref = _firestore_db.collection("conglomerate_ripples").document(sym)
        doc_ref.set(analysis_dict, merge=True)
        return True
    except Exception as e:
        log.warning("Firestore save_ripple_analysis_firestore error: %s", e)
        return False
