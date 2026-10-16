"""Database pool lifecycle, concurrency, and API overload regression tests.

These tests use mocked connections and never read or modify a real database.
"""

from __future__ import annotations

import json
import os
import sys
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import MagicMock, call, patch

sys.path.insert(0, str(Path(__file__).parent))

import db_models
import main
from mysql.connector.errors import InterfaceError, PoolError


class DatabasePoolTests(unittest.TestCase):
    def setUp(self) -> None:
        self.settings = {
            "MYSQL_POOL_SIZE": "30",
            "MYSQL_POOL_ACQUIRE_TIMEOUT": "5",
            "MYSQL_CONNECT_TIMEOUT": "10",
        }
        self.connection_config = {"host": "test-host", "user": "test-user", "database": "test-db", "use_pure": True}
        self.connection = MagicMock()
        self.driver_pool = MagicMock()
        self.driver_pool.get_connection.return_value = self.connection
        for patcher in (
            patch.dict(os.environ, self.settings),
            patch.object(db_models, "_database_pool", None),
            patch.object(db_models, "_mysql_config", return_value=self.connection_config),
        ):
            patcher.start()
            self.addCleanup(patcher.stop)
        factory = patch.object(db_models, "MySQLConnectionPool", return_value=self.driver_pool)
        self.factory = factory.start()
        self.addCleanup(factory.stop)

    def assert_slot_returned(self) -> None:
        pool = db_models._get_database_pool()
        self.assertTrue(pool.slots.acquire(blocking=False), "A checkout slot leaked")
        pool.slots.release()

    def test_one_pool_is_reused_across_database_operations(self) -> None:
        for _ in range(3):
            with db_models.database() as connection:
                self.assertIs(connection, self.connection)
        self.factory.assert_called_once_with(
            pool_name="nomad_wanderers", pool_size=30, pool_reset_session=True,
            connection_timeout=10, **self.connection_config,
        )
        self.assertEqual(self.driver_pool.get_connection.call_count, 3)
        self.assertEqual(self.connection.close.call_count, 3)

    def test_pool_defaults_to_thirty_when_no_size_is_configured(self) -> None:
        with patch.dict(os.environ):
            os.environ.pop("MYSQL_POOL_SIZE", None)
            db_models._get_database_pool()
        self.assertEqual(self.factory.call_args.kwargs["pool_size"], 30)

    def test_pool_settings_are_configurable(self) -> None:
        with patch.dict(os.environ, {"MYSQL_POOL_SIZE": "4", "MYSQL_POOL_ACQUIRE_TIMEOUT": "1.5", "MYSQL_CONNECT_TIMEOUT": "3"}):
            pool = db_models._get_database_pool()
        self.assertEqual(pool.acquire_timeout, 1.5)
        self.assertEqual(self.factory.call_args.kwargs["pool_size"], 4)
        self.assertEqual(self.factory.call_args.kwargs["connection_timeout"], 3)

    def test_invalid_settings_fail_before_opening_connections(self) -> None:
        for name, values in (
            ("MYSQL_POOL_SIZE", ("0", "-1", "33", "1.5", "invalid")),
            ("MYSQL_POOL_ACQUIRE_TIMEOUT", ("0", "-1", "nan", "inf", "61", "invalid")),
            ("MYSQL_CONNECT_TIMEOUT", ("0", "-1", "61", "1.5", "invalid")),
        ):
            for value in values:
                with self.subTest(name=name, value=value), patch.dict(os.environ, {name: value}):
                    with self.assertRaisesRegex(RuntimeError, name):
                        db_models._get_database_pool()
        self.factory.assert_not_called()

    def test_concurrent_first_use_creates_only_one_pool(self) -> None:
        start = threading.Barrier(6)
        creating = threading.Event()
        finish_creation = threading.Event()

        def create(**_kwargs):
            creating.set()
            if not finish_creation.wait(3):
                raise AssertionError("Pool creation was never released")
            return self.driver_pool

        def first_use(_index):
            start.wait(timeout=3)
            return db_models._get_database_pool()

        self.factory.side_effect = create
        with ThreadPoolExecutor(max_workers=6) as executor:
            pending = [executor.submit(first_use, index) for index in range(6)]
            try:
                self.assertTrue(creating.wait(3))
            finally:
                finish_creation.set()
            pools = [future.result(timeout=3) for future in pending]
        self.factory.assert_called_once()
        self.assertTrue(all(pool is pools[0] for pool in pools))

    def test_failed_initialization_can_be_retried(self) -> None:
        self.factory.side_effect = [InterfaceError("Test connection failure"), self.driver_pool]
        with self.assertRaises(InterfaceError):
            db_models._get_database_pool()
        self.assertIsNone(db_models._database_pool)
        with db_models.database():
            pass
        self.assertEqual(self.factory.call_count, 2)

    def test_success_commits_then_returns_connection(self) -> None:
        with db_models.database():
            pass
        self.assertEqual(self.connection.mock_calls, [call.commit(), call.close()])

    def test_query_failure_rolls_back_then_returns_connection(self) -> None:
        with self.assertRaisesRegex(ValueError, "query failed"):
            with db_models.database():
                raise ValueError("query failed")
        self.assertEqual(self.connection.mock_calls, [call.rollback(), call.close()])

    def test_commit_failure_rolls_back_then_returns_connection(self) -> None:
        self.connection.commit.side_effect = InterfaceError("commit failed")
        with self.assertRaises(InterfaceError):
            with db_models.database():
                pass
        self.assertEqual(self.connection.mock_calls, [call.commit(), call.rollback(), call.close()])

    def test_rollback_failure_still_returns_connection_and_slot(self) -> None:
        with patch.dict(os.environ, {"MYSQL_POOL_SIZE": "1"}):
            self.connection.rollback.side_effect = InterfaceError("rollback failed")
            with self.assertRaises(InterfaceError):
                with db_models.database():
                    raise ValueError("query failed")
        self.connection.close.assert_called_once()
        self.assert_slot_returned()

    def test_close_failure_still_releases_checkout_slot(self) -> None:
        with patch.dict(os.environ, {"MYSQL_POOL_SIZE": "1"}):
            self.connection.close.side_effect = InterfaceError("reset failed")
            with self.assertRaises(InterfaceError):
                with db_models.database():
                    pass
        self.assert_slot_returned()

    def test_driver_checkout_failure_does_not_leak_slot(self) -> None:
        for error in (PoolError("exhausted"), InterfaceError("reconnect failed")):
            with self.subTest(error=type(error).__name__), patch.object(db_models, "_database_pool", None), patch.dict(os.environ, {"MYSQL_POOL_SIZE": "1"}):
                self.driver_pool.get_connection.side_effect = error
                expected = db_models.DatabasePoolBusy if isinstance(error, PoolError) else InterfaceError
                with self.assertRaises(expected):
                    with db_models.database():
                        self.fail("Checkout should have failed")
                self.assert_slot_returned()
        self.connection.close.assert_not_called()

    def test_exhausted_pool_wait_is_bounded_and_recovers(self) -> None:
        with patch.dict(os.environ, {"MYSQL_POOL_SIZE": "1", "MYSQL_POOL_ACQUIRE_TIMEOUT": "0.01"}):
            with db_models.database():
                with self.assertRaises(db_models.DatabasePoolBusy):
                    with db_models.database():
                        self.fail("The only connection is still occupied")
                self.driver_pool.get_connection.assert_called_once()
            with db_models.database():
                pass
        self.assertEqual(self.driver_pool.get_connection.call_count, 2)

    def test_waiting_operation_acquires_returned_connection(self) -> None:
        waiting = threading.Event()

        def use_database():
            with db_models.database():
                return "completed"

        with patch.dict(os.environ, {"MYSQL_POOL_SIZE": "1"}), ThreadPoolExecutor(max_workers=1) as executor:
            with db_models.database():
                pool = db_models._get_database_pool()
                acquire = pool.slots.acquire

                def acquire_and_notify(*args, **kwargs):
                    waiting.set()
                    return acquire(*args, **kwargs)

                with patch.object(pool.slots, "acquire", side_effect=acquire_and_notify):
                    pending = executor.submit(use_database)
                    self.assertTrue(waiting.wait(3))
                    self.assertFalse(pending.done())
            self.assertEqual(pending.result(timeout=3), "completed")
        self.assertEqual(self.connection.close.call_count, 2)

    def test_advisory_lock_is_released_after_commit(self) -> None:
        events = MagicMock()
        events.attach_mock(self.connection, "connection")
        fetch = MagicMock(side_effect=[{"acquired": 1}, {"released": 1}])
        events.attach_mock(fetch, "query")
        with patch.object(db_models, "_fetch_one", fetch):
            with db_models.database(advisory_lock="schema-test"):
                pass
        self.assertEqual(events.mock_calls, [
            call.query(self.connection, "SELECT GET_LOCK(%s, 30) AS acquired", ("schema-test",)),
            call.connection.commit(),
            call.query(self.connection, "SELECT RELEASE_LOCK(%s) AS released", ("schema-test",)),
            call.connection.close(),
        ])

    def test_advisory_lock_is_released_after_rollback(self) -> None:
        events = MagicMock()
        events.attach_mock(self.connection, "connection")
        fetch = MagicMock(side_effect=[{"acquired": 1}, {"released": 1}])
        events.attach_mock(fetch, "query")
        with patch.object(db_models, "_fetch_one", fetch):
            with self.assertRaisesRegex(ValueError, "migration failed"):
                with db_models.database(advisory_lock="schema-test"):
                    raise ValueError("migration failed")
        self.assertEqual(events.mock_calls, [
            call.query(self.connection, "SELECT GET_LOCK(%s, 30) AS acquired", ("schema-test",)),
            call.connection.rollback(),
            call.query(self.connection, "SELECT RELEASE_LOCK(%s) AS released", ("schema-test",)),
            call.connection.close(),
        ])

    def test_advisory_lock_timeout_never_enters_initialization(self) -> None:
        for result in ({"acquired": 0}, {"acquired": None}, None):
            with self.subTest(result=result), patch.object(db_models, "_fetch_one", return_value=result) as fetch:
                self.connection.reset_mock()
                with self.assertRaisesRegex(RuntimeError, "initialization is busy"):
                    with db_models.database(advisory_lock="schema-test"):
                        self.fail("Initialization must not run without the lock")
                fetch.assert_called_once_with(self.connection, "SELECT GET_LOCK(%s, 30) AS acquired", ("schema-test",))
                self.connection.commit.assert_not_called()
                self.connection.rollback.assert_called_once()
                self.connection.close.assert_called_once()

    def test_advisory_lock_query_failure_still_closes_connection(self) -> None:
        with patch.object(db_models, "_fetch_one", side_effect=InterfaceError("lock query failed")):
            with self.assertRaises(InterfaceError):
                with db_models.database(advisory_lock="schema-test"):
                    self.fail("Initialization must not run without the lock")
        self.connection.rollback.assert_called_once()
        self.connection.close.assert_called_once()

    def test_lock_release_failure_still_returns_connection_and_slot(self) -> None:
        with patch.dict(os.environ, {"MYSQL_POOL_SIZE": "1"}), patch.object(
            db_models, "_fetch_one", side_effect=[{"acquired": 1}, InterfaceError("release failed")],
        ):
            with self.assertRaises(InterfaceError):
                with db_models.database(advisory_lock="schema-test"):
                    pass
        self.connection.commit.assert_called_once()
        self.connection.close.assert_called_once()
        self.assert_slot_returned()

    def test_commit_failure_rolls_back_before_releasing_advisory_lock(self) -> None:
        self.connection.commit.side_effect = InterfaceError("commit failed")
        fetch = MagicMock(side_effect=[{"acquired": 1}, {"released": 1}])
        events = MagicMock()
        events.attach_mock(self.connection, "connection")
        events.attach_mock(fetch, "query")
        with patch.object(db_models, "_fetch_one", fetch), self.assertRaises(InterfaceError):
            with db_models.database(advisory_lock="schema-test"):
                pass
        self.assertEqual(events.mock_calls[-4:], [
            call.connection.commit(), call.connection.rollback(),
            call.query(self.connection, "SELECT RELEASE_LOCK(%s) AS released", ("schema-test",)),
            call.connection.close(),
        ])

    def test_schema_initialization_uses_the_shared_database_lock(self) -> None:
        with (
            patch.object(db_models, "database") as database,
            patch.object(db_models, "_execute"),
            patch.object(db_models, "_ensure_column"),
            patch.object(db_models, "_ensure_index"),
            patch.object(db_models, "_migrate_legacy_tour_reviews"),
        ):
            db_models.initialize_database()
        database.assert_called_once_with(advisory_lock="nomad_wanderers_schema_init")


