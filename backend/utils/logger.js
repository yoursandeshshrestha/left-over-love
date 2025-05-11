const winston = require("winston");
const { format, createLogger, transports } = winston;
const { combine, printf, colorize, json } = format;
require("winston-daily-rotate-file");
const config = require("../config/config");

// Define log directory
const logDir = "logs";

// Define custom format for console logs without timestamp
const consoleFormat = printf(({ level, message, ...meta }) => {
  return `[${level}]: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
  }`;
});

// File transport for rotation
const fileRotateTransport = new transports.DailyRotateFile({
  filename: `${logDir}/application-%DATE%.log`,
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d",
  maxSize: "20m",
  level: config.NODE_ENV === "production" ? "info" : "debug",
});

// Error log specific transport
const errorFileRotateTransport = new transports.DailyRotateFile({
  filename: `${logDir}/error-%DATE%.log`,
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d",
  maxSize: "20m",
  level: "error",
});

// Create the logger
const logger = createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  format: combine(json()),
  transports: [
    // Regular console logging without timestamp
    new transports.Console({
      format: combine(colorize(), consoleFormat),
    }),
    // Rotating file transport
    fileRotateTransport,
    // Error specific logs
    errorFileRotateTransport,
  ],
  exitOnError: false,
});

// Create a stream object for Morgan integration
logger.stream = {
  write: function (message) {
    logger.info(message.trim());
  },
};

module.exports = logger;
