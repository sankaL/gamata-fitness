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
| 1.1 | Create GitHub repository with branch protection rules | INFRA | ⬜ | | Main branch protected; require PR reviews |
| 1.2 | Set up Supabase project (dev environment) | INFRA | ⬜ | | Create project at supabase.com; save connection strings |
| 1.3 | Create root `docker-compose.yml` | INFRA | ⬜ | | Define frontend and backend services; shared network |
| 1.4 | Create `docker-compose.dev.yml` override | INFRA | ⬜ | | Volume mounts for hot reload; dev environment variables |
| 1.5 | Create `docker-compose.prod.yml` override | INFRA | ⬜ | | Production builds; no volume mounts; optimized settings |
| 1.6 | Create `.dockerignore` file | INFRA | ⬜ | | Exclude node_modules, __pycache__, .git, .env files |
| 1.7 | Initialize backend project structure | BE | ⬜ | | Follow repo structure in tech stack doc; use `pip` with requirements.txt |
| 1.8 | Create backend `Dockerfile` (production) | BE | ⬜ | | Multi-stage build; Python 3.12-slim base; copy requirements, install, copy app |
| 1.9 | Create backend `Dockerfile.dev` | BE | ⬜ | | Single stage; install requirements; uvicorn with --reload |
| 1.10 | Initialize frontend project with Vite + React + TypeScript | FE | ⬜ | | Run `npm create vite@latest frontend -- --template react-ts` |
| 1.11 | Create frontend `Dockerfile` (production) | FE | ⬜ | | Multi-stage: node build stage → nginx:alpine serving static files |
| 1.12 | Create frontend `Dockerfile.dev` | FE | ⬜ | | Node:20-alpine; npm install; vite dev server with HMR |
| 1.13 | Create frontend `nginx.conf` | FE | ⬜ | | SPA routing; gzip compression; cache headers for static assets |
| 1.14 | Configure Tailwind CSS in frontend | FE | ⬜ | | Follow Tailwind + Vite setup guide |
| 1.15 | Install and configure shadcn/ui | FE | ⬜ | | Run `npx shadcn-ui@latest init`; select components as needed |
| 1.16 | Set up ESLint + Prettier for frontend | FE | ⬜ | | Consistent code formatting across team |
| 1.17 | Set up Black + isort for backend | BE | ⬜ | | Python code formatting |
| 1.18 | Create `.env.example` files for both frontend and backend | OTHER | ⬜ | | Document all required environment variables |
| 1.19 | Set up Supabase client in backend (`supabase-py`) | BE | ⬜ | | Create `app/database.py` with connection logic |
| 1.20 | Set up Supabase client in frontend | FE | ⬜ | | Create `lib/supabase.ts` with client initialization |
| 1.21 | Configure CORS in FastAPI for frontend origin | BE | ⬜ | | Allow localhost:5173 (dev) and production URL |
| 1.22 | Create basic health check endpoint (`GET /health`) | BE | ⬜ | | Returns `{ "status": "ok" }` for container health checks |
| 1.23 | Add healthcheck to docker-compose for backend | INFRA | ⬜ | | `curl -f http://localhost:8000/health` with interval |
| 1.24 | Verify `docker-compose up` runs both services | INFRA | ⬜ | | Frontend accessible at :5173, backend at :8000 |
| 1.25 | Verify frontend can call backend health endpoint | FE | ⬜ | | Test CORS and connectivity within Docker network |
| 1.26 | Set up Railway project with Docker deployment | INFRA | ⬜ | | Connect to GitHub repo; configure Dockerfile paths; set env vars |

---

