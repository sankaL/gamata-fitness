# GamataFitness - Decision Log

> **Instructions:** Document major architectural and design decisions here.
> Keep this file under 1000 lines. When exceeded, create `decisions_made_2.md` and continue there.

---

## Decision Template

```markdown
### [DECISION-XXX] Title

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Deprecated | Superseded by DECISION-YYY

**Context:**  
What is the issue or situation requiring a decision?

**Decision:**  
What was decided?

**Rationale:**  
Why this approach over alternatives?

**Alternatives Considered:**  
- Option A: ...
- Option B: ...

**Consequences:**  
- Positive: ...
- Negative/Risks: ...
```

---

## Decisions

### [DECISION-001] Initial Tech Stack Selection

**Date:** 2026-02-08  
**Status:** Accepted

**Context:**  
Need to select a tech stack for the GamataFitness MVP that balances development speed, team expertise, and future scalability.

**Decision:**  
- Frontend: Vite + React + TypeScript + shadcn/ui + Tailwind CSS
- Backend: FastAPI + Python + SQLAlchemy
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- Hosting: Railway (Docker containers)

**Rationale:**  
- React/Vite: Fast development, strong ecosystem, team familiarity
- FastAPI: Async support, auto-documentation, Python ecosystem for future ML features
- Supabase: Managed auth reduces complexity, PostgreSQL reliability, Row Level Security
- Railway: Simple Docker deployment, auto-scaling, reasonable cost

**Alternatives Considered:**  
- Next.js (rejected: SSR not needed for this app)
- Django (rejected: FastAPI better for async API-first design)
- Firebase (rejected: vendor lock-in, PostgreSQL preferred)

**Consequences:**  
- Positive: Fast MVP development, manageable costs, proven stack
- Negative: Supabase dependency for auth (acceptable trade-off)

---

### [DECISION-002] Docker Compose Baseline + Environment Overrides

**Date:** 2026-02-09  
**Status:** Accepted

**Context:**  
Phase 1 requires both local development (hot reload) and production-like container flows without duplicating configuration.

**Decision:**  
- Use a base `docker-compose.yml` for shared service wiring and network.
- Use `docker-compose.dev.yml` for bind mounts, HMR, and dev Dockerfiles.
- Use `docker-compose.prod.yml` for production Dockerfiles and runtime settings.
- Keep service build contexts at `./backend` and `./frontend` with service-level `.dockerignore` files.

**Rationale:**  
- Shared base prevents drift between environments.
- Override files keep environment-specific behavior explicit and small.
- Per-service context + `.dockerignore` significantly reduce build transfer size.

**Alternatives Considered:**  
- Single compose file with profile conditionals (rejected: less clear separation of dev/prod concerns)
- Separate fully independent compose files (rejected: higher duplication and maintenance cost)

**Consequences:**  
- Positive: predictable local/prod parity and simpler verification commands
- Negative/Risks: override list-merging semantics require careful port definitions to avoid conflicts

---

### [DECISION-003] Fail-Closed Environment Configuration for Backend and Frontend

**Date:** 2026-02-09  
**Status:** Accepted

**Context:**  
The project has explicit security requirements to fail closed when required secrets or configuration are missing.

**Decision:**  
- Backend settings in `backend/app/config.py` require Supabase URL/keys and CORS origins at startup.
- Frontend Supabase/API client initialization throws startup errors when required `VITE_*` variables are missing.
- Production origin is environment-driven through `CORS_ALLOWED_ORIGINS` rather than hardcoded.

**Rationale:**  
- Prevents insecure implicit defaults.
- Makes misconfiguration obvious during startup instead of failing at runtime in partial states.
- Supports per-environment deployment without code changes.

**Alternatives Considered:**  
- Soft defaults for missing keys (rejected: violates fail-closed security rule)
- Hardcoded dev/prod origins in code (rejected: brittle and environment-coupled)

**Consequences:**  
- Positive: safer startup behavior and consistent deploy-time configuration
- Negative/Risks: stricter startup requirements increase initial setup friction

---

### [DECISION-004] Railway Deployment Topology: Two Services from One Repository

**Date:** 2026-02-09  
**Status:** Accepted

**Context:**  
Phase 1 includes Railway deployment design for frontend and backend containers.

**Decision:**  
- Deploy two Railway services from this repository: `backend` and `frontend`.
- Backend serves FastAPI on port `8000`; frontend serves static Vite build via Nginx.
- Keep cross-service connectivity/env configuration through Railway environment variables.

**Rationale:**  
- Matches project separation of concerns.
- Enables independent service restarts and scaling.
- Aligns with Dockerfiles already defined in repo.

**Alternatives Considered:**  
- Single combined container for frontend + backend (rejected: less operational flexibility)
- Separate repositories per service (rejected for MVP due to workflow overhead)

