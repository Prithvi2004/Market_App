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
from market_hours import market_status, now_ist

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s :: %(message)s")
log = logging.getLogger("market-app")
log.info("Imported backend.main module")


class _Hub:
    def __init__(self) -> None:
        self.clients: set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.clients.add(ws)
        log.info("WebSocket connected; total clients=%d", len(self.clients))

    def disconnect(self, ws: WebSocket) -> None:
        self.clients.discard(ws)
        log.info("WebSocket disconnected; total clients=%d", len(self.clients))

    async def broadcast(self, payload: dict) -> None:
        dead: list[WebSocket] = []
        log.debug("Broadcasting payload to %d clients", len(self.clients))
        for ws in list(self.clients):
            try:
                await ws.send_text(json.dumps(payload, default=str))
            except Exception:
                log.exception("Error sending to websocket; marking dead")
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


hub = _Hub()


async def _broadcaster() -> None:
    log.info("Background broadcaster started")
    last_indices_ts = None
    while True:
        try:
            # Check the cache reactively
            indices = cache_get("indices") or []
            if indices:
                # Detect new quote timestamps (meaning a new poll cycle completed)
                current_ts = indices[0].get("timestamp")
                if current_ts != last_indices_ts:
                    last_indices_ts = current_ts
                    gainers = cache_get("gainers:NSE") or []
                    losers = cache_get("losers:NSE") or []
                    gainers_bse = cache_get("gainers:BSE") or []
                    losers_bse = cache_get("losers:BSE") or []
                    await hub.broadcast({
                        "indices": indices, 
                        "gainers": gainers, 
                        "losers": losers,
                        "gainers_bse": gainers_bse,
                        "losers_bse": losers_bse
                    })
                    log.info("Broadcasted live market updates successfully (ts: %s)", current_ts)
        except Exception as e:
            log.exception("broadcast error")
        # Poll the cache every 1 second for sub-second reactive latency
        await asyncio.sleep(1)


def safe_poll_quotes():
    """Safe wrapper to run poll_quotes and capture/log any exceptions inside the background thread."""
    try:
        log.info("safe_poll_quotes: starting background quotes poll")
        from ingestion.market_poller import poll_quotes
        poll_quotes()
        log.info("safe_poll_quotes: background quotes poll completed successfully")
    except Exception as e:
        log.exception("safe_poll_quotes: CRITICAL EXCEPTION inside background quotes poller!")


def safe_fetch_news():
    """Safe wrapper to run fetch_news and capture/log any exceptions inside the background thread."""
    try:
        log.info("safe_fetch_news: starting background news ingestion")
        from ingestion.news_fetcher import fetch_all as fetch_news
        fetch_news()
        log.info("safe_fetch_news: background news ingestion completed successfully")
    except Exception as e:
        log.exception("safe_fetch_news: CRITICAL EXCEPTION inside background news fetcher!")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("lifespan: init_db starting")
    init_db()
    log.info("lifespan: init_db done")

    from scheduler import start_scheduler, stop_scheduler

    # Instantly trigger background quotes polling & news fetching to warm up cache immediately
    log.info("lifespan: triggering startup quote polling and news ingestion in background")
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, safe_poll_quotes)
    loop.run_in_executor(None, safe_fetch_news)

    log.info("lifespan: starting scheduler (will run polls)")
    start_scheduler()
    log.info("lifespan: scheduler started")

    asyncio.create_task(_broadcaster())
    log.info("Backend ready; broadcaster task created")
    try:
        yield
    finally:
        stop_scheduler()


app = FastAPI(title="Market App", version="1.0.0", lifespan=lifespan)

from routers import llm as llm_router
from routers import market as market_router
from routers import news as news_router
from routers import portfolio as portfolio_router

app.include_router(market_router.router, prefix="/api")
app.include_router(news_router.router, prefix="/api")
app.include_router(llm_router.router, prefix="/api")
app.include_router(portfolio_router.router, prefix="/api")

origins = settings.cors_origins
allow_all = "*" in origins or len(origins) == 0

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else origins,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/health/detailed")
def health_detailed():
    from database import engine
    from sqlmodel import Session, text
    db_ok = False
    try:
        with Session(engine) as s:
            s.exec(text("SELECT 1"))
            db_ok = True
    except Exception:
        pass

    redis_ok = False
    try:
        from cache import _get_client
        c = _get_client()
        if c:
            c.ping()
            redis_ok = True
    except Exception:
        pass

    from ingestion.market_poller import get_last_poll_time

    last_poll = get_last_poll_time()
    return {
        "status": "ok",
        "db": "ok" if db_ok else "error",
        "redis": "ok" if redis_ok else "fallback",
        "market_status": market_status(),
        "now_ist": now_ist().isoformat(),
        "last_poll": last_poll.isoformat() if last_poll else None,
    }


@app.websocket("/ws/prices")
async def ws_prices(ws: WebSocket):
    await hub.connect(ws)
    log.info("ws_prices: client connected")
    try:
        # Send initial snapshot immediately (if cache is already warmed up)
        await ws.send_text(json.dumps({
            "indices": cache_get("indices") or [],
            "gainers": cache_get("gainers:NSE") or [],
            "losers": cache_get("losers:NSE") or [],
            "gainers_bse": cache_get("gainers:BSE") or [],
            "losers_bse": cache_get("losers:BSE") or [],
        }, default=str))
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        hub.disconnect(ws)
        log.info("ws_prices: client disconnected (WebSocketDisconnect)")
    except Exception:
        hub.disconnect(ws)
        log.exception("ws_prices: unexpected error, disconnected client")
