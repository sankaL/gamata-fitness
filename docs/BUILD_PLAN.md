# GamataFitness Build Plan

**Version:** 1.0  
**Created:** February 8, 2026  
**Based on:** PRD GamataFitness v1.0 | Tech Stack v1.0

---

## Overview

This build plan breaks down the GamataFitness MVP into actionable tasks for the development team. Tasks are organized by phase and dependency order. Each task includes clear acceptance criteria suitable for junior developers.

### Status Legend
| Status | Meaning |
|--------|---------|
| ⬜ Not Started | Work has not begun |
| 🔵 In Progress | Currently being worked on |
| 🟡 Blocked | Waiting on dependency or decision |
| 🟢 Complete | Done and verified |
| 🔴 Needs Review | Completed but requires code review |

### Type Legend
| Type | Meaning |
|------|---------|
| **INFRA** | Infrastructure, DevOps, CI/CD |
| **BE** | Backend (FastAPI, Python) |
| **FE** | Frontend (React, Vite) |
| **DB** | Database, Migrations |
| **OTHER** | Documentation, Design, Testing |

---

## Phase 1: Infrastructure & Project Setup

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 1.1 | Create GitHub repository with branch protection rules | INFRA | 🟢 | Codex | Completed February 9, 2026: repo set to public and branch protection applied on `main` (PR required, 1 approval, force-push disabled, deletion disabled, no required checks) |
| 1.2 | Set up Supabase project (dev environment) | INFRA | 🟢 | Codex | Completed February 9, 2026: authenticated with Supabase management API and confirmed active dev project `gamata-fitness` (`nwkvtnbwkvgxzivuhxnl`) with required URL and API keys |
| 1.3 | Create root `docker-compose.yml` | INFRA | 🟢 | Codex | Completed February 9, 2026: created shared-network compose with backend/frontend services and dependency wiring |
| 1.4 | Create `docker-compose.dev.yml` override | INFRA | 🟢 | Codex | Completed February 9, 2026: added dev Dockerfiles, bind mounts, HMR command, and dev environment settings |
| 1.5 | Create `docker-compose.prod.yml` override | INFRA | 🟢 | Codex | Completed February 9, 2026: production Dockerfiles, restart policies, and frontend static serving port mapping |
| 1.6 | Create `.dockerignore` file | INFRA | 🟢 | Codex | Completed February 9, 2026: root `.dockerignore` plus service-level `.dockerignore` files to trim build context |
| 1.7 | Initialize backend project structure | BE | 🟢 | Codex | Completed February 9, 2026: scaffolded `backend/app`, `api`, `models`, `schemas`, `services`, `core` with module placeholders |
| 1.8 | Create backend `Dockerfile` (production) | BE | 🟢 | Codex | Completed February 9, 2026: multi-stage Python 3.12-slim build with dependency install and runtime stage |
| 1.9 | Create backend `Dockerfile.dev` | BE | 🟢 | Codex | Completed February 9, 2026: reload-ready dev image with requirements install and uvicorn `--reload` command |
| 1.10 | Initialize frontend project with Vite + React + TypeScript | FE | 🟢 | Codex | Completed February 9, 2026: initialized `frontend/` via Vite React TypeScript template and installed dependencies |
| 1.11 | Create frontend `Dockerfile` (production) | FE | 🟢 | Codex | Completed February 9, 2026: Node build stage + `nginx:alpine` runtime serving `dist/` |
| 1.12 | Create frontend `Dockerfile.dev` | FE | 🟢 | Codex | Completed February 9, 2026: Node 20 alpine dev image with Vite dev server command on `0.0.0.0:5173` |
| 1.13 | Create frontend `nginx.conf` | FE | 🟢 | Codex | Completed February 9, 2026: SPA fallback, gzip enabled, and static asset cache headers configured |
| 1.14 | Configure Tailwind CSS in frontend | FE | 🟢 | Codex | Completed February 9, 2026: Tailwind + PostCSS configured with `src` content globs and design tokens |
| 1.15 | Install and configure shadcn/ui | FE | 🟢 | Codex | Completed February 9, 2026: initialized shadcn (`components.json`) and added base `button`/`card` components |
| 1.16 | Set up ESLint + Prettier for frontend | FE | 🟢 | Codex | Completed February 9, 2026: added prettier config, eslint-prettier integration, and lint/format scripts |
| 1.17 | Set up Black + isort for backend | BE | 🟢 | Codex | Completed February 9, 2026: configured Black/isort via backend `pyproject.toml` and requirements |
| 1.18 | Create `.env.example` files for both frontend and backend | OTHER | 🟢 | Codex | Completed February 9, 2026: added `frontend/.env.example` and `backend/.env.example` with required vars |
| 1.19 | Set up Supabase client in backend (`supabase-py`) | BE | 🟢 | Codex | Completed February 9, 2026: implemented Supabase client initialization in `backend/app/database.py` |
| 1.20 | Set up Supabase client in frontend | FE | 🟢 | Codex | Completed February 9, 2026: implemented client bootstrap in `frontend/src/lib/supabase.ts` |
| 1.21 | Configure CORS in FastAPI for frontend origin | BE | 🟢 | Codex | Completed February 9, 2026: CORS configured from env in `backend/app/main.py` and verified with Origin header |
| 1.22 | Create basic health check endpoint (`GET /health`) | BE | 🟢 | Codex | Completed February 9, 2026: `GET /health` returns `{"status":"ok"}` |
| 1.23 | Add healthcheck to docker-compose for backend | INFRA | 🟢 | Codex | Completed February 9, 2026: compose healthcheck uses `curl -f http://localhost:8000/health` |
| 1.24 | Verify `docker-compose up` runs both services | INFRA | 🟢 | Codex | Completed February 9, 2026: validated dev and prod compose bring up frontend (`:5173`) + backend (`:8000`) |
| 1.25 | Verify frontend can call backend health endpoint | FE | 🟢 | Codex | Completed February 9, 2026: frontend health UI implemented and backend CORS response validated for `http://localhost:5173` |
| 1.26 | Set up Railway project with Docker deployment | INFRA | 🟢 | Codex | Completed February 9, 2026: created Railway project `gamata-fitness` with `backend` + `frontend` services, configured env vars, deployed both containers, and verified public health/frontend reachability |
| 1.27 | Fix local profile env generation so Dockerized backend can reach local Supabase host services | BUG | 🟢 | Codex | Completed February 9, 2026: updated `scripts/run-profile.sh` to rewrite `localhost/127.0.0.1` to `host.docker.internal` for backend `SUPABASE_URL` and `DATABASE_URL` in generated local profile envs |
| 1.28 | Ensure frontend dev container refreshes dependencies when lockfile changes | BUG | 🟢 | Codex | Completed February 9, 2026: added `frontend/docker/dev-start.sh` lockfile-hash check + `npm ci` bootstrap and updated `docker-compose.dev.yml` frontend command to prevent stale `frontend_node_modules` volume dependency drift |

