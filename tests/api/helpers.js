const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/config/db");

const resetDB = () => { db.users = []; db.appointments = []; db.queue = []; };

const registerUser = async (overrides = {}) => {
  const defaults = { name: "Test User", email: `u_${Date.now()}@test.com`, password: "pass1234", role: "patient" };
  const payload = { ...defaults, ...overrides };
  const res = await request(app).post("/api/auth/register").send(payload);
  return { token: res.body.data?.token, user: res.body.data?.user, res };
};

const registerAdmin = (overrides = {}) =>
  registerUser({ role: "admin", email: `admin_${Date.now()}@test.com`, name: "Admin", ...overrides });

// Creates a future-dated appointment by default
const createAppointment = async (token, overrides = {}) => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const defaults = { doctorName: "Dr. Test", date: tomorrow, time: "10:00", notes: "Test" };
  const payload = { ...defaults, ...overrides };
  const res = await request(app)
    .post("/api/appointments")
    .set("Authorization", `Bearer ${token}`)
    .send(payload);
  return { appointment: res.body.data?.appointment, res };
};

module.exports = { resetDB, registerUser, registerAdmin, createAppointment };
