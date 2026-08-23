"""LLM routes (SSE streaming)."""
from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from cache import cache_get
from llm.explainer import build_prompt, stream_explain
from llm.impact_analyzer import stream_impact
from models import ExplainRequest, ImpactRequest, CopilotChatRequest, CompareExplainRequest
from routers.news import get_news

router = APIRouter()


def _sse(event: str, data) -> bytes:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n".encode("utf-8")


@router.post("/explain")
async def explain(req: ExplainRequest):
    quote = cache_get(f"quote:{req.symbol}")
    if not quote:
        raise HTTPException(status_code=404, detail=f"No cached quote for {req.symbol}")

    articles = get_news(ticker=req.symbol, limit=5) if req.include_news else []
    prompt = build_prompt(req.symbol, quote, articles)
    cache_key = f"{req.symbol}:{req.timeframe}"

    async def gen():
        yield _sse("meta", {
            "symbol": req.symbol,
            "sources": [
                {
                    "title": a["title"], "url": a["url"], "source": a["source"],
                    "published_at": a["published_at"],
                    "sentiment_label": a["sentiment_label"],
                }
                for a in articles
            ],
        })
        full = ""
        async for chunk in stream_explain(prompt, cache_key=cache_key):
            full += chunk
            yield _sse("token", {"text": chunk})
        conf = "medium"
        last = full.strip().lower().splitlines()[-1] if full.strip() else ""
        for level in ("high", "medium", "low"):
            if f"confidence: {level}" in last:
                conf = level
                break
        yield _sse("done", {"confidence": conf, "narrative": full})

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.post("/impact")
async def impact(req: ImpactRequest):
    async def gen():
        yield _sse("meta", {"headline": req.headline})
        full = ""
        async for chunk in stream_impact(req.headline, req.summary):
            full += chunk
            yield _sse("token", {"text": chunk})
        yield _sse("done", {"analysis": full})

    return StreamingResponse(gen(), media_type="text/event-stream")


# ---------- Added for Advanced Analytics Suite ----------

@router.post("/copilot/chat")
async def copilot_chat(req: CopilotChatRequest):
    """Interactive streaming chat with the AI Analyst about a specific stock."""
    from llm.copilot import stream_copilot
    from routers.market import get_quote, get_fundamentals
    
    # Try fetching details from cache/endpoints
    try:
        quote = get_quote(req.symbol)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Stock quote not found for {req.symbol}")
        
    try:
        fundamentals = get_fundamentals(req.symbol)
    except Exception:
        fundamentals = None
        
    articles = get_news(ticker=req.symbol, limit=5)
    
    history_list = [h.model_dump() for h in req.history]

    async def gen():
        yield _sse("meta", {"symbol": req.symbol})
        async for chunk in stream_copilot(req.symbol, quote, fundamentals, articles, history_list, req.user_query):
            yield _sse("token", {"text": chunk})
        yield _sse("done", {})

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.post("/compare/explain")
async def compare_explain(req: CompareExplainRequest):
    """Generate a comparative analysis report comparing target stock with its peers."""
    from llm.compare_synthesizer import stream_compare
    from routers.market import get_quote, get_fundamentals
    
    # Resolve metrics for all comparison symbols
    comparison_data = []
    all_syms = list(set([req.target_symbol] + req.compare_symbols))
    
    for s in all_syms:
        try:
            q = get_quote(s)
            f = get_fundamentals(s)
            
            # Estimate upside
            upside = 0.0
            price = q.get("price")
            target = f.get("target_price")
            if price and target:
                upside = round(((target - price) / price) * 100, 1)

            # Get 52W positions
            high = q.get("high_52w", price) or price
            low = q.get("low_52w", price) or price
                
            comparison_data.append({
                "symbol": s,
                "name": q.get("name", s),
                "sector": f.get("sector", "Other"),
                "price": price,
                "change_pct": q.get("change_pct", 0.0),
                "market_cap": f.get("market_cap", "—"),
                "pe_ratio": f.get("pe_ratio", "—"),
                "forward_pe": f.get("forward_pe", "—"),
                "pb_ratio": f.get("pb_ratio", "—"),
                "eps": f.get("eps", "—"),
                "roe": f.get("roe", "—"),
                "profit_margin": f.get("profit_margin", "—"),
                "debt_to_equity": f.get("debt_to_equity", "—"),
                "current_ratio": f.get("current_ratio", "—"),
                "beta": f.get("beta", "—"),
                "52w_high": high,
                "52w_low": low,
                "target_upside_pct": upside
            })
        except Exception:
            # Skip failures to build comparison matrix for whatever works
            pass

    if not comparison_data:
        raise HTTPException(status_code=400, detail="Failed to fetch comparison details for any symbol.")

    async def gen():
        yield _sse("meta", {"target": req.target_symbol})
        async for chunk in stream_compare(req.target_symbol, comparison_data):
            yield _sse("token", {"text": chunk})
        yield _sse("done", {})

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.get("/analysis/ripple/{symbol}")
def ripple_analysis(symbol: str):
    """Generate conglomerate sister-company news ripple analysis."""
    from llm.ripple_analyzer import generate_ripple_analysis
    articles = get_news(ticker=symbol, limit=5)
    return generate_ripple_analysis(symbol, articles)


