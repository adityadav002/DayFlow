# 00 — MASTER INSTRUCTIONS

> **This document is the single source of truth for how Antigravity must operate throughout the entire project.**
> Read it completely before touching any code. Re-read it at the start of every new milestone document.

---

## 1. PRODUCT VISION

You are building a **real-time personal and team productivity platform** — a unified daily command center that answers one question:

> **"What matters to me right now?"**

This is NOT a Trello clone. This is NOT just another task manager. The product's defining experience is **My Day**: a chronological, time-aware view that aggregates tasks, events, meetings, deadlines, reminders, and personal activities into a single timeline per day. A user opens the app and immediately understands their entire day — personal and professional — without switching between multiple tools.

### The three pillars

**A. Personal Planner** — tasks, appointments, bills, birthdays, study, exercise, reminders, shopping, personal projects.

**B. Team / Company Project Manager** — workspaces, teams, projects, kanban boards, task assignment, deadlines, priorities, subtasks, comments, mentions, file attachments, dependencies, blocked work, real-time collaboration.

**C. Daily Command Center (My Day)** — the chronological aggregation of everything above. Example:

```
TODAY — Thursday, August 13

09:00   Team Standup             Meeting
10:00   Fix Authentication       Work       HIGH
12:30   Lunch                    Personal
14:00   Client Meeting           Meeting
16:00   Production Deployment    Deadline   URGENT
19:00   Gym                      Personal
```

This is the product's north star. Every milestone either builds toward it or supports it.

---

## 2. WHAT ALREADY EXISTS — DO NOT REBUILD

The existing codebase already has working implementations of the following. These are the **foundation**, not the starting point for a rewrite.

| System | Status | Rule |
|---|---|---|
| Authentication (login/signup) | **EXISTS** | Inspect and preserve |
| JWT (token issuance, validation, middleware) | **EXISTS** | Inspect and preserve |
| WebSocket / Socket.io infrastructure | **EXISTS** | Inspect and extend |
| Real-time chat | **EXISTS** | Inspect and preserve |
| Task creation (CRUD) | **EXISTS** | Inspect and extend |
| Task status management (Todo/Working/Done) | **EXISTS** | Inspect and extend |
| Task member assignment | **EXISTS** | Inspect and extend |
| Drag-and-drop Kanban board | **EXISTS** | Inspect and preserve |
| Team member management | **EXISTS** | Inspect and extend |

**Before writing a single line of code, inspect the actual repository to confirm what exists and where.**

Do not assume filenames, route names, or model field names. Read the actual code.

---

## 3. FEATURE DEPENDENCY MAP

Every layer depends on the one below it. Do not build a layer before its foundation is stable.

```
Existing Foundation (Auth, JWT, WebSocket, Chat, Tasks, Members, Kanban)
        │
        ▼
Data Model Extension (M1)
        │
        ▼
Calendar (M2)
        │
        ▼
My Day Command Center (M3)
        │
        ▼
Task System 2.0 (M4)
        │
        ▼
Projects + Team Workspaces (M5)
        │
        ▼
Roles + Authorization (M6)
        │
        ▼
Real-Time Collaboration 2.0 (M7)
        │
        ▼
Notifications (M8)
        │
        ▼
Comments + Mentions + Activity (M9)
        │
        ▼
Task Dependencies + Blocked Work (M10)
        │
        ▼
Recurring Tasks + Reminders (M11)
        │
        ▼
Attachments + Files (M12)
        │
        ▼
Search + Filters + Tags (M13)
        │
        ▼
Time Tracking (M15)
        │
        ▼
Manager Dashboard + Team Calendar (M14)
        │
        ▼
Analytics + Reporting (M16)
        │
        ▼
Email + External Calendar Integrations (M17)
        │
        ▼
Daily Briefing (M18)
        │
        ▼
AI: Natural Language Task Creation (M19)
        │
        ▼
AI: Daily Planning (M20)
```

---

## 4. GLOBAL FEATURE MATRIX

