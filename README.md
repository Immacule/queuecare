# QueueCare — Clinic Appointment & Queue Management System

---

## Prerequisites

- **Node.js** v18 or later — https://nodejs.org
- **npm** v8 or later — comes with Node.js
- **Git** — https://git-scm.com
- **Chromium** — installed automatically by Playwright (see Run UI Tests)

Verify before starting:
```bash
node --version    # must be v18 or higher
npm --version     # must be v8 or higher
```

---

## How to Install Dependencies

```bash
git clone https://github.com/Immacule/queuecare.git
cd queuecare
npm install
```

---

## How to Start the Application

```bash
npm start
```

Server runs at **http://localhost:3000**

Open your browser and go to:
```
http://localhost:3000
```

You will be redirected to the login page automatically.

---

## How to Run API Tests

```bash
npm test
```

Expected result:
```
Test Suites: 5 passed, 5 total
Tests:       58 passed, 58 total
```

If tests fail unexpectedly after code changes, clear the Jest cache first:
```bash
npx jest --clearCache && npm test
```

---

## How to Run UI Tests

Install the browser (first time only):
```bash
npx playwright install chromium
```

Run the tests:
```bash
npm run test:ui
```

View the visual HTML report after tests complete:
```bash
npx playwright show-report
```

> Note: Playwright starts and stops the server automatically. You do not need to run `npm start` before running UI tests.

---

## Environment Variables

No `.env` file is required. The app runs with defaults out of the box.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `JWT_SECRET` | `queuecare_super_secret_key_2024` | JWT signing key |
| `JWT_EXPIRES_IN` | `24h` | How long tokens stay valid |
| `NODE_ENV` | `development` | Set to `production` to hide stack traces |

To override, set before running:
```bash
# Windows
set PORT=4000 && npm start

# Mac / Linux
PORT=4000 npm start
```

---

## Default Test Credentials

Run the seed script first to create demo accounts.

Keep the server running, then open a second terminal:
```bash
npm run seed
```

| Role | Email | Password |
|------|-------|----------|
| Admin / Staff | admin@queuecare.com | admin123 |
| Patient | alice@example.com | alice123 |
| Patient | bob@example.com | bob123 |
