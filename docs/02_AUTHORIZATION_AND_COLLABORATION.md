# 02 — AUTHORIZATION & REAL-TIME COLLABORATION

> **Dependencies:** `01_FOUNDATION_AND_CALENDAR.md` must be complete and verified.
> **Depends on:** Stable task model (M1/M4), Calendar (M2), My Day (M3), existing WebSocket infrastructure.
> **Read first:** `00_MASTER_INSTRUCTIONS.md`

---

## PRE-FLIGHT CHECK

Before modifying anything:

1. Confirm Document 01 milestones are complete:
   - [ ] Task model extended (M1).
   - [ ] Event and Reminder models exist (M1).
   - [ ] Calendar page functional (M2).
   - [ ] My Day page functional (M3).
   - [ ] Subtasks, priority, extended status working (M4).
2. Verify the existing WebSocket infrastructure is operational.
3. Inspect the existing member management system — you will extend it, not replace it.
4. Inspect the existing chat to avoid breaking it.
5. Run existing functionality tests: login, task CRUD, Kanban drag-drop, chat, WebSocket.

If any prerequisite is broken, stop and report.

---

## DO NOT MODIFY (unless this document explicitly requires it)

- Existing authentication routes and middleware.
- Existing JWT implementation.
- Existing WebSocket connection lifecycle.
- Existing chat messages and delivery.
- Existing task CRUD (extend only).
- Existing Kanban drag-and-drop.
- Existing login/signup flow.

---

# MILESTONE 5 — PROJECTS & TEAM WORKSPACES

## 1. Objective

Introduce the organizational hierarchy that separates this from a personal task tool into a team productivity platform. The hierarchy is: **Workspace → Team → Project → Tasks**. Projects provide a container for team tasks, a board, a calendar, and members.

## 2. Existing Functionality to Reuse

- Existing team/member data structures (inspect carefully — do not create duplicate member models).
- Existing task model (link tasks to projects).
- Existing user model.
- Existing socket infrastructure (rooms may be used per-project in M7).

## 3. Scope

- Workspace model (company/organization level).
- Team model (or extend existing team entity).
- Project model.
- Project membership.
- Project-scoped task lists and Kanban.
- Project overview page.

## 4. Out of Scope

- Roles and fine-grained permissions (M6).
- Project-level real-time events (M7).
- Project file storage (M12).
- Project analytics (M16).
- Project calendar integration with external calendars (M17).

## 5. Functional Requirements

### 5.1 Workspace

A workspace represents a company or organization. Every user belongs to at least one workspace (their personal workspace by default).

- On signup, a personal workspace is created for the user.
- Users can be invited to additional workspaces.
- All teams and projects belong to a workspace.
- Users can switch between workspaces.

### 5.2 Team

A team is a group of users within a workspace. Teams own projects.

- Inspect the existing team/member model. If a team entity already exists, extend it. If not, create it.
- A team has: name, description, workspace, members, avatar/color.
- A user can belong to multiple teams.

### 5.3 Project

A project belongs to a team (or directly to a workspace). It contains tasks, has members, and has a status.

```
Project:
  name
  description
  team
  workspace
  members (with roles: owner, admin, member)
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
  startDate
  dueDate
  color
  icon (optional)
  createdBy
  createdAt
  updatedAt
```

### 5.4 Project pages

Each project should have:
- **Overview**: description, dates, member list, recent activity (placeholder).
- **Tasks/Board**: Kanban board scoped to this project's tasks.
- **Members**: add/remove members.
- (Calendar, Files, Activity — placeholders for future milestones.)

### 5.5 Task → Project relationship

The `project` field was added to the Task model in M1. Now wire it up:
- Creating a task within a project context auto-sets the project field.
- Project board shows only tasks belonging to that project.
- Global task list can filter by project.

### 5.6 Member management

- Project owner can add members (by username or email).
- Project owner can remove members.
- Project members can view and create tasks within the project.
- Non-members cannot access the project (enforced in M6; add basic check now).

## 6. Data Model

### 6.1 Workspace Model (new)

```javascript
const WorkspaceSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '' },
  owner: { type: ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  avatar: { type: String, default: null },
  isPersonal: { type: Boolean, default: false }
}, { timestamps: true });

WorkspaceSchema.index({ 'members.user': 1 });
WorkspaceSchema.index({ slug: 1 });
```

### 6.2 Team Model (new or extended)

**Inspect the existing codebase first.** If a team model already exists, add only missing fields.

```javascript
const TeamSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  workspace: { type: ObjectId, ref: 'Workspace', required: true },
  members: [{
    user: { type: ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  color: { type: String, default: null },
  createdBy: { type: ObjectId, ref: 'User', required: true }
}, { timestamps: true });

TeamSchema.index({ workspace: 1 });
TeamSchema.index({ 'members.user': 1 });
```

### 6.3 Project Model (new)