| Feature | Exists? | Milestone | Depends On | Rule |
|---|---|---|---|---|
| Authentication | YES | Existing | — | Preserve |
| JWT | YES | Existing | Auth | Preserve |
| WebSocket / Socket.io | YES | Existing | Auth | Preserve + Extend |
| Chat | YES | Existing | WebSocket | Preserve |
| Task CRUD | YES | M4 | Existing | Extend |
| Task status (Todo/Working/Done) | YES | M4 | Task CRUD | Extend |
| Task assignment | YES | M4/M5 | Task CRUD | Extend |
| Drag-and-drop Kanban | YES | M4 | Task CRUD | Preserve + Extend |
| Member management | YES | M5 | Users | Extend |
| Calendar | NO | M2 | Data Model (M1) | Build |
| My Day | NO | M3 | Calendar (M2) | Build |
| Event model | NO | M1 | — | Build |
| Reminder model | NO | M1 | — | Build |
| Context (Work/Personal/etc.) | NO | M1 | — | Build |
| Projects | PARTIAL/NO | M5 | Task Model | Build |
| Workspaces | NO | M5 | Teams | Build |
| Roles & Permissions | NO | M6 | Users/Teams | Build |
| Task priorities | NO | M4 | Task Model | Build |
| Subtasks | NO | M4 | Task Model | Build |
| Start date / due date | PARTIAL | M4 | Task Model | Extend |
| Estimated/actual duration | NO | M4/M15 | Task Model | Build |
| Tags | NO | M4/M13 | Task Model | Build |
| Smart deadline display | NO | M4 | Task Model | Build |
| Notifications | NO | M8 | WebSocket, M7 | Build |
| Comments | NO | M9 | Tasks | Build |
| Mentions | NO | M9 | Comments | Build |
| Activity log | NO | M9 | Tasks | Build |
| Task dependencies | NO | M10 | Tasks | Build |
| Blocked status | NO | M10 | Dependencies | Build |
| Recurring tasks | NO | M11 | Task Model | Build |
| File attachments | NO | M12 | Tasks/Projects | Build |
| Search | NO | M13 | Tasks/Projects | Build |
| Filters | NO | M13 | Tasks/Projects | Build |
| Time tracking | NO | M15 | Task Model | Build |
| Manager dashboard | NO | M14 | M5, M6 | Build |
| Team calendar | NO | M14 | M2, M5 | Build |
| Analytics | NO | M16 | M14 | Build |
| Gmail/Outlook integration | NO | M17 | M1-M13 | Build |
| Google Calendar integration | NO | M17 | M2 | Build |
| Daily briefing | NO | M18 | M3, M8 | Build |
| AI task creation | NO | M19 | M1-M13 stable | Build |
| AI daily planning | NO | M20 | M19 stable | Build |

---

## 5. MILESTONE DOCUMENTS

The implementation is split across 5 milestone documents. Execute them **strictly in order**.

| Document | Milestones | Theme |
|---|---|---|
| `01_FOUNDATION_AND_CALENDAR.md` | M0, M1, M2, M3, M4 | Core product identity |
| `02_AUTHORIZATION_AND_COLLABORATION.md` | M5, M6, M7, M8, M9 | Teams, permissions, real-time |
| `03_ADVANCED_TASK_MANAGEMENT.md` | M10, M11, M12, M13, M15 | Power user task features |
| `04_TEAM_MANAGEMENT_AND_ANALYTICS.md` | M14, M16 | Operational visibility |
| `05_INTEGRATIONS_AND_AI.md` | M17, M18, M19, M20 | External + intelligent layer |

---

## 6. HOW ANTIGRAVITY MUST OPERATE

### 6.1 The workflow for every milestone

```
READ milestone spec
        ↓
INSPECT relevant existing code
        ↓
UNDERSTAND what already exists vs. what is missing
        ↓
PLAN (report before implementing)
        ↓
IMPLEMENT the minimum coherent change
        ↓
TEST new and existing functionality
        ↓
VERIFY completion criteria
        ↓
REPORT results
        ↓
STOP and wait for next instruction
```

**Never skip the INSPECT and PLAN steps.**

### 6.2 Before touching any code, report

```
I inspected:
  [list of files/directories examined]

I found already implemented:
  [list]

I found missing:
  [list]

I will modify:
  [exact files]

I will NOT modify:
  [exact files]

Implementation plan:
  [step-by-step]

Potential risks:
  [list]

Questions before proceeding:
  [list, or "none"]
```

Only after this report should implementation begin.

### 6.3 Pre-flight check (run before every milestone)

Before modifying anything:

1. Read the current state of the repository.
2. Read the relevant previous milestone documentation.
3. Verify the previous milestone is actually complete (API works, DB works, frontend works, auth works).
4. Check current database schema/models.
5. Check existing API routes and behaviors.
6. Check existing frontend behavior.
7. Check existing WebSocket event names and payloads.
8. Identify any regressions from previous work.

If a prerequisite milestone is incomplete or broken:

```
STOP.

Report:
  Prerequisite: [milestone/feature]
  Problem: [description]
  Affected subsystem: [backend/frontend/db/websocket]
  Recommended fix: [description]

Do NOT continue until resolved.
```

### 6.4 After every milestone, report

