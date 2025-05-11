const User = require("../models/User");
const FoodListing = require("../models/FoodListing");
const Pickup = require("../models/Pickup");
const logger = require("../utils/logger");

// @desc    Get a vendor's impact report
// @route   GET /reputation/vendor/:id
// @access  Private (Admin or vendor itself)
exports.getVendorImpactReport = async (req, res, next) => {
  try {
    // Check authorization
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to access this vendor report",
      });
    }

    const vendor = await User.findById(req.params.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(404).json({
        success: false,
        error: "Vendor not found",
      });
    }

    // Get all food listings by this vendor
    const allListings = await FoodListing.find({ vendor: req.params.id });

    // Get completed pickups
    const completedPickups = await Pickup.find({
      vendor: req.params.id,
      status: "picked_up",
    }).populate("ngo", "name ngoDetails.animalTypes");

    // Calculate total food saved
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

    // Get stats by month (for charts)
    const monthlyStats = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      // Last 6 months
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthlyPickups = completedPickups.filter(
        (pickup) =>
          new Date(pickup.completedAt) >= month &&
          new Date(pickup.completedAt) <= nextMonth
      );

      let monthlyQuantity = {};
      monthlyPickups.forEach((pickup) => {
        if (pickup.quantityCollected) {
          const { value, unit } = pickup.quantityCollected;
          if (!monthlyQuantity[unit]) {
            monthlyQuantity[unit] = 0;
          }
          monthlyQuantity[unit] += value;
        }
      });

      monthlyStats.push({
        month: month.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        pickups: monthlyPickups.length,
        quantity: monthlyQuantity,
      });
    }

    // Calculate impact metrics
    const impactMetrics = {
      totalListingsCreated: allListings.length,
      totalListingsClaimed: allListings.filter((l) =>
        ["claimed", "picked_up"].includes(l.status)
      ).length,
      totalPickupsCompleted: completedPickups.length,
      uniqueNGOsHelped: new Set(
        completedPickups.map((p) => p.ngo._id.toString())
      ).size,
      totalQuantitySaved,
      estimatedCO2Saved: calculateEstimatedCO2Saved(totalQuantitySaved),
      animalsFed: estimateAnimalsFed(completedPickups),
    };

    res.status(200).json({
      success: true,
      data: {
        vendorDetails: {
          name: vendor.name,
          businessName: vendor.vendorDetails?.businessName,
          reputationScore: vendor.reputationScore,
          verificationStatus: vendor.isVerified,
          address: vendor.address,
        },
        impactMetrics,
        monthlyStats,
        recentPickups: completedPickups.slice(0, 5), // Most recent 5 pickups
      },
    });
  } catch (err) {
    logger.error(
      `Get vendor impact report error for ID ${req.params.id}:`,
      err
    );
    next(err);
  }
};

// @desc    Get an NGO's pickup stats
// @route   GET /reputation/ngo/:id
// @access  Private (Admin or NGO itself)
exports.getNGOPickupStats = async (req, res, next) => {
  try {
    // Check authorization
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to access this NGO report",
      });
    }

    const ngo = await User.findById(req.params.id);

    if (!ngo || ngo.role !== "ngo") {
      return res.status(404).json({
        success: false,
        error: "NGO not found",
      });
    }

    // Get all pickups by this NGO
    const allPickups = await Pickup.find({ ngo: req.params.id }).populate(
      "vendor",
      "name vendorDetails.businessName"
    );

    // Get completed pickups
    const completedPickups = allPickups.filter((p) => p.status === "picked_up");

    // Calculate total food collected
    let totalQuantityCollected = {};
    completedPickups.forEach((pickup) => {
      if (pickup.quantityCollected) {
        const { value, unit } = pickup.quantityCollected;
        if (!totalQuantityCollected[unit]) {
          totalQuantityCollected[unit] = 0;
        }
        totalQuantityCollected[unit] += value;
      }
    });

    // Get stats by month (for charts)
    const monthlyStats = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      // Last 6 months
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthlyPickups = completedPickups.filter(
        (pickup) =>
          new Date(pickup.completedAt) >= month &&
          new Date(pickup.completedAt) <= nextMonth
      );

      let monthlyQuantity = {};
      monthlyPickups.forEach((pickup) => {
        if (pickup.quantityCollected) {
          const { value, unit } = pickup.quantityCollected;
          if (!monthlyQuantity[unit]) {
            monthlyQuantity[unit] = 0;
          }
          monthlyQuantity[unit] += value;
        }
      });

      monthlyStats.push({
        month: month.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        pickups: monthlyPickups.length,
        quantity: monthlyQuantity,
      });
    }

    // Calculate performance metrics
    const performanceMetrics = {
      totalPickupsClaimed: allPickups.length,
      totalPickupsCompleted: completedPickups.length,
      completionRate:
        allPickups.length > 0
          ? (completedPickups.length / allPickups.length) * 100
          : 0,
      uniqueVendorsHelped: new Set(
        completedPickups.map((p) => p.vendor._id.toString())
      ).size,
      totalQuantityCollected,
      estimatedCO2Saved: calculateEstimatedCO2Saved(totalQuantityCollected),
      animalsFed: estimateAnimalsFed(completedPickups),
    };

    res.status(200).json({
      success: true,
      data: {
        ngoDetails: {
          name: ngo.name,
          reputationScore: ngo.reputationScore,
          verificationStatus: ngo.isVerified,
          animalTypes: ngo.ngoDetails?.animalTypes,
          capacity: ngo.ngoDetails?.capacity,
          address: ngo.address,
        },
        performanceMetrics,
        monthlyStats,
        recentPickups: completedPickups.slice(0, 5), // Most recent 5 pickups
      },
    });
  } catch (err) {
    logger.error(`Get NGO pickup stats error for ID ${req.params.id}:`, err);
    next(err);
  }
};

