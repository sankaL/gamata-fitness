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

### [DECISION-008] Phase 3 Auth Flow with Backend-Mediated Supabase Sessions and In-Memory Frontend Tokens

**Date:** 2026-02-09  
**Status:** Accepted

**Context:**  
Phase 3 requires complete auth flows (register, login, profile, password reset), JWT verification for protected API routes, and role-based routing in the React app while honoring project security rules (fail-closed config and no localStorage token storage).

**Decision:**  
- Implement auth endpoints in FastAPI (`/auth/register`, `/auth/login`, `/auth/me`, `/auth/password-reset`, `/auth/password-update`) that broker Supabase auth operations.
- Add `JWTVerificationMiddleware` plus authenticated-user dependency and `@require_role([...])` decorator in backend permissions.
- Store frontend access token and user profile only in React `AuthContext` memory (not localStorage/sessionStorage).
- Configure local Supabase auth redirect URLs for `/auth/update-password` and route password recovery through backend endpoints.

**Rationale:**  
- Keeping auth orchestration in backend centralizes validation and RBAC enforcement logic.
- Middleware + dependency layering gives clear separation: token verification, user resolution, and role checks.
- In-memory token storage aligns with stated security constraints and reduces persistence risk on shared devices.
- Backend-mediated reset/update flows keep Supabase coupling in one service boundary.

**Alternatives Considered:**  
- Frontend-only Supabase auth usage for all flows (rejected: duplicates auth logic across clients and weakens backend control points).
- localStorage token persistence for convenience (rejected: violates project security rule).
- Per-route inline JWT checks without middleware abstraction (rejected: repetitive and error-prone).

**Consequences:**  
- Positive: consistent auth contract across API and UI, clearer RBAC extension path for later phases.
- Negative/Risks: memory-only sessions do not survive full page refresh; persistent session strategy may be revisited in a later security review.

---

### [DECISION-009] Phase 4 Admin User Lifecycle with Soft Deactivation and Explicit Coach-Capacity Enforcement

**Date:** 2026-02-09  
**Status:** Accepted

**Context:**  
Phase 4 requires admin-managed user CRUD, coach assignment management, and dashboard overview metrics while preserving historical data and enforcing the 50-user coach limit.

**Decision:**  
- Implement admin user management endpoints under `/users` with strict `admin` RBAC.
- Use soft deactivation for users via `users.is_active` + `users.deactivated_at` (no hard deletes).
- Add application-level coach-capacity validation (`MAX_USERS_PER_COACH = 50`) before assignment inserts, while retaining DB-level guardrails.
- Add `GET /users/overview` for admin dashboard counts (athletes, coaches, workouts, active/inactive accounts).
- Build frontend admin pages with React Query-backed data fetching and mutation invalidation for users, coach assignments, and overview cards.

**Rationale:**  
- Soft deactivation preserves relationships and historical records needed for plans/sessions while preventing access.
- Layered validation (API + DB constraints) gives clearer client errors and protects integrity under race conditions.
- A dedicated overview endpoint keeps dashboard reads lightweight and avoids expensive client-side aggregation.
- React Query reduces ad-hoc state management and keeps admin screens coherent after mutations.

**Alternatives Considered:**  
- Hard delete users (rejected: breaks historical integrity and relationship traceability).
- Rely only on DB trigger for 50-user enforcement (rejected: poorer API error clarity and UX).
- Build dashboard counts from multiple list endpoints (rejected: extra round-trips and brittle client aggregation logic).

**Consequences:**  
- Positive: safer account lifecycle management, clearer admin workflows, and better mutation consistency in UI.
- Negative/Risks: introduces schema evolution (`is_active`, `deactivated_at`) and requires auth/profile checks to consistently honor deactivated state.

---

### [DECISION-010] Phase 5/6 Schema Expansion to Persist Workout Prescription Fields and Plan Archive State

**Date:** 2026-02-11  
**Status:** Accepted

**Context:**  
Phase 5 and 6 requirements include workout prescription defaults (strength/cardio-specific targets) and soft deletion for plans, but Phase 2 schema lacked these persisted fields.

