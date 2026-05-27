/**
 * queue.model.js — Queue Model
 *
 * The queue tracks patients waiting to be seen.
 * Each queue entry has:
 *   - number        → the queue number shown to the patient (e.g. Q-001)
 *   - appointmentId → links back to the appointment
 *   - date          → which day this queue is for
 *   - status        → "waiting" | "called" | "done" | "skipped"
 */

const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

const QueueModel = {
  /**
   * Assign a queue number to an appointment.
   * The number auto-increments per day (Q-001, Q-002, …).
   */
  assign(appointmentId, date) {
    // How many queue entries exist for this date already?
    const todayCount = db.queue.filter((q) => q.date === date).length;
    const number = `Q-${String(todayCount + 1).padStart(3, "0")}`; // Q-001

    const entry = {
      id: uuidv4(),
      appointmentId,
      number,
      date,
      status: "waiting",
      assignedAt: new Date().toISOString(),
      calledAt: null,
    };

    db.queue.push(entry);
    return entry;
  },

  /** Get all queue entries for a specific date. */
  findByDate(date) {
    return db.queue
      .filter((q) => q.date === date)
      .sort((a, b) => a.number.localeCompare(b.number)); // sort Q-001, Q-002 …
  },

  /** Find queue entry by appointment ID. */
  findByAppointmentId(appointmentId) {
    return db.queue.find((q) => q.appointmentId === appointmentId);
  },

  /** Find a queue entry by its ID. */
  findById(id) {
    return db.queue.find((q) => q.id === id);
  },

  /** Update queue entry status (called, done, skipped). */
  updateStatus(id, status) {
    const index = db.queue.findIndex((q) => q.id === id);
    if (index === -1) return null;

    db.queue[index] = {
      ...db.queue[index],
      status,
      ...(status === "called" ? { calledAt: new Date().toISOString() } : {}),
    };

    return db.queue[index];
  },

  /** Get the current queue position for a specific entry. */
  getPosition(id, date) {
    const sorted = db.queue
      .filter((q) => q.date === date && q.status === "waiting")
      .sort((a, b) => a.number.localeCompare(b.number));

    const pos = sorted.findIndex((q) => q.id === id);
    return pos === -1 ? null : pos + 1; // 1-based position
  },

  /** Get all queue entries (admin). */
  findAll() {
    return [...db.queue];
  },
};

module.exports = QueueModel;
