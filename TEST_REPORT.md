# QueueCare — Test Report

**Project:** QueueCare Clinic Appointment & Queue Management System  
**Date:** 2026-05-31  
**Stack:** Node.js + Express, MongoDB + Mongoose, JWT, Jest + Supertest, Playwright

---

## What I Built

A fully working clinic appointment and queue management system with:

- **Backend:** Node.js + Express REST API
- **Database:** MongoDB (local via Community Server + MongoDB Atlas cloud)
- **Authentication:** JWT with bcryptjs password hashing
- **Frontend:** Plain HTML + JavaScript served by Express
- **Queue logic:** Auto-assigned queue numbers (Q-001, Q-002...) on booking
- **Roles:** Patient and Admin with different permissions enforced at middleware level

**Key architecture decisions:**

- `app.js` separated from `server.js` so tests import the app without starting a real HTTP server
- Models have dual mode — in-memory arrays for tests (`NODE_ENV=test`), Mongoose for production
- `cross-env NODE_ENV=test` ensures tests never connect to MongoDB — fast and isolated
- Frontend uses `data-testid` attributes on all interactive elements for stable Playwright selectors
- MongoDB `_id` handled alongside in-memory `id` via `getId()` helper in the frontend

---

## What I Tested

### API Tests — 58 tests across 5 files

| File | What it covers | Tests |
|------|---------------|-------|
| `auth.test.js` | Register, login, JWT, protected routes | 13 |
| `appointments.test.js` | Full CRUD, ownership checks, role filtering | 19 |
| `queue.test.js` | Queue lifecycle, admin enforcement | 13 |
| `edge-cases.test.js` | All 7 edge cases | 12 |
| `root.test.js` | Health check | 1 |

### Happy Path (all covered)
- Register → Login → receive valid token
- Create appointment → queue number assigned on booking
- Fetch all appointments → role-based filtering verified
- Fetch single appointment by ID
- Staff marks patient as served → status updates

### Negative Cases (all covered)
- Login with wrong password → 401
- Login with non-existent email → 401
- Create appointment with missing fields → 400
- Access protected endpoint with no token → 401
- Access protected endpoint with invalid token → 401
- Patient accesses another patient's appointment → 403
- Patient tries to mark patient as served → 403
- Fetch appointment with non-existent ID → 404

### Edge Cases (all 7 covered)

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 1 | Book appointment in the past | 400 | Passed |
| 2 | Duplicate booking same day | 409 | Passed |
| 3 | Invalid date format | 400 + clear error | Passed |
| 4 | Reschedule to past date | 400 | Passed |
| 5 | Cancel already-cancelled | 200 graceful | Passed |
| 6 | Mark already-served again | 200 graceful | Passed |
| 7 | Re-book same day after cancellation | 201 allowed | Passed |

### UI Automation — 17 Playwright tests

| Group | Tests |
|-------|-------|
| Login flow (valid, invalid, empty) | 5 |
| Register flow | 2 |
| Create appointment + queue number verified | 2 |
| Form validation | 3 |
| Update and cancel | 2 |
| Queue board | 1 |
| Role-based UI | 2 |

### What was skipped and why
- **Performance/load testing** — out of scope for this assessment
- **Token expiry edge cases** — covered by the JWT library's own test suite
- **Cross-browser UI tests** — Playwright configured for Chromium only; Firefox/WebKit omitted for time

---

## What You Automated vs Manual

| Scenario | Automated | Reason |
|----------|-----------|--------|
| All happy path API flows | Jest | Fast and repeatable |
| All negative API cases | Jest | Status codes are unambiguous |
| All 7 edge cases | Jest | Critical business rules must be regression-safe |
| Login / register UI | Playwright | Real browser form interaction |
| Create / edit / cancel UI | Playwright | Verifies frontend wiring to backend |
| MongoDB Atlas connectivity | Manual via Postman | Network-dependent, not suitable for automated CI |

---

## Bugs Found

### Bug 1 — Queue number only assigned on admin confirm, not on booking
**Description:** Queue numbers were only assigned when an admin confirmed an appointment. The requirement states they should be assigned at booking time.  
**Impact:** Patients had no queue number until an admin acted — breaking the queue board.  
**Fix:** Moved queue number assignment into `AppointmentModel.create()`.

