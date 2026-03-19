const mongoose = require("mongoose");
const config = require("../config");
const logger = require("../utils/logger");

let connected = false;

async function connectDB() {
  if (connected) return;

  if (!config.mongoUri) {
    logger.warn("MONGODB_URI not set — skipping MongoDB connection");
    return;
  }

  await mongoose.connect(config.mongoUri);
  connected = true;
  logger.info("MongoDB connected");

  mongoose.connection.on("disconnected", () => {
    connected = false;
    logger.warn("MongoDB disconnected");
  });
  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB error:", err.message);
  });
}

module.exports = connectDB;
