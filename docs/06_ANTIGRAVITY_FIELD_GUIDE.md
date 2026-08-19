# 06 — ANTIGRAVITY FIELD GUIDE

> **Purpose:** This document tells you — the human — exactly how to use these docs with Antigravity. It also gives Antigravity a concrete playbook for every situation it encounters: ambiguity, regressions, schema conflicts, incomplete prerequisites, and more.
>
> Keep this document open alongside whichever milestone document you are currently executing.

---

## PART 1 — HOW TO USE THESE DOCUMENTS

### 1.1 The complete set

```
docs/
├── 00_MASTER_INSTRUCTIONS.md         ← Rules for everything. Read once. Re-read often.
├── 01_FOUNDATION_AND_CALENDAR.md     ← M0, M1, M2, M3, M4
├── 02_AUTHORIZATION_AND_COLLABORATION.md  ← M5, M6, M7, M8, M9
├── 03_ADVANCED_TASK_MANAGEMENT.md    ← M10, M11, M12, M13, M15
├── 04_TEAM_MANAGEMENT_AND_ANALYTICS.md   ← M14, M16
├── 05_INTEGRATIONS_AND_AI.md         ← M17, M18, M19, M20
└── 06_ANTIGRAVITY_FIELD_GUIDE.md     ← This file
```

### 1.2 Reading order for Antigravity (every session)

Every time Antigravity starts a session, it should:

1. Read `00_MASTER_INSTRUCTIONS.md` in full.
2. Read the current milestone document for the assigned milestone.
3. Re-read the relevant section (the specific milestone number) within that document.
4. Run the pre-flight check.
5. Report findings before touching any code.

Antigravity must **not** read ahead into future milestone documents unless asked to understand dependencies.

### 1.3 Your prompt to Antigravity (keep it short)

Once you have all six files in your project repository, your Antigravity master prompt can be minimal:

```
You are working on a real-time productivity platform.

Before doing anything:
1. Read docs/00_MASTER_INSTRUCTIONS.md completely.
2. Inspect the existing codebase.
3. Then execute only the milestone I specify below.
4. Never implement milestones from future documents.
5. Stop and report after each milestone.

Execute: docs/01_FOUNDATION_AND_CALENDAR.md — Milestone 0 (Audit)
```

### 1.4 Execution sequence (how you hand work to Antigravity)

```
Session 1:  docs/01_FOUNDATION_AND_CALENDAR.md — Milestone 0 (Audit only)
              ↓ Review the audit report. Approve it.
Session 2:  docs/01_FOUNDATION_AND_CALENDAR.md — Milestone 1 (Data Model)
              ↓ Review, test, verify.
Session 3:  docs/01_FOUNDATION_AND_CALENDAR.md — Milestone 2 (Calendar)
              ↓ Review, test, verify.
Session 4:  docs/01_FOUNDATION_AND_CALENDAR.md — Milestone 3 (My Day)
              ↓ Review, test, verify.
Session 5:  docs/01_FOUNDATION_AND_CALENDAR.md — Milestone 4 (Task System 2.0)
              ↓ Review, test, verify.

── Document 01 complete ──

Session 6:  docs/02_AUTHORIZATION_AND_COLLABORATION.md — Milestone 5 (Projects & Teams)
...and so on.
```

You may run multiple milestones in one session if they are small, but only if the previous milestone is verified complete before starting the next.

---

## PART 2 — THE ANTIGRAVITY WORKFLOW (DETAILED)

This is the exact process Antigravity follows for every milestone. Post this in the Antigravity context if needed.

### Step 1: READ

Read the milestone specification completely before writing any code.

Identify:
- What is being built.
- What already exists that can be reused.
- What is explicitly out of scope.
- What the completion criteria are.

### Step 2: INSPECT

Find the relevant existing code:

```
Where is the existing task model?
Where is the existing auth middleware?
What does the existing task controller look like?
What route convention does the project use?
What does the existing socket event look like?
What state management pattern does the frontend use?
```

Do not assume. Read the actual files.

### Step 3: PLAN (report before implementing)

Before writing a single line of new code, report:

```
MILESTONE [N] — PLAN

I inspected:
  [list of files read]

Existing code I will REUSE:
  [file/function/model — how it will be reused]

Existing code I will EXTEND:
  [file/function/model — what will be added]

New code I will CREATE:
  [file/path — what it will contain]

Existing code I will NOT TOUCH:
  [files that will remain unchanged]

Database changes:
  [model name — fields being added — safe defaults confirmed]

API changes:
  [new routes — modified routes]

WebSocket changes:
  [new events — modified events]

Potential risks:
  [anything that could break existing functionality]

Questions (if any):
  [list, or "None"]

Estimated implementation order:
  1. [first step]
  2. [second step]
  ...
```

If there are questions, stop and wait for answers before implementing.

### Step 4: IMPLEMENT

Implement the minimum change that satisfies the milestone's completion criteria.

Rules during implementation:
- Make one logical change at a time.
- Test after each file change before moving to the next.
- Do not add unrequested features.
- Do not refactor code that is not related to the current milestone.
- Do not add new dependencies without documenting why they are necessary.

### Step 5: TEST

Run the tests described in the milestone's "Testing Checklist" section.

Format:
```
TESTING — MILESTONE [N]

Backend tests:
  ✅ POST /api/tasks creates task with new optional fields
  ✅ GET /api/tasks returns tasks with new fields
  ✅ Existing POST /api/tasks (old format, no new fields) still works
  ❌ PUT /api/tasks/:id with context field — FAILS: validation error

Issues found:
  [description of each failure]

Fixes applied:
  [what was changed to fix each failure]

Re-tested:
  ✅ All previously failing tests now pass
```

Do not mark a milestone complete while any test is failing.

### Step 6: VERIFY EXISTING FUNCTIONALITY

After every milestone, run this regression checklist:

```
REGRESSION CHECK

Login:                    ✅ / ❌
Signup:                   ✅ / ❌
Protected routes (JWT):   ✅ / ❌
Task CRUD:                ✅ / ❌
Task status change:       ✅ / ❌
Kanban drag-and-drop:     ✅ / ❌
Add team member:          ✅ / ❌
Chat (send message):      ✅ / ❌
WebSocket (real-time):    ✅ / ❌
[any other existing features relevant to the project]
```

If any regression is found, fix it before marking the milestone complete.

### Step 7: REPORT

Produce the completion report:

```
MILESTONE [N] COMPLETE — [Name]

Summary:
  [One paragraph describing what was built]

Files changed:
  server/models/Task.js          — Added: priority, context, dueDate fields
  server/routes/tasks.js         — Added: GET filter params
  client/src/components/TaskCard.jsx  — Updated: priority badge display
  [etc.]

Database changes:
  Task model: 3 new optional fields added with safe defaults.
  New index added: { project: 1, dueDate: 1 }
  No existing data modified.

New API endpoints:
  POST   /api/events             Create event
  GET    /api/events             List events (date range)
  [etc.]

Modified API endpoints:
  GET    /api/tasks              Added filter query params (all optional)

New WebSocket events:
  None in this milestone.

Completion criteria:
  ✅ Task model extended with new optional fields
  ✅ Existing tasks unaffected by schema changes
  ✅ Event model created
  ✅ Event API functional
  ✅ Authorization enforced
  ✅ Existing task CRUD verified working
  ✅ Existing chat verified working
  ✅ Existing Kanban verified working

Known limitations:
  [anything that works but is not ideal — to be improved later]

Recommended next step:
  Proceed to Milestone 2 (Calendar Foundation).
```

### Step 8: STOP

Do not proceed to the next milestone without explicit instruction.

The stop condition exists for a reason: the human needs to review the work, test it independently, and decide whether to proceed.

---

## PART 3 — HOW TO HANDLE SPECIFIC SITUATIONS

### 3.1 The existing code doesn't match the spec

**Situation:** The spec says "existing task model has a `dueDate` field" but the actual model uses `deadline` instead.

**What to do:**
1. Document the discrepancy in your report.
2. Use the actual field name (`deadline`) in your implementation — do not rename it.
3. If the spec's API design uses `dueDate` as a parameter name, map it to `deadline` server-side.
4. Note in your report: "The spec refers to this field as `dueDate` but the actual model uses `deadline`. I have implemented using the existing field name."

