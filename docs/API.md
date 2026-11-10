# Mentor Connect — Backend API Reference

**Sprint:** Sprint 1 — Backend Engineering & Persistence Foundation  
**Backend Owner:** Sneha Viradiya  
**Base URL:** `http://localhost:5000/api`  
**Protocol:** REST over HTTP / JSON  

---

## 1. Global Conventions & Standards

### 1.1 Content Negotiation & Headers
- All request bodies must have `Content-Type: application/json`.
- All response bodies return `application/json; charset=utf-8`.

### 1.2 CORS & Rate Limits
- `CORS_ORIGIN` accepts comma-separated exact browser origins. Outside production, `http://localhost:5173` and `http://localhost:3000` are also allowed by default.
- Requests without an `Origin` header are allowed for command-line and server-to-server use. A browser origin outside the allowlist receives `403 CORS_ORIGIN_FORBIDDEN`. Wildcard origins are not supported with credentials.
- General API routes are limited to 100 requests per IP per 15 minutes. Registration and login are limited to 10 requests per IP per 15 minutes. `/api/health` is exempt.
- Rate-limited responses use HTTP `429`, code `TOO_MANY_REQUESTS`, and standard `RateLimit-*` headers.

### 1.3 Authentication Header
Endpoints requiring authentication must include the JWT bearer token in the HTTP `Authorization` header:
```http
Authorization: Bearer <jwt-token>
```

### 1.4 Standard Response Format

#### Success Response
```json
{
  "status": "success",
  "data": { ... }
}
```

#### Failure / Client Error Response (4xx)
```json
{
  "status": "fail",
  "code": "ERROR_CODE_ENUM",
  "message": "Human-readable explanation of error",
  "details": ["Optional array of granular field error messages"]
}
```

#### Server Error Response (5xx)
```json
{
  "status": "error",
  "code": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected internal error occurred on the server."
}
```

---

## 2. System Endpoints

### 2.1 Health Check
Checks service liveness and current execution environment.

- **URL:** `/api/health`
- **Method:** `GET`
- **Auth:** None (Public)
- **Response `200 OK`:**
```json
{
  "status": "ok",
  "message": "Mentor Connect API is running",
  "timestamp": "2026-10-28T06:05:00.000Z",
  "environment": "development"
}
```

---

## 3. Authentication & User Management (`/api/auth`)

### 3.1 Register User
Registers a new student or mentor account with bcrypt password hashing.

- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "name": "Sneha Viradiya",
  "email": "snehaviradiya@adypu.edu.in",
  "password": "SecurePassword123!",
  "role": "STUDENT"
}
```
*For `role: "MENTOR"`, optional profile fields (`title`, `category`, `bio`, `expertise`) may be supplied.*
Public registration supports `STUDENT` and `MENTOR` only. `ADMIN` accounts must be provisioned through a trusted administrative process.

- **Response `201 Created`:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "e963bc1e-6c0c-4619-a1b4-2b62799c8f00",
      "name": "Sneha Viradiya",
      "email": "snehaviradiya@adypu.edu.in",
      "role": "STUDENT",
      "createdAt": "2026-10-28T06:05:00.000Z"
    }
  }
}
```
- **Error Codes:**
  - `400 VALIDATION_ERROR`: Missing or malformed email, password < 6 characters.
  - `409 DUPLICATE_EMAIL`: Email is already registered.

### 3.2 Login User
Authenticates user and generates a session JWT token.

- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "email": "abhay@adypu.edu.in",
  "password": "Password123!"
}
```
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "name": "Abhay Kumar",
      "email": "abhay@adypu.edu.in",
      "role": "STUDENT"
    }
  }
}
```
- **Error Codes:**
  - `401 INVALID_CREDENTIALS`: Incorrect email or password.

### 3.3 Get Current User Profile
Retrieves the authenticated user's profile and linked mentor/mentee record.

