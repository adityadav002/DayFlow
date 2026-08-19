# 03 — ADVANCED TASK MANAGEMENT

> **Dependencies:** `01_FOUNDATION_AND_CALENDAR.md` and `02_AUTHORIZATION_AND_COLLABORATION.md` must be complete and verified.
> **Depends on:** Stable task model (M1/M4), Projects (M5), Authorization (M6), Notifications (M8), Activity logging (M9).
> **Read first:** `00_MASTER_INSTRUCTIONS.md`

---

## PRE-FLIGHT CHECK

Before modifying anything:

1. Confirm Documents 01 and 02 are complete:
   - [ ] Task model with priority, context, subtasks functional.
   - [ ] Projects, teams, workspaces functional.
   - [ ] Authorization enforced.
   - [ ] Real-time WebSocket events working.
   - [ ] Notifications working.
   - [ ] Comments and activity log working.
2. Inspect the Task model's current state — many fields added across M1 and M4 will be built upon here.
3. Verify file storage infrastructure (local disk or cloud) before starting M12.
4. Run full regression: login, task CRUD, Kanban, chat, notifications, comments, real-time sync.

If any prerequisite is broken, stop and report.

---

## DO NOT MODIFY

- Existing authentication and JWT.
- Existing WebSocket connection lifecycle.
- Existing task CRUD beyond what is explicitly required.
- Existing comment system (M9).
- Existing notification service (M8) — extend it.
- Existing Kanban drag-and-drop.

---

# MILESTONE 10 — TASK DEPENDENCIES & BLOCKED WORK

## 1. Objective

Allow users to express real project dependencies — "Task B cannot start until Task A is done." Track and visually communicate blocked tasks so that nothing is forgotten and team members understand why work is stalled.

## 2. Existing Functionality to Reuse

- Task model (add dependency fields).
- Activity service (record dependency changes).
- Notification service (notify assignees when their blocker is resolved).
- Authorization middleware (only project members can add dependencies).

## 3. Scope

- Task dependency model.
- Dependency API (add/remove dependency).
- Blocked status (already in status enum from M4).
- Blocked reason field on task.
- Dependency visualization on task detail view.
- Notification when a blocking task is completed.

## 4. Out of Scope

- Gantt chart visualization (not planned for this milestone).
- Multi-predecessor/complex dependency graphs in the UI (show linked list; full graph is a later enhancement).
- Automatic status change when blocker is resolved (notify, but do not auto-change status — user confirms).
- Critical path calculation (M16 or later).

## 5. Functional Requirements

### 5.1 Dependency types

For this milestone, support one relationship type:

```
"Task B is blocked by Task A"
(Task A must be completed before Task B can proceed)
```

A task can:
- Be blocked by multiple tasks (multiple blockers).
- Block multiple tasks (multiple dependents).

### 5.2 Blocked status

The `blocked` status (added in M4) now has meaning:
- A task can be manually marked as blocked at any time with a reason.
- Additionally, if all of a task's blockers are incomplete, the system can suggest the blocked status (but does not force it).

### 5.3 Blocked reason

A task can have a free-text blocked reason:

```
BLOCKED
Reason: "Waiting for API credentials from the client."
```

This is separate from task dependencies — it explains WHY the task is blocked (even if no dependency is linked).

### 5.4 Dependency workflow

```
Manager creates Task A (Database Migration)
Manager creates Task B (Backend Deployment)
Manager adds dependency: B is blocked by A
→ Task B shows: "Blocked by: Database Migration"

User completes Task A
→ Notification sent to Task B's assignee: "Database Migration is complete. Backend Deployment is unblocked."
→ Task B's blocked indicator clears (if it was auto-blocked) OR user is prompted to update status.
```

### 5.5 Circular dependency prevention

Before saving a dependency, validate there is no circular chain:
- A → B → A: reject.
- A → B → C → A: reject.

### 5.6 Display on task card and detail view

**Task card (Kanban):**
- Show a small "blocked" icon if task has unresolved blockers.
- Show count of blocking tasks.

**Task detail view:**
- "Blocked by" section: list of blocking tasks with their status and a link to each.
- "Blocking" section: list of tasks that this task is blocking.
- Blocked reason text field (editable by assignee and project admins).
- "Add dependency" control (search for a task within the same project).

## 6. Data Model

### 6.1 TaskDependency Model (new)

```javascript
const TaskDependencySchema = new Schema({
  blockedTask: { type: ObjectId, ref: 'Task', required: true },  // the task that is blocked
  blockingTask: { type: ObjectId, ref: 'Task', required: true },  // the task that must be completed first
  createdBy: { type: ObjectId, ref: 'User', required: true },
  project: { type: ObjectId, ref: 'Project', required: true }
}, { timestamps: true });

TaskDependencySchema.index({ blockedTask: 1 });
TaskDependencySchema.index({ blockingTask: 1 });
TaskDependencySchema.unique(['blockedTask', 'blockingTask']);
```

### 6.2 Task Model additions

```javascript
// Add to existing Task model:
blockedReason: { type: String, default: '' },
hasBlockers: { type: Boolean, default: false }  // denormalized for quick queries
```

## 7. Backend Requirements

