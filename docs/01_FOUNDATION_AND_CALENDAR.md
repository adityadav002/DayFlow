# 01 — FOUNDATION & CALENDAR

> **Dependencies:** None. This is the first implementation document.
> **Depends on:** Existing codebase (auth, JWT, WebSocket, tasks, members, Kanban).
> **Read first:** `00_MASTER_INSTRUCTIONS.md`

---

## PRE-FLIGHT CHECK

Before modifying anything:

1. Read `00_MASTER_INSTRUCTIONS.md` in full.
2. Inspect the complete repository structure (frontend and backend).
3. Map the existing implementation against the checklist in Section M0 below.
4. Report your findings before writing any new code.
5. Verify the existing application starts and runs without errors.

If any prerequisite is missing or broken, stop and report before continuing.

---

## DO NOT MODIFY (unless the audit proves they are broken)

- Existing authentication routes and middleware.
- Existing JWT issuance and validation logic.
- Existing WebSocket connection lifecycle.
- Existing chat system.
- Existing Kanban drag-and-drop.
- Existing task CRUD endpoints.
- Existing member management.
- Any existing database collection that is not being extended.

---

# MILESTONE 0 — CODEBASE AUDIT & ARCHITECTURE BASELINE

## 1. Objective

Understand the complete existing codebase before changing anything. Produce a verified map of what exists, what works, and what is missing. This milestone has no new features — only discovery and documentation.

## 2. Scope

- Full repository inspection.
- Verification of existing features.
- Identification of architectural problems.
- Production of an implementation gap analysis.

## 3. Out of Scope

- Any new code.
- Any database changes.
- Any new API routes.
- Any UI changes.

## 4. Inspection Checklist

For each area, identify: (a) the relevant files/directories, (b) whether it works, (c) any problems found.

### 4.1 Project Structure

```
Inspect:
  - Root directory layout
  - Frontend entry point (likely client/ or frontend/)
  - Backend entry point (likely server/ or backend/)
  - Package.json files (note all dependencies)
  - Environment variable files (.env.example or similar)
  - Build configuration
```

### 4.2 Authentication

```
Inspect:
  - User model/schema (fields: id, email, password, name, avatar, timestamps)
  - Password hashing implementation
  - Login route (method, path, validation, response format)
  - Signup route (method, path, validation, response format)
  - JWT issuance (library, token payload, expiry)
  - JWT validation middleware (how it attaches user to request)
  - Protected route mechanism
  - Token refresh (if any)
  - Logout (if any)
```

### 4.3 Database

```
Inspect:
  - Database connection file
  - ODM (likely Mongoose) version and configuration
  - All existing models/schemas with their fields
  - Existing indexes
  - Relationships between models (references, embedded documents)
  - Any existing migrations or seed files
```

### 4.4 Task System

```
Inspect:
  - Task model (all fields)
  - Task creation endpoint
  - Task update endpoint
  - Task deletion endpoint
  - Task retrieval endpoints (list, single)
  - Status values (what are they exactly?)
  - Assignment mechanism
  - Member/assignee fields
  - Due date handling
  - Priority (if any)
```

### 4.5 Member Management

```
Inspect:
  - How members are added (to what entity — team, project, workspace?)
  - Member model/schema
  - Member invitation flow
  - Member roles (if any)
  - How member relationships are stored
```

### 4.6 WebSocket / Socket.io

```
Inspect:
  - Socket.io server setup
  - Authentication of socket connections
  - Existing socket event names (list all)
  - Existing socket event payloads
  - Room/namespace structure
  - Which client components connect to sockets
  - How socket connections are managed on client
```

### 4.7 Chat System

```
Inspect:
  - Message model/schema
  - Chat endpoints (if any)
  - Socket events for chat
  - UI component for chat
  - Real-time delivery mechanism
```

### 4.8 Kanban / Drag-and-Drop

```
Inspect:
  - Which library is used for drag-and-drop
  - Board component structure
  - How status changes are persisted
  - Column/lane configuration
  - How task order is maintained
```

### 4.9 Frontend

```
Inspect:
  - Framework version and routing library
  - State management solution (Redux, Zustand, Context, etc.)
  - Existing pages/routes
  - Existing UI component library (if any)
  - Existing design system (colors, typography, spacing)
  - API client setup (axios, fetch, etc.)
  - Authentication state management
  - Token storage mechanism
```

### 4.10 API Structure

```
Inspect:
  - Base URL and versioning convention
  - Error response format
  - Success response format
  - Middleware stack order
  - Rate limiting (if any)
  - CORS configuration
```

## 5. Verification Tests

After inspection, manually verify each of the following works:

| Test | Expected | Pass/Fail |
|---|---|---|
| Signup with new email | User created, token returned | |
| Login with valid credentials | Token returned | |
| Login with invalid credentials | Error returned | |
| Access protected route with valid token | Success | |
| Access protected route without token | 401 returned | |
| Create a task | Task persisted, returned | |
| Update a task | Task updated in DB | |
| Delete a task | Task removed | |
| Change task status | Status persisted | |
| Drag task between Kanban columns | Status changes and persists | |
| Add a member | Member relationship created | |
| Send a chat message | Message appears in real-time | |
| WebSocket connect | Connection established with auth | |
| Open app in two browsers | Real-time events sync | |

## 6. Deliverable

Produce a report with this structure:

