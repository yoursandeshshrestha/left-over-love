const FoodListing = require("../models/FoodListing");
const Pickup = require("../models/Pickup");
const User = require("../models/User");
const logger = require("../utils/logger");

// @desc    Get platform-wide stats
// @route   GET /stats
// @access  Public
exports.getPlatformStats = async (req, res, next) => {
  try {
    // Get basic counts
    const userCount = await User.countDocuments({ isVerified: true });
    const vendorCount = await User.countDocuments({
      role: "vendor",
      isVerified: true,
    });
    const ngoCount = await User.countDocuments({
      role: "ngo",
      isVerified: true,
    });

    const listingCount = await FoodListing.countDocuments();
    const activeListingCount = await FoodListing.countDocuments({
      status: "available",
    });

    const completedPickupCount = await Pickup.countDocuments({
      status: "picked_up",
    });

    // Calculate total food saved
    const completedPickups = await Pickup.find({
      status: "picked_up",
      quantityCollected: { $exists: true },
    });

    let totalQuantitySaved = {};
    completedPickups.forEach((pickup) => {
      if (pickup.quantityCollected && pickup.quantityCollected.value) {
        const { value, unit } = pickup.quantityCollected;
        if (!totalQuantitySaved[unit]) {
          totalQuantitySaved[unit] = 0;
        }
        totalQuantitySaved[unit] += value;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: userCount,
          vendors: vendorCount,
          ngos: ngoCount,
        },
        listings: {
          total: listingCount,
          active: activeListingCount,
        },
        pickups: {
          completed: completedPickupCount,
        },
        impact: {
          totalQuantitySaved,
          estimatedCO2Saved: calculateEstimatedCO2Saved(totalQuantitySaved),
          estimatedAnimalsFed: calculateEstimatedAnimalsFed(totalQuantitySaved),
        },
      },
    });
  } catch (err) {
    logger.error("Get platform stats error:", err);
    next(err);
  }
};

// Helper function to calculate estimated CO2 saved
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
const calculateEstimatedAnimalsFed = (quantities) => {
  let totalServings = 0;

  // Convert to approximate servings
  if (quantities.kg) totalServings += quantities.kg * 5; // Approximate 5 servings per kg
  if (quantities.liters) totalServings += quantities.liters * 4; // Approximate 4 servings per liter
  if (quantities.servings) totalServings += quantities.servings;
  if (quantities.plates) totalServings += quantities.plates * 1.5; // Approximate 1.5 servings per plate
  if (quantities.boxes) totalServings += quantities.boxes * 10; // Approximate 10 servings per box
  if (quantities.items) totalServings += quantities.items * 0.5; // Approximate 0.5 servings per item

  // Assuming each animal consumes 2 servings per day
  return Math.floor(totalServings / 2);
};

module.exports = {
  getPlatformStats: exports.getPlatformStats,
};
