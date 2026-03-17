require("dotenv").config();
const path = require("path");
const os = require("os");

const config = {
  port: parseInt(process.env.PORT, 10) || 8080,
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",

  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },

  rateLimit: {
    windowMs: 60 * 1000,
    max: 30,
  },

  paths: {
    temp: path.join(os.tmpdir(), "clipstream"),
  },

  ytdlp: {
    infoTimeout: 30_000,
    downloadTimeout: 300_000,
  },

  ffmpeg: {
    splitTimeout: 120_000,
  },

  split: {
    minDuration: 5,
    maxDuration: 600,
    defaultDuration: 60,
    allowedFrameSizes: ["9:16", "1:1", "16:9", "original"],
  },
};

module.exports = config;
