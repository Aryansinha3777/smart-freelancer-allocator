# Smart Freelancer Allocation & Scheduling System

A constraint-based resource allocation system that automatically assigns freelancers to projects by evaluating workload, deadlines, skill match, and priority — preventing overbooking across concurrent projects.

---

## What makes this different

Traditional freelancer platforms let clients manually pick who they work with. This system makes the decision automatically using a scheduling engine that evaluates real constraints.

**Allocation Engine logic (step by step):**
1. Filter freelancers by required skill
2. Check deadline feasibility — can they finish before the deadline given their daily capacity?
3. Score and rank valid candidates by workload and availability
4. Urgency handling — urgent projects prioritize least-loaded freelancers
5. Build a day-by-day work schedule for the assigned freelancer
6. If no one qualifies, return actionable suggestions instead of a blank error

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Redux Toolkit, Tailwind CSS, Vite |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | JWT (JSON Web Tokens) |
| HTTP Client | Axios |

---

## Features

**Must have**
- Smart allocation engine with constraint evaluation
- Workload tracking per freelancer (daily capacity vs current load)
- Deadline feasibility check before assignment
- Conflict prevention — overloaded freelancers are never assigned

**Should have**
- Priority queue — urgent projects handled first
- Day-by-day scheduling timeline per assignment
- Reassignment logic — admin can trigger reallocation to next best freelancer

**Bonus**
- Smart suggestions when allocation fails (extend deadline, split project)
- Redux global state for workload and assignment data
- Lazy loaded dashboard routes
- Mongoose virtual fields for computed workload data
- Centralized Express error handler middleware

---

## Roles

| Role | Can do |
|---|---|
| Client | Create projects, trigger allocation, track assignment status |
| Freelancer | Set up profile with skills and capacity, view assignments and schedule |
| Admin | Full system view, reassign projects, monitor all freelancer workloads |

---

## Project Structure

```
smart-allocator/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── features/
│   │   ├── auth/
│   │   ├── freelancer/
│   │   ├── project/
│   │   └── allocation/
│   │       └── allocationEngine.js   ← core logic, isolated
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── roleCheck.js
│   │   └── errorHandler.js
│   ├── scripts/
│   │   └── seedAdmin.js
│   └── server.js
└── frontend/
    └── src/
        ├── api/
        ├── components/
        ├── pages/
        └── store/
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally

### Backend

```bash
cd backend
npm install
npm run seed:admin   # creates admin user
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Test Accounts

After running the seeder:

| Role | Email | Password |
|---|---|---|
| Admin | admin@smartallocator.com | admin123456 |
| Client | Register via UI | — |
| Freelancer | Register via UI | — |

---

## API Overview

| Method | Route | Access | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register user |
| POST | /api/auth/login | Public | Login |
| POST | /api/freelancer/profile | Freelancer | Create profile |
| GET | /api/freelancer/profile/me | Freelancer | Get own profile |
| POST | /api/project | Client | Create project |
| GET | /api/project/my | Client | Get own projects |
| POST | /api/allocation/assign/:id | Client | Trigger allocation |
| GET | /api/allocation/my | Freelancer | Get assignments |
| GET | /api/allocation/all | Admin | All assignments |
| PUT | /api/allocation/reassign/:id | Admin | Reassign project |