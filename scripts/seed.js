/**
 * seed.js — Database Seeder
 *
 * Run with: npm run seed
 *
 * Creates:
 *   - 1 admin user
 *   - 2 patient users
 *   - 3 sample appointments
 *   - Queue entries for confirmed appointments
 *
 * Useful for manual testing via curl or Postman/Bruno.
 * Note: Since we use in-memory storage, this only applies
 * to a running server (it starts the app then seeds it via HTTP).
 */

const http = require("http");

const BASE = "http://localhost:3000/api";

async function post(path, body, token = null) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(BASE + path, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function patch(path, body, token) {
  const options = {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(BASE + path, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function seed() {
  console.log("🌱 Seeding QueueCare database...\n");

  // Create admin
  const adminRes = await post("/auth/register", {
    name: "Dr. Admin",
    email: "admin@queuecare.com",
    password: "admin123",
    role: "admin",
  });
  const adminToken = adminRes.data?.token;
  console.log("✅ Admin created:", adminRes.data?.user?.email);

  // Create patients
  const p1 = await post("/auth/register", {
    name: "Alice Patient",
    email: "alice@example.com",
    password: "alice123",
    role: "patient",
  });
  const p1Token = p1.data?.token;
  console.log("✅ Patient 1 created:", p1.data?.user?.email);

  const p2 = await post("/auth/register", {
    name: "Bob Patient",
    email: "bob@example.com",
    password: "bob123",
    role: "patient",
  });
  const p2Token = p2.data?.token;
  console.log("✅ Patient 2 created:", p2.data?.user?.email);

  const today = new Date().toISOString().split("T")[0];

  // Book appointments
  const a1 = await post("/appointments", {
    doctorName: "Dr. Smith",
    date: today,
    time: "09:00",
    notes: "Regular checkup",
  }, p1Token);
  console.log("✅ Appointment 1:", a1.data?.appointment?.id);

  const a2 = await post("/appointments", {
    doctorName: "Dr. Jones",
    date: today,
    time: "10:30",
  }, p2Token);
  console.log("✅ Appointment 2:", a2.data?.appointment?.id);

  // Confirm appointments (admin assigns queue numbers)
  if (a1.data?.appointment?.id) {
    await patch(`/appointments/${a1.data.appointment.id}`, { status: "confirmed" }, adminToken);
    console.log("✅ Appointment 1 confirmed + queue assigned");
  }

  if (a2.data?.appointment?.id) {
    await patch(`/appointments/${a2.data.appointment.id}`, { status: "confirmed" }, adminToken);
    console.log("✅ Appointment 2 confirmed + queue assigned");
  }

  console.log("\n🎉 Seeding complete!\n");
  console.log("Login credentials:");
  console.log("  Admin:     admin@queuecare.com  / admin123");
  console.log("  Patient 1: alice@example.com    / alice123");
  console.log("  Patient 2: bob@example.com      / bob123");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  console.error("Make sure the server is running: npm start");
});