class PublicTourCategoryFilterTests(unittest.TestCase):
    def _category_query(self, category: str) -> tuple[str, tuple[object, ...]]:
        with (
            patch.object(db_models, "database"),
            patch.object(db_models, "_fetch_one", return_value={"total": 0}) as fetch_one,
            patch.object(db_models, "_fetch_all", return_value=[]),
        ):
            db_models.paginate_public_tours(page=1, page_size=9, category=category)
        query, parameters = fetch_one.call_args.args[1:]
        return query, parameters

    def test_festival_filter_includes_legacy_unique_records_and_multi_day_tours(self) -> None:
        query, parameters = self._category_query("Festival")
        self.assertIn("LOWER(category) = LOWER(%s)", query)
        self.assertIn("JSON_CONTAINS(categories, JSON_QUOTE(%s))", query)
        self.assertNotIn("trip_type NOT IN", query)
        self.assertEqual(parameters, ("Festival", "Festival", "Unique", "Unique"))

    def test_other_category_filters_remain_exact_and_exclude_multi_day_tours(self) -> None:
        query, parameters = self._category_query("Heritage")
        self.assertIn("trip_type NOT IN ('Weekly trip', 'Multi-day trip')", query)
        self.assertEqual(parameters, ("Heritage", "Heritage"))