```
MILESTONE 0 AUDIT REPORT

Project Structure:
  Frontend: [path and framework]
  Backend: [path and framework]
  Database: [type and ODM]

Existing Models:
  [list each model with its fields]

Existing API Routes:
  [list each route with method and path]

Existing Socket Events:
  [list each event with direction and payload shape]

Existing Frontend Pages:
  [list each page/route]

Existing State Management:
  [approach and relevant stores/slices]

Verification Results:
  [table from section 5]

Architectural Concerns:
  [any problems found]

Migration Risks:
  [fields or collections that may be affected by upcoming changes]

Gap Analysis:
  FEATURE               EXISTS?    LOCATION         NOTES
  ─────────────────────────────────────────────────────────
  Authentication        YES/NO     [path]           [notes]
  JWT                   YES/NO     [path]           [notes]
  ...

Exact files to modify for Milestone 1:
  [list]

Recommended implementation order:
  [any deviations from the spec based on what you found]
```

## 7. Completion Criteria

- [ ] All repository files inspected.
- [ ] All existing models documented.
- [ ] All existing API routes documented.
- [ ] All existing socket events documented.
- [ ] All verification tests run.
- [ ] Audit report produced.
- [ ] No code changed.
- [ ] Architectural concerns identified.
- [ ] Migration risks identified.

## 8. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report audit findings. Wait for approval before proceeding to Milestone 1.

---

# MILESTONE 1 — DATA MODEL FOUNDATION

## 1. Objective

Extend the existing data model to support the complete set of item types the product requires. The product must distinguish between: **Tasks**, **Events**, **Reminders**, **Deadlines**, and support **Recurring Activities** and **Context** (Work/Personal/Study/etc.). These distinctions are foundational — the Calendar (M2) and My Day (M3) depend entirely on them.

This milestone is about data architecture, not UI. The goal is a stable, backward-compatible schema that supports everything that follows.

## 2. Existing Functionality to Reuse

- The existing Task model is the anchor. Inspect its exact fields before adding anything.
- The existing User model will be referenced by all new models.
- The existing team/member models (whatever they are called) will be referenced by events and reminders.
- Do not duplicate any field that already exists on Task.

## 3. Scope

- Audit and document the exact existing Task schema.
- Safely extend the Task model with new optional fields.
- Create the Event model.
- Create the Reminder model.
- Add context support to relevant models.
- Add recurrence metadata to relevant models.
- Create necessary indexes for calendar queries.

## 4. Out of Scope

- Calendar UI (M2).
- My Day UI (M3).
- Priority system UI (M4).
- Subtasks (M4).
- Project entity (M5).
- Authorization system (M6).
- Notifications (M8).
- AI features (M19-20).

## 5. Functional Requirements

### 5.1 Item Types

The system must support these distinct item types:

**Task** — Something to be completed. Has a status lifecycle (Todo → Working → Done). Can be assigned. Can have a due date but is not necessarily time-bound.

**Event** — Something happening at a specific time. Has a start datetime and end datetime. Has participants (not assignees). Examples: team meeting, client call, appointment.

**Reminder** — Something to remember at a specific time. Lightweight. No status lifecycle. Examples: "renew domain", "call mom".

**Deadline** — A hard completion boundary on an existing task or external obligation. Distinct from a task's due date in that it represents an immovable external constraint. Can be attached to a task or standalone.

### 5.2 Context

Every item should support a context field indicating its life area:

```
WORK
PERSONAL
STUDY
HEALTH
FINANCE
FAMILY
OTHER
```

This allows My Day to show a person's complete day — work tasks, gym session, and grocery run — in one view.

### 5.3 Recurrence metadata

Recurring items (fully implemented in M11) need their schema defined now so Calendar (M2) can display recurring events correctly.

Recurrence rule fields:
```
frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
interval: Number (every N periods)
daysOfWeek: [Number] (0=Sun, 6=Sat, for weekly)
dayOfMonth: Number (for monthly)
endDate: Date (optional)
occurrenceCount: Number (optional)
timezone: String
```

## 6. Data Model

### 6.1 Task Model Extension

**Before adding any fields, inspect the exact existing Task schema.**

Then extend with these optional fields (do not make them required — existing tasks must remain valid):

```javascript
// Fields to ADD to existing Task model (if not already present):

priority: {
  type: String,
  enum: ['low', 'medium', 'high', 'urgent'],
  default: 'medium'
},

context: {
  type: String,
  enum: ['work', 'personal', 'study', 'health', 'finance', 'family', 'other'],
  default: 'work'
},

startDate: {
  type: Date,
  default: null
},

// If dueDate does not exist yet, add it:
dueDate: {
  type: Date,
  default: null
},

estimatedDuration: {
  type: Number,  // minutes
  default: null
},

// For future time tracking (M15), add placeholder:
actualDuration: {
  type: Number,  // minutes
  default: null
},

tags: {
  type: [String],
  default: []
},

// If no project reference exists yet:
project: {
  type: ObjectId,
  ref: 'Project',
  default: null
},

isRecurring: {
  type: Boolean,
  default: false
},

recurrenceRule: {
  frequency: String,
  interval: Number,
  daysOfWeek: [Number],
  dayOfMonth: Number,
  endDate: Date,
  occurrenceCount: Number,
  timezone: String
},

parentRecurringTask: {
  type: ObjectId,
  ref: 'Task',
  default: null
}
```

**Only add fields that do not already exist.** Check the existing schema first.

