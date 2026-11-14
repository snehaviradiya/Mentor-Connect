# Mentor Connect

**Institution:** ADYPU (Ajeenkya DY Patil University)  
**Repository (Submission):** [https://github.com/snehaviradiya/Mentor-Connect](https://github.com/snehaviradiya/Mentor-Connect)  
**Upstream Team Repository:** [https://github.com/Abhay750/Mentor-Connect.git](https://github.com/Abhay750/Mentor-Connect.git)  
**Status:** Full-stack academic project; core account, discovery, booking, dashboard, and session workflows are implemented and tested.

---

## 1. Project Overview

### Problem Statement
Undergraduate students frequently face challenges finding timely, personalized academic and career mentorship. Traditional mentorship channels—such as ad-hoc email outreach, informal networking events, or disparate messaging boards—lack structured scheduling, reliable tracking, and contextual matching. As a result, students miss critical guidance opportunities, while prospective mentors lack a centralized platform to manage availability and connect efficiently.

### Objectives
- **Centralize Mentorship:** Establish a unified web portal bridging students and mentors across disciplines.
- **Streamline Scheduling:** Provide transparent, real-time availability viewing and friction-free appointment bookings.
- **Facilitate Collaboration:** Integrate direct communication via text chat and virtual video meetings.
- **Track Progress:** Equip students and mentors with dashboards to manage sessions, agendas, and follow-ups.

---

## 2. Features

- **Accounts:** Student and mentor registration, login, JWT authentication, account/profile updates, and role-scoped routes.
- **Mentor discovery:** Live, searchable and filterable directory, public profiles, and structured weekly availability display.
- **Scheduling:** Mentor-managed weekly/date-specific availability, booking confirmation, cancellation and rescheduling, with server- and database-level protection against double booking.
- **Dashboards:** Student and mentor booking/session views, including upcoming, past, and cancelled sessions. Student learning goals are currently client-side state and are not synchronized to the server.
- **Session workspace:** Session lifecycle, chat, shared resources, reviews, notifications, and embedded Jitsi meeting integration.
- **Demo fixtures:** The seed command creates illustrative local accounts, mentors, availability, and a sample booking. The production client does not silently substitute fixture data when the live directory is unavailable.

---

## 3. Feature Status Table

| Feature | Scope / Description | Proposed Owner(s) | Status |
| :--- | :--- | :--- | :--- |
| **Mentor Discovery & Profiles** | Live mentor search/filtering, public profiles, profile editing | Project team | **Implemented** |
| **Availability & Booking** | Weekly/date-specific slots, booking, cancellation, rescheduling, conflict prevention | Project team | **Implemented** |
| **Authentication & Accounts** | Student/mentor signup and login, JWT, profile retrieval/updates, authorization | Project team | **Implemented** |
| **Dashboards** | Student/mentor session and booking views; local-only learning goals | Project team | **Implemented with documented persistence limitation** |
| **Sessions, Chat & Video** | Session lifecycle, chat, resource sharing, reviews, Jitsi integration | Project team | **Implemented; external video service configuration may be required** |
| **Production deployment** | Hosted environment, deployment automation, production database | Project team | **Not included in this repository setup** |

---

## 4. Proposed Technology Stack

- **Frontend:** [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Backend:** [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Styling & UI:** Modern Vanilla CSS / Component Styling
- **Database & Data Layer:** [Prisma ORM](https://www.prisma.io/) with SQLite in the checked-in schema. A production database migration/deployment configuration is not included.
- **Version Control:** Git & GitHub

---

## 5. Team Members & Proposed Ownership

> **Notice:** The team assignments below represent proposed responsibilities and are subject to review and final confirmation by the project team.

| Member | Proposed Ownership & Responsibilities *(To Be Confirmed)* |
| :--- | :--- |
| **Abhay Kumar** | Frontend architecture, booking UI, frontend/backend integration, and final system integration |
| **Sneha Viradiya** | Backend APIs, scheduling logic, data validation, database schemas, and service stability |
| **Jiya Srivastava** | UI/UX design, student dashboard interface, meeting experience, and accessibility (a11y) standards |

---

## 6. Development Roadmap

- [x] **Milestone 1 — Initial Setup & Documentation**
  - Repository initialization and branch structure setup
  - Project documentation (`README.md`) and repository hygiene (`.gitignore`)
  - Team alignment and responsibility proposal
- [x] **Milestone 2 — System Architecture & Scaffolding**
  - Database schema definition (Prisma ORM relational models)
  - Vite + React frontend scaffolding and base design system
  - Environment configuration (`.env.example`) and API contracts (`docs/API.md`)
- [x] **Core full-stack workflows** — accounts, mentor discovery and profiles, availability, booking, dashboards, session lifecycle, chat/resources, reviews, and video meeting integration.
- [x] **Verification** — isolated server integration tests, client component tests, and production client build.
- [ ] **Deployment and remaining product polish** — production hosting/database setup, end-to-end testing against a deployed stack, accessibility audit, persistent learning goals, and session reminders.

---

## 7. Installation & Setup

### Prerequisites
- **Node.js**: v20+ recommended (verified on v26.7.0)
- **npm**: v10+ recommended (verified on v11.19.0)

### Backend Setup
1. Configure and install the server:
   ```bash
   cd server
   cp .env.example .env
   npm install
   ```
2. Set `JWT_SECRET` in `.env` to a private random value of at least 32 characters. For example:
   ```bash
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```
3. Apply the checked-in Prisma migrations and seed local demo data:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
4. Start the API:
   ```bash
   npm run dev
   ```
   The API listens on `http://localhost:5000`; check `http://localhost:5000/api/health`.

### Frontend Setup
1. In a separate terminal, install dependencies and start Vite:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` requests to the local server.

### Tests and production build
```bash
cd server && npm test
cd ../client && npm test && npm run build
```
The server test runner creates a temporary SQLite database, applies migrations and seed data, runs tests, and removes only that temporary database.

See [`server/README.md`](./server/README.md), [`client/README.md`](./client/README.md), and [`docs/API.md`](./docs/API.md) for additional details.

---

## 8. Contribution Guidelines & Git Workflow

To maintain a clean and reliable codebase, all team members will adhere to standard collaborative Git practices:

### Branching Strategy
- **`main`**: Production-ready, stable codebase. Direct commits to `main` are restricted.
- **Feature Branches**: All work must occur on dedicated feature branches named with the following convention:
  - `feature/<feature-name>` (e.g., `feature/mentor-discovery-ui`)
  - `api/<endpoint-or-service>` (e.g., `api/booking-routes`)
  - `fix/<issue-name>` (e.g., `fix/validation-error`)

### Workflow Steps
1. **Pull Latest Changes:** Always update your local `main` branch before branching:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/<descriptive-name>
   ```
3. **Commit Messages:** Write clear, concise, and conventional commit messages:
   - `docs: update milestone 1 documentation`
   - `feat: add mentor availability selector`
   - `fix: resolve date parsing in booking model`
4. **Pull Requests (PR):**
   - Push your branch to GitHub: `git push origin feature/<descriptive-name>`
   - Open a Pull Request against `main`.
   - Provide a clear summary of changes and request at least one peer review before merging.
