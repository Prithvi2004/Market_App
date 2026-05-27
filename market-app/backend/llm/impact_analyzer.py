"""News headline → likely affected sectors/stocks (LLM-driven)."""
from __future__ import annotations

import json
import logging
from typing import AsyncIterator

import httpx

from config import settings, SYMBOL_META

log = logging.getLogger(__name__)

IMPACT_SYSTEM = """You are an Indian equity market impact analyst.
Given a news headline, identify which NIFTY 50 sectors/stocks are likely affected and explain why in 2-3 sentences per sector.
Be specific. Use only the sector list provided. Never give investment advice."""


def _sectors() -> list[str]:
    return sorted({s for _n, s in SYMBOL_META.values() if s})


def build_impact_prompt(headline: str, summary: str = "") -> str:
    return f"""Headline: {headline}
Summary: {summary or '(none)'}

Available NIFTY 50 sectors: {', '.join(_sectors())}

For each likely-affected sector, briefly explain the expected direction (positive/negative) and cite 1-2 representative NIFTY 50 stocks."""


async def stream_impact(headline: str, summary: str = "") -> AsyncIterator[str]:
    """Yield text chunks from Ollama with fallback models. On failure, yield a single error string."""
    models = [settings.ollama_model, settings.ollama_fallback, settings.ollama_fallback_2]
    
    for model in models:
        try:
            url = f"{settings.ollama_url}/api/generate"
            payload = {
                "model": model,
                "system": IMPACT_SYSTEM,
                "prompt": build_impact_prompt(headline, summary),
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

