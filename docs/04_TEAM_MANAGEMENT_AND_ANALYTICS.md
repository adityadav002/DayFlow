# 04 — TEAM MANAGEMENT & ANALYTICS

> **Dependencies:** Documents 01, 02, and 03 must be complete and verified.
> **Depends on:** Projects/Teams (M5), Authorization (M6), Notifications (M8), Comments/Activity (M9), Time Tracking (M15).
> **Read first:** `00_MASTER_INSTRUCTIONS.md`

---

## PRE-FLIGHT CHECK

Before modifying anything:

1. Confirm Documents 01–03 are complete:
   - [ ] Calendar, My Day, Task System 2.0 functional (Doc 01).
   - [ ] Projects, Teams, Workspaces, Authorization functional (Doc 02).
   - [ ] Notifications, Comments, Activity log functional (Doc 02).
   - [ ] Dependencies, Recurring tasks, Attachments, Search, Time Tracking functional (Doc 03).
2. Inspect the current state of the Team, Project, Task, and TimeEntry models — everything in this document builds aggregations on top of them.
3. Verify that the `project` field on Task is correctly populated on existing tasks (not null unexpectedly).
4. Run full regression: login, task CRUD, Kanban, real-time sync, notifications, search, time tracking.

If any prerequisite is broken, stop and report.

---

## DO NOT MODIFY

- Existing authentication and JWT.
- Existing WebSocket infrastructure and events.
- Existing task CRUD, Kanban, drag-and-drop.
- Existing notification service.
- Existing comment and activity systems.
- Existing search and filter system.
- Existing time tracking.

---

# MILESTONE 14 — TEAM CALENDAR & MANAGER DASHBOARD

## 1. Objective

Give team managers (and team members) operational visibility across the entire team. A manager opens this view and immediately understands: who is working on what, what is overdue, what is due today, who is blocked, and what needs attention. This is the team equivalent of My Day — it aggregates team-wide data into a decision-making surface.

This is emphatically NOT a "leaderboard" or "productivity score" system. The goal is operational clarity, not surveillance.

## 2. Existing Functionality to Reuse

- Project, Task, Team, User, TimeEntry models.
- Authorization middleware (manager/admin roles from M6).
- Calendar aggregation endpoint (M2) — extend for team scope.
- My Day patterns (M3) — mirror the aggregation approach for team scope.
- Real-time WebSocket events (M7) — dashboard data can update via existing events.

## 3. Scope

- Team calendar view (shared events and tasks across team members).
- Manager dashboard overview (team-level summary).
- Per-member workload view.
- Overdue and blocked task visibility.
- Project status board (which projects are active, on-hold, at-risk).
- "What needs my attention" section.

## 4. Out of Scope

- Individual employee performance scores (explicitly excluded).
- Predictive analytics or trend forecasting (M16).
- Billable hours and financial reporting (M16).
- External calendar sync (M17).
- AI workload recommendations (M20).
- Cross-workspace reporting.

## 5. Functional Requirements

### 5.1 Team Calendar

A calendar view (reuse the M2 Calendar component) that shows:
- All tasks assigned to any team member, shown on their due date.
- All team events (meetings, deadlines) that include team members as participants.
- Color-coded by team member (each member has a color, derived from their profile or assigned).
- Filterable by team member (toggle individual members on/off).
- Viewable in Month, Week, and Day modes (same as personal calendar from M2).

The team calendar is read-only for non-managers. Managers can create events and tasks from it.

**This is a team-scoped version of the personal calendar. Reuse the Calendar UI components; add a `teamId` or `projectId` scope parameter to the existing calendar API.**

### 5.2 Manager Dashboard — Overview Panel

```
TEAM OVERVIEW — Engineering Team

Members:     12
Active Tasks: 87
Overdue:      14    ← urgent attention needed
Due Today:    23
Completed (this week): 31
Blocked:       8    ← needs attention
```

Each metric should be a clickable number that navigates to a filtered task list showing the relevant tasks.

### 5.3 Manager Dashboard — Member Workload Table

```
Member          Status   Working   Todo   Overdue   Blocked   Done (wk)

Aditya Kumar    🟢 Online    4      3        1         0         12
Rahul Singh     ⚪ Offline   2      5        0         1          8
Aman Gupta      🟢 Online    6      1        2         1          9
Priya Sharma    ⚪ Offline   1      4        0         0         11
Neha Patel      🟢 Online    3      2        1         0          7
```