@router.get("/llm/test")
@router.post("/llm/test")
async def test_llm_suite():
    """
    Test suite endpoint to check operational health of all 3 Ollama models + 1 OpenRouter model.
    Returns status, HTTP status codes, latency, error details, and sample response for each model.
    """
    import asyncio
    import time
    import httpx
    from config import settings

    results = {}
    working_count = 0

    async def _test_ollama(model_name: str, key_name: str):
        nonlocal working_count
        if not model_name:
            results[key_name] = {
                "model": "not_configured",
                "provider": "Ollama Cloud",
                "status": "error",
                "status_code": None,
                "error": "Model name not set in config",
                "latency_ms": 0,
                "sample": None,
            }
            return

        base_url = settings.ollama_url.rstrip("/")
        url = f"{base_url}/generate" if base_url.endswith("/api") else f"{base_url}/api/generate"
        headers = {}
        if settings.ollama_api_key:
            headers["Authorization"] = f"Bearer {settings.ollama_api_key}"

        payload = {
            "model": model_name,
            "prompt": "Reply with 'OK'",
            "stream": False,
        }

        start_t = time.time()
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                latency = round((time.time() - start_t) * 1000, 1)

                if resp.status_code == 200:
                    data = resp.json()
                    sample = data.get("response", "").strip()
                    working_count += 1
                    results[key_name] = {
                        "model": model_name,
                        "provider": "Ollama Cloud",
                        "status": "ok",
                        "status_code": 200,
                        "error": None,
                        "latency_ms": latency,
                        "sample": sample or "OK",
                    }
                else:
                    results[key_name] = {
                        "model": model_name,
                        "provider": "Ollama Cloud",
                        "status": "error",
                        "status_code": resp.status_code,
                        "error": f"HTTP {resp.status_code}: {resp.text[:200]}",
                        "latency_ms": latency,
                        "sample": None,
                    }
        except Exception as e:
            latency = round((time.time() - start_t) * 1000, 1)
            results[key_name] = {
                "model": model_name,
                "provider": "Ollama Cloud",
                "status": "error",
                "status_code": None,
                "error": str(e),
                "latency_ms": latency,
                "sample": None,
            }

    async def _test_openrouter():
        nonlocal working_count
        model_name = settings.openrouter_model or "stealth/ox-alpha"
        api_key = settings.openrouter_api_key

        if not api_key:
            results["openrouter_ox_alpha"] = {
                "model": model_name,
                "provider": "OpenRouter",
                "status": "error",
                "status_code": None,
                "error": "OPENROUTER_API_KEY is not configured in backend/.env",
                "latency_ms": 0,
                "sample": None,
            }
            return

        base_url = settings.openrouter_base_url.rstrip("/")
        url = f"{base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://market-app.local",
            "X-Title": "MarketPulse Test Suite",
        }
        payload = {
            "model": model_name,
            "messages": [{"role": "user", "content": "Reply with 'OK'"}],
            "stream": False,
        }

        start_t = time.time()
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                latency = round((time.time() - start_t) * 1000, 1)

                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    sample = ""
                    if choices:
                        sample = choices[0].get("message", {}).get("content", "").strip()
                    working_count += 1
                    results["openrouter_ox_alpha"] = {
                        "model": model_name,
                        "provider": "OpenRouter",
                        "status": "ok",
                        "status_code": 200,
                        "error": None,
                        "latency_ms": latency,
                        "sample": sample or "OK",
                    }
                else:
                    results["openrouter_ox_alpha"] = {
                        "model": model_name,
                        "provider": "OpenRouter",
                        "status": "error",
                        "status_code": resp.status_code,
                        "error": f"HTTP {resp.status_code}: {resp.text[:200]}",
                        "latency_ms": latency,
                        "sample": None,
                    }
        except Exception as e:
            latency = round((time.time() - start_t) * 1000, 1)
            results["openrouter_ox_alpha"] = {
                "model": model_name,
                "provider": "OpenRouter",
                "status": "error",
                "status_code": None,
                "error": str(e),
                "latency_ms": latency,
                "sample": None,
            }

    await asyncio.gather(
        _test_ollama(settings.ollama_model, "ollama_primary"),
        _test_ollama(settings.ollama_fallback, "ollama_fallback_1"),
        _test_ollama(settings.ollama_fallback_2, "ollama_fallback_2"),
        _test_openrouter(),
    )

    return {
        "status": "completed",
        "summary": {
            "total_models": 4,
            "working_models": working_count,
            "failing_models": 4 - working_count,
        },
        "results": results,
    }

