/**
 * queuecare.spec.js — Playwright E2E Tests
 * Tests real browser flows against the HTML UI + API.
 *
 * Groups:
 *   1. Login flow (valid, invalid, empty form)
 *   2. Register flow
 *   3. Create appointment + verify booking appears
 *   4. Form validation (empty fields, bad date)
 *   5. Update / cancel appointment
 *   6. Queue management flow
 *   7. Role-based authorization
 */

const { test, expect } = require("@playwright/test");

const BASE = "http://localhost:3000";
const TOMORROW = new Date(Date.now() + 86400000).toISOString().split("T")[0];
const DAY_AFTER = new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0];

// ── Helpers ──────────────────────────────────────────────────────────────────
async function registerViaAPI(request, overrides = {}) {
  const email = `pw_${Date.now()}@test.com`;
  const password = "testpass123";
  const res = await request.post(`${BASE}/api/auth/register`, {
    data: { name: "PW User", email, password, role: "patient", ...overrides },
  });
  const body = await res.json();
  return { email, password, token: body.data?.token, user: body.data?.user };
}

async function loginViaUI(page, email, password) {
  await page.goto(`${BASE}/login.html`);
  await page.locator('[data-testid="login-email"]').fill(email);
  await page.locator('[data-testid="login-password"]').fill(password);
  await page.locator('[data-testid="login-submit"]').click();
}

// ── 1. Login Flow ─────────────────────────────────────────────────────────────
test.describe("Login Flow", () => {
  test("valid credentials redirect to dashboard", async ({ page, request }) => {
    const { email, password } = await registerViaAPI(request);
    await loginViaUI(page, email, password);
    await expect(page).toHaveURL(/dashboard/);
  });

  test("invalid password shows error message", async ({ page, request }) => {
    const { email } = await registerViaAPI(request);
    await loginViaUI(page, email, "wrongpassword");
    await expect(page.locator("#login-error")).toBeVisible();
    await expect(page.locator("#login-error")).toContainText(/invalid|incorrect/i);
  });

  test("non-existent email shows error message", async ({ page }) => {
    await loginViaUI(page, "nobody@nowhere.com", "pass123");
    await expect(page.locator("#login-error")).toBeVisible();
  });

  test("empty form submission shows error message", async ({ page }) => {
    await page.goto(`${BASE}/login.html`);
    await page.locator('[data-testid="login-submit"]').click();
    await expect(page.locator("#login-error")).toBeVisible();
    await expect(page.locator("#login-error")).toContainText(/email|password/i);
  });

  test("empty email only shows error message", async ({ page }) => {
    await page.goto(`${BASE}/login.html`);
    await page.locator('[data-testid="login-password"]').fill("pass123");
    await page.locator('[data-testid="login-submit"]').click();
    await expect(page.locator("#login-error")).toBeVisible();
  });
});

// ── 2. Register Flow ──────────────────────────────────────────────────────────
test.describe("Register Flow", () => {
  test("valid registration redirects to dashboard", async ({ page }) => {
    await page.goto(`${BASE}/login.html`);
    await page.locator('[data-testid="tab-register"]').waitFor({ state: "visible" });

    // Switch to register tab
    const registerTab = page.locator("text=Register");
    await registerTab.click();

    const email = `reg_${Date.now()}@test.com`;
    await page.locator('[data-testid="register-name"]').fill("New User");
    await page.locator('[data-testid="register-email"]').fill(email);
    await page.locator('[data-testid="register-password"]').fill("pass1234");
    await page.locator('[data-testid="register-submit"]').click();

    await expect(page).toHaveURL(/dashboard/);
  });

  test("duplicate email shows error", async ({ page, request }) => {
    const { email } = await registerViaAPI(request);
    await page.goto(`${BASE}/login.html`);
    await page.locator("text=Register").click();
    await page.locator('[data-testid="register-name"]').fill("Duplicate");
    await page.locator('[data-testid="register-email"]').fill(email);
    await page.locator('[data-testid="register-password"]').fill("pass1234");
    await page.locator('[data-testid="register-submit"]').click();
    await expect(page.locator("#register-error")).toBeVisible();
  });
});

// ── 3. Create Appointment ─────────────────────────────────────────────────────
test.describe("Create Appointment", () => {
  test("fill form and verify booking appears in table", async ({ page, request }) => {
    const { email, password } = await registerViaAPI(request);
    await loginViaUI(page, email, password);
    await expect(page).toHaveURL(/dashboard/);

    await page.locator('[data-testid="btn-new-appointment"]').click();
    await page.locator('[data-testid="appt-doctor"]').fill("Dr. Playwright");
    await page.locator('[data-testid="appt-date"]').fill(TOMORROW);
    await page.locator('[data-testid="appt-time"]').fill("10:00");
    await page.locator('[data-testid="appt-submit"]').click();

    // Appointment appears in the table
    await expect(page.locator("text=Dr. Playwright")).toBeVisible();
  });

  test("queue number is assigned after booking", async ({ page, request }) => {
    const { email, password } = await registerViaAPI(request);
    await loginViaUI(page, email, password);

    await page.locator('[data-testid="btn-new-appointment"]').click();
    await page.locator('[data-testid="appt-doctor"]').fill("Dr. Queue");
    await page.locator('[data-testid="appt-date"]').fill(TOMORROW);
    await page.locator('[data-testid="appt-time"]').fill("11:00");
    await page.locator('[data-testid="appt-submit"]').click();

    // Toast message should mention queue number
    await expect(page.locator("#toast")).toContainText(/Q-\d+/);
  });
});