### 3.2 A prerequisite milestone is incomplete

**Situation:** You're starting Milestone 7 (Real-Time Collaboration) but the WebSocket infrastructure from the existing codebase is partially broken.

**What to do:**
```
STOP.

Prerequisites not met.

Issue: The existing WebSocket connection does not authenticate the socket connection.
       Any user can connect without a valid JWT.

Impact: Building on top of this would create a security vulnerability.

Options:
  A. Fix the socket authentication before proceeding (estimated: 2-3 hours).
  B. Proceed with a note that socket auth needs fixing (technical debt).
  C. Skip socket features in M7 and flag for later.

Recommendation: Option A — fix socket auth first. This is a security issue.

I will not proceed until you confirm the approach.
```

Never silently work around a broken prerequisite without documenting it.

### 3.3 A feature already exists in a different form

**Situation:** You're implementing the notification system (M8) but you discover the existing codebase already has a basic notification table.

**What to do:**
1. Document what exists: model fields, API routes, frontend usage.
2. Assess whether it satisfies M8's requirements or needs extension.
3. Extend if possible; replace only if fundamentally incompatible.
4. Report: "Found existing notification system at [location]. It has [fields]. M8 requires [additional fields]. I will extend the existing model rather than creating a new one."

### 3.4 The spec contradicts the existing code

**Situation:** The spec says "status values are: backlog, todo, in_progress, review, blocked, done" but the existing database has 3000 tasks with status values "todo", "working", "done".

**What to do:**
1. Document the conflict.
2. Design a migration plan.
3. Propose the migration to the human before executing.

```
STATUS FIELD CONFLICT

Spec requires: backlog | todo | in_progress | review | blocked | done
Existing data: todo | working | done (3,247 tasks)

Proposed migration:
  'working' → 'in_progress'   (direct map, no ambiguity)
  'todo'    → 'todo'           (unchanged)
  'done'    → 'done'           (unchanged)
  New values (backlog, review, blocked) will default on new tasks.

Migration script:
  await Task.updateMany({ status: 'working' }, { status: 'in_progress' });

Risks:
  - The Kanban board uses status values to determine columns.
    I will update the column configuration simultaneously.
  - No data will be lost.

I will NOT run this migration until you confirm.
```

### 3.5 A dependency library is not installed

**Situation:** The spec suggests using `date-fns` for recurrence calculation but the project only has `moment.js`.

**What to do:**
1. Use the existing library (`moment.js`) rather than adding a new one.
2. Document: "Used `moment.js` for date calculations (already present in project) rather than adding `date-fns`."
3. Only add a new library if the existing library genuinely cannot support the required functionality.

### 3.6 The AI call fails or returns invalid JSON

**Situation (M19/M20):** The AI parsing endpoint receives malformed JSON from the AI service.

**What to do (backend):**
1. Log the raw response.
2. Return a 422 with message: "AI returned an unexpected response format."
3. Do not attempt to parse malformed JSON.
4. The frontend shows: "Couldn't parse your input. Try rephrasing or use the regular form."

### 3.7 Two users' data collides in real-time

**Situation (M7):** User A and User B both edit the same task simultaneously. User A saves first. User B's edit arrives.

**What to do:**
- The database is the source of truth. Last write wins.
- User B should see a banner: "This task was updated by [User A] while you were editing."
- User B's local edits are preserved in the form — they can review and re-save.
- Do not silently discard either user's changes.

Document this as a known limitation: "True conflict resolution (CRDT/OT) is not implemented. Last write wins with a client-side warning."

### 3.8 A performance issue is found

**Situation:** During testing, a calendar query takes 4 seconds because it is loading all tasks without a date filter.

**What to do:**
1. Document the issue.
2. Fix it before marking the milestone complete — this is a functional problem, not an optimization.
3. Report: "Found N+1 query in calendar endpoint. Fixed by adding `.populate()` in single query. Now returns in 180ms."

Do not ship a known performance problem that would make the feature unusable.

---

## PART 4 — COMMON MISTAKES TO AVOID

### ❌ Mistake 1: Implementing future features while working on the current milestone