## Phase 2: Database Schema & Models

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 2.1 | Design and create `users` table in Supabase | DB | ⬜ | | id (UUID), name, email, role (enum: admin/coach/user), created_at, updated_at |
| 2.2 | Create `coach_user_assignments` table | DB | ⬜ | | id, coach_id (FK), user_id (FK), assigned_at, assigned_by |
| 2.3 | Create `muscle_groups` table | DB | ⬜ | | id, name, icon, is_default, created_at |
| 2.4 | Create `cardio_types` table | DB | ⬜ | | id, name, description |
| 2.5 | Create `workouts` table | DB | ⬜ | | id, name, description, instructions, type (strength/cardio), is_archived, created_at, updated_at |
| 2.6 | Create `workout_muscle_groups` junction table | DB | ⬜ | | workout_id, muscle_group_id (many-to-many) |
| 2.7 | Create `workout_plans` table | DB | ⬜ | | id, name, coach_id (FK), start_date, end_date, created_at, updated_at |
| 2.8 | Create `plan_days` table | DB | ⬜ | | id, plan_id (FK), day_of_week (0-6) |
| 2.9 | Create `plan_day_workouts` junction table | DB | ⬜ | | plan_day_id, workout_id (multiple workouts per day) |
| 2.10 | Create `plan_assignments` table | DB | ⬜ | | id, plan_id (FK), user_id (FK), status (pending/active/inactive), assigned_at, activated_at, deactivated_at |
| 2.11 | Create `workout_sessions` table | DB | ⬜ | | id, user_id (FK), workout_id (FK), plan_id (FK nullable), session_type (assigned/swap/adhoc), completed_at, updated_at |
| 2.12 | Create `exercise_logs` table | DB | ⬜ | | id, session_id (FK), sets, reps, weight, duration, notes, logged_at, updated_at |
| 2.13 | Set up Alembic for migrations | BE | ⬜ | | Initialize Alembic in `database/migrations/` |
| 2.14 | Create SQLAlchemy models matching database schema | BE | ⬜ | | Create models in `backend/models/` directory |
| 2.15 | Seed muscle groups with default values | DB | ⬜ | | Chest, Back, Legs, Shoulders, Arms, Core, Full-Body |
| 2.16 | Seed cardio types with default values | DB | ⬜ | | HIIT, Steady State, Interval, Circuit |
| 2.17 | Seed initial workout library | DB | ⬜ | | 20-30 common exercises (bench press, squat, deadlift, etc.) |
| 2.18 | Configure Row Level Security (RLS) policies in Supabase | DB | ⬜ | | Users can only access their own data; coaches can access assigned users |

---

## Phase 3: Authentication

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 3.1 | Configure Supabase Auth settings | INFRA | ⬜ | | Enable email/password auth; configure redirect URLs |
| 3.2 | Create Pydantic schemas for auth (login, register, user response) | BE | ⬜ | | In `backend/schemas/auth.py` |
| 3.3 | Implement JWT verification middleware in FastAPI | BE | ⬜ | | Verify Supabase JWT tokens on protected routes |
| 3.4 | Create `POST /auth/register` endpoint | BE | ⬜ | | Register user in Supabase Auth + create user record in users table |
| 3.5 | Create `POST /auth/login` endpoint | BE | ⬜ | | Return JWT token and user info |
| 3.6 | Create `GET /auth/me` endpoint | BE | ⬜ | | Return current user profile from token |
| 3.7 | Implement RBAC permission decorator | BE | ⬜ | | `@require_role(["admin", "coach"])` decorator in `core/permissions.py` |
| 3.8 | Create Login page component | FE | ⬜ | | Use React Hook Form + Zod validation; shadcn/ui inputs |
| 3.9 | Create Registration page component | FE | ⬜ | | Name, email, password fields |
| 3.10 | Create AuthContext provider | FE | ⬜ | | Store user, token; provide login/logout functions |
| 3.11 | Create ProtectedRoute component | FE | ⬜ | | Redirect to login if not authenticated |
| 3.12 | Create RoleGuard component | FE | ⬜ | | Show content only for specific roles |
| 3.13 | Implement role-based routing in App.tsx | FE | ⬜ | | Redirect to correct dashboard based on role |
| 3.14 | Create logout functionality | FE | ⬜ | | Clear token; redirect to login |
| 3.15 | Create password reset flow | FE/BE | ⬜ | | Use Supabase built-in password reset |

---

## Phase 4: User Management (Admin)

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 4.1 | Create Pydantic schemas for users (create, update, list) | BE | ⬜ | | In `backend/schemas/users.py` |
| 4.2 | Create `GET /users` endpoint (admin only) | BE | ⬜ | | Return paginated user list with role filter |
| 4.3 | Create `GET /users/{id}` endpoint | BE | ⬜ | | Return single user details |
| 4.4 | Create `POST /users` endpoint (admin only) | BE | ⬜ | | Create new user with specified role |
| 4.5 | Create `PUT /users/{id}` endpoint (admin only) | BE | ⬜ | | Update user name, email, role |
| 4.6 | Create `DELETE /users/{id}` endpoint (admin only) | BE | ⬜ | | Soft delete (deactivate) user |
| 4.7 | Create Admin Users List page | FE | ⬜ | | Table with search, role filter, pagination |
| 4.8 | Create User Create/Edit form modal | FE | ⬜ | | Form with validation; role dropdown |
| 4.9 | Create User deactivation confirmation modal | FE | ⬜ | | Confirm before deactivating |
| 4.10 | Implement coach assignment UI | FE | ⬜ | | Multi-select dropdown to assign coaches to users |
| 4.11 | Create `POST /users/{id}/coaches` endpoint | BE | ⬜ | | Assign coaches to user (many-to-many) |
| 4.12 | Create `DELETE /users/{id}/coaches/{coach_id}` endpoint | BE | ⬜ | | Remove coach assignment |
| 4.13 | Implement 50-user limit check for coaches | BE | ⬜ | | Return error if coach already has 50 users |
| 4.14 | Create Admin dashboard overview | FE | ⬜ | | Total users, coaches, workouts counts; quick action buttons |