Columns:
- **Member**: avatar + name + online presence indicator (from M7).
- **Status**: online/offline presence.
- **Working**: tasks currently `in_progress`.
- **Todo**: tasks in `todo` or `backlog`.
- **Overdue**: tasks past due date and not done.
- **Blocked**: tasks with `blocked` status.
- **Done (wk)**: tasks completed this week.

Clicking a member's row opens a filtered view of all their tasks.

### 5.4 Overdue & Blocked Section

Two priority sections at the top of the manager dashboard:

**OVERDUE (14)**
```
● API Documentation        Aditya      Due Aug 10    [View task]
● Client Proposal          Rahul       Due Aug 11    [View task]
● Deployment Config        Aman        Due Aug 12    [View task]
...
```

**BLOCKED (8)**
```
● Backend Deployment       Priya       Blocked by: Database Migration    [View task]
● Frontend Build           Neha        Reason: Waiting for API keys       [View task]
...
```

Cap display at 10 items per section with "View all overdue / View all blocked" links.

### 5.5 Project Status Board

A grid of project cards, each showing:

```
[Project Name]        [Status: Active / On Hold / At Risk]
12 tasks  •  3 overdue  •  Due: Aug 30

Progress: ████████░░  80%

Members: [avatars]
```

"At Risk" status is calculated: if the project has more than N overdue tasks (configurable; default: 3) relative to its total task count, it is flagged as "At Risk." This is a simple heuristic, not a complex algorithm.

### 5.6 "What Needs My Attention" — Manager Action Items

A prioritized list of items requiring manager action:

```
NEEDS ATTENTION

⚠ 3 tasks overdue for more than 3 days
⚠ Aman has 8 in-progress tasks (high load)
⚠ Backend Deployment blocked for 5+ days
⚠ API Documentation — no assignee
⚠ Project "Mobile App" is past its due date
```

This is a deterministic calculation, not AI. Generate it server-side from a set of fixed rules:
- Tasks overdue for more than 3 days.
- Team members with more than 7 active tasks (high load).
- Blocked tasks older than 3 days.
- Tasks with no assignee approaching their due date.
- Projects past their dueDate with incomplete tasks.

### 5.7 Filtering and Scoping

The manager dashboard must be scoped to:
- A specific team (selector at top).
- A specific project (selector at top, optional — default is all team projects).
- A date range for the "Done this week" column (default: current week).

## 6. Data Model

No new models. This milestone is entirely aggregation-based — it queries existing collections.

The following database queries drive the dashboard:

```javascript
// Overview counts
const overdueTasks = await Task.countDocuments({
  project: { $in: teamProjectIds },
  dueDate: { $lt: now },
  status: { $nin: ['done'] }
});

// Member workload
const memberWorkload = await Task.aggregate([
  { $match: { project: { $in: teamProjectIds } } },
  { $group: {
    _id: '$assignee',
    working: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
    todo: { $sum: { $cond: [{ $in: ['$status', ['todo', 'backlog']] }, 1, 0] } },
    overdue: { $sum: { $cond: [{
      $and: [{ $lt: ['$dueDate', now] }, { $ne: ['$status', 'done'] }]
    }, 1, 0] } },
    blocked: { $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] } }
  }}
]);
```

Index requirements (verify from M5/M4):
- `Task.index({ project: 1, assignee: 1, status: 1 })` — add if not present.
- `Task.index({ project: 1, dueDate: 1, status: 1 })` — add if not present.
- `Task.index({ project: 1, status: 1 })` — add if not present.

## 7. Backend Requirements

### 7.1 Team Dashboard API

```
GET /api/teams/:teamId/dashboard

Query params:
  projectId: string (optional, filter to specific project)
  startDate: ISO date (default: start of current week)
  endDate: ISO date (default: today)

Response:
{
  overview: {
    memberCount: Number,
    activeTasks: Number,
    overdueTasks: Number,
    dueTodayTasks: Number,
    completedThisWeek: Number,
    blockedTasks: Number
  },
  memberWorkload: [
    {
      user: { id, name, avatar },
      presence: 'online' | 'offline',
      working: Number,
      todo: Number,
      overdue: Number,
      blocked: Number,
      completedThisWeek: Number
    }
  ],
  overdueTasks: [Task with assignee populated],
  blockedTasks: [Task with assignee and blockers populated],
  projects: [
    {
      project: Project,
      taskCount: Number,
      completedCount: Number,
      overdueCount: Number,
      progress: Number,   // percentage
      status: 'active' | 'on_hold' | 'at_risk'
    }
  ],
  attentionItems: [
    { type: string, message: string, severity: 'warning' | 'critical', taskId?: string }
  ]
}
```

