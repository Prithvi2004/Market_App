"""Ollama streaming explainer."""
from __future__ import annotations

import json
import logging
from typing import AsyncIterator

import httpx

from config import settings

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a concise Indian stock market analyst. 
Analyze the given stock data and recent news. 
Provide a 3-4 sentence explanation of price movement.
Cite specific news items. 
End with: Confidence: high/medium/low
Never give investment advice."""


def build_prompt(symbol: str, quote: dict, articles: list[dict]) -> str:
    news_lines = "\n".join(
        f"- [{a['source']}] {a['title']} (sentiment: {a['sentiment_label']}, {a['published_at']})"
        for a in articles[:5]
    ) or "- (no recent related news found)"
    return f"""Stock: {symbol}
Price: ₹{quote['price']:.2f}
Change today: {quote['change_pct']:+.2f}%
52W High/Low: ₹{quote['high_52w']:.2f} / ₹{quote['low_52w']:.2f}
Volume: {quote['volume']:,}

Recent related news:
{news_lines}

Explain the likely reasons for today's price movement based on the above data and news."""


async def stream_explain(prompt: str) -> AsyncIterator[str]:
    """Yield text chunks from Ollama with fallback models. On failure, yield a single error string."""
    models = [settings.ollama_model, settings.ollama_fallback, settings.ollama_fallback_2]
    
    for model in models:
        try:
            url = f"{settings.ollama_url}/api/generate"
            payload = {
                "model": model,
                "system": SYSTEM_PROMPT,
                "prompt": prompt,
                "stream": True,
            }
            async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=5.0)) as client:
                async with client.stream("POST", url, json=payload) as resp:
                    if resp.status_code != 200:
                        log.warning(f"Model {model} failed with HTTP {resp.status_code}, trying next model")
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
            log.warning(f"Connection error with model {model}, trying next model")
            if model == models[-1]:
                yield "[error] LLM service unavailable. Start Ollama with: ollama serve"
            continue
        except Exception as e:
            log.warning(f"Error with model {model}: {e}, trying next model")
            if model == models[-1]:
                yield f"[error] {e}"
            continue
    
    yield "[error] All LLM models failed"

