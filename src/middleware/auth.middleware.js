/**
 * auth.middleware.js — Authentication & Authorization Middleware
 *
 * How JWT authentication works:
 *   1. Client logs in  → server creates a signed token (JWT)
 *   2. Client stores the token and sends it with every request
 *      in the Authorization header:  "Bearer <token>"
 *   3. This middleware verifies the token on every protected route.
 *
 * Usage in routes:
 *   router.get("/profile", authenticate, handler)            // any logged-in user
 *   router.delete("/user", authenticate, authorize("admin"), handler) // admin only
 */

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt");
const UserModel = require("../models/user.model");

/**
 * authenticate — verifies the JWT token.
 * Attaches the decoded user object to req.user if valid.
 */
const authenticate = (req, res, next) => {
  // 1. Extract the token from the header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1]; // "Bearer TOKEN" → "TOKEN"

  try {
    // 2. Verify the token signature and expiry
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3. Make sure the user still exists in DB
    const user = UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    // 4. Attach user to request object for use in controllers
    req.user = user;
    next(); // continue to the actual route handler
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

/**
 * authorize — checks if the logged-in user has the required role.
 * Must be used AFTER authenticate.
 *
 * Example: authorize("admin") — only admins can proceed.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