### 6.2 Event Model (new)

```javascript
const EventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    default: ''
  },
  creator: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: ObjectId,
    ref: 'User'
  }],
  // Team association (optional, for team events)
  team: {
    type: ObjectId,
    ref: 'Team',  // use actual model name from your codebase
    default: null
  },
  project: {
    type: ObjectId,
    ref: 'Project',
    default: null
  },
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    default: ''
  },
  context: {
    type: String,
    enum: ['work', 'personal', 'study', 'health', 'finance', 'family', 'other'],
    default: 'work'
  },
  color: {
    type: String,
    default: null
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrenceRule: {
    frequency: String,
    interval: Number,
    daysOfWeek: [Number],
    dayOfMonth: Number,
    endDate: Date,
    occurrenceCount: Number,
    timezone: String
  },
  parentRecurringEvent: {
    type: ObjectId,
    ref: 'Event',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for calendar queries
EventSchema.index({ creator: 1, startDateTime: 1 });
EventSchema.index({ participants: 1, startDateTime: 1 });
EventSchema.index({ startDateTime: 1, endDateTime: 1 });
```

### 6.3 Reminder Model (new)

```javascript
const ReminderSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    default: ''
  },
  creator: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  reminderDateTime: {
    type: Date,
    required: true
  },
  context: {
    type: String,
    enum: ['work', 'personal', 'study', 'health', 'finance', 'family', 'other'],
    default: 'personal'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  // Link to task or event if this is a reminder for another item
  linkedTask: {
    type: ObjectId,
    ref: 'Task',
    default: null
  },
  linkedEvent: {
    type: ObjectId,
    ref: 'Event',
    default: null
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrenceRule: {
    frequency: String,
    interval: Number,
    daysOfWeek: [Number],
    dayOfMonth: Number,
    endDate: Date,
    occurrenceCount: Number,
    timezone: String
  }
}, {
  timestamps: true
});

ReminderSchema.index({ creator: 1, reminderDateTime: 1 });
ReminderSchema.index({ reminderDateTime: 1, isCompleted: 1 });
```

### 6.4 Additional Indexes for Task Model

