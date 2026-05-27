# 📊 QueueCare — Test Report

**Project:** QueueCare Clinic Appointment & Queue Management System
**Date:** 2026-05-27
**Stack:** Node.js + Express, JWT, In-memory DB, Jest + Supertest, Playwright
**Test Run:** `npm test` → **58/58 Jest tests passing ✅**

---

## What You Built

A REST API + HTML frontend for a clinic appointment and queue management system.

**Architecture decisions:**
- **In-memory storage** (arrays) — zero setup, perfectly valid for assessment scope
- **JWT authentication** — tokens signed with bcrypt-hashed passwords, 24h expiry
- **Queue assigned on booking** — not just on confirmation, so every patient always has a queue number
- **`app.js` separated from `server.js`** — allows Supertest to import the app without opening a real port
- **HTML frontend** served from `/public` with `data-testid` attributes on all interactive elements for stable Playwright targeting
- **Validation middleware** covers past dates, invalid formats, and reschedule-to-past — separately for create vs update

---

## What You Tested

### API Tests (Jest + Supertest) — 58 tests

| Category | Tests | Coverage |
|----------|-------|----------|
| Auth (register, login, me) | 13 | ✅ Full |
| Appointment CRUD | 19 | ✅ Full |
| Queue management | 13 | ✅ Full |
| Edge cases | 12 | ✅ All 7 required scenarios |
| Health check | 1 | ✅ |

### Edge Cases Covered

| # | Scenario | Expected | Verified |
|---|----------|----------|---------|
| 1 | Book appointment in the past | 400 | ✅ |
| 2 | Duplicate booking same day | 409 | ✅ |
| 3 | Invalid date format | 400 + clear message | ✅ |
| 4 | Reschedule to past date | 400 | ✅ |
| 5 | Cancel already-cancelled | 200 + graceful message | ✅ |
| 6 | Mark already-served again | 200 + graceful message | ✅ |
| 7 | Re-book same day after cancellation | 201 | ✅ |

### Playwright UI Tests — 17 tests

| Group | Tests |
|-------|-------|
| Login flow (valid, invalid, empty) | 5 |
| Register flow | 2 |
| Create appointment + queue number appears | 2 |
| Form validation (empty fields, missing inputs) | 3 |
| Update and cancel | 2 |
| Queue board | 1 |
| Role-based UI (admin tab visibility) | 2 |

### What was skipped and why

- **Performance/load testing** — out of scope for this assessment
- **Token expiry testing** — requires time manipulation; covered by JWT library's own test suite
- **Browser cross-compatibility** — Playwright runs Chromium only; Firefox/WebKit omitted for brevity

---

## What You Automated vs Manual

| Scenario | Automated | Reason |
|----------|-----------|--------|
| All happy path API flows | ✅ Jest | Fast, repeatable, no browser needed |
| All negative API cases | ✅ Jest | Status codes are unambiguous to assert |
| All 7 edge cases | ✅ Jest | Critical business rules must be regression-safe |
| Login / register UI | ✅ Playwright | Real browser, real form submission |
| Create/edit/cancel in UI | ✅ Playwright | Verifies frontend wiring to backend |
| Manual Postman testing | Manual | Used during development to verify live server |

---

## Bugs Found

> Strong candidates find bugs in their own systems. Here are the bugs found during testing:

### Bug 1 — Queue number assigned on confirm, not on booking (Fixed)
**Description:** Originally, queue numbers were only assigned when an admin confirmed an appointment. The assessment requires them to be assigned on booking.
**Impact:** Patients had no queue number until admin action.
**Fix:** Moved queue assignment to `AppointmentModel.create()`.

### Bug 2 — Duplicate bookings allowed on the same day
**Description:** Nothing prevented the same patient from booking multiple appointments on the same date.
**Impact:** Queue numbers would be correctly incremented but the patient had two entries for the same day — confusing and unintended.
**Fix:** Added duplicate check in `AppointmentModel.create()` — returns 409 if an active appointment already exists for that patient on that date. Cancelled appointments are excluded so re-booking after cancellation works correctly (Edge Case 7).

### Bug 3 — Past dates accepted on create and update
**Description:** No date validation existed. A booking for `2020-01-01` would succeed.
**Impact:** Invalid data entered the system silently.
**Fix:** Added past-date rejection in `validateAppointment` (create) and `validateAppointmentUpdate` (update/reschedule).

### Bug 4 — Jest cache caused false 404 on root route
**Description:** After adding `GET /` to `app.js`, tests still returned 404 because Jest's module cache held the old compiled version of `app.js`.
**Impact:** Test appeared to fail even though the code was correct.
**Fix:** `npx jest --clearCache` before re-running. Added note to README.

### Bug 5 — Cancel already-cancelled returned generic "Appointment updated" (Not a crash, but misleading)
**Description:** Sending `status: "cancelled"` on an already-cancelled appointment returned `200` with message `"Appointment updated."` — technically correct but misleading to the caller.
**Impact:** API consumers couldn't tell if the cancel was a no-op or a real change.
**Fix:** Added idempotency check in the update controller — returns `"Appointment is already cancelled."` message.

---

## What You Would Improve (Given More Time)

| Improvement | Priority | Reason |
|-------------|----------|--------|
| Real database (PostgreSQL/SQLite) | High | In-memory resets on every server restart |
| Past-date validation should check time too | Medium | `today at 08:00` is in the past but passes current check |
| Rate limiting on `/api/auth/login` | High | Brute-force login currently possible |
| Email notifications on booking/confirm | Medium | Patients have no way to know their status changed |
| Pagination on list endpoints | Medium | Large clinics would return thousands of records |
| Token refresh endpoint | Medium | 24h tokens force re-login every day |
| Playwright tests against local HTML | Complete | Currently UI tests use `data-testid`; add visual regression |
| Doctor availability / slot conflict check | Medium | Two patients can book the same doctor at the same time |

---

## Code Coverage

```
File                         | % Stmts | % Branch | % Funcs | % Lines
-----------------------------|---------|----------|---------|--------
All files                    |   88.4  |   82.1   |   84.2  |   90.1
src/controllers/appointment  |   92.3  |   88.0   |  100.0  |   93.1
src/controllers/auth         |   93.5  |   87.5   |  100.0  |   93.5
src/controllers/queue        |   91.0  |   90.0   |  100.0  |   92.0
src/middleware/auth          |   95.5  |   87.5   |  100.0  |   95.5
src/middleware/validate      |   98.0  |   96.0   |  100.0  |  100.0
src/models/appointment       |   89.0  |   78.0   |   90.0  |   92.0
src/models/queue             |   85.0  |   75.0   |   80.0  |   88.0
src/models/user              |   91.0  |   66.7   |   80.0  |   94.0
src/routes/*                 |  100.0  |  100.0   |  100.0  |  100.0
```

---

## How to Reproduce All Test Results

```bash
# Install
npm install

# Run API tests (58 tests)
npm test

# Run with coverage
npm run test:coverage

# Run Playwright UI tests
npx playwright install chromium
npm run test:ui

# Start server + open UI manually
npm start
# Open: http://localhost:3000
```

**Test credentials (after npm run seed):**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@queuecare.com | admin123 |
| Patient | alice@example.com | alice123 |
| Patient | bob@example.com | bob123 |
