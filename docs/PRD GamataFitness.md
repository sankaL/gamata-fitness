# PRD: GamataFitness - Fitness Tracking App

## Section 1: Problem Definition

### What are we building, and why?

GamataFitness is a modern, ad-free fitness tracking application designed to simplify workout management for users, coaches, and administrators. The app prioritizes simplicity and usability over feature bloat.

We are building:
1. **Role-Based Access System**: Three distinct user roles (Admin, Coach, Regular User) with appropriate permissions and workflows.
2. **Workout Management**: Complete CRUD operations for workouts (strength and cardio) with dependency-aware deletion.
3. **Weekly Plan Assignment**: Coach-driven workout plan creation and assignment to users.
4. **Progress Tracking**: User dashboards showing session history and muscle group progression.
5. **Flexible Workout Execution**: Support for assigned workouts, swaps, and ad hoc sessions.
6. **Data Portability**: CSV import/export for users, workouts, and plans.

### What is the problem you are trying to solve and for who?

**Target Personas:**

| Persona | Description |
|---------|-------------|
| Admin | Gym owner or system administrator managing the platform, users, and workout library |
| Coach | Personal trainer managing multiple clients with customized workout plans |
| Regular User | Fitness enthusiast following assigned plans while tracking progress |

**Problem 1: Existing Apps Are Bloated**
Most fitness apps are cluttered with social features, premium upsells, and unnecessary complexity. Users want a clean, focused experience.

**Problem 2: No Simple Coach-User Workflow**
Coaches need an easy way to assign and monitor workout plans without enterprise-level complexity.

**Problem 3: Rigid Workout Plans**
Users need flexibility to swap workouts or perform ad hoc sessions while maintaining progress tracking.

**Problem 4: Poor Mobile Experience During Workouts**
Tiny buttons and complex navigation make apps difficult to use mid-workout. Large, touch-friendly elements are essential.

**Problem 5: Mixed Workout Type Handling**
Cardio workouts (duration-based) require different tracking than strength workouts (sets/reps/weight), but most apps treat them identically.

### PR Summary: Why will customers be excited?

GamataFitness delivers a beautifully minimal workout tracking experience. Follow your coach's plan, swap workouts when needed, or go ad hoc—it's your fitness journey. Track your progress by muscle group, see your gains visualized, and never fight with cluttered interfaces again. Large touch targets mean you can log sets mid-workout without frustration. Coaches get simple plan management; admins get full control with smart data protection.

### What is the desired user journey?

**Happy Path A: Regular User - Following Assigned Plan**

| Step | Journey | Notes |
|------|---------|-------|
| 1 | User logs in and sees today's assigned workout | Dashboard shows current plan overview |
| 2 | User taps "Start Workout" | Workout details displayed with clear instructions |
| 3 | User performs exercises, logging sets/reps/weight (or duration for cardio) | Large input controls; slider/stepper for weight |
| 4 | User completes workout and taps "Finish" | Session saved; stats updated |
| 5 | User views progress dashboard | Muscle group breakdown; session history |

**Happy Path B: Regular User - Swap or Ad Hoc Workout**

| Step | Journey | Notes |
|------|---------|-------|
| 1 | User views today's assigned workout | Decides to change |
| 2 | User taps "Swap Workout" | Sees alternative workouts for same muscle group |
| 3 | User selects alternative or taps "Ad Hoc Workout" | Browse full workout library |
| 4 | User performs and logs workout | Marked as "swap" or "ad hoc" in history |
| 5 | Progress tracked normally | Counts toward muscle group stats |

**Happy Path C: Coach - Creating and Assigning Plans**

| Step | Journey | Notes |
|------|---------|-------|
| 1 | Coach logs in and views assigned users | List of clients with current plan status |
| 2 | Coach creates new weekly plan | Selects workouts for each day |
| 3 | Coach assigns plan to user(s) | Date range specified |
| 4 | Coach monitors user progress | Dashboard shows completion rates |
| 5 | Coach exports plan to CSV | Shareable/archivable format |

**Happy Path D: Admin - Managing Workouts**

| Step | Journey | Notes |
|------|---------|-------|
| 1 | Admin navigates to Workout Management | Full workout library displayed |
| 2 | Admin creates new workout | Form with exercise details, muscle groups, type (strength/cardio) |
| 3 | Admin attempts to delete a workout | System checks dependencies |
| 4 | If workout is in active plan or has completed sessions, deletion blocked | Clear error message with reason |
| 5 | Admin exports/imports workout library | CSV format |

**Unhappy Paths:**

