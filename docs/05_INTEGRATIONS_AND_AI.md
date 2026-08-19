# 05 — INTEGRATIONS & AI

> **Dependencies:** Documents 01, 02, 03, and 04 must be complete and verified.
> **Depends on:** All previous milestones. The entire data model, calendar, task system, projects, authorization, notifications, comments, search, time tracking, and analytics must be stable before AI is introduced.
> **Read first:** `00_MASTER_INSTRUCTIONS.md`

---

## PRE-FLIGHT CHECK

Before modifying anything:

1. Confirm Documents 01–04 are complete and verified:
   - [ ] Calendar, My Day, Task System 2.0 (Doc 01).
   - [ ] Projects, Authorization, Real-time, Notifications, Comments (Doc 02).
   - [ ] Dependencies, Recurring, Attachments, Search, Time Tracking (Doc 03).
   - [ ] Manager Dashboard, Team Calendar, Analytics (Doc 04).
2. This document introduces external API integrations and AI features. Both require API keys and external service accounts. Confirm environment variables and secrets management before proceeding.
3. AI features (M19, M20) must not be introduced until M17 and M18 are stable. Do not skip ahead.
4. Run full regression across all previous milestones before beginning any work in this document.

If any prerequisite is broken or unstable, stop and report. **AI features on a broken foundation will cause cascading problems.**

---

## DO NOT MODIFY

- Existing authentication and JWT.
- Existing WebSocket infrastructure and all real-time events.
- Existing task CRUD and Kanban.
- Existing notification service.
- Existing comment and activity systems.
- Existing analytics and reporting.
- Any existing data model — AI must use the existing data structures, not parallel ones.

---

## CRITICAL AI PRINCIPLE

> AI must **recommend**, never silently act.

Every AI-generated output (task, schedule, suggestion) must be:
1. Presented to the user for review.
2. Confirmed by the user before being saved to the database.
3. Reversible if the user changes their mind.

An AI action that writes to the database without user confirmation is a bug, not a feature.

---

# MILESTONE 17 — EMAIL & EXTERNAL CALENDAR INTEGRATIONS

## 1. Objective

Connect the platform to the user's existing ecosystem so that important external information (emails, calendar events) can become actionable items without requiring a separate tool. The goal is not to build an email client — it is to let users capture and act on external information from within the productivity platform.

**Start with ONE integration first** (Google Calendar is recommended). Get it working fully before starting the second.

## 2. Existing Functionality to Reuse

- Event model (M1) — external calendar events are imported into this model.
- Task model — email-to-task creates a Task.
- Notification service (M8) — sync errors trigger notifications.
- User model — store integration tokens against the user.
- Calendar UI (M2) — imported events appear in the existing calendar.

## 3. Scope

- Google Calendar two-way sync (read external events, write platform events to Google).
- Email-to-task capture (Gmail, read-only: convert an email into a task).
- Integration settings page (connect/disconnect services, sync status).
- OAuth 2.0 flow for Google services.
- Sync status and error display.

## 4. Out of Scope

- Microsoft Outlook / Microsoft Calendar integration (document it as a future enhancement; the same pattern applies).
- Full email client features (compose, reply, send).
- Two-way task sync with Google Tasks.
- Slack integration.
- Zapier/webhook connectors.
- Push notifications via email for platform events (M8 covers in-app; email delivery is a future enhancement beyond this milestone).

## 5. Functional Requirements

### 5.1 OAuth 2.0 Connection Flow

The user navigates to Settings → Integrations.

They see:

```
INTEGRATIONS

Google Calendar      [Connect]    Sync your Google Calendar events
Gmail                [Connect]    Turn emails into tasks
```

Clicking "Connect" initiates the OAuth 2.0 authorization flow:
1. Platform redirects user to Google's OAuth consent screen.
2. User grants permission (calendar read/write, Gmail read-only).
3. Google redirects back to the platform with an authorization code.
4. Platform exchanges code for access token + refresh token.
5. Tokens are stored securely on the user's record (encrypted at rest).
6. Integration status changes to "Connected."

### 5.2 Google Calendar Sync

**Import (Google → Platform):**
- On initial connect: import upcoming events from the user's primary Google Calendar (next 30 days).
- On recurring sync (every 15 minutes or on user request): fetch new/updated/deleted events.
- Imported events are stored in the platform's Event model with `source: 'google_calendar'` and `externalId: googleEventId`.
- Imported events are shown in the platform's Calendar view (M2) alongside native events.
- Imported events are shown in My Day (M3) on their date.
- Imported events are read-only in the platform — editing them redirects to Google Calendar.

**Export (Platform → Google):**
- When a user creates a platform Event, offer an option: "Also add to Google Calendar."
- If selected, create the event in Google Calendar via the API.
- Store the returned Google event ID on the platform event (`externalId`).
- Updates to the platform event sync to Google Calendar.
- Deleting a platform event that was synced to Google: also delete from Google Calendar (with confirmation).

**Sync conflicts:**
- If an event is updated in both places since the last sync: surface a conflict notification to the user. Do not silently overwrite either version. Let the user choose.

### 5.3 Gmail Email-to-Task

**Read-only access to Gmail.**

In the platform (e.g., in the quick-create menu or a dedicated "Capture from Email" panel):

```
[Capture from Email]

Recent emails with action indicators:

From: Client <client@company.com>
Subject: Project report must be submitted by Friday
Received: Aug 13, 10:32 AM
[→ Create Task]

From: Boss <boss@company.com>
Subject: Need database migration this week
Received: Aug 12, 4:15 PM
[→ Create Task]
```

Clicking "→ Create Task" opens the task creation form, pre-filled with:
- Title: subject line (editable).
- Description: email body snippet (editable).
- Due date: if a date is detected in the subject/body, pre-fill it (simple regex detection, not AI).
- Source link: a reference to the original email (stored in task metadata).

**The user reviews and confirms before the task is saved.**

### 5.4 Integration Settings Page

Route: `/settings/integrations`

For each integration:
- Connected status with account email shown.
- Last sync time.
- Manual "Sync now" button.
- Disconnect button (revokes token and removes stored credentials).
- Sync error display ("Last sync failed: [reason]. [Retry]").

### 5.5 Sync error handling

Sync jobs can fail (expired token, API quota exceeded, network error). Requirements:
- Log all sync errors.
- Retry up to 3 times with exponential backoff.
- After 3 failures, create a notification to the user: "Google Calendar sync failed. Please reconnect your account."
- Display sync status in the settings page.