---

## Phase 5: Workout Library (Admin)

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 5.1 | Create Pydantic schemas for workouts | BE | ⬜ | | Create, update, list schemas with muscle groups |
| 5.2 | Create `GET /workouts` endpoint | BE | ⬜ | | Filter by type, muscle group, archived status; paginated |
| 5.3 | Create `GET /workouts/{id}` endpoint | BE | ⬜ | | Return workout with muscle groups |
| 5.4 | Create `POST /workouts` endpoint (admin only) | BE | ⬜ | | Create workout with muscle group assignments |
| 5.5 | Create `PUT /workouts/{id}` endpoint (admin only) | BE | ⬜ | | Update workout details |
| 5.6 | Create `POST /workouts/{id}/archive` endpoint (admin only) | BE | ⬜ | | Soft delete with dependency check |
| 5.7 | Implement active plan dependency check | BE | ⬜ | | Query plan_day_workouts for active plans; block if found |
| 5.8 | Create `GET /muscle-groups` endpoint | BE | ⬜ | | Return all muscle groups |
| 5.9 | Create `POST /muscle-groups` endpoint (admin only) | BE | ⬜ | | Add custom muscle group |
| 5.10 | Create `GET /cardio-types` endpoint | BE | ⬜ | | Return all cardio types |
| 5.11 | Create Workout Library page | FE | ⬜ | | Card grid or table; filter sidebar; search |
| 5.12 | Create Workout Create/Edit form | FE | ⬜ | | Dynamic fields based on type (strength vs cardio) |
| 5.13 | Create strength workout fields | FE | ⬜ | | Target sets, reps, suggested weight inputs |
| 5.14 | Create cardio workout fields | FE | ⬜ | | Duration, difficulty dropdown (Easy/Medium/Hard), cardio type |
| 5.15 | Create muscle group multi-select component | FE | ⬜ | | Checkbox group with icons |
| 5.16 | Create archive confirmation modal with dependency warning | FE | ⬜ | | Show active plan count if blocked |
| 5.17 | Create unarchive functionality | BE/FE | ⬜ | | Restore archived workouts |

---

## Phase 6: Plan Management (Coach)

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 6.1 | Create Pydantic schemas for plans | BE | ⬜ | | Plan create, update, assignment schemas |
| 6.2 | Create `GET /plans` endpoint (coach) | BE | ⬜ | | Return plans created by coach |
| 6.3 | Create `GET /plans/{id}` endpoint | BE | ⬜ | | Return plan with days and workouts |
| 6.4 | Create `POST /plans` endpoint (coach) | BE | ⬜ | | Create plan with days and workout assignments |
| 6.5 | Create `PUT /plans/{id}` endpoint (coach) | BE | ⬜ | | Update plan details and workouts |
| 6.6 | Create `DELETE /plans/{id}` endpoint (coach) | BE | ⬜ | | Soft delete plan |
| 6.7 | Create `POST /plans/{id}/assign` endpoint | BE | ⬜ | | Assign plan to user(s); handle pending status |
| 6.8 | Create `GET /plans/{id}/users` endpoint | BE | ⬜ | | Return users assigned to plan with status |
| 6.9 | Implement one-active-plan logic | BE | ⬜ | | New assignment = pending if user has active plan |
| 6.10 | Create `GET /coaches/{id}/users` endpoint | BE | ⬜ | | Return users assigned to coach |
| 6.11 | Create Plan Builder page | FE | ⬜ | | Weekly grid layout (7 columns) |
| 6.12 | Create day workout selector component | FE | ⬜ | | Click day → modal to select workouts |
| 6.13 | Create workout picker modal | FE | ⬜ | | Search/filter workouts; multi-select |
| 6.14 | Create plan save functionality | FE | ⬜ | | Validate at least one workout assigned |
| 6.15 | Create user assignment panel | FE | ⬜ | | Select users from coach's roster |
| 6.16 | Create Coach Dashboard | FE | ⬜ | | List of assigned users; plan status per user |
| 6.17 | Create plan completion status display | FE | ⬜ | | Show % of workouts completed this week |

