# GamataFitness Agent Instructions

## Project Overview

GamataFitness is a role-based fitness tracking app with coach-driven workout plans, session logging, and progress visualization. Built with a mobile-first responsive design optimized for mid-workout use.

**Stack:** React + Vite (frontend) | FastAPI (backend) | Supabase (auth + PostgreSQL)

## Architecture

```
Browser → React Frontend → FastAPI Backend → Supabase (Auth + PostgreSQL)
```

### Repository Structure

```
gamata-fitness/
├── frontend/                    # Vite + React + TypeScript
│   ├── src/
│   │   ├── components/         # UI components (ui/, dashboard/, workout/, plan/, shared/)
│   │   ├── pages/              # Route pages (auth/, admin/, coach/, user/)
│   │   ├── lib/                # API client, supabase client, utils
│   │   ├── hooks/              # Custom React hooks
│   │   └── types/              # TypeScript definitions
│   └── Dockerfile
├── backend/                     # FastAPI + Python
│   ├── app/                    # Main app (main.py, config.py, database.py)
│   ├── api/                    # Route handlers (auth, users, workouts, plans, sessions, progress)
│   ├── models/                 # SQLAlchemy models
│   ├── schemas/                # Pydantic schemas
│   ├── services/               # Business logic
│   ├── core/                   # Permissions, exceptions
│   └── Dockerfile
├── database/
│   ├── migrations/             # Alembic migrations
│   └── seed/                   # Initial data
├── tests/                      # Centralized automated test suites
│   ├── e2e/                    # Playwright end-to-end tests
│   │   ├── frontend/           # Frontend user journey E2E coverage
│   │   └── api/                # API end-to-end flows via Playwright
│   ├── api/                    # API integration/endpoint tests
│   └── performance/            # Performance and load tests
├── docs/                       # decisions_made.md, etc.
├── scripts/                    # Profile runners and local automation helpers
├── supabase/                   # Local Supabase CLI config (`config.toml`)
├── docker-compose.yml
├── database_schema_gamata.txt  # Source of truth for DB schema
└── BUILD_PLAN.md               # Task tracking
```

## Development Commands

```bash
# Start all services
docker compose up --build

# Start dev environment with hot reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Frontend only (local)
cd frontend && npm install && npm run dev

# Backend only (local)
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000

# Database migrations
cd backend && alembic upgrade head                     # Apply
cd backend && alembic revision --autogenerate -m "..."  # Create

# Linting
cd frontend && npm run lint      # ESLint + Prettier
cd backend && black . && isort . # Python formatting

# One-command local profile switching (includes local Supabase)
make local       # local dev profile (HMR + backend reload)
make prod-like   # production-like profile (production Dockerfiles, local runtime)
make down        # stop app stack + local Supabase
```

### Local Profiles (Required Workflow)

- Use `make local` for day-to-day development with local Supabase.
- Use `make prod-like` to validate production Docker behavior locally before Railway deployment.
- Use `make down` before switching profiles if you stopped containers manually.
- Do not commit generated profile env files:
  - `backend/.env.local-profile`
  - `frontend/.env.local-profile`
- Keep `supabase/config.toml` in version control so local Supabase startup remains reproducible.

## Critical Development Rules

### Database Changes

**ALWAYS** reference `database_schema_gamata.txt` before any database changes. This file is the source of truth.

**After any database change:**
1. Update `database_schema_gamata.txt` with the new schema
2. Create an Alembic migration
3. Update relevant SQLAlchemy models in `backend/models/`

### Environment Variables

- Root `.env.example` must exist and include every key from root `.env` with placeholder values only.
- If new environment variables are added for any feature, service, or integration, update every relevant example file in the same change (`.env.example`, `frontend/.env.example`, `backend/.env.example`).
- Never commit real secrets to any `*.env.example` file.

### Task Completion

**MANDATORY:** After completing any task:

**For tasks in `BUILD_PLAN.md`:**
1. Update the task status in the relevant phase table (⬜ → 🟢)
2. Add completion timestamp if significant

**For bug fixes or enhancements NOT in the original build plan:**
1. Add a new row to the relevant phase table in `BUILD_PLAN.md`
2. Use the next available task number (e.g., 2.19 if 2.18 exists)
3. Mark type as `BUG` or `ENHANCEMENT`
4. Set status to 🟢 and note the date completed

### Decision Documentation

Major architectural or design decisions must be documented in `docs/decisions_made/decisions_made.md`.

**Rules:**
- Keep each decisions file under 1000 lines
- If `decisions_made.md` exceeds 1000 lines, create `decisions_made_2.md` (increment number)
- Always write to the latest decisions file
- Include: date, context, decision, rationale, alternatives considered

### Security (Fail Closed)

- Never bypass verification when secrets/config are missing
- Never store auth tokens in localStorage (use httpOnly cookies or memory)
- SQL: never interpolate runtime identifiers; use parameterization and explicit allowlists
- Input validation: sanitize all user inputs with Pydantic schemas

### Authentication & RBAC

