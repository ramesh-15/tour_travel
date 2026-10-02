"""MySQL schema and data-access helpers for Nomad Wanderers."""

from __future__ import annotations

import hashlib
import json
import os
import secrets
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Generator

import mysql.connector
from mysql.connector.connection import MySQLConnection


DB_ENV_PATH = Path(__file__).with_name("db.env")
TOUR_COLUMNS = (
    "title", "description", "image_url", "city", "mode", "trip_type", "category", "duration",
    "price", "capacity", "schedule_type", "departure_date", "start_time", "time_slots", "guide_name", "highlights", "inclusions", "gallery_images", "faq_items", "review_items", "meeting_details", "start_meeting_point", "start_meeting_map_url", "end_meeting_point", "end_meeting_map_url", "traveller_video_url", "private_price", "tag", "featured", "dark", "published",
    "categories", "start_city", "end_city", "destinations", "duration_days", "duration_nights",
    "languages", "physicality", "itinerary", "inclusion_groups", "exclusions", "pricing", "availability",
)
CAROUSEL_SETTING_KEY = "home_carousel_tour_ids"


def _load_db_env() -> dict[str, str]:
    """Read server-only MySQL settings without overwriting process variables."""
    values: dict[str, str] = {}
    if not DB_ENV_PATH.exists():
        return values

    for line in DB_ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def _mysql_config() -> dict[str, Any]:
    values = _load_db_env()
    def setting(name: str, fallback: str) -> str:
        return os.getenv(name) or fallback
    config = {
        "host": setting("MYSQL_HOST", values.get("host", "localhost")),
        "port": int(setting("MYSQL_PORT", values.get("port", "3306"))),
        "user": setting("MYSQL_USER", values.get("username", "")),
        "password": setting("MYSQL_PASSWORD", values.get("password", "")),
        "database": setting("MYSQL_DATABASE", values.get("database_name", "")),
        # Avoid native-driver compatibility issues on newer Python releases.
        "use_pure": True,
    }
    if not config["user"] or not config["database"]:
        raise RuntimeError(
            "MySQL configuration is incomplete. Set username and database_name in backend/db.env."
        )
    return config


@contextmanager
def database() -> Generator[MySQLConnection, None, None]:
    connection = mysql.connector.connect(**_mysql_config())
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def _execute(connection: MySQLConnection, query: str, parameters: tuple[Any, ...] = ()) -> int:
    cursor = connection.cursor()
    try:
        cursor.execute(query, parameters)
        return cursor.rowcount
    finally:
        cursor.close()


def _insert_and_get_id(connection: MySQLConnection, query: str, parameters: tuple[Any, ...] = ()) -> int:
    cursor = connection.cursor()
    try:
        cursor.execute(query, parameters)
        if cursor.lastrowid is None:
            raise RuntimeError("MySQL did not return an inserted record ID.")
        return int(cursor.lastrowid)
    finally:
        cursor.close()


