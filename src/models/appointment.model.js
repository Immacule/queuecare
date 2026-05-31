const { v4: uuidv4 } = require("uuid");

const db = { appointments: [], queue: [] };

const AppointmentModel = {
  create({ patientId, doctorName, date, time, notes = "" }) {
    const duplicate = db.appointments.find(
      a => a.patientId === patientId && a.date === date && a.status !== "cancelled"
    );
    if (duplicate) {
      const err = new Error("You already have an active appointment on this date.");
      err.statusCode = 409;
      throw err;
    }
    const count = db.appointments.filter(a => a.date === date && a.status !== "cancelled").length;
    const queueNumber = `Q-${String(count + 1).padStart(3, "0")}`;
    const appointment = {
      id: uuidv4(), _id: uuidv4(),
      patientId, doctorName, date, time, notes,
      status: "pending", queueNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.appointments.push(appointment);
    db.queue.push({
      id: uuidv4(), _id: uuidv4(),
      appointmentId: appointment.id,
      number: queueNumber, date,
      status: "waiting",
      assignedAt: new Date().toISOString(),
      calledAt: null,
    });
    return appointment;
  },
  findAll() { return [...db.appointments]; },
  findByPatientId(id) { return db.appointments.filter(a => a.patientId === id); },
  findById(id) { return db.appointments.find(a => a.id === id || a._id === id); },
  update(id, changes) {
    const i = db.appointments.findIndex(a => a.id === id || a._id === id);
    if (i === -1) return null;
    db.appointments[i] = { ...db.appointments[i], ...changes, updatedAt: new Date().toISOString() };
    return db.appointments[i];
  },
  delete(id) {
    const i = db.appointments.findIndex(a => a.id === id || a._id === id);
    if (i === -1) return false;
    db.appointments.splice(i, 1);
    return true;
  },
  findByDate(date) { return db.appointments.filter(a => a.date === date); },
  _reset() { db.appointments = []; db.queue = []; },
  _getQueue() { return db.queue; },
};

if (process.env.NODE_ENV !== "test") {
  const mongoose = require("mongoose");
  const appointmentSchema = new mongoose.Schema({
    patientId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorName:  { type: String, required: true, trim: true, minlength: 2 },
    date:        { type: String, required: true },
    time:        { type: String, required: true },
    notes:       { type: String, default: "" },
    status:      { type: String, enum: ["pending","confirmed","completed","cancelled"], default: "pending" },
    queueNumber: { type: String, default: null },
  }, { timestamps: true });
  module.exports = mongoose.model("Appointment", appointmentSchema);
} else {
  module.exports = AppointmentModel;
}