- JWT verification via Supabase tokens in FastAPI middleware
- Three roles: `admin`, `coach`, `user`
- Use `@require_role(["admin", "coach"])` decorator for protected endpoints
- Frontend: `<ProtectedRoute>` and `<RoleGuard>` components

### Test Directory Policy

- All new automated tests must be created under the root `tests/` directory.
- Playwright end-to-end tests must be placed in `tests/e2e/`.
- End-to-end coverage is split by target in `tests/e2e/frontend/` and `tests/e2e/api/`.
- API non-Playwright tests (integration/endpoint tests) must be placed in `tests/api/`.
- Performance and load tests must be placed in `tests/performance/`.
- Frontend E2E test framework: Playwright.
- API test framework/client: PyTest with Python standard library request utilities (`urllib.request`).
- Performance test framework: Locust (`locust.io`).
- Do not add new tests under `frontend/` or `backend/`; use `tests/` only.

---

## Code Quality Guardrails

### File Size Limits

| Context | Hard Cap | Target |
|---------|----------|--------|
| Any source file (.ts, .tsx, .py) | 500 lines | — |
| Frontend pages/components/hooks | — | ≤300 lines |
| Backend API/service files | — | ≤400 lines |

**If a touched file is already over cap:** Do not add net-new feature logic until existing logic is extracted into smaller modules/components/hooks.

### Decomposition Rules

- Split React files with >8 state/refs or >10 props
- Split functions >80 lines or >6 parameters
- Extract reusable logic into hooks (frontend) or services (backend)

### Error Handling

- **No silent failures:** Never use `except: pass`, empty catch blocks, or swallow errors
- Log errors with context using structured logging
- Return sanitized error messages to clients

### Resource Cleanup

- Every listener/timer/EventSource/WebSocket must have explicit cleanup
- Use bounded retry with exponential backoff
- React: cleanup in `useEffect` return; Python: use context managers

### No Production Debug Leftovers

- No `print()` or `console.log()` in production paths
- Use structured logging (`logging` module in Python, proper logger in frontend)

### Regression Safety

- Every bug fix must add/adjust a regression test
- Keep dependency versions aligned between `package.json`/`requirements.txt` and Dockerfiles

---

## Color Palette (TBD)

**Location:** `frontend/src/styles/` or Tailwind config

```css
/* Placeholder - to be finalized */
:root {
  --color-primary: #000000;      /* TBD */
  --color-secondary: #000000;    /* TBD */
  --color-accent: #000000;       /* TBD */
  --color-background: #ffffff;   /* TBD */
  --color-foreground: #000000;   /* TBD */
  --color-success: #22c55e;      /* TBD */
  --color-warning: #f59e0b;      /* TBD */
  --color-error: #ef4444;        /* TBD */
}
```

---

## Common Workflows

### Adding a New API Endpoint

1. Define Pydantic schema in `backend/schemas/`
2. Add route handler in `backend/api/`
3. Add business logic in `backend/services/`
4. Register router in `backend/app/main.py`
5. Update `BUILD_PLAN.md` task status

### Adding a Frontend Page

1. Create page in `frontend/src/pages/{role}/`
2. Add components in `frontend/src/components/`
3. Use `<ProtectedRoute>` wrapper for authenticated pages
4. Use TanStack Query hooks for API calls with caching

### Creating a Workout (Admin Flow)

1. Validate workout data against schema
2. Check workout type (strength vs cardio) for required fields
3. Assign muscle groups (many-to-many)
4. Soft delete via `is_archived` flag (never hard delete)

### Assigning a Plan (Coach Flow)

1. Check coach-user limit (max 50 users per coach)
2. Check if user has active plan → new plan becomes "pending"
3. User can have only ONE active plan at a time

---

## Key Business Rules

| Rule | Enforcement |
|------|-------------|
| Coach max 50 users | Check in `coach_user_assignments` before insert |
| User max 1 active plan | Constraint on `plan_assignments.status = 'active'` |
| Workout archive protection | Block if workout in active `plan_day_workouts` |
| Session edit window | 24 hours after `completed_at` |

---

## Troubleshooting

### Docker Issues
```bash
docker compose down -v && docker compose up --build  # Clean restart
```

### Database Connection
- Verify Supabase project is running
- Check `DATABASE_URL` in `.env` matches Supabase connection string

### CORS Errors
- Backend must allow frontend origin in `CORSMiddleware`
- Dev: `http://localhost:TBD` | Prod: deployed URL

### Supabase Auth
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Check JWT token format in request headers

---

## Reference Documents

| Document | Path | Purpose |
|----------|------|--------|
| Database Schema | `database_schema_gamata.txt` | Source of truth for all database tables, relationships, and constraints |
| Tech Stack | `gamata-fitness-tech-stack.md` | Technology choices, architecture decisions, and infrastructure details |
| PRD | `PRD GamataFitness.md` | Product requirements, user journeys, and business rules |
| Build Plan | `BUILD_PLAN.md` | Task breakdown, status tracking, and phase organization |
| Decisions | `docs/decisions_made/decisions_made.md` | Major architectural and design decisions, rationale, and alternatives |
