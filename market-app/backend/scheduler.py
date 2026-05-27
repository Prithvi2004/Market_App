"""APScheduler job registration."""
from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from config import settings
from ingestion.market_poller import persist_daily_ohlcv, poll_quotes
from ingestion.news_fetcher import fetch_all as fetch_news

log = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


def start_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler:
        return _scheduler
    sched = AsyncIOScheduler(timezone="Asia/Kolkata")
    sched.add_job(poll_quotes, IntervalTrigger(seconds=settings.quote_poll_seconds),
                  id="poll_quotes", max_instances=1, coalesce=True, next_run_time=None)
    sched.add_job(fetch_news, IntervalTrigger(seconds=settings.news_poll_seconds),
                  id="fetch_news", max_instances=1, coalesce=True, next_run_time=None)
    sched.add_job(persist_daily_ohlcv, CronTrigger(hour=16, minute=0),
                  id="persist_daily_ohlcv", max_instances=1, coalesce=True)
    sched.start()
    _scheduler = sched
    log.info("Scheduler started")
    return sched


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
