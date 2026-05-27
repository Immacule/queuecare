const request = require("supertest");
const app = require("../../src/app");

describe("GET /api/health", () => {
  it("should return healthy status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("QueueCare");
  });
});
