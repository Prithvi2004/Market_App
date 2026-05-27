"""FastAPI entry point."""
from __future__ import annotations

import asyncio
import json
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from cache import cache_get
from config import INDICES, settings
from database import init_db
from ingestion.market_poller import poll_quotes
from ingestion.news_fetcher import fetch_all as fetch_news
from routers import llm as llm_router
from routers import market as market_router
from routers import news as news_router
from scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s :: %(message)s")
log = logging.getLogger("market-app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Initial warm-up in background so the API comes up immediately
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, poll_quotes)
    loop.run_in_executor(None, fetch_news)
    start_scheduler()
    log.info("Backend ready")
    try:
        yield
    finally:
        stop_scheduler()


app = FastAPI(title="Market App", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market_router.router, prefix="/api")
app.include_router(news_router.router, prefix="/api")
app.include_router(llm_router.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ---------- WebSocket: broadcast indices every 60s ----------

class _Hub:
    def __init__(self) -> None:
        self.clients: set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.clients.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self.clients.discard(ws)

    async def broadcast(self, payload: dict) -> None:
        dead: list[WebSocket] = []
        for ws in list(self.clients):
            try:
                await ws.send_text(json.dumps(payload, default=str))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


hub = _Hub()


async def _broadcaster() -> None:
    while True:
        try:
            indices = cache_get("indices") or []
            gainers = cache_get("gainers:NSE") or []
            losers = cache_get("losers:NSE") or []
            await hub.broadcast({"indices": indices, "gainers": gainers, "losers": losers})
        except Exception as e:
            log.debug("broadcast error: %s", e)
        await asyncio.sleep(60)


@app.on_event("startup")
async def _start_broadcaster():
    asyncio.create_task(_broadcaster())


@app.websocket("/ws/prices")
async def ws_prices(ws: WebSocket):
    await hub.connect(ws)
    # send snapshot immediately
    try:
        await ws.send_text(json.dumps({
            "indices": cache_get("indices") or [],
            "gainers": cache_get("gainers:NSE") or [],
            "losers": cache_get("losers:NSE") or [],
        }, default=str))
        while True:
            await ws.receive_text()  # ignore client messages; keep alive
    except WebSocketDisconnect:
        hub.disconnect(ws)
    except Exception:
        hub.disconnect(ws)
