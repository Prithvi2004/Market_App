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