**Decision:**  
- Add `cardio_difficulty_level` enum (`easy`, `medium`, `hard`).
- Add workout columns: `target_sets`, `target_reps`, `suggested_weight`, `target_duration`, `difficulty_level`.
- Add plan archive columns: `workout_plans.is_archived`, `workout_plans.archived_at`, plus index `ix_workout_plans_is_archived`.
- Enforce type-specific workout integrity through DB check constraints and matching service/schema validation.

**Rationale:**  
- Persisted target fields are required for consistent plan building, assignment, and execution workflows.
- Plan archival state must be explicit to support soft-delete semantics and filtering.
- DB constraints protect integrity if API validations are bypassed and keep behavior deterministic.

**Alternatives Considered:**  
- Defer new fields and keep transient frontend-only values (rejected: data loss and inconsistent behavior across users).
- Add only plan archive fields now (rejected: leaves workout contract incomplete for Phase 5 deliverables).

**Consequences:**  
- Positive: full Phase 5/6 feature parity with persisted data contracts and stronger integrity guarantees.
- Negative/Risks: migration complexity increased due backfilling seeded workouts before applying strict constraints.

---

### [DECISION-011] Explicit Archive/Unarchive Action Endpoints for Workouts and Plans

**Date:** 2026-02-11  
**Status:** Accepted

**Context:**  
Archive operations need business-rule checks, predictable UX messaging, and reversible transitions for both workouts and plans.

**Decision:**  
- Use explicit action routes:
  - Workouts: `POST /workouts/{id}/archive`, `POST /workouts/{id}/unarchive`
  - Plans: `POST /plans/{id}/archive`, `POST /plans/{id}/unarchive`
- Keep `DELETE /plans/{id}` as a soft-delete alias to `archive` for Build Plan compatibility.

**Rationale:**  
- Action endpoints communicate intent clearly and avoid accidental archive-state toggles.
- They provide clear places to run dependency guards and return business-rule conflicts.
- Preserving `DELETE` keeps existing plan task semantics while introducing explicit operations.

**Alternatives Considered:**  
- Single `PUT` toggle (`is_archived`) endpoint (rejected: weaker intent semantics and harder policy handling).
- `DELETE`-only soft delete for both resources (rejected: no explicit unarchive action contract).

**Consequences:**  
- Positive: clearer API contracts, safer archive workflows, and direct FE affordances for archive/unarchive actions.
- Negative/Risks: additional endpoints increase surface area and test coverage requirements.

---

### [DECISION-012] Monday-First Week Indexing and UTC Weekly Completion Window

**Date:** 2026-02-11  
**Status:** Accepted

**Context:**  
Plan-day indexing and completion metrics required a stable definition to avoid mismatches between backend calculations and frontend grid rendering.

**Decision:**  
- Standardize `plan_days.day_of_week` mapping as Monday=`0` through Sunday=`6`.
- Compute weekly completion using a UTC Monday-Sunday window.
- Define completion as: `completed scheduled workouts this week / scheduled workouts this week`.

**Rationale:**  
- Monday-first indexing aligns with Python weekday conventions and simplifies backend calculations.
- A single UTC window avoids ambiguity until user-level timezone preferences are modeled.
- Workout-level completion reflects schedule adherence more accurately than day-binary metrics.

**Alternatives Considered:**  
- Sunday-first indexing (rejected: more remapping overhead and less alignment with backend defaults).
- User-local timezone-based windows now (rejected: schema currently lacks explicit timezone preferences).
- Day-level completion metric (rejected: loses workout-level fidelity).

**Consequences:**  
- Positive: consistent FE/BE interpretation and deterministic percentage calculations.
- Negative/Risks: UTC windows may not match all users’ local week boundaries until timezone support is added.

---

### [DECISION-013] Pending Plan Activation as User-Owned Assignment State Transitions

**Date:** 2026-02-11  
**Status:** Accepted

**Context:**  
Phase 10 requires users to explicitly manage pending plan assignments while preserving the one-active-plan rule and preventing archived-plan activation.

