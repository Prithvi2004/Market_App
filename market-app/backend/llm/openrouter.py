"""OpenRouter LLM fallback integration supporting stealth/ox-alpha and reasoning tokens."""
from __future__ import annotations

import json
import logging
from typing import AsyncIterator, List, Dict, Optional

import httpx

from config import settings

log = logging.getLogger(__name__)


async def stream_openrouter(
    system_prompt: str,
    user_prompt: str,
    messages: Optional[List[Dict[str, str]]] = None,
) -> AsyncIterator[str]:
    """
    Stream responses from OpenRouter API (https://openrouter.ai/api/v1/chat/completions).
    Supports stealth/ox-alpha model and SSE streaming with reasoning tokens.
    """
    api_key = settings.openrouter_api_key
    if not api_key:
        log.warning("OPENROUTER_API_KEY is not configured in backend settings/env")
        raise ValueError("OPENROUTER_API_KEY missing")

    base_url = settings.openrouter_base_url.rstrip("/")
    url = f"{base_url}/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://market-app.local",
        "X-Title": "MarketPulse App",
    }

    formatted_messages = []
    if system_prompt:
        formatted_messages.append({"role": "system", "content": system_prompt})

    if messages:
        for m in messages:
            formatted_messages.append({"role": m["role"], "content": m["content"]})
    elif user_prompt:
        formatted_messages.append({"role": "user", "content": user_prompt})

    payload = {
        "model": settings.openrouter_model or "stealth/ox-alpha",
        "messages": formatted_messages,
        "stream": True,
        "reasoning": {"enabled": True},
    }

    log.info("Initiating OpenRouter stream using model: %s", payload["model"])

    async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=10.0)) as client:
        async with client.stream("POST", url, json=payload, headers=headers) as resp:
            if resp.status_code != 200:
                error_body = await resp.aread()
                err_text = error_body.decode("utf-8", errors="ignore")
                log.error("OpenRouter API error (HTTP %d): %s", resp.status_code, err_text)
                raise RuntimeError(f"OpenRouter HTTP {resp.status_code}: {err_text}")

            async for line in resp.aiter_lines():
                if not line:
                    continue
                line_str = line.strip()
                if line_str.startswith("data: "):
                    data_content = line_str[6:].strip()
                    if data_content == "[DONE]":
                        break
                    try:
                        obj = json.loads(data_content)
                        choices = obj.get("choices", [])
                        if choices:
                            delta = choices[0].get("delta", {})
                            content = delta.get("content")
                            if content:
                                yield content
                    except json.JSONDecodeError:
                        continue
