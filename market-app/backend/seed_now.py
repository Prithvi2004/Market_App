"""
Immediate Seeder for Google Cloud Firestore.
Populates all collections into Firestore immediately.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from firestore_db import (
    is_firestore_active,
    save_ipo_event_firestore,
    save_earnings_event_firestore,
    save_news_article_firestore,
    save_screener_alert_firestore,
    save_stock_quote_firestore,
    _firestore_db
)
from routers.ipo import VERIFIED_INDIAN_IPOS
from ingestion.earnings_fetcher import SEED_EARNINGS_ANNOUNCEMENTS
from datetime import datetime

if not is_firestore_active():
    print("[ERROR] Firestore is NOT active.")
    sys.exit(1)

print("[INFO] Starting immediate seeding to Google Cloud Firestore...")

# 1. Seed IPO Hub
for ipo in VERIFIED_INDIAN_IPOS:
    save_ipo_event_firestore(ipo)
print(f"[OK] Seeded {len(VERIFIED_INDIAN_IPOS)} IPOs into 'ipo_hub' collection.")

# 2. Seed Earnings Events
for event in SEED_EARNINGS_ANNOUNCEMENTS:
    save_earnings_event_firestore(event)
print(f"[OK] Seeded {len(SEED_EARNINGS_ANNOUNCEMENTS)} Q-Results & Disclosures into 'earnings_events' collection.")

# 3. Seed Sample News Articles
sample_news = [
    {
        "aid": "news_tata_001",
        "title": "Tata Motors Group Announces Electric Vehicle Battery Plant Expansion in Gujarat",
        "summary": "Tata Motors subsidiary Agratas to invest ₹13,000 Cr in 20 GWh battery gigafactory.",
        "url": "https://www.economictimes.com",
        "source": "Economic Times",
        "published_at": datetime.now(),
        "category": "sector",
        "tickers": ["TATAMOTORS.NS", "TATASTEEL.NS"],
        "sentiment": 0.85,
        "sentiment_label": "positive"
    },
    {
        "aid": "news_rel_002",
        "title": "Reliance Retail Surges Ahead with 18,900 Active Stores Across India",
        "summary": "Footfalls up 19% YoY driven by FMCG brand expansion and digital store integration.",
        "url": "https://www.moneycontrol.com",
        "source": "Moneycontrol",
        "published_at": datetime.now(),
        "category": "sector",
        "tickers": ["RELIANCE.NS"],
        "sentiment": 0.78,
        "sentiment_label": "positive"
    }
]

for n in sample_news:
    save_news_article_firestore(**n)
print(f"[OK] Seeded {len(sample_news)} News Articles into 'news_articles' collection.")

# 4. Seed Stock Quote
sample_quote = {
    "symbol": "TATASTEEL.NS",
    "name": "Tata Steel Ltd",
    "price": 154.5,
    "change": 3.8,
    "change_pct": 2.52,
    "volume": 24800000,
    "high_52w": 184.6,
    "low_52w": 114.2,
    "timestamp": datetime.now().isoformat(),
    "stale": False
}
save_stock_quote_firestore(sample_quote)
print("[OK] Seeded sample stock quotes into 'stock_quotes' collection.")

# 5. Seed Screener Alert
sample_alert = {
    "symbol": "DIXON.NS",
    "name": "Dixon Technologies Ltd",
    "sector": "Electronics Manufacturing",
    "price": 12450.0,
    "change_pct": 4.85,
    "rsi": 68.4,
    "signals": [
        {"type": "Breakout", "name": "52-Week High Breakout", "direction": "bullish", "desc": "Broke out above previous 52-week high with 3.2x average volume."}
    ]
}
save_screener_alert_firestore(sample_alert)
print("[OK] Seeded technical alerts into 'screener_alerts' collection.")

print("\n🎉 Seeding Complete! Refresh your Firebase Console to see all live collections.")