---

## Phase 7: User Dashboard & Workout Execution

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 7.1 | Create `GET /users/me/today` endpoint | BE | ⬜ | | Return today's workout from active plan |
| 7.2 | Create `GET /users/me/plan` endpoint | BE | ⬜ | | Return current week's plan preview |
| 7.3 | Create `GET /users/me/stats` endpoint | BE | ⬜ | | Return quick stats (sessions this week, streak) |
| 7.4 | Create `GET /users/me/coaches` endpoint | BE | ⬜ | | Return list of assigned coaches |
| 7.5 | Create User Dashboard page | FE | ⬜ | | Today's workout card prominent; week preview; stats |
| 7.6 | Create Today's Workout card component | FE | ⬜ | | Workout name, muscle groups, "Start" button |
| 7.7 | Create Weekly Plan preview component | FE | ⬜ | | 7-day strip showing workout per day |
| 7.8 | Create Quick Stats component | FE | ⬜ | | Sessions this week, streak counter |
| 7.9 | Create My Coaches page | FE | ⬜ | | List of coaches with names |
| 7.10 | Create `POST /sessions` endpoint | BE | ⬜ | | Start a workout session |
| 7.11 | Create `PUT /sessions/{id}` endpoint | BE | ⬜ | | Update session (add exercise logs) |
| 7.12 | Create `POST /sessions/{id}/complete` endpoint | BE | ⬜ | | Mark session complete |
| 7.13 | Create `POST /sessions/{id}/logs` endpoint | BE | ⬜ | | Add exercise log to session |
| 7.14 | Create `PUT /sessions/{id}/logs/{log_id}` endpoint | BE | ⬜ | | Edit exercise log |
| 7.15 | Create Workout Execution page | FE | ⬜ | | Full-screen workout view; exercise list |
| 7.16 | Create Exercise Card component (strength) | FE | ⬜ | | Large weight slider, rep stepper, set checkboxes |
| 7.17 | Create weight input slider component | FE | ⬜ | | 56px+ touch target; +/- buttons; presets |
| 7.18 | Create rep input stepper component | FE | ⬜ | | Large buttons; common values (8, 10, 12) as quick buttons |
| 7.19 | Create set completion checklist | FE | ⬜ | | Visual checkboxes; tap to complete set |
| 7.20 | Create Exercise Card component (cardio) | FE | ⬜ | | Duration timer, notes field |
| 7.21 | Create cardio timer component | FE | ⬜ | | Start/pause/stop; large display |
| 7.22 | Create workout completion flow | FE | ⬜ | | "Finish Workout" button; save all logs |
| 7.23 | Create workout complete celebration | FE | ⬜ | | Success animation; summary stats |
| 7.24 | Implement optimistic UI updates | FE | ⬜ | | Log sets locally; sync in background |

---

## Phase 8: Workout Swap & Ad Hoc

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 8.1 | Create `GET /workouts/alternatives/{workout_id}` endpoint | BE | ⬜ | | Return workouts with same muscle group |
| 8.2 | Create Swap Workout modal | FE | ⬜ | | Show alternatives; allow selection |
| 8.3 | Implement swap session creation | BE | ⬜ | | Session with session_type = "swap" |
| 8.4 | Create Ad Hoc workout selection page | FE | ⬜ | | Browse full workout library |
| 8.5 | Implement ad hoc session creation | BE | ⬜ | | Session with session_type = "adhoc", plan_id = null |
| 8.6 | Create "Swap" and "Ad Hoc" buttons on dashboard | FE | ⬜ | | Below today's workout card |

---

## Phase 9: Progress Dashboard

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 9.1 | Create `GET /users/me/sessions` endpoint | BE | ⬜ | | Paginated session history with filters |
| 9.2 | Create `GET /users/me/progress/muscle-groups` endpoint | BE | ⬜ | | Aggregate volume by muscle group over time |
| 9.3 | Create `GET /users/me/progress/frequency` endpoint | BE | ⬜ | | Weekly/monthly workout frequency |
| 9.4 | Install and configure Recharts | FE | ⬜ | | `npm install recharts` |
| 9.5 | Create Progress Dashboard page | FE | ⬜ | | Tab layout: History, Trends, Stats |
| 9.6 | Create Session History list | FE | ⬜ | | Chronological list; expandable for details |
| 9.7 | Create date range filter | FE | ⬜ | | Last 7 days, 30 days, custom range |
| 9.8 | Create workout type filter | FE | ⬜ | | Strength, Cardio, All |
| 9.9 | Create muscle group filter | FE | ⬜ | | Multi-select muscle groups |
| 9.10 | Create Muscle Group chart | FE | ⬜ | | Bar chart showing volume per muscle group |
| 9.11 | Create Weekly Frequency chart | FE | ⬜ | | Bar chart of sessions per week |
| 9.12 | Create Session Edit modal | FE | ⬜ | | Allow editing logged sets/reps/weight after completion |
| 9.13 | Create max weight tracking display | FE | ⬜ | | Show PR (personal record) per exercise |

