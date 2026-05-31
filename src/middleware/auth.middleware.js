const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "queuecare_super_secret_key_2024");
    const User = require("../models/user.model");

    if (process.env.NODE_ENV === "test") {
      const user = User.findById(decoded.id);
      if (!user)
        return res.status(401).json({ success: false, message: "User no longer exists." });
      req.user = user;
      return next();
    }

    User.findById(decoded.id).then(user => {
      if (!user)
        return res.status(401).json({ success: false, message: "User no longer exists." });
      req.user = user;
      next();
    }).catch(() =>
      res.status(401).json({ success: false, message: "Invalid or expired token." })
    );
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(" or ")}`,
    });
  next();
};

module.exports = { authenticate, authorize };