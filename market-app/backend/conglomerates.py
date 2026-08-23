"""
Conglomerate mapping and sister-company lookup database for Indian Equities.
"""

from __future__ import annotations

CONGLOMERATES: dict[str, dict] = {
    "TATA": {
        "name": "Tata Group",
        "description": "India's largest conglomerate across steel, auto, tech, power, and consumer goods.",
        "members": [
            {"symbol": "TATAMOTORS.NS", "name": "Tata Motors", "sector": "Automobile"},
            {"symbol": "TATASTEEL.NS", "name": "Tata Steel", "sector": "Metals"},
            {"symbol": "TATAPOWER.NS", "name": "Tata Power", "sector": "Utilities / Energy"},
            {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "sector": "IT Services"},
            {"symbol": "TATACONSUM.NS", "name": "Tata Consumer Products", "sector": "FMCG"},
            {"symbol": "TITAN.NS", "name": "Titan Company", "sector": "Consumer Goods"},
            {"symbol": "VOLTAS.NS", "name": "Voltas", "sector": "Consumer Durables"},
            {"symbol": "TRENT.NS", "name": "Trent", "sector": "Retail"},
            {"symbol": "TATAELXSI.NS", "name": "Tata Elxsi", "sector": "IT / Engineering"},
        ]
    },
    "RELIANCE": {
        "name": "Reliance Industries Group",
        "description": "Energy, telecom, retail, and digital services giant.",
        "members": [
            {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "sector": "Oil & Telecom"},
            {"symbol": "JIOFIN.NS", "name": "Jio Financial Services", "sector": "Financial Services"},
        ]
    },
    "ADANI": {
        "name": "Adani Group",
        "description": "Infrastructure, ports, green energy, power, and commodities.",
        "members": [
            {"symbol": "ADANIENT.NS", "name": "Adani Enterprises", "sector": "Diversified Infra"},
            {"symbol": "ADANIPORTS.NS", "name": "Adani Ports & SEZ", "sector": "Ports / Logistics"},
            {"symbol": "ADANIGREEN.NS", "name": "Adani Green Energy", "sector": "Renewables"},
            {"symbol": "ADANIPOWER.NS", "name": "Adani Power", "sector": "Power Generation"},
            {"symbol": "ADANIENSOL.NS", "name": "Adani Energy Solutions", "sector": "Power Transmission"},
            {"symbol": "ATGL.NS", "name": "Adani Total Gas", "sector": "Gas Distribution"},
            {"symbol": "AWL.NS", "name": "Adani Wilmar", "sector": "FMCG"},
        ]
    },
    "HDFC": {
        "name": "HDFC Group",
        "description": "Premier financial services conglomerate.",
        "members": [
            {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "sector": "Banking"},
            {"symbol": "HDFCLIFE.NS", "name": "HDFC Life Insurance", "sector": "Insurance"},
            {"symbol": "HDFCAMC.NS", "name": "HDFC Asset Management", "sector": "Asset Management"},
        ]
    },
    "MAHINDRA": {
        "name": "Mahindra Group",
        "description": "Automotive, farm equipment, IT, and financial services.",
        "members": [
            {"symbol": "M&M.NS", "name": "Mahindra & Mahindra", "sector": "Automobile"},
            {"symbol": "TECHM.NS", "name": "Tech Mahindra", "sector": "IT Services"},
            {"symbol": "MMFIN.NS", "name": "Mahindra Finance", "sector": "NBFC"},
            {"symbol": "MAHLOG.NS", "name": "Mahindra Logistics", "sector": "Logistics"},
        ]
    },
    "BAJAJ": {
        "name": "Bajaj Group",
        "description": "Financial services, 2/3 wheelers, and electricals.",
        "members": [
            {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance", "sector": "NBFC"},
            {"symbol": "BAJAJFINSV.NS", "name": "Bajaj Finserv", "sector": "Financial Services"},
            {"symbol": "BAJAJ-AUTO.NS", "name": "Bajaj Auto", "sector": "Automobile"},
            {"symbol": "BAJAJELEC.NS", "name": "Bajaj Electricals", "sector": "Consumer Durables"},
        ]
    },
    "BIRLA": {
        "name": "Aditya Birla Group",
        "description": "Cement, metals, telecom, and financial services.",
        "members": [
            {"symbol": "ULTRACEMCO.NS", "name": "UltraTech Cement", "sector": "Cement"},
            {"symbol": "GRASIM.NS", "name": "Grasim Industries", "sector": "Textiles / Chemicals"},
            {"symbol": "HINDALCO.NS", "name": "Hindalco Industries", "sector": "Metals"},
            {"symbol": "IDEA.NS", "name": "Vodafone Idea", "sector": "Telecom"},
            {"symbol": "ABFRL.NS", "name": "Aditya Birla Fashion", "sector": "Retail"},
        ]
    },
    "GODREJ": {
        "name": "Godrej Group",
        "description": "Consumer goods, real estate, chemicals, and agribiz.",
        "members": [
            {"symbol": "GODREJCP.NS", "name": "Godrej Consumer Products", "sector": "FMCG"},
            {"symbol": "GODREJPROP.NS", "name": "Godrej Properties", "sector": "Real Estate"},
            {"symbol": "GODREJIND.NS", "name": "Godrej Industries", "sector": "Chemicals"},
        ]
    }
}

def get_conglomerate_for_ticker(ticker: str) -> dict | None:
    """Return conglomerate info and list of sister companies for a given ticker."""
    clean_sym = ticker.upper().strip()
    if not clean_sym.endswith(".NS") and not clean_sym.endswith(".BO"):
        clean_sym = f"{clean_sym}.NS"

    for group_key, group_data in CONGLOMERATES.items():
        for member in group_data["members"]:
            if member["symbol"] == clean_sym or member["symbol"].replace(".NS", "") == clean_sym.replace(".NS", ""):
                sisters = [m for m in group_data["members"] if m["symbol"] != member["symbol"]]
                return {
                    "group_id": group_key,
                    "group_name": group_data["name"],
                    "description": group_data["description"],
                    "target_company": member,
                    "sister_companies": sisters
                }
    return None
