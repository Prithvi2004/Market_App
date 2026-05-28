"""Application configuration."""
from __future__ import annotations

import os
from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# NSE / BSE Holiday Calendar 2025-2026
# ---------------------------------------------------------------------------
NSE_HOLIDAYS: set[str] = {
    # 2025
    "2025-01-26",  # Republic Day
    "2025-02-19",  # Chhatrapati Shivaji Maharaj Jayanti
    "2025-03-14",  # Holi
    "2025-04-14",  # Dr. Baba Saheb Ambedkar Jayanti
    "2025-04-18",  # Good Friday
    "2025-05-01",  # Maharashtra Day
    "2025-08-15",  # Independence Day
    "2025-08-27",  # Ganesh Chaturthi
    "2025-10-02",  # Gandhi Jayanti
    "2025-10-20",  # Dussehra (tentative)
    "2025-10-21",  # Diwali Laxmi Puja (tentative)
    "2025-10-23",  # Diwali Balipratipada (tentative)
    "2025-11-05",  # Prakash Gurpurb (tentative)
    "2025-11-20",  # Maharashtra General Assembly Election (if declared)
    "2025-12-25",  # Christmas
    # 2026
    "2026-01-26",  # Republic Day
    "2026-03-03",  # Holi (tentative)
    "2026-04-03",  # Good Friday (tentative)
    "2026-04-14",  # Dr. Baba Saheb Ambedkar Jayanti
    "2026-05-01",  # Maharashtra Day
    "2026-08-15",  # Independence Day
    "2026-10-02",  # Gandhi Jayanti
    "2026-12-25",  # Christmas
}

# ---------------------------------------------------------------------------
# Universe
# ---------------------------------------------------------------------------
NIFTY50 = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "KOTAKBANK.NS",
    "LT.NS", "AXISBANK.NS", "ASIANPAINT.NS", "MARUTI.NS", "TITAN.NS",
    "SUNPHARMA.NS", "BAJFINANCE.NS", "WIPRO.NS", "HCLTECH.NS", "ULTRACEMCO.NS",
    "ONGC.NS", "POWERGRID.NS", "NTPC.NS", "JSWSTEEL.NS", "TATASTEEL.NS",
    "TATAMOTORS.NS", "M&M.NS", "ADANIENT.NS", "ADANIPORTS.NS", "COALINDIA.NS",
    "DIVISLAB.NS", "DRREDDY.NS", "EICHERMOT.NS", "GRASIM.NS", "HDFCLIFE.NS",
    "INDUSINDBK.NS", "NESTLEIND.NS", "SBILIFE.NS", "TECHM.NS", "APOLLOHOSP.NS",
    "BAJAJFINSV.NS", "BAJAJ-AUTO.NS", "BPCL.NS", "BRITANNIA.NS", "CIPLA.NS",
    "HEROMOTOCO.NS", "HINDALCO.NS", "TATACONSUM.NS", "UPL.NS", "VEDL.NS",
]

INDICES = ["^NSEI", "^BSESN", "^NSEBANK", "^CNXIT"]

INDEX_NAMES = {
    "^NSEI": "NIFTY 50",
    "^BSESN": "SENSEX",
    "^NSEBANK": "BANK NIFTY",
    "^CNXIT": "NIFTY IT",
}

RSS_FEEDS = [
    "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    "https://www.moneycontrol.com/rss/marketreports.xml",
    "https://feeds.feedburner.com/ndtvprofit-latest",
    "https://www.livemint.com/rss/markets",
]