**Example:** While building the Calendar (M2), you also add a "team view" to the calendar because it seems easy.

**Why it's a problem:** Team calendar depends on authorization (M6) which hasn't been built yet. You'll likely build it incorrectly and have to redo it.

**Rule:** If a feature is not in the current milestone's scope, make a note in your report and do it later.

---

### ❌ Mistake 2: Rebuilding instead of extending

**Example:** The existing task endpoint uses `express-validator`. You think it's messy, so you rewrite the whole controller using `joi`.

**Why it's a problem:** You've introduced a library inconsistency, possibly broken existing validation rules, and wasted time.

**Rule:** Refactor only when the current milestone explicitly requires it or when not refactoring would cause a bug.

---

### ❌ Mistake 3: Trusting the client for authorization

**Example:** You hide the "Delete project" button from non-admins in the frontend UI, but the DELETE /api/projects/:id endpoint has no authorization check.

**Why it's a problem:** Anyone who reads the network tab can delete a project by sending a direct API request.

**Rule:** Every API endpoint that performs a sensitive action must check authorization server-side, regardless of what the frontend shows.

---

### ❌ Mistake 4: Using WebSocket events as the only persistence

**Example:** When a task is assigned, you emit a `TASK_ASSIGNED` socket event but forget to update the database. The assignment disappears on page refresh.

**Why it's a problem:** WebSocket events are ephemeral. The database is permanent.

**Rule:** Always write to the database first. Emit the WebSocket event after the database write succeeds.

---

### ❌ Mistake 5: Adding unrequested dependencies

**Example:** You add `lodash`, `ramda`, and `rxjs` while implementing a simple date formatting function.

**Why it's a problem:** Dependencies add bundle size, maintenance burden, and potential security vulnerabilities.

**Rule:** Use native JavaScript where it is sufficient. Check existing project dependencies before adding new ones.

---

### ❌ Mistake 6: Renaming existing database fields

**Example:** You rename `task.working` to `task.in_progress` without a migration, breaking all existing tasks.

**Why it's a problem:** Existing data has the old field name. The rename leaves all existing documents inconsistent.

**Rule:** If renaming is necessary: write a migration script, run it, verify all documents are updated, then update the code. Do not rename a field without migrating all existing data.

---

### ❌ Mistake 7: Writing AI features before the core is stable

**Example:** You jump to M19 (AI task creation) because it's exciting, but M8 (notifications) isn't working correctly yet.

**Why it's a problem:** AI features build on top of all existing models and APIs. Bugs in the foundation become multiplied bugs in the AI layer.

**Rule:** AI milestones (M19, M20) are always last. Document 05 is always last.

---

## PART 5 — ENVIRONMENT SETUP CHECKLIST

Before the first session (Milestone 0 audit), confirm:

- [ ] Node.js version installed and correct for the project.
- [ ] MongoDB running locally or connection string configured.
- [ ] `.env` file created from `.env.example` with all required values.
- [ ] `npm install` completed in both frontend and backend directories.
- [ ] Application starts without errors (`npm run dev` or equivalent).
- [ ] Application is accessible in browser.
- [ ] Existing login/signup works.
- [ ] Existing tasks can be created and dragged.
- [ ] MongoDB client (e.g., MongoDB Compass) available to inspect database state directly.

Additional environment variables required by later milestones (set these up before the relevant milestone, not all at once):

```bash
# M17 — Google Integration
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# M17 — Token Encryption
TOKEN_ENCRYPTION_KEY=      # 32 random characters

# M19/M20 — AI
ANTHROPIC_API_KEY=

# Optional — Redis (if available)
REDIS_URL=
```

---

## PART 6 — TESTING PROTOCOLS

### 6.1 Backend testing (every milestone)

For every new API endpoint, verify manually (or with an automated test):

```
1. Happy path          — correct input, correct auth → expected success response
2. Missing auth        — no token → 401
3. Wrong auth          — valid token but wrong user → 403
4. Invalid input       — missing required field → 400 with clear message
5. Non-existent ID     — GET /api/tasks/nonexistent → 404
6. Correct data shape  — response matches documented schema
```