---

## Phase 2: Database Schema & Models

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 2.1 | Design and create `users` table in Supabase | DB | 🟢 | Codex | Completed February 9, 2026: created in Alembic revision `202602090001` with role enum + timestamps |
| 2.2 | Create `coach_user_assignments` table | DB | 🟢 | Codex | Completed February 9, 2026: created with FK wiring, uniqueness, role validation trigger, and 50-user coach limit enforcement |
| 2.3 | Create `muscle_groups` table | DB | 🟢 | Codex | Completed February 9, 2026: created in revision `202602090001`; default values seeded in `202602090002` |
| 2.4 | Create `cardio_types` table | DB | 🟢 | Codex | Completed February 9, 2026: created in revision `202602090001`; default values seeded in `202602090002` |
| 2.5 | Create `workouts` table | DB | 🟢 | Codex | Completed February 9, 2026: created with archive flag, timestamps, workout type enum, and optional cardio type linkage |
| 2.6 | Create `workout_muscle_groups` junction table | DB | 🟢 | Codex | Completed February 9, 2026: created composite PK junction table in revision `202602090001` |
| 2.7 | Create `workout_plans` table | DB | 🟢 | Codex | Completed February 9, 2026: created with coach FK, date-range constraint, and timestamps |
| 2.8 | Create `plan_days` table | DB | 🟢 | Codex | Completed February 9, 2026: created with day-of-week check (`0-6`) and per-plan uniqueness |
| 2.9 | Create `plan_day_workouts` junction table | DB | 🟢 | Codex | Completed February 9, 2026: created composite PK junction table in revision `202602090001` |
| 2.10 | Create `plan_assignments` table | DB | 🟢 | Codex | Completed February 9, 2026: created with status enum and active-plan partial unique index (`uq_plan_assignments_user_active`) |
| 2.11 | Create `workout_sessions` table | DB | 🟢 | Codex | Completed February 9, 2026: created with nullable plan FK and session type enum in revision `202602090001` |
| 2.12 | Create `exercise_logs` table | DB | 🟢 | Codex | Completed February 9, 2026: created with non-negative checks and timestamp fields |
| 2.13 | Set up Alembic for migrations | BE | 🟢 | Codex | Completed February 9, 2026: initialized Alembic in `database/migrations/` (`alembic.ini`, `env.py`, revisions, SQL assets) |
| 2.14 | Create SQLAlchemy models matching database schema | BE | 🟢 | Codex | Completed February 9, 2026: added full Phase 2 ORM models in `backend/models/` and exports in `backend/models/__init__.py` |
| 2.15 | Seed muscle groups with default values | DB | 🟢 | Codex | Completed February 9, 2026: seeded Chest, Back, Legs, Shoulders, Arms, Core, Full-Body in revision `202602090002` |
| 2.16 | Seed cardio types with default values | DB | 🟢 | Codex | Completed February 9, 2026: seeded HIIT, Steady State, Interval, Circuit in revision `202602090002` |
| 2.17 | Seed initial workout library | DB | 🟢 | Codex | Completed February 9, 2026: seeded 24-workout starter library and muscle-group mappings in revision `202602090002` |
| 2.18 | Configure Row Level Security (RLS) policies in Supabase | DB | 🟢 | Codex | Completed February 9, 2026: enabled RLS on all Phase 2 tables with 36 policies via revision `202602090003` and SQL policy script |

---

