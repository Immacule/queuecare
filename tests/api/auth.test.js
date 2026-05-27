/**
 * auth.test.js — Authentication API Tests
 *
 * Tests every auth endpoint:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   GET  /api/auth/me
 *
 * Pattern used: AAA (Arrange, Act, Assert)
 *   Arrange → set up the data
 *   Act     → make the HTTP request
 *   Assert  → check the response
 */

const request = require("supertest");
const app = require("../../src/app");
const { resetDB, registerUser } = require("./helpers");

// Reset the database before each test to ensure isolation
beforeEach(() => resetDB());

// ─── Register ────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("should register a new patient successfully", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Alice Test",
      email: "alice@test.com",
      password: "secret123",
      role: "patient",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toHaveProperty("id");
    expect(res.body.data.user.email).toBe("alice@test.com");
    expect(res.body.data.user.role).toBe("patient");
    expect(res.body.data.token).toBeTruthy(); // JWT returned
    // Password should NEVER be in the response
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("should register an admin user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Admin User",
      email: "admin@test.com",
      password: "admin123",
      role: "admin",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.user.role).toBe("admin");
  });

  it("should reject duplicate email registration", async () => {
    // First registration succeeds
    await request(app).post("/api/auth/register").send({
      name: "First User",
      email: "dupe@test.com",
      password: "pass123",
    });

    // Second registration with same email fails
    const res = await request(app).post("/api/auth/register").send({
      name: "Second User",
      email: "dupe@test.com",
      password: "pass456",
    });

    expect(res.statusCode).toBe(409); // Conflict
    expect(res.body.success).toBe(false);
  });

  it("should reject invalid email format", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Bad Email",
      email: "not-an-email",
      password: "pass123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject short passwords (less than 6 chars)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Short Pass",
      email: "short@test.com",
      password: "abc",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors.some((e) => e.includes("Password"))).toBe(true);
  });

  it("should reject missing required fields", async () => {
    const res = await request(app).post("/api/auth/register").send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

// ─── Login ───────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("should login with correct credentials and return a token", async () => {
    // Arrange: create a user first
    await registerUser({ email: "login@test.com", password: "mypass123" });

    // Act
    const res = await request(app).post("/api/auth/login").send({
      email: "login@test.com",
      password: "mypass123",
    });

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.password).toBeUndefined(); // no password in response
  });

  it("should reject incorrect password", async () => {
    await registerUser({ email: "wrongpass@test.com", password: "correct123" });

    const res = await request(app).post("/api/auth/login").send({
      email: "wrongpass@test.com",
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject non-existent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@test.com",
      password: "somepass123",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject missing password field", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "user@test.com",
    });

    expect(res.statusCode).toBe(400);
  });
});

// ─── Me ──────────────────────────────────────────────────────────────────────

describe("GET /api/auth/me", () => {
  it("should return the current user's profile", async () => {
    const { token, user } = await registerUser({ email: "me@test.com" });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.id).toBe(user.id);
    expect(res.body.data.user.email).toBe("me@test.com");
  });

  it("should reject request without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });

  it("should reject a malformed/invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer this.is.not.valid");

    expect(res.statusCode).toBe(401);
  });
});