## 6. Data Model

### 6.1 Integration Model (new)

```javascript
const IntegrationSchema = new Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  provider: {
    type: String,
    enum: ['google_calendar', 'gmail', 'outlook', 'google_drive'],
    required: true
  },
  accessToken: { type: String, required: true },    // encrypt at rest
  refreshToken: { type: String, required: true },   // encrypt at rest
  tokenExpiry: { type: Date },
  accountEmail: { type: String },                   // Google account email
  status: {
    type: String,
    enum: ['connected', 'error', 'disconnected'],
    default: 'connected'
  },
  lastSyncAt: { type: Date, default: null },
  lastSyncError: { type: String, default: null },
  syncRetryCount: { type: Number, default: 0 },
  settings: {
    type: Schema.Types.Mixed,
    default: {}
    // e.g., { calendarId: 'primary', syncDirection: 'both' }
  }
}, { timestamps: true });

IntegrationSchema.index({ user: 1, provider: 1 }, { unique: true });
```

### 6.2 Event model additions

```javascript
// Add to Event model:
source: {
  type: String,
  enum: ['platform', 'google_calendar', 'outlook'],
  default: 'platform'
},
externalId: { type: String, default: null },
externalUrl: { type: String, default: null },   // link to original in Google Calendar
isReadOnly: { type: Boolean, default: false }   // true for imported events
```

### 6.3 Task model additions

```javascript
// Add to Task model:
sourceEmail: {
  emailId: { type: String, default: null },
  subject: { type: String, default: null },
  fromAddress: { type: String, default: null },
  receivedAt: { type: Date, default: null }
}
```

## 7. Backend Requirements

### 7.1 OAuth routes

```
GET  /api/integrations/google/auth
  Generates Google OAuth URL with appropriate scopes.
  Scopes: https://www.googleapis.com/auth/calendar, https://www.googleapis.com/auth/gmail.readonly
  Returns: { authUrl: string }

GET  /api/integrations/google/callback?code={code}&state={state}
  Exchanges code for tokens.
  Saves Integration record.
  Redirects to /settings/integrations with success/error status.
```

### 7.2 Integration management

```
GET    /api/integrations                    List user's integrations (without tokens)
DELETE /api/integrations/:provider          Disconnect integration (revoke token)
POST   /api/integrations/:provider/sync     Manual sync trigger
GET    /api/integrations/:provider/status   Sync status
```

### 7.3 Google Calendar sync service

```javascript
// server/services/googleCalendarSync.js

async function syncUserCalendar(userId) {
  // 1. Get user's Google integration
  // 2. Refresh access token if expired
  // 3. Fetch events from Google Calendar API (use syncToken for incremental sync)
  // 4. Upsert events in platform Event collection (match by externalId)
  // 5. Delete platform events that were deleted in Google Calendar
  // 6. Update lastSyncAt
}
```

Use Google's incremental sync (`syncToken`) to avoid fetching all events every time.

### 7.4 Gmail capture service

```javascript
// server/services/gmailCapture.js

async function getRecentEmails(userId, maxResults = 20) {
  // 1. Get user's Gmail integration
  // 2. Fetch recent emails from Gmail API (INBOX, last 7 days, unread or starred)
  // 3. Return basic metadata: id, subject, from, date, snippet
  // Never store full email content in the database
}
```

The platform only reads email metadata (subject, sender, date, snippet). It does not store full email content.

### 7.5 Background sync job

```javascript
// server/jobs/integrationSyncJob.js

async function runSyncJob() {
  const integrations = await Integration.find({
    provider: 'google_calendar',
    status: 'connected'
  });

  for (const integration of integrations) {
    try {
      await syncUserCalendar(integration.user);
    } catch (error) {
      await handleSyncError(integration, error);
    }
  }
}

// Run every 15 minutes
setInterval(runSyncJob, 15 * 60 * 1000);
```

### 7.6 Token encryption

Access and refresh tokens must be encrypted before storage.

```javascript
// server/utils/encryption.js
const crypto = require('crypto');
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;  // 32-byte key

function encrypt(text) { ... }
function decrypt(encryptedText) { ... }
```

Store `process.env.TOKEN_ENCRYPTION_KEY` in the environment configuration. Never commit it to the repository.

### 7.7 Environment variables required

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google/callback
TOKEN_ENCRYPTION_KEY=   # 32-character random string
```

Document these in `.env.example`.

## 8. WebSocket Requirements

```
INTEGRATION_SYNC_COMPLETE
  payload: { provider, lastSyncAt, newEventsCount }
  recipients: user room (user:{userId})
  trigger: after background sync completes

INTEGRATION_SYNC_ERROR
  payload: { provider, error: 'Token expired' }
  recipients: user room
  trigger: after sync failure