- **URL:** `/api/auth/me`
- **Method:** `GET`
- **Auth:** Bearer Token required
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "...",
      "name": "Abhay Kumar",
      "email": "abhay@adypu.edu.in",
      "role": "STUDENT",
      "menteeProfile": {
        "id": "...",
        "university": "ADYPU",
        "major": "Computer Engineering"
      }
    }
  }
}
```
- **Error Codes:**
  - `401 UNAUTHORIZED`: Bearer token missing or malformed.
  - `401 TOKEN_INVALID`: Token expired or invalid signature.

---

## 4. Mentor APIs (`/api/mentors`)

### 4.1 List & Search Mentors
Retrieves mentors with database-side category filtering, full-text keyword search matching name, title, bio, skills, and mentoring topics, plus structured pagination.
Public mentor responses omit account email addresses and credentials.

- **URL:** `/api/mentors`
- **Method:** `GET`
- **Auth:** None (Public)
- **Query Parameters:**
  - `page` *(optional, default: `1`)*: Page number (positive integer >= 1).
  - `limit` *(optional, default: `10`)*: Number of items per page (integer between 1 and 50).
  - `category` *(optional)*: E.g., `Software Engineering`, `Data Science & AI`, `UI/UX Design`, `Cloud & DevOps`, `Product & Strategy`.
  - `search` or `q` *(optional)*: Keyword search query (e.g., `React`, `Kubernetes`, `Aarav`).
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "mentors": [
      {
        "id": "mentor-1",
        "name": "Aarav Sharma",
        "title": "Senior Frontend Engineer @ Fintech Labs",
        "category": "Software Engineering",
        "expertise": ["React", "TypeScript", "Web Performance", "Next.js"],
        "bio": "ADYPU alumnus with 6+ years in frontend architecture...",
        "sampleAvailability": "Tuesdays & Thursdays, 4:00 PM – 6:00 PM IST",
        "avatarInitials": "AS",
        "education": "B.Tech in Computer Engineering (ADYPU Alum)",
        "experience": "6+ years in industry",
        "mentoringTopics": ["Frontend Architecture", "Technical Interview Prep"]
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "mentors": [ ... ]
}
```
- **Error Codes:**
  - `400 VALIDATION_ERROR`: Invalid `page` (< 1) or `limit` (< 1 or > 50).

### 4.2 Get Mentor by ID
- **URL:** `/api/mentors/:id`
- **Method:** `GET`
- **Auth:** None (Public)
- **Response `200 OK`:** Returns detailed profile with current availabilities.
- **Error Codes:**
  - `404 MENTOR_NOT_FOUND`: Mentor ID not found.

### 4.3 Get Mentor Availability & Booked Slots
Retrieves configured availability slots for a mentor. When `date` is provided, validates format, evaluates specific-date and day-of-week recurring schedules, and cross-references active non-cancelled bookings to report slot occupancy accurately.

