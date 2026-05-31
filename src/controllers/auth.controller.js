const jwt = require("jsonwebtoken");

const generateToken = (user) =>
  jwt.sign(
    { id: user.id || user._id, role: user.role },
    process.env.JWT_SECRET || "queuecare_super_secret_key_2024",
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
  );

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const validRole = ["patient", "admin"].includes(role) ? role : "patient";
    const User = require("../models/user.model");

    if (process.env.NODE_ENV === "test") {
      const user = await User.create({ name, email, password, role: validRole });
      const token = generateToken(user);
      return res.status(201).json({
        success: true,
        message: "Account created successfully.",
        data: { user, token },
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ success: false, message: "Email already registered" });
    const user = await User.create({ name, email, password, role: validRole });
    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token },
    });
  } catch (err) {
    if (err.message === "Email already registered")
      return res.status(409).json({ success: false, message: err.message });
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const User = require("../models/user.model");

    if (process.env.NODE_ENV === "test") {
      const user = User.findByEmail(email);
      if (!user)
        return res.status(401).json({ success: false, message: "Invalid email or password." });
      const isValid = await User.verifyPassword(password, user.password);
      if (!isValid)
        return res.status(401).json({ success: false, message: "Invalid email or password." });
      const token = generateToken(user);
      const { password: _, ...safe } = user;
      return res.json({ success: true, message: "Logged in successfully.", data: { user: safe, token } });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    const isValid = await user.verifyPassword(password);
    if (!isValid)
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    const token = generateToken(user);
    res.json({
      success: true,
      message: "Logged in successfully.",
      data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token },
    });
  } catch (err) { next(err); }
};

const me = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

module.exports = { register, login, me };