| Step | Failure Mode | Expected Result |
|------|--------------|-----------------|
| Archive | Workout is part of active plan | Block archival: "This workout is assigned in X active plans" |
| Archive | Workout has completed sessions | Allow archival; sessions retain reference for history |
| Import | CSV has invalid format | Show validation errors; import only valid rows |
| Assign | User already has active plan | Save as pending; user prompted to activate on login |
| Coach Limit | Coach has 50 users assigned | Block assignment: "Coach has reached maximum user limit (50)" |

### How will we measure success?

| Goal | How to Measure | Success Metric |
|------|----------------|----------------|
| User engagement | Weekly active sessions per user | ≥3 sessions/week |
| Plan adherence | % of assigned workouts completed | ≥70% |
| User satisfaction | App Store rating / feedback | ≥4.5 stars |
| Coach efficiency | Time to create weekly plan | <5 minutes |
| Data integrity | Attempted invalid deletions blocked | 100% |

---

## Section 2: Highlight the Risks & Assumptions

### What are the risks?

| Risk Type | Risk Detail | Level | Mitigation |
|-----------|-------------|-------|------------|
| Usability | Users confused by role differences | LOW | Clear onboarding; role-specific dashboards |
| Usability | Workout logging too slow mid-exercise | HIGH | Large touch targets; minimal taps; smart defaults |
| Performance | Slow load times on mobile | MED | Optimize assets; lazy loading; Railway auto-scaling |
| Data Integrity | Accidental deletion of critical workouts | HIGH | Dependency checks; soft delete option; confirmation modals |
| Adoption | Coaches resist learning new tool | MED | Simple UI; CSV export for familiar workflows |
| Feature Creep | Requests for social/gamification features | MED | Maintain focus on core simplicity; defer non-essential features |

### What are the assumptions?

| Assumption | Notes |
|------------|-------|
| Users prefer simplicity over features | Core value proposition; validate with early feedback |
| Coaches manage 5-20 clients typically | Scale UI accordingly |
| Mobile is primary usage context | Desktop is secondary; mobile-first design |
| CSV is acceptable import/export format | Standard for fitness data; Excel-compatible |
| Railway hosting meets performance needs | Evaluate during MVP; plan for scaling |

### Who are our competitors, and how are they different?

| Competitor | Difference |
|------------|------------|
| Strong, Hevy | Feature-rich but cluttered; social features; premium tiers |
| FitNotes | Simple but dated UI; no coach workflow |
| Trainerize | Enterprise-focused; expensive; complex |
| Custom spreadsheets | No structure; error-prone; no visualization |

**GamataFitness Differentiation:** Purpose-built for simplicity with beautiful design, coach-user workflows without enterprise complexity, and rock-solid mobile UX for mid-workout logging.

---

## Section 3: Defining the Solution

### What are the high-level requirements?

#### Functional Requirements

**User Management (Admin)**
- Create, update, deactivate users
- Assign roles (Admin, Coach, Regular User)
- Manage coach-user relationships (many-to-many: a user can have multiple coaches, a coach can have up to 50 users)
- Import/export user data as CSV
- Manage muscle group taxonomy (fixed default list; admin can add custom groups)

**Workout Management (Admin)**
- Create workouts with: name, description, muscle groups, type (strength/cardio), instructions
- Strength workouts: target sets, reps, weight suggestions
- Cardio workouts: duration-based, difficulty level (Easy/Medium/Hard enum), cardio type (HIIT, Steady State, Interval, Circuit, etc.)
- Pre-populated workout library with common exercises on initial setup
- Update existing workouts
- Archive workouts (soft delete) with dependency protection:
  - Cannot archive if in active plan
  - Archived workouts retain history for completed sessions
  - Show clear reason for blocked archival
- Import/export workout library as CSV

**Plan Management (Coach)**
- Create weekly workout plans
- Assign multiple workouts per day
- Assign plans to one or multiple users (users can only have ONE active plan at a time)
- When assigning a new plan to a user with an active plan:
  - New plan is saved with "pending" status
  - User sees activation prompt on next login
  - If user accepts, new plan becomes active; old plan becomes inactive
  - User can manage plan activation/deactivation in settings
- View plan completion status per user
- Export plans as CSV
- Coach can manage multiple coaches (coach hierarchy - Phase 2)

**Workout Execution (Regular User)**
- View today's assigned workout
- Start workout with clear instructions
- Log sets, reps, weight for strength exercises
- Log duration and notes for cardio exercises
- Swap workout for alternative (same muscle group)
- Perform ad hoc workout (any from library)
- Mark workout complete
- Edit logged sessions after completion
- View workout history
- View "My Coaches" page (list of assigned coaches)

**Progress Dashboards (Regular User)**
- Session history with filters (date range, workout type, muscle group)
- Progression metrics by muscle group (volume trends, max weights)
- Weekly/monthly workout frequency
- Cardio duration trends

