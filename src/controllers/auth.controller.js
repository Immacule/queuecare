/**
 * auth.controller.js — Authentication Logic
 *
 * Handles:
 *   POST /api/auth/register → create a new account
 *   POST /api/auth/login    → log in and receive a JWT token
 *   GET  /api/auth/me       → get the currently logged-in user's profile
 */

const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/jwt");
const UserModel = require("../models/user.model");

/**
 * generateToken — creates a JWT signed with our secret.
 * The token payload contains the user's ID and role.
 * It expires after JWT_EXPIRES_IN (default: 24 hours).
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/** POST /api/auth/register */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Only allow "patient" or "admin" roles
    const validRole = ["patient", "admin"].includes(role) ? role : "patient";

    const user = await UserModel.create({ name, email, password, role: validRole });
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: { user, token },
    });
  } catch (err) {
    // Handle "Email already registered" error gracefully
    if (err.message === "Email already registered") {
      return res.status(409).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/** POST /api/auth/login */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 2. Compare plain password with stored hash
    const isValid = await UserModel.verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 3. Generate token
    const token = generateToken(user);

    // Don't send password back to client
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: "Logged in successfully.",
      data: { user: safeUser, token },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/auth/me — returns the current user's profile. */
const me = (req, res) => {
  // req.user is set by the authenticate middleware
  res.json({
    success: true,
    data: { user: req.user },
  });
};

module.exports = { register, login, me };
