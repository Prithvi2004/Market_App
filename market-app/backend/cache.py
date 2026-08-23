"""Redis cache helpers. Falls back to an in-process dict if Redis is unreachable."""
from __future__ import annotations

import json
import logging
import math
import time
from typing import Any, Optional

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    redis = None  # type: ignore
    REDIS_AVAILABLE = False

from config import settings

log = logging.getLogger(__name__)

_client: Any = None
_fallback: dict[str, tuple[float, str]] = {}  # key -> (expires_at, value)
_last_failed_at: float | None = None
_retry_delay_seconds = 30


def _sanitize_obj(obj: Any) -> Any:
    """Recursively clean NaN / Inf float values to prevent JSONResponse 500 errors."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return 0.0
        return obj
    elif isinstance(obj, dict):
        return {k: _sanitize_obj(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_sanitize_obj(v) for v in obj]
    return obj


def _get_client() -> Any:
    global _client
    if not REDIS_AVAILABLE or redis is None:
        return None

    if _client is None:
        from time import time as _now
        global _last_failed_at
        if _last_failed_at is not None and _now() - _last_failed_at < _retry_delay_seconds:
            return None
        try:
            _client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
            _client.ping()
            _last_failed_at = None
        except Exception as e:
            log.debug("Redis unavailable (%s) — using in-process fallback cache", e)
            _last_failed_at = time.time()
            _client = None
    return _client


def cache_get(key: str) -> Any:
    client = _get_client()
    if client is not None:
        try:
            raw = client.get(key)
            return _sanitize_obj(json.loads(raw)) if raw else None
        except Exception as e:
            log.debug("cache_get failed: %s", e)
    entry = _fallback.get(key)
    if entry and entry[0] > time.time():
        return _sanitize_obj(json.loads(entry[1]))
    if entry:
        _fallback.pop(key, None)
    return None


def cache_set(key: str, value: Any, ttl: int = 60) -> None:
    clean_value = _sanitize_obj(value)
    payload = json.dumps(clean_value, default=str)
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