**Decision:**  
- Add dedicated user-side endpoints:
  - `GET /users/me/pending-plans`
  - `POST /plan-assignments/{id}/activate`
  - `POST /plan-assignments/{id}/decline`
- Activation flow deactivates existing active assignments (`status=inactive`, `deactivated_at`) before promoting the selected pending assignment to `active`.
- Expose pending plan actions in both a login-time modal and a persistent `/user/plans` settings page.

**Rationale:**  
- Assignment-level transitions keep historical plan relationships intact while honoring one-active-plan behavior.
- Explicit activate/decline actions make user intent auditable and reduce accidental status changes.
- Presenting actions in modal plus settings page supports both immediate handling and later review.

**Alternatives Considered:**  
- Auto-activate newest pending plan (rejected: removes user choice and can disrupt current training unexpectedly).
- Replace assignment rows instead of status transitions (rejected: loses assignment history and deactivation traceability).

**Consequences:**  
- Positive: clear lifecycle for plan handoffs with traceable status history.
- Negative/Risks: requires additional UX handling when multiple pending assignments are present.

---

### [DECISION-014] CSV Import/Export Contract with Partial-Success Row Validation

**Date:** 2026-02-11  
**Status:** Accepted

**Context:**  
Phase 11 requires bulk transfer of users/workouts/plans and explicit validation feedback for malformed CSV data.

**Decision:**  
- Add CSV endpoints:
  - Exports: `GET /users/export`, `GET /workouts/export`, `GET /plans/{id}/export`
  - Imports: `POST /users/import`, `POST /workouts/import`
- Use row-level validation with structured `{row_number, field, message}` errors.
- Allow partial-success imports by importing valid rows while reporting invalid rows in the same response.
- Standardize admin UI around reusable import modal/error table and direct CSV download actions.

**Rationale:**  
- Row-level error reporting gives operators actionable feedback without requiring trial-and-error reruns for every issue.
- Partial-success processing is pragmatic for operational CSV uploads and avoids blocking entire batches.
- Reusable modal patterns reduce duplicate UI logic across user/workout admin screens.

**Alternatives Considered:**  
- All-or-nothing transactional imports (rejected: high friction for large CSV cleanup loops).
- Separate validation endpoint before import (rejected for MVP: extra API complexity and user flow overhead).

**Consequences:**  
- Positive: faster operator workflow and clearer data-quality feedback.
- Negative/Risks: partial imports require operators to review result summaries to reconcile remaining errors.

---

### [DECISION-015] Phase 12 Baseline: Global Resilience, Feedback, and Performance Defaults

**Date:** 2026-02-11  
**Status:** Accepted

**Context:**  
Phase 12 calls for production-readiness improvements spanning UX polish, observability, abuse protection, and performance validation.

**Decision:**  
- Frontend:
  - Add global error boundary and toast provider.
  - Introduce skeleton/empty-state patterns across key dashboards and tables.
  - Enable route-level code splitting with `React.lazy` + suspense fallbacks.
  - Set TanStack Query default cache/retry behavior and role-based prefetching.
- Backend:
  - Add request logging middleware with method/path/status/duration metadata.
  - Add `slowapi` default rate limiting with env-driven limits.
- Quality:
  - Add backend unit tests for new critical services and urllib-based integration checks.
  - Add frontend component tests under root `tests/frontend`.
  - Record Lighthouse mobile audit artifacts under `tests/performance`.

**Rationale:**  
- Centralized resilience/feedback primitives improve runtime stability and operator/user confidence.
- Default caching and code splitting reduce perceived latency and bundle overhead for first loads.
- Rate limiting and request logs provide baseline production safeguards and diagnostics.

**Alternatives Considered:**  
- Keep per-page ad-hoc error/loading/notification handling (rejected: inconsistent UX and higher maintenance).
- Defer rate limiting/logging to infrastructure layer only (rejected: weaker app-level guarantees for local and containerized runs).

**Consequences:**  
- Positive: stronger UX consistency, better debugging visibility, and measurable performance baseline.
- Negative/Risks: more cross-cutting plumbing increases integration surface and regression-test scope.

---

<!-- Add new decisions above this line -->
