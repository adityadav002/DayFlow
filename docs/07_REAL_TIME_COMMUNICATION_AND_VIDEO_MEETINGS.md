# 06 — REAL-TIME COMMUNICATION & VIDEO MEETINGS

> **Milestone type:** Major feature extension — Real-time media communication layer.
>
> **Suggested position in execution order:**
> ```
> 01 Foundation + Calendar
>        ↓
> 02 Authorization + Teams + Chat + WebSocket
>        ↓
> 06 Real-Time Communication + Video Meetings  ← THIS DOCUMENT
>        ↓
> 03 Advanced Task Management
>        ↓
> 04 Team Management + Analytics
>        ↓
> 05 Integrations + AI
> ```
> Place this document immediately after Document 02 in your implementation sequence because this milestone depends heavily on the existing chat, users, conversations, presence, notifications, and Socket.io infrastructure.
>
> **Read first:** `00_MASTER_INSTRUCTIONS.md`

---

## WHAT THIS MILESTONE ADDS

The application evolves from a **chat + productivity tool** into a **professional real-time communication and productivity workspace** — the kind of environment where a team can chat, meet, collaborate on tasks, and manage projects without switching to Zoom, Slack, or Meet.

```
Personal Communication
        │
        ├── 1-to-1 Chat          (existing)
        ├── Group Chat           (existing)
        ├── Voice Call           ← NEW
        └── Video Call           ← NEW
                │
                ▼
        Team Communication
                │
                ├── Team Meeting         ← NEW
                ├── Project Meeting      ← NEW
                └── Group Discussion     ← NEW
                        │
                        ▼
                 Productivity
                        │
                        ├── Calendar     (existing)
                        ├── Tasks        (existing)
                        ├── Projects     (existing)
                        └── My Day       (existing)
```

---

## DEPENDENCIES

This milestone depends on the following being complete and verified:

- [ ] Existing user authentication and JWT.
- [ ] Existing user model and profiles.
- [ ] Existing conversation and message models.
- [ ] Existing chat UI (1-to-1 and group).
- [ ] Existing Socket.io server and client infrastructure.
- [ ] Existing socket authentication mechanism.
- [ ] Existing socket rooms and event architecture.
- [ ] Existing presence system (online/offline).
- [ ] Existing notification system.
- [ ] Existing team and project models.
- [ ] Existing authorization middleware.

**Do not begin this milestone if any of the above is unstable or incomplete.**

---

## DO NOT MODIFY (unless explicitly required by this milestone)

- Existing authentication routes and JWT middleware.
- Existing chat message endpoints and behavior.
- Existing Socket.io connection lifecycle.
- Existing socket event names for chat/tasks/notifications.
- Existing presence system (extend it; do not replace it).
- Existing notification service (extend it; do not replace it).
- Existing task, project, calendar, and Kanban systems.
- Existing database collections beyond what is specified here.

---

## CRITICAL ARCHITECTURAL PRINCIPLE

> **WebSocket/Socket.io handles signaling. WebRTC handles media.**

These are two completely different transport layers with two completely different responsibilities:

| Layer | Technology | Handles |
|---|---|---|
| Signaling | Socket.io (existing) | Call invitations, SDP offer/answer, ICE candidates, participant state, meeting control events |
| Media | WebRTC (new) | Audio streams, video streams, screen sharing, peer-to-peer media transport |

**Never send audio or video data through Socket.io.** Socket.io is used only to coordinate the WebRTC handshake and meeting state. The actual media flows peer-to-peer (or through a TURN relay) via WebRTC's encrypted channels.

---

## PRE-FLIGHT CHECK

Before writing a single line of code, Antigravity must complete the following audit.

### The rule:

```
AUDIT FIRST.
DESIGN SECOND.
IMPLEMENT THIRD.
```

Do not skip steps 1 and 2.

---

# PHASE A — CODEBASE AUDIT

## A.1 Objective

Understand the complete existing communication infrastructure before making any architectural decisions. Produce a verified architecture report. Make zero code changes during this phase.

## A.2 Backend Inspection Checklist

For each area, identify: (a) the actual file path, (b) the current implementation, (c) any gaps or problems.

### A.2.1 Server Architecture

```
Inspect:
  - Entry point file (app.js / server.js / index.js)
  - Express application setup
  - Middleware stack and order
  - Environment variable loading
  - Port configuration
  - CORS configuration (origins, methods, headers, credentials)
  - Error handling middleware
  - Request logging
  - Static file serving
```

### A.2.2 Authentication

```
Inspect:
  - User model (all fields: _id, username, email, password, avatar, status, etc.)
  - JWT issuance (library, payload structure, expiry)
  - JWT validation middleware (how req.user is populated)
  - Refresh token handling (if any)
  - How protected routes are guarded
```

### A.2.3 Database

```
Inspect:
  - Database type and ODM (MongoDB + Mongoose assumed — verify)
  - Connection configuration
  - All existing models and their fields
  - Relationships between models
  - Existing indexes
```

### A.2.4 Conversation and Message Models

```
Inspect the actual Conversation model:
  - Fields: _id, participants, type (direct/group), name, lastMessage, createdAt, etc.
  - Indexes
  - Relationships to User and Message

Inspect the actual Message model:
  - Fields: _id, conversation, sender, content, type, createdAt, etc.
  - Indexes
  - Read receipts (if any)

These models will be directly reused or extended by this milestone.
```

### A.2.5 Chat API Routes

```
Inspect:
  - All existing /conversations endpoints
  - All existing /messages endpoints
  - Request/response format
  - Authorization rules
  - Pagination
```

### A.2.6 Socket.io Server

```
Inspect:
  - Socket.io server initialization (where it is attached to the HTTP server)
  - Socket.io version and configuration
  - CORS configuration for Socket.io
  - Socket authentication mechanism (how the JWT is validated on socket connect)
  - How req.user / socket.user is set
  - Socket room naming convention (e.g., user:{userId}, conversation:{convId})
  - All existing socket event names (list every one)
  - All existing socket event payloads
  - Namespace usage (if any)
  - Error handling on socket events
  - Disconnect handler
```

### A.2.7 Presence System

```
Inspect:
  - How online/offline presence is tracked
  - Where presence state is stored (in-memory Map, Redis, database)
  - Which socket events carry presence state
  - How presence is queried by the frontend
```

### A.2.8 Notification System

```
Inspect:
  - Notification model (if persisted)
  - How notifications are created server-side
  - How notifications are delivered (socket event name, payload)
  - Frontend notification handling
```

### A.2.9 Team and Project Models

```
Inspect:
  - Team model fields and member structure
  - Project model fields and member structure
  - How membership is determined
  - Existing team/project API routes
```

### A.2.10 Deployment

```
Inspect:
  - Current hosting platform (Render, Railway, VPS, etc.)
  - Whether HTTPS is configured and active
  - Reverse proxy configuration (nginx, Render's proxy, etc.)
  - Whether WebSocket connections work in the current deployment
  - Environment variable management
  - .env.example file
  - Current domain/subdomain
  - Whether a Redis instance exists
  - Any infrastructure that could support or conflict with TURN/STUN
```

## A.3 Frontend Inspection Checklist

### A.3.1 React Architecture

```
Inspect:
  - React version
  - Routing library and all existing routes
  - State management solution (Redux, Zustand, Context API, etc.)
  - Folder structure (components, pages, hooks, services, utils, etc.)
  - Build tool (Vite, CRA, etc.)
```

### A.3.2 Authentication State

```
Inspect:
  - How the authenticated user is stored (Redux store, Context, localStorage)
  - How auth state is initialized on app load
  - Token storage location (localStorage, httpOnly cookie, memory)
```

### A.3.3 Socket Client

```
Inspect:
  - Socket.io client initialization (where, how)
  - How the auth token is passed on connection
  - Socket lifecycle management (connect, disconnect, reconnect)
  - How socket events are subscribed to (useEffect, event bus, store middleware)
  - Whether socket is global (singleton) or per-component
```

### A.3.4 Chat UI

```
Inspect:
  - Conversation list component
  - Message thread component
  - Message input component
  - How new messages are received and displayed
  - Existing call-related UI if any (call buttons, etc.)
```

### A.3.5 Design System

```
Inspect:
  - Component library in use (shadcn/ui, MUI, Tailwind, custom, etc.)
  - Modal/dialog pattern
  - Icon library
  - Color scheme and design tokens
  - Responsive layout patterns
  - Existing overlay/notification patterns
```

### A.3.6 Media APIs

```
Inspect:
  - Any existing usage of getUserMedia() or getDisplayMedia()
  - Any existing video/audio elements in the codebase
  - Any existing WebRTC code (RTCPeerConnection, etc.)
  - Any existing calls to browser permissions APIs
```

## A.4 Architecture Report Template

After inspection, produce this report before proceeding:

```
PHASE A — ARCHITECTURE REPORT

Existing authentication:
  Library: [e.g., jsonwebtoken]
  JWT payload: [e.g., { userId, email }]
  Middleware: [file path]
  Token location: [localStorage / cookie / memory]

Existing user model:
  File: [path]
  Key fields: [list]
  Presence fields: [if any]

Existing conversation model:
  File: [path]
  Fields: [list]
  Conversation types: [direct / group / etc.]

Existing message model:
  File: [path]
  Fields: [list]

Existing chat API routes:
  [list all routes with method and path]

Existing socket server:
  File: [path]
  Version: [socket.io version]
  CORS: [origins configured]
  Auth mechanism: [how JWT validated]

Existing socket events (complete list):
  [event name] → [direction] → [purpose]

Existing socket rooms:
  [room naming pattern]

Existing socket authentication:
  [how it works]

Existing presence:
  [implementation details]
  [storage: memory / Redis / DB]

Existing frontend chat:
  [component paths]
  [state management approach]

Existing state management:
  [solution and relevant stores/slices]

Existing notification system:
  [model path if any]
  [delivery mechanism]
  [frontend handler]

Existing deployment:
  [platform]
  [HTTPS status]
  [WebSocket status]
  [domain]

Existing environment variables:
  [list all relevant ones from .env.example]

Existing Redis:
  [yes / no / unknown]

Existing media APIs:
  [any WebRTC or media code found]

Architectural conflicts/risks:
  [list anything that may complicate the video meeting implementation]

Gaps that must be addressed before implementation:
  [list]

Recommended implementation approach:
  [based on the above — fill in after audit]
```

