/**
 * user.model.js — User Model
 *
 * Provides functions to create and find users.
 * Passwords are hashed with bcrypt before storing — never store plain text passwords!
 *
 * Roles:
 *   "patient" → can book appointments, see their own queue
 *   "admin"   → can manage all appointments, see all queues
 */

const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

const SALT_ROUNDS = 10; // bcrypt work factor

const UserModel = {
  /**
   * Create a new user.
   * Hashes the password, assigns a UUID, then saves to db.users.
   */
  async create({ name, email, password, role = "patient" }) {
    // Prevent duplicate emails
    const existing = db.users.find((u) => u.email === email);
    if (existing) throw new Error("Email already registered");

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = {
      id: uuidv4(),
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role, // "patient" | "admin"
      createdAt: new Date().toISOString(),
    };

    db.users.push(user);

    // Return user without password (never expose hashed password)
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  /** Find a user by email (used during login). */
  findByEmail(email) {
    return db.users.find((u) => u.email === email.toLowerCase().trim());
  },

  /** Find a user by ID (used when decoding JWT). */
  findById(id) {
    return db.users.find((u) => u.id === id);
  },

  /** Get all users (admin only). Strip passwords first. */
  findAll() {
    return db.users.map(({ password: _, ...u }) => u);
  },

  /**
   * Verify a plain-text password against the stored hash.
   * Returns true/false.
   */
  async verifyPassword(plainText, hash) {
    return bcrypt.compare(plainText, hash);
  },
};

module.exports = UserModel;