Add these indexes to the existing Task model (only if they don't exist):

```javascript
// For calendar range queries
TaskSchema.index({ creator: 1, dueDate: 1 });
TaskSchema.index({ assignee: 1, dueDate: 1 });  // use actual assignee field name
TaskSchema.index({ dueDate: 1, status: 1 });
TaskSchema.index({ startDate: 1 });
```

## 7. Backend Requirements

### 7.1 Event API

Follow existing route conventions exactly. Inspect how existing task routes are structured and mirror that pattern.

**Routes to create:**

```
POST   /api/events          Create an event
GET    /api/events          List events (with date range filter)
GET    /api/events/:id      Get single event
PUT    /api/events/:id      Update event
DELETE /api/events/:id      Delete event
```

**Query parameters for GET /api/events:**

```
startDate: ISO date string (required for calendar queries)
endDate: ISO date string (required for calendar queries)
context: 'work' | 'personal' | etc. (optional filter)
```

**Authorization rules:**

- Creator can always read/update/delete their event.
- Participants can read the event.
- Only creator can delete.
- Only creator can modify participants list.

### 7.2 Reminder API

```
POST   /api/reminders       Create a reminder
GET    /api/reminders       List reminders (with date range filter)
GET    /api/reminders/:id   Get single reminder
PUT    /api/reminders/:id   Update reminder
DELETE /api/reminders/:id   Delete reminder
PATCH  /api/reminders/:id/complete  Mark complete
```

**Authorization:** Creator only for all operations.

### 7.3 Task API extensions

Extend the existing task endpoints to accept and return the new optional fields. Do not break existing requests that don't include the new fields.

### 7.4 Response format

Follow whatever response format the existing API uses. If it returns `{ success: true, data: {...} }`, continue that pattern.

## 8. WebSocket Requirements

No new WebSocket events in this milestone. The data model must be stable before real-time sync is added.

## 9. Frontend Requirements

This milestone is primarily backend. Minimal frontend is needed — just enough to verify the APIs work.

- Add the new fields (priority, context, dueDate, startDate) to the existing task creation form if they are not already there.
- Do not build the Calendar or My Day UI yet (that is M2 and M3).
- Do not build Event or Reminder UI forms yet — but create stub pages that confirm routing will work.

## 10. UX Requirements

None specific to this milestone beyond ensuring existing task UI remains fully functional.

## 11. Edge Cases

- Creating an event where endDateTime < startDateTime: reject with validation error.
- All-day events: startDateTime and endDateTime should be normalized to start/end of day.
- Reminder for a past date: allow creation but flag as past-due.
- Adding new optional fields to task model must not break existing task creation requests that omit those fields.
- Indexes: if the collection is large, index creation may take time. Plan for this.

## 12. Security

- All event and reminder endpoints require authentication.
- Participants list must only contain valid user IDs from the same workspace (validate before saving).
- Creator field must be set server-side from the JWT, never from the request body.

## 13. Migration / Backward Compatibility

- Existing tasks need no migration if all new fields are optional with defaults.
- Verify that: after model update, all existing task CRUD operations still work without modification.
- Run the following after schema changes: attempt to create a task using the old request format (no new fields) and verify it succeeds.

## 14. Testing Checklist

**Backend:**
- [ ] POST /api/events creates event with all fields.
- [ ] POST /api/events rejects endDate before startDate.
- [ ] GET /api/events with date range returns only events in range.
- [ ] GET /api/events/:id returns 404 for non-existent ID.
- [ ] GET /api/events/:id returns 403 for unauthorized user.
- [ ] PUT /api/events/:id updates event.
- [ ] DELETE /api/events/:id removes event.
- [ ] POST /api/reminders creates reminder.
- [ ] PATCH /api/reminders/:id/complete marks reminder complete.
- [ ] Existing task CRUD still works with new schema fields present.
- [ ] New optional task fields (priority, context, dueDate) are accepted and stored.
- [ ] New optional task fields return correctly on GET.

**Security:**
- [ ] Unauthenticated request to any new endpoint returns 401.
- [ ] User A cannot update User B's event (returns 403).
- [ ] User A cannot delete User B's reminder (returns 403).

## 15. Completion Criteria

- [ ] Task model extended with new optional fields.
- [ ] Existing tasks unaffected by schema changes.
- [ ] Event model created with all required fields and indexes.
- [ ] Reminder model created with all required fields and indexes.
- [ ] Event API fully functional (CRUD + date range query).
- [ ] Reminder API fully functional (CRUD + complete).
- [ ] All authorization rules enforced.
- [ ] All edge cases handled.
- [ ] Existing task/auth/chat/Kanban functionality verified unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Verify existing functionality. Wait for instruction to proceed to Milestone 2.

---

# MILESTONE 2 — CALENDAR FOUNDATION

## 1. Objective

Build the calendar system that makes this a productivity platform rather than a simple task list. The calendar must display tasks, events, reminders, and deadlines in a coherent, navigable time-based view. A user must be able to open any date and immediately understand what is scheduled.

## 2. Existing Functionality to Reuse

- Event and Task models from M1.
- Existing API infrastructure (routing, auth middleware, error handling).
- Existing frontend routing system.
- Existing design system and components.

## 3. Scope

- Month view.
- Week view.
- Day view.
- Agenda view.
- Date navigation (prev/next/today/jump to date).
- Display of tasks, events, reminders on calendar.
- Create item from calendar click.
- Edit item from calendar.

## 4. Out of Scope

- AI scheduling.
- Gmail/Google Calendar sync.
- Time tracking.
- Drag-to-reschedule (can be added later if simple; do not force it).
- Team calendar (M14).
- Recurring task generation engine (M11) — display only for now.

## 5. Functional Requirements

### 5.1 Navigation

The user must be able to:
- Move to the previous month/week/day.
- Move to the next month/week/day.
- Click "Today" to return to the current date.
- Click a specific date to jump to it.
- Switch between Month, Week, Day, and Agenda views.

The current date must always be visually distinct from other dates.

### 5.2 Month View

Display a standard monthly grid. For each date cell:
- Show up to 3 items (with "+N more" overflow indicator).
- Items should be color-coded by type (task, event, reminder) or context.
- Clicking a date cell opens the Day view for that date (or opens a quick-create modal).
- Overdue items should be visually distinct.
- Deadlines should be visually distinct from regular tasks.

### 5.3 Week View

Display a time-based grid for the 7 days of the current week.
- Time slots from 00:00 to 23:00 (or configurable range).
- Events with start/end time appear as blocks spanning their duration.
- All-day items appear in a header row above the time grid.
- Tasks with only a due date (no specific time) appear as all-day items on their due date.
- Clicking an empty time slot opens a quick-create form pre-filled with that time.

### 5.4 Day View

Detailed time-based view for a single day.
- Full hour slots from 06:00 to 23:00 (or reasonable range).
- Time-based items appear as positioned blocks.
- Non-time items listed separately.
- Quick-create from any time slot.
- Edit/delete from item display.

### 5.5 Agenda View

Chronological list of all items from today forward (or from the selected date forward).
- Groups items by date.
- Shows date headers.
- Shows time, title, type, and context for each item.
- Suitable for mobile use.
- Infinite scroll or paginated by week.

### 5.6 Data Loading

Calendar queries must use date ranges, not load all items. For each view:
- Month view: load items from first visible date to last visible date of the displayed month grid.
- Week view: load items for the 7 displayed days.
- Day view: load items for the single displayed day.
- Agenda view: load items in rolling 2-week or 4-week chunks.

**Do not load all tasks/events/reminders at once.**

### 5.7 Creating from Calendar

From any calendar view, clicking on a date/time should open a creation modal with:
- Item type selector (Task / Event / Reminder).
- Pre-filled date (and time if clicking a time slot).
- Title field (auto-focused).
- Context selector.
- Save button.

After saving, the item must appear on the calendar immediately.

### 5.8 Editing from Calendar

Clicking an existing item in any view should open a detail/edit panel or modal.

## 6. Data Model

No new models in this milestone. Uses Task (M1 extended), Event (M1), Reminder (M1).

## 7. Backend Requirements

### 7.1 Calendar aggregation endpoint

```
GET /api/calendar

Query params:
  startDate: ISO date string (required)
  endDate:   ISO date string (required)
  context:   string (optional, filter by context)
  types:     comma-separated ('tasks,events,reminders') (optional, default all)

Response:
{
  tasks: [Task],
  events: [Event],
  reminders: [Reminder]
}
```

This endpoint must:
- Query only within the given date range.
- For tasks: include tasks where dueDate is in range OR startDate is in range.
- For events: include events where startDateTime is in range OR endDateTime is in range.
- For reminders: include reminders where reminderDateTime is in range.
- Only return items belonging to the authenticated user (as creator or assignee/participant).

### 7.2 Performance requirements

- Calendar queries must use the indexes created in M1.
- A month view query should return in under 300ms for a typical user.
- Do not use N+1 queries — use `.populate()` or equivalent.

## 8. WebSocket Requirements

No new WebSocket events specifically for calendar in this milestone. Items updated via existing mechanisms will be reflected on calendar refresh.

(Real-time calendar updates come in M7.)

## 9. Frontend Requirements

### 9.1 Calendar page

Create a `/calendar` route (or equivalent following existing routing convention).

The page should contain:
- View switcher (Month | Week | Day | Agenda).
- Navigation controls (← Prev | Today | Next →).
- Date display (e.g., "August 2026").
- The active view component.
- A "Create" button (opens item creation modal).

### 9.2 Calendar components

Do not use a full calendar library unless one already exists in the project. Check existing dependencies first. If a calendar library (e.g., FullCalendar, react-big-calendar) is already installed, use it. If not, build simple views — the goal is functionality, not a pixel-perfect calendar widget.

Components needed:
- `CalendarMonthView`
- `CalendarWeekView`
- `CalendarDayView`
- `CalendarAgendaView`
- `CalendarItemBadge` (small item display in month cells)
- `CalendarEventBlock` (time-positioned block in week/day view)
- `CreateItemModal` (item creation from calendar)
- `ItemDetailPanel` or modal (view/edit item)

### 9.3 State management

- Use existing state management solution (Redux, Zustand, Context).
- Calendar state: current view, current date, loaded date range, items.
- Do not re-fetch if the date range is already loaded.
- Invalidate and re-fetch after item creation/update/delete.

### 9.4 Loading and empty states

- Show skeleton/loading state while calendar data loads.
- Show empty state message on dates with no items ("Nothing scheduled").
- Show error state if API fails.

## 10. UX Requirements

- The calendar must be the first major non-dashboard page in the navigation.
- Navigation between months/weeks must feel instant (optimistic UI or pre-fetch adjacent period).
- On mobile, default to Agenda view.
- Color coding should be consistent: pick a scheme and document it (e.g., blue=events, orange=tasks, green=reminders).
- Overdue items should use a red/warning color.
- Today's date should always be visually highlighted.

## 11. Edge Cases

- Empty date ranges: display empty calendar, not an error.
- Events spanning midnight: show on both days in month view; show correctly spanning in week/day view.
- Multiple items on same time slot: stack them, show all.
- Timezone: display times in the user's browser timezone. Store all datetimes in UTC.
- Very long event titles: truncate with ellipsis in compact views.
- User with no items: show welcome/empty state.

## 12. Security

- Calendar endpoint must only return items belonging to the authenticated user.
- Date range params must be validated (valid dates, end > start, not unreasonably large range like 10 years).
- Context filter must be validated against allowed enum values.

## 13. Migration / Backward Compatibility

No schema changes in this milestone. Ensure existing task pages still work alongside the new calendar page.

## 14. Testing Checklist

**Backend:**
- [ ] GET /api/calendar returns tasks in date range.
- [ ] GET /api/calendar returns events in date range.
- [ ] GET /api/calendar returns reminders in date range.
- [ ] Items outside date range are NOT returned.
- [ ] User A cannot see User B's items.
- [ ] Invalid date range returns 400.
- [ ] Context filter works.

**Frontend:**
- [ ] Month view renders correctly.
- [ ] Week view renders correctly.
- [ ] Day view renders correctly.
- [ ] Agenda view renders correctly.
- [ ] Navigation works in all views.
- [ ] Today button returns to current date.
- [ ] Creating item from calendar appears immediately.
- [ ] Loading state shown while fetching.
- [ ] Empty state shown when no items.
- [ ] Existing task/auth/Kanban functionality unchanged.

## 15. Completion Criteria

- [ ] All four calendar views functional.
- [ ] Date navigation works.
- [ ] Calendar aggregation API efficient and correct.
- [ ] Items display with correct type/color coding.
- [ ] Create item from calendar works.
- [ ] Edit item from calendar works.
- [ ] No full data dumps — only date range queries.
- [ ] Mobile view functional (at least Agenda view).
- [ ] Existing functionality verified unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Wait for instruction to proceed to Milestone 3.

---

# MILESTONE 3 — "MY DAY" COMMAND CENTER

## 1. Objective

Build the most important screen in the product. My Day is the default dashboard — the answer to "What do I need to do today?" It is a chronological aggregation of everything happening for the authenticated user on a given day. This is the defining experience of the product.

## 2. Existing Functionality to Reuse

- Task, Event, Reminder models (M1).
- Calendar aggregation API (M2, or extend it).
- Existing authentication and state management.
- Existing design system.

## 3. Scope

- My Day page showing today's chronological timeline.
- Day navigation (prev/next/today).
- Summary section (urgent/high priority counts).
- Overdue section.
- Tomorrow preview section.
- Support for tasks, events, and reminders.

## 4. Out of Scope

- Team view (M14).
- AI suggestions (M19, M20).
- Recurring task generation (M11).
- Notification inbox (M8).
- Time tracking (M15).

## 5. Functional Requirements

### 5.1 The Timeline

My Day must display a chronological list of everything the user has on a given day:

```
TODAY — Thursday, August 13

🔴 2 Urgent    🟠 4 High    🔵 5 Normal

─── TIMELINE ──────────────────

09:00   Team Standup              Event     [WORK]
10:00   Fix Authentication Issue  Task      HIGH
12:30   Lunch                     Personal
14:00   Review Pull Request       Task      MEDIUM
16:00   Production Deployment     Task      URGENT
19:00   Gym                       Reminder  [HEALTH]

─── OVERDUE ────────────────────

● API Documentation               Due Aug 12
● Update Deployment Docs          Due Aug 10

─── TOMORROW ───────────────────

→ Database Migration
→ Project Meeting
```

### 5.2 Item ordering

Items without a specific time are sorted to the end of the timeline or shown at the top without a time.

Items with a specific time (events, timed tasks) are sorted chronologically.

Overdue items are grouped separately below the timeline.

### 5.3 Day navigation

- User can navigate prev/next day using arrow buttons.
- A "Today" button jumps back to the current date.
- The date is shown prominently in the header.

### 5.4 Summary counts

At the top, show:
- Count of urgent items today.
- Count of high-priority items today.
- Count of normal/low items today.
- Count of overdue items.

### 5.5 Item interactions

Clicking an item opens its detail view (same as clicking an item in the calendar).

Each item should show:
- Title.
- Type (Task/Event/Reminder).
- Context/category.
- Priority (for tasks).
- Time (if set).
- Status (for tasks).
- Quick-complete button for tasks and reminders.

### 5.6 What counts as "today"

For a given date D:
- **Events**: any event where startDateTime is on date D (in user's timezone).
- **Tasks**: any task where dueDate is on date D OR startDate is on date D. If a task has no due date, it does NOT appear in My Day unless specifically added.
- **Reminders**: any reminder where reminderDateTime is on date D.
- **Overdue**: tasks with dueDate < today, status not Done/Completed.

### 5.7 My Day is an aggregation

My Day does NOT create new database records. It aggregates data from existing Task, Event, and Reminder models. Do not create a separate "MyDay" collection.

## 6. Data Model

No new models. Uses existing Task, Event, Reminder.

A `scheduledFor` approach may be needed: a user should be able to manually add a task to their My Day view even if it has no due date. This requires a lightweight mechanism:

```javascript
// Option A: Add to Task model (preferred if model is already being extended):
myDayDate: {
  type: Date,
  default: null  // If set, task appears in My Day for that date regardless of dueDate
}

// Option B: Separate small collection (use only if Task model cannot be changed):
const MyDayEntrySchema = new Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  task: { type: ObjectId, ref: 'Task', required: true },
  date: { type: Date, required: true }
});
```

Choose Option A unless the existing Task model cannot be safely modified. Document your choice in the report.

## 7. Backend Requirements

### 7.1 My Day API

```
GET /api/myday?date=2026-08-13

Response:
{
  date: "2026-08-13",
  summary: {
    urgent: 2,
    high: 4,
    normal: 5,
    low: 0,
    overdue: 2
  },
  timeline: [
    {
      type: 'event' | 'task' | 'reminder',
      time: '09:00' | null,
      item: { ...full item object... }
    }
  ],
  overdue: [Task],
  tomorrow: [Task | Event]
}
```

### 7.2 Quick-complete endpoint

Reuse the existing task update endpoint for marking tasks complete. Reuse the reminder complete endpoint from M1.

### 7.3 Add to My Day endpoint

```
POST /api/myday/add
Body: { taskId: string, date: string }

DELETE /api/myday/remove
Body: { taskId: string, date: string }
```

## 8. WebSocket Requirements

No new WebSocket events in this milestone. My Day refreshes when the user navigates to a different day or when an item is created/updated.

(Real-time My Day updates come in M7.)

## 9. Frontend Requirements

### 9.1 My Day page

This should be the **default route** after login (or clearly prominent in the navigation).

Page structure:
```
[Header]
  Good morning, [Name]    [← Prev]  Thursday, August 13  [Next →]  [Today]

[Summary Bar]
  🔴 2 Urgent   🟠 4 High   🔵 5 Normal   ⚠️ 2 Overdue

[Timeline]
  09:00  ─────  [Item Card]
  10:00  ─────  [Item Card]
  ...

[Overdue Section]
  [Item Card] (overdue indicator)
  ...

[Tomorrow Preview]
  [Simple list]
```

### 9.2 Item Card component

Create a reusable `DayItemCard` component. It must display:
- Time (left column) or blank.
- Type indicator (color dot or icon).
- Title.
- Context badge.
- Priority badge (for tasks).
- Quick-complete toggle (for tasks and reminders).
- Overdue indicator (if applicable).

### 9.3 Loading and empty states

- Loading: skeleton cards while fetching.
- Empty day: motivational empty state ("Nothing scheduled for today. Add something?") with create button.
- Error: error message with retry button.

## 10. UX Requirements

- My Day must load fast. The summary bar should appear before the full timeline if possible.
- Items must feel actionable — not just a list to look at.
- The difference between urgent/high/normal should be visually clear without being distracting.
- Overdue items must feel important but not anxiety-inducing. A subtle red or warning color, not flashing alerts.
- The navigation between days should be instant (pre-load adjacent days).
- On mobile, the timeline should be a single scrollable column.

## 11. Edge Cases

- Day with no items: show empty state, not an error.
- User with many overdue items: cap display at 5 with "view all overdue" link.
- Tomorrow section at end of year boundary (Dec 31 → Jan 1): handle correctly.
- Event spanning midnight: show on the day it starts.
- User changes timezone: times should reflect current timezone.

## 12. Security

- GET /api/myday must only return items for the authenticated user.
- Date parameter must be validated.
- Overdue calculation must be server-side, not client-side.

## 13. Migration / Backward Compatibility

No breaking schema changes. If adding `myDayDate` to Task model, it must be optional with null default.

## 14. Testing Checklist

**Backend:**
- [ ] GET /api/myday returns correct items for given date.
- [ ] Overdue items appear correctly.
- [ ] Tomorrow items appear correctly.
- [ ] Items from other users do NOT appear.
- [ ] Summary counts are correct.
- [ ] Day with no items returns empty (not 404).

**Frontend:**
- [ ] My Day loads on the correct route.
- [ ] Day navigation works.
- [ ] Today button works.
- [ ] Items display with correct type/priority/time.
- [ ] Quick-complete works for tasks.
- [ ] Overdue section visible and correct.
- [ ] Loading state shown.
- [ ] Empty state shown for empty days.
- [ ] Existing functionality unchanged.

## 15. Completion Criteria

- [ ] My Day page renders correctly.
- [ ] Timeline is chronologically ordered.
- [ ] All item types shown (tasks, events, reminders).
- [ ] Overdue items shown separately.
- [ ] Tomorrow preview shown.
- [ ] Summary counts correct.
- [ ] Day navigation works.
- [ ] Quick-complete works.
- [ ] API efficient (no full data dumps).
- [ ] Existing functionality verified unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Wait for instruction to proceed to Milestone 4.

---

# MILESTONE 4 — TASK SYSTEM 2.0

## 1. Objective

Upgrade the existing task system to become a powerful tool for serious work — without destroying the existing Kanban board, drag-and-drop, or task CRUD that already works. The existing task workflow (Todo → Working → Done) must continue to function. This milestone extends it.

## 2. Existing Functionality to Reuse

- Existing task CRUD (extend, do not replace).
- Existing Kanban board (extend, do not rebuild).
- Existing drag-and-drop (extend, do not replace).
- Existing task assignment/member system.
- New task fields added in M1 (priority, context, dueDate, startDate).

## 3. Scope

- Extended status workflow (backward-compatible).
- Priority system (UI for what was added in M1).
- Subtasks.
- Smart deadline display.
- Task detail view with all fields.
- Comments placeholder (actual comments in M9).
- Start date / due date UI.
- Tags UI.
- Estimated duration.

## 4. Out of Scope

- Task dependencies (M10).
- Recurring tasks (M11).
- File attachments (M12).
- Comments with real-time (M9).
- Time tracking with timer (M15).
- AI features (M19-20).

## 5. Functional Requirements

### 5.1 Extended Status Workflow

The existing statuses must continue to work. Add new statuses in a backward-compatible way.

Current (inspect actual values): `todo | working | done` (or whatever they are).

Extended:
```
backlog → todo → in_progress → review → blocked → done
```

**Migration strategy:**
- Map existing statuses to new ones: `todo → todo`, `working → in_progress`, `done → done`.
- New statuses (`backlog`, `review`, `blocked`) are additive — no existing tasks need to change.
- The Kanban board must be updated to show new columns, but existing tasks must appear in the correct column.
- If the migration is risky, introduce new statuses as optional and run the existing system in parallel temporarily.

### 5.2 Priority

Priority was added to the model in M1. Now add the UI:
- Priority selector in task creation form.
- Priority badge on task cards.
- Priority filter on task list/Kanban.
- Default: `medium`.

### 5.3 Subtasks

A subtask is a child task linked to a parent task.

Data model:
```javascript
// Add to Task model:
parentTask: {
  type: ObjectId,
  ref: 'Task',
  default: null
},
subtasks: [{
  type: ObjectId,
  ref: 'Task'
}],
subtaskProgress: {
  total: { type: Number, default: 0 },
  completed: { type: Number, default: 0 }
}
```

Behavior:
- User can add subtasks from the task detail view.
- Subtasks appear as a checklist inside the parent task.
- Completion percentage is shown: "3 of 5 complete (60%)".
- Completing all subtasks does NOT automatically complete the parent (user confirms).
- Subtasks appear in My Day and Calendar if they have a due date.
- Subtasks are not shown on Kanban by default (show only parent tasks).

### 5.4 Smart Deadline Display

Replace static "Due Aug 15" with contextual display:

```
Due today
Due tomorrow
Due in 2 hours
Due in 2 days
Due in 1 week
Overdue by 1 day
Overdue by 1 week
```

This is a frontend utility function. Apply it everywhere a due date is displayed.

Logic:
- If past: "Overdue by [N] [unit]".
- If today: "Due today" (add time if available: "Due today at 5 PM").
- If tomorrow: "Due tomorrow".
- If within 7 days: "Due in [N] days".
- If further: "Due [Month Day]" (abbreviated).

### 5.5 Task Detail View

The task detail view (accessible from Kanban, My Day, Calendar, task list) must show:

```
[Title]
[Status] [Priority] [Context]

Description:
[Editable text area]

Assignee: [User avatar + name]
Creator: [User avatar + name]

Start Date: [Date picker]
Due Date: [Date picker + smart display]

Estimated Duration: [N] hours

Tags: [Tag chips]

Project: [Project name] (placeholder for M5)

Subtasks:
□ [Subtask 1]     [due date]
□ [Subtask 2]     [due date]
☑ [Subtask 3]     [due date]
[+ Add subtask]

[0% / 60% / 100% progress bar]

Comments: (coming soon / placeholder)

Activity: (coming soon / placeholder)
```

### 5.6 Kanban Board Extensions

The existing Kanban board needs:
- New columns for new statuses (backlog, review, blocked) — if the board is currently hard-coded, make it data-driven.
- Priority indicator on task cards (colored border or badge).
- Due date with smart display on task cards.
- Subtask count on task cards (e.g., "3/5 subtasks").
- The existing drag-and-drop must still work for all columns.

## 6. Data Model

Extend the existing Task model (inspect actual fields first):

```javascript
// Add these if not already present:
parentTask: { type: ObjectId, ref: 'Task', default: null },
subtaskProgress: {
  total: { type: Number, default: 0 },
  completed: { type: Number, default: 0 }
}
```

Update status enum to include new values (migration required — see section 13).

## 7. Backend Requirements

### 7.1 Subtask endpoints

```
POST   /api/tasks/:id/subtasks        Create subtask
GET    /api/tasks/:id/subtasks        List subtasks
PUT    /api/tasks/:id/subtasks/:sid   Update subtask
DELETE /api/tasks/:id/subtasks/:sid   Delete subtask
PATCH  /api/tasks/:id/subtasks/:sid/complete  Complete subtask
```

Completing a subtask must update the parent's `subtaskProgress` atomically.

### 7.2 Task update extensions

The existing task update endpoint must now accept:
- `status` (new values allowed).
- `priority`.
- `context`.
- `startDate`.
- `dueDate`.
- `estimatedDuration`.
- `tags`.
- `parentTask`.

Do not break existing update requests.

## 8. WebSocket Requirements

No new WebSocket events in this milestone. Subtask completion updates will trigger a task update that existing WebSocket events can carry.

## 9. Frontend Requirements

- Update task creation form to include priority, context, start date, due date, estimated duration, tags.
- Update task cards (Kanban) to show priority badge, smart due date, subtask progress.
- Create task detail view/panel with all fields shown in section 5.5.
- Implement smart deadline display as a utility function used everywhere.
- Update Kanban board to support new status columns.
- Add subtask checklist to task detail view.

## 10. UX Requirements

- Priority must be immediately visible on task cards — use color (red=urgent, orange=high, blue=medium, gray=low).
- Smart deadline display must update client-side without API calls.
- Subtask progress bar should be subtle, not distracting.
- Adding a subtask should be as fast as typing and pressing Enter.
- Blocked status should be visually distinct (e.g., gray-out with lock icon).

## 11. Edge Cases

- Task with no due date: show "No due date" not an error.
- All subtasks completed: prompt user to complete parent (do not auto-complete).
- Existing tasks after status migration must appear in correct Kanban column.
- Deleting a parent task: decide policy (cascade delete subtasks or prevent deletion if subtasks exist — document and implement one).
- Task with circular parent reference: prevent (task cannot be its own subtask).

## 12. Security

- User can only view/edit subtasks of tasks they have access to.
- Status changes must be authorized (user must be assignee or creator).
- New status values must be validated server-side.

## 13. Migration / Backward Compatibility

**Status migration:**

1. Inspect the exact current status values in the database.
2. Write a migration script that updates status values:
   - `'working'` → `'in_progress'` (if that is the current value).
   - All others: map to nearest equivalent.
3. Test that existing tasks appear in the correct Kanban column after migration.
4. Make the migration reversible (save the original value before changing, or log changes).

**The existing drag-and-drop must continue to work after new columns are added.**

## 14. Testing Checklist

**Backend:**
- [ ] POST /api/tasks/:id/subtasks creates subtask linked to parent.
- [ ] Completing a subtask updates parent's subtaskProgress.
- [ ] New status values accepted by update endpoint.
- [ ] Old status values mapped correctly after migration.
- [ ] Subtask cannot reference itself as parent.

**Frontend:**
- [ ] Kanban shows all status columns including new ones.
- [ ] Existing drag-and-drop works across all columns.
- [ ] Task cards show priority badge.
- [ ] Task cards show smart due date.
- [ ] Task detail view shows all fields.
- [ ] Subtask checklist works (add, complete, delete).
- [ ] Subtask progress bar updates correctly.
- [ ] Smart deadline display correct for all cases.

**Migration:**
- [ ] Existing tasks appear in correct Kanban column.
- [ ] No data loss from status migration.

## 15. Completion Criteria

- [ ] Priority system functional (model, API, UI).
- [ ] Extended status workflow functional and backward-compatible.
- [ ] Subtasks functional (create, complete, delete, progress).
- [ ] Smart deadline display in all views.
- [ ] Task detail view shows all fields.
- [ ] Kanban board extended without breaking existing drag-and-drop.
- [ ] Existing task CRUD fully functional.
- [ ] Existing auth/chat/WebSocket unchanged.
- [ ] Status migration completed and verified.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Verify all existing functionality. Wait for instruction to proceed to Document 02.

---

*End of Document 01. Proceed to `02_AUTHORIZATION_AND_COLLABORATION.md` when instructed.*
