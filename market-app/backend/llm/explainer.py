"""Ollama streaming explainer with OpenRouter fallback and 5-min result cache."""
from __future__ import annotations

import json
import logging
from typing import AsyncIterator, Optional

import httpx

from cache import cache_get, cache_set
from config import settings
from llm.openrouter import stream_openrouter

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a concise Indian stock market analyst.
Analyze the given stock data and recent news.
Provide a 3-4 sentence explanation of the price movement.
Cite specific news items by name.
End your response with exactly one line: Confidence: high/medium/low
Never give investment advice."""

CACHE_TTL_SECONDS = 300  # 5 minutes


def build_prompt(symbol: str, quote: dict, articles: list[dict]) -> str:
    news_lines = "\n".join(
        f"- [{a['source']}] {a['title']} (sentiment: {a['sentiment_label']}, {a['published_at']})"
        for a in articles[:5]
    ) or "- (no recent related news found)"

    price = quote.get('price', 0)
    high_52w = quote.get('high_52w', price) or price
    low_52w = quote.get('low_52w', price) or price
    pct_from_high = ((high_52w - price) / high_52w * 100) if high_52w else 0
    position = "near 52W high" if pct_from_high < 5 else ("near 52W low" if pct_from_high > 85 else "mid-range")

    return f"""Stock: {symbol}
Price: ₹{price:.2f} ({position})
Change today: {quote.get('change_pct', 0):+.2f}%
52W High/Low: ₹{high_52w:.2f} / ₹{low_52w:.2f}
Volume: {quote.get('volume', 0):,}

Recent related news:
{news_lines}

Explain the likely reasons for today's price movement based on the above data and news."""


async def stream_explain(prompt: str, cache_key: Optional[str] = None) -> AsyncIterator[str]:
    """Yield text chunks from Ollama with fallback models, then OpenRouter stealth/ox-alpha fallback."""
    if cache_key:
        cached = cache_get(f"explain_cache:{cache_key}")
        if cached:
            log.info("Returning cached explanation for %s", cache_key)
            yield "[CACHED] "
            yield cached
            return

    models = [settings.ollama_model, settings.ollama_fallback, settings.ollama_fallback_2]
    full_response = ""

    for model in models:
        try:
            base_url = settings.ollama_url.rstrip("/")
            url = f"{base_url}/generate" if base_url.endswith("/api") else f"{base_url}/api/generate"

            headers = {}
            if settings.ollama_api_key:
                headers["Authorization"] = f"Bearer {settings.ollama_api_key}"

            payload = {
                "model": model,
                "system": SYSTEM_PROMPT,
                "prompt": prompt,
                "stream": True,
            }
            async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=10.0)) as client:
                async with client.stream("POST", url, json=payload, headers=headers) as resp:
                    if resp.status_code != 200:
                        log.warning("Ollama model %s failed with HTTP %d, trying next", model, resp.status_code)
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
                            full_response += chunk
                            yield chunk
                        if obj.get("done"):
                            if cache_key and full_response:
                                cache_set(f"explain_cache:{cache_key}", full_response, ttl=CACHE_TTL_SECONDS)
                            return
                    return
        except Exception as e:
            log.warning("Error with Ollama model %s: %s, trying next", model, e)
            continue

    # Fallback to OpenRouter (stealth/ox-alpha) if configured
    if settings.openrouter_api_key:
        log.info("All Ollama models failed. Falling back to OpenRouter (%s)...", settings.openrouter_model)
        try:
            async for chunk in stream_openrouter(SYSTEM_PROMPT, prompt):
                full_response += chunk
                yield chunk
            if cache_key and full_response:
                cache_set(f"explain_cache:{cache_key}", full_response, ttl=CACHE_TTL_SECONDS)
            return
        except Exception as e:
            log.error("OpenRouter fallback failed: %s", e)

    yield "[error] All LLM models failed (Ollama & OpenRouter)"