```
MILESTONE X COMPLETE

Implemented:
  [list]

Files changed:
  [list with brief description of each change]

Database changes:
  [models added/modified, migrations run]

API changes:
  [new/modified endpoints with methods and paths]

WebSocket changes:
  [new/modified events]

Tests run:
  [list]

Existing functionality verified:
  [list]

Known limitations:
  [list]

Completion criteria checklist:
  [copy from spec, mark each ✅ or ❌]
```

---

## 7. DEVELOPMENT PRINCIPLES

### 7.1 Inspect before implementing

The existing codebase has real code. Read it. Do not assume based on milestone documents that something is or isn't implemented. Verify.

### 7.2 Reuse before building

If an existing implementation solves the problem → **use it**.
If it partially solves the problem → **extend it**.
If it is poorly structured but functional → **refactor only if necessary for the milestone**.
If it is fundamentally broken → **document the problem before replacing it**.

### 7.3 Never rebuild working systems

Do not rewrite authentication. Do not rewrite JWT. Do not rebuild WebSocket infrastructure. Do not rebuild chat. Do not rebuild Kanban drag-and-drop. These exist. Find them, understand them, build on them.

### 7.4 Sequential milestones only

Do not implement a later milestone while working on an earlier one. If you notice something that will be needed in M8 while working on M3, make a note in your report but do not implement it yet.

### 7.5 Smallest coherent change

Implement the minimum change that satisfies the milestone's completion criteria. Do not gold-plate. Do not add features that sound nice.

---

## 8. DATABASE RULES

### 8.1 Never destroy existing data

- Do not rename existing fields without a migration strategy.
- Do not delete existing collections/tables.
- Do not drop indexes.
- Do not change existing field types without migration.
- Existing tasks, users, members, and chat messages must survive every migration.

### 8.2 Migration strategy for every schema change

Before making any database change:
1. Inspect the existing schema.
2. Identify all documents/rows that will be affected.
3. Write a migration that preserves existing data.
4. Test that old functionality still works after migration.
5. Then enable new functionality.

### 8.3 Conservative extension

When adding fields to existing models:
- Make new fields optional with sensible defaults.
- Do not break existing create/update operations.
- Use `null` or empty-array defaults, not required fields.

---

## 9. WEBSOCKET RULES

The existing WebSocket infrastructure is the foundation. Do not redesign it. Extend it.

### 9.1 For every real-time feature, answer

- Who generated the event?
- What changed in the database?
- Where was it persisted (database is source of truth)?
- Who should receive it?
- What should the receiving UI do?
- What happens if the user is offline?

### 9.2 Database first, WebSocket second

**Every mutation must persist to the database FIRST.** WebSocket events are notifications of changes that already happened. They are never the only persistence mechanism.

### 9.3 Event naming convention

Use consistent naming for all new events. Follow the pattern already established in the existing codebase. If no convention exists, use `NOUN_VERB` in uppercase: `TASK_ASSIGNED`, `COMMENT_CREATED`, etc.

---

## 10. API RULES

### 10.1 REST for mutations and queries, WebSocket for sync

- **REST**: Authentication, CRUD operations, file uploads, search, reports.
- **WebSocket**: Real-time notifications, live updates, presence.

### 10.2 Follow existing conventions

Before adding new routes:
- Inspect the existing route structure.
- Follow the same path patterns, error format, and response structure.
- Follow the same controller/service/route separation that already exists.

### 10.3 Every new API endpoint must have

- Input validation.
- Authentication middleware.
- Authorization check (can this user do this?).
- Error handling with meaningful messages.
- Consistent response format (follow existing pattern).

---

## 11. SECURITY RULES

- Never expose another user's private data by changing an ID in a request.
- Never rely on frontend hiding to enforce authorization. Authorization must be enforced on the backend.
- JWT validation must happen in middleware, not per-handler.
- Resource ownership must be checked before any mutation.
- Workspace isolation: user A must never see workspace B's data.
- File access: validate that the requesting user has permission before serving files.
- Input validation: sanitize all user inputs before database writes.

---

## 12. FRONTEND RULES

### 12.1 Follow the existing design system

Do not introduce a new design system if one already exists. Inspect the existing UI components, color scheme, spacing, and typography. Build new components that match.

### 12.2 Required states for every new UI component

- Loading state.
- Empty state (with meaningful message, not just a blank space).
- Error state (with actionable message).
- Success state.

### 12.3 Desktop-first, mobile-friendly

The application is productivity software. It is primarily a desktop experience but must not break on mobile.

### 12.4 Information density

The UI should be **information-dense but not cluttered**. Productivity software users need to see a lot at once. Do not hide information behind unnecessary layers of navigation.

---

## 13. TESTING RULES

For every milestone, before marking it complete:

### Backend

