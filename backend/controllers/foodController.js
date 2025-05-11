const FoodListing = require("../models/FoodListing");
const logger = require("../utils/logger");
const notificationService = require("../services/notificationService");

// @desc    Create a new food listing
// @route   POST /food/create
// @access  Private (Vendors only)
exports.createFoodListing = async (req, res, next) => {
  try {
    // Add vendor id to req.body
    req.body.vendor = req.user.id;

    // Validate that the expiryTime is in the future
    const expiryTime = new Date(req.body.expiryTime);
    if (expiryTime <= new Date()) {
      return res.status(400).json({
        success: false,
        error: "Expiry time must be in the future",
      });
    }

    // Create food listing
    const foodListing = await FoodListing.create(req.body);

    res.status(201).json({
      success: true,
      data: foodListing,
    });

    // Notify nearby NGOs
    await notificationService.notifyNGOsAboutNewFoodListing(foodListing);
  } catch (err) {
    logger.error("Create food listing error:", err);

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "You already have a listing with this title today",
      });
    }

    next(err);
  }
};

// @desc    Get all available food listings
// @route   GET /food/all
// @access  Private
exports.getAllFoodListings = async (req, res, next) => {
  try {
    // Build query
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude from filtering
    const removeFields = ["select", "sort", "page", "limit"];
    removeFields.forEach((param) => delete reqQuery[param]);

    // Default to only available listings unless specified
    if (!reqQuery.status) {
      reqQuery.status = "available";
    }

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    // Finding resource
    query = FoodListing.find(JSON.parse(queryStr));

    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      // Default sort by creation date (newest first) and urgency
      query = query.sort("-isUrgent -createdAt");
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await FoodListing.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const foodListings = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
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
      count: foodListings.length,
      pagination,
      data: foodListings,
    });
  } catch (err) {
    logger.error("Get all food listings error:", err);
    next(err);
  }
};

// @desc    Get single food listing
// @route   GET /food/:id
// @access  Private
exports.getFoodListing = async (req, res, next) => {
  try {
    const foodListing = await FoodListing.findById(req.params.id);

    if (!foodListing) {
      return res.status(404).json({
        success: false,
        error: "Food listing not found",
      });
    }

    res.status(200).json({
      success: true,
      data: foodListing,
    });
  } catch (err) {
    logger.error(`Get food listing error for ID ${req.params.id}:`, err);
    next(err);
  }
};

// @desc    Get nearby food listings
// @route   GET /food/nearby
// @access  Private (NGOs only)
exports.getNearbyFoodListings = async (req, res, next) => {
  try {
    const { latitude, longitude, distance = 10 } = req.query; // distance in kilometers

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Please provide latitude and longitude",
      });
    }

    // Convert distance from km to meters (MongoDB uses meters)
    const radius = distance * 1000;

    // Find listings within the specified radius
    const foodListings = await FoodListing.find({
      status: "available",
      "pickupDetails.location": {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(longitude), parseFloat(latitude)],
            radius / 6378137,
          ],
        },
      },
      expiryTime: { $gt: new Date() }, // Only include non-expired listings
    }).sort("-isUrgent -createdAt");

    res.status(200).json({
      success: true,
      count: foodListings.length,
      data: foodListings,
    });
  } catch (err) {
    logger.error("Get nearby food listings error:", err);
    next(err);
  }
};

// @desc    Update food listing
// @route   PATCH /food/:id
// @access  Private (Vendor who created the listing or Admin)
exports.updateFoodListing = async (req, res, next) => {
  try {
    let foodListing = await FoodListing.findById(req.params.id);

    if (!foodListing) {
      return res.status(404).json({
        success: false,
        error: "Food listing not found",
      });
    }

    // Make sure user is the listing owner or an admin
    if (
      foodListing.vendor.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this listing",
      });
    }

    // Don't allow updates to claimed or picked up listings
    if (
      ["claimed", "picked_up"].includes(foodListing.status) &&
      req.user.role !== "admin"
    ) {
      return res.status(400).json({
        success: false,
        error: `Cannot update a listing that is already ${foodListing.status}`,
      });
    }

    // Update listing
    foodListing = await FoodListing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: foodListing,
    });
  } catch (err) {
    logger.error(`Update food listing error for ID ${req.params.id}:`, err);
    next(err);
  }
};

// @desc    Delete food listing
// @route   DELETE /food/:id
// @access  Private (Vendor who created the listing or Admin)
exports.deleteFoodListing = async (req, res, next) => {
  try {
    const foodListing = await FoodListing.findById(req.params.id);

    if (!foodListing) {
      return res.status(404).json({
        success: false,
        error: "Food listing not found",
      });
    }

    // Make sure user is the listing owner or an admin
    if (
      foodListing.vendor.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this listing",
      });
    }

    // Don't allow deletion of claimed or picked up listings
    if (
      ["claimed", "picked_up"].includes(foodListing.status) &&
      req.user.role !== "admin"
    ) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete a listing that is already ${foodListing.status}`,
      });
    }

    await foodListing.remove();

    res.status(200).json({
      success: true,
      data: {},
      message: "Food listing deleted successfully",
    });
  } catch (err) {
    logger.error(`Delete food listing error for ID ${req.params.id}:`, err);
    next(err);
  }
};