## A.5 Phase A Completion Criteria

- [ ] All backend files inspected.
- [ ] All frontend files inspected.
- [ ] Deployment configuration understood.
- [ ] Architecture report produced.
- [ ] Zero code changes made.
- [ ] All existing socket events documented.
- [ ] Conversation and message models understood.
- [ ] Presence and notification systems understood.

## A.6 Stop Condition

**STOP AFTER PHASE A.**
Submit the architecture report. Wait for approval before proceeding to Phase B.

---

# PHASE B — COMMUNICATION ARCHITECTURE DESIGN

## B.1 Objective

Based on the Phase A audit, make the key architectural decisions that govern all subsequent phases. This is a design phase — no implementation yet.

## B.2 WebRTC Architecture Decision

### Option A — Mesh (Peer-to-Peer)

Every participant opens a direct WebRTC connection to every other participant.

```
A ←──────────→ B
│ ↖          ↗ │
│   ↖      ↗   │
│     ↖  ↗     │
C ←──────────→ D
```

**Advantages:**
- No media server required.
- Lowest infrastructure cost.
- Simplest to implement.
- No ongoing server-side media processing.

**Disadvantages:**
- Bandwidth scales as O(n²): each participant uploads N-1 streams and downloads N-1 streams.
- CPU scales badly: each participant encodes and decodes N-1 streams.
- Practical limit: **4–6 participants maximum** before quality degrades severely on typical devices and connections.

**Suitable for:** Small team calls, 1-to-1 calls, small group meetings (≤ 5 participants).

---

### Option B — SFU (Selective Forwarding Unit)

Each participant publishes one stream to the SFU. The SFU forwards streams to all subscribers. Participants do not connect directly to each other.

```
A ──→ SFU ──→ B
B ──→ SFU ──→ A
B ──→ SFU ──→ C
C ──→ SFU ──→ A
...
```

**Advantages:**
- Each participant uploads only once.
- Download scales linearly with participant count.
- Supports 50–500+ participants depending on SFU infrastructure.
- Quality significantly better than mesh at 5+ participants.

**Disadvantages:**
- Requires a media server (Mediasoup, Janus, Livekit, Ion-SFU, etc.).
- Significantly more complex to implement and operate.
- Requires dedicated infrastructure (cannot run on free hosting tiers).
- Higher operational cost.

**Suitable for:** All meeting sizes from 2 to hundreds.

---

### Option C — Managed WebRTC Provider

Use a third-party service (Daily.co, Twilio Video, Agora, Vonage/TokBox, Livekit Cloud, etc.) that handles the media infrastructure.

**Advantages:**
- Minimal infrastructure management.
- Good scalability out of the box.
- Handles STUN/TURN/SFU automatically.
- Often has ready-made SDKs.

**Disadvantages:**
- Vendor dependency.
- Per-minute or per-participant cost.
- Less control over media pipeline.
- Data passes through third-party infrastructure (privacy consideration).

---

### Recommendation for Initial Implementation

**Start with Mesh WebRTC.**

Reasons:
- The existing project is a team productivity tool, not a large-scale conferencing platform.
- Typical team meetings are 2–8 participants.
- Mesh works well for this range with acceptable quality.
- Mesh requires zero additional infrastructure beyond STUN/TURN.
- The implementation is substantially simpler and can be completed correctly.
- The architecture can be migrated to an SFU later without changing the signaling protocol — only the media routing changes.

**Document the participant limit explicitly:** The initial mesh implementation should be designed for **up to 6 participants**. Beyond 6, display a warning. Do not claim unlimited capacity.

**SFU migration path:** Document that when meeting sizes regularly exceed 6 participants, Mediasoup or Livekit should be evaluated as a drop-in SFU replacement. The socket signaling design in this document should be SFU-compatible so the migration does not require a signaling redesign.

## B.3 Meeting Types to Implement Now vs. Later

| Meeting Type | Implement Now? | Notes |
|---|---|---|
| 1-to-1 video/voice call | YES | Core feature, highest priority |
| Small group call (≤6) | YES | Natural extension of 1-to-1 |
| Team meeting | YES | Tied to existing Team model |
| Project meeting | YES | Tied to existing Project model |
| Scheduled calendar meeting | PARTIAL | Create meeting entity; calendar link is M17 |
| Large group meeting (>6) | NO | Requires SFU; document as future |
| Webinar/broadcast | NO | Out of scope |
| PSTN (phone calling) | NO | Out of scope |
| Meeting recording | NO | Requires server-side media; document as future |

## B.4 Presence State Extension

Extend the existing presence system (do not replace it) with two new states:

```
ONLINE          (existing)
OFFLINE         (existing)
BUSY            (existing if present, add if missing)
IN_CALL         ← NEW: in a 1-to-1 call
IN_MEETING      ← NEW: in a group meeting
DO_NOT_DISTURB  ← NEW: explicitly set by user
```

When a user enters a call or meeting, update their presence state. When they leave, restore the previous state.

## B.5 Phase B Deliverable

Produce a design document:

```
PHASE B — ARCHITECTURE DECISION RECORD

WebRTC architecture selected: [Mesh / SFU / Managed]
Reason: [based on audit findings]
Participant limit: [N participants]
SFU migration trigger: [when / what condition]

Meeting types in scope: [list]
Meeting types deferred: [list]

Presence states to add: [list]

Socket event naming convention:
  [will use existing convention e.g. SNAKE_UPPER_CASE]
  [new events will follow same pattern]

New database entities needed: [list with justification]
Database entities reused: [list]

New frontend components needed: [list]
Frontend components reused: [list]

New backend services needed: [list]
Backend services reused: [list]

Deployment changes required: [list]

Risks identified: [list]

Open questions: [list, or "None"]
```

## B.6 Phase B Completion Criteria

- [ ] WebRTC architecture selected and documented with reasoning.
- [ ] Participant limit defined.
- [ ] Meeting types scoped.
- [ ] Presence extension designed.
- [ ] Socket event naming convention confirmed.
- [ ] Database entities planned.
- [ ] No code changes made.

## B.7 Stop Condition

**STOP AFTER PHASE B.**
Submit the architecture decision record. Wait for approval before Phase C.

---

# PHASE C — DATA MODEL

## C.1 Objective

Define and implement the minimal data model required for the meeting system. Reuse existing Conversation and Message models wherever possible.

## C.2 Existing Models to Reuse

**Do not create new models for anything that the existing Conversation model already handles.**

Inspect the Conversation model carefully:
- If it already has a `type` field that distinguishes direct/group conversations, reuse it.
- If it already links to teams or projects, reuse those fields.
- Meeting chat can reuse the existing conversation threading — a meeting can simply have an associated conversation.

## C.3 Meeting Model (new)

```javascript
const MeetingSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    enum: ['direct', 'group', 'team', 'project'],
    required: true
  },
  createdBy: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  // Optional associations
  workspace: { type: ObjectId, ref: 'Workspace', default: null },
  team: { type: ObjectId, ref: 'Team', default: null },
  project: { type: ObjectId, ref: 'Project', default: null },
  // Link to existing conversation for in-meeting chat
  conversation: { type: ObjectId, ref: 'Conversation', default: null },
  // Link to calendar event (M17 will populate this)
  calendarEvent: { type: ObjectId, ref: 'Event', default: null },

  status: {
    type: String,
    enum: ['waiting', 'active', 'ended'],
    default: 'waiting'
  },
  scheduledAt: { type: Date, default: null },   // null = instant meeting
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },

  // Meeting configuration
  settings: {
    maxParticipants: { type: Number, default: 6 },
    allowScreenShare: { type: Boolean, default: true },
    allowChat: { type: Boolean, default: true },
    muteOnJoin: { type: Boolean, default: false }
  }
}, { timestamps: true });

MeetingSchema.index({ createdBy: 1, createdAt: -1 });
MeetingSchema.index({ team: 1, status: 1 });
MeetingSchema.index({ project: 1, status: 1 });
MeetingSchema.index({ status: 1, scheduledAt: 1 });
```

## C.4 MeetingParticipant Model (new)

```javascript
const MeetingParticipantSchema = new Schema({
  meeting: { type: ObjectId, ref: 'Meeting', required: true },
  user: { type: ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['host', 'co-host', 'participant'],
    default: 'participant'
  },
  // Lifecycle
  joinedAt: { type: Date, default: null },
  leftAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ['invited', 'waiting', 'joined', 'left', 'rejected'],
    default: 'invited'
  },
  // Media state at time of last update (ephemeral but useful for recovery)
  isMuted: { type: Boolean, default: false },
  isCameraOn: { type: Boolean, default: true },
  isScreenSharing: { type: Boolean, default: false }
}, { timestamps: true });

MeetingParticipantSchema.index({ meeting: 1 });
MeetingParticipantSchema.index({ meeting: 1, user: 1 }, { unique: true });
MeetingParticipantSchema.index({ user: 1, joinedAt: -1 });
```

## C.5 What NOT to Persist

Do not store these in the database:

| Data | Reason |
|---|---|
| SDP offers | Signaling-only, ephemeral |
| SDP answers | Signaling-only, ephemeral |
| ICE candidates | Signaling-only, ephemeral |
| RTCPeerConnection state | Client-side WebRTC state |
| Track IDs | WebRTC internals, ephemeral |
| Raw media streams | Never persisted |
| Call socket room membership | Managed by Socket.io in memory |

These are signaling artifacts. They live in memory during a call and are discarded when the call ends. The database stores only business data: who was in the meeting, when, and what role.

## C.6 Call Log (lightweight, for missed call tracking)