## Phase 3: Authentication

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 3.1 | Configure Supabase Auth settings | INFRA | 🟢 | Codex | Completed February 9, 2026: updated `supabase/config.toml` auth site URL/redirect allowlist for local app (`http://localhost:5173`) and password update route |
| 3.2 | Create Pydantic schemas for auth (login, register, user response) | BE | 🟢 | Codex | Completed February 9, 2026: added auth request/response schemas and validation in `backend/schemas/auth.py` |
| 3.3 | Implement JWT verification middleware in FastAPI | BE | 🟢 | Codex | Completed February 9, 2026: added `JWTVerificationMiddleware` in `backend/core/permissions.py` and registered middleware in `backend/app/main.py` |
| 3.4 | Create `POST /auth/register` endpoint | BE | 🟢 | Codex | Completed February 9, 2026: implemented registration flow in `backend/api/auth.py` + `backend/services/auth.py` (Supabase sign-up + local users table profile create) |
| 3.5 | Create `POST /auth/login` endpoint | BE | 🟢 | Codex | Completed February 9, 2026: implemented password login returning JWT/session tokens and local user profile in `backend/api/auth.py` |
| 3.6 | Create `GET /auth/me` endpoint | BE | 🟢 | Codex | Completed February 9, 2026: added authenticated profile endpoint backed by JWT verification and local user lookup |
| 3.7 | Implement RBAC permission decorator | BE | 🟢 | Codex | Completed February 9, 2026: added `@require_role([...])` decorator in `backend/core/permissions.py` with current-user role enforcement |
| 3.8 | Create Login page component | FE | 🟢 | Codex | Completed February 9, 2026: added login page with React Hook Form + Zod and shadcn input/button components (`frontend/src/pages/auth/LoginPage.tsx`) |
| 3.9 | Create Registration page component | FE | 🟢 | Codex | Completed February 9, 2026: added registration page with name/email/password validation and backend register integration |
| 3.10 | Create AuthContext provider | FE | 🟢 | Codex | Completed February 9, 2026: implemented `AuthProvider` with in-memory token/user state and login/logout/register/password helpers (`frontend/src/context/AuthContext.tsx`) |
| 3.11 | Create ProtectedRoute component | FE | 🟢 | Codex | Completed February 9, 2026: added guarded route wrapper redirecting unauthenticated users to `/login` |
| 3.12 | Create RoleGuard component | FE | 🟢 | Codex | Completed February 9, 2026: added role gate component restricting dashboard routes by `admin`/`coach`/`user` |
| 3.13 | Implement role-based routing in App.tsx | FE | 🟢 | Codex | Completed February 9, 2026: replaced app shell with role-aware route tree and root redirect logic in `frontend/src/App.tsx` |
| 3.14 | Create logout functionality | FE | 🟢 | Codex | Completed February 9, 2026: added logout action in auth context and dashboard shell to clear in-memory auth state and return to login flow |
| 3.15 | Create password reset flow | FE/BE | 🟢 | Codex | Completed February 9, 2026: added backend reset/update endpoints plus frontend forgot/update password pages using Supabase recovery tokens |

---

## Phase 4: User Management (Admin)

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 4.1 | Create Pydantic schemas for users (create, update, list) | BE | 🟢 | Codex | Completed February 9, 2026: added `backend/schemas/users.py` with create/update/list query schemas, coach assignment schemas, detail/list responses, and admin overview response |
| 4.2 | Create `GET /users` endpoint (admin only) | BE | 🟢 | Codex | Completed February 9, 2026: implemented paginated admin-only listing with role/search/status filters in `backend/api/users.py` + `backend/services/users.py` |
| 4.3 | Create `GET /users/{id}` endpoint | BE | 🟢 | Codex | Completed February 9, 2026: added admin-only user detail endpoint returning assigned coaches |
| 4.4 | Create `POST /users` endpoint (admin only) | BE | 🟢 | Codex | Completed February 9, 2026: implemented admin create flow with Supabase auth user creation and local profile persistence |
| 4.5 | Create `PUT /users/{id}` endpoint (admin only) | BE | 🟢 | Codex | Completed February 9, 2026: implemented admin update for name/email/role with role-transition safety and Supabase sync |
| 4.6 | Create `DELETE /users/{id}` endpoint (admin only) | BE | 🟢 | Codex | Completed February 9, 2026: implemented soft deactivation (`is_active`, `deactivated_at`) plus self-deactivation guard |
| 4.7 | Create Admin Users List page | FE | 🟢 | Codex | Completed February 9, 2026: added `/admin/users` page with searchable/filterable/paginated table (`frontend/src/pages/admin/AdminUsersPage.tsx`) |
| 4.8 | Create User Create/Edit form modal | FE | 🟢 | Codex | Completed February 9, 2026: added reusable create/edit modal with validation and role selection (`frontend/src/components/admin/UserFormModal.tsx`) |
| 4.9 | Create User deactivation confirmation modal | FE | 🟢 | Codex | Completed February 9, 2026: added confirmation modal before deactivation (`frontend/src/components/admin/DeactivateUserModal.tsx`) |
| 4.10 | Implement coach assignment UI | FE | 🟢 | Codex | Completed February 9, 2026: added coach assignment modal with multi-select and remove actions (`frontend/src/components/admin/CoachAssignmentModal.tsx`) |
| 4.11 | Create `POST /users/{id}/coaches` endpoint | BE | 🟢 | Codex | Completed February 9, 2026: implemented admin endpoint to assign one or more coaches to a user |
| 4.12 | Create `DELETE /users/{id}/coaches/{coach_id}` endpoint | BE | 🟢 | Codex | Completed February 9, 2026: implemented admin endpoint to remove a coach-user assignment |
| 4.13 | Implement 50-user limit check for coaches | BE | 🟢 | Codex | Completed February 9, 2026: added application-level capacity validation (`MAX_USERS_PER_COACH = 50`) before insert with guarded error response |
| 4.14 | Create Admin dashboard overview | FE | 🟢 | Codex | Completed February 9, 2026: upgraded admin dashboard with live overview cards and quick actions powered by `GET /users/overview` |

