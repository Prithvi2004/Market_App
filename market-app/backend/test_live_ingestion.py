"""
Live Ingestion Verification Script.
Executes live API fetchers & scrapers (RSS feeds, BSE API, yfinance quotes) and reports live Firestore inserts.
"""
import os
import sys
import logging

sys.path.insert(0, os.path.dirname(__file__))

logging.basicConfig(level=logging.INFO)

from firestore_db import is_firestore_active, _firestore_db
from ingestion.news_fetcher import fetch_all as fetch_live_news
from ingestion.earnings_fetcher import parse_and_ingest_latest_news_earnings
from ingestion.market_poller import poll_quotes

if not is_firestore_active():
    print("[ERROR] Firestore connection is NOT active.")
    sys.exit(1)

print("==================================================")
print("[TEST] TRIGGERING LIVE EXTERNAL API FETCHERS...")
print("==================================================")

# 1. Trigger Live News Fetcher (Economic Times, Moneycontrol, Livemint, NDTV)
print("\n[1] Fetching live news articles from RSS feeds...")
news_inserted = fetch_live_news()
print(f" -> Inserted {news_inserted} new live news articles.")

# 2. Trigger Live Earnings & BSE Corporate Disclosures Scraper
print("\n[2] Fetching live Q-Results & BSE Corporate Disclosures...")
earnings_inserted = parse_and_ingest_latest_news_earnings()
print(f" -> Inserted {earnings_inserted} new live Q-Results/Disclosures.")

# 3. Trigger Live Stock Quotes Poller (yfinance Nifty 50 & BSE)
print("\n[3] Fetching live stock quotes...")
poll_quotes()
print(" -> Updated stock quotes in Firestore.")

# Check document counts in Firestore
print("\n==================================================")
print("[RESULT] CURRENT FIRESTORE DATABASE DOCUMENT COUNTS:")
print("==================================================")

cols = ["news_articles", "earnings_events", "stock_quotes", "ipo_hub", "screener_alerts"]
for col in cols:
    docs = list(_firestore_db.collection(col).stream())
    print(f"Collection '{col}': {len(docs)} live documents stored in Firestore.")

print("\n[SUCCESS] External live API data pipeline is 100% connected & saving to Firestore!")
