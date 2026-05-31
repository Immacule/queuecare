# QueueCare — Clinic Appointment & Queue Management System

A Node.js REST API with a plain HTML frontend for managing clinic appointments and patient queues.

---

## Prerequisites

Before you start, make sure you have the following installed:

- **Node.js** v18 or later — https://nodejs.org
- **npm** v8 or later — comes with Node.js
- **Git** — https://git-scm.com
- **MongoDB Community Server** v8 or later — https://www.mongodb.com/try/download/community

Verify your versions:
```bash
node --version
npm --version
```

---

## How to Install

**Step 1 — Clone the repository:**
```bash
git clone https://github.com/Immacule/queuecare.git
cd queuecare
```

**Step 2 — Install dependencies:**
```bash
npm install
```

**Step 3 — Create your `.env` file** in the project root:
```
MONGODB_URI=mongodb://localhost:27017/queuecare
PORT=3000
JWT_SECRET=queuecare_super_secret_key_2024
JWT_EXPIRES_IN=24h
NODE_ENV=development
```
**DEPLOYMENT LINK**
https://queuecare-n2k9.onrender.com
---

## How to Run the Application

**Step 1 — Start MongoDB** (open CMD as Administrator):
```bash
net start MongoDB
```

**Step 2 — Start the server:**
```bash
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
🏥 QueueCare API Server
   Running on http://localhost:3000
```

**Step 3 — Open in browser:**
```
http://localhost:3000
```

---

## How to Seed Demo Data

With the server running, open a second terminal and run:
```bash
npm run seed
```

This creates the following demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@queuecare.com | admin123 |
| Patient | alice@example.com | alice123 |
| Patient | bob@example.com | bob123 |

---

## How to Run API Tests

API tests use in-memory data — no MongoDB connection needed:

```bash
npm test
```

Expected output:
```
Test Suites: 5 total
Tests:       58 total
```

If tests fail unexpectedly, clear the Jest cache first:
```bash
npx jest --clearCache && npm test
```

---

## How to Run UI Tests

**Step 1 — Install Chromium** (first time only):
```bash
npx playwright install chromium
```

**Step 2 — Run UI tests:**
```bash
npm run test:ui
```

**Step 3 — View the HTML report:**
```bash
npx playwright show-report
```

> Note: Make sure the server is running on port 3000 before running UI tests.

---

## Environment Variables

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/queuecare` | MongoDB connection string |
| `PORT` | `3000` | HTTP server port |
| `JWT_SECRET` | `queuecare_super_secret_key_2024` | JWT signing secret |
| `JWT_EXPIRES_IN` | `24h` | Token expiry duration |
| `NODE_ENV` | `development` | Environment mode |

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | None |
| POST | `/api/auth/login` | Login and get token | None |
| GET | `/api/auth/me` | Get current user | Required |

### Appointments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/appointments` | Book appointment | Patient |
| GET | `/api/appointments` | List appointments | Required |
| GET | `/api/appointments/:id` | Get one appointment | Required |
| PATCH | `/api/appointments/:id` | Update appointment | Required |
| DELETE | `/api/appointments/:id` | Cancel appointment | Required |

### Queue
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/queue` | Today's queue | Admin |
| GET | `/api/queue/my` | My queue position | Patient |
| GET | `/api/queue/date/:date` | Queue for a date | Admin |
| PATCH | `/api/queue/:id/status` | Update queue status | Admin |

---

## Project Structure

```
queuecare/
├── public/
│   ├── login.html
│   └── dashboard.html
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── jwt.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── appointment.controller.js
│   │   └── queue.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── validate.middleware.js
│   │   └── error.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── appointment.model.js
│   │   └── queue.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── appointment.routes.js
│   │   └── queue.routes.js
│   ├── app.js
│   └── server.js
├── tests/
│   ├── api/
│   │   ├── helpers.js
│   │   ├── auth.test.js
│   │   ├── appointments.test.js
│   │   ├── queue.test.js
│   │   ├── edge-cases.test.js
│   │   └── root.test.js
│   └── ui/
│       └── queuecare.spec.js
├── scripts/
│   └── seed.js
├── .env.example
├── package.json
├── playwright.config.js
├── README.md
└── TEST_REPORT.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v18+ |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT + bcryptjs |
| Frontend | Plain HTML + JavaScript |
| API Testing | Jest + Supertest |
| UI Automation | Playwright |
