# GamataFitness MVP Tech Stack

**Version:** 1.0  
**Last Updated:** February 8, 2026  
**Target:** Minimum Viable Product (MVP)

---

## Overview

Streamlined architecture for a role-based fitness tracking application with coach-driven workout plans, flexible session logging, and progress visualization. Built for rapid deployment with a mobile-first responsive design optimized for mid-workout use.

## Core Architecture Principles

- **Mobile-First Web**: Responsive design with large touch targets (48px+) for workout logging
- **Containerized Architecture**: Docker containers for consistent development, testing, and production environments
- **BaaS-Powered**: Supabase for managed auth and database, reducing infrastructure overhead
- **Async Data Flow**: No real-time requirements for MVP; standard REST API patterns
- **Role-Based Access**: Admin, Coach, and User roles with distinct permissions and views
- **Soft Delete Pattern**: Archive workflows to maintain data integrity and history

---

## Repository Structure

```
gamata-fitness/
├── docker-compose.yml           # Multi-container orchestration
├── docker-compose.dev.yml       # Development overrides
├── docker-compose.prod.yml      # Production overrides
├── .dockerignore                # Docker build exclusions
│
├── frontend/                    # Vite + React application
│   ├── Dockerfile               # Frontend container build
│   ├── Dockerfile.dev           # Development with hot reload
│   ├── nginx.conf               # Production static serving
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── dashboard/       # Role-specific dashboards
│   │   │   ├── workout/         # Workout execution components
│   │   │   ├── plan/            # Plan builder & assignment
│   │   │   └── shared/          # Auth guards, loading states
│   │   ├── pages/
│   │   │   ├── auth/            # Login, register
│   │   │   ├── admin/           # User & workout management
│   │   │   ├── coach/           # Plan builder, user roster
│   │   │   └── user/            # Dashboard, workout, progress
│   │   ├── lib/
│   │   │   ├── api-client.ts    # Backend API client
│   │   │   ├── supabase.ts      # Supabase client config
│   │   │   └── utils.ts         # Helper functions
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript definitions
│   │   └── styles/              # Global styles, Tailwind config
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                     # FastAPI application
│   ├── Dockerfile               # Backend container build
│   ├── Dockerfile.dev           # Development with auto-reload
│   ├── app/
│   │   ├── main.py              # FastAPI app initialization
│   │   ├── config.py            # Environment configuration
│   │   └── database.py          # Supabase/PostgreSQL connection
│   ├── api/
│   │   ├── auth.py              # Authentication endpoints
│   │   ├── users.py             # User management (Admin)
│   │   ├── workouts.py          # Workout library CRUD
│   │   ├── plans.py             # Plan management (Coach)
│   │   ├── sessions.py          # Workout session logging
│   │   ├── progress.py          # Progress & analytics
│   │   └── import_export.py     # CSV import/export
│   ├── models/                  # SQLAlchemy models
│   ├── schemas/                 # Pydantic schemas
│   ├── services/                # Business logic layer
│   ├── core/
│   │   ├── permissions.py       # RBAC implementation
│   │   └── exceptions.py        # Custom exceptions
│   └── requirements.txt
│
├── database/
│   ├── migrations/              # Alembic migrations
│   └── seed/                    # Initial data (workout library)
│
├── tests/                       # Centralized automated test suites
│   ├── e2e/                     # Playwright end-to-end tests
│   │   ├── frontend/            # Frontend end-to-end scenarios
│   │   └── api/                 # API end-to-end scenarios in Playwright
│   ├── api/                     # API integration and endpoint tests
│   └── performance/             # Performance and load tests
│
├── docs/                        # Documentation
└── README.md
```

---

## Frontend Stack

### Core Framework
- **Vite 6.x** - Fast build tool with HMR
- **React 19.x** - UI library with latest features
- **TypeScript 5.7+** - Type safety
- **React Router 7.x** - Client-side routing

### UI & Styling
- **shadcn/ui** - Accessible component library built on Radix UI
- **Tailwind CSS 3.4+** - Utility-first styling
- **Lucide React** - Icon library
- **class-variance-authority** - Component variant management

### State & Data
- **TanStack Query (React Query) 5.x** - Server state management with caching
- **React Hook Form 7.x** - Form handling
- **Zod 3.x** - Schema validation
- **date-fns** - Date manipulation

### Data Visualization
- **Recharts 2.x** - Charts for progress dashboards

### Mobile UX Components
- **Custom sliders** - Weight input with large touch zones
- **Stepper components** - Rep/set counting with 56px+ targets
- **Gesture-friendly buttons** - Quick preset values (8, 10, 12 reps)

---

## Backend Stack

### Core Framework
- **FastAPI 0.115+** - Async Python web framework
- **Python 3.12+** - Latest stable release
- **Uvicorn** - ASGI server
- **Pydantic 2.x** - Data validation

### Containerization
- **Docker** - Container runtime
- **Docker Compose** - Multi-container orchestration
- **Multi-stage builds** - Optimized production images