```javascript
// Extend the existing notification system OR add a simple log.
// Only if the existing notification system cannot handle this already.

const CallLogSchema = new Schema({
  from: { type: ObjectId, ref: 'User', required: true },
  to: { type: ObjectId, ref: 'User', required: true },   // for direct calls
  meeting: { type: ObjectId, ref: 'Meeting', default: null },
  type: { type: String, enum: ['audio', 'video'], required: true },
  outcome: {
    type: String,
    enum: ['answered', 'missed', 'rejected', 'cancelled', 'failed'],
    required: true
  },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  durationSeconds: { type: Number, default: 0 }
}, { timestamps: true });

CallLogSchema.index({ from: 1, createdAt: -1 });
CallLogSchema.index({ to: 1, createdAt: -1 });
```

**Only create CallLogSchema if the existing notification/activity system cannot be repurposed for this. Inspect first.**

## C.7 Phase C Completion Criteria

- [ ] Meeting model created and indexed.
- [ ] MeetingParticipant model created and indexed.
- [ ] Decision made on CallLog (new vs. reuse existing system).
- [ ] Existing models unaffected.
- [ ] All new fields are optional with safe defaults.
- [ ] Models verified by creating a test document in each collection.

## C.8 Stop Condition

**STOP AFTER PHASE C.**
Report database changes. Wait for approval before Phase D.

---

# PHASE D — MEETING API & INVITATION

## D.1 Objective

Build the REST API layer for creating, joining, leaving, and ending meetings. This phase does not include WebRTC — it is the meeting lifecycle management layer only.

## D.2 REST API

Follow the existing route convention exactly. Inspect existing route structure before defining paths.

```
POST   /api/meetings                    Create a new meeting (instant or scheduled)
GET    /api/meetings                    List user's meetings (past and upcoming)
GET    /api/meetings/:id                Get meeting detail + participants
POST   /api/meetings/:id/join           Join a meeting (user opts in)
POST   /api/meetings/:id/leave          Leave a meeting
POST   /api/meetings/:id/end            End the meeting (host only)
POST   /api/meetings/:id/invite         Invite additional users
GET    /api/meetings/:id/participants   List current participants
```

## D.3 Endpoint Specifications

### POST /api/meetings — Create Meeting

**Authorization:** Any authenticated user.

**Body:**
```json
{
  "title": "Engineering Sync",
  "type": "group",
  "teamId": "optional",
  "projectId": "optional",
  "invitees": ["userId1", "userId2"],
  "scheduledAt": "2026-08-20T10:00:00Z",
  "settings": {
    "muteOnJoin": false,
    "maxParticipants": 6
  }
}
```

**Server actions:**
1. Validate invitees are members of the same workspace/team/project.
2. Create Meeting document with status `'waiting'`.
3. Create MeetingParticipant for creator with role `'host'`.
4. Create MeetingParticipant for each invitee with status `'invited'`.
5. Emit `MEETING_INVITE` socket event to each invitee's `user:{userId}` room.
6. Create `MEETING_INVITATION` notification for each invitee.
7. Return the created meeting with participant list.

**Response:**
```json
{
  "meeting": { "...full meeting object with participants..." }
}
```

### POST /api/meetings/:id/join — Join Meeting

**Authorization:** Must be an invited participant or member of the associated team/project.

**Server actions:**
1. Validate meeting exists and status is `'waiting'` or `'active'`.
2. Validate user is authorized to join (invited, or team/project member).
3. Check participant count < `settings.maxParticipants`.
4. Update MeetingParticipant status to `'joined'`, set `joinedAt`.
5. If this is the first join: update Meeting status to `'active'`, set `startedAt`.
6. Emit `PARTICIPANT_JOINED` to meeting socket room.
7. Update user presence to `IN_MEETING`.
8. Return updated meeting and participant list.

### POST /api/meetings/:id/leave — Leave Meeting

**Server actions:**
1. Update MeetingParticipant: status = `'left'`, set `leftAt`.
2. Emit `PARTICIPANT_LEFT` to meeting socket room.
3. Restore user presence to `ONLINE`.
4. If the leaving user is the host and there are other participants: transfer host to oldest remaining participant.
5. If no participants remain: update Meeting status to `'ended'`, set `endedAt`.

### POST /api/meetings/:id/end — End Meeting (Host Only)

**Authorization:** Meeting host or co-host only.

**Server actions:**
1. Update Meeting status to `'ended'`, set `endedAt`.
2. Update all active MeetingParticipants to status `'left'`.
3. Emit `MEETING_ENDED` to meeting socket room.
4. Force all participants to leave (client-side cleanup triggered by event).

### POST /api/meetings/:id/invite — Invite Additional Participants

**Authorization:** Host or co-host.

**Server actions:**
1. Validate invitees are authorized (workspace/team/project membership).
2. Create MeetingParticipant records for new invitees.
3. Emit `MEETING_INVITE` socket event to each new invitee.
4. Create notifications.

## D.4 Authorization Rules

| Action | Required Role |
|---|---|
| Create meeting | Any authenticated user |
| Join meeting | Invited participant OR team/project member |
| Leave meeting | Any current participant |
| End meeting | Host or co-host only |
| Invite to meeting | Host or co-host |
| View meeting | Any participant (current or past) |

**Non-member joining:** If a user is not invited and not a member of the associated team/project, return 403. Never reveal that the meeting exists to unauthorized users.

## D.5 Phase D Completion Criteria

- [ ] All meeting API endpoints functional.
- [ ] Authorization enforced on every endpoint.
- [ ] Meeting creation emits invitations.
- [ ] Join/leave updates participant status correctly.
- [ ] End meeting updates all participants.
- [ ] Notifications created for invitations.
- [ ] Non-authorized users cannot join (403).
- [ ] Existing chat API unchanged.

## D.6 Stop Condition

**STOP AFTER PHASE D.**
Report API changes. Test all endpoints. Wait for approval before Phase E.

---

# PHASE E — ONE-TO-ONE WEBRTC CALL

## E.1 Objective

Implement a complete, production-quality 1-to-1 audio and video call using WebRTC, with Socket.io as the signaling channel. This phase is the foundation of all video functionality.

## E.2 WebRTC Fundamentals (Do Not Skip)

Before implementing, understand the complete lifecycle:

### E.2.1 RTCPeerConnection

The central WebRTC object. Each peer creates one `RTCPeerConnection`. It manages:
- SDP negotiation (offer/answer).
- ICE candidate gathering and exchange.
- Media tracks.
- Connection state.

```javascript
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: process.env.VITE_TURN_USERNAME,
      credential: process.env.VITE_TURN_CREDENTIAL
    }
  ]
});
```

### E.2.2 SDP Offer / Answer

Session Description Protocol describes the call's media parameters (codecs, resolution, direction, etc.).

**Complete negotiation flow:**

```
Caller (A)                           Callee (B)
    │                                     │
    │ createOffer()                        │
    │ setLocalDescription(offer)           │
    │                                     │
    │ ──── WEBRTC_OFFER (via socket) ────→ │
    │                                     │
    │                    setRemoteDescription(offer)
    │                    createAnswer()
    │                    setLocalDescription(answer)
    │                                     │
    │ ←── WEBRTC_ANSWER (via socket) ──── │
    │                                     │
    │ setRemoteDescription(answer)         │
    │                                     │
    ICE candidates exchanged (both directions simultaneously)
    │                                     │
    │ ── ICE connection established ────→ │
    │                                     │
    Peer connection active, media flowing
```

### E.2.3 ICE Candidates

Interactive Connectivity Establishment. ICE gathers network candidates (local addresses, server-reflexive via STUN, relay via TURN) and exchanges them to find the best connection path.

```javascript
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('WEBRTC_ICE_CANDIDATE', {
      targetUserId: remoteUserId,
      candidate: event.candidate
    });
  }
};
```

ICE candidates must be exchanged after `setLocalDescription` is called. Candidates received before `setRemoteDescription` must be queued and applied after.

### E.2.4 STUN

STUN (Session Traversal Utilities for NAT) tells a peer its public IP address. Required when the peer is behind NAT (which is nearly always).

Free public STUN servers (for development only — do not rely on these in production):
```
stun:stun.l.google.com:19302
stun:stun1.l.google.com:19302
```

### E.2.5 TURN

TURN (Traversal Using Relays around NAT) relays media when direct peer-to-peer is impossible (symmetric NAT, restrictive firewalls, corporate networks).

**This is not optional for production.** Without TURN, calls will fail for a significant percentage of real-world users (estimates vary: 15–30% of connections require TURN relay).

TURN relays all media traffic — this requires significant bandwidth on the TURN server. Budget accordingly.

TURN options:
- **Self-hosted coturn**: open-source, runs on any VPS. Requires a VPS with good bandwidth (minimum 1 Gbps for team use).
- **Metered.ca**: managed TURN with a generous free tier.
- **Twilio NTS**: managed TURN, pay-per-GB.
- **Xirsys**: managed TURN, various plans.

**Never hardcode TURN credentials in source code.** Expose them to the frontend only through a server-generated credential endpoint (TURN short-term credentials) or environment variables.

### E.2.6 Media Tracks

```javascript
// Get local media
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
});

// Add tracks to peer connection
stream.getTracks().forEach(track => {
  peerConnection.addTrack(track, stream);
});

// Receive remote tracks
peerConnection.ontrack = (event) => {
  remoteVideoElement.srcObject = event.streams[0];
};
```

### E.2.7 Connection States to Monitor

```javascript
peerConnection.onconnectionstatechange = () => {
  switch (peerConnection.connectionState) {
    case 'connecting':    // ICE negotiation in progress
    case 'connected':     // Media flowing — call is active
    case 'disconnected':  // Temporary loss — attempt reconnection
    case 'failed':        // Connection unrecoverable — cleanup
    case 'closed':        // Connection explicitly closed
  }
};

peerConnection.oniceconnectionstatechange = () => {
  switch (peerConnection.iceConnectionState) {
    case 'checking':      // ICE candidates being checked
    case 'connected':     // ICE found a working path
    case 'completed':     // ICE fully complete
    case 'disconnected':  // ICE path lost — 5s before 'failed'
    case 'failed':        // ICE completely failed
  }
};
```

