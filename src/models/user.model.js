const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const db = { users: [] };

const UserModel = {
  async create({ name, email, password, role = "patient" }) {
    const existing = db.users.find(u => u.email === email.toLowerCase().trim());
    if (existing) throw new Error("Email already registered");
    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      _id: uuidv4(),
      name,
      email: email.toLowerCase().trim(),
      password: hashed,
      role,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    const { password: _, ...safe } = user;
    return safe;
  },
  findByEmail(email) {
    return db.users.find(u => u.email === email.toLowerCase().trim());
  },
  findById(id) {
    return db.users.find(u => u.id === id || u._id === id);
  },
  findAll() {
    return db.users.map(({ password: _, ...u }) => u);
  },
  async verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },
  _reset() { db.users = []; },
};

if (process.env.NODE_ENV !== "test") {
  const mongoose = require("mongoose");

  const userSchema = new mongoose.Schema({
    name:     { type: String, required: true, trim: true, minlength: 2 },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role:     { type: String, enum: ["patient", "admin"], default: "patient" },
  }, { timestamps: true });

  userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });

  userSchema.methods.verifyPassword = async function (plain) {
    return bcrypt.compare(plain, this.password);
  };

  module.exports = mongoose.model("User", userSchema);
} else {
  module.exports = UserModel;
}