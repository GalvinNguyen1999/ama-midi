# AMA-MIDI — Enterprise MIDI Editor & Collaboration Suite

A web-based internal tool for prototyping **piano-roll** MIDI sequences for game soundtracks.
The grid uses **X = 8 tracks (horizontal)** and **Y = time 0–300s (vertical, 0s at the top)**; every note is a circular point at `(track, time)`. Multiple composers can edit the same song in real time.

**Live demo**

- Web: https://ama-midi-web.onrender.com
- API: https://ama-midi-api.onrender.com

> Both run on Render's free tier — the first request after idle may take ~40–50s to wake. Register an account on the login page to try it.

---

## Features (mapped to the case-study rubric)

| Area | What's implemented |
|---|---|
| **Foundation** | Full CRUD for Songs and Notes on PostgreSQL; functional, polished UI. |
| **Architecture** | Typed end-to-end (TS strict); layered backend (route → controller → service → repo); feature-based frontend; relational Song/Note model. |
| **Visualization & Integrity** | Accurate piano-roll grid; snap-to-grid; drag-to-move; **atomic transaction** + DB-level `unique(song, track, time)` → duplicate positions rejected with **409**; positioning logic unit-tested. |
| **Security & Auth** | JWT access + refresh, **2FA (TOTP)**, API **rate limiting**, CSRF-safe design (Bearer header + `SameSite=strict` cookies + CORS allow-list). |
| **UI/UX** | Dark "studio" theme (MUI); library / editor / settings pages; snap preview, hover cursor, loading & empty states; toasts on every action. |
| **Advanced Backend** | **Pub/Sub over WebSocket** — note changes, presence, and activity broadcast to everyone in a song room instantly. |
| **DevOps & Cloud** | Dockerized (`docker-compose`), GitHub Actions CI (lint/typecheck/test), deployed on Render via `render.yaml` blueprint. |
| **Performance** | **Canvas** rendering + **viewport windowing** to handle 10,000+ notes; composite index + range endpoint; built-in stress-seed tool. |
| **Collaboration extras** | Song ownership, share-link invites (`/songs/:id`), collaborator tracking. |
| **AI Innovation** | AI Note Suggester — _in progress_. |

Also: **ledger pattern** — every note change is recorded in `note_events` (create/update/delete + payload + actor) as an auditable history.

---

## Architecture

```
                    ┌──────────────────────────┐
                    │  Browser (React 19 SPA)  │
                    │  MUI · Redux Toolkit     │
                    └──────────┬───────────────┘
              REST (axios)     │      WebSocket (ws)
                    ┌──────────┴───────────────┐
                    │   API (Express 5, TS)    │
                    │  routes → controllers →  │
                    │  services → repositories │
                    │  ws hub (rooms/presence) │
                    └──────────┬───────────────┘
                       Prisma  │
                    ┌──────────┴───────────────┐
                    │      PostgreSQL          │
                    │ songs · notes · events   │
                    │ users · collaborators    │
                    └──────────────────────────┘
```

**Request layering (backend):** each feature is a module (`modules/songs`, `modules/notes`, `modules/auth`) with `route → controller → service → repo`, zod validation middleware, `ApiError` + centralized error handler, and a `~/` path alias.

**State (frontend):** server data flows through Redux Toolkit async thunks into a single store; realtime WebSocket events patch the same store, so the piano roll, presence and playback all read one source of truth. Reusable logic lives in feature-local hooks (`usePianoRollInteraction`, `useNoteCanvas`, `useWindowedNotes`, `usePlayback`, `useSongRealtime`); components only render.

### Data model

```
User ─1─┬─* Song ─1─┬─* Note        @@unique(songId, track, time)
        │           ├─* NoteEvent   (ledger: type, payload, actor)
        │           └─* SongCollaborator ─*─1─ User
```

- **Song** — `title`, `bpm`, `version` (optimistic concurrency), `ownerId`.
- **Note** — `track` (1–8), `time` `Decimal(6,3)` (0–300), `color`; indexes on `songId` and `(songId, time)` for windowed reads.
- **NoteEvent** — append-only audit trail of every mutation.
- **SongCollaborator** — who has opened each song, with last-seen.

---

## Tech stack

- **Frontend:** React 19, Vite, TypeScript, MUI (dark theme), Redux Toolkit, axios, react-hook-form + zod, react-toastify. Notes rendered on `<canvas>`; playback via the Web Audio API.
- **Backend:** Node 22, Express 5, TypeScript, Prisma, PostgreSQL, `ws` (WebSocket), zod, helmet, cors, cookie-parser, jsonwebtoken, otplib (2FA), bcryptjs, express-rate-limit, pino.
- **DevOps:** Docker + docker-compose, GitHub Actions, Render (Blueprint).