---

## Phase 10: Plan Activation Flow

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 10.1 | Create `GET /users/me/pending-plans` endpoint | BE | ⬜ | | Return pending plan assignments |
| 10.2 | Create `POST /plan-assignments/{id}/activate` endpoint | BE | ⬜ | | Activate pending plan; deactivate current |
| 10.3 | Create `POST /plan-assignments/{id}/decline` endpoint | BE | ⬜ | | Decline pending plan |
| 10.4 | Create Plan Activation modal | FE | ⬜ | | Show on login if pending plan exists |
| 10.5 | Create Plans Settings page | FE | ⬜ | | View active plan, pending plans; manage activation |

---

## Phase 11: CSV Import/Export

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 11.1 | Create `GET /users/export` endpoint (admin) | BE | ⬜ | | Export users as CSV |
| 11.2 | Create `GET /workouts/export` endpoint (admin) | BE | ⬜ | | Export workouts as CSV |
| 11.3 | Create `GET /plans/{id}/export` endpoint (coach) | BE | ⬜ | | Export plan as CSV |
| 11.4 | Create `POST /users/import` endpoint (admin) | BE | ⬜ | | Import users from CSV; return validation errors |
| 11.5 | Create `POST /workouts/import` endpoint (admin) | BE | ⬜ | | Import workouts from CSV |
| 11.6 | Implement CSV validation with error reporting | BE | ⬜ | | Return row-by-row errors for invalid data |
| 11.7 | Create Export buttons in Admin UI | FE | ⬜ | | Download CSV files |
| 11.8 | Create Import modal with file upload | FE | ⬜ | | Upload CSV; show validation results |
| 11.9 | Create import error display | FE | ⬜ | | Table showing invalid rows and reasons |

---

## Phase 12: Polish & Optimization

| # | Task | Type | Status | Assigned To | Notes |
|---|------|------|--------|-------------|-------|
| 12.1 | Implement loading states across all pages | FE | ⬜ | | Skeleton loaders; spinners |
| 12.2 | Implement error boundary component | FE | ⬜ | | Graceful error handling |
| 12.3 | Add toast notifications | FE | ⬜ | | Success/error feedback on actions |
| 12.4 | Implement empty states | FE | ⬜ | | Friendly messages when no data |
| 12.5 | Optimize TanStack Query caching | FE | ⬜ | | Configure stale times; prefetching |
| 12.6 | Implement code splitting with React.lazy | FE | ⬜ | | Split by route; reduce initial bundle |
| 12.7 | Add API rate limiting | BE | ⬜ | | Prevent abuse; use slowapi |
| 12.8 | Add request logging | BE | ⬜ | | Log all API requests for debugging |
| 12.9 | Write unit tests for critical backend services | BE | ⬜ | | pytest; focus on business logic |
| 12.10 | Write integration tests for API endpoints | BE | ⬜ | | pytest + httpx async client |
| 12.11 | Write frontend component tests | FE | ⬜ | | Vitest + React Testing Library |
| 12.12 | Performance audit with Lighthouse | OTHER | ⬜ | | Target 90+ score on mobile |
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
| 6. Plan Management | 17 | 7 | 10 | 0 | 0 | 0 |
| 7. Dashboard & Execution | 24 | 18 | 6 | 0 | 0 | 0 |
| 8. Swap & Ad Hoc | 6 | 4 | 2 | 0 | 0 | 0 |
| 9. Progress Dashboard | 13 | 10 | 3 | 0 | 0 | 0 |
| 10. Plan Activation | 5 | 2 | 3 | 0 | 0 | 0 |
| 11. CSV Import/Export | 9 | 3 | 6 | 0 | 0 | 0 |
| 12. Polish | 15 | 7 | 4 | 0 | 0 | 4 |
| 13. Documentation | 14 | 0 | 1 | 8 | 0 | 5 |
| **TOTAL** | **193** | **77** | **65** | **22** | **16** | **13** |

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
| ENH-001 | | | | ⬜ | | |
| ENH-002 | | | | ⬜ | | |
| ENH-003 | | | | ⬜ | | |
| ENH-004 | | | | ⬜ | | |
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

*Last updated: February 8, 2026*
