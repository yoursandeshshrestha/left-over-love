const User = require("../models/User");
const logger = require("../utils/logger");
const sendTokenResponse = require("../utils/sendTokenResponse");


// @desc    Register user
// @route   POST /auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      address,
      vendorDetails,
      ngoDetails,
    } = req.body;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      address,
      vendorDetails: role === "vendor" ? vendorDetails : undefined,
      ngoDetails: role === "ngo" ? ngoDetails : undefined,
    });

    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (err) {
    logger.error("Registration error:", err);
    next(err);
  }
};

// @desc    Login user
// @route   POST /auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide an email and password",
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (err) {
    logger.error("Login error:", err);
    next(err);
  }
};

// @desc    Logout user
// @route   POST /auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {},
      message: "Successfully logged out",
    });
  } catch (err) {
    logger.error("Logout error:", err);
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    logger.error("Get user profile error:", err);
    next(err);
  }
};

// @desc    Update user details
// @route   PATCH /auth/update
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
    };

    if (req.user.role === "vendor" && req.body.vendorDetails) {
      fieldsToUpdate.vendorDetails = req.body.vendorDetails;
    }

    if (req.user.role === "ngo" && req.body.ngoDetails) {
      fieldsToUpdate.ngoDetails = req.body.ngoDetails;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    logger.error("Update details error:", err);
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /auth/delete
// @access  Private
exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      data: {},
      message: "User deleted successfully",
    });
  } catch (err) {
    logger.error("Delete user error:", err);
    next(err);
  }
};