### 7.1 Dependency API

```
POST   /api/tasks/:id/dependencies
Body: { blockingTaskId: string }
Creates: "task :id is blocked by blockingTaskId"
Authorization: project manager or above.

DELETE /api/tasks/:id/dependencies/:depId
Removes a dependency.
Authorization: project manager or above, or dependency creator.

GET    /api/tasks/:id/dependencies
Returns:
{
  blockedBy: [Task],   // tasks that block this task
  blocking: [Task]     // tasks that this task blocks
}
```

### 7.2 Circular dependency validation

Before creating a dependency `A blocked by B`:
- Recursively check if B is (directly or transitively) blocked by A.
- If so, return 400 with "Adding this dependency would create a circular chain."
- Limit recursion depth to 10 to prevent performance issues.

### 7.3 Blocker resolution notification

When a task is marked as `done` or `completed`:
- Find all tasks that have this task as a blocker (via TaskDependency).
- For each found task, check if ALL its blockers are now resolved.
- If all blockers resolved: create a `TASK_UNBLOCKED` notification for the assignee of the dependent task.
- Emit a `TASK_DEPENDENCY_RESOLVED` WebSocket event to the project room.

### 7.4 Activity recording

Record dependency changes via the existing activity service:
- `dependency_added`: { blockingTask: {id, title} }
- `dependency_removed`: { blockingTask: {id, title} }

## 8. WebSocket Requirements

```
TASK_DEPENDENCY_RESOLVED
  payload: { taskId, resolvedBlockerId, allResolved: boolean }
  recipients: project members
  trigger: when a blocking task is completed
```

## 9. Frontend Requirements

### 9.1 Task card updates

- Add a "blocked" badge to Kanban task cards when `hasBlockers: true`.
- Blocked cards should be visually distinct (e.g., slightly grayed out, lock icon).

### 9.2 Task detail view — dependency section

```
[BLOCKED BY]
  ● Database Migration   [In Progress]    → view task
  ● API Credentials      [Todo]           → view task

[BLOCKING]
  ● Backend Deployment   [Blocked]        → view task
  ● Frontend Deployment  [Blocked]        → view task

[+ Add dependency]   (search box to find tasks in same project)

[Blocked Reason]
  "Waiting for API credentials from the client."
  [Edit reason]
```

### 9.3 Dependency search

The "Add dependency" control must:
- Search tasks within the same project.
- Show task title and current status in results.
- Prevent selecting the task itself.
- Show a warning if the selected dependency would create a circular chain (validate client-side first, server validates definitively).

## 10. UX Requirements

