const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config/config");
const connectDB = require("./config/database");
const logger = require("./utils/logger");

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet());

// Logging middleware - use our custom logger with Morgan
if (config.NODE_ENV === "development") {
  app.use(morgan("dev", { stream: logger.stream }));
} else {
  app.use(morgan("combined", { stream: logger.stream }));
}

// Routes (will add these later)
app.get("/", (req, res) => {
  res.send("API is running...");
  logger.info("Root endpoint accessed");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is healthy" });
  logger.debug("Health check performed");
});

// Create the logs directory if it doesn't exist
const fs = require("fs");
const path = require("path");
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs");
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: "Server Error",
    message:
      config.NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});

// Handle 404 - Route not found
app.use((req, res) => {
  logger.warn(`Route not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: "The requested resource does not exist",
  });
});

// Start server
const PORT = config.PORT;
const server = app.listen(PORT, () => {
  logger.info(
    `Server running in ${config.NODE_ENV} mode on port http://localhost:${PORT}`
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = server;