```

These events allow the settings page to update sync status in real-time.

## 9. Frontend Requirements

### 9.1 Integrations settings page

Route: `/settings/integrations`

For each provider:
```
┌──────────────────────────────────────────────┐
│ 🗓 Google Calendar                [Connected] │
│                                              │
│ Connected as: user@gmail.com                 │
│ Last sync: 3 minutes ago                     │
│ Next sync: in 12 minutes                     │
│                                              │
│ [Sync Now]              [Disconnect]         │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ ✉ Gmail                    [Not connected]   │
│                                              │
│ Turn emails into tasks.                      │
│                                              │
│ [Connect Gmail]                              │
└──────────────────────────────────────────────┘
```

### 9.2 Google Calendar events in Calendar view

Imported Google Calendar events should:
- Display with a Google Calendar icon or "G" badge.
- Show as read-only (clicking shows detail but no edit form).
- Have a "View in Google Calendar" link.
- Be visually slightly different from native events (e.g., dashed border or different color tint).

### 9.3 Gmail capture panel

A panel accessible from the quick-create menu: "Capture from Email."

Displays a list of recent emails. Each email shows:
- From, Subject, Date.
- "Create Task" button.

Clicking "Create Task" opens the task creation form (M4) pre-filled with email data. The user reviews and saves.

### 9.4 OAuth flow in browser

When user clicks "Connect Google Calendar":
1. Platform fetches the authUrl from `/api/integrations/google/auth`.
2. Redirect user to Google consent screen (new window or same window).
3. After consent, Google redirects to the callback URL.
4. Callback handler saves tokens and redirects user back to settings with `?success=google_calendar`.
5. Settings page reads query param and shows success message.

## 10. UX Requirements

- The OAuth flow must be clear: what permissions are being requested and why.
- Imported events must be visually distinguishable from native platform events.
- Sync status must be visible without hunting — check the integration settings page first.
- "Sync Now" button must show a loading state and then a timestamp of when sync completed.
- Disconnecting an integration must warn: "This will remove all synced events from your calendar. Continue?"
- Token expiry must be handled gracefully — show "Please reconnect your Google account" rather than a blank error.

## 11. Edge Cases

- Google OAuth token expires: refresh it automatically using the refresh token before each sync.
- Refresh token also expires (Google revokes access): catch the error, set integration status to 'error', notify user.
- Google Calendar API rate limit exceeded: respect `Retry-After` header and back off.
- User has multiple Google calendars: for now, sync only the primary calendar. Document how to support multiple in a future enhancement.
- Imported event deleted from Google Calendar: remove the platform copy on next sync.
- Platform event exported to Google Calendar, then edited in Google Calendar: sync the Google version back on next import, show conflict notification.
- User connects the same Google account to two different platform accounts: handle gracefully (the second connection should work independently).

## 12. Security

- OAuth tokens must be encrypted at rest using AES-256.
- The `GOOGLE_CLIENT_SECRET` and `TOKEN_ENCRYPTION_KEY` must never be exposed to the client.
- The OAuth `state` parameter must be a CSRF token (random string stored in session, verified in callback).
- Gmail read-only scope: the platform must never attempt to send or modify emails.
- Do not store full email body content in the database — only metadata.
- The callback route must validate the `state` parameter before exchanging the code.

## 13. Migration / Backward Compatibility

No existing integration data to migrate. The Integration model is new. Adding `source` and `externalId` fields to the Event model must be optional with safe defaults — existing events are unaffected.

## 14. Testing Checklist

**Backend:**
- [ ] OAuth auth URL generated correctly.
- [ ] Callback exchanges code for tokens and saves Integration.
- [ ] Tokens stored encrypted in database.
- [ ] Calendar sync imports events with correct fields.
- [ ] Sync creates Event records with source='google_calendar'.
- [ ] Incremental sync (syncToken) only fetches changed events.
- [ ] Deleted Google events are removed from platform on sync.
- [ ] Token refresh works when access token expires.
- [ ] Sync error handling increments retry count.
- [ ] After 3 failures, user notification created.
- [ ] Gmail capture returns recent emails.
- [ ] Email-to-task pre-fills task form correctly.
- [ ] Disconnect removes integration record.
- [ ] CSRF state param validated in callback.

**Frontend:**
- [ ] Connect button initiates OAuth flow.
- [ ] After connection, settings page shows "Connected."
- [ ] Imported events appear in Calendar view.
- [ ] Imported events have read-only indicator.
- [ ] Gmail capture panel shows emails.
- [ ] Email-to-task form pre-filled and editable.
- [ ] Sync Now button works and shows timestamp.
- [ ] Disconnect with confirmation works.

## 15. Completion Criteria

- [ ] Google Calendar OAuth flow complete.
- [ ] Import sync working (Google → Platform).
- [ ] Export working (Platform → Google) with user opt-in.
- [ ] Incremental sync implemented.
- [ ] Gmail email capture functional.
- [ ] Email-to-task flow functional (user reviews before save).
- [ ] Integration settings page functional.
- [ ] Token encryption implemented.
- [ ] Error handling and retry logic working.
- [ ] CSRF protection on OAuth callback.
- [ ] Existing functionality unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Wait for instruction to proceed to Milestone 18.

---

# MILESTONE 18 — DAILY BRIEFING

## 1. Objective

Generate a concise, automatically compiled daily summary that gives the user a complete picture of their day in one place — before they dive into work. This is the first AI-adjacent feature, but it is deliberately **deterministic**: no AI is used in this milestone. The briefing is a structured summary of existing data, not a generated narrative.

## 2. Existing Functionality to Reuse

- My Day aggregation API (M3) — the briefing is a richer version of My Day data.
- Task, Event, Reminder models.
- Team and Project models.
- Notification system (M8) — briefing can be delivered as a special notification.
- Calendar data (M2).

## 3. Scope

- Daily briefing data API.
- Daily briefing page/component (rich formatted view).
- Optional: briefing delivered as the first thing the user sees on login (splash or modal).
- Briefing sections: today's schedule, top priorities, overdue, team activity, tomorrow preview.

## 4. Out of Scope

- AI-generated narrative text (M19).
- Email delivery of the briefing (requires email service setup; document as future enhancement).
- Personalized scheduling suggestions (M20).
- Weekly or monthly briefings.

## 5. Functional Requirements

### 5.1 Briefing structure

The daily briefing is a single, comprehensive view of the user's day. Generated fresh each time it is requested (or cached for up to 30 minutes).

```
╔════════════════════════════════════════════╗
║  GOOD MORNING, ADITYA                      ║
║  Thursday, August 13                        ║
╚════════════════════════════════════════════╝

TODAY AT A GLANCE
─────────────────
5 tasks   •   2 meetings   •   1 deadline   •   2 overdue

TOP PRIORITY
────────────
🔴 Production Deployment          URGENT
   Due today at 4:00 PM
   Project: Auth Service

TODAY'S SCHEDULE
────────────────
09:00   Team Standup               Meeting         30 min
10:00   Fix Authentication Issue   Task      HIGH
12:30   Lunch                      Personal
14:00   Client Meeting             Meeting         1 hr
16:00   Production Deployment      Task      URGENT
19:00   Gym                        Reminder  HEALTH

OVERDUE
───────
⚠ API Documentation                         2 days overdue
⚠ Update Deployment Docs                    4 days overdue

YOUR TEAM
─────────
✅ Rahul completed: Authentication Middleware
⏳ Priya is waiting for: Design Assets
🔴 Aman has 2 tasks overdue