```javascript
const ProjectSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '' },
  workspace: { type: ObjectId, ref: 'Workspace', required: true },
  team: { type: ObjectId, ref: 'Team', default: null },
  members: [{
    user: { type: ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed', 'archived'],
    default: 'active'
  },
  startDate: { type: Date, default: null },
  dueDate: { type: Date, default: null },
  color: { type: String, default: null },
  icon: { type: String, default: null },
  createdBy: { type: ObjectId, ref: 'User', required: true }
}, { timestamps: true });

ProjectSchema.index({ workspace: 1 });
ProjectSchema.index({ team: 1 });
ProjectSchema.index({ 'members.user': 1 });
```

## 7. Backend Requirements

### 7.1 Workspace API

```
POST   /api/workspaces                Create workspace
GET    /api/workspaces                List user's workspaces
GET    /api/workspaces/:id            Get workspace detail
PUT    /api/workspaces/:id            Update workspace
POST   /api/workspaces/:id/members    Add member
DELETE /api/workspaces/:id/members/:uid  Remove member
```

### 7.2 Team API

```
POST   /api/workspaces/:wid/teams           Create team
GET    /api/workspaces/:wid/teams           List teams
GET    /api/workspaces/:wid/teams/:id       Get team detail
PUT    /api/workspaces/:wid/teams/:id       Update team
DELETE /api/workspaces/:wid/teams/:id       Delete team
POST   /api/workspaces/:wid/teams/:id/members    Add member
DELETE /api/workspaces/:wid/teams/:id/members/:uid  Remove member
```

### 7.3 Project API

```
POST   /api/projects                  Create project
GET    /api/projects                  List user's projects
GET    /api/projects/:id              Get project detail
PUT    /api/projects/:id              Update project
DELETE /api/projects/:id              Archive project (soft delete preferred)
POST   /api/projects/:id/members      Add member
DELETE /api/projects/:id/members/:uid Remove member
GET    /api/projects/:id/tasks        Get project tasks (with filters)
```

### 7.4 Startup workspace creation

On user registration (extend existing signup route):
- Create a personal workspace for the new user.
- Add the user as owner.
- Set `isPersonal: true`.

## 8. WebSocket Requirements

No new WebSocket events in this milestone. Project-level real-time events come in M7.

## 9. Frontend Requirements

