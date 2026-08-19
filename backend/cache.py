"""Small fail-open Redis cache used by the API.

Redis is an optimization here: requests continue against MySQL when Redis is
unconfigured or temporarily unavailable.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Callable

import redis
import config

log = logging.getLogger(__name__)
REDIS_ENABLED = os.getenv("REDIS_ENABLED", "true").strip().lower() in {"1", "true", "yes", "on"}
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "300"))
_client = redis.Redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=1, socket_timeout=1) if REDIS_ENABLED else None


def get_json(key: str) -> Any | None:
    if _client is None:
        return None
    try:
        value = _client.get(key)
        return json.loads(value) if value is not None else None
    except (redis.RedisError, json.JSONDecodeError) as error:
        log.warning("Redis cache read failed: %s", error)
        return None


def set_json(key: str, value: Any, ttl: int = CACHE_TTL_SECONDS) -> None:
    if _client is None:
        return
    try:
        _client.setex(key, ttl, json.dumps(value, default=str))
    except redis.RedisError as error:
        log.warning("Redis cache write failed: %s", error)


def remember(key: str, loader: Callable[[], Any]) -> Any:
    cached = get_json(key)
    if cached is not None:
        return cached
    value = loader()
    set_json(key, value)
    return value


def invalidate_tours() -> None:
    """Delete public tour entries without using the blocking KEYS command."""
    if _client is None:
        return
    try:
        cursor = 0
        while True:
            cursor, keys = _client.scan(cursor=cursor, match="tours:*", count=100)
            if keys:
                _client.delete(*keys)
            if cursor == 0:
                break
    except redis.RedisError as error:
        log.warning("Redis cache invalidation failed: %s", error)


def status() -> str:
    if _client is None:
        return "disabled"
    try:
        return "ok" if _client.ping() else "unavailable"
    except redis.RedisError:
        return "unavailable"