Authorization: only team managers and above can access the full dashboard. Members can access a limited view (own tasks only).

### 7.2 Team Calendar API

Extend the existing calendar API from M2:

```
GET /api/calendar?teamId={id}&startDate={}&endDate={}

// Add teamId as an optional query param.
// When teamId is present:
//   - Return tasks for all members of the team
//   - Return events where any team member is a participant
//   - Apply same date range filtering
```

Validate that the requesting user is a member of the teamId before returning team-scoped data.

### 7.3 Member task detail endpoint

```
GET /api/teams/:teamId/members/:userId/tasks

Query params: same as /api/tasks (filters, pagination, sort)
Authorization: manager or above.

Returns all tasks assigned to the specified user within the team's projects.
```

### 7.4 Attention items computation

Implement as a server-side function called within the dashboard API handler. No separate endpoint needed.

```javascript
async function computeAttentionItems(teamProjectIds, memberIds, now) {
  const items = [];

  // Rule 1: Tasks overdue by more than 3 days
  const longOverdue = await Task.find({ ... });
  if (longOverdue.length > 0) items.push({ type: 'long_overdue', ... });

  // Rule 2: Members with > 7 in-progress tasks (high load)
  // Rule 3: Blocked tasks older than 3 days
  // Rule 4: Tasks with no assignee due within 2 days
  // Rule 5: Projects past their dueDate

  return items;
}
```

### 7.5 Performance considerations

The dashboard query must be efficient. Requirements:
- Use aggregation pipelines, not N+1 queries.
- Cache dashboard data for 5 minutes (use a simple `Map` with TTL if Redis is not available).
- The dashboard should load in under 500ms for a team of up to 50 members.
- Document any queries that might be slow on large datasets.

## 8. WebSocket Requirements

The dashboard does not need its own real-time events. It benefits from existing events:
- `TASK_STATUS_CHANGED` → trigger a dashboard data refresh on the client (soft refresh: refetch the dashboard API, not a page reload).
- `TASK_ASSIGNED` → same.
- `TASK_DELETED` → same.

Implement a client-side strategy: when any task event is received while the dashboard is open, debounce a re-fetch of the dashboard API (wait 2 seconds, then re-fetch).

**Do not create real-time streaming of dashboard metrics** — periodic re-fetch is sufficient and far simpler.

## 9. Frontend Requirements

### 9.1 Dashboard page

Route: `/teams/:teamId/dashboard` (or follow existing route convention).

Navigation: add "Dashboard" to the team navigation sidebar.

Page layout:
```
[Team Selector]  [Project Filter]  [Date Range]

[Overview Metrics Bar]

[What Needs Attention]       [Project Status Board]

[Member Workload Table]

[Overdue Tasks]   [Blocked Tasks]
```

### 9.2 Overview metrics bar

Six metric cards in a row:
```
[12 Members] [87 Active] [14 Overdue] [23 Due Today] [31 Done/wk] [8 Blocked]
```
Each is clickable and navigates to a filtered task list.

### 9.3 Member workload table

Interactive table:
- Sortable by column (click column header).
- Clicking a member row opens a slide-over panel or navigates to their task list.
- Presence indicator (green dot = online from M7 presence data).
- Cells with high numbers (overdue > 0, blocked > 0) highlighted in warning color.

### 9.4 Team Calendar component

