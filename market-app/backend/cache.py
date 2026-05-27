"""Redis cache helpers. Falls back to an in-process dict if Redis is unreachable."""
from __future__ import annotations

import json
import logging
import time
from typing import Any, Optional

import redis

from config import settings

log = logging.getLogger(__name__)

_client: Optional[redis.Redis] = None
_fallback: dict[str, tuple[float, str]] = {}  # key -> (expires_at, value)


def _get_client() -> Optional[redis.Redis]:
    global _client
    if _client is None:
        try:
            _client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
            _client.ping()
        except Exception as e:
            log.warning("Redis unavailable (%s) — using in-process fallback cache", e)
            _client = None
    return _client


def cache_get(key: str) -> Any:
    client = _get_client()
    if client is not None:
        try:
            raw = client.get(key)
            return json.loads(raw) if raw else None
        except Exception as e:
            log.debug("cache_get failed: %s", e)
    entry = _fallback.get(key)
    if entry and entry[0] > time.time():
        return json.loads(entry[1])
    if entry:
        _fallback.pop(key, None)
    return None


def cache_set(key: str, value: Any, ttl: int = 60) -> None:
    payload = json.dumps(value, default=str)
    client = _get_client()
    if client is not None:
        try:
            client.set(key, payload, ex=ttl)
            return
        except Exception as e:
            log.debug("cache_set failed: %s", e)
    _fallback[key] = (time.time() + ttl, payload)


def cache_delete(key: str) -> None:
    client = _get_client()
    if client is not None:
        try:
            client.delete(key)
        except Exception:
            pass
    _fallback.pop(key, None)
