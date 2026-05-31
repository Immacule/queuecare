require("dotenv").config();
const connectDB = require("./config/db");
connectDB();
const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Serve HTML frontend from /public
app.use(express.static(path.join(__dirname, "../public")));

// Root → redirect to login
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// API health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "QueueCare API is running 🏥", timestamp: new Date().toISOString() });
});

// API Routes
const authRoutes = require("./routes/auth.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const queueRoutes = require("./routes/queue.routes");

app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/queue", queueRoutes);

// Error handling
const { errorHandler, notFound } = require("./middleware/error.middleware");
app.use(notFound);
app.use(errorHandler);

module.exports = app;
