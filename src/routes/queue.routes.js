/**
 * queue.routes.js — Queue Routes
 *
 * GET    /api/queue              → today's queue (admin only)
 * GET    /api/queue/my           → patient's own queue status (any user)
 * GET    /api/queue/date/:date   → queue for a date (admin only)
 * PATCH  /api/queue/:id/status   → update queue entry (admin only)
 */

const express = require("express");
const router = express.Router();

const {
  getTodayQueue,
  getMyQueue,
  getQueueByDate,
  updateStatus,
} = require("../controllers/queue.controller");

const { authenticate, authorize } = require("../middleware/auth.middleware");

// All queue routes require authentication
router.use(authenticate);

// Patient route — check own queue position
router.get("/my", getMyQueue);

// Admin-only routes
router.get("/", authorize("admin"), getTodayQueue);
router.get("/date/:date", authorize("admin"), getQueueByDate);
router.patch("/:id/status", authorize("admin"), updateStatus);

module.exports = router;