Handle `disconnected` with a reconnection attempt. Handle `failed` with cleanup and error display.

## E.3 Complete 1-to-1 Call Flow

### E.3.1 Caller side (User A initiates call)

```
1. User A clicks "Video Call" in conversation with User B.

2. Frontend checks:
   - User B is online (presence check).
   - No existing active call with User B.

3. Frontend requests camera + microphone permission (getUserMedia).
   - If denied: show permission error; offer audio-only option.

4. Frontend emits CALL_INVITE socket event:
   {
     targetUserId: B._id,
     callType: 'video' | 'audio',
     meetingId: (created via REST in background)
   }

5. UI shows "Calling User B..." with cancel option.
   Caller hears ringing tone (local, client-side).

6. Wait for CALL_ACCEPT or CALL_REJECT or timeout (30 seconds).

On CALL_ACCEPT from B:
   7. A creates RTCPeerConnection with STUN/TURN config.
   8. A adds local media tracks to peerConnection.
   9. A creates SDP offer: peerConnection.createOffer().
  10. A calls peerConnection.setLocalDescription(offer).
  11. A emits WEBRTC_OFFER: { targetUserId: B._id, offer }.
  12. ICE gathering begins automatically.
  13. A emits each ICE candidate via WEBRTC_ICE_CANDIDATE as gathered.
  14. A waits for WEBRTC_ANSWER.

On WEBRTC_ANSWER from B:
  15. A calls peerConnection.setRemoteDescription(answer).
  16. A applies any queued ICE candidates from B.

On WEBRTC_ICE_CANDIDATE from B:
  17. A calls peerConnection.addIceCandidate(candidate).

On connectionState === 'connected':
  18. A UI transitions to active call state.
  19. Remote video/audio renders.

On CALL_REJECT or timeout:
  7. A cleans up: stop media tracks, close peerConnection.
  8. A UI shows "Call declined" or "No answer".
```

### E.3.2 Callee side (User B receives call)

```
1. B receives CALL_INVITE socket event.

2. B UI shows incoming call overlay:
   - Caller name and avatar.
   - Call type (audio/video).
   - Accept button.
   - Decline button.
   - Ringing tone.

3a. If B accepts:
   B emits CALL_ACCEPT: { callerId: A._id, meetingId }.
   B requests camera + microphone permission.
   B creates RTCPeerConnection.
   B adds local media tracks.
   B waits for WEBRTC_OFFER.

   On WEBRTC_OFFER from A:
   B calls peerConnection.setRemoteDescription(offer).
   B creates answer: peerConnection.createAnswer().
   B calls peerConnection.setLocalDescription(answer).
   B emits WEBRTC_ANSWER: { targetUserId: A._id, answer }.
   B begins ICE gathering and emits candidates.
   B applies queued ICE candidates from A.

   On connectionState === 'connected':
   B UI transitions to active call state.

3b. If B declines:
   B emits CALL_REJECT: { callerId: A._id }.
   B dismisses incoming call UI.
   (A is notified and cleans up.)

3c. If B is already in a call:
   Server emits USER_BUSY to A automatically (check presence).
   B does not see incoming call UI.
```

### E.3.3 Ending a call

```
Either participant:
1. Clicks "End Call".
2. Frontend: stop all local media tracks.
3. Frontend: peerConnection.close().
4. Frontend emits CALL_END: { targetUserId, meetingId }.
5. Backend: update MeetingParticipant.leftAt, Meeting.endedAt.
6. Backend: emit CALL_ENDED to both participants.
7. Both clients: clean up peerConnection, media elements, UI state.
8. Both clients: restore presence to ONLINE.
```

## E.4 Socket Event Specifications

For every event, follow the existing socket event naming convention found in Phase A audit.

### CALL_INVITE

```
Event:       CALL_INVITE
Direction:   Client → Server → Target Client
Trigger:     User initiates a call
Sender:      Calling user
Receiver:    Target user's socket room (user:{targetUserId})
Payload:     {
               callerId: string,
               callerName: string,
               callerAvatar: string,
               callType: 'audio' | 'video',
               meetingId: string
             }
Validation:  Target user exists and is reachable. Not already in a call.
Persistence: MeetingParticipant created via REST prior to this event.
Client action: Show incoming call UI.
Failure:     If target offline → emit USER_OFFLINE to caller.
             If target busy   → emit USER_BUSY to caller.
```

### CALL_ACCEPT

```
Event:       CALL_ACCEPT
Direction:   Client → Server → Caller Client
Trigger:     Callee accepts call
Sender:      Callee
Receiver:    Caller's socket room
Payload:     { calleeId: string, meetingId: string }
Validation:  Meeting exists and is in valid state.
Persistence: MeetingParticipant.status = 'joined', joinedAt set.
Client action: Caller begins WebRTC negotiation (creates offer).
Failure:     Log and emit CALL_FAILED to callee.
```

### CALL_REJECT

```
Event:       CALL_REJECT
Direction:   Client → Server → Caller Client
Trigger:     Callee declines call
Sender:      Callee
Receiver:    Caller's socket room
Payload:     { calleeId: string, meetingId: string }
Validation:  Meeting exists.
Persistence: MeetingParticipant.status = 'rejected'.
Client action: Caller dismisses calling UI, logs missed call.
```

### CALL_CANCEL

```
Event:       CALL_CANCEL
Direction:   Client → Server → Target Client
Trigger:     Caller cancels before callee answers
Sender:      Caller
Receiver:    Callee's socket room
Payload:     { callerId: string, meetingId: string }
Persistence: Meeting.status = 'ended'.
Client action: Callee dismisses incoming call UI if shown.
```

### WEBRTC_OFFER

```
Event:       WEBRTC_OFFER
Direction:   Client → Server → Target Client
Trigger:     Caller creates SDP offer after CALL_ACCEPT received
Sender:      Caller
Receiver:    Callee's socket room
Payload:     { targetUserId: string, offer: RTCSessionDescriptionInit }
Validation:  Users are valid participants in the meeting.
Persistence: NOT persisted (signaling only).
Client action: Callee calls setRemoteDescription(offer), creates answer.
```

### WEBRTC_ANSWER

```
Event:       WEBRTC_ANSWER
Direction:   Client → Server → Target Client
Trigger:     Callee creates SDP answer after receiving offer
Sender:      Callee
Receiver:    Caller's socket room
Payload:     { targetUserId: string, answer: RTCSessionDescriptionInit }
Persistence: NOT persisted.
Client action: Caller calls setRemoteDescription(answer).
```

### WEBRTC_ICE_CANDIDATE

```
Event:       WEBRTC_ICE_CANDIDATE
Direction:   Client → Server → Target Client (both directions)
Trigger:     RTCPeerConnection gathers a new ICE candidate
Sender:      Either peer
Receiver:    The other peer's socket room
Payload:     { targetUserId: string, candidate: RTCIceCandidateInit }
Persistence: NOT persisted.
Client action: addIceCandidate(candidate) on the peer connection.
             If setRemoteDescription not yet called: queue the candidate.
```

### CALL_END

```
Event:       CALL_END
Direction:   Client → Server → All Participants
Trigger:     Any participant ends or leaves the call
Sender:      Leaving participant
Receiver:    All remaining participants in meeting room
Payload:     { userId: string, meetingId: string }
Persistence: MeetingParticipant.leftAt set. If last: Meeting.endedAt set.
Client action: All peers close peerConnection for the leaving user.
             Cleanup media tracks for that peer.
```

### USER_BUSY

```
Event:       USER_BUSY
Direction:   Server → Caller Client
Trigger:     Server detects callee is already IN_CALL or IN_MEETING
Sender:      Server
Receiver:    Caller's socket room
Payload:     { targetUserId: string }
Client action: Show "User is busy" notification. Clean up call attempt.
```

## E.5 Frontend Implementation

### E.5.1 WebRTC Service

Create a singleton service (or custom hook) that manages the WebRTC lifecycle. Do not scatter WebRTC logic across multiple components.

```javascript
// client/src/services/webrtcService.js (follow existing service naming)

class WebRTCService {
  constructor() {
    this.peerConnections = new Map();  // peerId → RTCPeerConnection
    this.localStream = null;
    this.onRemoteStream = null;
    this.onConnectionStateChange = null;
  }

  async getIceServers() {
    // Fetch STUN/TURN config from backend (never hardcode TURN credentials)
    const res = await api.get('/api/meetings/ice-config');
    return res.data.iceServers;
  }

  async initLocalMedia(video = true, audio = true) { ... }
  async createPeerConnection(peerId) { ... }
  async createOffer(peerId) { ... }
  async handleOffer(peerId, offer) { ... }
  async handleAnswer(peerId, answer) { ... }
  async addIceCandidate(peerId, candidate) { ... }
  toggleMicrophone() { ... }
  toggleCamera() { ... }
  async startScreenShare() { ... }
  stopScreenShare() { ... }
  cleanup(peerId) { ... }
  cleanupAll() { ... }
}

export const webrtcService = new WebRTCService();
```

### E.5.2 Call State Machine

```javascript
// Call states
const CALL_STATES = {
  IDLE: 'idle',
  CALLING: 'calling',       // outgoing, waiting for answer
  RINGING: 'ringing',       // incoming, not yet accepted
  ACCEPTED: 'accepted',     // accepted, negotiating
  CONNECTING: 'connecting', // ICE in progress
  CONNECTED: 'connected',   // media flowing
  RECONNECTING: 'reconnecting',
  ENDED: 'ended',
  REJECTED: 'rejected',
  MISSED: 'missed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Valid transitions
const CALL_TRANSITIONS = {
  idle:         ['calling', 'ringing'],
  calling:      ['accepted', 'rejected', 'missed', 'cancelled', 'failed'],
  ringing:      ['accepted', 'rejected', 'ended'],
  accepted:     ['connecting', 'failed'],
  connecting:   ['connected', 'failed'],
  connected:    ['reconnecting', 'ended'],
  reconnecting: ['connected', 'failed', 'ended'],
  ended:        ['idle'],
  rejected:     ['idle'],
  missed:       ['idle'],
  failed:       ['idle'],
  cancelled:    ['idle']
};
```