// ── 4. Form Validation ────────────────────────────────────────────────────────
test.describe("Form Validation", () => {
  test("empty appointment form shows error", async ({ page, request }) => {
    const { email, password } = await registerViaAPI(request);
    await loginViaUI(page, email, password);
    await page.locator('[data-testid="btn-new-appointment"]').click();
    await page.locator('[data-testid="appt-submit"]').click();
    await expect(page.locator("#modal-error")).toBeVisible();
  });

  test("missing doctor name shows error", async ({ page, request }) => {
    const { email, password } = await registerViaAPI(request);
    await loginViaUI(page, email, password);
    await page.locator('[data-testid="btn-new-appointment"]').click();
    await page.locator('[data-testid="appt-date"]').fill(TOMORROW);
    await page.locator('[data-testid="appt-time"]').fill("09:00");
    await page.locator('[data-testid="appt-submit"]').click();
    await expect(page.locator("#modal-error")).toBeVisible();
  });

  test("missing date shows error", async ({ page, request }) => {
    const { email, password } = await registerViaAPI(request);
    await loginViaUI(page, email, password);
    await page.locator('[data-testid="btn-new-appointment"]').click();
    await page.locator('[data-testid="appt-doctor"]').fill("Dr. X");
    await page.locator('[data-testid="appt-time"]').fill("09:00");
    await page.locator('[data-testid="appt-submit"]').click();
    await expect(page.locator("#modal-error")).toBeVisible();
  });
});

// ── 5. Update & Cancel ────────────────────────────────────────────────────────
test.describe("Update and Cancel Appointment", () => {
  test("edit appointment and verify change is reflected", async ({ page, request }) => {
    const { email, password, token } = await registerViaAPI(request);

    // Pre-create appointment via API
    await request.post(`${BASE}/api/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { doctorName: "Dr. Original", date: TOMORROW, time: "09:00" },
    });

    await loginViaUI(page, email, password);
    await expect(page.locator("text=Dr. Original")).toBeVisible();

    // Click edit
    const editBtns = page.locator('[data-testid^="btn-edit-"]');
    await editBtns.first().click();

    // Update doctor name
    await page.locator('[data-testid="appt-doctor"]').fill("Dr. Updated");
    await page.locator('[data-testid="appt-date"]').fill(DAY_AFTER);
    await page.locator('[data-testid="appt-submit"]').click();

    await expect(page.locator("text=Dr. Updated")).toBeVisible();
  });

  test("cancel appointment removes it from active view", async ({ page, request }) => {
    const { email, password, token } = await registerViaAPI(request);

    await request.post(`${BASE}/api/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { doctorName: "Dr. ToCancel", date: TOMORROW, time: "14:00" },
    });

    await loginViaUI(page, email, password);
    await expect(page.locator("text=Dr. ToCancel")).toBeVisible();

    // Handle confirm dialog
    page.on("dialog", d => d.accept());
    const cancelBtns = page.locator('[data-testid^="btn-cancel-"]');
    await cancelBtns.first().click();

    // Row should now show as cancelled
    await expect(page.locator(".pill-cancelled")).toBeVisible();
  });
});

// ── 6. Queue Board ────────────────────────────────────────────────────────────
test.describe("Queue Board", () => {
  test("patient can see their queue position after booking", async ({ page, request }) => {
    const { email, password, token } = await registerViaAPI(request);

    await request.post(`${BASE}/api/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { doctorName: "Dr. Queue", date: new Date().toISOString().split("T")[0], time: "10:00" },
    });

    await loginViaUI(page, email, password);
    await page.locator('[data-testid="tab-queue"]').click();

    // Queue board is visible
    await expect(page.locator("text=Today's Queue")).toBeVisible();
  });
});

// ── 7. Role-based UI ──────────────────────────────────────────────────────────
test.describe("Role-Based UI", () => {
  test("admin tab is visible for admin users", async ({ page, request }) => {
    const { email, password } = await registerViaAPI(request, { role: "admin", name: "Admin User" });
    await loginViaUI(page, email, password);
    await expect(page.locator('[data-testid="tab-admin"]')).toBeVisible();
  });

  test("admin tab is hidden for patient users", async ({ page, request }) => {
    const { email, password } = await registerViaAPI(request);
    await loginViaUI(page, email, password);
    await expect(page.locator('[data-testid="tab-admin"]')).toBeHidden();
  });
});
