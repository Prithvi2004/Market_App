"""News headline → likely affected sectors/stocks (LLM-driven) with result cache."""
from __future__ import annotations

import json
import logging
from typing import AsyncIterator

import httpx

from cache import cache_get, cache_set
from config import settings, SYMBOL_META

log = logging.getLogger(__name__)

IMPACT_SYSTEM = """You are an Indian equity market impact analyst.
Given a news headline, identify which NIFTY 50 sectors and specific stocks are likely affected.
For each sector: state expected direction (POSITIVE/NEGATIVE/NEUTRAL), give 2-3 sentences of reasoning, and name 1-2 representative NIFTY 50 stocks.
Be specific and concise. Never give investment advice."""

CACHE_TTL = 600  # 10 minutes


def _sectors() -> list[str]:
    return sorted({s for _n, s in SYMBOL_META.values() if s})


def _sector_stocks() -> dict[str, list[str]]:
    """Map sector -> list of stock names."""
    out: dict[str, list[str]] = {}
    for sym, (name, sector) in SYMBOL_META.items():
        out.setdefault(sector, []).append(name)
    return out


def build_impact_prompt(headline: str, summary: str = "") -> str:
    ss = _sector_stocks()
    sector_list = "\n".join(
        f"- {sector}: {', '.join(stocks[:3])}{' ...' if len(stocks) > 3 else ''}"
        for sector, stocks in sorted(ss.items())
    )
    return f"""Headline: {headline}
Summary: {summary or '(none)'}

NIFTY 50 sectors and example stocks:
{sector_list}

For each sector that is likely affected, provide:
1. Direction: POSITIVE / NEGATIVE / NEUTRAL
2. Reasoning (2-3 sentences)
3. Representative stocks (1-2 names)

Focus on sectors with clear impact. Skip sectors with no meaningful connection."""


async def stream_impact(headline: str, summary: str = "") -> AsyncIterator[str]:
    """Yield text chunks from Ollama with fallback models."""
    cache_key = f"impact:{hash(headline + summary) & 0xffffffff}"
    cached = cache_get(cache_key)
    if cached:
        log.info("Returning cached impact for headline")
        yield "[CACHED] "
        yield cached
        return

    models = [settings.ollama_model, settings.ollama_fallback, settings.ollama_fallback_2]
    full_response = ""

    for model in models:
        try:
            url = f"{settings.ollama_url}/api/generate"
            payload = {
                "model": model,
                "system": IMPACT_SYSTEM,
                "prompt": build_impact_prompt(headline, summary),
                "stream": True,
            }
            async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=10.0)) as client:
                async with client.stream("POST", url, json=payload) as resp:
                    if resp.status_code != 200:
                        log.warning("Model %s failed with HTTP %d, trying next", model, resp.status_code)
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
                            if full_response:
                                cache_set(cache_key, full_response, ttl=CACHE_TTL)
                            return
                    return
        except httpx.ConnectError:
            log.warning("Connection error with model %s, trying next", model)
            if model == models[-1]:
                yield "[error] LLM service unavailable. Start Ollama with: ollama serve"
            continue
        except Exception as e:
            log.warning("Error with model %s: %s, trying next", model, e)
            if model == models[-1]:
                yield f"[error] {e}"
            continue

    yield "[error] All LLM models failed"
