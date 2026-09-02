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
    "price", "capacity", "schedule_type", "departure_date", "start_time", "guide_name", "highlights", "inclusions", "gallery_images", "faq_items", "review_items", "meeting_details", "traveller_video_url", "private_price", "tag", "featured", "dark", "published",
)


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
            guide_name VARCHAR(120) NULL,
            highlights JSON NOT NULL,
            inclusions JSON NOT NULL,
            gallery_images JSON NOT NULL,
            faq_items JSON NOT NULL,
            review_items JSON NOT NULL,
            meeting_details TEXT NOT NULL,
            traveller_video_url VARCHAR(2048) NULL,
            private_price DECIMAL(12, 2) NULL,
            tag VARCHAR(40) NULL,
            featured BOOLEAN NOT NULL DEFAULT FALSE,
            dark BOOLEAN NOT NULL DEFAULT FALSE,
            published BOOLEAN NOT NULL DEFAULT TRUE,
            created_at DATETIME(6) NOT NULL,
            updated_at DATETIME(6) NOT NULL
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
        CREATE TABLE IF NOT EXISTS demo_payments (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            booking_id BIGINT NULL,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(254) NOT NULL,
            phone VARCHAR(40) NOT NULL,
            tour_title VARCHAR(180) NOT NULL,
            amount DECIMAL(12, 2) NOT NULL,
            payment_method VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'paid',
            transaction_reference VARCHAR(48) NOT NULL UNIQUE,
            created_at DATETIME(6) NOT NULL
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
            ("tours", "guide_name", "VARCHAR(120) NULL"),
            ("tours", "inclusions", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "gallery_images", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "faq_items", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "review_items", "JSON NOT NULL DEFAULT (JSON_ARRAY())"),
            ("tours", "meeting_details", "TEXT NOT NULL"),
            ("tours", "traveller_video_url", "VARCHAR(2048) NULL"),
            ("tours", "private_price", "DECIMAL(12, 2) NULL"),
            ("users", "username", "VARCHAR(80) NULL"),
            ("users", "phone", "VARCHAR(40) NOT NULL DEFAULT ''"),
            ("users", "role", "VARCHAR(20) NOT NULL DEFAULT 'customer'"),
            ("users", "is_active", "BOOLEAN NOT NULL DEFAULT TRUE"),
            ("demo_payments", "booking_id", "BIGINT NULL"),
        ):
            _ensure_column(connection, table, column, definition)
        _execute(connection, "UPDATE users SET username = CONCAT('user', id) WHERE username IS NULL OR username = ''")
        _execute(connection, "ALTER TABLE users MODIFY COLUMN username VARCHAR(80) NOT NULL")
        _ensure_index(connection, "users", "users_username_unique", "username", unique=True)
        _ensure_index(connection, "contact_enquiries", "contact_enquiries_created_at_idx", "created_at")
        _ensure_index(connection, "custom_journeys", "custom_journeys_created_at_idx", "created_at")
        _ensure_index(connection, "demo_payments", "demo_payments_booking_idx", "booking_id")
        _ensure_index(connection, "demo_payments", "demo_payments_created_at_idx", "created_at")
        _ensure_index(connection, "users", "users_email_idx", "email")
        _ensure_index(connection, "bookings", "bookings_user_created_idx", "user_id, created_at")
        _ensure_index(connection, "notification_logs", "notification_logs_booking_created_idx", "booking_id, created_at")


def health() -> str:
    try:
        with database() as connection:
            _fetch_one(connection, "SELECT 1 AS healthy")
        return "ok"
    except Exception:
        return "unavailable"


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


def row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    tour = dict(row)
    for field in ("highlights", "inclusions", "gallery_images", "faq_items", "review_items"):
        value = tour.get(field, [])
        tour[field] = json.loads(value) if isinstance(value, str) else value
    for field in ("featured", "dark", "published"):
        tour[field] = bool(tour[field])
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
    return [row_to_dict(row) for row in rows]