**Consequences:**  
- Positive: cleaner operational boundaries and straightforward CI/deploy mapping
- Negative/Risks: requires coordinated environment variable management across two services

---

### [DECISION-005] Frontend Runtime Environment Injection for Docker Deployments

**Date:** 2026-02-09  
**Status:** Accepted

**Context:**  
Vite `VITE_*` variables are compiled at build time, but Railway service variables are managed at runtime. Static frontend bundles built without build-time vars can start with missing API/Supabase configuration.

**Decision:**  
- Inject frontend runtime config through `/config.js` served by Nginx.
- Generate `/config.js` at container startup via `frontend/docker/runtime-env.sh` using service environment variables.
- Frontend reads `window.__APP_CONFIG__` first, then falls back to `import.meta.env` for local dev.

**Rationale:**  
- Keeps one immutable image reusable across environments.
- Avoids embedding environment-specific endpoints/keys at build time.
- Preserves smooth local Vite developer experience while fixing cloud runtime behavior.

**Alternatives Considered:**  
- Build-time `ARG`-based env injection per environment (rejected: image must be rebuilt per env; brittle CI wiring)
- Hardcoded API/Supabase endpoints (rejected: environment-coupled and not secure/maintainable)

**Consequences:**  
- Positive: reliable runtime configuration in Railway and future container platforms
- Negative/Risks: adds one startup script and an extra static config asset to maintain

---

### [DECISION-006] Local-Only Profile Runner with Supabase CLI Integration

**Date:** 2026-02-09  
**Status:** Accepted

**Context:**  
Developers need a fast, repeatable way to run the full stack locally, including Supabase, and to switch between development and production-like container modes without manual env rewiring.

**Decision:**  
- Add `scripts/run-profile.sh` as the single entrypoint for local profile switching.
- Support `local`, `prod-like`, and `down` commands.
- Use Supabase CLI to start local services and derive runtime values from `supabase status -o env`.
- Generate profile-scoped env files (`backend/.env.local-profile`, `frontend/.env.local-profile`) and route compose `env_file` through `BACKEND_ENV_FILE`/`FRONTEND_ENV_FILE`.
- Add root `Makefile` targets as short aliases (`make local`, `make prod-like`, `make down`).

**Rationale:**  
- Eliminates repetitive manual steps for local Supabase keys/URLs and app env wiring.
- Keeps local profile switching one-command and reproducible.
- Avoids overwriting manually maintained `backend/.env` and `frontend/.env`.

**Alternatives Considered:**  
- Manual env editing before each run (rejected: error-prone and slow)
- Hardcoding local Supabase credentials in committed env files (rejected: brittle and poor secret hygiene)
- Separate compose files per profile with duplicated service definitions (rejected: high maintenance cost)

**Consequences:**  
- Positive: predictable local setup, lower onboarding friction, cleaner pre-deploy validation path
- Negative/Risks: relies on local Docker + Supabase CLI availability and first-run image pulls can be slow

---

### [DECISION-007] Phase 2 Schema Baseline via Alembic with Seeded Reference Data and Supabase RLS

**Date:** 2026-02-09  
**Status:** Accepted

**Context:**  
Phase 2 requires a complete relational schema, deterministic starter data, and access control rules aligned with Supabase auth claims and coach-to-user assignment rules.

**Decision:**  
- Initialize Alembic under `database/migrations/` as the authoritative schema migration system.
- Implement Phase 2 in three revisions:
  - `202602090001`: enums, tables, constraints, indexes, and DB-side guardrails (coach assignment checks, updated-at triggers).
  - `202602090002`: deterministic seed data for muscle groups, cardio types, and a 24-workout starter library.
  - `202602090003`: RLS enablement + policies with helper functions (`current_user_role`, `is_admin`, `is_coach_of`, `can_access_user`).
- Keep large policy DDL in SQL artifacts under `database/migrations/sql/` and execute them from revision files.

**Rationale:**  
- Alembic gives explicit, versioned schema history tied to backend models.
- Splitting schema/seed/RLS revisions keeps rollbacks and debugging focused.
- DB guardrails enforce core business rules independently from API logic.
- SQL artifacts keep migration Python files under the repository file-size cap while preserving readability.

**Alternatives Considered:**  
- Supabase CLI SQL-only migrations without Alembic (rejected: weaker alignment with SQLAlchemy model evolution in backend code).
- Single monolithic migration for schema + seeds + RLS (rejected: harder rollback and troubleshooting).
- Application-only enforcement for assignment/active-plan constraints (rejected: leaves integrity gaps if API checks are bypassed).

**Consequences:**  
- Positive: repeatable schema bootstrapping, deterministic baseline data, and enforceable least-privilege table access.
- Negative/Risks: policy complexity increases query-planning and testing burden, requiring deliberate API-level integration tests in later phases.

---

<!-- Add new decisions above this line -->
