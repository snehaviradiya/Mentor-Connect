# Mentor Connect — Backend Service

**Backend Ownership:** Sneha Viradiya  
**Stack:** Node.js, Express.js, Prisma ORM, SQLite / PostgreSQL, JWT, bcryptjs, Vitest, Supertest  
**Base URL:** `http://localhost:5000/api`  

---

## 1. Overview

The Mentor Connect backend provides the core APIs, business logic, scheduling engine, and database persistence layer for the Mentor Connect platform. It supports user registration, authentication, mentor profile discovery, slot availability management, and concurrency-safe appointment booking.

---

## 2. Quick Start

### 2.1 Prerequisites
- Node.js v20+ (developed and verified on v25.3.0)
- npm v10+ (verified on v11.7.0)

### 2.2 Setup Environment
```bash
cp .env.example .env
```
Default configuration points to SQLite for local development (`DATABASE_URL="file:./dev.db"`).

### 2.3 Install Dependencies
```bash
npm install
```

### 2.4 Apply Database Migrations & Seed Data
```bash
npm run db:migrate
npm run db:seed
```
This sets up the relational database and populates 8 mentor profiles with full availability schedules, an admin user, a student account, and sample bookings.

### 2.5 Start Development Server
```bash
npm run dev
```
The server will start on [http://localhost:5000](http://localhost:5000) with watch mode enabled.

---

## 3. Available npm Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Express server with Node `--watch` auto-reloading |
| `npm start` | Starts Express server in production mode |
| `npm test` | Runs the automated test suite with Vitest (38 unit & integration tests) |
| `npm run db:migrate` | Runs Prisma schema migrations |
| `npm run db:generate` | Generates the Prisma Client |
| `npm run db:seed` | Populates database with canonical mentors, users, and availability |
| `npm run db:studio` | Opens Prisma Studio GUI at `http://localhost:5555` |

---

## 4. API Architecture

```
server/src/
├── app.js                    # Express app configuration & middleware pipeline
├── server.js                 # HTTP listener & graceful shutdown handlers
├── prisma.js                 # Singleton Prisma client instance
├── controllers/
│   ├── authController.js     # User registration, login, and profile lookup
│   ├── mentorController.js   # Mentor directory, keyword search, & availability
│   └── bookingController.js  # Booking creation, conflict verification, & cancellation
├── middleware/
│   ├── auth.js               # JWT authentication & role-based authorization
│   ├── validator.js          # Input validation & sanitization
│   └── errorHandler.js       # Centralized error formatting & status handler
├── routes/
│   ├── authRoutes.js         # /api/auth/*
│   ├── mentorRoutes.js       # /api/mentors/*
│   └── bookingRoutes.js      # /api/bookings/*
└── test/
    ├── health.test.js        # Health check & 404 tests
    ├── auth.test.js          # Registration, login, JWT verification tests
    ├── mentors.test.js       # Discovery, search, and availability tests
    └── bookings.test.js      # Concurrency, double-booking prevention, & cancellation tests
```

---

## 5. Documentation Links

- **Backend Architecture Audit:** [`docs/BACKEND_AUDIT.md`](../docs/BACKEND_AUDIT.md)
- **Complete REST API Specification:** [`docs/API.md`](../docs/API.md)
- **Database Schema & PostgreSQL Guide:** [`docs/DATABASE.md`](../docs/DATABASE.md)