def _fetch_one(connection: MySQLConnection, query: str, parameters: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    # Buffered cursors consume the result set, which prevents mysql-connector's
    # "Unread result found" error when this cursor is closed.
    cursor = connection.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute(query, parameters)
        return cursor.fetchone()
    finally:
        cursor.close()


def _fetch_all(connection: MySQLConnection, query: str, parameters: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    cursor = connection.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute(query, parameters)
        return cursor.fetchall()
    finally:
        cursor.close()


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _ensure_index(connection: MySQLConnection, table: str, index_name: str, columns: str, unique: bool = False) -> None:
    existing = _fetch_one(
        connection,
        """SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = %s AND index_name = %s""",
        (table, index_name),
    )
    if not existing:
        prefix = "UNIQUE " if unique else ""
        _execute(connection, f"CREATE {prefix}INDEX {index_name} ON {table} ({columns})")


def _ensure_column(connection: MySQLConnection, table: str, column: str, definition: str) -> None:
    existing = _fetch_one(
        connection,
        """SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = %s AND column_name = %s""",
        (table, column),
    )
    if not existing:
        _execute(connection, f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def initialize_database() -> None:
    statements = (
        """
        CREATE TABLE IF NOT EXISTS tours (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(160) NOT NULL,
            description TEXT NOT NULL,
            image_url VARCHAR(2048) NOT NULL,
            city VARCHAR(80) NOT NULL,
            mode VARCHAR(40) NOT NULL,
            trip_type VARCHAR(20) NOT NULL DEFAULT 'One-day trip',
            category VARCHAR(80) NOT NULL,
            duration VARCHAR(80) NOT NULL,
            price DECIMAL(12, 2) NOT NULL,
            capacity SMALLINT NOT NULL DEFAULT 20 CHECK (capacity >= 1),
            schedule_type VARCHAR(20) NOT NULL DEFAULT 'Specific date',
            departure_date DATE NULL,
            start_time VARCHAR(5) NULL,
            time_slots JSON NOT NULL,
            guide_name VARCHAR(120) NULL,
            highlights JSON NOT NULL,
            inclusions JSON NOT NULL,
            gallery_images JSON NOT NULL,
            faq_items JSON NOT NULL,
            review_items JSON NOT NULL,
            meeting_details TEXT NOT NULL,
            start_meeting_point VARCHAR(300) NOT NULL DEFAULT '',
            start_meeting_map_url VARCHAR(2048) NULL,
            end_meeting_point VARCHAR(300) NOT NULL DEFAULT '',
            end_meeting_map_url VARCHAR(2048) NULL,
            traveller_video_url VARCHAR(2048) NULL,
            private_price DECIMAL(12, 2) NULL,
            categories JSON NOT NULL,
            start_city VARCHAR(80) NULL,
            end_city VARCHAR(80) NULL,
            destinations JSON NOT NULL,
            duration_days SMALLINT NULL,
            duration_nights SMALLINT NULL,
            languages JSON NOT NULL,
            physicality VARCHAR(40) NULL,
            itinerary JSON NOT NULL,
            inclusion_groups JSON NOT NULL,
            exclusions JSON NOT NULL,
            pricing JSON NULL,
            availability JSON NULL,
            tag VARCHAR(40) NULL,
            featured BOOLEAN NOT NULL DEFAULT FALSE,
            dark BOOLEAN NOT NULL DEFAULT FALSE,
            published BOOLEAN NOT NULL DEFAULT TRUE,
            created_at DATETIME(6) NOT NULL,
            updated_at DATETIME(6) NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS reviews (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            tour_id BIGINT NOT NULL,
            name VARCHAR(120) NOT NULL,
            rating TINYINT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
            review_heading VARCHAR(180) NOT NULL DEFAULT '',
            review_point TEXT NOT NULL,
            guide_rating TINYINT NOT NULL DEFAULT 5 CHECK (guide_rating >= 1 AND guide_rating <= 5),
            meeting_or_pickup_rating TINYINT NOT NULL DEFAULT 5 CHECK (meeting_or_pickup_rating >= 1 AND meeting_or_pickup_rating <= 5),
            value_for_money_rating TINYINT NOT NULL DEFAULT 5 CHECK (value_for_money_rating >= 1 AND value_for_money_rating <= 5),
            review_date VARCHAR(40) NULL,
            source VARCHAR(100) NOT NULL DEFAULT '',
            link VARCHAR(2048) NULL,
            show_on_home BOOLEAN NOT NULL DEFAULT FALSE,
            created_at DATETIME(6) NOT NULL,
            updated_at DATETIME(6) NOT NULL,
            CONSTRAINT reviews_tour_fk FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
            INDEX reviews_tour_id_idx (tour_id),
            INDEX reviews_home_idx (show_on_home, review_date)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS revoked_tokens (
            token_hash CHAR(64) NOT NULL PRIMARY KEY,
            expires_at BIGINT NOT NULL,
            revoked_at DATETIME(6) NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS site_settings (
            setting_key VARCHAR(80) NOT NULL PRIMARY KEY,
            setting_value VARCHAR(255) NOT NULL,
            updated_at DATETIME(6) NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS contact_enquiries (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(254) NOT NULL,
            phone VARCHAR(40) NOT NULL,
            subject VARCHAR(180) NOT NULL,
            message TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'new',
            admin_notes TEXT NOT NULL,
            created_at DATETIME(6) NOT NULL,
            updated_at DATETIME(6) NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS custom_journeys (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(254) NOT NULL,
            phone VARCHAR(40) NOT NULL,
            destinations VARCHAR(600) NOT NULL,
            start_date VARCHAR(40) NULL,
            duration VARCHAR(80) NOT NULL,
            travellers VARCHAR(40) NOT NULL,
            budget VARCHAR(80) NOT NULL,
            interests TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'new',
            admin_notes TEXT NOT NULL,
            quote TEXT NOT NULL,
            created_at DATETIME(6) NOT NULL,
            updated_at DATETIME(6) NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS users (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            username VARCHAR(80) NOT NULL UNIQUE,
            email VARCHAR(254) NOT NULL UNIQUE,
            phone VARCHAR(40) NOT NULL DEFAULT '',
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'customer',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at DATETIME(6) NOT NULL,
            updated_at DATETIME(6) NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS bookings (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            tour_id BIGINT NOT NULL,
            travel_date DATE NOT NULL,
            travellers SMALLINT NOT NULL CHECK (travellers >= 1),
            contact_phone VARCHAR(40) NOT NULL DEFAULT '',
            special_requests TEXT NOT NULL,
            booking_status VARCHAR(20) NOT NULL DEFAULT 'pending',
            payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
            created_at DATETIME(6) NOT NULL,
            updated_at DATETIME(6) NOT NULL,
            CONSTRAINT bookings_user_fk FOREIGN KEY (user_id) REFERENCES users(id),
            CONSTRAINT bookings_tour_fk FOREIGN KEY (tour_id) REFERENCES tours(id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS razorpay_orders (
            razorpay_order_id VARCHAR(64) NOT NULL PRIMARY KEY,
            booking_id BIGINT NOT NULL,
            user_id BIGINT NOT NULL,
            amount BIGINT UNSIGNED NOT NULL,
            currency CHAR(3) NOT NULL,
            receipt VARCHAR(40) NOT NULL,
            terms_version VARCHAR(32) NOT NULL,
            terms_accepted_at DATETIME(6) NOT NULL,
            razorpay_payment_id VARCHAR(64) NULL UNIQUE,
            razorpay_signature CHAR(64) NULL,
            payment_status VARCHAR(20) NOT NULL DEFAULT 'created',
            created_at DATETIME(6) NOT NULL,
            verified_at DATETIME(6) NULL,
            CONSTRAINT razorpay_orders_booking_fk FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
            CONSTRAINT razorpay_orders_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS notification_logs (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            booking_id BIGINT NOT NULL,
            channel VARCHAR(20) NOT NULL,
            recipient VARCHAR(254) NOT NULL,
            delivery_status VARCHAR(20) NOT NULL DEFAULT 'queued',
            requested_by BIGINT NULL,
            created_at DATETIME(6) NOT NULL,
            CONSTRAINT notification_logs_booking_fk FOREIGN KEY (booking_id) REFERENCES bookings(id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS idempotency_keys (
            user_id BIGINT NOT NULL,
            operation VARCHAR(40) NOT NULL,
            idempotency_key VARCHAR(200) NOT NULL,
            request_hash CHAR(64) NOT NULL,
            resource_id BIGINT NULL,
            created_at DATETIME(6) NOT NULL,
            PRIMARY KEY (user_id, operation, idempotency_key),
            CONSTRAINT idempotency_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """,
    )
    with database() as connection:
        for statement in statements:
            _execute(connection, statement)
        # Compatibility additions for databases created by earlier releases.
        for table, column, definition in (
            ("tours", "trip_type", "VARCHAR(20) NOT NULL DEFAULT 'One-day trip'"),
            ("tours", "capacity", "SMALLINT NOT NULL DEFAULT 20"),
            ("tours", "schedule_type", "VARCHAR(20) NOT NULL DEFAULT 'Specific date'"),
            ("tours", "departure_date", "DATE NULL"),
            ("tours", "start_time", "VARCHAR(5) NULL"),
            ("tours", "time_slots", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "guide_name", "VARCHAR(120) NULL"),
            ("tours", "inclusions", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "gallery_images", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "faq_items", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "review_items", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "meeting_details", "TEXT NOT NULL"),
            ("tours", "start_meeting_point", "VARCHAR(300) NOT NULL DEFAULT ''"),
            ("tours", "start_meeting_map_url", "VARCHAR(2048) NULL"),
            ("tours", "end_meeting_point", "VARCHAR(300) NOT NULL DEFAULT ''"),
            ("tours", "end_meeting_map_url", "VARCHAR(2048) NULL"),
            ("tours", "traveller_video_url", "VARCHAR(2048) NULL"),
            ("tours", "private_price", "DECIMAL(12, 2) NULL"),
            ("tours", "categories", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "start_city", "VARCHAR(80) NULL"),
            ("tours", "end_city", "VARCHAR(80) NULL"),
            ("tours", "destinations", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "duration_days", "SMALLINT NULL"),
            ("tours", "duration_nights", "SMALLINT NULL"),
            ("tours", "languages", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "physicality", "VARCHAR(40) NULL"),
            ("tours", "itinerary", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "inclusion_groups", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "exclusions", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "pricing", "JSON NULL"),
            ("tours", "availability", "JSON NULL"),
            ("users", "username", "VARCHAR(80) NULL"),
            ("users", "phone", "VARCHAR(40) NOT NULL DEFAULT ''"),
            ("bookings", "contact_phone", "VARCHAR(40) NOT NULL DEFAULT ''"),
            ("users", "role", "VARCHAR(20) NOT NULL DEFAULT 'customer'"),
            ("users", "is_active", "BOOLEAN NOT NULL DEFAULT TRUE"),
            ("razorpay_orders", "terms_version", "VARCHAR(32) NOT NULL DEFAULT 'legacy'"),
            ("razorpay_orders", "terms_accepted_at", "DATETIME(6) NULL"),
            ("reviews", "review_heading", "VARCHAR(180) NOT NULL DEFAULT ''"),
            ("reviews", "guide_rating", "TINYINT NOT NULL DEFAULT 5 CHECK (guide_rating >= 1 AND guide_rating <= 5)"),
            ("reviews", "meeting_or_pickup_rating", "TINYINT NOT NULL DEFAULT 5 CHECK (meeting_or_pickup_rating >= 1 AND meeting_or_pickup_rating <= 5)"),
            ("reviews", "value_for_money_rating", "TINYINT NOT NULL DEFAULT 5 CHECK (value_for_money_rating >= 1 AND value_for_money_rating <= 5)"),
        ):
            _ensure_column(connection, table, column, definition)
        _execute(connection, "UPDATE users SET username = CONCAT('user', id) WHERE username IS NULL OR username = ''")
        _execute(connection, "ALTER TABLE users MODIFY COLUMN username VARCHAR(80) NOT NULL")
        _ensure_index(connection, "users", "users_username_unique", "username", unique=True)
        _ensure_index(connection, "contact_enquiries", "contact_enquiries_created_at_idx", "created_at")
        _ensure_index(connection, "custom_journeys", "custom_journeys_created_at_idx", "created_at")
        _ensure_index(connection, "users", "users_email_idx", "email")
        _ensure_index(connection, "bookings", "bookings_user_created_idx", "user_id, created_at")
        _ensure_index(connection, "razorpay_orders", "razorpay_orders_booking_idx", "booking_id, created_at")
        _ensure_index(connection, "notification_logs", "notification_logs_booking_created_idx", "booking_id, created_at")
        _migrate_legacy_tour_reviews(connection)


def _migrate_legacy_tour_reviews(connection: MySQLConnection) -> None:
    """Move reviews from the old tours JSON column into the related table once."""
    rows = _fetch_all(connection, "SELECT id, review_items FROM tours")
    now = _utc_now()
    for row in rows:
        raw_reviews = row.get("review_items")
        if isinstance(raw_reviews, str):
            try:
                raw_reviews = json.loads(raw_reviews)
            except (TypeError, ValueError, json.JSONDecodeError):
                raw_reviews = []
        if not isinstance(raw_reviews, list) or not raw_reviews:
            continue
        for item in raw_reviews:
            if isinstance(item, (list, tuple)):
                item = {"name": item[0] if item else "", "review": item[1] if len(item) > 1 else ""}
            if not isinstance(item, dict):
                continue
            name = str(item.get("name") or item.get("author") or "").strip()[:120]
            review_point = str(item.get("review_point") or item.get("review") or item.get("text") or "").strip()
            if not name or not review_point:
                continue
            raw_date = item.get("date")
            review_date = (str(raw_date).strip()[:40] or None) if raw_date else None
            rating = item.get("rating", 5)
            try:
                rating = min(5, max(1, int(rating)))
            except (TypeError, ValueError):
                rating = 5
            raw_link = str(item.get("link") or "").strip()[:2048]
            review_link = raw_link if raw_link.lower().startswith(("http://", "https://")) else None
            component_ratings = []
            for field in ("guide_rating", "meeting_or_pickup_rating", "value_for_money_rating"):
                try:
                    component_ratings.append(min(5, max(1, int(item.get(field, 5)))))
                except (TypeError, ValueError):
                    component_ratings.append(5)
            _execute(
                connection,
                """INSERT INTO reviews
                (tour_id, name, rating, review_heading, review_point, guide_rating,
                meeting_or_pickup_rating, value_for_money_rating, review_date, source, link,
                show_on_home, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, FALSE, %s, %s)""",
                (
                    int(row["id"]), name, rating,
                    str(item.get("review_heading") or "").strip()[:180],
                    review_point, *component_ratings, review_date,
                    str(item.get("source") or "").strip()[:100],
                    review_link,
                    now, now,
                ),
            )
        _execute(connection, "UPDATE tours SET review_items = JSON_ARRAY() WHERE id = %s", (row["id"],))
def health() -> str:
    try:
        with database() as connection:
            _fetch_one(connection, "SELECT 1 AS healthy")
        return "ok"
    except Exception:
        return "unavailable"


def get_carousel_tour_ids() -> list[int]:
    with database() as connection:
        row = _fetch_one(
            connection,
            "SELECT setting_value FROM site_settings WHERE setting_key = %s",
            (CAROUSEL_SETTING_KEY,),
        )
    if not row:
        return []
    try:
        values = json.loads(str(row.get("setting_value") or "[]"))
    except (TypeError, ValueError, json.JSONDecodeError):
        return []
    if not isinstance(values, list):
        return []
    return [int(value) for value in values if isinstance(value, (int, str)) and str(value).isdigit()]


def save_carousel_tour_ids(tour_ids: list[int]) -> list[int]:
    normalized = list(dict.fromkeys(int(tour_id) for tour_id in tour_ids))
    with database() as connection:
        _execute(
            connection,
            "INSERT INTO site_settings (setting_key, setting_value, updated_at) VALUES (%s, %s, %s) "
            "ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = VALUES(updated_at)",
            (CAROUSEL_SETTING_KEY, json.dumps(normalized), _utc_now()),
        )
    return normalized


def list_carousel_tours() -> list[dict[str, Any]]:
    tour_ids = get_carousel_tour_ids()
    if not tour_ids:
        return []
    placeholders = ", ".join("%s" for _ in tour_ids)
    with database() as connection:
        rows = _fetch_all(
            connection,
            f"SELECT * FROM tours WHERE published = TRUE AND id IN ({placeholders})",
            tuple(tour_ids),
        )
        normalized_rows = _attach_tour_reviews(connection, rows)
    by_id = {int(tour["id"]): tour for tour in normalized_rows}
    return [by_id[tour_id] for tour_id in tour_ids if tour_id in by_id]


def _request_hash(data: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(data, sort_keys=True, default=str, separators=(",", ":")).encode()).hexdigest()


def _claim_idempotency(connection: MySQLConnection, user_id: int, operation: str, key: str | None, data: dict[str, Any]) -> int | None:
    if not key:
        return None
    digest = _request_hash(data)
    row = _fetch_one(
        connection,
        "SELECT request_hash, resource_id FROM idempotency_keys WHERE user_id = %s AND operation = %s AND idempotency_key = %s FOR UPDATE",
        (user_id, operation, key),
    )
    if row:
        if row["request_hash"] != digest:
            raise ValueError("This Idempotency-Key was already used with a different request")
        if row["resource_id"] is None:
            raise ValueError("The original request is still being processed")
        return int(row["resource_id"])
    _execute(
        connection,
        "INSERT INTO idempotency_keys (user_id, operation, idempotency_key, request_hash, resource_id, created_at) VALUES (%s, %s, %s, %s, NULL, %s)",
        (user_id, operation, key, digest, _utc_now()),
    )
    return None


def _complete_idempotency(connection: MySQLConnection, user_id: int, operation: str, key: str | None, resource_id: int) -> None:
    if key:
        _execute(connection, "UPDATE idempotency_keys SET resource_id = %s WHERE user_id = %s AND operation = %s AND idempotency_key = %s", (resource_id, user_id, operation, key))


def _review_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": int(row["id"]),
        "tour_id": int(row["tour_id"]),
        "name": row["name"],
        "rating": int(row["rating"]),
        "review_heading": row.get("review_heading") or "",
        "review_point": row["review_point"],
        "guide_rating": int(row.get("guide_rating") or 5),
        "meeting_or_pickup_rating": int(row.get("meeting_or_pickup_rating") or 5),
        "value_for_money_rating": int(row.get("value_for_money_rating") or 5),
        "date": str(row.get("review_date")) if row.get("review_date") else None,
        "source": row.get("source") or "",
        "link": row.get("link"),
        "show_on_home": bool(row.get("show_on_home")),
    }


def _attach_tour_reviews(connection: MySQLConnection, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    tours = [row_to_dict(row) for row in rows]
    if not tours:
        return tours
    tour_ids = [int(tour["id"]) for tour in tours]
    placeholders = ", ".join("%s" for _ in tour_ids)
    review_rows = _fetch_all(
        connection,
        f"SELECT * FROM reviews WHERE tour_id IN ({placeholders}) ORDER BY id",
        tuple(tour_ids),
    )
    reviews_by_tour: dict[int, list[dict[str, Any]]] = {tour_id: [] for tour_id in tour_ids}
    for row in review_rows:
        review = _review_to_dict(row)
        reviews_by_tour[review["tour_id"]].append(review)
    for tour in tours:
        tour["review_items"] = reviews_by_tour[int(tour["id"])]
    return tours


def row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    tour = dict(row)
    for field in (
        "highlights", "inclusions", "gallery_images", "faq_items", "review_items", "time_slots",
        "categories", "destinations", "languages", "itinerary", "inclusion_groups", "exclusions",
        "pricing", "availability",
    ):
        value = tour.get(field, [])
        tour[field] = json.loads(value) if isinstance(value, str) else value
    for field in ("featured", "dark", "published"):
        tour[field] = bool(tour[field])
    # Reviews now come from the related reviews table, not the legacy JSON column.
    tour["review_items"] = []
    return tour


def list_tours(
    city: str | None = None,
    mode: str | None = None,
    trip_type: str | None = None,
    include_unpublished: bool = False,
) -> list[dict[str, Any]]:
    clauses = [] if include_unpublished else ["published = TRUE"]
    parameters: list[Any] = []
    if city:
        clauses.append("LOWER(city) = LOWER(%s)")
        parameters.append(city)
    if mode:
        clauses.append("LOWER(mode) = LOWER(%s)")
        parameters.append(mode)
    if trip_type:
        clauses.append("trip_type = %s")
        parameters.append(trip_type)
    where_clause = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    with database() as connection:
        rows = _fetch_all(
            connection,
            f"SELECT * FROM tours{where_clause} ORDER BY featured DESC, id DESC",
            tuple(parameters),
        )
        tours = _attach_tour_reviews(connection, rows)
    return tours


def get_tour(tour_id: int) -> dict[str, Any] | None:
    with database() as connection:
        row = _fetch_one(connection, "SELECT * FROM tours WHERE id = %s AND published = TRUE", (tour_id,))
        tours = _attach_tour_reviews(connection, [row] if row else [])
    return tours[0] if tours else None


def _sync_tour_reviews(connection: MySQLConnection, tour_id: int, items: list[dict[str, Any]]) -> None:
    existing_rows = _fetch_all(
        connection,
        "SELECT id, show_on_home FROM reviews WHERE tour_id = %s",
        (tour_id,),
    )
    existing = {int(row["id"]): bool(row["show_on_home"]) for row in existing_rows}
    retained_ids: set[int] = set()
    now = _utc_now()
    for item in items:
        review_id = item.get("id")
        name = str(item.get("name") or "").strip()
        review_point = str(item.get("review_point") or item.get("review") or item.get("text") or "").strip()
        if not name or not review_point:
            continue
        try:
            rating = min(5, max(1, int(item.get("rating", 5))))
        except (TypeError, ValueError):
            rating = 5
        component_ratings: list[int] = []
        for field in ("guide_rating", "meeting_or_pickup_rating", "value_for_money_rating"):
            try:
                component_ratings.append(min(5, max(1, int(item.get(field, 5)))))
            except (TypeError, ValueError):
                component_ratings.append(5)
        review_heading = str(item.get("review_heading") or "").strip()[:180]
        raw_date = item.get("date")
        review_date = (str(raw_date).strip()[:40] or None) if raw_date else None
        values = (
            name[:120], rating, review_heading, review_point[:10000],
            *component_ratings, review_date,
            str(item.get("source") or "").strip()[:100],
            str(item.get("link") or "").strip()[:2048] or None,
        )
        if review_id is not None and int(review_id) in existing and int(review_id) not in retained_ids:
            review_id = int(review_id)
            retained_ids.add(review_id)
            _execute(
                connection,
                """UPDATE reviews SET name = %s, rating = %s, review_heading = %s, review_point = %s,
                guide_rating = %s, meeting_or_pickup_rating = %s, value_for_money_rating = %s,
                review_date = %s, source = %s, link = %s, updated_at = %s WHERE id = %s AND tour_id = %s""",
                values + (now, review_id, tour_id),
            )
        else:
            review_id = _insert_and_get_id(
                connection,
                """INSERT INTO reviews
                (tour_id, name, rating, review_heading, review_point, guide_rating,
                meeting_or_pickup_rating, value_for_money_rating, review_date, source, link,
                show_on_home, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, FALSE, %s, %s)""",
                (tour_id,) + values + (now, now),
            )
            retained_ids.add(review_id)
    removed_ids = set(existing) - retained_ids
    if removed_ids:
        placeholders = ", ".join("%s" for _ in removed_ids)
        _execute(connection, f"DELETE FROM reviews WHERE id IN ({placeholders})", tuple(removed_ids))


def save_tour(data: dict[str, Any], tour_id: int | None = None) -> dict[str, Any] | None:
    defaults: dict[str, Any] = {
        "inclusions": [], "gallery_images": [], "faq_items": [], "review_items": [], "time_slots": [],
        "meeting_details": "", "start_meeting_point": "", "start_meeting_map_url": None,
        "end_meeting_point": "", "end_meeting_map_url": None,
        "traveller_video_url": None, "private_price": None,
        "categories": [], "start_city": None, "end_city": None, "destinations": [],
        "duration_days": None, "duration_nights": None, "languages": [], "physicality": None,
        "itinerary": [], "inclusion_groups": [], "exclusions": [], "pricing": None,
        "availability": None,
    }
    values = {field: data.get(field, defaults.get(field)) for field in TOUR_COLUMNS}
    for field in (
        "highlights", "inclusions", "gallery_images", "faq_items", "time_slots",
        "categories", "destinations", "languages", "itinerary", "inclusion_groups", "exclusions",
        "pricing", "availability",
    ):
        values[field] = json.dumps(values[field])
    # Keep the old JSON column empty for compatibility with databases created before
    # reviews were normalized. All new review records are written to `reviews` below.
    values["review_items"] = json.dumps([])
    review_items = data.get("review_items", []) or []
    now = _utc_now()
    with database() as connection:
        if tour_id is None:
            insert_values = tuple(values[field] for field in TOUR_COLUMNS) + (now, now)
            new_id = _insert_and_get_id(
                connection,
                f"INSERT INTO tours ({', '.join(TOUR_COLUMNS)}, created_at, updated_at) "
                f"VALUES ({', '.join('%s' for _ in insert_values)})",
                insert_values,
            )
            tour_id = new_id
        else:
            existing_tour = _fetch_one(connection, "SELECT id FROM tours WHERE id = %s", (tour_id,))
            if not existing_tour:
                return None
            update_values = tuple(values[field] for field in TOUR_COLUMNS) + (now, tour_id)
            _execute(
                connection,
                f"UPDATE tours SET {', '.join(f'{field} = %s' for field in TOUR_COLUMNS)}, updated_at = %s WHERE id = %s",
                update_values,
            )
        _sync_tour_reviews(connection, int(tour_id), review_items)
        row = _fetch_one(connection, "SELECT * FROM tours WHERE id = %s", (tour_id,))
        tours = _attach_tour_reviews(connection, [row] if row else [])
    return tours[0] if tours else None


def delete_tour(tour_id: int) -> bool:
    return delete_tours([tour_id]) > 0


def delete_tours(tour_ids: list[int]) -> int:
    """Permanently delete the requested tours and return the number removed."""
    if not tour_ids:
        return 0
    placeholders = ", ".join("%s" for _ in tour_ids)
    with database() as connection:
        # A tour may be referenced by bookings. Remove dependent operational
        # records first so a requested permanent tour deletion is not blocked
        # by foreign-key constraints.
        booking_rows = _fetch_all(
            connection,
            f"SELECT id FROM bookings WHERE tour_id IN ({placeholders})",
            tuple(tour_ids),
        )
        booking_ids = [int(row["id"]) for row in booking_rows]
        if booking_ids:
            booking_placeholders = ", ".join("%s" for _ in booking_ids)
            _execute(
                connection,
                f"DELETE FROM notification_logs WHERE booking_id IN ({booking_placeholders})",
                tuple(booking_ids),
            )
            _execute(
                connection,
                f"DELETE FROM razorpay_orders WHERE booking_id IN ({booking_placeholders})",
                tuple(booking_ids),
            )
            _execute(
                connection,
                f"DELETE FROM bookings WHERE id IN ({booking_placeholders})",
                tuple(booking_ids),
            )
        return _execute(
            connection,
            f"DELETE FROM tours WHERE id IN ({placeholders})",
            tuple(tour_ids),
        )


def revoke_token(token: str, expires_at: int) -> None:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with database() as connection:
        _execute(connection, "DELETE FROM revoked_tokens WHERE expires_at < %s", (int(datetime.now(timezone.utc).timestamp()),))
        _execute(
            connection,
            "INSERT INTO revoked_tokens (token_hash, expires_at, revoked_at) VALUES (%s, %s, %s) "
            "ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at), revoked_at = VALUES(revoked_at)",
            (token_hash, expires_at, _utc_now()),
        )


def is_token_revoked(token: str) -> bool:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with database() as connection:
        row = _fetch_one(connection, "SELECT 1 FROM revoked_tokens WHERE token_hash = %s", (token_hash,))
    return row is not None


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return f"scrypt$16384$8$1${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, n, r, p, salt, digest = stored_hash.split("$")
        if algorithm != "scrypt":
            return False
        candidate = hashlib.scrypt(password.encode("utf-8"), salt=bytes.fromhex(salt), n=int(n), r=int(r), p=int(p), dklen=len(bytes.fromhex(digest)))
        return secrets.compare_digest(candidate.hex(), digest)
    except (TypeError, ValueError):
        return False


def create_user(name: str, username: str, email: str, password: str, phone: str = "") -> dict[str, Any]:
    now = _utc_now()
    with database() as connection:
        user_id = _insert_and_get_id(
            connection,
            "INSERT INTO users (name, username, email, phone, password_hash, role, is_active, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, 'customer', TRUE, %s, %s)",
            (name, username.lower(), email.lower(), phone, hash_password(password), now, now),
        )
        return _fetch_one(connection, "SELECT id, name, username, email, phone, role, is_active, created_at FROM users WHERE id = %s", (user_id,)) or {}


def get_user_by_email(email: str) -> dict[str, Any] | None:
    with database() as connection:
        return _fetch_one(connection, "SELECT * FROM users WHERE email = %s", (email.lower(),))


def get_user_by_username(username: str) -> dict[str, Any] | None:
    with database() as connection:
        return _fetch_one(connection, "SELECT * FROM users WHERE username = %s", (username.lower(),))


def get_user(user_id: int) -> dict[str, Any] | None:
    with database() as connection:
        return _fetch_one(connection, "SELECT id, name, username, email, phone, role, is_active, created_at FROM users WHERE id = %s", (user_id,))


def reset_user_password_by_email(email: str, new_password: str) -> bool:
    """Store a freshly salted password hash for the matching account."""
    with database() as connection:
        changed = _execute(
            connection,
            "UPDATE users SET password_hash = %s, updated_at = %s WHERE email = %s",
            (hash_password(new_password), _utc_now(), email.lower()),
        )
    return changed > 0


def update_user_profile(user_id: int, name: str, phone: str | None = None, email: str | None = None) -> dict[str, Any] | None:
    with database() as connection:
        _execute(connection, "UPDATE users SET name = %s, phone = COALESCE(%s, phone), email = COALESCE(%s, email), updated_at = %s WHERE id = %s", (name, phone, email.lower() if email else None, _utc_now(), user_id))
    return get_user(user_id)


def list_users() -> list[dict[str, Any]]:
    with database() as connection:
        return _fetch_all(connection, "SELECT id, name, username, email, phone, role, is_active, created_at FROM users ORDER BY id DESC")


def create_staff_user(name: str, username: str, email: str, password: str, role: str) -> dict[str, Any]:
    now = _utc_now()
    with database() as connection:
        user_id = _insert_and_get_id(
            connection,
            "INSERT INTO users (name, username, email, password_hash, role, is_active, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, TRUE, %s, %s)",
            (name, username.lower(), email.lower(), hash_password(password), role, now, now),
        )
    return get_user(user_id) or {}


def update_user_access(user_id: int, role: str | None = None, is_active: bool | None = None) -> dict[str, Any] | None:
    updates: list[str] = []
    parameters: list[Any] = []
    if role is not None:
        updates.append("role = %s")
        parameters.append(role)
    if is_active is not None:
        updates.append("is_active = %s")
        parameters.append(is_active)
    if not updates:
        return get_user(user_id)
    updates.append("updated_at = %s")
    parameters.append(_utc_now())
    parameters.append(user_id)
    with database() as connection:
        _execute(connection, f"UPDATE users SET {', '.join(updates)} WHERE id = %s", tuple(parameters))
    return get_user(user_id)


def create_booking(user_id: int, data: dict[str, Any], idempotency_key: str | None = None) -> dict[str, Any]:
    now = _utc_now()
    with database() as connection:
        existing_id = _claim_idempotency(connection, user_id, "create_booking", idempotency_key, data)
        if existing_id is not None:
            return _fetch_one(connection, """SELECT bookings.*, tours.title AS tour_title, tours.city, tours.duration, tours.image_url, tours.price FROM bookings JOIN tours ON tours.id = bookings.tour_id WHERE bookings.id = %s""", (existing_id,)) or {}
        # Locking the tour serializes capacity checks for the same departure and
        # prevents two last-seat requests from both succeeding.
        tour = _fetch_one(connection, "SELECT capacity FROM tours WHERE id = %s AND published = TRUE FOR UPDATE", (data["tour_id"],))
        if not tour:
            return {}
        reserved = _fetch_one(
            connection,
            """SELECT COALESCE(SUM(travellers), 0) AS total FROM bookings
            WHERE tour_id = %s AND travel_date = %s AND booking_status IN ('pending', 'confirmed')""",
            (data["tour_id"], data["travel_date"]),
        )
        if int((reserved or {"total": 0})["total"]) + int(data["travellers"]) > int(tour["capacity"]):
            raise ValueError("This departure no longer has enough available places")
        booking_id = _insert_and_get_id(
            connection,
            """INSERT INTO bookings
            (user_id, tour_id, travel_date, travellers, contact_phone, special_requests, booking_status, payment_status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending', 'unpaid', %s, %s)""",
            (
                user_id,
                data["tour_id"],
                data["travel_date"],
                data["travellers"],
                data.get("contact_phone", ""),
                data.get("special_requests", ""),
                now,
                now,
            ),
        )
        _complete_idempotency(connection, user_id, "create_booking", idempotency_key, booking_id)
        return _fetch_one(
            connection,
            """SELECT bookings.*, tours.title AS tour_title, tours.city, tours.duration, tours.image_url, tours.price
            FROM bookings JOIN tours ON tours.id = bookings.tour_id WHERE bookings.id = %s""",
            (booking_id,),
        ) or {}


def list_user_bookings(user_id: int) -> list[dict[str, Any]]:
    with database() as connection:
        return _fetch_all(
            connection,
            """SELECT bookings.*, tours.title AS tour_title, tours.city, tours.duration, tours.image_url, tours.price
            FROM bookings JOIN tours ON tours.id = bookings.tour_id
            WHERE bookings.user_id = %s ORDER BY bookings.travel_date ASC, bookings.id DESC""",
            (user_id,),
        )


def get_booking(booking_id: int) -> dict[str, Any] | None:
    with database() as connection:
        return _fetch_one(
            connection,
            """SELECT bookings.*, users.name AS customer_name, users.email AS customer_email,
            tours.title AS tour_title, tours.city, tours.duration, tours.image_url, tours.price, tours.guide_name
            FROM bookings JOIN users ON users.id = bookings.user_id
            JOIN tours ON tours.id = bookings.tour_id WHERE bookings.id = %s""",
            (booking_id,),
        )


def create_razorpay_order(
    razorpay_order_id: str,
    booking_id: int,
    user_id: int,
    amount: int,
    currency: str,
    receipt: str,
    terms_version: str,
) -> None:
    """Persist the server-created order before sending it to the browser."""
    with database() as connection:
        _execute(
            connection,
            """INSERT INTO razorpay_orders
            (razorpay_order_id, booking_id, user_id, amount, currency, receipt, terms_version,
             terms_accepted_at, payment_status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'created', %s)""",
            (
                razorpay_order_id,
                booking_id,
                user_id,
                amount,
                currency,
                receipt,
                terms_version,
                _utc_now(),
                _utc_now(),
            ),
        )


def complete_razorpay_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    user_id: int,
) -> tuple[dict[str, Any] | None, bool]:
    """Record a verified Razorpay payment and mark its booking as paid atomically.

    The order must belong to the requesting customer. A repeated callback for
    the same payment is safe; a second payment for an already-paid booking is
    rejected so it can be handled as an exception/refund instead.
    """
    with database() as connection:
        order = _fetch_one(
            connection,
            """SELECT razorpay_orders.*, razorpay_orders.payment_status AS razorpay_payment_status,
            bookings.booking_status, bookings.payment_status AS booking_payment_status
            FROM razorpay_orders JOIN bookings ON bookings.id = razorpay_orders.booking_id
            WHERE razorpay_orders.razorpay_order_id = %s AND razorpay_orders.user_id = %s
            FOR UPDATE""",
            (razorpay_order_id, user_id),
        )
        if not order:
            return None, False

        newly_verified = False
        if order["razorpay_payment_status"] == "verified":
            if order["razorpay_payment_id"] != razorpay_payment_id:
                raise ValueError("This Razorpay order was already verified with another payment")
            booking_id = int(order["booking_id"])
        else:
            if order["booking_status"] == "cancelled":
                raise ValueError("Cancelled bookings cannot be paid")
            if order["booking_payment_status"] == "paid":
                raise ValueError("This booking has already been paid")
            now = _utc_now()
            _execute(
                connection,
                """UPDATE razorpay_orders
                SET razorpay_payment_id = %s, razorpay_signature = %s,
                    payment_status = 'verified', verified_at = %s
                WHERE razorpay_order_id = %s""",
                (razorpay_payment_id, razorpay_signature, now, razorpay_order_id),
            )
            _execute(
                connection,
                """UPDATE bookings SET booking_status = 'confirmed', payment_status = 'paid',
                updated_at = %s WHERE id = %s""",
                (now, int(order["booking_id"])),
            )
            booking_id = int(order["booking_id"])
            newly_verified = True

    return get_booking(booking_id), newly_verified


def list_staff_bookings() -> list[dict[str, Any]]:
    with database() as connection:
        return _fetch_all(
            connection,
            """SELECT bookings.*, users.name AS customer_name, users.email AS customer_email,
            tours.title AS tour_title, tours.city, tours.duration, tours.image_url, tours.price, tours.guide_name
            FROM bookings JOIN users ON users.id = bookings.user_id
            JOIN tours ON tours.id = bookings.tour_id
            ORDER BY bookings.travel_date ASC, bookings.id DESC""",
        )


def update_booking(booking_id: int, booking_status: str | None = None) -> dict[str, Any] | None:
    updates: list[str] = []
    parameters: list[Any] = []
    if booking_status is not None:
        updates.append("booking_status = %s")
        parameters.append(booking_status)
    if not updates:
        return get_booking(booking_id)
    updates.append("updated_at = %s")
    parameters.append(_utc_now())
    parameters.append(booking_id)
    with database() as connection:
        _execute(connection, f"UPDATE bookings SET {', '.join(updates)} WHERE id = %s", tuple(parameters))
    return get_booking(booking_id)


def update_tour_schedule(tour_id: int, capacity: int, departure_date: Any, guide_name: str | None) -> dict[str, Any] | None:
    with database() as connection:
        _execute(
            connection,
            "UPDATE tours SET capacity = %s, departure_date = %s, guide_name = %s, updated_at = %s WHERE id = %s",
            (capacity, departure_date, guide_name or None, _utc_now(), tour_id),
        )
        row = _fetch_one(connection, "SELECT * FROM tours WHERE id = %s", (tour_id,))
        tours = _attach_tour_reviews(connection, [row] if row else [])
    return tours[0] if tours else None


def queue_booking_confirmation(booking_id: int, recipient: str, channel: str, requested_by: int | None) -> dict[str, Any]:
    with database() as connection:
        notification_id = _insert_and_get_id(
            connection,
            """INSERT INTO notification_logs (booking_id, channel, recipient, delivery_status, requested_by, created_at)
            VALUES (%s, %s, %s, 'queued', %s, %s)""",
            (booking_id, channel, recipient, requested_by, _utc_now()),
        )
        return _fetch_one(connection, "SELECT * FROM notification_logs WHERE id = %s", (notification_id,)) or {}


def update_booking_confirmation_status(notification_id: int, delivery_status: str) -> dict[str, Any]:
    """Store the provider hand-off result without retaining message contents."""
    if delivery_status not in {"sent", "failed"}:
        raise ValueError("Unsupported notification delivery status")
    with database() as connection:
        _execute(
            connection,
            "UPDATE notification_logs SET delivery_status = %s WHERE id = %s",
            (delivery_status, notification_id),
        )
        return _fetch_one(connection, "SELECT * FROM notification_logs WHERE id = %s", (notification_id,)) or {}


def create_contact_enquiry(data: dict[str, str]) -> dict[str, Any]:
    now = _utc_now()
    with database() as connection:
        enquiry_id = _insert_and_get_id(
            connection,
            """INSERT INTO contact_enquiries
            (name, email, phone, subject, message, status, admin_notes, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, 'new', '', %s, %s)""",
            (data["name"], data["email"], data["phone"], data["subject"], data["message"], now, now),
        )
        row = _fetch_one(connection, "SELECT * FROM contact_enquiries WHERE id = %s", (enquiry_id,))
    return row or {}


def list_contact_enquiries() -> list[dict[str, Any]]:
    with database() as connection:
        return _fetch_all(connection, "SELECT * FROM contact_enquiries ORDER BY id DESC")


def update_contact_enquiry(enquiry_id: int, data: dict[str, str]) -> dict[str, Any] | None:
    with database() as connection:
        _execute(
            connection,
            "UPDATE contact_enquiries SET status = %s, admin_notes = %s, updated_at = %s WHERE id = %s",
            (data["status"], data["admin_notes"], _utc_now(), enquiry_id),
        )
        return _fetch_one(connection, "SELECT * FROM contact_enquiries WHERE id = %s", (enquiry_id,))


def delete_contact_enquiry(enquiry_id: int) -> bool:
    with database() as connection:
        rowcount = _execute(connection, "DELETE FROM contact_enquiries WHERE id = %s", (enquiry_id,))
    return rowcount > 0


def create_custom_journey(data: dict[str, Any]) -> dict[str, Any]:
    now = _utc_now()
    with database() as connection:
        journey_id = _insert_and_get_id(
            connection,
            """INSERT INTO custom_journeys
            (name, email, phone, destinations, start_date, duration, travellers, budget, interests, status, admin_notes, quote, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'new', '', '', %s, %s)""",
            (data["name"], data["email"], data["phone"], data["destinations"], data.get("start_date"), data["duration"], data["travellers"], data["budget"], data["interests"], now, now),
        )
        row = _fetch_one(connection, "SELECT * FROM custom_journeys WHERE id = %s", (journey_id,))
    return row or {}


def list_custom_journeys() -> list[dict[str, Any]]:
    with database() as connection:
        return _fetch_all(connection, "SELECT * FROM custom_journeys ORDER BY id DESC")


def update_custom_journey(journey_id: int, data: dict[str, str]) -> dict[str, Any] | None:
    with database() as connection:
        _execute(
            connection,
            "UPDATE custom_journeys SET status = %s, admin_notes = %s, quote = %s, updated_at = %s WHERE id = %s",
            (data["status"], data["admin_notes"], data["quote"], _utc_now(), journey_id),
        )
        return _fetch_one(connection, "SELECT * FROM custom_journeys WHERE id = %s", (journey_id,))


def delete_custom_journey(journey_id: int) -> bool:
    with database() as connection:
        rowcount = _execute(connection, "DELETE FROM custom_journeys WHERE id = %s", (journey_id,))
    return rowcount > 0


def _paginate_admin_records(
    table: str,
    search_columns: tuple[str, ...],
    page: int,
    page_size: int,
    search: str | None,
    order_by: str = "id DESC",
) -> tuple[list[dict[str, Any]], int]:
    where_clause = ""
    parameters: tuple[Any, ...] = ()
    if search:
        where_clause = f" WHERE LOWER(CONCAT_WS(' ', {', '.join(search_columns)})) LIKE LOWER(%s)"
        parameters = (f"%{search.strip()}%",)
    offset = (page - 1) * page_size
    with database() as connection:
        total_row = _fetch_one(connection, f"SELECT COUNT(*) AS total FROM {table}{where_clause}", parameters)
        rows = _fetch_all(
            connection,
            f"SELECT * FROM {table}{where_clause} ORDER BY {order_by} LIMIT %s OFFSET %s",
            parameters + (page_size, offset),
        )
    return rows, int((total_row or {"total": 0})["total"])


def paginate_admin_tours(page: int, page_size: int, search: str | None = None) -> tuple[list[dict[str, Any]], int]:
    rows, total = _paginate_admin_records(
        "tours", ("title", "description", "city", "mode", "trip_type", "category", "duration", "tag"), page, page_size, search, "featured DESC, id DESC"
    )
    with database() as connection:
        # Load related reviews in one query for the current page.
        tour_ids = [int(row["id"]) for row in rows]
        if tour_ids:
            placeholders = ", ".join("%s" for _ in tour_ids)
            review_rows = _fetch_all(
                connection,
                f"SELECT * FROM reviews WHERE tour_id IN ({placeholders}) ORDER BY id",
                tuple(tour_ids),
            )
        else:
            review_rows = []
    tours = [row_to_dict(row) for row in rows]
    by_id = {int(tour["id"]): tour for tour in tours}
    for tour in tours:
        tour["review_items"] = []
    for review_row in review_rows:
        review = _review_to_dict(review_row)
        if review["tour_id"] in by_id:
            by_id[review["tour_id"]]["review_items"].append(review)
    return tours, total


def list_home_reviews() -> list[dict[str, Any]]:
    with database() as connection:
        rows = _fetch_all(
            connection,
            """SELECT r.*, t.title AS tour_name FROM reviews r
            JOIN tours t ON t.id = r.tour_id
            WHERE r.show_on_home = TRUE
            ORDER BY r.id DESC LIMIT 3""",
        )
    return [{**_review_to_dict(row), "tour_name": row["tour_name"]} for row in rows]


def paginate_admin_reviews(
    page: int, page_size: int, search: str | None = None,
) -> tuple[list[dict[str, Any]], int, int]:
    where_clause = ""
    parameters: tuple[Any, ...] = ()
    if search:
        where_clause = " WHERE LOWER(CONCAT_WS(' ', r.name, r.review_heading, r.review_point, r.source, t.title)) LIKE LOWER(%s)"
        parameters = (f"%{search.strip()}%",)
    offset = (page - 1) * page_size
    with database() as connection:
        total_row = _fetch_one(
            connection,
            "SELECT COUNT(*) AS total FROM reviews r JOIN tours t ON t.id = r.tour_id" + where_clause,
            parameters,
        )
        rows = _fetch_all(
            connection,
            """SELECT r.*, t.title AS tour_name FROM reviews r
            JOIN tours t ON t.id = r.tour_id""" + where_clause
            + " ORDER BY r.id DESC LIMIT %s OFFSET %s",
            parameters + (page_size, offset),
        )
        home_count_row = _fetch_one(
            connection, "SELECT COUNT(*) AS total FROM reviews WHERE show_on_home = TRUE",
        )
    items = [{**_review_to_dict(row), "tour_name": row["tour_name"]} for row in rows]
    return items, int((total_row or {"total": 0})["total"]), int((home_count_row or {"total": 0})["total"])


def set_review_home_visibility(review_id: int, enabled: bool) -> dict[str, Any] | None:
    with database() as connection:
        lock_name = "nomad_wanderers_home_reviews_limit"
        lock = _fetch_one(connection, "SELECT GET_LOCK(%s, 5) AS acquired", (lock_name,))
        if not lock or int(lock["acquired"] or 0) != 1:
            raise RuntimeError("The home review selection is busy. Please try again.")
        try:
            row = _fetch_one(connection, "SELECT id, show_on_home FROM reviews WHERE id = %s FOR UPDATE", (review_id,))
            if not row:
                return None
            if enabled and not bool(row["show_on_home"]):
                count_row = _fetch_one(connection, "SELECT COUNT(*) AS total FROM reviews WHERE show_on_home = TRUE")
                if int((count_row or {"total": 0})["total"]) >= 3:
                    raise ValueError("Only three reviews can be shown in Traveller stories at a time.")
            _execute(
                connection,
                "UPDATE reviews SET show_on_home = %s, updated_at = %s WHERE id = %s",
                (enabled, _utc_now(), review_id),
            )
            updated = _fetch_one(
                connection,
                """SELECT r.*, t.title AS tour_name FROM reviews r
                JOIN tours t ON t.id = r.tour_id WHERE r.id = %s""",
                (review_id,),
            )
            # Commit before releasing the named lock so another toggle sees this selection.
            connection.commit()
        finally:
            _fetch_one(connection, "SELECT RELEASE_LOCK(%s) AS released", (lock_name,))
    return {**_review_to_dict(updated), "tour_name": updated["tour_name"]} if updated else None


def paginate_public_tours(
    page: int,
    page_size: int,
    city: str | None = None,
    mode: str | None = None,
    trip_type: str | None = None,
    category: str | None = None,
    search: str | None = None,
    multi_day: bool = False,
) -> tuple[list[dict[str, Any]], int]:
    clauses = ["published = TRUE"]
    parameters: list[Any] = []
    for column, value in (("city", city), ("mode", mode), ("trip_type", trip_type)):
        if value:
            clauses.append(f"LOWER({column}) = LOWER(%s)")
            parameters.append(value)
    if multi_day:
        clauses.append("trip_type IN ('Weekly trip', 'Multi-day trip')")
    elif not trip_type:
        clauses.append("trip_type NOT IN ('Weekly trip', 'Multi-day trip')")
    if category:
        clauses.append(
            "(LOWER(category) = LOWER(%s) OR JSON_CONTAINS(categories, JSON_QUOTE(%s)))"
        )
        parameters.extend((category, category))
    if search:
        clauses.append("LOWER(CONCAT_WS(' ', title, description, city, category, categories, mode, trip_type)) LIKE LOWER(%s)")
        parameters.append(f"%{search.strip()}%")
    where_clause = f" WHERE {' AND '.join(clauses)}"
    offset = (page - 1) * page_size
    with database() as connection:
        total_row = _fetch_one(connection, f"SELECT COUNT(*) AS total FROM tours{where_clause}", tuple(parameters))
        rows = _fetch_all(
            connection,
            f"SELECT * FROM tours{where_clause} ORDER BY featured DESC, id DESC LIMIT %s OFFSET %s",
            tuple(parameters) + (page_size, offset),
        )
        tours = _attach_tour_reviews(connection, rows)
    return tours, int((total_row or {"total": 0})["total"])


def paginate_contact_enquiries(page: int, page_size: int, search: str | None = None) -> tuple[list[dict[str, Any]], int]:
    return _paginate_admin_records(
        "contact_enquiries", ("name", "email", "phone", "subject", "message", "status", "admin_notes"), page, page_size, search
    )


def paginate_custom_journeys(page: int, page_size: int, search: str | None = None) -> tuple[list[dict[str, Any]], int]:
    return _paginate_admin_records(
        "custom_journeys", ("name", "email", "phone", "destinations", "duration", "travellers", "budget", "interests", "status", "admin_notes", "quote"), page, page_size, search
    )


def admin_report() -> dict[str, int]:
    with database() as connection:
        users = _fetch_one(connection, "SELECT COUNT(*) AS total FROM users WHERE role = 'customer'") or {"total": 0}
        bookings = _fetch_one(connection, "SELECT COUNT(*) AS total FROM bookings") or {"total": 0}
        confirmed = _fetch_one(connection, "SELECT COUNT(*) AS total FROM bookings WHERE booking_status = 'confirmed'") or {"total": 0}
        razorpay_payments = _fetch_one(connection, "SELECT COUNT(*) AS total FROM razorpay_orders WHERE payment_status = 'verified'") or {"total": 0}
    return {"customers": int(users["total"]), "bookings": int(bookings["total"]), "confirmed_bookings": int(confirmed["total"]), "razorpay_payments": int(razorpay_payments["total"])}