# Symbol → display name + sector. Keep limited to NIFTY50 for MVP.
SYMBOL_META = {
    "RELIANCE.NS": ("Reliance Industries", "Energy"),
    "TCS.NS": ("Tata Consultancy Services", "IT"),
    "HDFCBANK.NS": ("HDFC Bank", "Banking"),
    "INFY.NS": ("Infosys", "IT"),
    "ICICIBANK.NS": ("ICICI Bank", "Banking"),
    "HINDUNILVR.NS": ("Hindustan Unilever", "FMCG"),
    "ITC.NS": ("ITC", "FMCG"),
    "SBIN.NS": ("State Bank of India", "Banking"),
    "BHARTIARTL.NS": ("Bharti Airtel", "Telecom"),
    "KOTAKBANK.NS": ("Kotak Mahindra Bank", "Banking"),
    "LT.NS": ("Larsen & Toubro", "Infrastructure"),
    "AXISBANK.NS": ("Axis Bank", "Banking"),
    "ASIANPAINT.NS": ("Asian Paints", "Consumer"),
    "MARUTI.NS": ("Maruti Suzuki", "Auto"),
    "TITAN.NS": ("Titan Company", "Consumer"),
    "SUNPHARMA.NS": ("Sun Pharmaceutical", "Pharma"),
    "BAJFINANCE.NS": ("Bajaj Finance", "Financial"),
    "WIPRO.NS": ("Wipro", "IT"),
    "HCLTECH.NS": ("HCL Technologies", "IT"),
    "ULTRACEMCO.NS": ("UltraTech Cement", "Cement"),
    "ONGC.NS": ("Oil and Natural Gas Corp", "Energy"),
    "POWERGRID.NS": ("Power Grid Corp", "Energy"),
    "NTPC.NS": ("NTPC", "Energy"),
    "JSWSTEEL.NS": ("JSW Steel", "Metals"),
    "TATASTEEL.NS": ("Tata Steel", "Metals"),
    "TATAMOTORS.NS": ("Tata Motors", "Auto"),
    "M&M.NS": ("Mahindra & Mahindra", "Auto"),
    "ADANIENT.NS": ("Adani Enterprises", "Conglomerate"),
    "ADANIPORTS.NS": ("Adani Ports", "Infrastructure"),
    "COALINDIA.NS": ("Coal India", "Energy"),
    "DIVISLAB.NS": ("Divi's Laboratories", "Pharma"),
    "DRREDDY.NS": ("Dr. Reddy's Labs", "Pharma"),
    "EICHERMOT.NS": ("Eicher Motors", "Auto"),
    "GRASIM.NS": ("Grasim Industries", "Cement"),
    "HDFCLIFE.NS": ("HDFC Life Insurance", "Insurance"),
    "INDUSINDBK.NS": ("IndusInd Bank", "Banking"),
    "NESTLEIND.NS": ("Nestle India", "FMCG"),
    "SBILIFE.NS": ("SBI Life Insurance", "Insurance"),
    "TECHM.NS": ("Tech Mahindra", "IT"),
    "APOLLOHOSP.NS": ("Apollo Hospitals", "Healthcare"),
    "BAJAJFINSV.NS": ("Bajaj Finserv", "Financial"),
    "BAJAJ-AUTO.NS": ("Bajaj Auto", "Auto"),
    "BPCL.NS": ("Bharat Petroleum", "Energy"),
    "BRITANNIA.NS": ("Britannia Industries", "FMCG"),
    "CIPLA.NS": ("Cipla", "Pharma"),
    "HEROMOTOCO.NS": ("Hero MotoCorp", "Auto"),
    "HINDALCO.NS": ("Hindalco Industries", "Metals"),
    "TATACONSUM.NS": ("Tata Consumer Products", "FMCG"),
    "UPL.NS": ("UPL", "Chemicals"),
    "VEDL.NS": ("Vedanta", "Metals"),
}


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------
@dataclass
class Settings:
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    ollama_url: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "deepseek-v3.1:671b-cloud")
    ollama_fallback: str = os.getenv("OLLAMA_FALLBACK", "qwen3-vl:235b-cloud")
    ollama_fallback_2: str = os.getenv("OLLAMA_FALLBACK_2", "kimi-k2.5:cloud")
    db_url: str = os.getenv("DB_URL", "sqlite:///./market.db")
    newsdata_api_key: str = os.getenv("NEWSDATA_API_KEY", "pub_5fa1a058e96048e4a00a4bb9c81cd276")
    gnews_api_key: str = os.getenv("GNEWS_API_KEY", "ac175ba4ac373ef7986539782047ac90")
    cors_origins: list[str] = field(default_factory=lambda: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ])
    quote_poll_seconds: int = 60
    news_poll_seconds: int = 300
    quote_ttl: int = 86400
    news_ttl: int = 86400


settings = Settings()
