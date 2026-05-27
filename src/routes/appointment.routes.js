const express = require("express");
const router = express.Router();
const { create, list, getOne, update, remove } = require("../controllers/appointment.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validateAppointment, validateAppointmentUpdate } = require("../middleware/validate.middleware");

router.use(authenticate);
router.post("/", validateAppointment, create);
router.get("/", list);
router.get("/:id", getOne);
router.patch("/:id", validateAppointmentUpdate, update);
router.delete("/:id", remove);

module.exports = router;
