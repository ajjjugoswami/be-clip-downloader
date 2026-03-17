const { createLogger, format, transports } = require("winston");
const config = require("../config");

const logger = createLogger({
  level: config.logLevel,
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    config.nodeEnv === "development"
      ? format.combine(format.colorize(), format.printf(({ timestamp, level, message, stack }) =>
          `${timestamp} ${level}: ${stack || message}`
        ))
      : format.json()
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