### Database & ORM
- **Supabase PostgreSQL** - Managed database
- **SQLAlchemy 2.x** - ORM with async support
- **Alembic** - Database migrations

### Authentication
- **Supabase Auth** - Managed authentication service
- **JWT verification** - Token validation in FastAPI middleware
- **supabase-py** - Python client for Supabase services

### Data Processing
- **pandas** - CSV import/export operations
- **python-multipart** - File upload handling

---

## Infrastructure

### Testing Directory Convention
- All automated tests must be stored under the root `tests/` directory.
- Playwright end-to-end tests go in `tests/e2e/`.
- End-to-end tests are organized by target in `tests/e2e/frontend/` and `tests/e2e/api/`.
- API non-Playwright tests (integration/endpoint tests) go in `tests/api/`.
- Performance and load tests go in `tests/performance/`.
- Do not place new tests in `frontend/` or `backend/`.

### Testing Tooling
| Test Type | Tooling | Location |
|-----------|---------|----------|
| Frontend end-to-end | Playwright | `tests/e2e/frontend/` |
| API tests | PyTest + Python standard library request utilities (`urllib.request`) | `tests/api/` |
| API end-to-end (browser-driven/API-flow) | Playwright | `tests/e2e/api/` |
| Performance/load | Locust (`locust.io`) | `tests/performance/` |

### Containerization Strategy
| Component | Base Image | Purpose |
|-----------|------------|----------|
| Frontend (dev) | `node:20-alpine` | Development with Vite HMR |
| Frontend (prod) | `nginx:alpine` | Serve static build |
| Backend (dev) | `python:3.12-slim` | Development with auto-reload |
| Backend (prod) | `python:3.12-slim` | Production API server |

### Docker Compose Services
| Service | Ports | Description |
|---------|-------|-------------|
| `frontend` | 5173 (dev) / 80 (prod) | React application |
| `backend` | 8000 | FastAPI application |

### Hosting & Deployment
| Service | Provider | Purpose |
|---------|----------|----------|
| Container Registry | Docker Hub / GitHub Container Registry | Image storage |
| Frontend | Railway | Docker container deployment |
| Backend | Railway | Docker container deployment |
| Database | Supabase | PostgreSQL with backups |
| Auth | Supabase | User authentication |

### Environment Configuration
| Environment | Docker Compose File | Purpose |
|-------------|---------------------|----------|
| Development | `docker-compose.dev.yml` | Local development with hot reload, volume mounts |
| Staging | `docker-compose.prod.yml` | Pre-production testing with production builds |
| Production | `docker-compose.prod.yml` | Live application with optimized images |

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Containerization | Docker + Docker Compose | Consistent environments, easy onboarding, production parity |
| Frontend Framework | Vite + React | Fast development, team expertise, mobile-first support |
| Backend Framework | FastAPI | Async support, auto-docs, Python ecosystem |
| Database | Supabase PostgreSQL | Managed service, built-in auth, Row Level Security |
| Authentication | Supabase Auth | Reduces custom auth complexity, OAuth ready |
| UI Components | shadcn/ui | Accessible, customizable, Tailwind-native |
| Hosting | Railway (Docker) | Simple container deployment, auto-scaling, Git integration |
| State Management | TanStack Query | Built-in caching, optimistic updates, devtools |

---

## Performance Targets

| Metric | Target | Implementation |
|--------|--------|----------------|
| Page Load | < 2 seconds on 4G | Code splitting, lazy loading, optimized assets |
| Workout Logging | < 500ms latency | Optimistic updates, local state |
| Touch Targets | 48px minimum | Custom UI components, mobile-first CSS |
| Offline Resilience | Graceful degradation | Queue failed requests, retry on reconnect |

---

## Browser & Device Support

| Platform | Minimum Version |
|----------|-----------------|
| Chrome | 90+ |
| Safari | 14+ |
| Firefox | 90+ |
| Edge | 90+ |
| Mobile Safari | iOS 14+ |
| Chrome Mobile | Android 10+ |

**Viewport Support:** 320px minimum width, optimized for 375px-428px (common mobile devices)

---

## Third-Party Integrations

| Integration | Purpose | Priority |
|-------------|---------|----------|
| Docker | Containerization | MVP |
| Supabase | Auth + Database | MVP |
| Railway | Container Hosting | MVP |
| CSV Parser | Data import/export | Phase 2 |

---

## Cost Estimate

| Tier | Railway | Supabase | Total |
|------|---------|----------|-------|
| Development | $0 | $0 | **$0/mo** |
| Production (< 1K users) | ~$10-20/mo | $25/mo | **~$35-45/mo** |

---

## Future Considerations

| Feature | Technical Implication |
|---------|----------------------|
| Offline Support (PWA) | Service workers, IndexedDB caching |
| Push Notifications | Web Push API, notification service |
| Real-time Updates | Supabase Realtime subscriptions |
| Native Mobile Apps | React Native with shared business logic |
| Coach Hierarchy | Extended RBAC, recursive relationships |