---

## Getting started

### Option A — full stack with Docker

```bash
docker compose up --build
# web  → http://localhost:8080
# api  → http://localhost:3000  (health: /health)
# db   → localhost:5432 (ama / ama)
```

Migrations run automatically when the API container starts.

### Option B — run each app locally (Node 22)

```bash
# 1. Database
docker compose up -d postgres

# 2. Backend
cd apps/api
cp .env.example .env          # then set DATABASE_URL / secrets
yarn install
yarn db:generate              # Prisma client
yarn db:deploy                # apply migrations
yarn dev                      # http://localhost:3000

# 3. Frontend (separate terminal)
cd apps/web
yarn install
yarn dev                      # http://localhost:5173
```

### Environment variables

| App | Variables (`.env.example`) |
|---|---|
| `apps/api` | `NODE_ENV`, `PORT`, `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `LOG_LEVEL`, `CORS_ORIGINS`, `FRONTEND_BASE_URL` |
| `apps/web` | `VITE_API_URL`, `VITE_WS_URL` |

---

## Testing

```bash
cd apps/api && yarn test      # services, realtime hub, JWT, validation (boundary/conflict), utils
cd apps/web && yarn test      # positioning logic, custom hooks, session util
```

Coverage focuses on the rubric's named cases: **note positioning**, **boundary** (301s rejected), **conflict** (duplicate `(track,time)` → 409), plus the realtime hub, auth tokens, and the drag / windowing / playback hooks.

---

## Performance approach (10,000+ notes)

The bottleneck shifts with scale, so it is addressed in three layers:

1. **Render (frontend):** notes are painted on a single `<canvas>` bitmap. Scrolling moves the bitmap (GPU-cheap) and only redraws on data change — DOM-per-note would collapse at this scale.
2. **Transport:** the editor never fetches a whole song. It requests only the visible time window in 30-second **chunks** (`GET /songs/:id/notes?from&to`), debounced on scroll with overscan and de-duplication, so payload/memory stay bounded even at 100k notes.
3. **Write throughput (backend):** bulk insert via `createMany` (batched), backed by a composite `@@index([songId, time])` for fast range reads.

A **stress-seed tool** (Editor → ⋮ Developer) inserts 1k/10k notes so the behaviour can be measured live.

---

## Deployment

Continuous deployment on **Render** via `render.yaml` (Blueprint): a managed PostgreSQL database, the API as a Docker web service (runs `prisma migrate deploy` on boot), and the web app as a static site. Pushing to `main` triggers an automatic rebuild.

---

## Key decisions & trade-offs

- **PostgreSQL (relational):** the core requirement is *sequence integrity* — a duplicate `(track, time)` must be impossible. A relational DB expresses this as a `UNIQUE` constraint enforced at the DB level (not app checks), and gives atomic transactions for the note + ledger + version bump. It also models Song/Note/Collaborator relationships cleanly.
- **Prisma:** type-safe queries and first-class migrations for a 3-day build; the generated client keeps the API end-to-end typed.
- **Redux Toolkit for state:** server data is cached in one store via thunks; realtime WS events patch the same store. A single cache keeps realtime + optimistic drag + playback consistent and easy to reason about. (React Query was evaluated; the hybrid added a second cache for the same data, so it was dropped.)
- **WebSocket (`ws`) over Redis pub/sub:** a single API instance makes an in-process room hub the simplest correct choice. Redis pub/sub is the documented scale-out path for multiple instances.
- **Canvas over SVG/DOM:** for 10k+ points, imperative canvas draw is flat-cost and scroll-free; SVG/DOM nodes do not scale.
- **Module-based backend / feature-based frontend:** each concern is self-contained, so features can be added or removed without cross-cutting churn.
- **No yarn workspace:** the two apps are deployed independently, so each owns its `package.json` / lockfile — no hoisting surprises.

---

## Project structure

```
ama-midi/
├─ apps/
│  ├─ api/                      # Express 5 + TS + Prisma + PostgreSQL
│  │  ├─ prisma/                # schema + migrations
│  │  └─ src/
│  │     ├─ config/ core/       # env, db, cors, auth, realtime hub, http helpers
│  │     └─ modules/            # songs · notes · auth (route/controller/service/repo)
│  └─ web/                      # React 19 + Vite + TS + MUI
│     └─ src/
│        ├─ apis/ store/ utils/
│        └─ features/           # auth · library · songs (editor) · pianoRoll · settings · layout
├─ docker-compose.yml
├─ render.yaml
└─ .github/workflows/ci.yml
```
