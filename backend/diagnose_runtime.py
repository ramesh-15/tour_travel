"""Read-only diagnostics for currency availability and local API concurrency."""

from __future__ import annotations

import argparse
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor
from urllib import error as urlerror
from urllib import request as urlrequest


def check_exchange_rate() -> dict[str, object]:
    import payment_currency
    try:
        rate, observed_date = payment_currency.get_usd_exchange_rate()
        return {"ok": True, "usd_per_inr": str(rate), "rate_date": observed_date}
    except payment_currency.ExchangeRateUnavailable as error:
        cause = error.__cause__
        return {"ok": False, "error_type": type(cause).__name__, "http_status": getattr(cause, "code", None)}


def check_database_limits() -> dict[str, object]:
    import db_models
    limits: dict[str, object] = {}
    try:
        with db_models.database() as connection:
            cursor = connection.cursor(buffered=True)
            try:
                cursor.execute("SHOW VARIABLES WHERE Variable_name IN ('max_connections', 'max_user_connections', 'connect_timeout')")
                limits["configuration"] = dict(cursor.fetchall())
                cursor.execute("SHOW GLOBAL STATUS WHERE Variable_name IN ('Threads_connected', 'Threads_running', 'Max_used_connections', 'Connection_errors_max_connections')")
                limits["status"] = dict(cursor.fetchall())
                cursor.execute("SHOW GRANTS FOR CURRENT_USER")
                # Only print the connection cap, never grants, account names or credentials.
                grants = " ".join(str(row[0]) for row in cursor.fetchall())
                caps = re.findall(r"MAX_USER_CONNECTIONS\s+(\d+)", grants, re.IGNORECASE)
                limits["account_connection_cap"] = int(caps[0]) if caps else None
            finally:
                cursor.close()
    except Exception as error:
        limits["error_type"] = type(error).__name__
        limits["error_code"] = getattr(error, "errno", None)
    return limits


def request_tours(_index: int) -> dict[str, object]:
    started = time.monotonic()
    try:
        with urlrequest.urlopen("http://localhost:8000/api/tours?page_size=9", timeout=15) as response:
            response.read()
            status = response.status
    except urlerror.HTTPError as error:
        status = error.code
    except (urlerror.URLError, TimeoutError, OSError):
        status = "connection_failed"
    return {"status": status, "seconds": round(time.monotonic() - started, 3)}


def check_concurrency() -> dict[str, object]:
    result: dict[str, object] = {"database": check_database_limits()}
    for count in (1, 2, 3, 6):
        with ThreadPoolExecutor(max_workers=count) as executor:
            result[f"parallel_requests_{count}"] = list(executor.map(request_tours, range(count)))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--exchange-rate", action="store_true")
    parser.add_argument("--concurrency", action="store_true")
    args = parser.parse_args()
    output = {}
    if args.exchange_rate:
        output["exchange_rate"] = check_exchange_rate()
    if args.concurrency:
        output["concurrency"] = check_concurrency()
    print(json.dumps(output, indent=2))
