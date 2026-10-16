# Nomad Wanderers Backend

FastAPI backend for the Nomad Wanderers frontend. It provides public tour browsing and request submission, plus JWT-protected admin management for tours, contact enquiries, and custom journeys.

## Prerequisites

- Python 3.11 or later
- pip

## Setup and start

Run these commands from the `backend` directory:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
$env:JWT_SECRET = "replace-this-with-a-long-random-production-secret"
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

- Health check: `http://localhost:8000/health`
- Interactive API docs: `http://localhost:8000/docs`

`--reload` is for development only. Remove it in production.

## Configuration

Set these as PowerShell environment variables before starting Uvicorn:

```powershell
$env:JWT_SECRET = "a-long-random-secret"
$env:CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
$env:ASSET_BASE_URL = "http://localhost:8000"
```

Copy `.env.example` to `.env` and fill in the provider values for Razorpay,
PayPal, AWS SES, and Meta WhatsApp Cloud API. The application reads all
provider credentials from `.env` or the process environment through
`config.py`. Never commit `.env`; it is ignored by Git. Production deployments
should set the same names in the hosting platform's secret manager. For PayPal
sandbox, use `PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com`.

## INR and USD checkout

Customers can select Indian Rupees (INR) or US Dollars (USD). Tour and booking
prices remain stored in INR. USD payments are converted on the server using
Frankfurter reference rates, rounded to cents, and created as USD Razorpay orders.
Enable international payments on the Razorpay merchant account for USD checkout.

`GET /api/exchange-rates` supplies the display rate. Authenticated customers use
`GET /api/bookings/{booking_id}/payment-quote?currency=USD` (or `INR`) to confirm
the amount before payment. The signed quote expires after ten minutes and is
bound to the customer, booking, currency and saved booking total. Send its
`amount`, `currency` and `quote_token` to `/api/create-order` alongside the booking
ID, receipt and payment-terms acknowledgement. The server rejects modified or
expired quotes. A rate outage prevents new USD quotes. Existing INR requests
without a quote still work.

Rate requests identify the application to Frankfurter and fall back to its v2
INR/USD pair endpoint if the primary endpoint fails. Both responses are validated
and cached for one hour; no guessed or expired cached rate is used for payments.

Deploy the frontend and backend changes together. Restart the API after updating
unless the development server is already running with `--reload`.

## Idempotency and booking safety

Send a stable `Idempotency-Key` header (8-200 characters) when creating a
booking or paying for one. Retrying the same request with the same key returns
the original resource; reusing a key with different input returns HTTP 409.

```http
POST /api/bookings/123/demo-payment
Idempotency-Key: booking-123-payment-attempt-1
```

Keys and their resource IDs are persisted in MySQL, so behavior survives API
restarts. Seat availability is checked inside a
transaction while the tour row is locked, preventing concurrent last-seat
bookings from overselling. Payment creation and booking confirmation are also
one transaction. Notification requests are only queued; an email or WhatsApp
provider failure never rolls back a successful booking/payment.

Use a private, randomly generated `JWT_SECRET` in production. The backend reads `db.env` only for database credentials; set other values in the environment or configure your deployment platform.

Set `ASSET_BASE_URL` to the public backend URL before running `seed_tours.py` in production, for example `https://api.example.com`. This makes seeded tour image links point to the deployed backend instead of localhost.

## Database

MySQL is used for application data. The backend reads server-only credentials from `backend/db.env` and creates the required tables and indexes on startup.

```text
database_name=your_database
host=localhost
port=3306
username=your_mysql_user
password=your_mysql_password
```

The database starts empty—tours must be created from the admin dashboard. Schema and database access code are kept in `db_models.py`; API routes and authentication are in `main.py`.

You may override these values with `MYSQL_DATABASE`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, and `MYSQL_PASSWORD`.

### MySQL connection pooling

All database helpers share one thread-safe Connector/Python pool per backend
process. Connections are reused across requests; successful operations commit,
failures roll back, and connections are reset and returned to the pool in either
case. The pool is created on first use (normally during application startup).

Configure these optional settings in `docker.env` when using Compose, or in the
process environment / `backend/.env` when running Uvicorn directly:

```env
WEB_CONCURRENCY=2
MYSQL_POOL_SIZE=30
MYSQL_POOL_ACQUIRE_TIMEOUT=5
MYSQL_CONNECT_TIMEOUT=10
```

