const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config/config");
const logger = require("../utils/logger");

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Get token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Check if token exists
  if (!token) {
    logger.warn("No token provided for protected route");
    return res.status(401).json({
      success: false,
      error: "Not authorized to access this route",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Add user to req object
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      logger.warn("User not found for token");
      return res.status(401).json({
        success: false,
        error: "Not authorized to access this route",
      });
    }

    next();
  } catch (err) {
    logger.error("Auth middleware error:", err);
    return res.status(401).json({
      success: false,
      error: "Not authorized to access this route",
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(
        `User role ${req.user.role} not authorized to access this route`
      );
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check if user is verified
exports.isVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    logger.warn(
      `User ${req.user.id} not verified trying to access restricted route`
    );
    return res.status(403).json({
      success: false,
      error:
        "Your account needs to be verified before you can perform this action",
    });
  }
  next();
};
