const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const createCors = require("./middleware/cors");
const rateLimiter = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");
const apiRoutes = require("./routes");

const app = express();

// ─── Global Middleware ──────────────────────────
app.use(helmet());
app.use(createCors());
app.use(express.json());
app.use(morgan("dev"));
app.use(rateLimiter);

// ─── API Routes ─────────────────────────────────
app.use("/api", apiRoutes);

// ─── 404 ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Error Handler ──────────────────────────────
app.use(errorHandler);

module.exports = app;
