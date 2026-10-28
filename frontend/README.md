# SAZU Study Hub

The SAZU Study Hub frontend is a React, TypeScript, and Vite application connected to the FastAPI service.

## Run locally

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` if the backend is not at `http://localhost:8000/api/v1`.
2. Install dependencies with `npm ci`.
3. Start the frontend with `npm run dev`.

The backend must be running and configured to allow the frontend's origin through CORS.

## Validation

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Backend integration

Authentication and account profile operations use `/auth/register`, `/auth/login`, `/auth/me`, and `PATCH /auth/me`. The catalogue, resources, verification, dashboard, subscription package, and payment screens use the corresponding `/academic/catalogue`, `/resources`, `/verification`, `/dashboard`, `/subscriptions/plans`, and `/payments` endpoints.

Resource metadata is available through the catalogue API, and downloads are authorized by the backend. The backend does not currently provide resource preview content or a practice assessment API. The frontend shows an unavailable state rather than invented questions or content.

## Suggested backend API work

- Assessments: `GET /assessments`, `GET /assessments/{id}`, `POST /assessments/{id}/attempts`, `PUT /attempts/{id}/answers`, `POST /attempts/{id}/submit`, and `GET /attempts/{id}/results`.
- Resource previews: `GET /resources/{id}/preview`, with server-side access checks and a limited preview response.
- Password recovery: `POST /auth/password-reset/request` and `POST /auth/password-reset/confirm`.
- Academic profile edits: `GET /students/me/academic-profile` and `PATCH /students/me/academic-profile`, with reverification and audit history where required.
- Support requests: `POST /support/requests` and `GET /support/requests/{id}` if in-app support tracking is needed.
- Administration: provide an admin interface for the existing resource, subscription-package, and verification APIs.