---

## Phase 5: Workout Library (Admin)

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 5.1 | Create Pydantic schemas for workouts | BE | 🟢 | Codex | Completed February 11, 2026: added `backend/schemas/workouts.py` with create/update/list/archive and lookup response contracts |
| 5.2 | Create `GET /workouts` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: implemented paginated listing with type/muscle-group/archive/search filters |
| 5.3 | Create `GET /workouts/{id}` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: returns workout detail with cardio type and muscle groups |
| 5.4 | Create `POST /workouts` endpoint (admin only) | BE | 🟢 | Codex | Completed February 11, 2026: admin create flow with workout-type validation and muscle-group assignment |
| 5.5 | Create `PUT /workouts/{id}` endpoint (admin only) | BE | 🟢 | Codex | Completed February 11, 2026: admin update flow with type-safe field normalization and relationship updates |
| 5.6 | Create `POST /workouts/{id}/archive` endpoint (admin only) | BE | 🟢 | Codex | Completed February 11, 2026: added archive action endpoint with business-rule validation and conflict handling |
| 5.7 | Implement active plan dependency check | BE | 🟢 | Codex | Completed February 11, 2026: archive is blocked when workout is linked to active plan assignments |
| 5.8 | Create `GET /muscle-groups` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: implemented authenticated lookup endpoint returning all muscle groups |
| 5.9 | Create `POST /muscle-groups` endpoint (admin only) | BE | 🟢 | Codex | Completed February 11, 2026: implemented admin custom muscle-group creation |
| 5.10 | Create `GET /cardio-types` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: implemented authenticated cardio-type lookup endpoint |
| 5.11 | Create Workout Library page | FE | 🟢 | Codex | Completed February 11, 2026: added `/admin/workouts` with table, search, filters, and pagination |
| 5.12 | Create Workout Create/Edit form | FE | 🟢 | Codex | Completed February 11, 2026: added `WorkoutFormModal` with create/edit workflows |
| 5.13 | Create strength workout fields | FE | 🟢 | Codex | Completed February 11, 2026: added target sets/reps/suggested weight controls for strength workouts |
| 5.14 | Create cardio workout fields | FE | 🟢 | Codex | Completed February 11, 2026: added cardio type, duration, and difficulty controls |
| 5.15 | Create muscle group multi-select component | FE | 🟢 | Codex | Completed February 11, 2026: added reusable `MuscleGroupMultiSelect` checkbox selector |
| 5.16 | Create archive confirmation modal with dependency warning | FE | 🟢 | Codex | Completed February 11, 2026: added archive modal that surfaces backend dependency conflict messaging |
| 5.17 | Create unarchive functionality | BE/FE | 🟢 | Codex | Completed February 11, 2026: implemented unarchive endpoint and UI action from workout table |

---

## Phase 6: Plan Management (Coach)

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 6.1 | Create Pydantic schemas for plans | BE | 🟢 | Codex | Completed February 11, 2026: added `backend/schemas/plans.py` for list/detail/create/update/assign/roster contracts |
| 6.2 | Create `GET /plans` endpoint (coach) | BE | 🟢 | Codex | Completed February 11, 2026: implemented coach-scoped paginated plan listing with archive/search filters |
| 6.3 | Create `GET /plans/{id}` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: implemented coach-scoped plan detail endpoint with days/workouts |
| 6.4 | Create `POST /plans` endpoint (coach) | BE | 🟢 | Codex | Completed February 11, 2026: implemented plan creation with day/workout assignments |
| 6.5 | Create `PUT /plans/{id}` endpoint (coach) | BE | 🟢 | Codex | Completed February 11, 2026: implemented plan update flow with day/workout replacement logic |
| 6.6 | Create `DELETE /plans/{id}` endpoint (coach) | BE | 🟢 | Codex | Completed February 11, 2026: implemented soft-delete alias that archives the plan |
| 6.7 | Create `POST /plans/{id}/assign` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: implemented assignment endpoint with roster/role/activity checks |
| 6.8 | Create `GET /plans/{id}/users` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: returns latest assignment status per user plus weekly completion percent |
| 6.9 | Implement one-active-plan logic | BE | 🟢 | Codex | Completed February 11, 2026: users with an active plan receive new assignments as `pending` |
| 6.10 | Create `GET /coaches/{id}/users` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: implemented coach roster endpoint with plan status and completion metrics |
| 6.11 | Create Plan Builder page | FE | 🟢 | Codex | Completed February 11, 2026: added `/coach/plans` with builder workflow and plan list management |
| 6.12 | Create day workout selector component | FE | 🟢 | Codex | Completed February 11, 2026: added `DayWorkoutSelector` weekly grid editor |
| 6.13 | Create workout picker modal | FE | 🟢 | Codex | Completed February 11, 2026: added searchable `WorkoutPickerModal` for day assignment |
| 6.14 | Create plan save functionality | FE | 🟢 | Codex | Completed February 11, 2026: validates date/name/weekly assignments before save |
| 6.15 | Create user assignment panel | FE | 🟢 | Codex | Completed February 11, 2026: added `UserAssignmentPanel` backed by coach roster endpoint |
| 6.16 | Create Coach Dashboard | FE | 🟢 | Codex | Completed February 11, 2026: replaced placeholder dashboard with roster + quick actions |
| 6.17 | Create plan completion status display | FE | 🟢 | Codex | Completed February 11, 2026: dashboard and plan views show weekly completion percentages |
| 6.18 | Add explicit archive/unarchive action endpoints for plans | ENHANCEMENT | 🟢 | Codex | Completed February 11, 2026: added `POST /plans/{id}/archive` and `POST /plans/{id}/unarchive` while preserving DELETE soft-delete alias |