Enforce valid transitions. Log invalid transition attempts. Reset to idle after terminal states.

### E.5.3 Incoming Call UI

A full-screen or prominent overlay that appears above all other UI:

```
┌─────────────────────────────────┐
│                                 │
│     📹 Incoming Video Call      │
│                                 │
│     ┌──────────────────┐        │
│     │    [Avatar]      │        │
│     └──────────────────┘        │
│                                 │
│         John Doe                │
│                                 │
│                                 │
│   ╔═══════╗    ╔═══════╗        │
│   ║  ❌   ║    ║  ✅   ║        │
│   ║ Decline║   ║ Accept║        │
│   ╚═══════╝   ╚═══════╝         │
│                                 │
└─────────────────────────────────┘
```

Dismiss automatically after 30 seconds (missed call). Show ringing animation.

### E.5.4 Active Call UI

```
┌──────────────────────────────────────────────┐
│  John Doe  •  Video Call  •  02:34           │
├──────────────────────────────────────────────┤
│                                              │
│         [Remote video — full width]          │
│                                              │
│                             ┌──────────────┐ │
│                             │ [Local video]│ │
│                             │  (small PiP) │ │
│                             └──────────────┘ │
│                                              │
├──────────────────────────────────────────────┤
│  [🎤 Mute]  [📹 Camera]  [📺 Share]  [📞 End]  │
└──────────────────────────────────────────────┘
```

Connection state indicator:
- `CONNECTING`: "Connecting..." spinner.
- `CONNECTED`: green dot + call duration timer.
- `RECONNECTING`: "Reconnecting..." pulsing indicator.
- `FAILED`: "Call failed. Connection could not be established." + retry option.

### E.5.5 Chat Integration

In the existing chat UI, add call initiation controls to the message input bar:

**1-to-1 conversation:**
```
┌──────────────────────────────────────────────┐
│ John Doe                         🟢 Online   │
│──────────────────────────────────────────────│
│ [message thread]                             │
│──────────────────────────────────────────────│
│ [Type a message...]         🎤  📹  ⋮        │
└──────────────────────────────────────────────┘
```

Icons: 🎤 = voice call, 📹 = video call.
If user is offline: disable call buttons, show tooltip "User is offline."
If user is busy: disable call buttons, show tooltip "User is in a call."

**Group conversation:**
```
┌──────────────────────────────────────────────┐
│ Engineering Team              8 members       │
│──────────────────────────────────────────────│
│ [message thread]                             │
│──────────────────────────────────────────────│
│ [Type a message...]         📹  👥  ⋮        │
└──────────────────────────────────────────────┘
```

Icons: 📹 = start group meeting, 👥 = view participants.

## E.6 Media Permission Handling

```javascript
async function requestMediaPermissions(video = true, audio = true) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
    return { stream, error: null };
  } catch (err) {
    switch (err.name) {
      case 'NotAllowedError':
        return {
          stream: null,
          error: {
            type: 'permission_denied',
            message: video
              ? 'Camera and microphone access was denied. Please allow access in your browser settings.'
              : 'Microphone access was denied. Please allow access in your browser settings.'
          }
        };
      case 'NotFoundError':
        return {
          stream: null,
          error: {
            type: 'device_not_found',
            message: video
              ? 'No camera found. You can continue with audio only.'
              : 'No microphone found.'
          }
        };
      case 'NotReadableError':
        return {
          stream: null,
          error: {
            type: 'device_in_use',
            message: 'Your camera or microphone is already in use by another application.'
          }
        };
      default:
        return { stream: null, error: { type: 'unknown', message: err.message } };
    }
  }
}
```

When video is denied but audio is available: offer audio-only fallback.
When audio is denied but video is available: offer video-only fallback (unusual but handle it).
When both denied: explain clearly with browser-specific instructions.

## E.7 ICE Configuration Endpoint

The backend must provide STUN/TURN configuration to the frontend without hardcoding credentials:

```
GET /api/meetings/ice-config
Authorization: required

Response:
{
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" },
    {
      "urls": "turn:your-turn-server.com:3478",
      "username": "generated-credential",
      "credential": "generated-secret"
    }
  ]
}
```

If using coturn with time-limited credentials, generate them server-side using HMAC. If using a managed TURN provider, fetch their API for credentials.

Environment variables (adapt to existing convention):
```
TURN_SERVER_URL=turn:your-turn.com:3478
TURN_USERNAME=your-username
TURN_CREDENTIAL=your-password
STUN_SERVER_URL=stun:stun.l.google.com:19302
```

## E.8 Phase E Completion Criteria

- [ ] CALL_INVITE → CALL_ACCEPT flow works end-to-end.
- [ ] SDP offer/answer exchange works.
- [ ] ICE candidates exchanged correctly.
- [ ] Video and audio render on both sides.
- [ ] Microphone mute/unmute works.
- [ ] Camera enable/disable works.
- [ ] Call end cleans up correctly on both sides.
- [ ] CALL_REJECT works and caller is notified.
- [ ] USER_BUSY works when callee is in another call.
- [ ] CALL_CANCEL works before callee answers.
- [ ] Media permission errors handled with clear UI.
- [ ] Audio-only fallback works when camera denied.
- [ ] ICE configuration served from backend (no hardcoded credentials).
- [ ] Two-browser test passes (same network).
- [ ] Two-browser test passes (different networks, requires TURN).
- [ ] Incoming call UI appears and dismisses correctly.
- [ ] Active call UI shows correct state transitions.
- [ ] Chat still works after implementing call feature.

## E.9 Stop Condition

**STOP AFTER PHASE E.**
Run the two-browser test. Verify chat regression. Report results. Wait for approval before Phase F.

---

# PHASE F — CALL CONTROLS & RECONNECTION

## F.1 Microphone Toggle

```javascript
function toggleMicrophone() {
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    // Update local UI state
    setIsMuted(!audioTrack.enabled);
    // Notify peers (they show mute indicator)
    socket.emit('PARTICIPANT_MIC_CHANGED', {
      meetingId,
      isMuted: !audioTrack.enabled
    });
    // Update MeetingParticipant in database
    api.patch(`/api/meetings/${meetingId}/participants/me`, { isMuted: !audioTrack.enabled });
  }
}
```

`audioTrack.enabled = false` silences the track without stopping it. The track remains in the peer connection. The remote peer still receives the track (silent). This is the correct approach — do not remove and re-add tracks for mute/unmute.

## F.2 Camera Toggle

```javascript
function toggleCamera() {
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOn(videoTrack.enabled);
    socket.emit('PARTICIPANT_CAMERA_CHANGED', {
      meetingId,
      isCameraOn: videoTrack.enabled
    });
    api.patch(`/api/meetings/${meetingId}/participants/me`, { isCameraOn: videoTrack.enabled });
  }
}
```

When remote peer disables camera: replace their video tile with avatar + name. Do not show a black rectangle.

## F.3 Screen Sharing

Screen sharing replaces the video track in the peer connection. It does not create a new peer connection.

```javascript
async function startScreenShare() {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'monitor',
        logicalSurface: true,
        cursor: 'always'
      },
      audio: false  // or true if system audio capture desired
    });

    const screenTrack = screenStream.getVideoTracks()[0];

    // Replace video track in all peer connections
    for (const [peerId, pc] of peerConnections) {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }
    }

    setIsScreenSharing(true);
    socket.emit('PARTICIPANT_SCREEN_SHARE_STARTED', { meetingId });

    // Handle user stopping screen share via browser's native stop button
    screenTrack.onended = () => {
      stopScreenShare();
    };

  } catch (err) {
    if (err.name === 'NotAllowedError') {
      // User cancelled the screen picker — not an error
    } else {
      console.error('Screen share failed:', err);
      showError('Screen sharing is not available in this browser.');
    }
  }
}

async function stopScreenShare() {
  // Restore camera track
  const cameraTrack = localStream.getVideoTracks()[0];
  if (cameraTrack) {
    for (const [peerId, pc] of peerConnections) {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(cameraTrack);
      }
    }
  }
  setIsScreenSharing(false);
  socket.emit('PARTICIPANT_SCREEN_SHARE_STOPPED', { meetingId });
}
```

**Browser limitations:**
- `getDisplayMedia()` requires user gesture (button click).
- Not available on iOS Safari or most mobile browsers.
- Only one participant can share screen at a time in the initial implementation. (Multiple screen shares would require additional tracks per peer — defer to SFU phase.)

## F.4 Reconnection Handling

When `iceConnectionState` transitions to `'disconnected'`:
1. Wait 5 seconds for automatic ICE recovery.
2. If state does not recover to `'connected'`: attempt ICE restart.

```javascript
peerConnection.oniceconnectionstatechange = () => {
  if (peerConnection.iceConnectionState === 'disconnected') {
    setCallState('reconnecting');
    reconnectionTimer = setTimeout(async () => {
      if (peerConnection.iceConnectionState !== 'connected') {
        await attemptIceRestart(peerId);
      }
    }, 5000);
  }
  if (peerConnection.iceConnectionState === 'connected') {
    clearTimeout(reconnectionTimer);
    setCallState('connected');
  }
  if (peerConnection.iceConnectionState === 'failed') {
    handleCallFailure(peerId, 'Connection could not be re-established.');
  }
};

async function attemptIceRestart(peerId) {
  const offer = await peerConnection.createOffer({ iceRestart: true });
  await peerConnection.setLocalDescription(offer);
  socket.emit('WEBRTC_OFFER', { targetUserId: peerId, offer });
}
```

When socket disconnects during a call:
1. The WebRTC media may continue if the ICE connection is still valid.
2. When socket reconnects: re-join the meeting socket room.
3. Re-sync participant state from the server.
4. If WebRTC also dropped: attempt full re-negotiation.

## F.5 Socket Events for Phase F

### PARTICIPANT_MIC_CHANGED