Use a tool like `curl`, `Postman`, `Thunder Client`, or an automated test suite — whichever the project already uses.

### 6.2 Real-time testing (M7 and later)

Open two browser windows:
- **Window A**: logged in as User 1 (Manager role).
- **Window B**: logged in as User 2 (Member role).

Protocol:
```
1. In Window A: perform an action (create task, assign task, update status).
2. In Window B: observe whether the change appears without page refresh.
3. Time the update: should appear within 500ms.
4. Verify correct: the update in B matches what A did.
5. Test disconnection: close Window B, perform action in A, reopen B → should see current state.
```

### 6.3 Authorization testing (M6 and later)

For every sensitive endpoint:

```
Test as Owner:     → Should succeed
Test as Admin:     → Should succeed (if allowed for admin)
Test as Manager:   → Should succeed or fail (per permission matrix)
Test as Member:    → Should succeed or fail (per permission matrix)
Test as non-member:→ Should always fail (403)
Test as anonymous: → Should always fail (401)
```

### 6.4 AI testing (M19, M20)

```
Test 1: Clear simple input
  Input: "Call mom on Sunday at 3pm"
  Expected: 1 reminder, correct date/time, context=personal

Test 2: Multi-item input
  Input: "Fix the login bug today and ask Rahul to review it"
  Expected: 2 tasks, dependency suggested

Test 3: Ambiguous date
  Input: "Finish the report by end of week"
  Expected: 1 task, date set to Friday, user can verify/edit

Test 4: No recognizable items
  Input: "just chatting lol"
  Expected: items array is empty, user sees empty state

Test 5: AI timeout simulation
  Temporarily set timeout to 1ms → should return 408, not crash

Test 6: User cancels review
  Fill review screen, click Cancel → nothing saved to database
```

---

## PART 7 — PROGRESS TRACKING

Use this table to track milestone progress. Update it after each verified completion.

| Milestone | Name | Doc | Status | Verified Date |
|---|---|---|---|---|
| M0 | Codebase Audit | 01 | ⬜ | |
| M1 | Data Model Foundation | 01 | ⬜ | |
| M2 | Calendar Foundation | 01 | ⬜ | |
| M3 | My Day Command Center | 01 | ⬜ | |
| M4 | Task System 2.0 | 01 | ⬜ | |
| M5 | Projects & Team Workspaces | 02 | ⬜ | |
| M6 | Roles & Authorization | 02 | ⬜ | |
| M7 | Real-Time Collaboration 2.0 | 02 | ⬜ | |
| M8 | Notification System | 02 | ⬜ | |
| M9 | Comments, Mentions & Activity | 02 | ⬜ | |
| M10 | Task Dependencies & Blocked Work | 03 | ⬜ | |
| M11 | Recurring Tasks & Reminders | 03 | ⬜ | |
| M12 | Attachments & Files | 03 | ⬜ | |
| M13 | Search, Filtering & Tags | 03 | ⬜ | |
| M15 | Time Tracking | 03 | ⬜ | |
| M14 | Team Calendar & Manager Dashboard | 04 | ⬜ | |
| M16 | Analytics & Reporting | 04 | ⬜ | |
| M17 | Email & External Calendar Integrations | 05 | ⬜ | |
| M18 | Daily Briefing | 05 | ⬜ | |
| M19 | AI: Natural Language Task Creation | 05 | ⬜ | |
| M20 | AI: Daily Planning | 05 | ⬜ | |

Status codes: ⬜ Not started &nbsp;|&nbsp; 🔵 In progress &nbsp;|&nbsp; ✅ Complete &nbsp;|&nbsp; ❌ Blocked

---

## PART 8 — DECISION LOG

Use this section to document architectural decisions made during implementation that deviate from or extend the spec. This is important for future maintainability.

Format:
```
## Decision [N] — [Short title]

Date: YYYY-MM-DD
Milestone: M[N]

Context:
  [What situation required a decision]

Options considered:
  A. [description]
  B. [description]

Decision:
  [Option A/B chosen] because [reason].

Consequences:
  [What this means for future development]

Revisit when:
  [Condition under which this decision should be reconsidered]
```

