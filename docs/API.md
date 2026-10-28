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

### 1.2 Authentication Header
Endpoints requiring authentication must include the JWT bearer token in the HTTP `Authorization` header:
```http
Authorization: Bearer <jwt-token>
```

### 1.3 Standard Response Format

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
Retrieves all mentors with domain filtering and keyword search matching name, title, bio, or skills.

- **URL:** `/api/mentors`
- **Method:** `GET`
- **Auth:** None (Public)
- **Query Parameters:**
  - `category` *(optional)*: E.g., `Software Engineering`, `Data Science & AI`, `UI/UX Design`, `Cloud & DevOps`.
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
        "email": "aarav.sharma@mentorconnect.adypu.edu.in",
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
    "total": 1
  }
}
```

### 4.2 Get Mentor by ID
- **URL:** `/api/mentors/:id`
- **Method:** `GET`
- **Auth:** None (Public)
- **Response `200 OK`:** Returns detailed profile with current availabilities.
- **Error Codes:**
  - `404 MENTOR_NOT_FOUND`: Mentor ID not found.

### 4.3 Get Mentor Availability & Booked Slots
Retrieves configured availability slots for a mentor. When `date` is provided, cross-references active bookings to show which slots are already reserved.

- **URL:** `/api/mentors/:id/availability?date=YYYY-MM-DD`
- **Method:** `GET`
- **Auth:** None (Public)
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
Submits a booking request. Enforces atomic transactional conflict verification so two students cannot book the same mentor slot concurrently.

- **URL:** `/api/bookings`
- **Method:** `POST`
- **Auth:** Optional (Guests or authenticated students)
- **Request Body:**
```json
{
  "mentorId": "mentor-1",
  "studentName": "Abhay Kumar",
  "studentEmail": "abhay@adypu.edu.in",
  "sessionDate": "2026-11-01",
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
    "studentName": "Abhay Kumar",
    "studentEmail": "abhay@adypu.edu.in",
    "sessionDate": "2026-11-01",
    "timeSlot": "10:00 AM – 11:00 AM IST",
    "sessionTopic": "Architecture Review",
    "notes": "Portfolio review",
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
  "message": "The selected time slot (2026-11-01 at 05:30 PM – 06:30 PM IST (Simulated Conflict Slot)) is already booked for Aarav Sharma"
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
- **Query Parameters:**
  - `studentEmail` *(optional)*: Filter by student email address.
  - `mentorId` *(optional)*: Filter by mentor ID.
  - `status` *(optional)*: `confirmed` | `cancelled` | `completed`.
- **Response `200 OK`:** Returns array of matching booking records.

### 5.3 Get Booking by ID
- **URL:** `/api/bookings/:id`
- **Method:** `GET`
- **Response `200 OK`:** Returns single booking receipt details.
- **Error Codes:**
  - `404 BOOKING_NOT_FOUND`: Booking ID not found.

### 5.4 Cancel Booking
Cancels the booking and releases the slot for other students to reserve.

- **URL:** `/api/bookings/:id/cancel`
- **Method:** `PATCH`
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

### 5.5 Reschedule Booking
Reschedules a booking to a new date and time slot, atomically ensuring the target slot is unoccupied.

- **URL:** `/api/bookings/:id/reschedule`
- **Method:** `PATCH`
- **Request Body:**
```json
{
  "sessionDate": "2026-11-20",
  "timeSlot": "02:00 PM – 03:00 PM IST"
}
```
- **Response `200 OK`:** Returns updated booking details.
- **Error Codes:**
  - `409 SLOT_UNAVAILABLE`: The target slot is already booked.
