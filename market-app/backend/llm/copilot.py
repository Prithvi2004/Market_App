"""LLM Stock Co-pilot streaming assistant."""
from __future__ import annotations

import json
import logging
from typing import AsyncIterator, Optional
import httpx
from config import settings

log = logging.getLogger(__name__)

COPILOT_SYSTEM = """You are an elite Indian stock market research analyst and portfolio advisor.
You are helping the user analyze the stock: {symbol}.
Provide deep, data-driven analysis using the provided Quote, Fundamental data, and Recent News.
Synthesize technical levels, financial health (P/E, margins, debt, ROE), and news sentiment.
Be objective, citing specific news sources and financial numbers.
Never give definitive financial advice or tell the user to buy or sell, but explain the structural trends.
Format your responses using clean Markdown. Keep responses clear and structured, under 4-5 paragraphs unless asked for a detailed report."""


def build_copilot_prompt(symbol: str, quote: dict, fundamentals: Optional[dict], news: list[dict], user_query: str) -> str:
    """Build a detailed context prompt containing current quotes, fundamentals, and related news."""
    # Format quote
    q_lines = f"""Price: ₹{quote.get('price', 0):.2f}
Change today: {quote.get('change_pct', 0):+.2f}%
52W High/Low: ₹{quote.get('high_52w', 0):.2f} / ₹{quote.get('low_52w', 0):.2f}
Volume: {quote.get('volume', 0):,}
Exchange: {quote.get('exchange', 'NSE')}"""

    # Format fundamentals
    f_lines = "No fundamental metrics loaded."
    if fundamentals:
        f_lines = f"""Market Cap: {fundamentals.get('market_cap', '—')}
P/E Ratio (trailing): {fundamentals.get('pe_ratio', '—')}
Forward P/E: {fundamentals.get('forward_pe', '—')}
P/B Ratio: {fundamentals.get('pb_ratio', '—')}
EPS (TTM): {fundamentals.get('eps', '—')}
ROE: {fundamentals.get('roe', '—')}%
Profit Margin: {fundamentals.get('profit_margin', '—')}%
Debt to Equity: {fundamentals.get('debt_to_equity', '—')}
Current Ratio: {fundamentals.get('current_ratio', '—')}
Beta vs Market: {fundamentals.get('beta', '—')}
Analyst Rec Key: {fundamentals.get('analyst_recommendation', '—')}
Target Price (Mean): {fundamentals.get('target_price', '—')}"""

    # Format news
    news_lines = "\n".join(
        f"- [{a['source']}] {a['title']} (sentiment: {a['sentiment_label']}, {a['published_at']})"
        for a in news[:5]
    ) or "- (no recent related news found)"

    return f"""=== STOCK CONTEXT FOR {symbol} ===
--- LIVE QUOTE ---
{q_lines}

--- FINANCIAL FUNDAMENTALS ---
{f_lines}

--- RECENT RELATED NEWS FEED ---
{news_lines}
===================================

User Question: {user_query}

Answer the user question using the stock context above."""


async def stream_copilot(
    symbol: str,
    quote: dict,
    fundamentals: Optional[dict],
    news: list[dict],
    history: list[dict],
    user_query: str
) -> AsyncIterator[str]:
    """Yield text chunks from Ollama for the conversational chat copilot, including conversation history."""
    models = [settings.ollama_model, settings.ollama_fallback, settings.ollama_fallback_2]
    system_prompt = COPILOT_SYSTEM.format(symbol=symbol)
    
    # Assembly messages for the LLM
    # We will reconstruct a chat context. For Ollama '/api/chat' is better if supported,
    # but to maintain consistency with the existing '/api/generate' SSE setup, we can compile history into the prompt text.
    formatted_history = ""
    for msg in history[-8:]:  # keep last 8 messages
        role = "User" if msg["role"] == "user" else "Analyst"
        formatted_history += f"{role}: {msg['content']}\n\n"

    # Context prompt with current query
    current_context = build_copilot_prompt(symbol, quote, fundamentals, news, user_query)
    full_prompt = f"{formatted_history}Current Query Context:\n{current_context}"

    for model in models:
        try:
            base_url = settings.ollama_url.rstrip("/")
            url = f"{base_url}/generate" if base_url.endswith("/api") else f"{base_url}/api/generate"

            headers = {}
            if settings.ollama_api_key:
                headers["Authorization"] = f"Bearer {settings.ollama_api_key}"

            payload = {
                "model": model,
                "system": system_prompt,
                "prompt": full_prompt,
                "stream": True,
            }
            
            async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=10.0)) as client:
                async with client.stream("POST", url, json=payload, headers=headers) as resp:
                    if resp.status_code != 200:
                        log.warning("Model %s failed with HTTP %d in copilot, trying next", model, resp.status_code)
                        continue
                    async for line in resp.aiter_lines():
                        if not line:
                            continue
                        try:
                            obj = json.loads(line)
                        except json.JSONDecodeError:
                            continue
                        chunk = obj.get("response", "")
                        if chunk:
                            yield chunk
                        if obj.get("done"):
                            return
                    return
        except httpx.ConnectError:
            log.warning("Connection error with model %s in copilot, trying next", model)
            if model == models[-1]:
                yield "[error] LLM service unavailable. Check Ollama serve status."
            continue
        except Exception as e:
            log.warning("Error with model %s in copilot: %s, trying next", model, e)
            if model == models[-1]:
                yield f"[error] {e}"
            continue

    yield "[error] All LLM models failed"
