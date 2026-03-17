const logger = require("../utils/logger");

/**
 * Central error handler — catches unhandled errors from controllers.
 */
function errorHandler(err, _req, res, _next) {
  logger.error(err);

  const status = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "Internal server error"
      : err.message || "Internal server error";

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