TOMORROW
────────
→ Database Migration (HIGH)
→ Project Meeting (09:00)
→ Pay Electricity Bill (Reminder)
```

### 5.2 Greeting logic

Time-based greeting:
- Before 12:00: "Good morning"
- 12:00–17:00: "Good afternoon"
- After 17:00: "Good evening"

### 5.3 Today at a Glance

Counts from My Day data:
- Number of tasks due today.
- Number of meetings/events today.
- Number of deadlines today.
- Number of overdue items.

### 5.4 Top Priority

The single most urgent item today:
- Selection logic: first check for URGENT tasks due today; if none, check HIGH tasks due today; if none, the task with the earliest due date/time.
- Show its full context (project, due time, priority).

### 5.5 Today's Schedule

Chronological list of all items for today (same as My Day timeline from M3).

### 5.6 Overdue

All overdue tasks with how many days overdue. Cap at 5, with "View all overdue" link.

### 5.7 Your Team section

Shows activity from team members in the last 24 hours:
- Recently completed tasks by teammates.
- Teammates who are blocked.
- Teammates with overdue tasks.

This section appears only if the user is a member of at least one team.

Limit to 5 items. Do not show this section if there is no team activity.

### 5.8 Tomorrow Preview

Top 3–5 items coming tomorrow:
- Tasks due tomorrow.
- Events tomorrow (chronological).
- Reminders due tomorrow.

### 5.9 When is it shown

Option A (simpler): briefing is a dedicated page (`/briefing`) accessible from the navigation.

Option B: briefing appears as an overlay/modal on first login of the day (dismissed after reading, not shown again until next day).

Implement Option A first. Option B can be layered on top after Option A works.

## 6. Data Model

No new models. The briefing is a computed aggregation.

Track whether the user has seen today's briefing (for Option B):

```javascript
// Add to User model (optional, for Option B):
lastBriefingSeenDate: { type: Date, default: null }
```

## 7. Backend Requirements

### 7.1 Briefing API

```
GET /api/briefing?date=2026-08-13

Response:
{
  date: "2026-08-13",
  greeting: "Good morning",
  userName: "Aditya",
  glance: {
    tasks: Number,
    meetings: Number,
    deadlines: Number,
    overdue: Number
  },
  topPriority: Task | null,
  schedule: [timeline items from My Day],
  overdue: [Task],
  teamActivity: [
    { type: 'completed' | 'blocked' | 'overdue', user: User, task: Task }
  ],
  tomorrow: [Task | Event | Reminder]
}
```

The briefing endpoint should reuse the My Day service (M3) internally. Do not duplicate data-fetching logic.

### 7.2 Team activity computation

For team activity, query the Activity log (M9):

```javascript
// Get activities by team members in the last 24 hours
const teamActivities = await Activity.find({
  actor: { $in: teamMemberIds },
  action: { $in: ['completed', 'status_changed'] },
  createdAt: { $gte: twentyFourHoursAgo }
}).populate('actor task');
```

Limit to 5 items. Sort by relevance (completed tasks first, then blocked, then overdue).

### 7.3 Caching

Cache the briefing response per user per date for 30 minutes. Cache key: `briefing:{userId}:{date}`.

Invalidate when:
- User marks a task complete.
- User creates or updates a task for today.
- A task is assigned to the user.

## 8. WebSocket Requirements

None specific to briefing. Briefing refreshes on re-visit.

## 9. Frontend Requirements

### 9.1 Briefing page

Route: `/briefing` (or `/my-briefing`)

A beautifully formatted single-page view of the briefing data. Design it to feel like a personal morning brief — calm, organized, decisive.

Layout:
```
[Greeting header — large]

[Glance metrics bar]

[Top Priority card — prominent]

