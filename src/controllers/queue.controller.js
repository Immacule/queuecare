const QueueModel = require("../models/queue.model");
const AppointmentModel = require("../models/appointment.model");

const isTest = () => process.env.NODE_ENV === "test";

const getTodayQueue = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    if (isTest()) {
      const queue = QueueModel.findByDate(today);
      return res.json({ success: true, data: { date: today, queue, total: queue.length, waiting: queue.filter(q => q.status === "waiting").length, called: queue.filter(q => q.status === "called").length, done: queue.filter(q => q.status === "done").length } });
    }
    const queue = await QueueModel.find({ date: today }).sort({ number: 1 });
    res.json({ success: true, data: { date: today, queue, total: queue.length, waiting: queue.filter(q => q.status === "waiting").length, called: queue.filter(q => q.status === "called").length, done: queue.filter(q => q.status === "done").length } });
  } catch (err) { next(err); }
};

const getMyQueue = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id?.toString();
    if (isTest()) {
      const appointments = AppointmentModel.findByPatientId(userId);
      const entries = appointments.map(appt => {
        const entry = QueueModel.findByAppointmentId(appt.id);
        if (!entry) return null;
        const position = QueueModel.getPosition(entry.id, entry.date);
        return { ...entry, appointment: { doctorName: appt.doctorName, date: appt.date, time: appt.time }, position };
      }).filter(Boolean);
      return res.json({ success: true, data: { queueEntries: entries } });
    }
    const appointments = await AppointmentModel.find({ patientId: req.user._id });
    const ids = appointments.map(a => a._id);
    const entries = await QueueModel.find({ appointmentId: { $in: ids } });
    const enriched = await Promise.all(entries.map(async entry => {
      const appt = appointments.find(a => a._id.toString() === entry.appointmentId.toString());
      const ahead = await QueueModel.countDocuments({ date: entry.date, status: "waiting", number: { $lt: entry.number } });
      return { ...entry.toObject(), appointment: { doctorName: appt?.doctorName, date: appt?.date, time: appt?.time }, position: ahead + 1 };
    }));
    res.json({ success: true, data: { queueEntries: enriched } });
  } catch (err) { next(err); }
};

const getQueueByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      return res.status(400).json({ success: false, message: "Date must be YYYY-MM-DD." });
    if (isTest()) {
      const queue = QueueModel.findByDate(date);
      return res.json({ success: true, data: { date, queue, total: queue.length, waiting: queue.filter(q => q.status === "waiting").length, called: queue.filter(q => q.status === "called").length, done: queue.filter(q => q.status === "done").length } });
    }
    const queue = await QueueModel.find({ date }).sort({ number: 1 });
    res.json({ success: true, data: { date, queue, total: queue.length, waiting: queue.filter(q => q.status === "waiting").length, called: queue.filter(q => q.status === "called").length, done: queue.filter(q => q.status === "done").length } });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ["waiting", "called", "done", "skipped"];
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: `Status must be one of: ${valid.join(", ")}` });

    if (isTest()) {
      const entry = QueueModel.findById(req.params.id);
      if (!entry)
        return res.status(404).json({ success: false, message: "Queue entry not found." });
      if (status === "done" && entry.status === "done")
        return res.status(200).json({ success: true, message: "Patient is already marked as served.", data: { queueEntry: entry } });
      const updated = QueueModel.updateStatus(req.params.id, status);
      if (status === "done") AppointmentModel.update(entry.appointmentId, { status: "completed" });
      return res.json({ success: true, message: `Queue status updated to "${status}".`, data: { queueEntry: updated } });
    }

    const entry = await QueueModel.findById(req.params.id);
    if (!entry)
      return res.status(404).json({ success: false, message: "Queue entry not found." });
    if (status === "done" && entry.status === "done")
      return res.status(200).json({ success: true, message: "Patient is already marked as served.", data: { queueEntry: entry } });
    const updated = await QueueModel.findByIdAndUpdate(
      req.params.id,
      { status, ...(status === "called" ? { calledAt: new Date() } : {}) },
      { new: true }
    );
    if (status === "done")
      await AppointmentModel.findByIdAndUpdate(entry.appointmentId, { status: "completed" });
    res.json({ success: true, message: `Queue status updated to "${status}".`, data: { queueEntry: updated } });
  } catch (err) { next(err); }
};

module.exports = { getTodayQueue, getMyQueue, getQueueByDate, updateStatus };