- Blocked tasks must be immediately obvious in both Kanban and My Day views.
- When a blocker is resolved, the unblocked task's card should update in real-time.
- The dependency section in task detail should load quickly (it's frequently viewed).

## 11. Edge Cases

- Dependency between tasks in different projects: reject with clear error ("Dependencies must be within the same project").
- Deleting a task that has dependencies: cascade delete its dependency records. Notify dependents.
- Marking a task complete when it has incomplete blockers: allow but warn ("This task has unresolved dependencies. Complete anyway?").
- Circular chain detection at depth > 10: reject with "Dependency chain too complex to validate."

## 12. Security

- Only project members can view dependencies.
- Only managers and above can add/remove dependencies.
- Validate that both tasks belong to the same project before creating a dependency.

## 13. Migration / Backward Compatibility

No existing dependency data. Adding `blockedReason` and `hasBlockers` to Task model must be optional with safe defaults.

## 14. Testing Checklist

**Backend:**
- [ ] Dependency created successfully.
- [ ] Circular dependency (A → B → A) rejected with 400.
- [ ] Circular dependency (A → B → C → A) rejected with 400.
- [ ] Dependency between tasks in different projects rejected.
- [ ] GET dependencies returns correct blockedBy and blocking lists.
- [ ] Completing a blocking task triggers unblocked notification.
- [ ] Deleting a dependency works.
- [ ] Activity recorded for dependency add/remove.

**Frontend:**
- [ ] Blocked badge appears on task cards with blockers.
- [ ] Dependency section in task detail shows correct tasks.
- [ ] Add dependency search works.
- [ ] Removing a dependency works.
- [ ] Blocked reason field editable.
- [ ] Real-time update when blocking task is completed.

## 15. Completion Criteria

- [ ] TaskDependency model and API functional.
- [ ] Circular dependency prevention working.
- [ ] Blocker resolution notifications working.
- [ ] Blocked task visual indicators in Kanban and My Day.
- [ ] Dependency management in task detail view.
- [ ] Activity logging for dependency changes.
- [ ] Existing functionality unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Wait for instruction to proceed to Milestone 11.

---

# MILESTONE 11 — RECURRING TASKS & REMINDERS

## 1. Objective

Allow users to manage repeated responsibilities without manually creating the same task every week. Recurring tasks are one of the most commonly requested productivity features. The implementation must be architecturally sound — no uncontrolled task duplication.

## 2. Existing Functionality to Reuse

- Recurrence rule schema defined in M1 (on Task and Reminder models).
- Existing task CRUD.
- Notification service (upcoming occurrence reminders).
- Activity service (record recurrence creation).

## 3. Scope

- Recurrence rule definition UI (daily, weekly, monthly, yearly, custom).
- Recurrence engine (generate next occurrence).
- Management of recurring task series.
- Recurring event support (using same engine).
- Recurring reminder support.

## 4. Out of Scope

- Calendar export of recurring series (M17).
- AI-suggested recurrence patterns (M19).
- Complex RFC 5545 (iCal) RRULE parsing (use a simpler internal format for now).

## 5. Functional Requirements

### 5.1 Recurrence model

The recurrence rule (defined in M1) supports:

```
Daily:   every N days
Weekly:  every N weeks on [Mon, Wed, Fri]
Monthly: every N months on day D of month
Yearly:  every N years on [month, day]
Custom:  flexible interval with end condition
```

### 5.2 Architecture decision: generation strategy

**Use a "generate on demand" approach (NOT "generate all future instances at creation").**

When a recurring task series is created:
1. Save the recurrence rule on the base/template task.
2. Calculate and save `nextOccurrenceDate` on the template.
3. Do NOT create 52 future task instances at once.

When the occurrence date arrives (or during a daily background job):
1. Check if the current occurrence instance exists for today.
2. If not, create a new Task instance as a child of the template.
3. Set `nextOccurrenceDate` on the template to the following occurrence.
4. The child instance can be modified without affecting the series.

### 5.3 Recurrence controls

When viewing or editing a recurring task, the user should be able to:
- **Edit this occurrence only**: creates a modified instance without affecting the series.
- **Edit this and all following**: modifies the series from this point forward (creates a new series).
- **Edit all occurrences**: modifies the template; affects all future occurrences.
- **Delete this occurrence only**: marks this instance as deleted/skipped.
- **Delete the entire series**: marks the template as inactive; no more occurrences.
- **End the series after [date]**: sets `endDate` on the recurrence rule.

### 5.4 Background job

A daily background job (or cron at midnight):
- Find all active recurring task templates.
- For each, check if `nextOccurrenceDate` is today or past.
- If so, create the occurrence instance.
- Update `nextOccurrenceDate` to the next calculated date.
- Repeat until `nextOccurrenceDate` is in the future.

This ensures users see today's recurring tasks in My Day.

### 5.5 Display on Calendar and My Day

- Recurring tasks show with a recurring indicator (loop icon).
- Only the actual occurrence instances appear on the calendar, not the template.
- Templates are not shown directly to the user.

## 6. Data Model

### 6.1 Task model additions

```javascript
// Beyond what was added in M1, add:
isRecurringTemplate: { type: Boolean, default: false },
nextOccurrenceDate: { type: Date, default: null },
recurrenceActive: { type: Boolean, default: true },
// On occurrence instances:
occurrenceDate: { type: Date, default: null },  // the specific date this instance is for
isOccurrenceSkipped: { type: Boolean, default: false }
```

### 6.2 Recurrence rule sub-document (confirm M1 schema is in place)

The `recurrenceRule` embedded object from M1 is used as-is.

## 7. Backend Requirements

### 7.1 Create recurring task

```
POST /api/tasks

Body includes:
{
  title: "Weekly Team Report",
  isRecurring: true,
  recurrenceRule: {
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [5],    // Friday
    timezone: 'Asia/Kolkata'
  },
  dueDate: "2026-08-15",  // first occurrence date
  ...other fields
}
```

Server:
1. Creates the template task with `isRecurringTemplate: true`.
2. Calculates the first occurrence date.
3. Creates the first occurrence instance.
4. Sets `nextOccurrenceDate` to the second occurrence.

### 7.2 Recurrence engine utility

```javascript
// server/utils/recurrenceEngine.js

/**
 * Calculate the next occurrence date after a given date.
 */
function getNextOccurrence(recurrenceRule, afterDate) { ... }

/**
 * Generate upcoming N occurrences for display purposes.
 */
function getUpcomingOccurrences(recurrenceRule, startDate, count) { ... }
```

Use a library like `date-fns` or `rrule` if already in the project, or implement simple arithmetic for daily/weekly/monthly.

### 7.3 Edit recurrence endpoints

```
PUT /api/tasks/:id
Body: { editScope: 'this' | 'this_and_following' | 'all', ...changes }

DELETE /api/tasks/:id
Body: { deleteScope: 'this' | 'all' }
```

### 7.4 Background job

```javascript
// server/jobs/recurringTaskJob.js

async function processRecurringTasks() {
  const today = startOfDay(new Date());
  const templates = await Task.find({
    isRecurringTemplate: true,
    recurrenceActive: true,
    nextOccurrenceDate: { $lte: today }
  });

  for (const template of templates) {
    // Create occurrence instance
    // Update nextOccurrenceDate on template
  }
}

// Run daily at midnight (use setInterval or a cron library)
```

## 8. WebSocket Requirements

```
TASK_CREATED
  trigger: when a new occurrence instance is generated
  payload: { task, projectId }
  recipients: project members and task assignees
```

(Reuses the existing TASK_CREATED event from M7.)

## 9. Frontend Requirements

### 9.1 Recurrence configuration UI

A "Recurrence" section in the task creation/edit form:
- Toggle: "Repeat this task".
- Frequency selector: Daily / Weekly / Monthly / Yearly.
- Interval: "Every [N] [days/weeks/months/years]".
- Day picker for weekly (Mon, Tue, Wed, Thu, Fri, Sat, Sun checkboxes).
- Day of month for monthly.
- End condition: "Never" / "After [N] occurrences" / "On [date]".
- Preview: "Repeats every Friday. Next: Aug 22."

### 9.2 Recurring indicator

On task cards and My Day items:
- A small loop/refresh icon indicates "this is a recurring task occurrence."
- Clicking it should offer options: "Edit series" vs "Edit this only."

### 9.3 Edit scope dialog

When editing a recurring task:
```
"This is a recurring task. What would you like to edit?"
○ This occurrence only
○ This and all following
○ All occurrences

[Cancel] [Apply]
```

## 10. UX Requirements

- The recurrence UI must be simple. Most users will only use "Every Monday" or "Every month on the 1st."
- The preview string ("Repeats every Friday. Next: Aug 22") must always update as the user configures.
- Deleting a single occurrence should feel light — it's just "skipping" this week's.
- Deleting the entire series should require confirmation.

## 11. Edge Cases

- End of month: "Monthly on the 31st" — handle months with fewer days (use last day of month).
- Timezone boundary: occurrence generation must respect the user's timezone.
- Pausing a series: set `recurrenceActive: false`; reactivating should not generate missed occurrences.
- Already-generated occurrence instances must not be re-generated if the job runs twice.
- Modifying the recurrence rule mid-series: apply cleanly; do not orphan existing instances.

## 12. Security

- Only the task creator or project manager can edit the recurrence rule.
- The background job runs server-side only — no client endpoint to trigger occurrence generation.
- Validate recurrence rule fields server-side (interval must be > 0, frequency must be an allowed value).

## 13. Migration / Backward Compatibility

- Existing tasks are unaffected (all new fields default to null/false).
- Verify that all existing task operations (create, update, delete, drag-drop) still work.

## 14. Testing Checklist

**Backend:**
- [ ] Recurring task template created correctly.
- [ ] First occurrence instance created on series creation.
- [ ] Background job creates next occurrence correctly (daily).
- [ ] Background job correctly handles weekly/monthly frequency.
- [ ] Background job does not create duplicate occurrences.
- [ ] Edit "this only" does not affect series.
- [ ] Edit "all" modifies template and future instances.
- [ ] Delete "this" skips one occurrence without ending series.
- [ ] Delete "all" deactivates series.
- [ ] Month-end edge case handled.

**Frontend:**
- [ ] Recurrence UI appears in task form.
- [ ] Frequency options work.
- [ ] Preview string updates correctly.
- [ ] Loop icon appears on recurring task cards.
- [ ] Edit scope dialog appears when editing recurring task.
- [ ] Occurrence appears in My Day on the correct day.

## 15. Completion Criteria

- [ ] Recurring tasks create occurrences correctly.
- [ ] Background job runs and generates occurrences.
- [ ] Edit/delete scope controls work.
- [ ] Recurring reminders work (same engine).
- [ ] Calendar shows occurrences on correct dates.
- [ ] My Day shows today's occurrences.
- [ ] Existing functionality unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Wait for instruction to proceed to Milestone 12.

---

# MILESTONE 12 — ATTACHMENTS & FILES

## 1. Objective

Allow users to attach files to tasks and projects so that all relevant resources live alongside the work. A team should not need to hunt through email or a shared drive to find the specification for a task.

## 2. Existing Functionality to Reuse

- Existing task model (add attachments field).
- Authorization middleware (file access must be permission-controlled).
- Activity service (record file uploads).
- Notification service (optional: notify assignee when file added).

## 3. Scope

- File upload for tasks.
- File upload for projects.
- File listing and download.
- External link attachments.
- File deletion (with authorization).
- File display in task detail view.

## 4. Out of Scope

- In-browser file preview (PDF/image rendering) — link to download is sufficient.
- Google Drive direct integration (M17).
- Full file management system (version control, folder structure) — this is task-level attachments only.
- Comment attachments (future enhancement).

## 5. Functional Requirements

### 5.1 Supported file types

Accept all common file types. Validate and reject executable files:

```
Allowed: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, md, csv,
         png, jpg, jpeg, gif, webp, svg,
         zip, rar, 7z,
         mp4, mov (if storage allows)
Reject: exe, bat, sh, msi, dmg, app, js (optional — evaluate security risk)
```

Max file size: **25 MB** per file. Configurable via environment variable.

### 5.2 Upload

- User uploads a file via multipart form data.
- Server stores the file.
- Server returns an attachment record with: id, filename, originalName, size, mimeType, uploadedBy, uploadedAt, url.
- Attachment is linked to the task or project.

### 5.3 Storage

**Inspect the existing project for storage configuration:**
- If cloud storage (S3, GCS, Cloudinary) is already configured: use it.
- If not: use local disk storage in a `/uploads` directory with a clear subfolder structure.
- Document the storage choice and its limitations.

For local storage:
```
/uploads/
  tasks/{taskId}/{timestamp}_{filename}
  projects/{projectId}/{timestamp}_{filename}
```

For production, cloud storage is strongly recommended. Document this limitation.

### 5.4 Access control

- File URLs must not be publicly guessable.
- If using local storage: serve files through an authenticated API endpoint, not directly.
- If using cloud storage: use pre-signed URLs with short expiry.
- Only project members can access task attachments.

### 5.5 External links

Allow users to add external URLs as "link attachments":
```
Type: link
URL: https://docs.google.com/spreadsheets/...
Label: "Q3 Financial Model"
```

These are stored in the database, not as uploaded files.

### 5.6 Deletion

- Uploader or project admin can delete an attachment.
- Deletion removes: database record + file from storage.

## 6. Data Model

### 6.1 Attachment Model (new)

```javascript
const AttachmentSchema = new Schema({
  originalName: { type: String, required: true },
  storedName: { type: String },           // for uploaded files
  mimeType: { type: String },             // for uploaded files
  size: { type: Number },                 // bytes, for uploaded files
  url: { type: String, required: true },  // download URL or external URL
  type: { type: String, enum: ['upload', 'link'], required: true },
  label: { type: String, default: '' },   // optional display label
  uploadedBy: { type: ObjectId, ref: 'User', required: true },
  // Entity this attachment belongs to
  entityType: { type: String, enum: ['task', 'project'], required: true },
  entityId: { type: ObjectId, required: true }
}, { timestamps: true });

AttachmentSchema.index({ entityType: 1, entityId: 1 });
```

### 6.2 Task and Project model additions

```javascript
// Add to Task and Project models:
attachments: [{ type: ObjectId, ref: 'Attachment' }]
```

## 7. Backend Requirements

### 7.1 Upload API

```
POST /api/tasks/:id/attachments
Content-Type: multipart/form-data
Body: file field + optional label
Authorization: project member

POST /api/tasks/:id/attachments/link
Body: { url: string, label: string }
Authorization: project member

GET  /api/tasks/:id/attachments
Response: [Attachment]
Authorization: project member

DELETE /api/tasks/:id/attachments/:aid
Authorization: uploader or project admin
```

Mirror these routes for projects:
```
POST /api/projects/:id/attachments
POST /api/projects/:id/attachments/link
GET  /api/projects/:id/attachments
DELETE /api/projects/:id/attachments/:aid
```

### 7.2 File serving (local storage only)

```
GET /api/files/:storedName
Authorization: must be project member to access
```

This route validates the user has access to the file before streaming it.

### 7.3 Multer configuration (or equivalent)

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // create directory if not exists
    cb(null, `./uploads/tasks/${req.params.id}/`);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${sanitizeFilename(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: process.env.MAX_FILE_SIZE || 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // validate mime type
  }
});
```

### 7.4 Activity recording

Record file events via the existing activity service:
- `attachment_added`: { filename, type: 'upload' | 'link' }
- `attachment_removed`: { filename }

## 8. WebSocket Requirements

No real-time attachment events required in this milestone. File additions appear on next refresh or when the task detail is re-opened.

(Optional: emit TASK_UPDATED with attachment count if easy to add without complexity.)

## 9. Frontend Requirements

### 9.1 Task detail — Attachments section

```
[Attachments]  (3)

  📄 Q3_Report.xlsx          2.3 MB   Uploaded by Rahul   Aug 12    [Download] [Delete]
  🖼 wireframes_v2.png       890 KB   Uploaded by Priya   Aug 11    [View] [Delete]
  🔗 Google Drive — Budget   External                                [Open] [Delete]

  [📎 Upload file]   [🔗 Add link]