---

## Phase 7: User Dashboard & Workout Execution

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 7.1 | Create `GET /users/me/today` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: added user dashboard endpoint returning today’s assigned workouts and completion count |
| 7.2 | Create `GET /users/me/plan` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: added current-week plan preview endpoint with Monday-Sunday day mapping |
| 7.3 | Create `GET /users/me/stats` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: added quick stats endpoint for weekly sessions, completed today, total sessions, and current streak |
| 7.4 | Create `GET /users/me/coaches` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: added assigned-coaches endpoint for athlete dashboard/contact views |
| 7.5 | Create User Dashboard page | FE | 🟢 | Codex | Completed February 11, 2026: replaced placeholder with `/user/dashboard` experience using today card, week preview, and quick stats |
| 7.6 | Create Today's Workout card component | FE | 🟢 | Codex | Completed February 11, 2026: added `TodaysWorkoutCard` with workout summary and start action |
| 7.7 | Create Weekly Plan preview component | FE | 🟢 | Codex | Completed February 11, 2026: added `WeeklyPlanPreview` 7-day strip with scheduled/rest indicators |
| 7.8 | Create Quick Stats component | FE | 🟢 | Codex | Completed February 11, 2026: added `QuickStatsCards` for sessions/streak/today/total metrics |
| 7.9 | Create My Coaches page | FE | 🟢 | Codex | Completed February 11, 2026: added `/user/coaches` page with assigned coach list and mail actions |
| 7.10 | Create `POST /sessions` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: implemented session start endpoint with assigned/swap/adhoc validation rules |
| 7.11 | Create `PUT /sessions/{id}` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: implemented session update endpoint with log upsert support |
| 7.12 | Create `POST /sessions/{id}/complete` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: implemented session completion endpoint setting `completed_at` |
| 7.13 | Create `POST /sessions/{id}/logs` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: implemented add-log endpoint for active session execution |
| 7.14 | Create `PUT /sessions/{id}/logs/{log_id}` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: implemented per-log edit endpoint with ownership/edit-window checks |
| 7.15 | Create Workout Execution page | FE | 🟢 | Codex | Completed February 11, 2026: added `/user/workout` full-screen execution flow with session lifecycle handling |
| 7.16 | Create Exercise Card component (strength) | FE | 🟢 | Codex | Completed February 11, 2026: added `StrengthExerciseCard` with touch-first strength logging controls |
| 7.17 | Create weight input slider component | FE | 🟢 | Codex | Completed February 11, 2026: added `WeightInputSlider` with +/- buttons, range slider, and presets |
| 7.18 | Create rep input stepper component | FE | 🟢 | Codex | Completed February 11, 2026: added `RepInputStepper` with large increment controls and quick-rep presets |
| 7.19 | Create set completion checklist | FE | 🟢 | Codex | Completed February 11, 2026: added `SetCompletionChecklist` tappable set-complete tracker |
| 7.20 | Create Exercise Card component (cardio) | FE | 🟢 | Codex | Completed February 11, 2026: added `CardioExerciseCard` with timer and note capture |
| 7.21 | Create cardio timer component | FE | 🟢 | Codex | Completed February 11, 2026: added `CardioTimer` with start/pause/stop and large elapsed-time display |
| 7.22 | Create workout completion flow | FE | 🟢 | Codex | Completed February 11, 2026: implemented finish workflow with final sync and completion API call |
| 7.23 | Create workout complete celebration | FE | 🟢 | Codex | Completed February 11, 2026: added `WorkoutCelebration` post-completion success/summary view |
| 7.24 | Implement optimistic UI updates | FE | 🟢 | Codex | Completed February 11, 2026: local-first log state with debounced background sync to session update endpoint |

---