```
Event:       PARTICIPANT_MIC_CHANGED
Payload:     { meetingId, userId, isMuted }
Recipients:  All participants in meeting room
Client action: Update participant's mute indicator in UI.
```

### PARTICIPANT_CAMERA_CHANGED

```
Event:       PARTICIPANT_CAMERA_CHANGED
Payload:     { meetingId, userId, isCameraOn }
Recipients:  All participants in meeting room
Client action: Show avatar when isCameraOn=false. Show video when true.
```

### PARTICIPANT_SCREEN_SHARE_STARTED

```
Event:       PARTICIPANT_SCREEN_SHARE_STARTED
Payload:     { meetingId, userId }
Recipients:  All participants in meeting room
Client action: Show screen share indicator. May resize video tiles.
```

### PARTICIPANT_SCREEN_SHARE_STOPPED

```
Event:       PARTICIPANT_SCREEN_SHARE_STOPPED
Payload:     { meetingId, userId }
Recipients:  All participants in meeting room
Client action: Remove screen share indicator. Restore video tile layout.
```

## F.6 Phase F Completion Criteria

- [ ] Microphone toggle works and remote peer sees mute indicator.
- [ ] Camera toggle works and remote peer sees avatar when camera off.
- [ ] Screen share starts and remote peer sees shared screen.
- [ ] Screen share stops via controls and via browser's native stop button.
- [ ] ICE restart attempted on disconnection.
- [ ] Reconnection UI shown during disconnected state.
- [ ] Failed connection shows clear error.
- [ ] Socket reconnect restores meeting room membership.

## F.7 Stop Condition

**STOP AFTER PHASE F.**
Test on two different networks (one behind a NAT/mobile hotspot). Report. Wait for approval.

---

# PHASE G — GROUP MEETING

## G.1 Objective

Extend the 1-to-1 call to support up to 6 participants using mesh WebRTC. Each participant maintains a separate `RTCPeerConnection` for every other participant.

## G.2 Mesh Architecture for Groups

```
When participant P joins a meeting with N existing participants:
  P creates RTCPeerConnection for each existing participant (N connections).
  P creates SDP offer for each existing participant.
  Each existing participant receives P's offer, creates an answer.
  P receives all answers.
  ICE exchange happens for each pair.
  All N+1 participants are now connected to P.
```

The `peerConnections` Map from Phase E is already keyed by `peerId`. It naturally extends to multiple peers.

## G.3 Meeting Room Socket Pattern

When a participant joins a meeting, the server joins their socket to the meeting room:

```javascript
// Backend: when user joins meeting via socket event or REST
socket.join(`meeting:${meetingId}`);

// Emit to all others in the room
socket.to(`meeting:${meetingId}`).emit('PARTICIPANT_JOINED', {
  userId: socket.user._id,
  meetingId,
  user: { name, avatar }
});

// Send current participant list to the joining user
const participants = await MeetingParticipant.find({ meeting: meetingId, status: 'joined' })
  .populate('user', 'name avatar');
socket.emit('MEETING_CURRENT_PARTICIPANTS', { meetingId, participants });
```

## G.4 Joining Flow for Group Meeting

```
User clicks "Join Meeting" (from invite, notification, or calendar)
↓
Frontend calls POST /api/meetings/:id/join
↓
Backend validates authorization and participant count
↓
Backend returns meetingId + current participants
↓
Frontend emits MEETING_JOIN socket event
↓
Backend joins socket to meeting:{meetingId} room
↓
Backend emits PARTICIPANT_JOINED to all in room
↓
Backend emits MEETING_CURRENT_PARTICIPANTS to the joining user
↓
Frontend creates RTCPeerConnection for each existing participant
↓
Frontend sends WEBRTC_OFFER to each existing participant
↓
Each existing participant responds with WEBRTC_ANSWER
↓
ICE completes for all pairs
↓
Meeting is active — participant sees all video tiles
```

## G.5 Group Meeting Socket Events

### MEETING_JOIN

```
Event:       MEETING_JOIN
Direction:   Client → Server
Payload:     { meetingId }
Server action: Validate authorization. Join socket room. Emit PARTICIPANT_JOINED to room.
              Emit MEETING_CURRENT_PARTICIPANTS to joining socket.
```

### PARTICIPANT_JOINED

```
Event:       PARTICIPANT_JOINED
Direction:   Server → Room
Payload:     { userId, meetingId, user: { _id, name, avatar } }
Client action: Create new RTCPeerConnection for this participant.
              If current user is existing participant: send offer to new participant.
```

### MEETING_CURRENT_PARTICIPANTS

```
Event:       MEETING_CURRENT_PARTICIPANTS
Direction:   Server → Joining Client
Payload:     { meetingId, participants: [{ userId, name, avatar, isMuted, isCameraOn }] }
Client action: For each participant: create RTCPeerConnection, create offer, send via WEBRTC_OFFER.
```

### PARTICIPANT_LEFT

```
Event:       PARTICIPANT_LEFT
Direction:   Server → Room
Payload:     { userId, meetingId }
Client action: Close RTCPeerConnection for that participant.
              Remove their video tile.
              If they were host: show "Meeting host has left."
```

### MEETING_ENDED

```
Event:       MEETING_ENDED
Direction:   Server → Room
Payload:     { meetingId, endedBy: userId }
Client action: Cleanup all peer connections and media.
              Show "Meeting has ended." and navigate back.
```

## G.6 Video Grid Layout

For group meetings, display participants in a responsive grid:

```
1 participant:   [Full screen]
2 participants:  [50% | 50%]
3–4 participants: [2×2 grid]
5–6 participants: [2×3 grid]
Screen sharing:  [Large shared screen | Small participant thumbnails]
```

Active speaker detection (optional, implement if time allows): monitor `RTCRtpReceiver.getSynchronizationSources()` to detect which remote participant is loudest and highlight their tile.

## G.7 Pre-Join Screen

Before entering a group meeting, show a pre-join screen:

```
┌────────────────────────────────────────────┐
│  Engineering Sync                          │
│  3 participants waiting                    │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │        [Local Camera Preview]        │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  [🎤 Microphone: On]  [📹 Camera: On]      │
│                                            │
│  Your name: Aditya Kumar                   │
│                                            │
│             [Join Meeting]                 │
│                                            │
└────────────────────────────────────────────┘
```

The pre-join screen:
- Shows local camera preview.
- Allows microphone and camera toggle before joining.
- Shows who is already in the meeting.
- Confirms the user's display name.
- Does not initiate WebRTC until "Join Meeting" is clicked.

## G.8 Meeting Chat

Meeting chat reuses the existing conversation system:

- On meeting creation: create or reuse the associated Conversation document.
- If the meeting is created from an existing group conversation: use that conversation.
- If it is a standalone meeting: create a new Conversation with `type: 'meeting'`.
- In the meeting UI: render a chat panel that uses the existing message send/receive system.

This avoids creating a separate messaging architecture. The existing socket events for chat (`MESSAGE_SENT`, `NEW_MESSAGE`, etc.) work without modification inside the meeting panel.

## G.9 Phase G Completion Criteria

- [ ] Three-way call works (3 browsers, same network).
- [ ] Four-way call works.
- [ ] Participant join triggers correct offer creation by existing participants.
- [ ] Participant leave removes video tile and closes peer connection.
- [ ] Host ending meeting closes all connections.
- [ ] Pre-join screen shows camera preview.
- [ ] Video grid layout adapts to participant count.
- [ ] Meeting chat works.
- [ ] Participant count enforced (max 6).
- [ ] Existing 1-to-1 call still works.

## G.10 Stop Condition

**STOP AFTER PHASE G.**
Test with 3 browsers minimum. Report. Wait for approval before Phase H.

---

# PHASE H — CALENDAR & TASK INTEGRATION

## H.1 Calendar Integration

A Meeting can be associated with a calendar Event (from M2/M1):

```javascript
// When creating a scheduled meeting:
const meeting = await Meeting.create({ ... });
const event = await Event.create({
  title: meeting.title,
  startDateTime: meeting.scheduledAt,
  endDateTime: new Date(meeting.scheduledAt.getTime() + 60 * 60 * 1000), // 1hr default
  creator: req.user._id,
  participants: inviteeIds,
  context: 'work',
  // Link back to meeting
  meetingId: meeting._id
});

// Add meetingId to Event model if not present:
// meetingId: { type: ObjectId, ref: 'Meeting', default: null }

await Meeting.findByIdAndUpdate(meeting._id, { calendarEvent: event._id });
```

In the Calendar view (M2), events with a `meetingId` show a "Join Meeting" button that navigates to the meeting UI.

My Day (M3) shows scheduled meetings with a "Join" action.

## H.2 Project Integration

On the Project page (M5):

```
[Project: Authentication Service]

[Tasks] [Board] [Members] [Files] [Activity] [Meetings] ← NEW TAB

Meetings:
  Past:
    Aug 12 — Engineering Sync — 45 min — 4 participants  [View]

  Upcoming:
    Aug 20 — Sprint Planning — 10:00 AM                  [Join]

  [+ Start Meeting Now]
```

Clicking "Start Meeting Now" creates a meeting with `project: projectId` and invites all project members.

## H.3 Task Integration

On the Task detail view, add a "Discuss" action:

```
[Task: Fix Authentication Bug]
[Assignee: Aditya] [Due: Aug 15] [High]

[Edit] [Assign] [Comment] [Discuss] ← NEW

Clicking "Discuss":
- Opens a direct call with the task assignee (if different from current user).
- OR starts a quick meeting with all task participants.
```

This is a convenience action — it creates a Meeting with a reference to the task. Keep implementation simple.

## H.4 Phase H Completion Criteria

- [ ] Scheduled meeting creates calendar event.
- [ ] Calendar event shows "Join Meeting" button.
- [ ] My Day shows upcoming meetings with join action.
- [ ] Project meetings tab shows past and upcoming meetings.
- [ ] "Start Meeting Now" from project works.
- [ ] "Discuss" button on task creates appropriate meeting.
- [ ] Existing calendar and My Day functionality unchanged.