```

### 9.2 Upload interaction

- Drag-and-drop file onto the task detail (drop zone).
- File picker button.
- Progress indicator during upload.
- After upload: file appears in the attachment list immediately.

### 9.3 File type icons

Map mime types to appropriate icons. At minimum: document, spreadsheet, image, archive, generic file.

## 10. UX Requirements

- Upload progress must be shown (progress bar or spinner).
- Failed uploads must show a clear error message.
- Large files should warn the user before upload begins if they are over a threshold.
- External links should open in a new tab.

## 11. Edge Cases

- Upload of a file that exceeds the size limit: reject with clear error before upload completes.
- Upload of a rejected file type: reject with clear error.
- Deleting a task with attachments: delete attachment records and files from storage.
- Broken external link: the system stores the URL; it does not validate that the URL works.
- File with the same name uploaded twice: both are stored independently (different timestamps in filename).

## 12. Security

- File uploads must be served through an authenticated endpoint — never expose the raw filesystem path.
- Sanitize all filenames to prevent path traversal.
- Validate file type by mime type AND extension — not just the filename.
- Set appropriate Content-Type and Content-Disposition headers when serving files.
- Limit total attachment size per task/project (configurable; e.g., 100 MB total per task).

## 13. Migration / Backward Compatibility

No existing attachment system to migrate. Adding `attachments: []` array to Task and Project models is a safe default.

## 14. Testing Checklist

**Backend:**
- [ ] File upload accepted and stored.
- [ ] File too large rejected with 413.
- [ ] Rejected file type returns error.
- [ ] File download returns file with correct Content-Type.
- [ ] Unauthenticated download request returns 401.
- [ ] Non-member download request returns 403.
- [ ] Link attachment saved and returned.
- [ ] Attachment deletion removes file and record.
- [ ] Activity recorded for upload and delete.

**Frontend:**
- [ ] File upload works (button + drag-drop).
- [ ] Progress indicator shown.
- [ ] Attachment appears in list after upload.
- [ ] Download link works.
- [ ] Link attachment added and shown.
- [ ] Delete works with confirmation.

## 15. Completion Criteria

- [ ] File upload and storage working.
- [ ] File access control working.
- [ ] Link attachments working.
- [ ] Attachment list in task detail functional.
- [ ] Delete works for authorized users.
- [ ] Activity recorded.
- [ ] Security validations in place.
- [ ] Existing functionality unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Wait for instruction to proceed to Milestone 13.

---

# MILESTONE 13 — SEARCH, FILTERING & TAGS

## 1. Objective

Make the system usable at scale. When a team has hundreds of tasks, users need to find things quickly. Search and filtering should work across the entire productivity workspace.

## 2. Existing Functionality to Reuse

- Task, Event, Project, User models.
- Tags field added in M1/M4.
- Authorization middleware (search results must respect permissions).

## 3. Scope

- Global text search (tasks, projects, people).
- Filter system for task lists (status, priority, assignee, project, date, tag, context).
- Tag management (create, apply, view).
- Saved filter presets (nice-to-have; implement if time allows).

## 4. Out of Scope

- Full-text search of comment content (comment search can be added later).
- Elasticsearch or Algolia integration (MongoDB text search is sufficient for this milestone).
- Advanced query syntax (`status:working priority:high`) — implement visual filters instead.
- Search over file attachment content.

## 5. Functional Requirements

### 5.1 Text search

A global search bar (in the top navigation or as a dedicated search page) that searches:
- **Tasks**: title and description.
- **Projects**: name and description.
- **People**: name and email (only within the user's workspaces).

Results grouped by type:
```
Search: "authentication"

