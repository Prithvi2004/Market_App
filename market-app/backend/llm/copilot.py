"""LLM Stock Co-pilot streaming assistant with OpenRouter fallback."""
from __future__ import annotations

import json
import logging
from typing import AsyncIterator, Optional

import httpx

from config import settings
from llm.openrouter import stream_openrouter

log = logging.getLogger(__name__)

COPILOT_SYSTEM = """You are an elite Indian stock market research analyst and portfolio advisor.
You are helping the user analyze the stock: {symbol}.
Provide deep, data-driven analysis using the provided Quote, Fundamental data, and Recent News.
Synthesize technical levels, financial health (P/E, margins, debt, ROE), and news sentiment.
Be objective, citing specific news sources and financial numbers.
Never give definitive financial advice or tell the user to buy or sell, but explain the structural trends.
Format your responses using clean Markdown. Keep responses clear and structured, under 4-5 paragraphs unless asked for a detailed report."""


def build_copilot_prompt(symbol: str, quote: dict, fundamentals: Optional[dict], news: list[dict], user_query: str) -> str:
    q_lines = f"""Price: ₹{quote.get('price', 0):.2f}
Change today: {quote.get('change_pct', 0):+.2f}%
52W High/Low: ₹{quote.get('high_52w', 0):.2f} / ₹{quote.get('low_52w', 0):.2f}
Volume: {quote.get('volume', 0):,}
Exchange: {quote.get('exchange', 'NSE')}"""

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
    """Yield text chunks from Ollama with OpenRouter stealth/ox-alpha fallback."""
    models = [settings.ollama_model, settings.ollama_fallback, settings.ollama_fallback_2]
    system_prompt = COPILOT_SYSTEM.format(symbol=symbol)

    formatted_history = ""
    for msg in history[-8:]:
        role = "User" if msg["role"] == "user" else "Analyst"
        formatted_history += f"{role}: {msg['content']}\n\n"

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
        except Exception as e:
            log.warning("Error with Ollama model %s in copilot: %s, trying next", model, e)
            continue

    # Fallback to OpenRouter (stealth/ox-alpha)
    if settings.openrouter_api_key:
        log.info("All Ollama models failed in copilot. Falling back to OpenRouter (%s)...", settings.openrouter_model)
        try:
            async for chunk in stream_openrouter(system_prompt, full_prompt, messages=history[-8:] if history else None):
                yield chunk
            return
        except Exception as e:
            log.error("OpenRouter copilot fallback failed: %s", e)

    yield "[error] All LLM models failed (Ollama & OpenRouter)"
