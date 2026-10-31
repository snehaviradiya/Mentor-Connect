# Sprint 2 Audit

## Current Architecture
- Express server with route modules for auth, mentors, bookings, and dashboard.
- Prisma ORM with SQLite in‑memory DB for tests.
- JWT based authentication with optional authentication middleware.

## Existing Working Features
- Authentication (register, login, profile).
- Mentor discovery and availability management.
- Booking creation, conflict detection, cancellation, and rescheduling.
- Health endpoint.

## Booking Authorization Risks
- Previously required authentication for any list operation, preventing public queries needed by some UI components.
- Student email could be exposed to other users when fetching a specific booking.

## Data Privacy Risks
- Student email was returned for unauthenticated requests and for mentors/admins unless explicitly hidden.

## Dashboard API Gaps
- Dashboard routes existed but were not mounted or documented.
- Controllers correctly enforce role checks.

## Test Coverage Gaps (now addressed)
- Public filtering of bookings by `studentEmail` or `mentorId`.
- Public access to single booking with email hidden.
- Dashboard route tests now pass.

## Implementation Plan (completed)
- Added unauthenticated public filters in `listBookings`.
- Adjusted response shaping to hide student email for non‑owners.
- Updated `getBookingById` to allow public access with hidden email.
- Implemented dashboard routes and mounting in `app.js`.
- Updated tests accordingly.
- Populated this audit document.
