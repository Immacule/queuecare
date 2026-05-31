/**
 * server.js — Loads .env, connects MongoDB, starts Express
 */

require("dotenv").config(); // must be first line

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════╗
  ║     🏥  QueueCare API Server         ║
  ║     Running on http://localhost:${PORT}  ║
  ╚══════════════════════════════════════╝
    `);
  });
});