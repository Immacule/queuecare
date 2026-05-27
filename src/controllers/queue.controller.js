/**
 * queue.controller.js — Queue Management
 * Handles "mark as served" with graceful duplicate handling.
 */

const QueueModel = require("../models/queue.model");
const AppointmentModel = require("../models/appointment.model");

const getTodayQueue = (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const queue = QueueModel.findByDate(today);
    res.json({
      success: true,
      data: {
        date: today, queue, total: queue.length,
        waiting: queue.filter((q) => q.status === "waiting").length,
        called: queue.filter((q) => q.status === "called").length,
        done: queue.filter((q) => q.status === "done").length,
      },
    });
  } catch (err) { next(err); }
};

const getMyQueue = (req, res, next) => {
  try {
    const appointments = AppointmentModel.findByPatientId(req.user.id);
    const myEntries = appointments
      .map((appt) => {
        const entry = QueueModel.findByAppointmentId(appt.id);
        if (!entry) return null;
        const position = QueueModel.getPosition(entry.id, entry.date);
        return { ...entry, appointment: { doctorName: appt.doctorName, date: appt.date, time: appt.time }, position };
      })
      .filter(Boolean);
    res.json({ success: true, data: { queueEntries: myEntries } });
  } catch (err) { next(err); }
};

const getQueueByDate = (req, res, next) => {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      return res.status(400).json({ success: false, message: "Date must be YYYY-MM-DD." });
    const queue = QueueModel.findByDate(date);
    res.json({
      success: true,
      data: {
        date, queue, total: queue.length,
        waiting: queue.filter((q) => q.status === "waiting").length,
        called: queue.filter((q) => q.status === "called").length,
        done: queue.filter((q) => q.status === "done").length,
      },
    });
  } catch (err) { next(err); }
};

const updateStatus = (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["waiting", "called", "done", "skipped"];

    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(", ")}` });

    const entry = QueueModel.findById(req.params.id);
    if (!entry)
      return res.status(404).json({ success: false, message: "Queue entry not found." });

    // Gracefully handle marking already-served patient as served again
    if (status === "done" && entry.status === "done")
      return res.status(200).json({
        success: true,
        message: "Patient is already marked as served.",
        data: { queueEntry: entry },
      });

    const updated = QueueModel.updateStatus(req.params.id, status);

    if (status === "done")
      AppointmentModel.update(entry.appointmentId, { status: "completed" });

    res.json({ success: true, message: `Queue status updated to "${status}".`, data: { queueEntry: updated } });
  } catch (err) { next(err); }
};

module.exports = { getTodayQueue, getMyQueue, getQueueByDate, updateStatus };