// @desc    Get leaderboard of top NGOs and vendors
// @route   GET /reputation/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
  try {
    // Get top vendors by food saved
    const topVendors = await Pickup.aggregate([
      { $match: { status: "picked_up" } },
      {
        $group: {
          _id: "$vendor",
          pickups: { $sum: 1 },
          // We can't easily sum quantities with different units in MongoDB aggregate
          // so we'll handle that in the application layer
        },
      },
      { $sort: { pickups: -1 } },
      { $limit: 10 },
    ]);

    // Get top NGOs by pickups completed
    const topNGOs = await Pickup.aggregate([
      { $match: { status: "picked_up" } },
      {
        $group: {
          _id: "$ngo",
          pickups: { $sum: 1 },
        },
      },
      { $sort: { pickups: -1 } },
      { $limit: 10 },
    ]);

    // Lookup user details
    const populatedVendors = await User.populate(topVendors, {
      path: "_id",
      select: "name vendorDetails.businessName address.city reputationScore",
    });

    const populatedNGOs = await User.populate(topNGOs, {
      path: "_id",
      select: "name ngoDetails.animalTypes address.city reputationScore",
    });

    // Calculate total quantities for each vendor
    for (const vendor of populatedVendors) {
      const pickups = await Pickup.find({
        vendor: vendor._id._id,
        status: "picked_up",
        quantityCollected: { $exists: true },
      });

      let totalQuantity = {};
      pickups.forEach((pickup) => {
        if (pickup.quantityCollected && pickup.quantityCollected.value) {
          const { value, unit } = pickup.quantityCollected;
          if (!totalQuantity[unit]) {
            totalQuantity[unit] = 0;
          }
          totalQuantity[unit] += value;
        }
      });

      vendor.totalQuantity = totalQuantity;
    }

    // Calculate total quantities for each NGO
    for (const ngo of populatedNGOs) {
      const pickups = await Pickup.find({
        ngo: ngo._id._id,
        status: "picked_up",
        quantityCollected: { $exists: true },
      });

      let totalQuantity = {};
      pickups.forEach((pickup) => {
        if (pickup.quantityCollected && pickup.quantityCollected.value) {
          const { value, unit } = pickup.quantityCollected;
          if (!totalQuantity[unit]) {
            totalQuantity[unit] = 0;
          }
          totalQuantity[unit] += value;
        }
      });

      ngo.totalQuantity = totalQuantity;
    }

    res.status(200).json({
      success: true,
      data: {
        topVendors: populatedVendors.map((v) => ({
          id: v._id._id,
          name: v._id.name,
          businessName: v._id.vendorDetails?.businessName,
          city: v._id.address?.city,
          reputationScore: v._id.reputationScore,
          pickups: v.pickups,
          totalQuantity: v.totalQuantity,
        })),
        topNGOs: populatedNGOs.map((n) => ({
          id: n._id._id,
          name: n._id.name,
          animalTypes: n._id.ngoDetails?.animalTypes,
          city: n._id.address?.city,
          reputationScore: n._id.reputationScore,
          pickups: n.pickups,
          totalQuantity: n.totalQuantity,
        })),
      },
    });
  } catch (err) {
    logger.error("Get leaderboard error:", err);
    next(err);
  }
};

// Helper function to calculate estimated CO2 saved
// This is a simplified estimation. In a real application, you'd want to use more accurate calculations
const calculateEstimatedCO2Saved = (quantities) => {
  // Average CO2 emissions per kg of food waste is around 2.5 kg
  let totalKg = 0;

  // Convert all units to kg (approximate)
  if (quantities.kg) totalKg += quantities.kg;
  if (quantities.liters) totalKg += quantities.liters * 0.8; // Assuming average density
  if (quantities.servings) totalKg += quantities.servings * 0.3; // Approximate weight per serving
  if (quantities.plates) totalKg += quantities.plates * 0.4; // Approximate weight per plate
  if (quantities.boxes) totalKg += quantities.boxes * 2; // Approximate weight per box
  if (quantities.items) totalKg += quantities.items * 0.2; // Approximate weight per item

  return totalKg * 2.5; // kg of CO2 saved
};

// Helper function to estimate animals fed
const estimateAnimalsFed = (pickups) => {
  let totalServings = 0;

  pickups.forEach((pickup) => {
    if (pickup.quantityCollected) {
      const { value, unit } = pickup.quantityCollected;

      // Convert to approximate servings
      switch (unit) {
        case "kg":
          totalServings += value * 5; // Approximate 5 servings per kg
          break;
        case "liters":
          totalServings += value * 4; // Approximate 4 servings per liter
          break;
        case "servings":
          totalServings += value;
          break;
        case "plates":
          totalServings += value * 1.5; // Approximate 1.5 servings per plate
          break;
        case "boxes":
          totalServings += value * 10; // Approximate 10 servings per box
          break;
        case "items":
          totalServings += value * 0.5; // Approximate 0.5 servings per item
          break;
      }
    }
  });

  // Assuming each animal consumes 2 servings per day
  return Math.floor(totalServings / 2);
};

module.exports = {
  getVendorImpactReport: exports.getVendorImpactReport,
  getNGOPickupStats: exports.getNGOPickupStats,
  getLeaderboard: exports.getLeaderboard,
};