[Today's Schedule section]

[Overdue section — warning style]

[Team section — if applicable]

[Tomorrow section]

[Refresh button]     [Last updated: 3 minutes ago]
```

### 9.2 Today's Schedule in briefing

Reuse the `DayItemCard` component from My Day (M3). The briefing schedule section should look identical to the My Day timeline — consistency is important.

### 9.3 First-login overlay (Option B — implement after Option A)

On the user's first page load of the day:
- Check if `lastBriefingSeenDate` is today.
- If not: show a full-screen or centered modal with the briefing.
- Include a prominent "Let's go" or "Start my day" button to dismiss.
- After dismissal: update `lastBriefingSeenDate` and navigate to My Day.

### 9.4 Loading state

Show a skeleton layout while briefing data loads. The skeleton should match the briefing's structure so the page doesn't jump when data arrives.

## 10. UX Requirements

- The briefing must feel **calm and organized**, not overwhelming.
- Typography should be larger and more spacious than the task list views.
- The top priority item should command immediate visual attention.
- Overdue items should be visible but not cause panic.
- The team section should feel collaborative, not judgmental.
- Loading should feel fast — under 1 second for the skeleton and under 2 seconds for full data.
- The briefing should be printable (CSS print styles — nice to have, not required).

## 11. Edge Cases

- User with no items today: show positive empty state ("Nothing scheduled for today. Enjoy your day!").
- User with no team: hide the team section entirely.
- Briefing requested for a future date: allow (show tomorrow's briefing if requested).
- Briefing requested for a past date: allow (historical view).
- All overdue items: cap at 5 and show count of remaining.
- Top priority: if all tasks are LOW priority and none are overdue, still select the one with the earliest due date.

## 12. Security

- Briefing endpoint returns only the authenticated user's data.
- Team activity section returns only data from teams the user is a member of.
- Date parameter validated (valid ISO date).

## 13. Migration / Backward Compatibility

Minimal. If adding `lastBriefingSeenDate` to User model, it is optional with null default.

## 14. Testing Checklist

**Backend:**
- [ ] Briefing returns correct data for today.
- [ ] Greeting is time-appropriate.
- [ ] Top priority selection logic correct (urgent > high > earliest due).
- [ ] Schedule is chronologically ordered.
- [ ] Overdue list is correct.
- [ ] Team activity shows recent completions.
- [ ] Tomorrow preview is correct.
- [ ] Caching works (second request from cache).
- [ ] User with no items returns empty state (not 404).
- [ ] User with no team: teamActivity is empty array.

**Frontend:**
- [ ] Briefing page renders all sections.
- [ ] Top priority card is visually prominent.
- [ ] Schedule section matches My Day style.
- [ ] Overdue section has warning styling.
- [ ] Refresh button re-fetches data.
- [ ] Last updated timestamp shown.
- [ ] Skeleton loading state displayed.
- [ ] First-login overlay appears once per day (Option B, if implemented).

## 15. Completion Criteria

- [ ] Briefing API functional and correctly aggregates data.
- [ ] Briefing page renders all sections correctly.
- [ ] Top priority logic correct.
- [ ] Team activity section functional.
- [ ] Tomorrow preview functional.
- [ ] Caching implemented.
- [ ] Skeleton loading state functional.
- [ ] Existing functionality unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Wait for instruction to proceed to Milestone 19.

---

# MILESTONE 19 — AI: NATURAL LANGUAGE TASK CREATION

## 1. Objective

Allow users to create tasks, events, and reminders using natural language input. The AI layer translates free-form text into structured data that maps to the existing platform models. The user always reviews and confirms before anything is saved.

**Prerequisite:** The entire underlying task/calendar/project/notification system (Documents 01–04) must be stable. The AI must use these systems — it must not create parallel data structures.

## 2. Existing Functionality to Reuse

- Task creation API (M1/M4) — AI creates tasks through the existing endpoint.
- Event creation API (M1) — AI creates events through the existing endpoint.
- Reminder creation API (M1) — AI creates reminders through the existing endpoint.
- Project list (M5) — AI can assign tasks to existing projects.
- User list (team members) — AI can resolve name mentions to user IDs.
- Recurrence engine (M11) — AI can set recurrence rules.

## 3. Scope

- Natural language input field (global quick-capture).
- AI parsing of input into one or more structured items.
- Review screen before saving.
- Extraction of: title, type (task/event/reminder), date, time, priority, assignee, project, recurrence.
- Multi-item extraction ("I need to finish the API and ask Rahul to review it" → two tasks with dependency suggestion).

## 4. Out of Scope

- AI daily planning (M20).
- AI-powered search (not planned).
- AI-generated task descriptions or comments.
- Voice input.
- Automatic (unconfirmed) task creation — user confirmation is always required.
- Fine-tuning or custom model training.
- AI that accesses external web content.

## 5. Functional Requirements

### 5.1 Quick-capture input

A prominent text input accessible from anywhere in the application:
- Keyboard shortcut: `Shift + C` (or `Shift + Space` — follow convention if one exists).
- Located in the top navigation bar or as a floating button.
- Placeholder: "Type anything — 'Meeting with Rahul tomorrow at 3pm' or 'Buy groceries on Sunday'"

### 5.2 AI parsing

When the user submits natural language input, the platform sends it to the AI service (Claude API) with a structured extraction prompt.

**Example input:** "Remind me to submit the project report Friday at 5 PM, high priority"

**AI extracts:**
```json
{
  "items": [
    {
      "type": "reminder",
      "title": "Submit project report",
      "date": "2026-08-15",
      "time": "17:00",
      "priority": "high",
      "context": "work"
    }
  ]
}
```

**Example input:** "Tomorrow morning I need to finish the API and then ask Rahul to review it"

**AI extracts:**
```json
{
  "items": [
    {
      "type": "task",
      "title": "Finish the API",
      "date": "2026-08-14",
      "time": "09:00",
      "priority": "medium",
      "suggestedAssignee": null
    },
    {
      "type": "task",
      "title": "Ask Rahul for code review",
      "date": "2026-08-14",
      "time": null,
      "priority": "medium",
      "suggestedAssignee": "rahul",
      "dependsOn": 0
    }
  ],
  "suggestedDependency": {
    "message": "Item 2 depends on Item 1 being completed first. Add this dependency?"
  }
}
```

### 5.3 AI prompt design

The prompt sent to the AI must:
- Instruct the model to return **only valid JSON** (no prose, no markdown fences).
- Provide the current date and time so relative dates ("tomorrow", "next Friday") resolve correctly.
- List available projects (by name) so the AI can suggest project assignment.
- List team members (by name) so the AI can resolve "Rahul" to a member.
- Specify the output schema exactly.
- Specify that dates must be in ISO 8601 format.
- Specify that times must be in HH:MM 24-hour format.

```javascript
const systemPrompt = `
You are a task extraction assistant. Extract tasks, events, and reminders from the user's input.

Current date and time: ${new Date().toISOString()} (timezone: ${userTimezone})

Available projects: ${projectList.map(p => p.name).join(', ')}
Team members: ${memberList.map(m => m.name).join(', ')}

Return ONLY a JSON object with this exact structure:
{
  "items": [
    {
      "type": "task" | "event" | "reminder",
      "title": string,
      "date": "YYYY-MM-DD" | null,
      "time": "HH:MM" | null,
      "endTime": "HH:MM" | null,
      "priority": "low" | "medium" | "high" | "urgent" | null,
      "context": "work" | "personal" | "study" | "health" | "finance" | "family" | "other" | null,
      "suggestedAssignee": string (member name) | null,
      "suggestedProject": string (project name) | null,
      "recurrence": null | { "frequency": "daily"|"weekly"|"monthly"|"yearly", "interval": number, "daysOfWeek": number[] }
    }
  ],
  "suggestedDependency": { "message": string } | null
}

Do not output any text outside the JSON object.
`;
```

### 5.4 Review screen

After AI parsing, show the user a review screen:

```
AI EXTRACTED 2 ITEMS

Review and edit before saving:

┌─────────────────────────────────────────────┐
│ TASK 1                                       │
│ Finish the API                               │
│ Date: Tomorrow (Aug 14)    Time: 9:00 AM     │
│ Priority: Medium           Context: Work     │
│ Project: [select ▼]        Assignee: Me      │
│                                              │
│ [Edit]                             [Remove]  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ TASK 2                                       │
│ Ask Rahul for code review                    │
│ Date: Tomorrow (Aug 14)    Time: —           │
│ Priority: Medium           Context: Work     │
│ Assignee: Rahul Singh ▼                      │
│                                              │
│ 💡 Suggested: Make this depend on Task 1?    │
│    [Yes, add dependency]  [No, skip]         │
│                                              │
│ [Edit]                             [Remove]  │
└─────────────────────────────────────────────┘

[← Edit input]              [Save all (2)]
```

Every field in the review screen must be editable before saving.

### 5.5 Saving

When the user clicks "Save all":
1. For each item, call the appropriate creation endpoint (POST /api/tasks, POST /api/events, etc.).
2. If a dependency was accepted, call the dependency endpoint (M10).
3. Show success confirmation with links to the created items.

If any item fails to save: show the error inline. The user can retry or remove that item.

### 5.6 AI service integration

Use the existing Claude API or whichever AI provider is configured. Do not hardcode API keys in the codebase.

```javascript
// server/services/aiService.js

async function parseNaturalLanguageInput(userInput, context) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: buildSystemPrompt(context),
      messages: [{ role: 'user', content: userInput }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text;

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('AI returned invalid JSON: ' + text);
  }
}
```

### 5.7 Environment variables required

```
ANTHROPIC_API_KEY=
```

Document in `.env.example`.

## 6. Data Model

No new models. AI creates items using existing Task, Event, and Reminder models through existing endpoints.

```javascript
// Optional: track AI-created items for analytics
// Add to Task model:
aiGenerated: { type: Boolean, default: false }
```

## 7. Backend Requirements

### 7.1 AI parsing endpoint

```
POST /api/ai/parse
Body: { input: string, projectIds: string[], memberIds: string[] }
Authorization: authenticated user

