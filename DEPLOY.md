# Deploy — AMA-MIDI

Two ways to run the full stack: locally with Docker Compose, or on Render for a public live URL.

## Architecture

- `apps/api` — Express + WebSocket + Prisma, containerised (`apps/api/Dockerfile`). Runs `prisma migrate deploy` on boot.
- `apps/web` — React/Vite SPA. Locally served by nginx; on Render served as a Static Site.
- PostgreSQL — Compose service locally, managed database on Render.

The web app talks to the API through two build-time variables baked into the bundle:

- `VITE_API_URL` — REST base, e.g. `https://ama-midi-api.onrender.com/api`
- `VITE_WS_URL` — WebSocket base, e.g. `wss://ama-midi-api.onrender.com`

The API restricts origins via `CORS_ORIGINS` (comma-separated) and needs `FRONTEND_BASE_URL`.

## Local — Docker Compose

```bash
docker compose up --build
```

- Web: http://localhost:8080
- API: http://localhost:3000 (health: http://localhost:3000/health)
- Postgres: localhost:5432 (ama / ama)

Migrations run automatically when the api container starts. Stop with `docker compose down` (add `-v` to wipe the database volume).

## Render — live URL (Blueprint)

The repo ships a `render.yaml` Blueprint that provisions all three pieces in one step.

1. Push the repo to GitHub (already the origin).
2. Go to Render → **New** → **Blueprint**, connect the repo. Render reads `render.yaml` and creates:
   - `ama-midi-db` (PostgreSQL, free)
   - `ama-midi-api` (Docker web service, free) — `DATABASE_URL` wired from the DB; `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` auto-generated.
   - `ama-midi-web` (Static Site, free)
3. Click **Apply**. First deploy builds the images and runs `prisma migrate deploy`.

Live URLs (default naming):

- Web: `https://ama-midi-web.onrender.com`
- API: `https://ama-midi-api.onrender.com`

### If a service name is already taken

Render appends a suffix (e.g. `ama-midi-web-xyz.onrender.com`). If that happens, update the cross-references so the two sides match, then redeploy:

- `ama-midi-web` env: `VITE_API_URL` = `https://<actual-api-host>/api`, `VITE_WS_URL` = `wss://<actual-api-host>`
- `ama-midi-api` env: `CORS_ORIGINS` and `FRONTEND_BASE_URL` = `https://<actual-web-host>`

### Notes

- Free web services cold-start after inactivity (~50s on first hit). Fine for a demo.
- Free Postgres is time-limited by Render; recreate if it expires.
- Auth uses Bearer tokens from `localStorage`, so cross-site cookies are not required for login/refresh to work across the two Render domains.
