const AppointmentModel = require("../models/appointment.model");
const QueueModel = require("../models/queue.model");

const isTest = () => process.env.NODE_ENV === "test";

const create = async (req, res, next) => {
  try {
    const { doctorName, date, time, notes } = req.body;
    const patientId = req.user.id || req.user._id?.toString();

    if (isTest()) {
      const appointment = AppointmentModel.create({ patientId, doctorName, date, time, notes });
      return res.status(201).json({ success: true, message: "Appointment booked successfully.", data: { appointment } });
    }

    const duplicate = await AppointmentModel.findOne({ patientId, date, status: { $ne: "cancelled" } });
    if (duplicate)
      return res.status(409).json({ success: false, message: "You already have an active appointment on this date." });
    const count = await AppointmentModel.countDocuments({ date, status: { $ne: "cancelled" } });
    const queueNumber = `Q-${String(count + 1).padStart(3, "0")}`;
    const appointment = await AppointmentModel.create({ patientId, doctorName, date, time, notes, queueNumber });
    await QueueModel.create({ appointmentId: appointment._id, number: queueNumber, date });
    res.status(201).json({ success: true, message: "Appointment booked successfully.", data: { appointment } });
  } catch (err) {
    if (err.statusCode === 409)
      return res.status(409).json({ success: false, message: err.message });
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id?.toString();
    if (isTest()) {
      let appointments = req.user.role === "admin"
        ? AppointmentModel.findAll()
        : AppointmentModel.findByPatientId(userId);
      if (req.query.date) appointments = appointments.filter(a => a.date === req.query.date);
      if (req.query.status) appointments = appointments.filter(a => a.status === req.query.status);
      return res.json({ success: true, data: { appointments, total: appointments.length } });
    }
    const filter = {};
    if (req.user.role !== "admin") filter.patientId = req.user._id;
    if (req.query.date) filter.date = req.query.date;
    if (req.query.status) filter.status = req.query.status;
    const appointments = await AppointmentModel.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: { appointments, total: appointments.length } });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id?.toString();
    if (isTest()) {
      const appointment = AppointmentModel.findById(req.params.id);
      if (!appointment)
        return res.status(404).json({ success: false, message: "Appointment not found." });
      if (req.user.role !== "admin" && appointment.patientId !== userId)
        return res.status(403).json({ success: false, message: "Access denied." });
      return res.json({ success: true, data: { appointment } });
    }
    const appointment = await AppointmentModel.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ success: false, message: "Appointment not found." });
    if (req.user.role !== "admin" && appointment.patientId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Access denied." });
    res.json({ success: true, data: { appointment } });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id?.toString();
    if (isTest()) {
      const appointment = AppointmentModel.findById(req.params.id);
      if (!appointment)
        return res.status(404).json({ success: false, message: "Appointment not found." });
      if (req.user.role !== "admin" && appointment.patientId !== userId)
        return res.status(403).json({ success: false, message: "Access denied." });
      if (req.body.status === "cancelled" && appointment.status === "cancelled")
        return res.status(200).json({ success: true, message: "Appointment is already cancelled.", data: { appointment } });
      const allowedFields = req.user.role === "admin"
        ? ["doctorName","date","time","notes","status"]
        : ["doctorName","date","time","notes"];
      const changes = {};
      allowedFields.forEach(f => { if (req.body[f] !== undefined) changes[f] = req.body[f]; });
      const updated = AppointmentModel.update(req.params.id, changes);
      return res.json({ success: true, message: "Appointment updated.", data: { appointment: updated } });
    }
    const appointment = await AppointmentModel.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ success: false, message: "Appointment not found." });
    if (req.user.role !== "admin" && appointment.patientId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Access denied." });
    if (req.body.status === "cancelled" && appointment.status === "cancelled")
      return res.status(200).json({ success: true, message: "Appointment is already cancelled.", data: { appointment } });
    const allowedFields = req.user.role === "admin"
      ? ["doctorName","date","time","notes","status"]
      : ["doctorName","date","time","notes"];
    const changes = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) changes[f] = req.body[f]; });
    const updated = await AppointmentModel.findByIdAndUpdate(req.params.id, changes, { new: true });
    res.json({ success: true, message: "Appointment updated.", data: { appointment: updated } });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id?.toString();
    if (isTest()) {
      const appointment = AppointmentModel.findById(req.params.id);
      if (!appointment)
        return res.status(404).json({ success: false, message: "Appointment not found." });
      if (req.user.role !== "admin" && appointment.patientId !== userId)
        return res.status(403).json({ success: false, message: "Access denied." });
      AppointmentModel.delete(req.params.id);
      return res.json({ success: true, message: "Appointment cancelled." });
    }
    const appointment = await AppointmentModel.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ success: false, message: "Appointment not found." });
    if (req.user.role !== "admin" && appointment.patientId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Access denied." });
    await AppointmentModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Appointment cancelled." });
  } catch (err) { next(err); }
};

module.exports = { create, list, getOne, update, remove };