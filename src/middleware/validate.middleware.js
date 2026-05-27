/**
 * validate.middleware.js — Request Body Validation
 *
 * Covers all validation the assessment requires:
 *   - Past date rejection
 *   - Invalid date format
 *   - Missing required fields
 *   - Reschedule to past date
 */

/** Validate registration request body. */
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2)
    errors.push("Name must be at least 2 characters.");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push("A valid email is required.");

  if (!password || password.length < 6)
    errors.push("Password must be at least 6 characters.");

  if (errors.length > 0)
    return res.status(400).json({ success: false, errors });

  next();
};

/** Validate login request body. */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) errors.push("Email is required.");
  if (!password) errors.push("Password is required.");

  if (errors.length > 0)
    return res.status(400).json({ success: false, errors });

  next();
};

/**
 * Validate appointment creation body.
 * Rejects past dates and bad formats.
 */
const validateAppointment = (req, res, next) => {
  const { doctorName, date, time } = req.body;
  const errors = [];

  if (!doctorName || doctorName.trim().length < 2)
    errors.push("Doctor name must be at least 2 characters.");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push("Date must be in YYYY-MM-DD format (e.g. 2025-06-15).");
  } else {
    // Reject past dates
    const today = new Date().toISOString().split("T")[0];
    if (date < today)
      errors.push("Appointment date cannot be in the past.");
  }

  if (!time || !/^\d{2}:\d{2}$/.test(time))
    errors.push("Time must be in HH:MM format (e.g. 09:30).");

  if (errors.length > 0)
    return res.status(400).json({ success: false, errors });

  next();
};

/**
 * Validate appointment update body.
 * Only validates date/time if they are being changed.
 * Rejects rescheduling to a past date.
 */
const validateAppointmentUpdate = (req, res, next) => {
  const { date, time } = req.body;
  const errors = [];

  if (date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push("Date must be in YYYY-MM-DD format (e.g. 2025-06-15).");
    } else {
      const today = new Date().toISOString().split("T")[0];
      if (date < today)
        errors.push("Cannot reschedule to a past date.");
    }
  }

  if (time !== undefined && !/^\d{2}:\d{2}$/.test(time))
    errors.push("Time must be in HH:MM format (e.g. 09:30).");

  if (errors.length > 0)
    return res.status(400).json({ success: false, errors });

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateAppointment,
  validateAppointmentUpdate,
};
