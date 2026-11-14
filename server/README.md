# Mentor Connect — Backend Service

**Stack:** Node.js, Express.js, Prisma ORM, SQLite, JWT, bcryptjs, Vitest, Supertest
**Base URL:** `http://localhost:5000/api`

## Overview

The backend provides account and profile APIs, mentor discovery and availability, bookings, role-scoped dashboards, session lifecycle, chat, shared resources, reviews, notifications, and meeting configuration. Booking records and private profile data are scoped to authenticated users and roles.

## Quick Start

### Prerequisites

- Node.js 20 or newer
- npm

### Configure and install

```bash
cp .env.example .env
npm install
```

Set `JWT_SECRET` in `.env` to a private random value of at least 32 characters. For example:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Do not use a public or committed JWT secret in a deployed environment. The local database is SQLite (`DATABASE_URL="file:./dev.db"`).

### Migrate and seed local demo data

```bash
npx prisma migrate deploy
npm run db:seed
```

Seeding upserts illustrative local accounts and mentor profiles; it does not delete the database. Existing mentor availability is preserved, and demo slots are added only when none exist. Use this for local development, not as production account provisioning.

### Start the API

```bash
npm run dev
```

The server listens on [http://localhost:5000](http://localhost:5000). Verify it with:

```bash
curl http://localhost:5000/api/health
```

## Available npm Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Express with Node `--watch` auto-reloading |
| `npm start` | Starts the API |
| `npm test` | Creates a temporary SQLite database, applies migrations and seed data, runs Vitest, and removes that database |
| `npm run db:migrate` | Runs Prisma's development migration workflow |
| `npm run db:generate` | Generates the Prisma Client |
| `npm run db:seed` | Upserts local demo users, mentors, availability, and sample booking data |
| `npm run db:studio` | Opens Prisma Studio |

The test runner uses its own temporary database and a test-only JWT secret; it does not use or clear the development database.

## API Architecture

```text
server/src/
├── app.js                    # Express app configuration and middleware
├── server.js                 # HTTP listener, JWT configuration check, graceful shutdown
├── prisma.js                 # Prisma client
├── controllers/               # Account, mentor, booking, dashboard, and session operations
├── middleware/                # JWT authorization, validation, and error handling
├── routes/                    # /api/auth, /api/mentors, /api/bookings, /api/sessions, /api/dashboard
└── test/                      # API, authorization, booking, and session integration tests
```

## Documentation and Database Notes

- [Complete REST API reference](../docs/API.md)
- [Database schema and notes](../docs/DATABASE.md)
- The checked-in Prisma schema currently targets SQLite. A production database provider and deployment configuration are not included.
