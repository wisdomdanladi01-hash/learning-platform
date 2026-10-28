# SAZU Study Hub

SAZU Study Hub is a student resource platform with a React frontend and a FastAPI backend.

## Project folders

- [`frontend/`](./frontend/) — React, TypeScript, and Vite student application.
- [`backend/`](./backend/) — FastAPI API, PostgreSQL persistence, authentication, verification, resources, and payments.

## Local development

Configure and start the backend using the instructions in [`backend/README.md`](./backend/README.md). Configure its `.env` with a dedicated PostgreSQL database and a secure `JWT_SECRET_KEY`.

Then start the frontend:

```powershell
cd frontend
copy .env.example .env
npm ci
npm run dev
```

By default, the frontend connects to `http://localhost:8000/api/v1`. The backend must allow the frontend's local origin in its CORS configuration.

## Checks

Frontend:

```powershell
cd frontend
npm run typecheck
npm run lint
npm run build
```

Backend:

```powershell
cd backend
python -m pytest -q
```

See [`frontend/README.md`](./frontend/README.md) for connected flows and backend API work that remains.