## H.5 Stop Condition

**STOP AFTER PHASE H.**
Report integration points. Wait for approval before Phase I.

---

# PHASE I — PRODUCTION DEPLOYMENT

## I.1 HTTPS Requirement

**WebRTC requires a secure context (HTTPS) in production.**

`getUserMedia()` and `getDisplayMedia()` will not work on HTTP except on `localhost`.

**Verify HTTPS is active on the current deployment.** If not, HTTPS must be configured before any WebRTC testing in production.

Most cloud platforms (Render, Railway, Vercel, Netlify) provide HTTPS automatically. If using a VPS with nginx, configure Let's Encrypt.

## I.2 STUN Configuration

STUN tells peers their public IP. Required for NAT traversal.

For development: Google's public STUN servers are acceptable.

For production: use a dedicated STUN server (coturn can serve both STUN and TURN, or use the same managed service for both).

```
stun:stun.l.google.com:19302
stun:stun1.l.google.com:19302
```

**Do not rely on Google's public STUN servers for production SLAs.** They are not guaranteed. Deploy your own or use a managed service.

## I.3 TURN Server

### Why TURN Is Required

When two peers are behind NAT (home routers, corporate firewalls, mobile networks), they cannot directly connect. STUN gives them their public IP, but:

- **Symmetric NAT** (common in corporate environments): each outgoing connection creates a different mapping. STUN alone fails.
- **Restrictive firewalls**: block UDP entirely. TURN over TCP/TLS is the only option.
- **Double NAT**: carrier-grade NAT on mobile networks.

Without TURN, an estimated 15–30% of real-world connections will fail silently.

### Self-Hosted coturn

coturn is the standard open-source TURN server.

Requires: a VPS with a public IP and sufficient bandwidth.

```bash
# Ubuntu install
apt-get install coturn

# /etc/turnserver.conf
listening-port=3478
tls-listening-port=5349
listening-ip=YOUR_SERVER_IP
relay-ip=YOUR_SERVER_IP
fingerprint
lt-cred-mech
server-name=turn.yourdomain.com
realm=yourdomain.com
user=username:password
log-file=/var/log/coturn/turnserver.log
```

Estimated bandwidth: 1 Mbps per participant pair relayed. Plan for 10× peak usage.

### Managed TURN Options

| Provider | Free Tier | Pricing | Notes |
|---|---|---|---|
| Metered.ca | 1 GB/month | ~$0.40/GB after | Good free tier |
| Twilio NTS | 100k minutes trial | Per-minute billing | Reliable, expensive at scale |
| Xirsys | Limited free | Various plans | Established provider |
| OpenRelay | Limited | Free community | Community-maintained |

For initial production deployment: **Metered.ca** is recommended (free tier covers small teams).

### TURN Credential Security

Generate short-term credentials server-side using HMAC:

```javascript
// server/utils/turnCredentials.js
const crypto = require('crypto');

function generateTurnCredentials(userId) {
  const ttl = 86400; // 24 hours
  const timestamp = Math.floor(Date.now() / 1000) + ttl;
  const username = `${timestamp}:${userId}`;
  const credential = crypto
    .createHmac('sha1', process.env.TURN_SECRET)
    .update(username)
    .digest('base64');
  return { username, credential, ttl };
}
```

coturn supports this with `use-auth-secret` configuration. This prevents credential abuse even if a client is compromised.

## I.4 Environment Variables

Add to `.env.example` (following existing naming convention):

```
# WebRTC / TURN Configuration
TURN_SERVER_URL=turn:your-turn-server.com:3478
TURN_SERVER_URLS_TLS=turns:your-turn-server.com:5349
TURN_USERNAME=your-username
TURN_CREDENTIAL=your-password
TURN_SECRET=your-hmac-secret
STUN_SERVER_URL=stun:stun.l.google.com:19302
```

**Never commit actual credentials to the repository.**

## I.5 Reverse Proxy and WebSocket

Verify that the current reverse proxy passes WebSocket upgrade headers:

For nginx:
```nginx
location /socket.io/ {
  proxy_pass http://backend;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_read_timeout 86400;  # Keep WebSocket connections alive
}
```

For Render/Railway: WebSockets are typically supported natively. Verify in deployment logs.

## I.6 Hosting Platform Considerations

| Platform | HTTPS | WebSocket | TURN | Notes |
|---|---|---|---|---|
| Render (Free) | ✅ | ✅ | ❌ | Cannot host TURN; use managed TURN |
| Render (Paid) | ✅ | ✅ | ❌ | Same; TURN must be separate |
| Railway | ✅ | ✅ | ❌ | Same |
| VPS (DigitalOcean, etc.) | Manual | ✅ | ✅ | Can host coturn on same server |
| Vercel (Frontend) | ✅ | ❌ | ❌ | Cannot host backend or WebSocket |

**Recommendation:** Deploy coturn on a separate small VPS (DigitalOcean $6/month Droplet is sufficient for a small team). Or use Metered.ca for managed TURN.

## I.7 Phase I Completion Criteria

- [ ] HTTPS confirmed active in production.
- [ ] STUN configuration documented and tested.
- [ ] TURN server deployed OR managed TURN service configured.
- [ ] TURN credentials generated server-side (not hardcoded).
- [ ] Environment variables documented in `.env.example`.
- [ ] ICE configuration endpoint (`GET /api/meetings/ice-config`) works in production.
- [ ] End-to-end call works in production between two different networks.
- [ ] Call works on mobile hotspot (tests TURN relay).

## I.8 Stop Condition

**STOP AFTER PHASE I.**
Run production connectivity test across different networks. Report. Wait for approval before Phase J.

---

# CALL STATE MACHINE (COMPLETE)

## For 1-to-1 Calls

```
IDLE
 │
 ├──(initiate call)──→ CALLING
 │                        │
 │                        ├──(accept)──→ ACCEPTED → CONNECTING → CONNECTED
 │                        │                                          │
 │                        ├──(reject)──→ REJECTED → IDLE            ├──(disconnect)── RECONNECTING
 │                        │                                          │                    │
 │                        ├──(timeout)─→ MISSED → IDLE              ├──(end)──→ ENDED → IDLE
 │                        │                                          │
 │                        └──(cancel)──→ CANCELLED → IDLE           └──(failure)──→ FAILED → IDLE
 │
 └──(receive call)──→ RINGING
                         │
                         ├──(accept)──→ ACCEPTED → CONNECTING → CONNECTED (same as above)
                         ├──(reject)──→ IDLE
                         └──(timeout)─→ MISSED → IDLE
```

## For Group Meetings

```
IDLE
 │
 ├──(create meeting)──→ WAITING
 │                        │
 │                        └──(first join)──→ ACTIVE
 │                                            │
 │                                            ├──(leave)──→ LEFT → IDLE
 │                                            └──(end)───→ ENDED → IDLE
 │
 └──(receive invite)──→ (pre-join screen)
                         │
                         ├──(join)──→ JOINING → ACTIVE (same as above)
                         └──(dismiss)──→ IDLE
```

---

# EDGE CASE MATRIX

| Scenario | Expected Behavior |
|---|---|
| Caller offline | Socket not reachable; REST endpoint validates, returns error to caller |
| Receiver offline | Server emits USER_OFFLINE to caller; caller sees "User offline" |
| Receiver rejects | CALL_REJECT emitted; caller sees "Call declined"; call cleaned up |
| Receiver busy | Server checks presence; emits USER_BUSY; caller sees "User is busy" |
| Caller cancels before answer | CALL_CANCEL emitted; callee incoming UI dismissed |
| Browser page refresh during call | WebRTC closed; on return, user can rejoin meeting via REST |
| Network disconnect (brief) | ICE disconnected state; 5s wait; ICE restart attempted |
| Network disconnect (permanent) | ICE failed; show "Connection lost"; offer rejoin option |
| Camera permission denied | Offer audio-only. Show instructions to enable in browser settings |
| Microphone permission denied | Offer video-only. Show instructions |
| No camera attached | getUserMedia fails with NotFoundError; audio-only mode |
| No microphone attached | Cannot join with audio; video-only option |
| TURN unavailable | ICE fails on restricted networks; show "Connection failed — check network" |
| STUN unavailable | Fallback to TURN; if TURN also fails, show error |
| Participant leaves group call | peerConnection for that peer closed; video tile removed |
| Host leaves group call | Transfer host to oldest remaining; show "Host has left" |
| All participants leave | Meeting.status = 'ended'; room cleaned up |
| Unauthorized user tries to join | API returns 403; socket join rejected |
| Meeting at max capacity | POST /api/meetings/:id/join returns 400 "Meeting is full" |
| Duplicate join (same user, two tabs) | Second join attempt returns existing participant record |
| Meeting already ended | POST /join returns 400 "Meeting has ended" |
| JWT expires during meeting | Socket disconnects; client must re-auth and rejoin |
| Socket disconnects during meeting | WebRTC may continue; socket reconnect re-joins room |
| Screen share ends via browser stop button | `track.onended` fires; stopScreenShare() called automatically |
| Screen share API unavailable (mobile) | Button hidden or shows "Screen sharing not supported on this device" |
| Device changes (headphones plugged in) | `devicechange` event; prompt user to select new device or auto-switch |
| WEBRTC_OFFER received before socket ready | Queue and process after socket established |
| ICE candidate received before setRemoteDescription | Queue candidates; apply after answer set |
| Meeting created but nobody joins | Meeting stays in 'waiting' status; auto-expire after 24 hours |
| SDP negotiation fails | Log error; show "Failed to connect. Try ending and restarting the call." |
| Multiple simultaneous offers (glare) | Implement offer collision handling using polite/impolite peer pattern |

---

# SECURITY REQUIREMENTS

## Authentication

- Every meeting API endpoint requires valid JWT. Use existing auth middleware.
- Every socket event that initiates or joins a meeting must validate meeting membership server-side.
- The ICE configuration endpoint (`GET /api/meetings/ice-config`) requires authentication. Do not expose TURN credentials to unauthenticated requests.

