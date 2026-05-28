"""spaCy NER + alias lookup → NSE tickers."""
from __future__ import annotations

import logging
import re
from typing import Optional

from config import NIFTY50, SYMBOL_META

log = logging.getLogger(__name__)

_nlp = None


def _get_nlp():
    global _nlp
    if _nlp is None:
        try:
            import spacy
            _nlp = spacy.load("en_core_web_sm")
        except Exception as e:
            log.warning("spaCy model not available (%s) — falling back to regex matcher", e)
            _nlp = False
    return _nlp


# Build alias → symbol lookup (lowercased)
_ALIASES: dict[str, str] = {}
_EXTRA_ALIASES = {
    "RELIANCE.NS": ["reliance", "ril", "reliance industries"],
    "TCS.NS": ["tcs", "tata consultancy", "tata consultancy services"],
    "HDFCBANK.NS": ["hdfc bank", "hdfc"],
    "INFY.NS": ["infosys", "infy"],
    "ICICIBANK.NS": ["icici bank", "icici"],
    "HINDUNILVR.NS": ["hindustan unilever", "hul", "unilever"],
    "ITC.NS": ["itc"],
    "SBIN.NS": ["state bank of india", "sbi"],
    "BHARTIARTL.NS": ["bharti airtel", "airtel"],
    "KOTAKBANK.NS": ["kotak mahindra bank", "kotak bank", "kotak"],
    "LT.NS": ["larsen & toubro", "larsen and toubro", "l&t"],
    "AXISBANK.NS": ["axis bank", "axis"],
    "ASIANPAINT.NS": ["asian paints"],
    "MARUTI.NS": ["maruti suzuki", "maruti"],
    "TITAN.NS": ["titan", "titan company"],
    "SUNPHARMA.NS": ["sun pharma", "sun pharmaceutical"],
    "BAJFINANCE.NS": ["bajaj finance"],
    "WIPRO.NS": ["wipro"],
    "HCLTECH.NS": ["hcl tech", "hcl technologies"],
    "ULTRACEMCO.NS": ["ultratech cement", "ultratech"],
    "ONGC.NS": ["ongc", "oil and natural gas"],
    "POWERGRID.NS": ["power grid"],
    "NTPC.NS": ["ntpc"],
    "JSWSTEEL.NS": ["jsw steel", "jsw"],
    "TATASTEEL.NS": ["tata steel"],
    "TATAMOTORS.NS": ["tata motors"],
    "M&M.NS": ["mahindra & mahindra", "mahindra and mahindra", "m&m"],
    "ADANIENT.NS": ["adani enterprises", "adani ent"],
    "ADANIPORTS.NS": ["adani ports"],
    "COALINDIA.NS": ["coal india"],
    "DIVISLAB.NS": ["divis laboratories", "divi's labs", "divis labs"],
    "DRREDDY.NS": ["dr reddy", "dr. reddy", "dr reddys", "dr. reddy's"],
    "EICHERMOT.NS": ["eicher motors", "eicher"],
    "GRASIM.NS": ["grasim"],
    "HDFCLIFE.NS": ["hdfc life"],
    "INDUSINDBK.NS": ["indusind bank", "indusind"],
    "NESTLEIND.NS": ["nestle india", "nestle"],
    "SBILIFE.NS": ["sbi life"],
    "TECHM.NS": ["tech mahindra"],
    "APOLLOHOSP.NS": ["apollo hospitals", "apollo"],
    "BAJAJFINSV.NS": ["bajaj finserv"],
    "BAJAJ-AUTO.NS": ["bajaj auto"],
    "BPCL.NS": ["bpcl", "bharat petroleum"],
    "BRITANNIA.NS": ["britannia"],
    "CIPLA.NS": ["cipla"],
    "HEROMOTOCO.NS": ["hero motocorp", "hero moto"],
    "HINDALCO.NS": ["hindalco"],
    "TATACONSUM.NS": ["tata consumer", "tata consumer products"],
    "UPL.NS": ["upl"],
    "VEDL.NS": ["vedanta"],
}
for sym in NIFTY50:
    name, _sector = SYMBOL_META.get(sym, (sym, ""))
    _ALIASES[name.lower()] = sym
    for alias in _EXTRA_ALIASES.get(sym, []):
        _ALIASES[alias.lower()] = sym


def extract_tickers(text: str) -> list[str]:
    if not text:
        return []
    text_l = text.lower()
    hits: set[str] = set()

    # Regex/alias pass — fast, deterministic
    for alias, sym in _ALIASES.items():
        if re.search(rf"\b{re.escape(alias)}\b", text_l):
            hits.add(sym)

    # spaCy NER pass for ORG entities
    nlp = _get_nlp()
    if nlp:
        try:
            doc = nlp(text)
            for ent in doc.ents:
                if ent.label_ == "ORG":
                    sym = _ALIASES.get(ent.text.lower())
                    if sym:
                        hits.add(sym)
        except Exception:
            pass
    return sorted(hits)


def lookup_symbol(query: str) -> Optional[str]:
    return _ALIASES.get(query.lower())


def search_symbols(query: str, limit: int = 10) -> list[dict]:
    if not query:
        return []
    q = query.lower()
    out: list[dict] = []
    seen: set[str] = set()
    
    # 1. Local NIFTY50 aliases match (first priority, fast)
    for alias, sym in _ALIASES.items():
        if q in alias and sym not in seen:
            seen.add(sym)
            name, _ = SYMBOL_META.get(sym, (sym, ""))
            out.append({"symbol": sym, "name": name, "exchange": "NSE"})
            if len(out) >= limit:
                break
                
    # 2. Query Yahoo Finance search API for vast search (e.g. MAZDOCK)
    if len(out) < limit:
        import urllib.request
        import urllib.parse
        import json
        try:
            url = f"https://query2.finance.yahoo.com/v1/finance/search?q={urllib.parse.quote(query)}"
            req = urllib.request.Request(
                url, 
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                quotes = data.get("quotes", [])
                for item in quotes:
                    sym = item.get("symbol")
                    if not sym:
                        continue
                    
                    # Only include relevant types (EQUITY/INDEX) and skip duplicate matches
                    q_type = item.get("quoteType")
                    if q_type in ("EQUITY", "INDEX") and sym not in seen:
                        seen.add(sym)
                        name = item.get("longname") or item.get("shortname") or sym
                        
                        # Normalize exchange display name
                        exch = item.get("exchDisp") or "NSE"
                        if exch.upper() in ("BSE", "BOMBAY"):
                            exch = "BSE"
                        elif exch.upper() in ("NSE", "NSI"):
                            exch = "NSE"
                            
                        out.append({"symbol": sym, "name": name, "exchange": exch})
                        if len(out) >= limit:
                            break
        except Exception as e:
            log.warning("Yahoo Finance search failed: %s", e)
            
    return out
