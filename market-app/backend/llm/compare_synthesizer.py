"""LLM Peer Comparison Synthesizer."""
from __future__ import annotations

import json
import logging
from typing import AsyncIterator
import httpx
from config import settings

log = logging.getLogger(__name__)

COMPARE_SYSTEM = """You are an institutional equity portfolio manager.
Analyze the provided table of side-by-side financial and technical metrics for the target stock and its sector peers.
Produce a structured comparative analysis report covering:
1. **Valuation & Efficiency**: Compare P/E, PEG, P/B, profit margins, and ROE. Identify who is overvalued or highly efficient.
2. **Risk & Capital Structure**: Compare Debt-to-Equity ratios, Current ratios, and Beta. Identify the safest vs highest-risk profile.
3. **Price Momentum & Targets**: Evaluate current price momentum relative to 52-week boundaries and analyst target price upside.
4. **Final Portfolio Recommendation**: Conclude with a clear synthesis of which stock presents the most compelling risk-adjusted opportunity based solely on the stats.
Be objective and data-driven. Citing specific numbers from the context. Keep your response under 500 words."""


def build_compare_prompt(target_symbol: str, data_list: list[dict]) -> str:
    """Build a side-by-side comparative table text for the LLM."""
    blocks = []
    for d in data_list:
        sym = d["symbol"]
        is_target = " [TARGET]" if sym == target_symbol else ""
        blocks.append(f"""--- Stock: {sym}{is_target} ---
Name: {d.get('name', '—')}
Sector: {d.get('sector', '—')}
Price: ₹{d.get('price', 0):.2f} (Daily Change: {d.get('change_pct', 0):+.2f}%)
Market Cap: {d.get('market_cap', '—')}
P/E Ratio: {d.get('pe_ratio', '—')}
Forward P/E: {d.get('forward_pe', '—')}
P/B Ratio: {d.get('pb_ratio', '—')}
EPS (TTM): {d.get('eps', '—')}
ROE: {d.get('roe', '—')}%
Profit Margin: {d.get('profit_margin', '—')}%
Debt/Equity: {d.get('debt_to_equity', '—')}
Current Ratio: {d.get('current_ratio', '—')}
Beta: {d.get('beta', '—')}
52W High/Low: ₹{d.get('52w_high', 0):.2f} / ₹{d.get('52w_low', 0):.2f}
Target price upside vs close: {d.get('target_upside_pct', '—')}%
""")
    
    comparative_text = "\n".join(blocks)
    return f"""Comparative Stock Data Matrix:
{comparative_text}
Please write the comparative equity analysis report according to the guidelines."""


async def stream_compare(target_symbol: str, data_list: list[dict]) -> AsyncIterator[str]:
    """Yield text chunks from Ollama for the side-by-side comparison narrative."""
    models = [settings.ollama_model, settings.ollama_fallback, settings.ollama_fallback_2]
    prompt = build_compare_prompt(target_symbol, data_list)

    for model in models:
        try:
            base_url = settings.ollama_url.rstrip("/")
            url = f"{base_url}/generate" if base_url.endswith("/api") else f"{base_url}/api/generate"

            headers = {}
            if settings.ollama_api_key:
                headers["Authorization"] = f"Bearer {settings.ollama_api_key}"

            payload = {
                "model": model,
                "system": COMPARE_SYSTEM,
                "prompt": prompt,
                "stream": True,
            }
            
            async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=10.0)) as client:
                async with client.stream("POST", url, json=payload, headers=headers) as resp:
                    if resp.status_code != 200:
                        log.warning("Model %s failed with HTTP %d in compare, trying next", model, resp.status_code)
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
            log.warning("Connection error with model %s in compare, trying next", model)
            if model == models[-1]:
                yield "[error] LLM service unavailable. Check Ollama server."
            continue
        except Exception as e:
            log.warning("Error with model %s in compare: %s, trying next", model, e)
            if model == models[-1]:
                yield f"[error] {e}"
            continue

    yield "[error] All LLM models failed"