- **URL:** `/api/mentors/:id/availability?date=YYYY-MM-DD`
- **Method:** `GET`
- **Auth:** None (Public)
- **Query Parameters:**
  - `date` *(optional)*: Valid calendar date in `YYYY-MM-DD` format.
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "mentorId": "mentor-1",
    "date": "2026-11-01",
    "slots": [
      {
        "id": "...",
        "label": "10:00 AM – 11:00 AM IST",
        "isBookable": true,
        "isBooked": false
      },
      {
        "id": "...",
        "label": "05:30 PM – 06:30 PM IST (Simulated Conflict Slot)",
        "isBookable": false,
        "isBooked": true
      }
    ]
  }
}
```
- **Error Codes:**
  - `400 VALIDATION_ERROR`: Malformed or invalid `date` parameter.
  - `404 MENTOR_NOT_FOUND`: Mentor ID not found.

### 4.4 Update Mentor Availability
- **URL:** `/api/mentors/:id/availability`
- **Method:** `PUT`
- **Auth:** Bearer Token required (Mentor or Admin)
- **Request Body:** `{ "slots": ["10:00 AM – 11:00 AM IST", "02:00 PM – 03:00 PM IST"] }`
- **Response `200 OK`:** Returns updated slots list.
- **Error Codes:**
  - `403 FORBIDDEN`: Attempting to modify another mentor's schedule.

---

## 5. Booking & Scheduling APIs (`/api/bookings`)

### 5.1 Create Booking Request
Submits a booking request. Validates session dates (strictly valid future calendar dates) and time slots against the mentor's configured availability schedule. Enforces database-level concurrency protection via partial unique index `idx_bookings_active_unique` on `(mentorId, sessionDate, timeSlot)` where `status != 'cancelled'`. Concurrent attempts for the same mentor and slot return a guaranteed HTTP `409 SLOT_UNAVAILABLE`.
Guest requests may submit contact fields; authenticated students have their name, email, and mentee profile taken from the verified JWT identity instead. A guest-provided email is never used to establish account ownership.

- **URL:** `/api/bookings`
- **Method:** `POST`
- **Auth:** Optional (Guests or authenticated students)
- **Request Body:**
```json
{
  "mentorId": "mentor-1",
  "studentName": "Abhay Kumar",
  "studentEmail": "abhay@adypu.edu.in",
  "sessionDate": "2026-11-15",
  "timeSlot": "10:00 AM – 11:00 AM IST",
  "sessionTopic": "Architecture Review",
  "notes": "Portfolio review"
}
```

- **Response `201 Created`:**
```json
{
  "status": "success",
  "data": {
    "bookingId": "bk_11223344",
    "mentorId": "mentor-1",
    "mentorName": "Aarav Sharma",
    "sessionDate": "2026-11-15",
    "timeSlot": "10:00 AM – 11:00 AM IST",
    "status": "confirmed",
    "createdAt": "2026-10-28T06:05:00.000Z"
  }
}
```

- **Conflict Response `409 Conflict`:**
```json
{
  "status": "fail",
  "code": "SLOT_UNAVAILABLE",
  "message": "The selected time slot (2026-11-15 at 10:00 AM – 11:00 AM IST) is already booked for Aarav Sharma"
}
```

- **Validation Error `400 Bad Request`:**
```json
{
  "status": "fail",
  "code": "VALIDATION_ERROR",
  "message": "Invalid booking parameters provided",
  "details": ["sessionDate cannot be in the past"]
}
```

- **Slot Not Available / Not Bookable `400 Bad Request`:**
```json
{
  "status": "fail",
  "code": "SLOT_NOT_AVAILABLE",
  "message": "The selected time slot (11:45 PM – 12:45 AM IST) is not offered by Aarav Sharma on 2026-11-15."
}
```

- **Not Found `404 Not Found`:**
```json
{
  "status": "fail",
  "code": "MENTOR_NOT_FOUND",
  "message": "Mentor with ID mentor-99 does not exist"
}
```

### 5.2 List Bookings
- **URL:** `/api/bookings`
- **Method:** `GET`
- **Auth:** Bearer token required (`STUDENT`, `MENTOR`, or `ADMIN`).
- **Query Parameters:**
  - `studentEmail` *(optional, Admin only)*: Filter by student email address.
  - `mentorId` *(optional, Admin only)*: Filter by mentor ID.
  - `status` *(optional)*: `confirmed` | `cancelled` | `completed`.
- Students always receive bookings linked to their authenticated mentee profile. Mentors always receive bookings assigned to their authenticated mentor profile. Non-admin query filters cannot widen either scope.
- Admins can list all bookings and use the optional identity filters.
- **Response `200 OK`:** Returns matching booking records, including student email only to a student, assigned mentor, or admin authorized to see the booking.
- Missing authentication returns `401 UNAUTHORIZED`; unsupported roles return `403 FORBIDDEN`.

### 5.3 Get Booking by ID
- **URL:** `/api/bookings/:id`
- **Method:** `GET`
- **Auth:** Bearer token required (`STUDENT`, `MENTOR`, or `ADMIN`).
- **Response `200 OK`:** Returns single booking receipt details.
- **Error Codes:**
  - `401 UNAUTHORIZED`: Missing or invalid authentication.
  - `403 FORBIDDEN`: Authenticated role has no booking access.
  - `404 BOOKING_NOT_FOUND`: Booking does not exist or is unavailable to the caller.

### 5.4 Cancel Booking
Cancels an active booking and releases the slot for other students to reserve. Rejects invalid lifecycle transitions on already-cancelled or completed sessions.

- **URL:** `/api/bookings/:id/cancel`
- **Method:** `PATCH`
- **Auth:** Bearer token required. A student may cancel their own booking; a mentor may cancel a booking assigned to their profile; an admin may cancel any booking.
- **Response `200 OK`:**
```json
{
  "status": "success",
  "message": "Booking cancelled successfully. The time slot is now open for new reservations.",
  "data": {
    "bookingId": "bk_11223344",
    "status": "cancelled"
  }
}
```
- **Error Codes:**
  - `400 INVALID_STATUS_TRANSITION`: Booking is already cancelled or has been completed.
  - `401 UNAUTHORIZED`: Missing authentication.
  - `404 BOOKING_NOT_FOUND`: Booking does not exist or caller lacks authorization.

### 5.5 Reschedule Booking
Reschedules an active booking to a new date and time slot. Validates the slot against the mentor's configured availability, verifies date validity in the future, and prevents collisions via concurrency-safe atomic checks and unique constraints.

- **URL:** `/api/bookings/:id/reschedule`
- **Method:** `PATCH`
- **Auth:** Same ownership policy as cancellation.
- **Request Body:**
```json
{
  "sessionDate": "2026-11-25",
  "timeSlot": "02:00 PM – 03:00 PM IST"
}
```
- **Response `200 OK`:** Returns updated booking details.
- **Error Codes:**
  - `400 VALIDATION_ERROR`: Missing fields, malformed date, or a date in the past.
  - `400 INVALID_STATUS_TRANSITION`: Attempting to reschedule a cancelled or completed booking.
  - `400 SLOT_NOT_AVAILABLE`: Target slot is not offered in the mentor's availability schedule.
  - `409 SLOT_UNAVAILABLE`: The target slot is already booked.
  - `404 BOOKING_NOT_FOUND`: Booking does not exist or is unavailable to the caller.

## 6. Dashboards (`/api/dashboard`)

Both endpoints use the authenticated user ID and linked profile from JWT middleware. Each dashboard is fetched with a single nested Prisma query. Session date partitions compare the stored `YYYY-MM-DD` value with today's UTC date; cancelled bookings are reported separately. Empty booking histories return empty arrays and zero counts.

### 6.1 Student Dashboard
- **URL:** `/api/dashboard/student`
- **Method:** `GET`
- **Auth:** Bearer token required; role `STUDENT` only.
- **Response `200 OK`:** `data.student` contains `profile` (`id`, name, email, avatar, university, major, graduation year), `summary` (`totalBookings`, `upcomingSessions`, `pastSessions`, `cancelledSessions`), the corresponding session arrays, and `recentActivity` (up to five most recently created bookings).
- Session entries include the booking ID, mentor's public profile fields, date, time slot, topic, status, and creation time. No password or token is returned.
- **Errors:** `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 PROFILE_NOT_FOUND`.

### 6.2 Mentor Dashboard
- **URL:** `/api/dashboard/mentor`
- **Method:** `GET`
- **Auth:** Bearer token required; role `MENTOR` only.
- **Response `200 OK`:** `data.mentor` contains `profile`, `summary` (`totalBookings`, `upcomingAppointments`, `pastAppointments`, `cancelledAppointments`), the corresponding appointment arrays, `availabilitySummary`, and `recentActivity` (up to five most recently created bookings).
- Appointment entries contain student contact fields only for bookings assigned to the authenticated mentor. Availability summary reports total/bookable slots and weekly/dated slot counts.
- **Errors:** `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 PROFILE_NOT_FOUND`.

---

## 7. Mentorship Sessions Lifecycle (`/api/sessions`)

Derived directly from confirmed booking records, sessions manage the complete live mentorship lifecycle: `SCHEDULED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`. Access is strictly scoped to the assigned student, mentor, and administrators.

### 7.1 Create / Derive Session
Derives or creates a persistent mentorship session linked to an existing confirmed booking. Automatically provisions a stable meeting room identifier (`mentor-connect-session-{sessionId}`).

- **URL:** `/api/sessions`
- **Method:** `POST`
- **Auth:** Bearer token required (assigned student, assigned mentor, or admin).
- **Request Body:**
```json
{
  "bookingId": "bk_11223344"
}
```
- **Response `201 Created`:**
```json
{
  "status": "success",
  "message": "Mentorship session created successfully.",
  "data": {
    "session": {
      "id": "sess_l84f93a1_k29p",
      "bookingId": "bk_11223344",
      "mentorId": "mentor-1",
      "studentId": "usr-uuid-student",
      "status": "SCHEDULED",
      "meetingRoomId": "mentor-connect-session-sess_l84f93a1_k29p",
      "startedAt": null,
      "completedAt": null,
      "cancelledAt": null,
      "createdAt": "2026-11-10T20:45:00.000Z",
      "booking": {
        "id": "bk_11223344",
        "studentName": "Sneha Viradiya",
        "studentEmail": "sneha@adypu.edu.in",
        "sessionDate": "2026-11-20",
        "timeSlot": "10:00 AM – 11:00 AM IST",
        "sessionTopic": "System Architecture Review",
        "status": "confirmed",
        "mentorName": "Aarav Sharma",
        "mentorTitle": "Senior Frontend Engineer @ Fintech Labs"
      }
    }
  }
}
```
- **Error Codes:**
  - `400 INVALID_BOOKING_STATUS`: Booking is cancelled.
  - `403 FORBIDDEN`: Caller is not assigned to the booking.
  - `404 BOOKING_NOT_FOUND`: Booking does not exist.
  - `409 SESSION_ALREADY_EXISTS`: A session is already linked to this booking.

### 7.2 List User Sessions
- **URL:** `/api/sessions`
- **Method:** `GET`
- **Query Parameters:** `status` (optional: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
- **Auth:** Bearer token required. Returns only the authenticated user's sessions.

### 7.3 Get Session Details
- **URL:** `/api/sessions/:id`
- **Method:** `GET`
- **Auth:** Bearer token required.

### 7.4 Session Lifecycle Status Transitions
- `PATCH /api/sessions/:id/start`: Transitions session to `IN_PROGRESS` and records `startedAt`.
- `PATCH /api/sessions/:id/complete`: Transitions session to `COMPLETED`, records `completedAt`, and sets linked booking status to `completed`.
- `PATCH /api/sessions/:id/cancel`: Transitions session to `CANCELLED`, records `cancelledAt`, and releases linked booking status to `cancelled`.

---

## 8. Embedded Video Meeting Integration (`/api/sessions/:id/meeting`)

Integrates Jitsi Meet video calls natively into the mentorship session workspace.

### 8.1 Retrieve Meeting Details & Room Configuration
- **URL:** `/api/sessions/:id/meeting`
- **Method:** `GET`
- **Auth:** Bearer token required (assigned student, assigned mentor, or admin only).
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "meeting": {
      "sessionId": "sess_l84f93a1_k29p",
      "bookingId": "bk_11223344",
      "domain": "meet.jit.si",
      "roomName": "mentor-connect-session-sess_l84f93a1_k29p",
      "meetingUrl": "https://meet.jit.si/mentor-connect-session-sess_l84f93a1_k29p",
      "sessionStatus": "SCHEDULED",
      "canJoin": true,
      "statusNotice": null,
      "userRole": "moderator",
      "participant": {
        "id": "usr-mentor-id",
        "name": "Aarav Sharma",
        "email": "aarav.sharma@mentorconnect.adypu.edu.in",
        "avatar": null
      },
      "config": {
        "subject": "System Architecture Review",
        "startWithAudioMuted": false,
        "startWithVideoMuted": false,
        "prejoinPageEnabled": true
      }
    }
  }
}
```
- **Lifecycle Access Rule:** If the session is `COMPLETED` or `CANCELLED`, `canJoin` returns `false` with a descriptive `statusNotice` preventing post-session intrusions.
- **Environment Configuration:**
  - `JITSI_DOMAIN`: Domain of the Jitsi instance (defaults to `meet.jit.si`).
  - `JITSI_APP_ID`: (Optional) 8x8 JaaS application ID for enterprise hosting.
  - `JITSI_JWT_SECRET`: (Optional) JaaS JWT secret for signed meeting tokens.