TASKS (12)
  Fix authentication bug         [In Progress]  Auth Project
  Authentication middleware       [Done]         Backend Project
  ...

PROJECTS (2)
  Auth Service Rewrite
  ...

PEOPLE (1)
  Priya Sharma — Authentication Lead
```

### 5.2 Task list filters

On any task list view (Kanban, project task list, My Day task list), allow filtering by:

| Filter | Values |
|---|---|
| Status | backlog, todo, in_progress, review, blocked, done |
| Priority | low, medium, high, urgent |
| Assignee | User picker from project members |
| Project | Project picker from user's projects |
| Due date | Today, This week, Overdue, Custom range |
| Tag | Tag picker |
| Context | work, personal, study, health, finance, family, other |
| Creator | User picker |

Filters should be combinable (AND logic: status=in_progress AND priority=high).

Active filters should be clearly visible with a way to remove each one individually.

### 5.3 Tags

Tags were added to the Task model in M1. Now implement the full tag experience:
- Tags are free-form strings (not a separate collection) — a tag is just a string stored on the task.
- The tag input on task create/edit should suggest existing tags (autocomplete from existing tag values in the workspace).
- Clicking a tag on a task card filters the task list to show all tasks with that tag.
- Tags should be styled as colored chips.

### 5.4 URL-persistent filters

Filters applied to the task list should be reflected in the URL query string so the user can share or bookmark a filtered view:
```
/projects/xyz/tasks?status=in_progress&priority=high&assignee=userId
```

## 6. Data Model

No new models.

Create a MongoDB text index on the Task collection:
```javascript
TaskSchema.index({ title: 'text', description: 'text' });
```

Create a text index on Project:
```javascript
ProjectSchema.index({ name: 'text', description: 'text' });
```

**Note:** Adding a text index to a large collection may take time. Do this during low-traffic hours in production.

## 7. Backend Requirements

### 7.1 Search endpoint

```
GET /api/search?q={query}&types=tasks,projects,people&workspaceId={id}

