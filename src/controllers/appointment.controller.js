/**
 * appointment.controller.js — Appointment CRUD
 *
 * Full business logic including:
 *   - Duplicate booking rejection (409)
 *   - Cancel already-cancelled gracefully
 *   - Queue auto-assigned on create
 */

const AppointmentModel = require("../models/appointment.model");
const QueueModel = require("../models/queue.model");

/** POST /api/appointments */
const create = (req, res, next) => {
  try {
    const { doctorName, date, time, notes } = req.body;
    const appointment = AppointmentModel.create({
      patientId: req.user.id,
      doctorName,
      date,
      time,
      notes,
    });
    res.status(201).json({
      success: true,
      message: "Appointment booked successfully.",
      data: { appointment },
    });
  } catch (err) {
    if (err.statusCode === 409)
      return res.status(409).json({ success: false, message: err.message });
    next(err);
  }
};

/** GET /api/appointments */
const list = (req, res, next) => {
  try {
    let appointments =
      req.user.role === "admin"
        ? AppointmentModel.findAll()
        : AppointmentModel.findByPatientId(req.user.id);

    if (req.query.date)
      appointments = appointments.filter((a) => a.date === req.query.date);
    if (req.query.status)
      appointments = appointments.filter((a) => a.status === req.query.status);

    res.json({ success: true, data: { appointments, total: appointments.length } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/appointments/:id */
const getOne = (req, res, next) => {
  try {
    const appointment = AppointmentModel.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ success: false, message: "Appointment not found." });

    if (req.user.role !== "admin" && appointment.patientId !== req.user.id)
      return res.status(403).json({ success: false, message: "Access denied." });

    res.json({ success: true, data: { appointment } });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/appointments/:id */
const update = (req, res, next) => {
  try {
    const appointment = AppointmentModel.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ success: false, message: "Appointment not found." });

    if (req.user.role !== "admin" && appointment.patientId !== req.user.id)
      return res.status(403).json({ success: false, message: "Access denied." });

    // Gracefully handle cancelling an already-cancelled appointment
    if (req.body.status === "cancelled" && appointment.status === "cancelled")
      return res.status(200).json({
        success: true,
        message: "Appointment is already cancelled.",
        data: { appointment },
      });

    const allowedFields =
      req.user.role === "admin"
        ? ["doctorName", "date", "time", "notes", "status"]
        : ["doctorName", "date", "time", "notes"];

    const changes = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) changes[f] = req.body[f];
    });

    const updated = AppointmentModel.update(req.params.id, changes);
    res.json({ success: true, message: "Appointment updated.", data: { appointment: updated } });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/appointments/:id */
const remove = (req, res, next) => {
  try {
    const appointment = AppointmentModel.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ success: false, message: "Appointment not found." });

    if (req.user.role !== "admin" && appointment.patientId !== req.user.id)
      return res.status(403).json({ success: false, message: "Access denied." });

    AppointmentModel.delete(req.params.id);
    res.json({ success: true, message: "Appointment cancelled." });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, list, getOne, update, remove };