Response: the parsed items JSON from the AI

Rate limiting: 20 requests per minute per user (AI calls are expensive)
```

This endpoint calls the AI service and returns the structured result. It does NOT save anything to the database.

### 7.2 Validation of AI output

Before returning AI output to the client:
- Validate the JSON structure matches the expected schema.
- Resolve `suggestedAssignee` name to a user ID (if the name matches a team member).
- Resolve `suggestedProject` name to a project ID.
- Validate all dates are valid ISO dates.
- If AI returns invalid JSON or a malformed response, return a 422 with a clear error.

### 7.3 Error handling

AI calls can fail or be slow:
- Timeout after 10 seconds; return 408 with "AI parsing timed out."
- If AI returns invalid JSON: retry once, then return 422.
- If API key is missing: return 503 with "AI features not configured."
- Log all AI parsing requests and responses for debugging.

## 8. WebSocket Requirements

None. AI parsing is a synchronous request-response. Items are created via existing REST endpoints.

## 9. Frontend Requirements

### 9.1 Quick-capture modal

A modal that opens on keyboard shortcut or button click:
- Large text area (3–5 lines visible).
- Submit button: "Parse with AI."
- Loading state: "Thinking..." with a spinner (can take 3–8 seconds).
- Character limit: 500 characters (prevent excessive input).

### 9.2 Review screen

A second step within the same modal (or a new modal):
- Display extracted items as editable cards (see section 5.4).
- All fields editable (type, title, date, time, priority, assignee, project).
- Remove button per item.
- Dependency suggestion prompt (yes/no).
- "← Back" to edit the original input.
- "Save all" button.

### 9.3 Loading states

- Between input and review: "Parsing your input..." with spinner.
- On save: "Saving..." with spinner per item.
- On success: "2 items created!" with links.

### 9.4 Error states

- AI timeout: "This is taking longer than expected. Try a shorter input."
- AI invalid response: "Couldn't understand that. Try rephrasing or use the regular task form."
- Partial save failure: show which items saved and which failed.

## 10. UX Requirements

- The quick-capture must feel fast — the modal should open instantly (no loading before the input appears).
- The review screen must feel like a checkpoint, not a barrier — most of the time, the AI output is good and the user just clicks "Save all."
- Editable fields in the review screen should be inline (not a full form), so the user can quickly fix a date without a heavy editing experience.
- The dependency suggestion should feel like a helpful nudge, not a pop-up interruption.
- If the user types something completely uninterpretable: show a helpful empty state ("No items detected. Try: 'Meeting with Rahul tomorrow at 3pm' or 'Submit report by Friday'").

## 11. Edge Cases

- Input with no detectable items: return `{ "items": [] }` from AI; show empty state.
- Input ambiguous about date ("next Friday" when today is Friday): resolve to next week; show the resolved date clearly in review so user can correct.
- Assignee name not found in team: leave assignee null, show a dropdown in the review so user can select.
- Project name ambiguous (two projects with similar names): leave project null, show a dropdown.
- Input in a language other than English: the AI can handle it, but instruct the model to output field values in English to keep data consistent. Title can remain in the user's language.
- Very long input (> 500 chars): reject before sending to AI.
- AI returns a task with a past due date: allow but show a warning in the review screen.

## 12. Security

- The AI endpoint requires authentication.
- Rate limit AI calls: 20 per minute per user.
- Never send sensitive data (JWT tokens, full user profiles) to the AI service — send only the minimum context.
- Validate all AI-returned data server-side before any database write.
- The AI does not write to the database — only the user's confirmed action does.

## 13. Migration / Backward Compatibility

No schema changes beyond the optional `aiGenerated` boolean on Task. All existing task creation workflows are unaffected.

## 14. Testing Checklist

**Backend:**
- [ ] POST /api/ai/parse returns structured items for clear input.
- [ ] Multi-item extraction works.
- [ ] Date resolution correct (tomorrow, next Monday, etc.).
- [ ] Assignee name resolved to user ID.
- [ ] Project name resolved to project ID.
- [ ] AI timeout handled (408).
- [ ] Invalid JSON from AI handled (422).
- [ ] Rate limiting enforced.
- [ ] Items NOT saved to database by the parse endpoint.
- [ ] Items saved correctly when user confirms through existing task/event endpoints.

**Frontend:**
- [ ] Quick-capture modal opens with keyboard shortcut.
- [ ] Loading state shown while AI parses.
- [ ] Review screen displays extracted items.
- [ ] All fields editable in review.
- [ ] Dependency suggestion shown and actionable.
- [ ] Save all creates items through existing endpoints.
- [ ] Success state shows links to created items.
- [ ] Error state for AI failure shown.
- [ ] Empty state for undetectable input shown.

## 15. Completion Criteria

- [ ] Quick-capture input accessible globally.
- [ ] AI parsing produces correct structured output.
- [ ] Multi-item extraction working.
- [ ] Date and time resolution correct.
- [ ] Review screen fully functional and editable.
- [ ] Dependency suggestion functional.
- [ ] Items saved via existing endpoints (not new AI-specific ones).
- [ ] Rate limiting in place.
- [ ] All error states handled gracefully.
- [ ] Existing task creation unaffected.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
Report completion. Wait for instruction to proceed to Milestone 20.

---

# MILESTONE 20 — AI DAILY PLANNING

## 1. Objective

Given the user's tasks, deadlines, meetings, estimated durations, dependencies, and available time, the AI recommends a structured daily schedule. The recommendation is presented to the user for review and approval. Nothing is auto-scheduled. Nothing is changed without explicit user confirmation.

**This milestone depends on everything that came before it being stable.** The AI's recommendations are only as good as the underlying data.

## 2. Existing Functionality to Reuse

- My Day API (M3) — the AI uses today's items as its input.
- Task model with estimatedDuration, priority, dependencies (M4, M10).
- Event model with startDateTime and endDateTime (M1).
- Recurrence engine (M11) — today's recurring task occurrences are already visible.
- Calendar API (M2) — for understanding what time slots are occupied.
- Time tracking data (M15) — actual vs. estimated duration history for better estimates.

## 3. Scope

- AI schedule recommendation: given today's tasks and calendar, suggest a time-blocked plan.
- User review and selective acceptance of the suggested schedule.
- Application of accepted schedule (sets startDate/time on tasks).
- Explanation of AI reasoning ("I scheduled 'Fix Auth' at 10am because it's high priority and you have 90 minutes free").
- Re-planning: user can request a new recommendation after making changes.

## 4. Out of Scope

- Automatic (silent) schedule changes without confirmation.
- Learning user preferences over time (personalization).
- Cross-day planning (plan the whole week).
- Suggestions based on external factors (traffic, energy levels).
- Team scheduling or resource allocation.
- Meeting scheduling with other participants.

## 5. Functional Requirements

### 5.1 Trigger

The user requests a daily plan from:
- The My Day page: "✨ Plan my day" button.
- The briefing page: "Get a suggested schedule" button.

This is always user-initiated. The AI never runs automatically.

### 5.2 Context gathered for AI

Before calling the AI, the backend assembles:
- All tasks due today or overdue (with title, priority, estimatedDuration, dependencies).
- All events/meetings today (with startDateTime, endDateTime — these are fixed; AI cannot move them).
- Available time blocks (gaps between fixed events).
- User's working hours (configurable preference; default 09:00–18:00).
- Priority and urgency of each task.
- Any tasks with dependencies (task B cannot start until task A is done).

### 5.3 AI prompt design

```javascript
const systemPrompt = `
You are a personal productivity planner. Given a list of tasks, meetings, and available time slots,
create an optimal daily schedule for the user.

Rules:
1. Do not move or modify meetings/events — they are fixed.
2. Schedule tasks into available time gaps between meetings.
3. Respect task dependencies — task B cannot be scheduled before task A is complete.
4. Prioritize urgent and high-priority tasks earlier in the day.
5. Add buffer time (10-15 min) between tasks where possible.
6. Do not overschedule — if tasks don't fit, say so and suggest deferring.
7. Respect the user's working hours: ${workingHoursStart} to ${workingHoursEnd}.
8. Use actual duration history to adjust estimates where available.

Return ONLY valid JSON with this structure:
{
  "scheduledItems": [
    {
      "taskId": string,
      "suggestedStartTime": "HH:MM",
      "suggestedEndTime": "HH:MM",
      "reasoning": "brief reason why this slot was chosen"
    }
  ],
  "deferredItems": [
    {
      "taskId": string,
      "reason": "why this task couldn't fit today"
    }
  ],
  "planSummary": "A single sentence describing the plan"
}
`;
```

### 5.4 Review and apply screen

After AI generates a plan, show the user a full-page or modal review:

```
YOUR SUGGESTED DAY — Thursday, August 13