---

## 9. Real-Time Session Chat (Socket.IO & REST)

Provides real-time and persistent bidirectional messaging during mentorship consultations.

### 9.1 WebSocket Handshake & Events
- **Transport:** WebSocket / Polling via Socket.IO.
- **Handshake Authentication:** Must supply JWT token in `auth.token` or `headers.authorization`.
- **Client → Server Events:**
  - `join_session`: `{ sessionId: string }` — Verifies session membership, joins room `session:{id}`.
  - `send_message`: `{ sessionId: string, content: string, messageType?: 'TEXT' | 'RESOURCE_LINK' }` — Persists to DB and broadcasts.
  - `leave_session`: `{ sessionId: string }` — Leaves room.
- **Server → Client Events:**
  - `new_message`: Emitted to session room upon new message creation.
  - `user_joined` / `user_left`: Presence indicators.

### 9.2 REST Message History
- **URL:** `/api/sessions/:id/messages`
- **Method:** `GET`
- **Query Parameters:** `page` (default 1), `limit` (default 50, max 100).
- **Response `200 OK`:** Returns paginated messages ordered by `createdAt: asc`.

### 9.3 REST Send Message
- **URL:** `/api/sessions/:id/messages`
- **Method:** `POST`
- **Request Body:** `{ "content": "Hello mentor!", "messageType": "TEXT" }`
- **Response `201 Created`:** Persists message and broadcasts event to any connected WebSocket clients.

---

## 10. Session Resources & Verified Reviews

### 10.1 Session Resources
- **`GET /api/sessions/:id/resources`**: Retrieves links and materials shared in the session.
- **`POST /api/sessions/:id/resources`**: Shares a new resource link (`title`, `url`, optional `description`).

### 10.2 Verified Completed-Session Reviews
Enforces that reviews are tied to genuine, completed consultations:
- **URL:** `/api/sessions/:id/reviews`
- **Method:** `POST`
- **Auth:** Assigned student only.
- **Enforcements:**
  - Session status must be `COMPLETED` (returns `400 SESSION_NOT_COMPLETED` otherwise).
  - Only one review allowed per student per session (returns `409 REVIEW_ALREADY_EXISTS` on duplicates).
  - Rating must be an integer between 1 and 5.
- **Request Body:**
```json
{
  "rating": 5,
  "comment": "Exceptional guidance on database indexing and query optimization.",
  "tags": ["Clear Explanations", "System Design Depth"]
}
```

### 10.3 Mentor Public Verified Reviews
- **URL:** `/api/mentors/:id/reviews`
- **Method:** `GET`
- **Auth:** Public.
- **Response `200 OK`:** Returns verified reviews and calculated average rating across all completed sessions.

