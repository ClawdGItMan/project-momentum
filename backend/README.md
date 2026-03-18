# Project Momentum Backend

Phase 0 adds the first real backend foundation without destabilizing the Expo app at the repo root.

## Scope

- Supabase owns auth, Postgres, and row-level security.
- This `backend/` package owns privileged backend work that should not live in the mobile client:
  - auth bootstrap
  - provider OAuth callbacks
  - webhook ingestion
  - background jobs
  - token custody

## Runbook

1. Copy the root [`.env.example`](/Users/me/Projects/Lifestyle%20App/.env.example) to `backend/.env` and fill in real values.
2. If you are targeting a hosted Supabase project from local development, use the project pooler connection string in `DATABASE_URL`. If the local machine cannot validate the pooler certificate chain yet, append `?sslmode=no-verify` for local-only use.
3. Install backend dependencies:
   `npm --prefix backend install`
4. Start local Supabase:
   `npm run supabase:start`
5. Apply the schema locally:
   `npm run supabase:db:reset`
6. Start the backend API:
   `npm run backend:dev`
7. In a second terminal, start the worker when you need queue consumers:
   `npm run backend:worker`

## Current Phase 0 Endpoints

- `GET /health`
- `GET /ready`
- `POST /auth/bootstrap`
- `GET /me`
- `PATCH /me`
- `POST /integrations/strava/connect`
- `GET /integrations/strava/callback`
- `POST /integrations/whoop/connect`
- `GET /integrations/whoop/callback`
- `GET /webhooks/strava`
- `POST /webhooks/strava`
- `POST /webhooks/whoop`

Most integration endpoints are still explicit stubs. That is intentional for Phase 0. The goal here is to land the trust boundary, schema, and runtime skeleton first.