Reuse the Calendar component from M2. Add:
- Member color coding (each member's tasks/events in their assigned color).
- Member filter checkboxes (toggle members on/off).
- Team-scope API call instead of personal-scope.

### 9.5 Loading and empty states

- Dashboard: skeleton cards while loading.
- Empty team (no tasks): show onboarding prompt.
- All overdue = 0, blocked = 0: show a positive "All caught up!" state.

## 10. UX Requirements

- The dashboard must answer "what needs my attention right now" within 3 seconds of opening.
- Numbers must be immediately interpretable — no unlabeled metrics.
- The attention items section must be prominent (top of page or prominent sidebar).
- Overdue and blocked items must be visually urgent without being alarmist.
- The workload table must show immediately who is overloaded and who has capacity.
- Do NOT show any "productivity score" or ranking of team members.
- The calendar and task list views must feel consistent with the personal views from M2/M3.

## 11. Edge Cases

- Team with no tasks: show empty states for all sections.
- Team member with no tasks: show zeros in workload table (not an error).
- Project past due date with all tasks completed: should NOT be flagged as "at risk."
- Dashboard accessed by a non-manager: show personal-scope view only (own tasks, own calendar).
- Dashboard with more than 50 members: paginate the workload table.
- Long team names: truncate in member table.
- Member removed from team while manager is viewing dashboard: their row disappears on next refresh.

## 12. Security

- Only team managers and above can see the full team workload table.
- Members can see the overview metrics but not individual member breakdowns.
- The member task detail endpoint must verify the requesting user has manager role in the team.
- Dashboard data must be scoped to the team's projects — never leak tasks from other workspaces.

## 13. Migration / Backward Compatibility

No schema changes. Add the indexes specified in section 6 if not present. Verify existing task queries are unaffected.

## 14. Testing Checklist

**Backend:**
- [ ] GET /api/teams/:id/dashboard returns correct overview counts.
- [ ] Member workload aggregation is correct.
- [ ] Overdue task list is correct and scoped to team.
- [ ] Blocked task list is correct.
- [ ] Attention items are generated correctly.
- [ ] Project status "at risk" calculated correctly.
- [ ] Non-manager gets 403 on full dashboard.
- [ ] Team calendar returns tasks for all members.
- [ ] Team calendar does not include tasks from other teams.
- [ ] Dashboard loads in under 500ms (verify with timing).

**Frontend:**
- [ ] Overview metrics display correctly.
- [ ] Clicking a metric navigates to filtered task list.
- [ ] Member workload table sortable.
- [ ] Clicking a member opens their task list.
- [ ] Overdue and blocked sections show correct tasks.
- [ ] Attention items displayed.
- [ ] Team calendar shows color-coded member tasks.
- [ ] Member filter toggles work on team calendar.

## 15. Completion Criteria

- [ ] Manager dashboard page functional.
- [ ] Overview metrics correct and clickable.
- [ ] Member workload table functional with presence.
- [ ] Overdue and blocked sections functional.
- [ ] Attention items functional (all rules).
- [ ] Project status board functional.
- [ ] Team calendar functional (reuses M2 components).
- [ ] Performance: dashboard loads under 500ms.
- [ ] Authorization enforced (manager-only full view).
- [ ] Existing functionality unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Wait for instruction to proceed to Milestone 16.

---

# MILESTONE 16 — ANALYTICS & REPORTING

## 1. Objective

Provide meaningful operational reports that help teams understand their productivity trends, estimate more accurately, and identify systemic problems. Reports must present information honestly — the goal is insight, not a performance grading system.

## 2. Existing Functionality to Reuse

- Task, Project, Team, TimeEntry models.
- Manager Dashboard aggregation patterns (M14).
- Authorization middleware.

## 3. Scope

- Project-level analytics (task completion, overdue trends, time tracking accuracy).
- Team-level analytics (throughput, completion rate, velocity over time).
- Individual task analytics (time spent vs. estimated, status change history).
- Exportable reports (CSV).
- Date range filtering for all reports.

## 4. Out of Scope

- AI-driven insights or predictions (M19-20).
- Financial reporting or billable hours.
- Real-time streaming analytics dashboards.
- External BI tool integrations (Tableau, Power BI).
- Per-person productivity rankings or scores.
- SLA tracking.

## 5. Functional Requirements

### 5.1 Project Analytics Page

Each project has an "Analytics" tab (placeholder was created in M5). Now populate it.

**Completion Overview:**
```
PROJECT: Authentication Service

Period: Last 30 days

Tasks Created:    47
Tasks Completed:  39
Completion Rate:  83%
Tasks Overdue:     6
Avg Completion:  2.4 days
```

**Status Distribution (pie or bar chart):**
```
Backlog:     5
Todo:        8
In Progress: 12
Review:      3
Blocked:     2
Done:        17
```

**Completion Trend (line chart):**
A line chart showing tasks completed per day/week over the selected date range. This helps teams see if velocity is improving or declining.

**Time Tracking Accuracy:**
```
Estimated: 247h total
Actual:    231h total
Variance:  -6.5% (under estimate)

By priority:
  Urgent:  actual 15% over estimate
  High:    actual 3% under estimate
  Medium:  actual 8% under estimate
  Low:     actual 22% under estimate
```

### 5.2 Team Analytics Page

Accessible from the manager dashboard.

**Team Throughput (line chart):**
Tasks completed per week over the last 12 weeks. Shows velocity trend.

**Completion Rate by Member:**
```
Member          Assigned   Completed   Rate

Aditya Kumar      45          39        87%
Rahul Singh       32          28        88%
Aman Gupta        51          38        75%
Priya Sharma      28          26        93%
```

This is factual — it shows completion rates, not productivity scores. Frame it as operational data, not a ranking.

**Overdue Trend:**
Bar chart of overdue task counts per week. If the trend is rising, it is a signal to investigate.

**Task Age:**
Average age (days since creation) of incomplete tasks. High task age suggests work is stalling.

### 5.3 Individual Task Analytics (task detail — Time tab enhancement)

Extend the Time tab from M15:

**Status History Timeline:**
```
Aug 10  Created by Rahul
Aug 10  Assigned to Aditya
Aug 11  Status: Todo → In Progress
Aug 12  Status: In Progress → Blocked (API credentials missing)
Aug 13  Status: Blocked → In Progress
Aug 14  Completed by Aditya
─────
Total: 4 days
```

This data comes from the Activity log (M9) — no new data storage required.

### 5.4 Date range filtering

All analytics views must support date range selection:
- Last 7 days.
- Last 30 days.
- Last 90 days.
- Custom range.

### 5.5 CSV Export

For every analytics view, provide a "Export CSV" button that downloads the underlying data as a CSV file. The CSV must be generated server-side and streamed to the client.

## 6. Data Model

No new models. Analytics are computed from Task, TimeEntry, and Activity collections using MongoDB aggregation pipelines.

**Additional indexes to add** (if not already present from M14):

```javascript
// For time-based analytics
TaskSchema.index({ project: 1, createdAt: 1 });
TaskSchema.index({ project: 1, status: 1, updatedAt: 1 });
ActivitySchema.index({ task: 1, action: 1, createdAt: 1 });
TimeEntrySchema.index({ project: 1, user: 1, createdAt: 1 });
```

## 7. Backend Requirements

### 7.1 Project analytics endpoint

```
GET /api/projects/:id/analytics

Query params:
  startDate: ISO date (default: 30 days ago)
  endDate: ISO date (default: today)

Response:
{
  period: { startDate, endDate },
  overview: {
    created: Number,
    completed: Number,
    completionRate: Number,   // percentage
    overdue: Number,
    avgCompletionDays: Number
  },
  statusDistribution: {
    backlog: Number,
    todo: Number,
    in_progress: Number,
    review: Number,
    blocked: Number,
    done: Number
  },
  completionTrend: [
    { date: 'YYYY-MM-DD', completed: Number }
  ],
  timeTracking: {
    totalEstimated: Number,   // hours
    totalActual: Number,      // hours
    variancePercent: Number,
    byPriority: { low: {...}, medium: {...}, high: {...}, urgent: {...} }
  }
}
```

### 7.2 Team analytics endpoint

```
GET /api/teams/:id/analytics

Query params:
  startDate: ISO date
  endDate: ISO date
  projectId: string (optional, scope to project)

Response:
{
  throughput: [{ week: 'YYYY-WW', completed: Number }],
  completionByMember: [
    { user: { id, name, avatar }, assigned: Number, completed: Number, rate: Number }
  ],
  overdueTrend: [{ week: 'YYYY-WW', overdue: Number }],
  avgTaskAgeDays: Number
}
```

### 7.3 CSV export endpoint

```
GET /api/projects/:id/analytics/export?format=csv&startDate=...&endDate=...
GET /api/teams/:id/analytics/export?format=csv&startDate=...&endDate=...

Response: text/csv with Content-Disposition: attachment
```

The CSV should include raw task data (title, assignee, status, created date, completed date, estimated hours, actual hours).

### 7.4 Performance requirements

Analytics queries on large datasets can be slow. Requirements:
- Cache analytics responses for 10 minutes (use in-memory Map or Redis if available).
- Cache key: `analytics:{entityType}:{entityId}:{startDate}:{endDate}`.
- Invalidate cache when a task in the project/team is created, updated, or completed.
- All aggregation queries must use the indexes defined in section 6.
- Document any queries that may take more than 1 second on large datasets.

### 7.5 Aggregation pipeline patterns

Completion trend example:
```javascript
const completionTrend = await Task.aggregate([
  {
    $match: {
      project: projectObjectId,
      status: 'done',
      updatedAt: { $gte: startDate, $lte: endDate }
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
      completed: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
]);
```

## 8. WebSocket Requirements

None. Analytics are read-only and cached. They do not need real-time updates.

## 9. Frontend Requirements

### 9.1 Project Analytics tab

A tab in the project page (alongside Overview, Tasks, Board, Members).

Sections:
1. Overview metrics cards (4 numbers).
2. Status distribution — horizontal bar chart.
3. Completion trend — line chart.
4. Time tracking accuracy — table or bar chart.

### 9.2 Team Analytics page

A new page accessible from the team navigation.

Sections:
1. Team throughput — line chart.
2. Completion by member — table.
3. Overdue trend — bar chart.
4. Average task age — single metric card.

### 9.3 Charts implementation

**Do not add a heavy charting library if one already exists in the project.** Inspect existing dependencies first.

If no charting library exists, add one of: Recharts, Chart.js, or Nivo — whichever is lightest and appropriate for the existing tech stack. Use only one.

All charts must:
- Have a labeled X axis and Y axis.
- Have a legend where applicable.
- Handle empty data gracefully (show empty state, not a broken chart).
- Respond to date range filter changes.

### 9.4 Date range filter

A date range picker at the top of every analytics page. Applying a new range re-fetches the data.

### 9.5 Export button

A "Export CSV" button on each analytics page. Triggers the CSV endpoint and initiates a file download.

## 10. UX Requirements

- Analytics pages must load within 2 seconds for typical team sizes (up to 100 members, up to 1000 tasks).
- Show a loading spinner while data is fetching.
- Date range changes should feel fast (200ms debounce, then fetch).
- Charts must be readable without needing to hover — key numbers should be visible directly.
- The "completion by member" table should feel like operational data, not a scoreboard. Avoid percentages being the most prominent element — show the raw counts first.
- Export button should clearly indicate when a download is in progress.

## 11. Edge Cases

- Project with no completed tasks in the date range: show 0% completion rate (not an error).
- Project with no time tracking data: hide the time tracking section, do not show "N/A" everywhere.
- Team with a single member: analytics still work, member table has one row.
- Date range where start > end: reject with validation error.
- Very large date range (e.g., 1 year): allow but warn that loading may take longer.
- Project deleted mid-analytics: analytics endpoint returns 404 for deleted projects.

## 12. Security

- Project analytics: only project members can access.
- Team analytics: only team managers and above can access (members can see aggregate but not per-person breakdown).
- CSV export follows the same authorization rules as the analytics endpoint.
- Analytics endpoints must validate project/team membership before returning any data.

## 13. Migration / Backward Compatibility

No schema changes. Index additions are additive and non-destructive.

## 14. Testing Checklist

**Backend:**
- [ ] Project analytics returns correct overview counts.
- [ ] Completion trend data is correct.
- [ ] Status distribution sums to total task count.
- [ ] Time tracking variance calculated correctly.
- [ ] Team throughput data is correct.
- [ ] Completion by member is correct.
- [ ] CSV export downloads correctly with correct data.
- [ ] Non-member gets 403.
- [ ] Date range filtering works.
- [ ] Caching works (second request faster).

**Frontend:**
- [ ] Project analytics tab renders charts.
- [ ] Team analytics page renders charts.
- [ ] Date range filter changes data.
- [ ] Export button triggers download.
- [ ] Empty state shown for no-data ranges.
- [ ] Charts handle single data point gracefully.

## 15. Completion Criteria

- [ ] Project analytics page fully functional.
- [ ] Team analytics page fully functional.
- [ ] All charts render correctly.
- [ ] Date range filtering works.
- [ ] CSV export works.
- [ ] Caching implemented.
- [ ] Authorization enforced.
- [ ] Performance verified (under 2 seconds).
- [ ] Existing functionality unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
This is the end of Document 04. Report completion. Verify all existing functionality from Documents 01–04 still works. Wait for instruction to proceed to `05_INTEGRATIONS_AND_AI.md`.

---

*End of Document 04. Proceed to `05_INTEGRATIONS_AND_AI.md` when instructed.*
