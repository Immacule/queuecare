# 🏥 QueueCare — Clinic Appointment & Queue Management System

A fully working clinic appointment system with JWT authentication, queue management, role-based access control, a browser UI, and a complete automated test suite.

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v8 or later
- **Chromium** (for Playwright UI tests — installed automatically)

---

## Installation

```bash
# Clone / download and enter the project
cd queuecare

# Install all dependencies
npm install
```

---

## Start the Application

```bash
npm start
```

Server runs at **http://localhost:3000**

Open your browser and visit `http://localhost:3000` — you'll be redirected to the login page.

---

## Seed Demo Data

With the server running in one terminal, open another:

```bash
npm run seed
```

| Role | Email | Password |
|------|-------|----------|
| Admin / Staff | admin@queuecare.com | admin123 |
| Patient | alice@example.com | alice123 |
| Patient | bob@example.com | bob123 |

---

## Run API Tests (Jest + Supertest)

```bash
# Run all 58 tests
npm test

# If tests fail unexpectedly after code changes, clear Jest cache first
npx jest --clearCache && npm test

# Run with code coverage report
npm run test:coverage
```

---

## Run UI Automation Tests (Playwright)

```bash
# Install Playwright browser (first time only)
npx playwright install chromium

# Run all 17 Playwright tests
npm run test:ui

# View the HTML test report
npx playwright show-report
```

> Playwright starts the server automatically via `webServer` config. No need to start it separately.

---

## Project Structure

```
queuecare/
├── public/                    ← HTML frontend
│   ├── login.html             ← Login + Register page
│   └── dashboard.html         ← Main app (appointments + queue)
├── src/
│   ├── config/
│   │   ├── db.js              ← In-memory database
│   │   └── jwt.js             ← JWT secret & expiry
│   ├── controllers/           ← Business logic
│   ├── middleware/            ← JWT auth + validation + errors
│   ├── models/                ← Data operations
│   ├── routes/                ← URL → controller wiring
│   ├── app.js                 ← Express app (no server start)
│   └── server.js              ← HTTP server entry point
├── tests/
│   ├── api/
│   │   ├── helpers.js
│   │   ├── auth.test.js
│   │   ├── appointments.test.js
│   │   ├── queue.test.js
│   │   ├── edge-cases.test.js ← All 7 edge cases
│   │   └── root.test.js
│   └── ui/
│       ├── pages/api.page.js
│       └── queuecare.spec.js  ← 17 Playwright tests
├── scripts/seed.js
├── playwright.config.js
├── package.json
├── README.md
└── TEST_REPORT.md
```

---

## API Reference

### Base URL: `http://localhost:3000/api`

#### Auth (public)
| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/auth/register` | `{ name, email, password, role }` |
| POST | `/auth/login` | `{ email, password }` |
| GET | `/auth/me` | — (token required) |

#### Appointments (token required)
| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/appointments` | Book; queue number auto-assigned |
| GET | `/appointments` | Patient: own only. Admin: all |
| GET | `/appointments/:id` | |
| PATCH | `/appointments/:id` | |
| DELETE | `/appointments/:id` | |

#### Queue (token required)
| Method | Endpoint | Role |
|--------|----------|------|
| GET | `/queue` | Admin only — today's queue |
| GET | `/queue/my` | Any user — own queue position |
| GET | `/queue/date/:date` | Admin only |
| PATCH | `/queue/:id/status` | Admin only — called/done/skipped |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `JWT_SECRET` | `queuecare_super_secret_key_2024` | **Change in production** |
| `JWT_EXPIRES_IN` | `24h` | Token lifetime |
| `NODE_ENV` | `development` | Set to `production` to hide stack traces |

---

## npm Scripts

| Script | Command |
|--------|---------|
| `npm start` | Start the server |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm test` | Run 58 Jest + Supertest tests |
| `npm run test:coverage` | Tests + coverage report |
| `npm run test:ui` | Run 17 Playwright UI tests |
| `npm run seed` | Seed demo users & appointments |
