/**
 * appointment.model.js — Appointment Model
 *
 * Statuses: "pending" → "confirmed" → "completed" | "cancelled"
 * Queue number: assigned immediately on create (auto-increments per day)
 */

const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

const AppointmentModel = {
  /** Create a new appointment. Queue number assigned immediately. */
  create({ patientId, doctorName, date, time, notes = "" }) {
    // Check for duplicate: same patient, same date, active appointment
    const duplicate = db.appointments.find(
      (a) =>
        a.patientId === patientId &&
        a.date === date &&
        !["cancelled"].includes(a.status)
    );
    if (duplicate) {
      const err = new Error(
        "You already have an active appointment on this date."
      );
      err.statusCode = 409;
      throw err;
    }

    // Auto-assign queue number on booking
    const todayCount = db.appointments.filter(
      (a) => a.date === date && a.status !== "cancelled"
    ).length;
    const queueNumber = `Q-${String(todayCount + 1).padStart(3, "0")}`;

    const appointment = {
      id: uuidv4(),
      patientId,
      doctorName,
      date,
      time,
      notes,
      status: "pending",
      queueNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.appointments.push(appointment);

    // Also add to queue
    db.queue.push({
      id: uuidv4(),
      appointmentId: appointment.id,
      number: queueNumber,
      date,
      status: "waiting",
      assignedAt: new Date().toISOString(),
      calledAt: null,
    });

    return appointment;
  },

  findAll() {
    return [...db.appointments];
  },

  findByPatientId(patientId) {
    return db.appointments.filter((a) => a.patientId === patientId);
  },

  findById(id) {
    return db.appointments.find((a) => a.id === id);
  },

  update(id, changes) {
    const index = db.appointments.findIndex((a) => a.id === id);
    if (index === -1) return null;
    db.appointments[index] = {
      ...db.appointments[index],
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    return db.appointments[index];
  },

  delete(id) {
    const index = db.appointments.findIndex((a) => a.id === id);
    if (index === -1) return false;
    db.appointments.splice(index, 1);
    return true;
  },

  findByDate(date) {
    return db.appointments.filter((a) => a.date === date);
  },
};

module.exports = AppointmentModel;
