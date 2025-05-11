const User = require("../models/User");
const FoodListing = require("../models/FoodListing");
const Pickup = require("../models/Pickup");
const logger = require("../utils/logger");
const notificationService = require("../services/notificationService");

// @desc    Get all users
// @route   GET /admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    // Build query with filters
    const roleFilter = req.query.role ? { role: req.query.role } : {};
    const verifiedFilter = req.query.verified
      ? { isVerified: req.query.verified === "true" }
      : {};

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const total = await User.countDocuments({
      ...roleFilter,
      ...verifiedFilter,
    });

    const users = await User.find({
      ...roleFilter,
      ...verifiedFilter,
    })
      .select("-password")
      .sort("-createdAt")
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination = {};

    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: users.length,
      pagination,
      data: users,
    });
  } catch (err) {
    logger.error("Admin get all users error:", err);
    next(err);
  }
};

// @desc    Verify a user (NGO or vendor)
// @route   PATCH /admin/verify/:userId
// @access  Private (Admin only)
exports.verifyUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Update verification status
    user.isVerified = req.body.isVerified;

    // Add verification notes if provided
    if (req.body.verificationNotes) {
      // Store as a note in user document, assuming you add a notes field
      user.verificationNotes = req.body.verificationNotes;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });

    // Notify user about verification status change
    await notificationService.notifyUserAboutVerification(
      user,
      req.body.isVerified
    );
  } catch (err) {
    logger.error(`Admin verify user error for ID ${req.params.userId}:`, err);
    next(err);
  }
};

// @desc    Remove a user
// @route   DELETE /admin/remove/:userId
// @access  Private (Admin only)
exports.removeUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Don't allow removal of another admin
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        error: "Cannot remove another admin",
      });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Remove all related food listings if user is a vendor
      if (user.role === "vendor") {
        await FoodListing.deleteMany({ vendor: user._id }, { session });
      }

      // Remove all related pickups
      if (user.role === "vendor") {
        await Pickup.deleteMany({ vendor: user._id }, { session });
      } else if (user.role === "ngo") {
        await Pickup.deleteMany({ ngo: user._id }, { session });
      }

      // Remove user
      await User.findByIdAndDelete(user._id, { session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        data: {},
        message: "User removed successfully",
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    logger.error(`Admin remove user error for ID ${req.params.userId}:`, err);
    next(err);
  }
};

// @desc    Get platform reports and statistics
// @route   GET /admin/reports
// @access  Private (Admin only)
exports.getPlatformReports = async (req, res, next) => {
  try {
    // Get counts
    const userCounts = {
      total: await User.countDocuments(),
      vendors: await User.countDocuments({ role: "vendor" }),
      ngos: await User.countDocuments({ role: "ngo" }),
      admins: await User.countDocuments({ role: "admin" }),
      verified: await User.countDocuments({ isVerified: true }),
      unverified: await User.countDocuments({ isVerified: false }),
    };

    const listingCounts = {
      total: await FoodListing.countDocuments(),
      available: await FoodListing.countDocuments({ status: "available" }),
      claimed: await FoodListing.countDocuments({ status: "claimed" }),
      pickedUp: await FoodListing.countDocuments({ status: "picked_up" }),
      expired: await FoodListing.countDocuments({ status: "expired" }),
      cancelled: await FoodListing.countDocuments({ status: "cancelled" }),
    };

    const pickupCounts = {
      total: await Pickup.countDocuments(),
      scheduled: await Pickup.countDocuments({ status: "scheduled" }),
      inProgress: await Pickup.countDocuments({ status: "in_progress" }),
      completed: await Pickup.countDocuments({ status: "picked_up" }),
      cancelled: await Pickup.countDocuments({ status: "cancelled" }),
      missed: await Pickup.countDocuments({ status: "missed" }),
    };

    // Calculate food saved
    const completedPickups = await Pickup.find({ status: "picked_up" });
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

    // Get top 5 most active vendors (by listings created)
    const topVendors = await FoodListing.aggregate([
      { $group: { _id: "$vendor", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Get top 5 most active NGOs (by pickups completed)
    const topNGOs = await Pickup.aggregate([
      { $match: { status: "picked_up" } },
      { $group: { _id: "$ngo", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Lookup vendor and NGO details
    const topVendorsWithDetails = await User.populate(topVendors, {
      path: "_id",
      select: "name email phone address.city vendorDetails.businessName",
    });

    const topNGOsWithDetails = await User.populate(topNGOs, {
      path: "_id",
      select: "name email phone address.city",
    });

    res.status(200).json({
      success: true,
      data: {
        userCounts,
        listingCounts,
        pickupCounts,
        totalQuantitySaved,
        topVendors: topVendorsWithDetails,
        topNGOs: topNGOsWithDetails,
      },
    });
  } catch (err) {
    logger.error("Admin get platform reports error:", err);
    next(err);
  }
};