### Bug 2 — Duplicate bookings allowed on the same day
**Description:** The same patient could book multiple appointments on the same date with no restriction.  
**Impact:** Multiple queue entries created for one patient on the same day.  
**Fix:** Added a 409 duplicate check in `AppointmentModel.create()`. Cancelled appointments excluded so re-booking after cancel still works.

### Bug 3 — Past dates accepted on create and reschedule
**Description:** No date validation existed. Bookings for `2020-01-01` would succeed silently.  
**Impact:** Invalid historical data entered the system.  
**Fix:** Added past-date rejection in `validateAppointment` and `validateAppointmentUpdate`.

### Bug 4 — Jest cache caused false 404 on root route
**Description:** After adding `GET /` to `app.js`, tests returned `404` because Jest held the old compiled module in cache.  
**Impact:** A correct code change appeared to fail in tests.  
**Fix:** `npx jest --clearCache`. Documented in README.

### Bug 5 — Cancel already-cancelled returned misleading message
**Description:** Setting `status: "cancelled"` on an already-cancelled appointment returned `"Appointment updated."`.  
**Impact:** API consumers could not distinguish a real change from a no-op.  
**Fix:** Added idempotency check — returns `"Appointment is already cancelled."`.

### Bug 6 — MongoDB `_id` not handled in frontend
**Description:** After switching to MongoDB, all Edit, Cancel, and Admin actions broke because the frontend used `a.id` but MongoDB returns `a._id`.  
**Impact:** Every button requiring an appointment ID sent `undefined` to the API.  
**Fix:** Added `getId()` helper in `dashboard.html` returning `obj._id || obj.id`.

### Bug 7 — MongoDB Atlas DNS blocked by network
**Description:** `querySrv ECONNREFUSED _mongodb._tcp.cluster0...` — ISP DNS blocked SRV lookups used by `mongodb+srv://` connections.  
**Impact:** App could not connect to Atlas from development network.  
**Fix:** Changed system DNS to Google `8.8.8.8` / `8.8.4.4` using `netsh`. Installed MongoDB Community Server locally as fallback.

### Bug 8 — 4 appointment tests fail after MongoDB dual-mode migration
**Description:** After migrating models to dual-mode (in-memory for tests, Mongoose for production), 4 tests in `appointments.test.js` still fail. The failures are in appointment CRUD operations where the response shape diverges slightly between the in-memory and Mongoose implementations.  
**Impact:** 4 out of 58 API tests fail. All auth, queue, edge case, and root tests pass (54/58).  
**Root cause:** ID field mismatch — in-memory model returns `id` and `_id` as separate UUID strings, but test assertions were written expecting the Mongoose ObjectId format.  
**Status:** Identified and documented. Not fully resolved within the assessment time window.

---

## What I Would Improve (Given More Time)

| Improvement | Priority | Reason |
|-------------|----------|--------|
| Fix remaining 4 appointment test failures | High | Align ID assertions between in-memory and Mongoose |
| Past-date validation should also check time | Medium | Today at 08:00 passes current check |
| Rate limiting on `/api/auth/login` | High | Brute-force login currently possible |
| Doctor availability / slot conflict check | Medium | Two patients can book same doctor same time |
| Email notifications on booking and confirm | Medium | Patients have no way to know status changed |
| Pagination on list endpoints | Medium | Large clinics would return thousands of records |
| Token refresh endpoint | Medium | 24h tokens force re-login daily |
| CI/CD pipeline with GitHub Actions | High | Tests should run automatically on every push |
| Seed script idempotency | Low | Running seed twice creates duplicate users |

---

## Test Results Summary

| Suite | Tests | Passed | Failed |
|-------|-------|--------|--------|
| auth.test.js | 13 | 13 | 0 |
| appointments.test.js | 19 | 15 | 4 |
| queue.test.js | 13 | 13 | 0 |
| edge-cases.test.js | 12 | 12 | 0 |
| root.test.js | 1 | 1 | 0 |
| **API Total** | **58** | **54** | **4** |
| Playwright UI | 17 | 17 | 0 |
| **Grand Total** | **75** | **71** | **4** |