class DatabasePoolAPIResponseTests(unittest.IsolatedAsyncioTestCase):
    async def assert_busy_response(self, path: str, method: str, body: bytes = b"") -> None:
        events = []

        async def receive():
            return {"type": "http.request", "body": body, "more_body": False}

        async def send(message):
            events.append(message)

        scope = {
            "type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1",
            "method": method, "scheme": "http", "path": path,
            "raw_path": path.encode(), "root_path": "", "query_string": b"",
            "headers": [(b"content-type", b"application/json")],
            "client": ("127.0.0.1", 12345), "server": ("testserver", 80),
        }
        await main.app(scope, receive, send)
        start = next(event for event in events if event["type"] == "http.response.start")
        response_body = b"".join(event.get("body", b"") for event in events if event["type"] == "http.response.body")
        self.assertEqual(start["status"], 503)
        self.assertEqual(dict(start["headers"])[b"retry-after"], b"1")
        self.assertEqual(json.loads(response_body), {"detail": "The service is busy. Please try again shortly."})

    async def test_tour_request_returns_retryable_503_when_pool_is_busy(self) -> None:
        with patch("main.db_models.paginate_public_tours", side_effect=db_models.DatabasePoolBusy("Internal details must not leak")):
            await self.assert_busy_response("/api/tours", "GET")

    async def test_login_returns_retryable_503_when_pool_is_busy(self) -> None:
        with patch("main.db_models.get_user_by_username", side_effect=db_models.DatabasePoolBusy("Internal details must not leak")):
            await self.assert_busy_response("/api/auth/login", "POST", json.dumps({"username": "pool-test-user", "password": "test-password-only"}).encode())


if __name__ == "__main__":
    unittest.main()
