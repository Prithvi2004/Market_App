"""LLM routes (SSE streaming)."""
from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from cache import cache_get
from llm.explainer import build_prompt, stream_explain
from llm.impact_analyzer import stream_impact
from models import ExplainRequest, ImpactRequest
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
        async for chunk in stream_explain(prompt):
            full += chunk
            yield _sse("token", {"text": chunk})
        # crude confidence heuristic from the trailing line
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