Response:
{
  tasks: { results: [Task], total: Number },
  projects: { results: [Project], total: Number },
  people: { results: [User], total: Number }
}
```

Authorization: return only items the user has access to.
Limit: max 10 results per type in the global search.
Pagination: not required for global search (top results only); full pagination in advanced search.

### 7.2 Task filter endpoint

Extend the existing task list endpoint to accept filter query parameters:

```
GET /api/tasks?status=in_progress&priority=high&assignee=userId&tags=bug,frontend&dueDate=today

Filters are ANDed together.
All existing params (page, limit, sort) must still work.
```

### 7.3 Tag autocomplete endpoint

```
GET /api/tags/suggest?q={prefix}&workspaceId={id}

Response: { tags: ['bug', 'backend', 'blocked'] }
```

Implemented as a simple aggregation on the Task collection's `tags` field, filtered to the workspace.

## 8. WebSocket Requirements

None for this milestone.

## 9. Frontend Requirements

### 9.1 Global search

- Search input in the top navigation bar.
- Keyboard shortcut to focus search (Ctrl+K or Cmd+K).
- Results dropdown showing grouped results (max 5 per type).
- "View all results" link opens a full search results page.
- Loading indicator while searching.
- Debounce the search input (wait 300ms after user stops typing before sending API request).

### 9.2 Task list filter bar

- A filter bar above the task list/Kanban board.
- Active filters shown as removable chips.
- "+ Add filter" button opens a filter configuration panel.
- "Clear all filters" button.
- Filter state persisted in URL query string.

### 9.3 Tag input component

- Multi-select tag input with autocomplete.
- Existing tags suggested as user types.
- Free-form: user can type a new tag and press Enter to add.
- Tags displayed as colored chips on task cards.

## 10. UX Requirements

- Search must feel instant — debounce + optimistic loading.
- Filters must be easy to add and remove — never hidden in a deep menu.
- Tag chips should use a consistent color per tag (derived from the tag string hash).
- Empty search results: show "No results for '[query]'" with a suggestion to try different terms.

## 11. Edge Cases

- Search query with special MongoDB text search characters: sanitize before querying.
- Very short search query (< 2 chars): do not search, show a hint.
- User filters by assignee for a task with no assignee: show tasks with null assignee.
- Combining many filters that result in 0 tasks: show empty state (not an error).
- Tag added to a task does not exist in any autocomplete yet: it is still valid — save it.

## 12. Security

- Search results must only include items the user has access to (workspace membership check).
- The search API must not expose tasks/projects from workspaces the user doesn't belong to.
- Validate and sanitize all filter parameters server-side.

## 13. Migration / Backward Compatibility

- Adding text indexes to existing collections is non-destructive but may run in the background on large datasets.
- Existing task queries must still work without filter parameters (all params optional).

## 14. Testing Checklist

**Backend:**
- [ ] Search returns tasks matching query.
- [ ] Search returns projects matching query.
- [ ] Search returns people matching name/email.
- [ ] Search does not return items from inaccessible workspaces.
- [ ] Filter by status returns correct tasks.
- [ ] Filter by priority returns correct tasks.
- [ ] Filter by assignee returns correct tasks.
- [ ] Filter by tag returns correct tasks.
- [ ] Combined filters work correctly (AND logic).
- [ ] Tag autocomplete returns existing tags.

**Frontend:**
- [ ] Search input focuses with keyboard shortcut.
- [ ] Results appear with debounce.
- [ ] Clicking a result navigates to the entity.
- [ ] Filter chips appear when filters applied.
- [ ] Removing a filter chip updates task list.
- [ ] Tag autocomplete suggests existing tags.
- [ ] URL updates with filter state.
- [ ] Page refreshed with filter URL shows filtered results.

## 15. Completion Criteria

- [ ] Global text search functional (tasks, projects, people).
- [ ] Task list filters functional (status, priority, assignee, tag, context, date).
- [ ] Combined filters work.
- [ ] Tag autocomplete functional.
- [ ] URL-persistent filter state.
- [ ] Access control enforced on search results.
- [ ] Existing functionality unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Wait for instruction to proceed to Milestone 15.

---

# MILESTONE 15 — TIME TRACKING

## 1. Objective

Allow users to optionally track how long they spend on tasks. Time tracking is never forced — it is an opt-in enhancement. The data feeds into analytics (M16) and helps teams understand effort vs. estimation accuracy.

## 2. Existing Functionality to Reuse

- Task model (`estimatedDuration` and `actualDuration` added in M1).
- Authorization middleware.
- Activity service (record time entries).

## 3. Scope

- Manual time entry (add time spent without a running timer).
- Timer (start/stop/pause).
- Time entry list per task.
- Actual vs. estimated duration display.
- Total time tracked per task.

## 4. Out of Scope

- Timesheet reporting across all tasks (M16).
- Billable hours tracking.
- Client invoicing.
- Time tracking across projects in aggregate (M16).

## 5. Functional Requirements

### 5.1 Timer

On the task detail view:

```
Estimated: 3 hours