## Phase 8: Workout Swap & Ad Hoc

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 8.1 | Create `GET /workouts/alternatives/{workout_id}` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: added alternatives endpoint returning same-muscle-group workouts ordered by overlap |
| 8.2 | Create Swap Workout modal | FE | 🟢 | Codex | Completed February 11, 2026: added `SwapWorkoutModal` with alternatives list and selection action |
| 8.3 | Implement swap session creation | BE | 🟢 | Codex | Completed February 11, 2026: implemented swap validation and creation through `POST /sessions` with `session_type=swap` |
| 8.4 | Create Ad Hoc workout selection page | FE | 🟢 | Codex | Completed February 11, 2026: added `/user/workouts/adhoc` library browse/start workflow |
| 8.5 | Implement ad hoc session creation | BE | 🟢 | Codex | Completed February 11, 2026: implemented ad hoc session creation guardrails through `POST /sessions` with `session_type=adhoc` |
| 8.6 | Create "Swap" and "Ad Hoc" buttons on dashboard | FE | 🟢 | Codex | Completed February 11, 2026: added swap/ad-hoc actions on dashboard today-workout card |

---

## Phase 9: Progress Dashboard

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 9.1 | Create `GET /users/me/sessions` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: added paginated session history endpoint with date/type/muscle filters |
| 9.2 | Create `GET /users/me/progress/muscle-groups` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: added muscle-group progress aggregation endpoint for selected range |
| 9.3 | Create `GET /users/me/progress/frequency` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: added weekly/monthly frequency endpoint with configurable range buckets |
| 9.4 | Install and configure Recharts | FE | 🟢 | Codex | Completed February 11, 2026: installed `recharts` and wired chart components into progress UI |
| 9.5 | Create Progress Dashboard page | FE | 🟢 | Codex | Completed February 11, 2026: added `/user/progress` with tabbed history/trends/stats layout |
| 9.6 | Create Session History list | FE | 🟢 | Codex | Completed February 11, 2026: added expandable `SessionHistoryList` chronological log viewer |
| 9.7 | Create date range filter | FE | 🟢 | Codex | Completed February 11, 2026: added range presets (7/30/custom) in `ProgressFilters` |
| 9.8 | Create workout type filter | FE | 🟢 | Codex | Completed February 11, 2026: added strength/cardio/all filter integrated with session query params |
| 9.9 | Create muscle group filter | FE | 🟢 | Codex | Completed February 11, 2026: added multi-select muscle-group chips for history/trend filtering |
| 9.10 | Create Muscle Group chart | FE | 🟢 | Codex | Completed February 11, 2026: added `MuscleGroupChart` bar visualization for volume by muscle group |
| 9.11 | Create Weekly Frequency chart | FE | 🟢 | Codex | Completed February 11, 2026: added `WeeklyFrequencyChart` for sessions-per-week trends |
| 9.12 | Create Session Edit modal | FE | 🟢 | Codex | Completed February 11, 2026: added `SessionEditModal` with save flow to session update endpoint |
| 9.13 | Create max weight tracking display | FE | 🟢 | Codex | Completed February 11, 2026: added `PersonalRecordsCard` PR display by exercise |

---

## Phase 10: Plan Activation Flow

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 10.1 | Create `GET /users/me/pending-plans` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: added user pending-plan endpoint with active-plan summary and pending assignment metadata |
| 10.2 | Create `POST /plan-assignments/{id}/activate` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: activation now promotes selected pending assignment and deactivates current active assignment(s) |
| 10.3 | Create `POST /plan-assignments/{id}/decline` endpoint | BE | 🟢 | Codex | Completed February 11, 2026: users can decline pending assignments, marking them inactive with timestamp |
| 10.4 | Create Plan Activation modal | FE | 🟢 | Codex | Completed February 11, 2026: added user-shell modal that appears when pending plans exist and supports activate/decline actions |
| 10.5 | Create Plans Settings page | FE | 🟢 | Codex | Completed February 11, 2026: added `/user/plans` page showing active plan context and pending assignment management |

---

## Phase 11: CSV Import/Export

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 11.1 | Create `GET /users/export` endpoint (admin) | BE | 🟢 | Codex | Completed February 11, 2026: added admin users CSV export endpoint with assignment count metadata |
| 11.2 | Create `GET /workouts/export` endpoint (admin) | BE | 🟢 | Codex | Completed February 11, 2026: added admin workouts CSV export endpoint including type-specific workout fields |
| 11.3 | Create `GET /plans/{id}/export` endpoint (coach) | BE | 🟢 | Codex | Completed February 11, 2026: added coach-scoped plan CSV export endpoint with day/workout rows |
| 11.4 | Create `POST /users/import` endpoint (admin) | BE | 🟢 | Codex | Completed February 11, 2026: added admin user CSV import endpoint with per-row validation/result reporting |
| 11.5 | Create `POST /workouts/import` endpoint (admin) | BE | 🟢 | Codex | Completed February 11, 2026: added admin workout CSV import endpoint with type-aware validation and creation |
| 11.6 | Implement CSV validation with error reporting | BE | 🟢 | Codex | Completed February 11, 2026: import services now return row-by-row field errors for invalid records |
| 11.7 | Create Export buttons in Admin UI | FE | 🟢 | Codex | Completed February 11, 2026: added CSV export actions on Admin Users/Admin Workouts pages |
| 11.8 | Create Import modal with file upload | FE | 🟢 | Codex | Completed February 11, 2026: added reusable `CsvImportModal` file-upload flow for admin imports |
| 11.9 | Create import error display | FE | 🟢 | Codex | Completed February 11, 2026: import modal now displays row/field/message error table for validation failures |

---