`MYSQL_POOL_SIZE` defaults to 30 and accepts 1–32 connections per backend worker, following the
[Connector/Python pool limits](https://dev.mysql.com/doc/connector-python/en/connector-python-connection-pooling.html).
It limits concurrent database operations, not logged-in users. Extra operations
wait up to `MYSQL_POOL_ACQUIRE_TIMEOUT` seconds for a free connection; if none
becomes available, the API returns HTTP 503 with a retry message and
`Retry-After: 1`. The wait timeout must be greater than zero and at most 60 seconds.
`MYSQL_CONNECT_TIMEOUT` is the socket connection timeout in whole seconds (1–60).
Session reset prevents a previous request's session settings from leaking into
the next request.

Each additional backend worker or replica has its own pool. Keep the combined
pool sizes below MySQL's `max_connections`, leaving room for administration and
other database clients. Docker defaults to two Uvicorn workers via
`WEB_CONCURRENCY=2`, so the default database connection budget is 60 connections
per backend container (2 workers × 30). Uvicorn reads this environment variable
when `--workers` is not explicitly supplied. Do not use `--reload` in production.
For direct Uvicorn commands, set `WEB_CONCURRENCY` in the process environment or
pass `--workers 2`; putting it only in `backend/.env` is too late for Uvicorn's
worker-manager configuration.

Database initialization is serialized across workers and replicas with the MySQL
advisory lock `nomad_wanderers_schema_init`. Each worker waits up to 30 seconds to
enter schema setup. Successful initialization commits before releasing the lock;
failed initialization rolls back and releases it before failing startup. This
prevents simultaneous compatibility migrations and duplicate legacy-review
migration. Ordinary API database operations do not acquire this startup lock.

Before deploying, check server CPU/RAM, MySQL's `max_connections`, any account
`MAX_USER_CONNECTIONS` cap, and the connection usage of other applications. Keep
the previous backend image available for rollback. Restart the backend after
changing worker or pool settings. To load
this code into an existing Docker deployment, rebuild/recreate only the backend:

```sh
docker compose --env-file docker.env up --build --detach --no-deps backend
```

This does not remove database volumes; normal compatibility schema setup still
runs during application startup. Pooling
reduces connection setup overhead; it is not proof that the reported production
failure above two users is resolved.

This code change does not copy existing PostgreSQL data into MySQL. Migrate any existing records separately before switching production traffic.

Set `backend/db.env` to your MySQL database credentials. `db.env` is intentionally excluded from Git.

## Authentication

The current development credentials are static:

```text
Username: admin
Password: admin
```

`POST /api/auth/login` returns an eight-hour JWT after validating the configured bootstrap administrator or a MySQL user account. Send it for protected endpoints:

```http
Authorization: Bearer <access_token>
```

`POST /api/admin/logout` stores the revoked token in MySQL. After logout, that token cannot access admin APIs again.

Replace the static credentials with proper user management before production use.

## API endpoints

| Method | Path | Authentication | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Service health check |
| `GET` | `/api/tours` | No | List published tours; supports `city`, `mode`, `trip_type`, `category`, `search`, `page`, and `page_size` |
| `GET` | `/api/tours/{tour_id}` | No | Get one published tour |
| `POST` | `/api/contact-enquiries` | No | Submit a general or booking enquiry |
| `POST` | `/api/custom-journeys` | No | Submit a Design your journey request |
| `POST` | `/api/demo-payments` | No | Complete a non-production demo payment |
| `POST` | `/api/auth/login` | No | Authenticate an admin, staff member, or customer and receive a JWT |
| `POST` | `/api/admin/logout` | JWT | Revoke the current JWT |
| `GET` | `/api/admin/tours` | JWT | List all tours, including drafts |
| `POST` | `/api/admin/tours` | JWT | Create a tour |
| `PUT` | `/api/admin/tours/{tour_id}` | JWT | Update a tour |
| `DELETE` | `/api/admin/tours/{tour_id}` | JWT | Delete a tour |
| `GET` | `/api/admin/contact-enquiries` | JWT | List contact and booking enquiries |
| `PUT` | `/api/admin/contact-enquiries/{enquiry_id}` | JWT | Update enquiry status or follow-up notes |
| `DELETE` | `/api/admin/contact-enquiries/{enquiry_id}` | JWT | Delete an enquiry |
| `GET` | `/api/admin/custom-journeys` | JWT | List Design your journey requests |
| `PUT` | `/api/admin/custom-journeys/{journey_id}` | JWT | Update status, itinerary notes, or quote |
| `DELETE` | `/api/admin/custom-journeys/{journey_id}` | JWT | Delete a custom journey request |
| `GET` | `/api/admin/demo-payments` | JWT | List demo payment records |

All admin list endpoints support server-side pagination and search:

```text
?page=1&page_size=6&search=mumbai
```

`page_size` accepts values from 1 to 100. Each response returns `items`, `total`, `page`, and `page_size`.

## Connecting the frontend

Start this backend on port `8000`, then start the frontend from the project root. The frontend uses `VITE_API_URL` if supplied; otherwise it connects to `http://localhost:8000`.
