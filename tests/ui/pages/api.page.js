/**
 * api.page.js — Playwright API Helper (Page Object Pattern)
 *
 * The Page Object pattern wraps reusable actions into a class.
 * Instead of repeating raw HTTP calls in every test,
 * we call helpers like: api.login("email", "pass")
 *
 * Playwright's `request` context lets us make HTTP requests
 * from within browser test contexts.
 */

class ApiPage {
  constructor(request) {
    this.request = request; // Playwright's APIRequestContext
    this.baseUrl = "http://localhost:3000/api";
  }

  /** POST /api/auth/register */
  async register(userData) {
    const res = await this.request.post(`${this.baseUrl}/auth/register`, {
      data: userData,
    });
    const body = await res.json();
    return { status: res.status(), body };
  }

  /** POST /api/auth/login → returns token */
  async login(email, password) {
    const res = await this.request.post(`${this.baseUrl}/auth/login`, {
      data: { email, password },
    });
    const body = await res.json();
    return {
      status: res.status(),
      token: body.data?.token,
      user: body.data?.user,
      body,
    };
  }

  /** POST /api/appointments */
  async createAppointment(token, data) {
    const today = new Date().toISOString().split("T")[0];
    const res = await this.request.post(`${this.baseUrl}/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { doctorName: "Dr. Test", date: today, time: "10:00", ...data },
    });
    const body = await res.json();
    return { status: res.status(), appointment: body.data?.appointment, body };
  }

  /** GET /api/appointments */
  async getAppointments(token, query = "") {
    const res = await this.request.get(
      `${this.baseUrl}/appointments${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const body = await res.json();
    return { status: res.status(), appointments: body.data?.appointments, body };
  }

  /** PATCH /api/appointments/:id */
  async updateAppointment(token, id, data) {
    const res = await this.request.patch(
      `${this.baseUrl}/appointments/${id}`,
      { headers: { Authorization: `Bearer ${token}` }, data }
    );
    const body = await res.json();
    return { status: res.status(), appointment: body.data?.appointment, body };
  }

  /** DELETE /api/appointments/:id */
  async deleteAppointment(token, id) {
    const res = await this.request.delete(
      `${this.baseUrl}/appointments/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const body = await res.json();
    return { status: res.status(), body };
  }

  /** GET /api/queue */
  async getQueue(token) {
    const res = await this.request.get(`${this.baseUrl}/queue`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    return { status: res.status(), queue: body.data?.queue, body };
  }

  /** GET /api/queue/my */
  async getMyQueue(token) {
    const res = await this.request.get(`${this.baseUrl}/queue/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    return { status: res.status(), entries: body.data?.queueEntries, body };
  }

  /** PATCH /api/queue/:id/status */
  async updateQueueStatus(token, queueId, status) {
    const res = await this.request.patch(
      `${this.baseUrl}/queue/${queueId}/status`,
      { headers: { Authorization: `Bearer ${token}` }, data: { status } }
    );
    const body = await res.json();
    return { status: res.status(), entry: body.data?.queueEntry, body };
  }

  /** GET /api/health */
  async health() {
    const res = await this.request.get(`${this.baseUrl}/health`);
    return { status: res.status(), body: await res.json() };
  }
}

module.exports = { ApiPage };
