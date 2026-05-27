/**
 * db.js — In-Memory Database
 *
 * For simplicity (and zero setup), we store data in plain JS arrays.
 * In a real app you'd swap this for PostgreSQL, MongoDB, etc.
 *
 * Structure:
 *   users[]        → registered accounts
 *   appointments[] → booked appointments
 *   queue[]        → today's queue numbers
 */

const db = {
  users: [],        // { id, name, email, password, role }
  appointments: [], // { id, patientId, doctorName, date, time, status, queueNumber }
  queue: [],        // { id, appointmentId, number, date, status }
};

module.exports = db;
