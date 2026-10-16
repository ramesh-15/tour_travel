"""Server-side reference rates and exact payment conversion."""

from __future__ import annotations

import json
import threading
import time
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from urllib import error as urlerror
from urllib import request as urlrequest


EXCHANGE_RATE_URL = "https://api.frankfurter.dev/v1/latest?base=INR&symbols=USD"
EXCHANGE_RATE_FALLBACK_URL = "https://api.frankfurter.dev/v2/rate/INR/USD"
RATE_REQUEST_TIMEOUT_SECONDS = 4
RATE_CACHE_SECONDS = 3600
_rate_cache: tuple[Decimal, str, float] | None = None
_rate_lock = threading.Lock()


class ExchangeRateUnavailable(ValueError):
    pass


def get_usd_exchange_rate() -> tuple[Decimal, str]:
    """Fetch USD per INR; never substitute a guessed or expired rate."""
    global _rate_cache
    with _rate_lock:
        if _rate_cache and time.monotonic() - _rate_cache[2] < RATE_CACHE_SECONDS:
            return _rate_cache[0], _rate_cache[1]
        last_error = None
        for rate_url in (EXCHANGE_RATE_URL, EXCHANGE_RATE_FALLBACK_URL):
            try:
                request = urlrequest.Request(rate_url, headers={
                    "Accept": "application/json",
                    "User-Agent": "NomadWanderers/1.0 (currency-conversion)",
                })
                with urlrequest.urlopen(request, timeout=RATE_REQUEST_TIMEOUT_SECONDS) as response:
                    body = json.loads(response.read().decode("utf-8"), parse_float=Decimal)
                if not isinstance(body, dict) or body.get("base") != "INR":
                    raise ValueError("Invalid reference currency")
                if rate_url == EXCHANGE_RATE_FALLBACK_URL:
                    if body.get("quote") != "USD":
                        raise ValueError("Invalid reference currency")
                    rate = Decimal(str(body["rate"]))
                else:
                    if body.get("amount") != 1:
                        raise ValueError("Invalid reference amount")
                    rate = Decimal(str(body["rates"]["USD"]))
                observed_date = date.fromisoformat(body["date"])
                today = datetime.now(timezone.utc).date()
                if (
                    not rate.is_finite()
                    or rate <= 0
                    or observed_date > today
                    or observed_date < today - timedelta(days=10)
                ):
                    raise ValueError("Invalid reference rate")
            except (
                urlerror.URLError, TimeoutError, OSError, json.JSONDecodeError,
                UnicodeDecodeError, InvalidOperation, KeyError, TypeError, ValueError,
            ) as error:
                last_error = error
                continue
            _rate_cache = rate, observed_date.isoformat(), time.monotonic()
            return rate, observed_date.isoformat()
        raise ExchangeRateUnavailable("Dollar conversion is unavailable. Please try again.") from last_error


def payment_amount_in_subunits(base_amount_inr: int, currency: str, usd_rate: Decimal | None = None) -> int:
    """Convert INR paise to INR paise or USD cents with half-up rounding."""
    if currency == "INR":
        return base_amount_inr
    if currency != "USD":
        raise ValueError("Unsupported payment currency")
    if usd_rate is None or not usd_rate.is_finite() or usd_rate <= 0:
        raise ExchangeRateUnavailable("A valid dollar exchange rate is required")
    return int((Decimal(base_amount_inr) * usd_rate).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