def get_tour(tour_id: int) -> dict[str, Any] | None:
    with database() as connection:
        row = _fetch_one(connection, "SELECT * FROM tours WHERE id = %s AND published = TRUE", (tour_id,))
    return row_to_dict(row) if row else None


def save_tour(data: dict[str, Any], tour_id: int | None = None) -> dict[str, Any] | None:
    defaults: dict[str, Any] = {
        "inclusions": [], "gallery_images": [], "faq_items": [], "review_items": [],
        "meeting_details": "", "traveller_video_url": None, "private_price": None,
    }
    values = {field: data.get(field, defaults.get(field)) for field in TOUR_COLUMNS}
    for field in ("highlights", "inclusions", "gallery_images", "faq_items", "review_items"):
        values[field] = json.dumps(values[field])
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
            update_values = tuple(values[field] for field in TOUR_COLUMNS) + (now, tour_id)
            _execute(
                connection,
                f"UPDATE tours SET {', '.join(f'{field} = %s' for field in TOUR_COLUMNS)}, updated_at = %s WHERE id = %s",
                update_values,
            )
        row = _fetch_one(connection, "SELECT * FROM tours WHERE id = %s", (tour_id,))
    return row_to_dict(row) if row else None


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
                f"DELETE FROM demo_payments WHERE booking_id IN ({booking_placeholders})",
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
            (user_id, tour_id, travel_date, travellers, special_requests, booking_status, payment_status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, 'pending', 'unpaid', %s, %s)""",
            (user_id, data["tour_id"], data["travel_date"], data["travellers"], data.get("special_requests", ""), now, now),
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


def update_booking(booking_id: int, booking_status: str | None = None, payment_status: str | None = None) -> dict[str, Any] | None:
    updates: list[str] = []
    parameters: list[Any] = []
    if booking_status is not None:
        updates.append("booking_status = %s")
        parameters.append(booking_status)
    if payment_status is not None:
        updates.append("payment_status = %s")
        parameters.append(payment_status)
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
    return row_to_dict(row) if row else None


def queue_booking_confirmation(booking_id: int, recipient: str, channel: str, requested_by: int | None) -> dict[str, Any]:
    with database() as connection:
        notification_id = _insert_and_get_id(
            connection,
            """INSERT INTO notification_logs (booking_id, channel, recipient, delivery_status, requested_by, created_at)
            VALUES (%s, %s, %s, 'queued', %s, %s)""",
            (booking_id, channel, recipient, requested_by, _utc_now()),
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


def create_demo_payment(data: dict[str, Any]) -> dict[str, Any]:
    from uuid import uuid4

    reference = f"DEMO-{uuid4().hex[:12].upper()}"
    with database() as connection:
        payment_id = _insert_and_get_id(
            connection,
            """INSERT INTO demo_payments
            (booking_id, name, email, phone, tour_title, amount, payment_method, status, transaction_reference, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'paid', %s, %s)""",
            (data.get("booking_id"), data["name"], data["email"], data["phone"], data["tour_title"], data["amount"], data["payment_method"], reference, _utc_now()),
        )
        row = _fetch_one(connection, "SELECT * FROM demo_payments WHERE id = %s", (payment_id,))
    return row or {}


def create_booking_demo_payment(booking: dict[str, Any], customer: dict[str, Any], payment_method: str, idempotency_key: str | None = None) -> dict[str, Any]:
    data = {"booking_id": booking["id"], "payment_method": payment_method}
    user_id = int(customer["id"])
    with database() as connection:
        existing_id = _claim_idempotency(connection, user_id, "booking_payment", idempotency_key, data)
        if existing_id is not None:
            return _fetch_one(connection, "SELECT * FROM demo_payments WHERE id = %s", (existing_id,)) or {}
        locked = _fetch_one(connection, "SELECT payment_status, booking_status FROM bookings WHERE id = %s FOR UPDATE", (booking["id"],))
        if not locked or locked["booking_status"] == "cancelled":
            raise ValueError("Cancelled or missing bookings cannot be paid")
        existing = _fetch_one(connection, "SELECT * FROM demo_payments WHERE booking_id = %s ORDER BY id LIMIT 1", (booking["id"],))
        if existing:
            if idempotency_key:
                _complete_idempotency(connection, user_id, "booking_payment", idempotency_key, int(existing["id"]))
                return existing
            raise ValueError("This booking is already paid")
        reference = f"DEMO-{secrets.token_hex(6).upper()}"
        payment_id = _insert_and_get_id(connection, """INSERT INTO demo_payments (booking_id, name, email, phone, tour_title, amount, payment_method, status, transaction_reference, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, 'paid', %s, %s)""", (booking["id"], customer["name"], customer["email"], customer.get("phone", ""), booking["tour_title"], float(booking["price"]) * int(booking["travellers"]), payment_method, reference, _utc_now()))
        _execute(connection, "UPDATE bookings SET booking_status = 'confirmed', payment_status = 'paid', updated_at = %s WHERE id = %s", (_utc_now(), booking["id"]))
        _complete_idempotency(connection, user_id, "booking_payment", idempotency_key, payment_id)
        return _fetch_one(connection, "SELECT * FROM demo_payments WHERE id = %s", (payment_id,)) or {}


def list_demo_payments() -> list[dict[str, Any]]:
    with database() as connection:
        return _fetch_all(connection, "SELECT * FROM demo_payments ORDER BY id DESC")


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
    return [row_to_dict(row) for row in rows], total


def paginate_public_tours(
    page: int,
    page_size: int,
    city: str | None = None,
    mode: str | None = None,
    trip_type: str | None = None,
    category: str | None = None,
    search: str | None = None,
) -> tuple[list[dict[str, Any]], int]:
    clauses = ["published = TRUE"]
    parameters: list[Any] = []
    for column, value in (("city", city), ("mode", mode), ("trip_type", trip_type)):
        if value:
            clauses.append(f"LOWER({column}) = LOWER(%s)")
            parameters.append(value)
    if category:
        clauses.append("LOWER(category) LIKE LOWER(%s)")
        parameters.append(f"%{category}%")
    if search:
        clauses.append("LOWER(CONCAT_WS(' ', title, description, city, category, mode, trip_type)) LIKE LOWER(%s)")
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
    return [row_to_dict(row) for row in rows], int((total_row or {"total": 0})["total"])


def paginate_contact_enquiries(page: int, page_size: int, search: str | None = None) -> tuple[list[dict[str, Any]], int]:
    return _paginate_admin_records(
        "contact_enquiries", ("name", "email", "phone", "subject", "message", "status", "admin_notes"), page, page_size, search
    )


def paginate_custom_journeys(page: int, page_size: int, search: str | None = None) -> tuple[list[dict[str, Any]], int]:
    return _paginate_admin_records(
        "custom_journeys", ("name", "email", "phone", "destinations", "duration", "travellers", "budget", "interests", "status", "admin_notes", "quote"), page, page_size, search
    )


def paginate_demo_payments(page: int, page_size: int, search: str | None = None) -> tuple[list[dict[str, Any]], int]:
    return _paginate_admin_records(
        "demo_payments", ("name", "email", "phone", "tour_title", "payment_method", "status", "transaction_reference"), page, page_size, search
    )


def admin_report() -> dict[str, int | float]:
    with database() as connection:
        users = _fetch_one(connection, "SELECT COUNT(*) AS total FROM users WHERE role = 'customer'") or {"total": 0}
        bookings = _fetch_one(connection, "SELECT COUNT(*) AS total FROM bookings") or {"total": 0}
        confirmed = _fetch_one(connection, "SELECT COUNT(*) AS total FROM bookings WHERE booking_status = 'confirmed'") or {"total": 0}
        paid = _fetch_one(connection, "SELECT COALESCE(SUM(amount), 0) AS total FROM demo_payments WHERE status = 'paid'") or {"total": 0}
    return {"customers": int(users["total"]), "bookings": int(bookings["total"]), "confirmed_bookings": int(confirmed["total"]), "demo_payment_total": float(paid["total"])}