- Test all new API endpoints (happy path + error cases).
- Test authorization (authorized user + unauthorized user + wrong ownership).
- Test input validation (missing fields, wrong types, boundary values).
- Test database state after mutations.

### Frontend

- Test loading, empty, and error states.
- Test all user interactions on new components.
- Test that existing functionality still works.

### Real-time (where applicable)

- Open two browser sessions.
- Perform an action in session A.
- Verify session B updates without a page refresh.

### Regression

- Verify that existing login, task creation, task update, drag-and-drop, chat, and member management still function after every milestone.

---

## 14. DO NOT DO THESE THINGS

Under no circumstances should you:

- Rewrite the existing authentication system.
- Rewrite JWT unless a concrete security vulnerability is documented.
- Replace the existing WebSocket infrastructure from scratch.
- Rebuild the existing chat system unnecessarily.
- Rebuild the existing Kanban drag-and-drop unnecessarily.
- Create duplicate models for task, user, or member entities that already exist.
- Introduce AI features before Document 05.
- Implement milestones from Document 02 while working on Document 01.
- Break existing APIs without a migration strategy.
- Remove existing database records.
- Use WebSockets as the only persistence mechanism.
- Add unnecessary dependencies (no Kafka, no microservices, no event sourcing unless genuinely required).
- Optimize prematurely.
- Build features that sound impressive but are not in the milestone spec.

---

## 15. TECHNOLOGY STACK

Do not change the existing technology stack. Build within it.

| Layer | Technology |
|---|---|
| Frontend | React (inspect for exact version/router/state management) |
| Backend | Node.js + Express (inspect for exact version) |
| Database | MongoDB (inspect for exact ODM, likely Mongoose) |
| Authentication | JWT (inspect existing middleware) |
| Real-time | WebSocket / Socket.io (inspect existing setup) |
| Caching | Redis only if already present; introduce only if justified |

---

## 16. ARCHITECTURE OVERVIEW

```
                         PRODUCT
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       PERSONAL           WORK             DAILY
       PLANNER           MANAGER          COMMAND CENTER
          │                 │                 │
     Tasks/Events      Teams/Projects     My Day Timeline
     Reminders         Members/Roles      Aggregation
     Calendar          Kanban/Board       Notifications
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                     CALENDAR / TIMELINE
                            │
                    REAL-TIME WEBSOCKETS
                            │
                     NOTIFICATIONS
                            │
                    SEARCH / FILTERS
                            │
                    AI — FUTURE LAYER (Doc 05 only)
```

The **core data loop**:

```
CREATE → SCHEDULE → ASSIGN → COLLABORATE → EXECUTE → TRACK → COMPLETE → REVIEW
```

---

## 17. HOW TO USE THESE DOCUMENTS WITH ANTIGRAVITY

### Setup

Place all docs in your project at:
```
your-project/
├── docs/
│   ├── 00_MASTER_INSTRUCTIONS.md   ← this file
│   ├── 01_FOUNDATION_AND_CALENDAR.md
│   ├── 02_AUTHORIZATION_AND_COLLABORATION.md
│   ├── 03_ADVANCED_TASK_MANAGEMENT.md
│   ├── 04_TEAM_MANAGEMENT_AND_ANALYTICS.md
│   └── 05_INTEGRATIONS_AND_AI.md
```

### Antigravity master prompt (keep it short)

```
Read docs/00_MASTER_INSTRUCTIONS.md completely.
Inspect the repository to understand the existing codebase.
Then execute only the milestone document I specify.
Never jump ahead to a later document.
Stop and report after each document.
```

### Execution sequence

```
Give Antigravity:  docs/01_FOUNDATION_AND_CALENDAR.md
↓ Wait for completion report + verification
Give Antigravity:  docs/02_AUTHORIZATION_AND_COLLABORATION.md
↓ Wait for completion report + verification
Give Antigravity:  docs/03_ADVANCED_TASK_MANAGEMENT.md
↓ Wait for completion report + verification
Give Antigravity:  docs/04_TEAM_MANAGEMENT_AND_ANALYTICS.md
↓ Wait for completion report + verification
Give Antigravity:  docs/05_INTEGRATIONS_AND_AI.md
```

Never give Antigravity two documents simultaneously.

---

## 18. HANDLING UNCERTAINTY

If during implementation you are uncertain about:

- The intent of a requirement → describe the two interpretations and ask which is correct.
- Whether to modify an existing system → default to the more conservative option and report.
- Whether an existing feature satisfies a requirement → test the existing feature first before building a replacement.
- A database schema change that seems risky → stop, document the risk, and ask before proceeding.

**When in doubt, do less and ask.**

---

*End of Master Instructions. Proceed to `01_FOUNDATION_AND_CALENDAR.md` when instructed.*