## Phase 12: Polish & Optimization

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 12.1 | Implement loading states across all pages | FE | 🟢 | Codex | Completed February 11, 2026: added skeleton loaders/spinner states across dashboard, table, and plan views |
| 12.2 | Implement error boundary component | FE | 🟢 | Codex | Completed February 11, 2026: added global `AppErrorBoundary` fallback with safe reload action |
| 12.3 | Add toast notifications | FE | 🟢 | Codex | Completed February 11, 2026: added toast provider and success/error action feedback across admin/coach/user workflows |
| 12.4 | Implement empty states | FE | 🟢 | Codex | Completed February 11, 2026: introduced reusable empty-state component and upgraded no-data UX messaging |
| 12.5 | Optimize TanStack Query caching | FE | 🟢 | Codex | Completed February 11, 2026: configured query defaults, stale times, and role-aware prefetching |
| 12.6 | Implement code splitting with React.lazy | FE | 🟢 | Codex | Completed February 11, 2026: migrated route pages to lazy-loaded chunks with suspense fallback |
| 12.7 | Add API rate limiting | BE | 🟢 | Codex | Completed February 11, 2026: integrated slowapi default limiter with env-driven limits |
| 12.8 | Add request logging | BE | 🟢 | Codex | Completed February 11, 2026: added request logging middleware with status and duration metadata |
| 12.9 | Write unit tests for critical backend services | BE | 🟢 | Codex | Completed February 11, 2026: added service tests for plan activation and CSV import validation workflows |
| 12.10 | Write integration tests for API endpoints | BE | 🟢 | Codex | Completed February 11, 2026: added urllib-based API integration test suite for health/auth contract checks |
| 12.11 | Write frontend component tests | FE | 🟢 | Codex | Completed February 11, 2026: added Vitest + Testing Library component tests under root `tests/frontend` |
| 12.12 | Performance audit with Lighthouse | OTHER | 🟢 | Codex | Completed February 11, 2026: mobile Lighthouse audit recorded 97/100 in `tests/performance/lighthouse-mobile-report.md` |
| 12.13 | Accessibility audit | OTHER | ⬜ | | WCAG 2.1 AA compliance check |
| 12.14 | Mobile responsiveness QA | OTHER | ⬜ | | Test on 320px, 375px, 428px viewports |
| 12.15 | Cross-browser testing | OTHER | ⬜ | | Chrome, Safari, Firefox, Edge |

---

## Phase 13: Documentation & Deployment

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 13.1 | Write README with Docker setup instructions | OTHER | ⬜ | | `docker-compose up` for local dev; environment variables |
| 13.2 | Document Docker commands cheat sheet | OTHER | ⬜ | | Build, run, logs, exec, clean up commands |
| 13.3 | Document API endpoints in OpenAPI/Swagger | BE | ⬜ | | FastAPI auto-generates; review and enhance |
| 13.4 | Create deployment runbook | OTHER | ⬜ | | Step-by-step Railway Docker deployment guide |
| 13.5 | Push Docker images to container registry | INFRA | ⬜ | | Tag and push frontend/backend images |
| 13.6 | Set up staging environment on Railway | INFRA | ⬜ | | Separate Supabase project; deploy staging containers |
| 13.7 | Configure production environment on Railway | INFRA | ⬜ | | Production Supabase; production container deployment |
| 13.8 | Configure Railway environment variables | INFRA | ⬜ | | Supabase URL, API keys, CORS origins per environment |
| 13.9 | Set up container health checks on Railway | INFRA | ⬜ | | Configure health check endpoints for both services |
| 13.10 | Set up monitoring/alerting | INFRA | ⬜ | | Railway metrics; container logs; error tracking (optional: Sentry) |
| 13.11 | Create database backup strategy | INFRA | ⬜ | | Supabase automatic backups; verify restore process |
| 13.12 | Final security review | OTHER | ⬜ | | Check CORS, auth, RLS policies, Docker security best practices |
| 13.13 | Production deployment | INFRA | ⬜ | | Deploy containers and verify all features |
| 13.14 | Post-launch monitoring | OTHER | ⬜ | | Monitor container health for 48 hours; address issues |
| 13.15 | Standardize root test directory structure and policy in docs (`tests/e2e`, `tests/api`, `tests/performance`) | ENHANCEMENT | 🟢 | Codex | Completed February 9, 2026; documented in AGENTS/CLAUDE/tech stack |
| 13.16 | Add root `.gitignore` with stack defaults and test artifact ignores (Playwright traces/results, Locust outputs) | ENHANCEMENT | 🟢 | Codex | Completed February 9, 2026; includes frontend/backend/test artifacts |
| 13.17 | Add and maintain root `.env.example`; document env-example sync rules in agent docs | ENHANCEMENT | 🟢 | Codex | Completed February 9, 2026; created root `.env.example` and added maintenance rules to AGENTS/CLAUDE |

---

## Task Dependencies

```
Phase 1 (Infrastructure) 
    ↓
Phase 2 (Database) 
    ↓
Phase 3 (Auth) → Required for all protected features
    ↓
Phase 4 (Users) ─┬─→ Phase 6 (Plans) → Phase 10 (Plan Activation)
Phase 5 (Workouts)─┘        ↓
                      Phase 7 (Dashboard/Execution)
                            ↓
                      Phase 8 (Swap/Ad Hoc)
                            ↓
                      Phase 9 (Progress)
                            ↓
                      Phase 11 (Import/Export)
                            ↓
                      Phase 12 (Polish)
                            ↓
                      Phase 13 (Deploy)
```

