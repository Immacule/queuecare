/**
 * server.js — HTTP Server Entry Point
 *
 * This file starts the actual HTTP server.
 * We keep it separate from app.js so that tests can import
 * app.js without accidentally starting the server on a port.
 */

const app = require("./app");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║     🏥  QueueCare API Server         ║
  ║     Running on http://localhost:${PORT}  ║
  ╚══════════════════════════════════════╝

  Quick test:
    curl http://localhost:${PORT}/api/health
  `);
});

// Graceful shutdown on Ctrl+C
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => process.exit(0));
});

module.exports = server;