"Focused morning on high-priority dev work, meetings in the afternoon."

09:00 – 10:30   Fix Authentication Issue       HIGH      [Accept] [Skip]
10:30 – 10:45   ─── Buffer ───
10:45 – 11:30   Code Review                    MEDIUM    [Accept] [Skip]
11:30 – 12:00   Team Meeting                   📅 Fixed
12:00 – 13:00   ─── Lunch (no tasks) ───
13:00 – 14:30   Implement Payment Flow         HIGH      [Accept] [Skip]
14:00 – 15:00   Client Meeting                 📅 Fixed
15:00 – 16:30   Production Deployment          URGENT    [Accept] [Skip]

⚠ COULDN'T FIT TODAY (2)
  API Documentation — deferred to tomorrow (suggested)
  Update Deployment Docs — deferred to tomorrow (suggested)

[Accept All]   [Skip All]   [Re-plan]   [Cancel]
```

### 5.5 Apply accepted items

When the user clicks "Accept" for individual items or "Accept All":
- For each accepted item: call `PATCH /api/tasks/:id` to set `startDate` to today and `scheduledStartTime` to the suggested time.
- This uses the existing task update endpoint — no new endpoint needed.
- Show a success message: "Schedule applied. Open My Day to see your plan."

### 5.6 Deferred items

Items the AI couldn't fit into the day:
- Show them with the AI's reason.
- Offer a "Defer to tomorrow" button per item (sets dueDate to tomorrow using existing task update endpoint).
- The user can also choose to ignore the suggestion.

### 5.7 Re-planning

After the user modifies some items or accepts/skips some suggestions, they can click "Re-plan" to generate a new recommendation that accounts for the current state.

## 6. Data Model

### 6.1 Task model additions

```javascript
// Add to Task model (these should have been added in M4 but if not, add now):
scheduledStartTime: { type: String, default: null },  // "HH:MM" for day scheduling
scheduledEndTime: { type: String, default: null }
```

### 6.2 User preferences (working hours)

```javascript
// Add to User model:
preferences: {
  workingHoursStart: { type: String, default: '09:00' },
  workingHoursEnd: { type: String, default: '18:00' },
  timezone: { type: String, default: 'UTC' }
}
```

## 7. Backend Requirements

### 7.1 Daily planning endpoint

```
POST /api/ai/plan-day

Body: { date: string, workspaceId: string }
Authorization: authenticated user

Process:
1. Fetch all tasks due today/overdue for the user (with dependencies).
2. Fetch all events for the user today (fixed time commitments).
3. Calculate available time blocks.
4. Build AI prompt with all context.
5. Call AI service.
6. Parse and validate AI response.
7. Return plan (do NOT apply it to the database yet).

Response:
{
  scheduledItems: [...],
  deferredItems: [...],
  planSummary: string,
  availableMinutes: number,
  requiredMinutes: number
}
```

Rate limiting: 5 plan-day requests per user per day (AI calls are expensive and should not be spammed).

### 7.2 Apply plan endpoint

```
POST /api/ai/apply-plan

Body: {
  acceptedItems: [{ taskId, startTime, endTime }],
  deferredItems: [{ taskId, newDueDate }]
}

Process:
1. For each acceptedItem: update task's scheduledStartTime and scheduledEndTime.
2. For each deferredItem: update task's dueDate to the new date.
3. Return updated tasks.
4. Emit TASK_UPDATED WebSocket events for all modified tasks.

Authorization: user can only apply changes to their own tasks or tasks they are assignee of.
```

This endpoint uses existing task update logic — it is essentially a batch update.

### 7.3 Available time calculation

```javascript
function calculateAvailableBlocks(events, workStart, workEnd) {
  // Sort events by startTime
  // Find gaps between workStart, events, and workEnd
  // Return array of { start: 'HH:MM', end: 'HH:MM', minutes: number }
}
```

### 7.4 AI context building

The context passed to the AI must be concise. Do not send full task descriptions — send only title, priority, estimatedDuration, and dependency information.

```javascript
const taskContext = tasks.map(t => ({
  id: t._id.toString(),
  title: t.title,
  priority: t.priority,
  estimatedMinutes: t.estimatedDuration || 30,  // default 30 minutes if unknown
  blockedBy: t.blockedBy.map(b => b._id.toString()),
  isOverdue: t.dueDate < new Date()
}));
```

Keep the total prompt under 4000 tokens to control cost.

## 8. WebSocket Requirements

After applying the plan:
```
TASK_UPDATED (existing event)
  payload: { task (with scheduledStartTime), projectId }
  trigger: for each task that had its schedule applied
  recipients: project members