[▶ Start Timer]         ← when not tracking
  ↓ after starting:
[■ Stop]  00:42:17       ← elapsed time counter
```

Timer states: idle, running, paused.

- Start: begins counting time from now.
- Pause: pauses the running timer (elapsed time saved).
- Resume: continues from where it left off.
- Stop: stops timer and saves a time entry.

### 5.2 Manual time entry

```
[+ Add Time]
Date: [today]
Duration: [2h 30m]
Note: "Initial implementation"
[Save]
```

### 5.3 Time entry list

On the task detail view, a "Time" tab (alongside Comments and Activity):

```
TIME TRACKING

Estimated: 3h
Actual: 2h 41m (89% of estimate)

──────────────────────────
Aug 13    Aditya    2h 41m    "Implementation"   [Delete]
Aug 12    Rahul     0h 30m    "Review"            [Delete]
──────────────────────────
Total: 3h 11m

[+ Log Time]
```

### 5.4 Task card display

Show a small time indicator on task cards if time is being tracked or has been logged:
```
⏱ 2h 41m / 3h est.
```

## 6. Data Model

### 6.1 TimeEntry Model (new)

```javascript
const TimeEntrySchema = new Schema({
  task: { type: ObjectId, ref: 'Task', required: true },
  user: { type: ObjectId, ref: 'User', required: true },
  project: { type: ObjectId, ref: 'Project', default: null },
  startTime: { type: Date, default: null },   // for timer entries
  endTime: { type: Date, default: null },      // for timer entries
  duration: { type: Number, required: true },  // minutes (always stored as minutes)
  note: { type: String, default: '' },
  isManual: { type: Boolean, default: false }
}, { timestamps: true });

