/**
 * error.middleware.js — Global Error Handler
 *
 * Express catches errors thrown in route handlers and passes them here.
 * A consistent error format makes it easier for frontend apps to handle errors.
 *
 * To trigger this from a controller:
 *   next(new Error("Something went wrong"))
 *   — or —
 *   throw new Error("Something went wrong")  (only works with express-async-errors or async wrapper)
 */

const errorHandler = (err, req, res, next) => {
  // Log the error (in production, use a proper logger like Winston)
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Determine status code
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    // Only show stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * notFound — handles routes that don't exist.
 * Must be registered AFTER all routes.
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
};

module.exports = { errorHandler, notFound };