**Data Export/Import**
- Users: CSV format (name, email, role, coach assignment)
- Workouts: CSV format (name, type, muscle groups, instructions, parameters)
- Plans: CSV format (plan name, day, workout, assigned users)
- Import validates data; skips invalid rows with error report
- Exports exclude system-generated IDs

#### Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Page load <2 seconds on 4G |
| Performance | Workout logging latency <500ms |
| Responsiveness | Mobile-first; fully functional 320px+ |
| Accessibility | WCAG 2.1 AA; large touch targets (48px+) |
| Hosting | Railway deployment; auto-scaling |
| Database | PostgreSQL on Railway |
| Authentication | Supabase Auth |
| Reliability | 99.5% uptime target |
| Security | Role-based access control; Supabase Auth integration |

### Solution Design

#### Data Model Overview

```
User
├── id, name, email, role (admin/coach/user)
└── createdAt, updatedAt

CoachUserAssignment (Many-to-Many)
├── id, coachId, userId
├── assignedAt
└── assignedBy (admin who created relationship)

MuscleGroup
├── id, name, icon
├── isDefault (true for built-in, false for admin-added)
└── createdAt

CardioType
├── id, name (e.g., "HIIT", "Steady State", "Interval", "Circuit")
└── description

Workout
├── id, name, description, instructions
├── type (strength/cardio)
├── muscleGroups[] (chest, back, legs, shoulders, arms, core, full-body)
├── targetSets, targetReps, suggestedWeight (strength only)
├── targetDuration, difficultyLevel (easy/medium/hard), cardioTypeId (cardio only)
├── isArchived (soft delete flag)
└── createdAt, updatedAt

WorkoutPlan
├── id, name, coachId
├── startDate, endDate
└── createdAt, updatedAt

PlanDay
├── id, planId, dayOfWeek
└── workoutIds[]

PlanAssignment
├── id, planId, userId
├── status (pending/active/inactive)
├── activatedAt, deactivatedAt
└── assignedAt

WorkoutSession
├── id, userId, workoutId
├── planId (null if ad hoc)
├── sessionType (assigned/swap/adhoc)
├── completedAt
├── updatedAt (for session edits)
└── exercises[] (logged data)

ExerciseLog
├── id, sessionId
├── sets, reps, weight (strength)
├── duration, notes (cardio)
└── loggedAt, updatedAt
```

#### API Design

*[To be completed by Engineering Team]*

---

### User Experience & Interface

| UI Element | Notes |
|------------|-------|
| **Design Language** | Modern, minimal, clean typography; subtle animations; dark/light mode |
| **Color Palette** | Primary accent color; neutral backgrounds; status colors (success green, error red) |
| **Touch Targets** | Minimum 48px; preferably 56px+ for workout logging |
| **Inputs** | Sliders for weight; steppers for reps/sets; duration picker for cardio; toggles for options |
| **Icons** | Minimal, purposeful usage; muscle group icons; workout type icons |
| **Animations** | Smooth transitions; micro-interactions on tap; progress celebrations |

#### Key Screens

| Screen | Elements |
|--------|----------|
| **Dashboard (User)** | Today's workout card; weekly plan preview; quick stats; start button |
| **Workout Execution** | Exercise name + instructions; large input controls; progress indicator; complete button |
| **Progress Dashboard** | Muscle group chart; session calendar; trend graphs; filters |
| **Plan Builder (Coach)** | Weekly grid; drag-drop workouts; user assignment panel |
| **Workout Library (Admin)** | Searchable list; filter by type/muscle; CRUD actions; dependency warnings |
| **User Management (Admin)** | User list; role badges; coach assignments (many-to-many); bulk import/export |
| **My Coaches (User)** | List of assigned coaches with contact info |

#### Mobile-Optimized Workout Logging

| Element | Implementation |
|---------|----------------|
| Weight Input | Large slider with +/- buttons; quick presets |
| Reps Input | Stepper with large tap zones; common values as buttons (8, 10, 12) |
| Sets Tracker | Visual checklist; tap to complete set |
| Rest Timer | Auto-start option; large display; vibration alert |
| Cardio Timer | Start/pause/stop; lap functionality; duration display |

#### Dependency Warning Modal (Archive Workout)

```
⚠️ Cannot Archive Workout

"Bench Press" cannot be archived because:
• 3 active plans include this workout

Remove from active plans first, then archive.

[OK]
```

#### Plan Activation Modal (User Login)

```
📋 New Workout Plan Available

Your coach has assigned you a new plan:
"8-Week Strength Builder"

Activating this plan will deactivate your current plan.

[Activate New Plan] [Keep Current Plan]
```

### Solution Breakdown into Stories

