/**
 * auth.routes.js — Authentication Routes
 *
 * Public routes (no token required):
 *   POST /api/auth/register
 *   POST /api/auth/login
 *
 * Protected routes (token required):
 *   GET /api/auth/me
 */

const express = require("express");
const router = express.Router();

const { register, login, me } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validateRegister, validateLogin } = require("../middleware/validate.middleware");

// Public
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);

// Protected — must be logged in
router.get("/me", authenticate, me);

module.exports = router;