TimeEntrySchema.index({ task: 1, user: 1 });
TimeEntrySchema.index({ user: 1, createdAt: -1 });
TimeEntrySchema.index({ project: 1, createdAt: -1 });
```

### 6.2 Timer state (in-memory or database)

Active timer state can be stored in the database on the Task model for persistence across sessions:

```javascript
// Add to Task model:
activeTimer: {
  user: { type: ObjectId, ref: 'User', default: null },
  startedAt: { type: Date, default: null },
  pausedDuration: { type: Number, default: 0 }  // accumulated paused time in seconds
}
```

## 7. Backend Requirements

### 7.1 Timer API

```
POST /api/tasks/:id/timer/start
  Starts timer for current user.
  Validates no other active timer for this user on this task.

POST /api/tasks/:id/timer/pause
  Pauses running timer.

POST /api/tasks/:id/timer/resume
  Resumes paused timer.

POST /api/tasks/:id/timer/stop
  Stops timer and creates a TimeEntry from elapsed time.
  Returns the created TimeEntry.

GET /api/tasks/:id/timer/status
  Returns current timer state (idle/running/paused and elapsed seconds).
```

### 7.2 Time entry API

```
POST   /api/tasks/:id/time-entries       Log manual time entry
GET    /api/tasks/:id/time-entries       List time entries for task
DELETE /api/tasks/:id/time-entries/:eid  Delete time entry (owner or admin)
```

### 7.3 Actual duration update

When a time entry is created or deleted, recalculate and update `task.actualDuration` (sum of all time entries for the task in minutes).

## 8. WebSocket Requirements

```
TASK_TIMER_STARTED
  payload: { taskId, userId, startedAt }
  recipients: project members (so others can see someone is working on it)

TASK_TIMER_STOPPED
  payload: { taskId, userId, duration }
  recipients: project members
```

## 9. Frontend Requirements

### 9.1 Timer UI in task detail

- Start/Pause/Resume/Stop buttons.
- Elapsed time counter (updates every second client-side using JS interval).
- The counter must resume from the correct position if the page is refreshed (fetch timer status on mount).

### 9.2 Manual time entry form

Simple form: date, duration (HH:MM or hours + minutes), note. Available as a modal or inline form.

### 9.3 Time tab in task detail

- List of time entries with user, date, duration, note.
- Delete button for own entries.
- Total duration displayed.
- Comparison with estimated duration (if estimate is set).

## 10. UX Requirements

- The timer must feel reliable — users will trust it for billing or reporting.
- Elapsed time should update every second without performance issues.
- Manual entry format should be forgiving: accept "2h 30m", "2.5h", "150m", "2:30".

## 11. Edge Cases

- User starts timer, closes browser, reopens: timer state is persisted in the database and resumes from `startedAt`.
- Two users try to start a timer on the same task: allow both (two separate timers for two different users).
- Timer running when task is deleted: stop the timer and create a time entry before deletion.
- Manual entry of 0 duration: reject.
- Manual entry of more than 24h: allow but warn ("That's more than 24 hours. Are you sure?").

## 12. Security

- A user can only see their own time entries (unless they are project admin, who can see all).
- Only the entry owner or project admin can delete a time entry.
- Timer can only be started by a user who has access to the task.

## 13. Migration / Backward Compatibility

No existing time tracking to migrate. `actualDuration` field on Task model is already in place from M1 (null by default).

## 14. Testing Checklist

**Backend:**
- [ ] Start timer creates timer state.
- [ ] Stop timer creates time entry with correct duration.
- [ ] Pause/resume works correctly.
- [ ] Timer state persists across requests.
- [ ] Manual time entry created and saved.
- [ ] actualDuration updated when entry created.
- [ ] actualDuration updated when entry deleted.
- [ ] Non-member cannot access timer or entries.

**Frontend:**
- [ ] Timer starts and displays counting.
- [ ] Timer resumes from correct position after page refresh.
- [ ] Stop creates entry that appears in list.
- [ ] Manual entry form works.
- [ ] Time tab shows entries.
- [ ] Total duration shown.
- [ ] Estimated vs actual comparison shown.

## 15. Completion Criteria

- [ ] Timer (start/pause/resume/stop) functional.
- [ ] Manual time entry functional.
- [ ] Time entry list functional.
- [ ] actualDuration auto-calculated.
- [ ] Task card shows time indicator.
- [ ] WebSocket events for timer state emitted.
- [ ] Existing functionality unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
This is the end of Document 03. Report completion. Verify all existing functionality from Documents 01, 02, and 03 still works. Wait for instruction to proceed to `04_TEAM_MANAGEMENT_AND_ANALYTICS.md`.

---

*End of Document 03. Proceed to `04_TEAM_MANAGEMENT_AND_ANALYTICS.md` when instructed.*
