# GamataFitness

Role-based fitness tracking app with coach-driven workout plans, session logging, and progress visualization.

## Prerequisites

- Docker Desktop (running)
- Node.js 20+ (for `npx`)
- Git

## One-Command Profile Switching

The project supports local profile switching with one command. Local profiles include a fully local Supabase stack.

### Start Local Dev Profile (HMR + reload)

```bash
make local
```

What this does:
- Starts local Supabase (`supabase start`) if needed.
- Generates profile env files:
  - `backend/.env.local-profile`
  - `frontend/.env.local-profile`
- Runs app containers using `docker-compose.yml + docker-compose.dev.yml`.

Endpoints:
- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8000/health`
- Supabase Studio: `http://127.0.0.1:54323`
- Supabase API: `http://127.0.0.1:54321`

### Start Production-Like Profile (local runtime)

```bash
make prod-like
```

What this does:
- Reuses local Supabase.
- Runs app containers using production Dockerfiles (`docker-compose.yml + docker-compose.prod.yml`).

Endpoint:
- Frontend (Nginx-served): `http://localhost:5173`

### Stop Everything

```bash
make down
```

This stops:
- App containers (dev/prod-like stacks)
- Local Supabase containers

## Optional Prepare-Only Commands

Generate local profile env files and ensure Supabase is running, without starting app containers:

```bash
make local-prepare
make prod-like-prepare
```

## Seed Deterministic QA Data

After local services are prepared/running, seed correlated test data (users, workouts, plans, assignments, and history):

```bash
python scripts/seed_test_data.py
```

What it does:
- Uses `backend/.env.local-profile` by default (falls back to root `.env`).
- Seeds deterministic accounts: 1 admin, 3 coaches, and 10 users.
- Seeds correlated domain data: lookup tables, workouts, coach assignments, plans, plan assignments, sessions, and logs.
- Outputs credentials and seeded counts to terminal.
- Writes machine-readable credentials/output to `tmp/seeded_credentials.json`.

Optional flags:

```bash
python scripts/seed_test_data.py --seed-tag seed-v1 --coaches 3 --users 10 --shared-password "GamataSeed!123" --output tmp/seeded_credentials.json
```

## Run Against Cloud Supabase (manual)

If you want local app containers to use your hosted Supabase project:

1. Create:
   - `backend/.env`
   - `frontend/.env`
2. Fill with hosted Supabase values (see `backend/.env.example` and `frontend/.env.example`).
3. Run:
   - Dev: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build`
   - Prod-like: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build`

## Notes

- First local Supabase startup can take several minutes because images are pulled.
- Profiles are isolated through compose env-file indirection:
  - `BACKEND_ENV_FILE` defaults to `./backend/.env`
  - `FRONTEND_ENV_FILE` defaults to `./frontend/.env`
