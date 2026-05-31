require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  if (process.env.NODE_ENV === "test") return;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      family: 4,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    // Don't exit — let the app keep running with whatever connected
  }
};

module.exports = connectDB;