## Authorization

- Users can only join meetings they are invited to OR are members of the associated team/project.
- Only the meeting host or co-host can end the meeting or invite additional participants.
- The server must re-validate authorization on every socket event, not just on the initial connection.

## Meeting Isolation

- Users can only receive socket events for meetings they are authorized participants of.
- The backend must verify room membership before joining a socket to `meeting:{meetingId}`.
- Meeting IDs must use cryptographically random UUIDs (MongoDB ObjectIds are acceptable; do not use sequential integers that can be enumerated).

## TURN Credentials

- TURN credentials must never be hardcoded in source code.
- Use short-term HMAC credentials (24-hour TTL) rather than permanent credentials.
- Never log TURN credentials.

## Input Validation

- All meeting creation payloads must be validated (title length, invitee count, meeting type enum, dates).
- All socket event payloads must be validated before processing (meetingId exists, userId is participant, etc.).

## Rate Limiting

- `POST /api/meetings` — rate limited: 10 new meetings per user per hour.
- `POST /api/meetings/:id/invite` — rate limited: 20 invitations per meeting.
- `CALL_INVITE` socket event — rate limited: 5 call attempts per user per minute.
- `GET /api/meetings/ice-config` — rate limited: 30 per minute (prevents credential harvesting).

---

# PRIVACY REQUIREMENTS

- Never activate camera or microphone without explicit user action. getUserMedia() is called only when the user clicks "Start Call", "Join Meeting", or "Accept Call."
- The pre-join screen previews the camera only after the user has initiated the meeting join flow.
- Do not log or store audio or video streams.
- SDP offers and ICE candidates transit through the server (signaling relay) but are not persisted.
- Inform users in the meeting UI that the call is peer-to-peer and that the server relays only signaling (not media — unless TURN is in use, in which case media passes through the TURN server but is not logged).
- Meeting participant lists are visible only to meeting participants.

---

# OBSERVABILITY

## Logs to add (server-side)

```javascript
// Meeting events — always log
logger.info('meeting.created', { meetingId, createdBy, type, participantCount });
logger.info('meeting.started', { meetingId, startedAt });
logger.info('meeting.ended', { meetingId, endedAt, durationSeconds, participantCount });
logger.info('call.initiated', { meetingId, callerId, calleeId, callType });
logger.info('call.accepted', { meetingId, callerId, calleeId });
logger.info('call.rejected', { meetingId, callerId, calleeId });
logger.info('call.failed', { meetingId, reason });
logger.info('participant.joined', { meetingId, userId });
logger.info('participant.left', { meetingId, userId, durationSeconds });

// ICE events — log at debug level only
logger.debug('ice.state', { meetingId, userId, state });

// Never log:
// SDP content (contains session information)
// ICE candidate URLs (can expose internal network topology)
// TURN credentials
// Media stream content
// Audio levels
```

## Frontend metrics (optional, implement if time allows)

```javascript
// Log connection quality to backend for monitoring
const stats = await peerConnection.getStats();
// Extract: bytesReceived, bytesSent, packetsLost, jitter, roundTripTime
// POST to /api/meetings/:id/stats (non-blocking)
```

---

# PERFORMANCE DEFAULTS

Default media constraints for initial implementation:

```javascript
const DEFAULT_VIDEO_CONSTRAINTS = {
  width: { ideal: 1280, max: 1920 },
  height: { ideal: 720, max: 1080 },
  frameRate: { ideal: 24, max: 30 }
};

const DEFAULT_AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000
};

// When more than 4 participants: reduce video quality to preserve bandwidth
const GROUP_VIDEO_CONSTRAINTS = {
  width: { ideal: 640, max: 1280 },
  height: { ideal: 360, max: 720 },
  frameRate: { ideal: 15, max: 24 }
};
```

Apply `GROUP_VIDEO_CONSTRAINTS` automatically when more than 4 peers are connected.

---

# FUTURE SCOPE (Do Not Implement Now)

Document these explicitly as future work so they are not inadvertently implemented:

| Feature | Why Deferred | Migration Path |
|---|---|---|
| SFU (Mediasoup/Livekit) | Unnecessary for ≤6 participants | Signaling protocol designed to be SFU-compatible |
| Meeting recording | Requires server-side media capture, storage, encoding, consent | Future milestone with dedicated infrastructure |
| Webinar/broadcast mode | Requires SFU | Post-SFU migration |
| Live transcription | Requires ASR service | Post-SFU with media access |
| Virtual backgrounds | Client-side ML (TensorFlow.js) | Can be added independently |
| Breakout rooms | Complex state management | Requires SFU or multiple meetings |
| PSTN calling | Requires SIP/telephony bridge | Separate integration |
| >6 participant meetings | Bandwidth/CPU limits of mesh | SFU migration |
| End-to-end encryption (E2EE) | Complex key management | Future security milestone |
| Multiple simultaneous screen shares | Requires multiple video tracks per peer | SFU migration |

---

# TESTING STRATEGY

## Phase E/F/G Manual Browser Test Matrix

For each test, open the specified number of browser windows. Use different network conditions where noted.

| Test | Browsers | Network | Expected Result |
|---|---|---|---|
| 1-to-1 video call | 2 | Same network | Video and audio flow both ways |
| 1-to-1 video call | 2 | Different networks | Video and audio flow (TURN required) |
| 1-to-1 audio only | 2 | Same network | Audio flows both ways |
| Reject call | 2 | Same network | Caller sees "Declined" |
| Cancel call | 2 | Same network | Callee incoming UI closes |
| Mute microphone | 2 | Same network | Remote sees mute indicator |
| Disable camera | 2 | Same network | Remote sees avatar |
| Screen share | 2 | Same network | Remote sees screen content |
| Stop screen share | 2 | Same network | Remote sees camera restored |
| End call | 2 | Same network | Both UIs return to chat |
| Network disconnect | 2 | Throttle one | Reconnection UI shown |
| 3-way call | 3 | Same network | All see/hear each other |
| 4-way call | 4 | Same network | All see/hear each other |
| Participant joins late | 3+1 | Same network | New participant sees/hears all |
| Participant leaves | 3 | Same network | Tile removed, others unaffected |
| Camera permission denied | 2 | Same network | Audio-only option offered |
| Mic permission denied | 2 | Same network | Video-only option offered |
| Busy user called | 2 | Same network | Caller sees "User is busy" |
| Chat during meeting | 2 | Same network | Messages received in meeting panel |
| Chat regression | 2 | Same network | Existing chat still works |

## Browser Compatibility

| Browser | 1-to-1 Call | Group Call | Screen Share | Notes |
|---|---|---|---|---|
| Chrome 90+ | ✅ | ✅ | ✅ | Primary target |
| Edge 90+ | ✅ | ✅ | ✅ | Chromium-based |
| Firefox 90+ | ✅ | ✅ | ✅ | Slightly different ICE behavior |
| Safari 15+ | ✅ | ✅ | Limited | Some WebRTC limitations |
| iOS Safari | ✅ | ✅ | ❌ | No getDisplayMedia |
| Android Chrome | ✅ | ✅ | ❌ | No getDisplayMedia |

---

# REGRESSION CHECKLIST

After every phase, verify:

```
Existing system regression:
  [ ] Login works
  [ ] Signup works
  [ ] JWT validation works
  [ ] 1-to-1 chat: send message
  [ ] 1-to-1 chat: receive message in real time
  [ ] Group chat: send message
  [ ] Group chat: receive message in real time
  [ ] Socket reconnect restores chat
  [ ] Presence (online/offline) works
  [ ] Notifications work
  [ ] Task CRUD works
  [ ] Kanban drag-and-drop works
  [ ] Project pages work
  [ ] Calendar works
  [ ] My Day works
```

---

# DEFINITION OF DONE

The milestone is complete when **all** of the following are verified:

```
Core functionality:
  [ ] 1-to-1 video call works end-to-end
  [ ] 1-to-1 audio call works end-to-end
  [ ] Call invite / accept / reject works
  [ ] Microphone toggle works and is reflected to remote peer
  [ ] Camera toggle works and remote peer sees avatar
  [ ] Screen sharing works and stops cleanly
  [ ] Group meeting (≤6) works
  [ ] Participant join/leave handled correctly
  [ ] Meeting end works for host and all participants
  [ ] Pre-join screen with camera preview works
  [ ] Meeting chat (reusing existing system) works

Authorization & Security:
  [ ] Unauthorized users cannot join meetings (API + socket)
  [ ] TURN credentials not hardcoded; served from backend
  [ ] ICE config endpoint is authenticated
  [ ] Rate limiting on meeting creation and call invites
  [ ] Meeting IDs are not enumerable

Production readiness:
  [ ] HTTPS confirmed in production
  [ ] TURN server configured and tested
  [ ] Call works across different networks (mobile hotspot test)
  [ ] Environment variables documented in .env.example

Integration:
  [ ] Calendar shows scheduled meetings with Join button
  [ ] My Day shows upcoming meetings
  [ ] Project meetings tab functional
  [ ] Task "Discuss" button works

Regression:
  [ ] All existing chat functionality verified working
  [ ] All existing WebSocket events verified working
  [ ] All existing notification behavior verified working
  [ ] All existing task, project, calendar features verified working

Code quality:
  [ ] No sensitive credentials hardcoded
  [ ] No unnecessary media data persisted
  [ ] WebRTC code follows existing project conventions
  [ ] No duplicate chat or WebSocket architecture created
  [ ] Error states handled with meaningful user messages
  [ ] Mobile layout acceptable (at least audio call)

Documentation:
  [ ] TURN setup documented
  [ ] Environment variables documented
  [ ] SFU migration path documented
  [ ] Future scope items documented
  [ ] Decision log updated
```

---

*End of Document 06 — Real-Time Communication & Video Meetings.*

*This document belongs in `docs/` alongside the existing milestone documents.*
*Execute it after `02_AUTHORIZATION_AND_COLLABORATION.md` is verified complete.*
*Follow the phase-by-phase stop conditions. Do not implement multiple phases in one pass.*
