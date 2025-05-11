const FoodListing = require("../models/FoodListing");
const Pickup = require("../models/Pickup");
const User = require("../models/User");
const logger = require("../utils/logger");
const notificationService = require("../services/notificationService");
const mongoose = require("mongoose");

// @desc    View available food listings for NGO
// @route   GET /ngo/available
// @access  Private (NGOs only)
exports.getAvailableFoodListings = async (req, res, next) => {
  try {
    // Find all available food listings
    const foodListings = await FoodListing.find({
      status: "available",
      expiryTime: { $gt: new Date() }, // Only include non-expired listings
    }).sort("-isUrgent -createdAt");

    res.status(200).json({
      success: true,
      count: foodListings.length,
      data: foodListings,
    });
  } catch (err) {
    logger.error("Get available food listings for NGO error:", err);
    next(err);
  }
};

// @desc    Claim food listing for pickup
// @route   POST /ngo/claim/:foodId
// @access  Private (NGOs only)
exports.claimFoodListing = async (req, res, next) => {
  try {
    const foodListing = await FoodListing.findById(req.params.foodId);

    if (!foodListing) {
      return res.status(404).json({
        success: false,
        error: "Food listing not found",
      });
    }

    // Check if listing is available
    if (foodListing.status !== "available") {
      return res.status(400).json({
        success: false,
        error: `This food listing is already ${foodListing.status}`,
      });
    }

    // Check if listing is expired
    if (new Date(foodListing.expiryTime) < new Date()) {
      return res.status(400).json({
        success: false,
        error: "This food listing has expired",
      });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update food listing status
      foodListing.status = "claimed";
      foodListing.claimedBy = req.user.id;
      foodListing.claimedAt = new Date();
      await foodListing.save({ session });

      // Create pickup record
      const pickup = await Pickup.create(
        [
          {
            foodListing: foodListing._id,
            ngo: req.user.id,
            vendor: foodListing.vendor,
            estimatedPickupTime: req.body.estimatedPickupTime,
            transportMethod: req.body.transportMethod,
            specialRequirements: req.body.specialRequirements,
            contactPerson: req.body.contactPerson,
            contactPhone: req.body.contactPhone,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        success: true,
        data: pickup[0],
      });

      await notificationService.notifyVendorAboutClaim(pickup[0]);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    logger.error(`Claim food listing error for ID ${req.params.foodId}:`, err);
    next(err);
  }
};

// @desc    View NGO's claimed food pickups
// @route   GET /ngo/claimed
// @access  Private (NGOs only)
exports.getClaimedPickups = async (req, res, next) => {
  try {
    // Get pickups with optional status filter
    const statusFilter = req.query.status ? { status: req.query.status } : {};

    const pickups = await Pickup.find({
      ngo: req.user.id,
      ...statusFilter,
    }).sort("-createdAt");

    res.status(200).json({
      success: true,
      count: pickups.length,
      data: pickups,
    });
  } catch (err) {
    logger.error("Get claimed pickups error:", err);
    next(err);
  }
};

// @desc    Update pickup status (e.g., confirm pickup)
// @route   PATCH /ngo/pickup/:pickupId
// @access  Private (NGOs only)
exports.updatePickupStatus = async (req, res, next) => {
  try {
    let pickup = await Pickup.findById(req.params.pickupId);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        error: "Pickup not found",
      });
    }

    // Ensure NGO owns this pickup
    if (pickup.ngo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this pickup",
      });
    }

    // Store previous status for notification
    const previousStatus = pickup.status;

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update pickup
      pickup = await Pickup.findByIdAndUpdate(req.params.pickupId, req.body, {
        new: true,
        runValidators: true,
        session,
      });

      // If status changed to picked_up, also update the food listing
      if (req.body.status === "picked_up") {
        await FoodListing.findByIdAndUpdate(
          pickup.foodListing._id,
          {
            status: "picked_up",
            pickupDetails: {
              actualPickupTime: new Date(),
              status: "picked_up",
              ngoFeedback: req.body.feedbackForVendor,
            },
          },
          { session }
        );

        // Update reputation scores based on successful pickup
        // This would be part of a more complex reputation system
        // We'll implement a simple version here
        await User.findByIdAndUpdate(
          pickup.vendor,
          { $inc: { reputationScore: 5 } },
          { session }
        );

        await User.findByIdAndUpdate(
          pickup.ngo,
          { $inc: { reputationScore: 5 } },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        data: pickup,
      });

      // Notify about status change
      if (pickup.status !== previousStatus) {
        await notificationService.notifyAboutPickupStatusChange(
          pickup,
          previousStatus
        );
      }
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    logger.error(
      `Update pickup status error for ID ${req.params.pickupId}:`,
      err
    );
    next(err);
  }
};

// @desc    Get pickup history and stats
// @route   GET /ngo/history
// @access  Private (NGOs only)
exports.getPickupHistory = async (req, res, next) => {
  try {
    // Get all completed pickups
    const completedPickups = await Pickup.find({
      ngo: req.user.id,
      status: "picked_up",
    }).sort("-completedAt");

    // Calculate total quantity saved
    let totalQuantitySaved = {};
    completedPickups.forEach((pickup) => {
      if (pickup.quantityCollected) {
        const { value, unit } = pickup.quantityCollected;
        if (!totalQuantitySaved[unit]) {
          totalQuantitySaved[unit] = 0;
        }
        totalQuantitySaved[unit] += value;
      }
    });

    // Calculate other stats
    const stats = {
      totalPickups: completedPickups.length,
      totalQuantitySaved,
      vendorsHelped: new Set(completedPickups.map((p) => p.vendor.toString()))
        .size,
      cancelledPickups: await Pickup.countDocuments({
        ngo: req.user.id,
        status: "cancelled",
      }),
    };

    res.status(200).json({
      success: true,
      data: {
        stats,
        recentPickups: completedPickups.slice(0, 10), // Return only the 10 most recent
      },
    });
  } catch (err) {
    logger.error("Get pickup history error:", err);
    next(err);
  }
};
