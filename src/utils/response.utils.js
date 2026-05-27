/**
 * response.utils.js — Response Helpers
 *
 * Utility functions to build consistent API responses.
 * Using these keeps all controllers uniform and easy to maintain.
 */

const success = (res, data = {}, message = "OK", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const error = (res, message = "An error occurred", statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { success, error };