```

My Day will automatically show the updated schedule when it receives `TASK_UPDATED` events.

## 9. Frontend Requirements

### 9.1 "Plan my day" button

On the My Day page and the Briefing page, add a "✨ Plan my day" button. Style it distinctly from regular buttons — it should feel like a special action, not a routine one.

### 9.2 Planning loading state

AI planning takes 5–15 seconds. Show a thoughtful loading state:
```
Analyzing your day...

Looking at your 12 tasks, 2 meetings, and available time.
Building your schedule...
```

Show progress steps, not just a spinner, to manage user expectation.

### 9.3 Plan review screen

A full-page or large modal (see section 5.4 layout).

Key behaviors:
- Fixed items (meetings) are non-interactive, clearly labeled as "📅 Fixed."
- Scheduled tasks show with Accept/Skip controls.
- Deferred items section at the bottom.
- "Accept All" button is prominent.
- "Re-plan" button available if the user skips several items.

### 9.4 Apply confirmation

After accepting items, show a brief confirmation:
```
✅ Schedule applied for Thursday, August 13

8 tasks scheduled
2 tasks deferred to tomorrow

[View My Day]
```

### 9.5 My Day updates

After apply, the My Day page should show the scheduled tasks in their new time slots. Since `TASK_UPDATED` events fire for each task, My Day will update automatically via the existing real-time infrastructure.

## 10. UX Requirements

- The "Plan my day" feature must feel like a helpful assistant, not an authority.
- The review screen must make it trivially easy to accept the plan as-is and easy to skip individual items.
- The AI's reasoning for each scheduled item must be visible ("because it's urgent and this is your first available slot").
- Deferred items must not feel like failures — frame them positively ("Moved to tomorrow to keep today focused").
- Re-planning after changes must be fast — the AI context is already assembled, only the acceptance state changes.
- The feature must gracefully degrade: if the AI service is unavailable, the "Plan my day" button should show "AI planning unavailable. Try later."

## 11. Edge Cases

- User with no tasks today: AI returns an empty schedule with a message ("Nothing to schedule today! Enjoy your day.").
- User with more tasks than available time: AI schedules as many as possible and defers the rest.
- Task with no estimated duration: default to 30 minutes in the AI context.
- Task with a dependency that is also not yet done: AI should not schedule the dependent task before its blocker is scheduled.
- User accepts all items but then creates a new high-priority task: "Re-plan" should incorporate the new task.
- AI returns a scheduled item that conflicts with a meeting: validate server-side and remove the conflict before returning to the user.
- Working hours not set by user: use 09:00–18:00 default.

## 12. Security

- The plan-day endpoint requires authentication.
- Rate limited to 5 requests per user per day.
- The apply-plan endpoint validates that the user is the assignee of each task being scheduled.
- The AI never directly modifies the database — it returns recommendations, and the apply endpoint performs the actual updates through existing validated logic.
- Never expose other users' task data in the AI context.

## 13. Migration / Backward Compatibility

Adding `scheduledStartTime` and `scheduledEndTime` to Task model is optional with null defaults — all existing tasks are unaffected. Adding working hours to User preferences is optional with defaults.

## 14. Testing Checklist

**Backend:**
- [ ] POST /api/ai/plan-day fetches correct context (tasks, events, available time).
- [ ] Available time blocks calculated correctly around fixed events.
- [ ] AI returns valid JSON plan.
- [ ] Dependencies respected in plan (blocked task not scheduled before blocker).
- [ ] Tasks that exceed available time appear in deferredItems.
- [ ] POST /api/ai/apply-plan updates task scheduledStartTime correctly.
- [ ] Deferred items update dueDate correctly.
- [ ] TASK_UPDATED events emitted for all applied tasks.
- [ ] Rate limiting: 6th request today returns 429.
- [ ] User cannot apply schedule to another user's tasks.

**Frontend:**
- [ ] "Plan my day" button triggers planning.
- [ ] Loading state shown with progress steps.
- [ ] Review screen shows scheduled and deferred items.
- [ ] Fixed items (events) shown as non-interactive.
- [ ] Accept/Skip per item works.
- [ ] Accept All applies all.
- [ ] Re-plan generates new recommendation.
- [ ] My Day updates after apply (via WebSocket).
- [ ] AI unavailable: graceful error shown.

## 15. Completion Criteria

- [ ] "Plan my day" trigger functional on My Day and Briefing pages.
- [ ] AI planning generates realistic and dependency-aware schedule.
- [ ] Review screen fully functional (accept, skip, re-plan).
- [ ] Apply plan updates tasks via existing endpoints.
- [ ] My Day reflects the applied schedule.
- [ ] WebSocket updates fire correctly.
- [ ] Rate limiting in place.
- [ ] Authorization enforced on apply.
- [ ] All error and edge cases handled.
- [ ] Existing functionality (tasks, calendar, My Day) completely unchanged.

## 16. Stop Condition

**STOP AFTER THIS MILESTONE.**
This is the end of Document 05 and the end of the planned implementation roadmap.

Report final completion status across all milestones. Provide a summary of:
- What was implemented.
- What is working.
- Known limitations.
- Recommended next steps (improvements, optimizations, additional integrations).

Wait for further instructions.

---

## DOCUMENT 05 — POST-COMPLETION CHECKLIST

After all five milestones in this document are complete:

- [ ] Google Calendar sync is stable.
- [ ] Gmail email-to-task is functional.
- [ ] Daily briefing generates correctly.
- [ ] AI quick-capture (M19) is functional and always requires user confirmation.
- [ ] AI daily planning (M20) is functional and always requires user confirmation.
- [ ] No AI feature modifies the database without user confirmation.
- [ ] All existing features from Documents 01–04 still work correctly.
- [ ] The platform answers "What matters to me right now?" within 3 seconds of opening.

---

*End of Document 05. This is the final implementation document.*
*The complete product — Personal Planner + Team Project Manager + Daily Command Center — is now implemented.*