Example:
```
## Decision 1 — Timer state storage

Date: 2026-08-20
Milestone: M15

Context:
  The spec suggested storing active timer state in the database (on Task model)
  for persistence across sessions. However, this creates write contention
  when the timer is running — a write every second is too frequent.

Options considered:
  A. Store timer state in database (durable, consistent)
  B. Store in Redis with TTL (fast, eventually persisted on stop)
  C. Store in server memory (simple, lost on restart)

Decision:
  Option B (Redis) because the project already had Redis installed.
  Timer state written to Redis on start/pause. On stop: final duration
  written to the database as a TimeEntry.

Consequences:
  Timer state is lost if Redis restarts without persistence.
  On reconnect, client fetches timer status from Redis.

Revisit when:
  Redis is removed from the project, or if timer accuracy becomes critical.
```

---

## PART 9 — QUICK REFERENCE

### Key route patterns (fill in after Milestone 0 audit)

```
Authentication:
  Login:     [method] [path]
  Signup:    [method] [path]
  Refresh:   [method] [path]

Tasks:
  List:      [method] [path]
  Create:    [method] [path]
  Update:    [method] [path]
  Delete:    [method] [path]

[Fill in the rest after the audit]
```

### Key socket events (fill in after Milestone 0 audit)

```
Existing events:
  [event name] — [direction] — [trigger]

New events added (fill in as milestones complete):
  [event name] — [added in M[N]]
```

### Key models (fill in after Milestone 0 audit)

```
User:        [file path]     [key fields]
Task:        [file path]     [key fields]
Team:        [file path]     [key fields]
Message:     [file path]     [key fields]
[etc.]
```

### Environment variables (complete list)

```
# Core (existing)
NODE_ENV=
PORT=
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRY=

# Added in M17
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
TOKEN_ENCRYPTION_KEY=

# Added in M19/M20
ANTHROPIC_API_KEY=

# Optional
REDIS_URL=
MAX_FILE_SIZE=
```

---

## PART 10 — FREQUENTLY ASKED QUESTIONS

**Q: Can Antigravity implement two milestones at once if they are small?**

A: Yes, but only if the first is fully verified before the second begins. Never parallelize milestones within a session.

---

**Q: What if the audit (M0) reveals that the existing codebase is significantly different from what the spec assumes?**

A: Update the relevant milestone specs in your local copy to reflect reality. The spec is a guide, not a contract with an unchangeable reality. Document every deviation.

---

**Q: What if Antigravity breaks something while working on a milestone?**

A: Stop. Identify the exact regression. Fix it before continuing. If the regression cannot be quickly fixed, revert the changes and try a different approach.

---

**Q: What is the right order for M14 and M15?**

A: The documents list M14 (Manager Dashboard) in Document 04 and M15 (Time Tracking) in Document 03. This means Time Tracking comes before the Manager Dashboard — the dashboard can then display time tracking data. The numbering is intentionally non-sequential; follow the document order, not the milestone number order.

---

**Q: When should I give Antigravity the entire milestone document vs. just one milestone?**

A: Give Antigravity the entire document but instruct it to execute one milestone at a time. The document provides context for decisions even when not currently implementing a later milestone.

---

**Q: Can I skip milestones?**

A: Some milestones can be skipped if the feature is not needed. However, be careful: later milestones explicitly depend on earlier ones. If you skip M8 (Notifications), M9 (Comments) will not have a way to notify mentioned users. If you skip M11 (Recurring Tasks), M18 (Daily Briefing) will not show recurring items. Always check the dependency chain before skipping.

---

**Q: Should AI features be attempted if the team is small or the project timeline is short?**

A: Document 05's AI milestones (M19, M20) are deliberately last because they are the most complex and the least essential to the core product. If the timeline is constrained, stop after Document 04. The product is fully functional and valuable without AI.

---

**Q: What if the AI API is unavailable during M19/M20 testing?**

A: The feature must gracefully degrade. The "Plan my day" and quick-capture features should show a clear "AI features are currently unavailable" message rather than an error screen. All non-AI features must continue to work normally.

---

*End of Document 06 — Antigravity Field Guide.*

*You now have everything needed to build this product incrementally, safely, and correctly.*
