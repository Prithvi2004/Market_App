"""
Utility script to check live document counts in Google Cloud Firestore collections.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from firestore_db import is_firestore_active, _firestore_db

if not is_firestore_active():
    print("[ERROR] Firestore is NOT active or serviceAccountKey.json is missing.")
    sys.exit(1)

print("[OK] Connected to Google Cloud Firestore successfully!")
print("Checking collections data...\n")

collections = ["news_articles", "earnings_events", "ipo_hub", "screener_alerts", "stock_quotes", "conglomerate_ripples"]

for col_name in collections:
    try:
        docs = list(_firestore_db.collection(col_name).stream())
        print(f"Collection '{col_name}': {len(docs)} documents saved.")
        if docs:
            sample = docs[0].to_dict()
            title_or_sym = sample.get("title") or sample.get("event_title") or sample.get("name") or sample.get("symbol") or "Doc"
            print(f"   -> Sample document: {str(title_or_sym)[:60]}")
    except Exception as e:
        print(f"[WARNING] Collection '{col_name}': error ({e})")
