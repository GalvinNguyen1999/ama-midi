# AMA-MIDI — Enterprise MIDI Editor & Collaboration Suite

A web-based internal tool for prototyping **piano-roll** MIDI sequences for game soundtracks.
Piano roll layout: **X = 8 tracks (horizontal), Y = time 0–300s (vertical, 0s at the top)**. Each note is a circular point at `(track, time)`.

## Structure

Two **independent** projects under `apps/` — **no yarn workspace**. Each app manages its own `package.json`, `yarn.lock` and `node_modules`, and is installed/run separately.

```
ama-midi/
├─ apps/
│  ├─ api/          # Express 5 + TypeScript + Prisma + PostgreSQL (own yarn)
│  └─ web/          # React 19 + Vite + TypeScript (own yarn)
├─ docker-compose.yml
├─ .github/workflows/ci.yml
└─ .gitignore
```

> Domain types/zod schemas (`Note`, `Song`, WS events) live directly inside each app — the project is small, so there is no shared package, keeping the structure lean.

## Tech stack

- **Frontend:** React 19, Vite, TypeScript, MUI (dark studio), Redux Toolkit, axios.
- **Backend:** Node 22, Express 5, TypeScript, Prisma, PostgreSQL, WebSocket (`ws`) for realtime.
- **DevOps:** Docker Compose, GitHub Actions CI, hosting on Railway/Fly (planned).

## Getting started

Each app is installed and run independently (Node 22).

```bash
# Backend
cd apps/api
yarn install
yarn dev            # ts-node-dev

# Frontend (separate terminal)
cd apps/web
yarn install
yarn dev            # vite
```

Database for the backend: `docker compose up -d postgres`.

## Scripts (per app)

| App | Commands |
|---|---|
| `apps/api` | `yarn dev` · `yarn build` · `yarn test` · `yarn lint` · `yarn typecheck` |
| `apps/web` | `yarn dev` · `yarn build` · `yarn test` · `yarn lint` |

## Status

- [x] Two independent projects under `apps/` (own yarn, no workspace)
- [x] `docker-compose.yml` (Postgres) + `.github/workflows/ci.yml` (lint/typecheck/test per app)
- [x] Backend on Prisma/PostgreSQL (Mongo removed); `prisma/schema.prisma` (songs, notes, note_events ledger)
- [x] Frontend wired: MUI dark theme, Redux store, axios instance
- [ ] Run first migration (`yarn db:migrate`)
- [ ] `songs` / `notes` modules (controller/service/repo)
- [ ] Piano-roll grid + realtime WebSocket
- [ ] Dockerfiles for api/web + hosting
