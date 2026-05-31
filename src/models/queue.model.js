const getQueue = () => {
  try {
    return require("./appointment.model")._getQueue();
  } catch {
    return [];
  }
};

const QueueModel = {
  findByDate(date) {
    return getQueue().filter(q => q.date === date).sort((a, b) => a.number.localeCompare(b.number));
  },
  findByAppointmentId(id) {
    return getQueue().find(q => q.appointmentId === id);
  },
  findById(id) {
    return getQueue().find(q => q.id === id || q._id === id);
  },
  updateStatus(id, status) {
    const q = getQueue();
    const i = q.findIndex(e => e.id === id || e._id === id);
    if (i === -1) return null;
    q[i] = { ...q[i], status, ...(status === "called" ? { calledAt: new Date().toISOString() } : {}) };
    return q[i];
  },
  getPosition(id, date) {
    const sorted = getQueue()
      .filter(q => q.date === date && q.status === "waiting")
      .sort((a, b) => a.number.localeCompare(b.number));
    const pos = sorted.findIndex(q => q.id === id || q._id === id);
    return pos === -1 ? null : pos + 1;
  },
  findAll() { return [...getQueue()]; },
};

if (process.env.NODE_ENV !== "test") {
  const mongoose = require("mongoose");
  const queueSchema = new mongoose.Schema({
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    number:   { type: String, required: true },
    date:     { type: String, required: true },
    status:   { type: String, enum: ["waiting","called","done","skipped"], default: "waiting" },
    calledAt: { type: Date, default: null },
  }, { timestamps: true });
  module.exports = mongoose.model("Queue", queueSchema);
} else {
  module.exports = QueueModel;
}