---

## Summary Statistics

| Phase | Total Tasks | FE | BE | INFRA | DB | OTHER |
|-------|-------------|----|----|-------|-----|-------|
| 1. Infrastructure | 26 | 6 | 5 | 13 | 0 | 2 |
| 2. Database | 18 | 0 | 2 | 0 | 16 | 0 |
| 3. Authentication | 15 | 8 | 6 | 1 | 0 | 0 |
| 4. User Management | 14 | 5 | 8 | 0 | 0 | 1 |
| 5. Workout Library | 17 | 7 | 9 | 0 | 0 | 1 |
| 6. Plan Management | 18 | 7 | 10 | 0 | 0 | 1 |
| 7. Dashboard & Execution | 24 | 18 | 6 | 0 | 0 | 0 |
| 8. Swap & Ad Hoc | 6 | 4 | 2 | 0 | 0 | 0 |
| 9. Progress Dashboard | 13 | 10 | 3 | 0 | 0 | 0 |
| 10. Plan Activation | 5 | 2 | 3 | 0 | 0 | 0 |
| 11. CSV Import/Export | 9 | 3 | 6 | 0 | 0 | 0 |
| 12. Polish | 15 | 7 | 4 | 0 | 0 | 4 |
| 13. Documentation | 17 | 0 | 1 | 8 | 0 | 8 |
| **TOTAL** | **197** | **77** | **65** | **22** | **16** | **17** |

---

## Bugs, Fixes & Enhancements Tracker

This table tracks issues discovered during development that were not part of the original plan.

### Bugs

| ID | Date Reported | Description | Severity | Status | Assigned To | Resolution | Notes |
|----|---------------|-------------|----------|--------|-------------|------------|-------|
| BUG-001 | | | | ⬜ | | | |
| BUG-002 | | | | ⬜ | | | |
| BUG-003 | | | | ⬜ | | | |
| BUG-004 | | | | ⬜ | | | |
| BUG-005 | | | | ⬜ | | | |

### Severity Legend
| Level | Meaning |
|-------|---------|
| 🔴 Critical | App unusable; data loss risk; security issue |
| 🟠 High | Major feature broken; blocking users |
| 🟡 Medium | Feature partially broken; workaround exists |
| 🟢 Low | Minor issue; cosmetic; edge case |

---

### Enhancements & Technical Debt

| ID | Date Added | Description | Priority | Status | Assigned To | Notes |
|----|------------|-------------|----------|--------|-------------|-------|
| ENH-001 | February 9, 2026 | Standardize test placement under root `tests/` with `tests/e2e/frontend`, `tests/e2e/api`, `tests/api`, and `tests/performance` | P1 | 🟢 | Codex | Documentation and directory scaffolding completed |
| ENH-002 | February 9, 2026 | Add root `.gitignore` for frontend/backend/test artifacts including Playwright traces/results and Locust reports | P1 | 🟢 | Codex | Added comprehensive ignore rules with test-output coverage |
| ENH-003 | February 9, 2026 | Add root `.env.example` and enforce updating env-example files whenever new variables are introduced | P1 | 🟢 | Codex | Added root template and synced agent documentation rules in AGENTS/CLAUDE |
| ENH-004 | February 9, 2026 | Add one-command local profile runner with local Supabase (`local`, `prod-like`, `down`) and document workflow in README/AGENTS/CLAUDE | P1 | 🟢 | Codex | Added `scripts/run-profile.sh`, root `Makefile` targets, root `README.md`, and repo instructions updates |
| ENH-005 | | | | ⬜ | | |

### Priority Legend
| Level | Meaning |
|-------|---------|
| P1 | Must have for MVP |
| P2 | Should have if time permits |
| P3 | Nice to have; defer to Phase 2+ |
| P4 | Future consideration |

---

## Notes for Developers

### Prerequisites
- Docker Desktop installed and running
- Git
- Code editor (VS Code recommended)

### Getting Started Checklist
1. ⬜ Clone repository
2. ⬜ Copy `.env.example` to `.env` in both frontend and backend directories
3. ⬜ Fill in environment variables (Supabase URL, keys)
4. ⬜ Run `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build`
5. ⬜ Frontend available at `http://localhost:5173`
6. ⬜ Backend available at `http://localhost:8000`
7. ⬜ API docs at `http://localhost:8000/docs`

### Docker Commands Cheat Sheet
```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Rebuild containers after dependency changes
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Stop all containers
docker-compose down

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute command in running container
docker-compose exec backend bash
docker-compose exec frontend sh

# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Clean up unused images and containers
docker system prune -a
```

### Code Standards
- **Frontend**: Use functional components with hooks; prefer TanStack Query for API calls
- **Backend**: Use async/await for all database operations; add type hints everywhere
- **Both**: Write descriptive commit messages; create PR for each task

### Mobile-First Reminders
- Touch targets: 48px minimum, preferably 56px+
- Test on 375px viewport during development
- Use `rem` units for sizing; base font size 16px
- Test with actual touch device, not just browser dev tools

---

*Last updated: February 11, 2026*
