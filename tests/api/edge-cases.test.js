/**
 * edge-cases.test.js — All 7 Edge Cases Required by the Assessment
 *
 * 1. Book appointment in the past → rejected (400)
 * 2. Duplicate booking same day   → rejected (409)
 * 3. Invalid date format          → clear error (400)
 * 4. Reschedule to past date      → rejected (400)
 * 5. Cancel already-cancelled     → graceful (200)
 * 6. Mark already-served again    → graceful (200)
 * 7. Re-book after cancellation   → allowed  (201)
 */

const request = require("supertest");
const app = require("../../src/app");
const { resetDB, registerUser, registerAdmin, createAppointment } = require("./helpers");

beforeEach(() => resetDB());

const YESTERDAY = new Date(Date.now() - 86400000).toISOString().split("T")[0];
const TOMORROW  = new Date(Date.now() + 86400000).toISOString().split("T")[0];
const DAY_AFTER = new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0];

// ─── 1. Past date rejection ──────────────────────────────────────────────────
describe("Edge Case 1 — Book in the past", () => {
  it("rejects a past date with 400", async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ doctorName: "Dr. Past", date: YESTERDAY, time: "10:00" });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors.some(e => e.toLowerCase().includes("past"))).toBe(true);
  });

  it("accepts a booking for tomorrow", async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ doctorName: "Dr. Future", date: TOMORROW, time: "10:00" });
    expect(res.statusCode).toBe(201);
  });
});

// ─── 2. Duplicate booking same day ──────────────────────────────────────────
describe("Edge Case 2 — Duplicate booking same day", () => {
  it("rejects second booking on same day with 409", async () => {
    const { token } = await registerUser();
    await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ doctorName: "Dr. A", date: TOMORROW, time: "09:00" });

    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ doctorName: "Dr. B", date: TOMORROW, time: "11:00" });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toContain("already have");
  });

  it("allows different patients to book on the same day", async () => {
    const { token: t1 } = await registerUser({ email: "dup1@test.com" });
    const { token: t2 } = await registerUser({ email: "dup2@test.com" });
    const r1 = await request(app).post("/api/appointments")
      .set("Authorization", `Bearer ${t1}`)
      .send({ doctorName: "Dr. A", date: TOMORROW, time: "09:00" });
    const r2 = await request(app).post("/api/appointments")
      .set("Authorization", `Bearer ${t2}`)
      .send({ doctorName: "Dr. B", date: TOMORROW, time: "10:00" });
    expect(r1.statusCode).toBe(201);
    expect(r2.statusCode).toBe(201);
  });
});

// ─── 3. Invalid date format ──────────────────────────────────────────────────
describe("Edge Case 3 — Invalid date format", () => {
  it("rejects DD-MM-YYYY format with clear error (400)", async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ doctorName: "Dr. X", date: "15-06-2025", time: "10:00" });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors.some(e => e.includes("YYYY-MM-DD"))).toBe(true);
  });

  it("rejects plain text as a date (400)", async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ doctorName: "Dr. X", date: "next-monday", time: "10:00" });
    expect(res.statusCode).toBe(400);
  });

  it("rejects missing date field entirely (400)", async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ doctorName: "Dr. X", time: "10:00" });
    expect(res.statusCode).toBe(400);
  });
});

// ─── 4. Reschedule to past date ──────────────────────────────────────────────
describe("Edge Case 4 — Reschedule to a past date", () => {
  it("rejects rescheduling to a past date (400)", async () => {
    const { token } = await registerUser();
    const { appointment } = await createAppointment(token);
    const res = await request(app)
      .patch(`/api/appointments/${appointment.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ date: YESTERDAY });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors.some(e => e.toLowerCase().includes("past"))).toBe(true);
  });

  it("allows rescheduling to a future date", async () => {
    const { token } = await registerUser();
    const { appointment } = await createAppointment(token, { date: TOMORROW });
    const res = await request(app)
      .patch(`/api/appointments/${appointment.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ date: DAY_AFTER });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.appointment.date).toBe(DAY_AFTER);
  });
});

// ─── 5. Cancel already-cancelled appointment ─────────────────────────────────
describe("Edge Case 5 — Cancel already-cancelled appointment", () => {
  it("handles gracefully with 200 and clear message", async () => {
    const { token: adminToken } = await registerAdmin();
    const { token: patientToken } = await registerUser({ email: "ec5@test.com" });
    const { appointment } = await createAppointment(patientToken);

    // First cancel
    await request(app)
      .patch(`/api/appointments/${appointment.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "cancelled" });

    // Second cancel on already-cancelled — should be graceful
    const res = await request(app)
      .patch(`/api/appointments/${appointment.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "cancelled" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("already cancelled");
  });
});

// ─── 6. Mark already-served again ────────────────────────────────────────────
describe("Edge Case 6 — Mark already-served patient as served again", () => {
  it("handles gracefully with 200 and clear message", async () => {
    const { token: adminToken } = await registerAdmin();
    const { token: patientToken } = await registerUser({ email: "ec6@test.com" });
    const { appointment } = await createAppointment(patientToken, { date: TOMORROW });

    const queueRes = await request(app)
      .get(`/api/queue/date/${TOMORROW}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const queueId = queueRes.body.data.queue[0].id;

    // First: mark served
    await request(app)
      .patch(`/api/queue/${queueId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "done" });

    // Second: mark served again
    const res = await request(app)
      .patch(`/api/queue/${queueId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "done" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("already");
  });
});

// ─── 7. Re-book same day after cancellation ───────────────────────────────────
describe("Edge Case 7 — Re-book on same day after cancellation", () => {
  it("allows re-booking after cancellation (201)", async () => {
    const { token: adminToken } = await registerAdmin();
    const { token: patientToken } = await registerUser({ email: "ec7@test.com" });

    // Book
    const { appointment } = await createAppointment(patientToken, { date: TOMORROW });
    expect(appointment).toBeTruthy();

    // Admin cancels it
    await request(app)
      .patch(`/api/appointments/${appointment.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "cancelled" });

    // Re-book same day — should now be allowed
    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ doctorName: "Dr. New", date: TOMORROW, time: "14:00" });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.appointment.date).toBe(TOMORROW);
  });
});
