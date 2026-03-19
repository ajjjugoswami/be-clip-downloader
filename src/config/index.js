require("dotenv").config();
const path = require("path");
const os = require("os");

const config = {
  port: parseInt(process.env.PORT, 10) || 8080,
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",

  cors: {
    origins: [
      "https://clip-download-master.vercel.app",
    ],
    methods: ["GET", "POST"],
  },

  rateLimit: {
    windowMs: 60 * 1000,
    max: 30,
  },

  jwtSecret: process.env.JWT_SECRET || "clipstream-dev-secret-change-in-production",
  mongoUri: process.env.MONGODB_URI || "",

  paths: {
    temp: path.join(os.tmpdir(), "clipstream"),
    ytdlpBinary: path.join(__dirname, "..", "..", "bin", "yt-dlp" + (process.platform === "win32" ? ".exe" : "")),
    ffmpegBinary: require("@ffmpeg-installer/ffmpeg").path,
  },

  split: {
    minDuration: 5,
    maxDuration: 600,
    defaultDuration: 60,
    allowedFrameSizes: ["9:16", "1:1", "16:9", "original"],
  },
};

module.exports = config;
