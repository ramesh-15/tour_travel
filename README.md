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
