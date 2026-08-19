# Nomad Wanderers Backend

FastAPI backend for the Nomad Wanderers frontend. It provides public tour browsing and request submission, plus JWT-protected admin management for tours, contact enquiries, and custom journeys.

## Prerequisites

- Python 3.11 or later
- pip
- Redis 6 or later (optional for availability; recommended in production)

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
$env:REDIS_URL = "redis://localhost:6379/0"
$env:CACHE_TTL_SECONDS = "300"
```

Copy `.env.example` to `.env` and fill in the provider values for Razorpay,
PayPal, AWS SES, and Meta WhatsApp Cloud API. The application reads all
provider credentials from `.env` or the process environment through
`config.py`. Never commit `.env`; it is ignored by Git. Production deployments
should set the same names in the hosting platform's secret manager. For PayPal
sandbox, use `PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com`.

Public tour lists and details use a cache-aside Redis cache. Tour create,
update, delete, and schedule changes invalidate those entries. Redis failures
are logged and requests fall back to MySQL, so a cache outage does not take the
booking API down. `/health` reports MySQL and Redis independently.

## Idempotency and booking safety

Send a stable `Idempotency-Key` header (8-200 characters) when creating a
booking or paying for one. Retrying the same request with the same key returns
the original resource; reusing a key with different input returns HTTP 409.

```http
POST /api/bookings/123/demo-payment
Idempotency-Key: booking-123-payment-attempt-1
```

Keys and their resource IDs are persisted in MySQL, so behavior survives API
restarts and does not depend on Redis. Seat availability is checked inside a
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