| # | Story | Details | Priority |
|---|-------|---------|----------|
| 1 | User Authentication | Login, registration, password reset, role-based routing | HIGH |
| 2 | Admin Dashboard | Overview stats, quick actions, user/workout counts | HIGH |
| 3 | User Management (CRUD) | Create, update, deactivate users; role assignment | HIGH |
| 4 | Coach-User Relationships | Many-to-many coach-user assignment; 50 user limit per coach | HIGH |
| 5 | Workout Library (CRUD) | Create, update, archive workouts; type/muscle group tagging; pre-populated library | HIGH |
| 6 | Workout Archive Protection | Dependency check for active plans; clear error messaging | HIGH |
| 7 | Plan Builder UI | Weekly grid; select workouts per day; save plan | HIGH |
| 8 | Plan Assignment | Assign plan to users; pending/active status; activation prompt on login | HIGH |
| 9 | User Dashboard | Today's workout; plan preview; quick stats | HIGH |
| 10 | Workout Execution (Strength) | Log sets/reps/weight; large mobile controls | HIGH |
| 11 | Workout Execution (Cardio) | Log duration; timer; notes field | HIGH |
| 12 | Workout Swap | Select alternative from same muscle group | HIGH |
| 13 | Ad Hoc Workout | Browse library; perform; track as ad hoc | HIGH |
| 14 | Progress Dashboard | Session history; filters; muscle group charts | HIGH |
| 14a | Session Editing | Edit logged sessions after completion | HIGH |
| 14b | My Coaches Page | User view of assigned coaches | HIGH |
| 15 | Progression Metrics | Volume trends; max weight tracking; cardio duration | MED |
| 16 | CSV Export (Users) | Admin export user list | MED |
| 17 | CSV Export (Workouts) | Admin export workout library | MED |
| 18 | CSV Export (Plans) | Coach export assigned plans | MED |
| 19 | CSV Import (Users) | Admin import with validation | MED |
| 20 | CSV Import (Workouts) | Admin import with validation | MED |
| 21 | Coach Dashboard | View assigned users; plan status; completion rates | MED |
| 22 | Coach Hierarchy | Coach manages sub-coaches | LOW |
| 23 | Dark/Light Mode | Theme toggle; system preference detection | LOW |
| 24 | Animations & Polish | Micro-interactions; transitions; celebration effects | LOW |
| 25 | Offline Support | Queue logs; sync when online | FUTURE |

### What is our timeline and key deliverables?

**MVP (Phase 1):**
- User authentication with role-based access
- Admin: User management, workout library CRUD, deletion protection
- Coach: Plan builder, plan assignment, user roster
- User: Dashboard, workout execution (strength + cardio), session logging
- Basic progress dashboard with session history
- Mobile-responsive design with large touch targets

**Phase 2:**
- Workout swap and ad hoc functionality
- Advanced progression metrics (muscle group trends, max weights)
- CSV export (users, workouts, plans)
- Coach dashboard with completion tracking
- UI animations and polish

**Phase 3:**
- CSV import functionality
- Coach hierarchy (coach manages coaches)
- Dark/light mode
- Advanced filtering and search
- Notification system (workout reminders)

**Future:**
- Offline support with sync
- Rest timer with auto-start
- Custom workout creation by users (with coach approval)

### What are our budget requirements?

| Item | Type | Notes |
|------|------|-------|
| Development | One-time | Full-stack development; mobile-first frontend + API backend |
| Design | One-time | UI/UX design; icon set; animation assets |
| Hosting (Railway) | Ongoing | Starter tier initially; scale as user base grows |
| Database | Ongoing | PostgreSQL on Railway |
| Authentication | Ongoing | Supabase Auth (free tier to start) |

### Resolved Decisions

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Authentication provider | Supabase Auth |
| 2 | Database | PostgreSQL on Railway |
| 3 | Workout library | Pre-populated with common exercises |
| 4 | Cardio levels | Structured enum (Easy/Medium/Hard) + Cardio Type field (HIIT, Steady State, Interval, Circuit, etc.) |
| 5 | Plan overlap | One active plan per user. New plans assigned as "pending"; user prompted on login to activate. Old plan becomes inactive if user accepts. Users can manage activation in settings. |
| 6 | Session editing | Yes, users can edit logged sessions after completion |
| 7 | Muscle group taxonomy | Fixed default list; admin can add custom groups |
| 8 | Coach-user ratio | Maximum 50 users per coach |
| 9 | Archive vs. delete | Archive (soft delete) - maintains history integrity |
| 10 | Notification channel | In-app notifications only (MVP) |
| 11 | Coach-user relationship | Many-to-many (user can have multiple coaches, coach can have multiple users). Admin manages relationships for MVP; future: coach/user self-service signup. |
| 12 | My Coaches view | Regular users have a "My Coaches" page to view assigned coaches |
