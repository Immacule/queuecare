/**
 * appointments.test.js — Appointment CRUD + Happy Path + Negative Cases
 */
const request = require("supertest");
const app = require("../../src/app");
const { resetDB, registerUser, registerAdmin, createAppointment } = require("./helpers");

beforeEach(() => resetDB());

const TOMORROW = new Date(Date.now() + 86400000).toISOString().split("T")[0];
const DAY_AFTER = new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0];

// ── CREATE ────────────────────────────────────────────────────────────────────
describe("POST /api/appointments", () => {
  it("happy path: creates appointment with queue number assigned", async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ doctorName: "Dr. Smith", date: TOMORROW, time: "09:30" });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.appointment.status).toBe("pending");
    // Queue number assigned immediately on booking
    expect(res.body.data.appointment.queueNumber).toMatch(/^Q-\d{3}$/);
  });

  it("negative: rejects unauthenticated request (401)", async () => {
    const res = await request(app).post("/api/appointments")
      .send({ doctorName: "Dr. X", date: TOMORROW, time: "10:00" });
    expect(res.statusCode).toBe(401);
  });

  it("negative: rejects missing required fields (400)", async () => {
    const { token } = await registerUser();
    const res = await request(app).post("/api/appointments")
      .set("Authorization", `Bearer ${token}`).send({});
    expect(res.statusCode).toBe(400);
  });

  it("negative: rejects invalid date format (400)", async () => {
    const { token } = await registerUser();
    const res = await request(app).post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ doctorName: "Dr. X", date: "15/06/2025", time: "10:00" });
    expect(res.statusCode).toBe(400);
  });

  it("sets patientId from JWT token, not request body", async () => {
    const { token, user } = await registerUser();
    const { appointment } = await createAppointment(token);
    expect(appointment.patientId).toBe(user.id);
  });
});

// ── LIST ─────────────────────────────────────────────────────────────────────
describe("GET /api/appointments", () => {
  it("happy path: patient sees only their own appointments", async () => {
    const { token: t1 } = await registerUser({ email: "p1@test.com" });
    const { token: t2 } = await registerUser({ email: "p2@test.com" });
    await createAppointment(t1);
    await createAppointment(t2);

    const res = await request(app).get("/api/appointments").set("Authorization", `Bearer ${t1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.appointments.length).toBe(1);
  });

  it("happy path: admin sees ALL appointments", async () => {
    const { token: t1 } = await registerUser({ email: "p1@test.com" });
    const { token: t2 } = await registerUser({ email: "p2@test.com" });
    const { token: adminToken } = await registerAdmin();
    await createAppointment(t1);
    await createAppointment(t2);

    const res = await request(app).get("/api/appointments").set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.appointments.length).toBe(2);
  });

  it("negative: returns 401 without token", async () => {
    const res = await request(app).get("/api/appointments");
    expect(res.statusCode).toBe(401);
  });

  it("negative: returns 401 with invalid token", async () => {
    const res = await request(app).get("/api/appointments")
      .set("Authorization", "Bearer this.is.fake");
    expect(res.statusCode).toBe(401);
  });

  it("filters by date query param", async () => {
    const { token } = await registerUser();
    await createAppointment(token, { date: TOMORROW });
    await createAppointment(token, { date: DAY_AFTER }); // this will 409 — different date ok

    const res = await request(app).get(`/api/appointments?date=${TOMORROW}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.data.appointments.every(a => a.date === TOMORROW)).toBe(true);
  });
});

// ── GET ONE ──────────────────────────────────────────────────────────────────
describe("GET /api/appointments/:id", () => {
  it("happy path: returns appointment by ID", async () => {
    const { token } = await registerUser();
    const { appointment } = await createAppointment(token);

    const res = await request(app).get(`/api/appointments/${appointment.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.appointment.id).toBe(appointment.id);
  });

  it("negative: returns 404 for non-existent ID", async () => {
    const { token } = await registerUser();
    const res = await request(app).get("/api/appointments/fake-id-999")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  it("negative: patient gets 403 viewing another patient's appointment", async () => {
    const { token: t1 } = await registerUser({ email: "p1@test.com" });
    const { token: t2 } = await registerUser({ email: "p2@test.com" });
    const { appointment } = await createAppointment(t1);

    const res = await request(app).get(`/api/appointments/${appointment.id}`)
      .set("Authorization", `Bearer ${t2}`);
    expect(res.statusCode).toBe(403);
  });
});

// ── UPDATE ───────────────────────────────────────────────────────────────────
describe("PATCH /api/appointments/:id", () => {
  it("happy path: patient updates their own appointment", async () => {
    const { token } = await registerUser();
    const { appointment } = await createAppointment(token);

    const res = await request(app).patch(`/api/appointments/${appointment.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ doctorName: "Dr. Updated" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.appointment.doctorName).toBe("Dr. Updated");
  });

  it("negative: patient gets 403 updating another's appointment", async () => {
    const { token: t1 } = await registerUser({ email: "p1@test.com" });
    const { token: t2 } = await registerUser({ email: "p2@test.com" });
    const { appointment } = await createAppointment(t1);

    const res = await request(app).patch(`/api/appointments/${appointment.id}`)
      .set("Authorization", `Bearer ${t2}`).send({ doctorName: "Hacker" });
    expect(res.statusCode).toBe(403);
  });

  it("negative: patient cannot change status to confirmed", async () => {
    const { token } = await registerUser();
    const { appointment } = await createAppointment(token);

    const res = await request(app).patch(`/api/appointments/${appointment.id}`)
      .set("Authorization", `Bearer ${token}`).send({ status: "confirmed" });
    // Status should stay pending
    expect(res.body.data.appointment.status).toBe("pending");
  });
});

// ── DELETE ───────────────────────────────────────────────────────────────────
describe("DELETE /api/appointments/:id", () => {
  it("happy path: patient deletes their own appointment", async () => {
    const { token } = await registerUser();
    const { appointment } = await createAppointment(token);

    const res = await request(app).delete(`/api/appointments/${appointment.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });

  it("negative: 403 when deleting another patient's appointment", async () => {
    const { token: t1 } = await registerUser({ email: "p1@test.com" });
    const { token: t2 } = await registerUser({ email: "p2@test.com" });
    const { appointment } = await createAppointment(t1);

    const res = await request(app).delete(`/api/appointments/${appointment.id}`)
      .set("Authorization", `Bearer ${t2}`);
    expect(res.statusCode).toBe(403);
  });

  it("admin can delete any appointment", async () => {
    const { token: pt } = await registerUser({ email: "p@test.com" });
    const { token: adminToken } = await registerAdmin();
    const { appointment } = await createAppointment(pt);

    const res = await request(app).delete(`/api/appointments/${appointment.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});
