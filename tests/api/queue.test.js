/**
 * queue.test.js — Queue Management + Happy Path + Negative Cases
 */
const request = require("supertest");
const app = require("../../src/app");
const { resetDB, registerUser, registerAdmin, createAppointment } = require("./helpers");

beforeEach(() => resetDB());

const TOMORROW = new Date(Date.now() + 86400000).toISOString().split("T")[0];

async function setupQueueEntry() {
  const { token: adminToken } = await registerAdmin();
  const { token: patientToken } = await registerUser({ email: `q_${Date.now()}@test.com` });
  const { appointment } = await createAppointment(patientToken, { date: TOMORROW });
  const queueRes = await request(app)
    .get(`/api/queue/date/${TOMORROW}`)
    .set("Authorization", `Bearer ${adminToken}`);
  const queueEntry = queueRes.body.data.queue[0];
  return { adminToken, patientToken, appointment, queueEntry };
}

describe("GET /api/queue (today)", () => {
  it("admin sees today's queue with stats", async () => {
    const { token: adminToken } = await registerAdmin();
    const { token: pt } = await registerUser({ email: "p@test.com" });
    const today = new Date().toISOString().split("T")[0];
    await createAppointment(pt, { date: today });

    const res = await request(app).get("/api/queue").set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("total");
    expect(res.body.data).toHaveProperty("waiting");
  });

  it("negative: patient gets 403", async () => {
    const { token } = await registerUser();
    const res = await request(app).get("/api/queue").set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  it("negative: 401 without token", async () => {
    const res = await request(app).get("/api/queue");
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/queue/my", () => {
  it("happy path: returns patient queue entries with position", async () => {
    const { patientToken } = await setupQueueEntry();
    const res = await request(app).get("/api/queue/my").set("Authorization", `Bearer ${patientToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.queueEntries.length).toBe(1);
    expect(res.body.data.queueEntries[0]).toHaveProperty("position");
    expect(res.body.data.queueEntries[0]).toHaveProperty("number");
  });

  it("returns empty array with no appointments", async () => {
    const { token } = await registerUser();
    const res = await request(app).get("/api/queue/my").set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.queueEntries).toEqual([]);
  });
});

describe("GET /api/queue/date/:date", () => {
  it("happy path: returns queue for a specific date", async () => {
    const { adminToken } = await setupQueueEntry();
    const res = await request(app)
      .get(`/api/queue/date/${TOMORROW}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.date).toBe(TOMORROW);
    expect(res.body.data.queue.length).toBeGreaterThan(0);
  });

  it("negative: returns 400 for invalid date format", async () => {
    const { token: adminToken } = await registerAdmin();
    const res = await request(app).get("/api/queue/date/bad-date")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(400);
  });

  it("negative: patient gets 403", async () => {
    const { token } = await registerUser();
    const res = await request(app).get(`/api/queue/date/${TOMORROW}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });
});

describe("PATCH /api/queue/:id/status", () => {
  it("happy path: admin calls a patient", async () => {
    const { adminToken, queueEntry } = await setupQueueEntry();
    const res = await request(app)
      .patch(`/api/queue/${queueEntry.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "called" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.queueEntry.status).toBe("called");
    expect(res.body.data.queueEntry.calledAt).toBeTruthy();
  });

  it("happy path: staff marks patient as served → appointment completed", async () => {
    const { adminToken, queueEntry } = await setupQueueEntry();
    const res = await request(app)
      .patch(`/api/queue/${queueEntry.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "done" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.queueEntry.status).toBe("done");
  });

  it("negative: patient gets 403 trying to mark served", async () => {
    const { patientToken, queueEntry } = await setupQueueEntry();
    const res = await request(app)
      .patch(`/api/queue/${queueEntry.id}/status`)
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ status: "done" });
    expect(res.statusCode).toBe(403);
  });

  it("negative: rejects invalid status values (400)", async () => {
    const { adminToken, queueEntry } = await setupQueueEntry();
    const res = await request(app)
      .patch(`/api/queue/${queueEntry.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "invalid-status" });
    expect(res.statusCode).toBe(400);
  });

  it("negative: returns 404 for non-existent queue entry", async () => {
    const { token: adminToken } = await registerAdmin();
    const res = await request(app)
      .patch("/api/queue/fake-id/status")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "called" });
    expect(res.statusCode).toBe(404);
  });
});
