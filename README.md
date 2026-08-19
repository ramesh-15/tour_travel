# Nomad Wanderers Frontend

The frontend is a React and Vite single-page application for browsing tours, contacting the team, and accessing the private admin area. The admin UI communicates with the FastAPI service in [`backend/`](backend/README.md).

## Prerequisites

- Node.js 20 or later
- npm (included with Node.js)
- The backend running locally, if you need tours or admin features

## Setup

From the project root:

```powershell
npm install
npm.cmd run dev
```

Vite prints the local address in the terminal. This project is configured to normally use `http://localhost:3000`; if that port is unavailable, use the address Vite prints instead.

## Backend URL

The application uses `http://localhost:8000` by default. To use a different API address, create a `.env.local` file in this folder:

```env
VITE_API_URL=http://localhost:8000
```

## Run the complete application with Docker

Docker Compose runs the React frontend, FastAPI backend, MySQL, and Redis.

1. Copy `docker.env.example` to `docker.env` and replace both database
   passwords.
2. Copy `backend/.env.example` to `backend/.env` if it does not exist. Set a
   strong `JWT_SECRET`, admin credentials, and any Razorpay, PayPal, AWS SES,
   or Meta WhatsApp credentials you use.
3. Build and start everything:

```powershell
docker compose --env-file docker.env up --build -d
```

Open the frontend at `http://localhost:3000`, the API documentation at
`http://localhost:8000/docs`, and the health endpoint at
`http://localhost:8000/health`.

Useful commands:

```powershell
docker compose --env-file docker.env ps
docker compose --env-file docker.env logs -f backend
docker compose --env-file docker.env down
```

`down` preserves MySQL, Redis, and uploaded-image volumes. To intentionally
delete all application data as well, use `docker compose --env-file docker.env
down -v`.

When deploying on another host, set `PUBLIC_API_URL` and
`PUBLIC_FRONTEND_URL` in `docker.env` to their browser-accessible HTTPS URLs,
then rebuild the frontend image.

Restart the Vite server after changing this file. Ensure the frontend origin is included in the backend `CORS_ORIGINS` setting.

## Admin area

Open `/admin` directly, for example `http://localhost:3000/admin`. The page is deliberately not linked in the public navigation.

For the current development setup:

```text
Username: admin
Password: admin
```

On sign-in, the API issues a JWT. The frontend keeps it in browser session storage, uses it for protected admin actions, and removes it when the admin logs out. Change the static development credentials before deploying.

## Production build

```powershell
npm.cmd run build
npm.cmd run preview
```

The production files are generated in `dist/`.

## Useful commands

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
```

See [backend/README.md](backend/README.md) for API setup, SQLite storage, CORS, and endpoint details.