- Workspace switcher in top navigation (if user has multiple workspaces).
- Projects sidebar list (show user's projects).
- Project creation modal.
- Project overview page (name, description, members, dates, status).
- Project Kanban board (reuse existing Kanban, scoped to project tasks).
- Project members management page (add/remove).
- Task creation within project context (auto-sets project field).

## 10. UX Requirements

- Projects should be accessible from the main navigation sidebar.
- Creating a project should take < 3 clicks.
- Project member list should show user avatars and names.
- A project with no tasks should show a friendly empty state with "Add your first task" button.

## 11. Edge Cases

- Deleting a project that has tasks: soft-delete the project, archive its tasks or move them to workspace inbox.
- User removed from a project: they lose access immediately (enforce at API level).
- User who is team member but not project member: cannot access project (basic check here; full authorization in M6).
- Personal workspace: cannot be deleted or renamed to a blank string.

## 12. Security

- All project and workspace endpoints require authentication.
- User can only see workspaces they belong to.
- User can only see projects they are a member of (or that belong to their team).
- Only workspace owner/admin can create teams.
- Only project owner/admin can add/remove members.
- Validate all IDs against user membership before returning data.

## 13. Migration / Backward Compatibility

- Existing tasks that have no project association remain valid (project field is optional/null).
- Existing team/member relationships must be migrated into the new Team model if a team model already exists with a different schema. Document the migration plan before executing.
- On migration run: verify existing Kanban and task assignment still work.

## 14. Testing Checklist

**Backend:**
- [ ] Workspace created on signup.
- [ ] User can create additional workspaces.
- [ ] User can list their workspaces.
- [ ] User cannot see other users' private workspaces.
- [ ] Project CRUD works.
- [ ] Non-member cannot access project API.
- [ ] Member added to project can access project tasks.
- [ ] Project tasks filter works.

**Frontend:**
- [ ] Project appears in sidebar after creation.
- [ ] Project Kanban shows only project tasks.
- [ ] Adding member to project works.
- [ ] Removing member from project works.
- [ ] Workspace switcher works (if applicable).

## 15. Completion Criteria

- [ ] Workspace model and API functional.
- [ ] Team model and API functional (or existing model extended).
- [ ] Project model and API functional.
- [ ] Personal workspace created on signup.
- [ ] Project Kanban scoped correctly.
- [ ] Member management functional.
- [ ] Basic access control in place (member-only access).
- [ ] Existing task/auth/WebSocket/Kanban/chat unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Wait for instruction to proceed to Milestone 6.

---

# MILESTONE 6 — ROLES & AUTHORIZATION

## 1. Objective

Separate authentication (who is this user?) from authorization (what can they do?). Implement proper role-based access control enforced on the backend. Hidden UI buttons are not security — authorization must be enforced at the API level.

## 2. Existing Functionality to Reuse

- Existing JWT middleware (extract user from token).
- Workspace/Team/Project member roles added in M5.
- Existing auth middleware (extend it, don't replace it).

## 3. Scope

- Role definitions per workspace, team, and project.
- Authorization middleware.
- Server-side permission enforcement for all existing and new endpoints.
- Role management UI (assign/change roles).

## 4. Out of Scope

- Per-resource row-level security beyond ownership (keep it simple).
- Invite-by-link flow (email-only or username-only is sufficient for now).
- OAuth or SSO (M17+).
- Audit log for permission changes (M9 covers general activity logs).

## 5. Functional Requirements

### 5.1 Roles

Define roles at workspace, team, and project levels:

```
Owner    — Full control. Can delete workspace/team/project.
Admin    — Can manage members and settings. Cannot delete.
Manager  — Can assign tasks, manage project content.
Member   — Can create tasks, update own tasks.
Guest    — Read-only access to specific projects (future; implement as read-only member for now).
```

### 5.2 Permission matrix

| Action | Owner | Admin | Manager | Member |
|---|---|---|---|---|
| Delete workspace | ✅ | ❌ | ❌ | ❌ |
| Invite member (workspace) | ✅ | ✅ | ❌ | ❌ |
| Remove member (workspace) | ✅ | ✅ | ❌ | ❌ |
| Create project | ✅ | ✅ | ✅ | ❌ |
| Delete project | ✅ | ✅ | ❌ | ❌ |
| Create team | ✅ | ✅ | ❌ | ❌ |
| Assign task to another user | ✅ | ✅ | ✅ | ❌ |
| Edit any task in project | ✅ | ✅ | ✅ | ❌ |
| Edit own task | ✅ | ✅ | ✅ | ✅ |
| Create task | ✅ | ✅ | ✅ | ✅ |
| Delete any task | ✅ | ✅ | ✅ | ❌ |
| Delete own task | ✅ | ✅ | ✅ | ✅ |
| View project | ✅ | ✅ | ✅ | ✅ |
| Add project member | ✅ | ✅ | ✅ | ❌ |
| Change member role | ✅ | ✅ | ❌ | ❌ |

### 5.3 Authorization enforcement

Every API endpoint must:
1. Authenticate the user (JWT — already exists).
2. Determine the user's role in the relevant workspace/team/project.
3. Enforce the permission matrix above.
4. Return 403 if unauthorized.

**This must be enforced on the server, not just hidden in the UI.**

### 5.4 Role assignment

- On project creation: creator becomes `owner`.
- On workspace creation: creator becomes `owner`.
- When adding a member: default role is `member`.
- Owner/Admin can change member roles.
- Cannot remove the last owner.

## 6. Data Model

No new models. Roles are stored in the `members` arrays added in M5.

Add an authorization utility:

```javascript
// server/utils/authorize.js (or follow existing utility convention)

/**
 * Get user's role in a project/team/workspace.
 * Returns null if user is not a member.
 */
async function getUserRole(userId, entityType, entityId) { ... }

/**
 * Check if a user has permission to perform an action.
 * Throws 403 error if not permitted.
 */
async function requirePermission(userId, entityType, entityId, action) { ... }

// Role hierarchy: owner > admin > manager > member
const ROLE_HIERARCHY = { owner: 4, admin: 3, manager: 2, member: 1 };
```

## 7. Backend Requirements

### 7.1 Authorization middleware

Create reusable authorization middleware that can be applied to any route:

```javascript
// Usage example:
router.delete('/projects/:id',
  authenticate,          // existing JWT middleware
  requireProjectRole('admin'),   // new authorization middleware
  deleteProject
);
```

The middleware must:
- Extract the resource ID from params.
- Look up the user's role.
- Compare against the required role.
- Return 403 if insufficient.
- Call `next()` if sufficient.

### 7.2 Apply authorization to existing endpoints

Audit all existing endpoints and apply authorization:
- Task creation: any project member.
- Task deletion: owner/admin/manager or task creator.
- Task assignment: manager or above.
- Member management: admin or above.
- Project deletion: admin or above.

Document every endpoint and its required role.

### 7.3 Role management endpoint

```
PUT /api/projects/:id/members/:uid/role
Body: { role: 'admin' | 'manager' | 'member' }
Authorization: project owner or admin only.

PUT /api/workspaces/:id/members/:uid/role
Body: { role: 'admin' | 'member' }
Authorization: workspace owner or admin only.
```

## 8. WebSocket Requirements

No new WebSocket events in this milestone. Authorization is enforced at the HTTP API level.

## 9. Frontend Requirements

- Role badges on member lists (Owner, Admin, Manager, Member).
- Role selector when viewing a member (visible only to Owner/Admin).
- Hide UI action buttons for unauthorized actions (in addition to backend enforcement).
- When a 403 is returned, display a meaningful error ("You don't have permission to do that") rather than a generic error.

## 10. UX Requirements

- Permission errors should be informative: explain what permission is missing and who to contact.
- Role changes should take effect immediately without page refresh.
- The current user's role should be visible somewhere in the project/team page.

## 11. Edge Cases

- Trying to remove the last owner: reject with clear error.
- User changes their own role to a lower level: they immediately lose their elevated permissions.
- User removed from workspace: they lose access to all workspace teams and projects simultaneously.
- Guest role: treat as read-only member for now; document that full guest access is a future enhancement.

## 12. Security

- The permission matrix must be enforced server-side regardless of what the client sends.
- Role escalation: a Member cannot promote themselves to Admin. Only higher roles can elevate others.
- JWT must still be validated before any authorization check.
- Log unauthorized access attempts (at least in server logs).

## 13. Migration / Backward Compatibility

- Existing tasks and members should be assigned default roles:
  - Existing task creators: `member` role in their workspace.
  - Existing team owners (from M5): `owner` role.
  - Other existing members: `member` role.
- After migration, test that all existing operations still work for users with `member` role.

## 14. Testing Checklist

**Backend:**
- [ ] Owner can perform all actions.
- [ ] Admin can perform admin actions but not owner-only actions.
- [ ] Manager can assign tasks but not delete projects.
- [ ] Member can create/edit own tasks but not assign to others.
- [ ] Non-member returns 403 for all project endpoints.
- [ ] Cannot remove last owner.
- [ ] Role change takes effect immediately.
- [ ] Existing task CRUD still works for authorized users.

**Frontend:**
- [ ] Role badges visible on member lists.
- [ ] Unauthorized buttons hidden.
- [ ] 403 response shows meaningful error.
- [ ] Role change UI works for authorized users.

## 15. Completion Criteria

- [ ] Authorization middleware created.
- [ ] All existing endpoints protected with appropriate roles.
- [ ] New endpoints from M5 protected.
- [ ] Role management API functional.
- [ ] Role management UI functional.
- [ ] Permission matrix enforced server-side.
- [ ] 403 responses meaningful.
- [ ] Migration applied and existing operations verified.
- [ ] No working functionality broken.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Wait for instruction to proceed to Milestone 7.

---

# MILESTONE 7 — REAL-TIME COLLABORATION 2.0

## 1. Objective

Extend the existing WebSocket infrastructure to support real-time synchronization for the full team collaboration experience. Multiple users working simultaneously should see each other's changes without refreshing. The existing WebSocket infrastructure is the foundation — do not rebuild it.

## 2. Existing Functionality to Reuse

- Existing Socket.io server setup.
- Existing socket authentication mechanism.
- Existing socket event names and payloads (extend, do not break).
- Existing chat real-time delivery.

## 3. Scope

- Standardize all new WebSocket events with consistent naming and payloads.
- Add project-level and workspace-level rooms.
- Real-time task events (created, updated, assigned, status changed, deleted).
- Real-time project events.
- Real-time team member events.
- User presence (online/offline) per project.

## 4. Out of Scope

- Notification persistence (M8).
- Comment events (M9).
- Dependency update events (M10).
- AI-related events (M19-20).

## 5. Functional Requirements

### 5.1 Room structure

Inspect the existing room/namespace structure. Extend it to include:

```
Room: workspace:{workspaceId}     — workspace-wide events
Room: project:{projectId}         — project-specific events (tasks, members)
Room: user:{userId}               — personal events (notifications, assignments)
```

On socket connection, the authenticated user should be automatically joined to:
- Their `user:{userId}` room.
- All `project:{projectId}` rooms for their projects.
- Their workspace room.

### 5.2 Event naming convention

Use consistent `NOUN_VERB` uppercase naming. Inspect existing event names and extend consistently.

### 5.3 Core real-time events

**Task events:**

```
TASK_CREATED
  payload: { task, projectId, workspaceId }
  recipients: all project members

TASK_UPDATED
  payload: { task, changedFields, projectId }
  recipients: all project members

TASK_ASSIGNED
  payload: { task, assignedTo, assignedBy, projectId }
  recipients: all project members + assignee's user room

TASK_STATUS_CHANGED
  payload: { taskId, oldStatus, newStatus, changedBy, projectId }
  recipients: all project members

TASK_DELETED
  payload: { taskId, projectId }
  recipients: all project members

TASK_DUE_DATE_CHANGED
  payload: { taskId, oldDueDate, newDueDate, changedBy, projectId }
  recipients: all project members
```

**Project events:**

```
PROJECT_UPDATED
  payload: { project, changedFields }
  recipients: all project members

TEAM_MEMBER_ADDED
  payload: { user, projectId, addedBy }
  recipients: all project members

TEAM_MEMBER_REMOVED
  payload: { userId, projectId, removedBy }
  recipients: all project members (including removed user)
```

**Presence events:**

```
USER_ONLINE
  payload: { userId, projectId }
  recipients: project members

USER_OFFLINE
  payload: { userId, projectId }
  recipients: project members
```

### 5.4 Persistence-first rule

For every event above:
1. REST API call received.
2. Database updated.
3. API response sent to caller.
4. WebSocket event emitted to relevant rooms.
5. Connected clients update their local state.

**Never emit a WebSocket event before the database write succeeds.**

### 5.5 Offline behavior

If a user disconnects and reconnects:
- They rejoin their rooms automatically.
- They re-fetch the current state (full GET request) — do not replay missed events.
- Missed events that affect them will appear as database state on re-fetch.

## 6. Data Model

No new models. Presence state may be stored in-memory (Redis if available; otherwise a Map on the server). Do not persist presence to the database.

## 7. Backend Requirements

### 7.1 Socket event emitter utility

Create a utility that can be called from any controller:

```javascript
// server/utils/socketEmitter.js (follow existing file naming)

function emitToProject(projectId, event, payload) {
  io.to(`project:${projectId}`).emit(event, payload);
}

function emitToUser(userId, event, payload) {
  io.to(`user:${userId}`).emit(event, payload);
}

function emitToWorkspace(workspaceId, event, payload) {
  io.to(`workspace:${workspaceId}`).emit(event, payload);
}
```

### 7.2 Integrate events into existing controllers

For every task mutation (create, update, delete, assign, status change):
- After successful database write, call the appropriate emitter.
- Pass the full task object (or just the changed fields — be consistent).

For project mutations:
- After successful database write, emit project events.

### 7.3 Room management on connection

In the existing socket connection handler:
- On authenticated connection: join user to `user:{userId}`, all their `project:{projectId}` rooms, and their `workspace:{workspaceId}` rooms.
- On disconnect: leave rooms (Socket.io handles this automatically, but update presence state).

### 7.4 Presence tracking

On connection: mark user as online in the relevant project rooms. Emit `USER_ONLINE`.
On disconnect: mark user as offline. Emit `USER_OFFLINE`.
Store presence in server memory (Map or Redis if available). TTL: clear after 5 minutes of disconnection.

## 8. WebSocket Requirements (Summary)

All events listed in section 5.3 must be emitted correctly. Verify that existing chat events are not broken.

## 9. Frontend Requirements

### 9.1 Global socket manager

The existing socket connection manager must be extended to:
- Listen for all new events.
- Dispatch updates to the relevant store (Redux/Zustand/Context).

### 9.2 Event handlers

For each event, update the relevant UI state:
- `TASK_CREATED`: add task to the project's task list.
- `TASK_UPDATED`: update the task in place.
- `TASK_STATUS_CHANGED`: move task to correct Kanban column.
- `TASK_DELETED`: remove task from list.
- `TASK_ASSIGNED`: if current user is the assignee, add task to their My Day / task list.
- `TEAM_MEMBER_ADDED/REMOVED`: update project member list.
- `USER_ONLINE/OFFLINE`: update presence indicators.

### 9.3 Presence indicators

Show user presence (online/offline) on:
- Project member list.
- Task assignee avatars.

Use a green dot for online, gray for offline. Do not show last-seen time for now.

### 9.4 Conflict handling

If the user is editing a task and receives a `TASK_UPDATED` event for the same task:
- Show a banner: "This task was updated by [user]. Refresh to see changes."
- Do not silently overwrite the user's in-progress edits.

## 10. UX Requirements

- Real-time updates should appear smoothly, not with jarring re-renders.
- Task cards that receive an update should briefly highlight (subtle flash or border).
- Presence indicators should update within 5 seconds of a user connecting or disconnecting.
- Connection status: show an indicator if the WebSocket connection is lost ("Reconnecting...").

## 11. Edge Cases

- User with multiple browser tabs: each tab opens a socket connection; both should receive events.
- User removed from project while connected: they should stop receiving project events immediately.
- Large number of simultaneous users: room-based broadcasting scales well in Socket.io; document if any bottlenecks are identified.
- Event arrives after the relevant item was deleted on the client: ignore gracefully.
- Server restart: all clients reconnect and re-fetch state.

## 12. Security

- Socket connections must be authenticated (inspect existing mechanism; verify it still applies).
- A user must only be joined to rooms they have access to.
- Re-validate room membership when re-joining on reconnect.
- Never trust the client to determine which room to join; derive room membership from the database.

## 13. Migration / Backward Compatibility

- Existing chat events must not be broken.
- If existing event names conflict with the new convention, create a compatibility alias but document the technical debt.
- Test existing chat in two browsers after implementing new events.

## 14. Testing Checklist

**Real-time:**
- [ ] Open two browsers as two different project members.
- [ ] User A creates a task → User B sees it appear without refresh.
- [ ] User A changes task status → User B sees card move on Kanban without refresh.
- [ ] User A assigns task to User B → User B sees it appear in their task list.
- [ ] User A deletes a task → User B sees it disappear.
- [ ] User A goes offline → User B sees presence indicator change.
- [ ] Chat still works (existing functionality not broken).

**Security:**
- [ ] User C (non-member) does not receive project events.
- [ ] Unauthenticated socket connection rejected.

## 15. Completion Criteria

- [ ] Room structure implemented (workspace, project, user).
- [ ] All core task events emitted and received.
- [ ] All project events emitted and received.
- [ ] Presence system working.
- [ ] Frontend handlers update UI without refresh.
- [ ] Conflict warning shown for in-progress edits.
- [ ] Existing chat unaffected.
- [ ] Two-browser test passes for all core events.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Wait for instruction to proceed to Milestone 8.

---

# MILESTONE 8 — NOTIFICATION SYSTEM

## 1. Objective

Create a centralized, persistent notification system that ensures users never miss important events — task assignments, mentions, deadlines, and team changes. Notifications are generated by the server, persisted to the database, and delivered via WebSocket. They are not just in-memory events.

## 2. Existing Functionality to Reuse

- WebSocket infrastructure and user rooms from M7 (`user:{userId}`).
- Existing socket emitter utility (M7).
- Task, Event, Project models.
- JWT user context.

## 3. Scope

- Notification model.
- Server-side notification generation on key events.
- WebSocket delivery of new notifications.
- Notification inbox UI.
- Mark as read / mark all as read.
- Notification count badge.

## 4. Out of Scope

- Email notifications (M17).
- Push notifications (not planned).
- Notification preferences granular UI (implement a simple toggle now; detailed preferences later).
- Comment notifications (M9 will trigger these; the infrastructure from this milestone will be used).

## 5. Functional Requirements

### 5.1 Notification types

```
TASK_ASSIGNED          — A task was assigned to you
TASK_DEADLINE_SOON     — A task due in 24 hours
TASK_OVERDUE           — A task is now overdue
TASK_COMPLETED         — A task you care about was completed
MENTION                — You were mentioned in a comment (M9 will use this)
COMMENT_ADDED          — Comment added to your task (M9 will use this)
PROJECT_UPDATED        — Project you're in was updated
TEAM_MEMBER_ADDED      — Someone was added to your team
TEAM_MEMBER_REMOVED    — Someone was removed from your team
DEADLINE_CHANGED       — A task deadline was changed
```

### 5.2 Notification model

```javascript
const NotificationSchema = new Schema({
  recipient: { type: ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [/* all types above */],
    required: true
  },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  // Link to the relevant entity
  entityType: { type: String, enum: ['task', 'project', 'team', 'comment', 'event'] },
  entityId: { type: ObjectId },
  // Who triggered the notification
  actor: { type: ObjectId, ref: 'User', default: null },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null }
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });
```

### 5.3 Notification generation

Server-side service that creates notifications:

```javascript
// server/services/notificationService.js

async function createNotification({ recipient, type, title, body, entityType, entityId, actor }) {
  // 1. Persist notification to database
  // 2. Emit NOTIFICATION_CREATED via WebSocket to recipient's user room
}
```

Call this service from the relevant controllers:
- Task assignment → `TASK_ASSIGNED` notification to assignee.
- Task deadline approaching (scheduled job or checked at task update) → `TASK_DEADLINE_SOON`.
- Project member added → `TEAM_MEMBER_ADDED` to new member.
- Due date changed → `DEADLINE_CHANGED` to assignee.

### 5.4 Deadline approaching job

Create a background job (simple `setInterval` or cron) that runs hourly:
- Find all tasks with dueDate within the next 24 hours.
- Find which have not already received a `TASK_DEADLINE_SOON` notification.
- Create the notification.

Use a simple deduplication strategy: check if a `TASK_DEADLINE_SOON` notification for that taskId already exists in the last 25 hours before creating a new one.

### 5.5 Notification API

```
GET    /api/notifications           List notifications (paginated, most recent first)
PATCH  /api/notifications/:id/read  Mark single notification as read
PATCH  /api/notifications/read-all  Mark all as read
DELETE /api/notifications/:id       Delete notification

Query params for GET:
  unreadOnly: boolean
  page: number
  limit: number (default 20)
```

### 5.6 WebSocket delivery

```
NOTIFICATION_CREATED
  payload: { notification }
  recipients: notification.recipient's user room
```

The client receives this event and:
1. Adds the notification to the notification store.
2. Increments the unread count badge.
3. Shows a brief toast notification (optional).

## 6. Data Model

Notification model as defined in section 5.2.

## 7. Backend Requirements

As described in sections 5.3–5.5. Additionally:
- Pagination must be implemented for GET /api/notifications.
- Notifications must be user-scoped: a user can only see their own notifications.
- Bulk mark-as-read must be efficient (use `updateMany` not a loop).

## 8. WebSocket Requirements

- `NOTIFICATION_CREATED`: emit to `user:{recipientId}` room after persisting to DB.
- The notification object in the payload should be fully populated (actor name/avatar, entity title).

## 9. Frontend Requirements

### 9.1 Notification bell

In the top navigation bar:
- A bell icon.
- An unread count badge (number or dot).
- Clicking opens the notification dropdown/panel.

### 9.2 Notification panel

- List of recent notifications (paginated).
- Each notification shows: icon (type), actor name, message body, time ago, read/unread state.
- Clicking a notification marks it as read and navigates to the relevant entity.
- "Mark all as read" button.
- "View all notifications" link (optional full-page).

### 9.3 Toast notifications

When a `NOTIFICATION_CREATED` socket event is received, show a brief toast (3–5 seconds) with the notification title and a link to the entity. Dismiss on click.

## 10. UX Requirements

- The unread count should update in real-time as notifications arrive.
- Notifications should be time-relative: "2 minutes ago", "3 hours ago", "Yesterday".
- Read notifications should be visually distinct from unread (lighter background, no bold).
- The notification panel should load quickly (< 300ms) — it is a common action.

## 11. Edge Cases

- User with 0 notifications: show empty state ("No notifications yet").
- Notification for a deleted task: show the notification anyway (entity may not load, but notification should not error).
- Duplicate deadline notifications: deduplication logic must work correctly.
- User offline when notification created: notification is in the database; they see it on next login.
- Very large notification list: pagination must work correctly.

## 12. Security

- User can only read/update/delete their own notifications.
- Notification creation is server-side only — no client endpoint to create arbitrary notifications.
- The actor field must be set server-side, not from client payload.

## 13. Migration / Backward Compatibility

No existing notification system to migrate (M0 audit confirmed none). Ensure existing task assignment behavior is not changed — just add the notification creation call after the existing assignment logic.

## 14. Testing Checklist

**Backend:**
- [ ] Task assignment creates TASK_ASSIGNED notification for assignee.
- [ ] GET /api/notifications returns only current user's notifications.
- [ ] Pagination works correctly.
- [ ] Mark as read works.
- [ ] Mark all as read works.
- [ ] Unread count is correct after mark-as-read.
- [ ] Deadline job creates notifications for due-soon tasks.
- [ ] Deduplication prevents duplicate deadline notifications.

**Frontend:**
- [ ] Bell shows unread count.
- [ ] Notification panel opens and shows notifications.
- [ ] New notification arrives via WebSocket without refresh.
- [ ] Toast shown for new notification.
- [ ] Mark as read works.
- [ ] Clicking notification navigates to correct entity.

## 15. Completion Criteria

- [ ] Notification model and API functional.
- [ ] Notification creation service integrated into task assignment.
- [ ] Deadline approaching job running.
- [ ] WebSocket delivery working.
- [ ] Notification bell and panel functional.
- [ ] Toast notifications working.
- [ ] Read/unread state working.
- [ ] Pagination working.
- [ ] Deduplication working.
- [ ] Existing functionality unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Wait for instruction to proceed to Milestone 9.

---

# MILESTONE 9 — COMMENTS, MENTIONS & ACTIVITY

## 1. Objective

Keep project discussion attached to the work. Every task should have a comment thread and an activity log. Mentions create notifications. The activity log provides a non-chat audit trail of task changes.

## 2. Existing Functionality to Reuse

- Existing task model.
- Notification service from M8 (mentions trigger MENTION notifications).
- WebSocket emitter utility from M7.
- Existing user model (for mention resolution).

## 3. Scope

- Comment model and API.
- Mention parsing and notification.
- Activity log model and recording.
- Task detail view updates (comments and activity tabs).
- Real-time comment delivery.

## 4. Out of Scope

- File attachments in comments (M12).
- Comment reactions/emoji (not planned).
- Comment editing history (keep simple: edit is allowed, history is not tracked).
- Global search over comments (M13).

## 5. Functional Requirements

### 5.1 Comments

- Any project member can comment on a task they have access to.
- Comments are displayed in reverse chronological order (newest at bottom — typical thread style).
- Comments can be edited by their author.
- Comments can be deleted by their author or a project admin.
- Comments support `@username` mentions.
- Comments support basic text formatting (bold, italic, code — if the existing UI already has a rich text editor; otherwise plain text is acceptable).

### 5.2 Mentions

When a user types `@username` in a comment:
- The mention is parsed server-side when the comment is saved.
- For each valid mention, create a `MENTION` notification (using the M8 notification service).
- Mentioned user also receives a `COMMENT_ADDED` WebSocket event.

### 5.3 Activity log

Record these events automatically on task changes:

```
[User] created this task
[User] assigned task to [Assignee]
[User] changed status: Todo → In Progress
[User] changed due date: Aug 14 → Aug 15
[User] changed priority: Medium → High
[User] added [User] to task
[User] removed [User] from task
[User] added subtask: [title]
[User] completed subtask: [title]
[User] uploaded [filename]   (M12)
[User] completed this task
[User] reopened this task
```

Activity log is append-only. It is never edited or deleted. It is an audit trail, not a chat.

### 5.4 Task detail view

The task detail view (built in M4) should now have two tabs below the main content:

```
[Comments] [Activity]
```

Comments tab: thread of comments with input box.
Activity tab: chronological list of activity log entries.

## 6. Data Model

### 6.1 Comment Model (new)

```javascript
const CommentSchema = new Schema({
  task: { type: ObjectId, ref: 'Task', required: true },
  author: { type: ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 10000 },
  mentions: [{ type: ObjectId, ref: 'User' }],
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null }
}, { timestamps: true });

CommentSchema.index({ task: 1, createdAt: 1 });
```

### 6.2 Activity Model (new)

```javascript
const ActivitySchema = new Schema({
  task: { type: ObjectId, ref: 'Task', required: true },
  actor: { type: ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    enum: [
      'created', 'assigned', 'unassigned', 'status_changed',
      'due_date_changed', 'priority_changed', 'member_added',
      'member_removed', 'subtask_added', 'subtask_completed',
      'completed', 'reopened', 'description_changed', 'title_changed',
      'attachment_added'  // for M12
    ],
    required: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
    // Examples:
    // status_changed: { from: 'todo', to: 'in_progress' }
    // assigned: { to: userId, toName: 'Rahul' }
    // due_date_changed: { from: Date, to: Date }
  }
}, { timestamps: true });

ActivitySchema.index({ task: 1, createdAt: 1 });
```

## 7. Backend Requirements

### 7.1 Comment API

```
POST   /api/tasks/:id/comments        Create comment
GET    /api/tasks/:id/comments        List comments (paginated)
PUT    /api/tasks/:id/comments/:cid   Edit comment
DELETE /api/tasks/:id/comments/:cid   Delete comment
```

On comment creation:
1. Validate user is project member.
2. Parse `@username` mentions.
3. Save comment.
4. Resolve valid mentions to user IDs.
5. Create MENTION notifications for mentioned users (via M8 notification service).
6. Emit `COMMENT_CREATED` socket event to project room.

### 7.2 Activity API

```
GET /api/tasks/:id/activity     List activity log (paginated, oldest first)
```

Activity is created server-side automatically — no POST endpoint needed.

### 7.3 Activity recording service

```javascript
// server/services/activityService.js

async function recordActivity(taskId, actorId, action, metadata) {
  await Activity.create({ task: taskId, actor: actorId, action, metadata });
}
```

Call this from every relevant controller (task create, task update, assignment, etc.).

### 7.4 Mention parsing

```javascript
// Simple implementation: parse @username from comment text
function parseMentions(content) {
  const matches = content.match(/@(\w+)/g) || [];
  return matches.map(m => m.slice(1));
}

// Then look up user IDs by username/handle
async function resolveMentions(usernames) {
  return await User.find({ username: { $in: usernames } }, '_id');
}
```

## 8. WebSocket Requirements

```
COMMENT_CREATED
  payload: { comment (with author populated), taskId, projectId }
  recipients: all project members

COMMENT_UPDATED
  payload: { comment, taskId, projectId }
  recipients: all project members

COMMENT_DELETED
  payload: { commentId, taskId, projectId }
  recipients: all project members
```

## 9. Frontend Requirements

### 9.1 Comments tab in task detail

- List of comment cards (avatar, name, time ago, content).
- Comment input box at bottom (text area with submit button).
- Mention autocomplete: when user types `@`, show a dropdown of project members.
- Edit button on own comments (inline editing).
- Delete button on own comments (or admin's delete).
- Loading state and pagination ("Load more comments").

### 9.2 Activity tab in task detail

- Chronological list of activity entries.
- Each entry: actor avatar, action description, time ago.
- Read-only. No interaction needed.
- Infinite scroll or "Load more" pagination.

### 9.3 Real-time comments

- New comments from other users appear in the thread without refresh.
- Comment count on task card increments in real-time.

## 10. UX Requirements

- Comments should feel like a lightweight discussion thread, not a full chat.
- Mentions should auto-complete as the user types `@`.
- Activity log should be clearly visually distinct from comments (different styling, read-only).
- Time display: "just now", "3 minutes ago", "2 hours ago", "Aug 12".

## 11. Edge Cases

- Mention of a user not in the project: parse it as text, do not create notification.
- Edit comment that contains a mention: re-parse mentions and update notification set if changed.
- Delete comment with mentions: existing notifications are not deleted (notifications are separate).
- Very long comment: enforce maxlength server-side.
- Comment on deleted task: prevent or handle gracefully.

## 12. Security

- Only project members can comment on project tasks.
- Only comment author can edit their comment.
- Comment author or project admin can delete a comment.
- Mention parser must not expose user data beyond the mention itself.
- Activity log is read-only — no modification endpoints.

## 13. Migration / Backward Compatibility

No existing comment or activity system to migrate. Ensure existing task endpoints still function — activity recording is additive.

## 14. Testing Checklist

**Backend:**
- [ ] Comment created and retrieved correctly.
- [ ] Mention parsing identifies mentioned users.
- [ ] Mention notification created for valid mentions.
- [ ] Mention of non-member is ignored.
- [ ] Comment edit works; `isEdited` flag set.
- [ ] Comment delete works.
- [ ] Activity recorded on task creation.
- [ ] Activity recorded on task assignment.
- [ ] Activity recorded on status change.
- [ ] Activity recorded on due date change.
- [ ] Non-member cannot comment on task (403).

**Frontend:**
- [ ] Comments tab shows existing comments.
- [ ] New comment appears after submission.
- [ ] Other users' comments appear in real-time.
- [ ] Mention autocomplete works.
- [ ] Activity tab shows log entries.
- [ ] Edit comment works.
- [ ] Delete comment works.

## 15. Completion Criteria

- [ ] Comment model, API, and UI functional.
- [ ] Activity model, recording, and UI functional.
- [ ] Mention parsing and notifications working.
- [ ] Real-time comment delivery working.
- [ ] Activity recorded for all key task events.
- [ ] Pagination working for both comments and activity.
- [ ] Existing functionality unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
This is the end of Document 02. Report completion. Verify all existing functionality from Documents 01 and 02 still works. Wait for instruction to proceed to `03_ADVANCED_TASK_MANAGEMENT.md`.

---

*End of Document 02. Proceed to `03_ADVANCED_TASK_MANAGEMENT.md` when instructed.*
