const express = require("express");
const router = express.Router();
const {
  createFoodListing,
  getAllFoodListings,
  getFoodListing,
  getNearbyFoodListings,
  updateFoodListing,
  deleteFoodListing,
} = require("../controllers/foodController");
const { protect, authorize, isVerified } = require("../middlewares/auth");

// Create food listing - only verified vendors can create
router.post(
  "/create",
  protect,
  authorize("vendor"),
  isVerified,
  createFoodListing
);

// Get all food listings - accessible to all authenticated users
router.get("/all", protect, getAllFoodListings);

// Get nearby food listings - accessible mainly for NGOs but allowed for all
router.get("/nearby", protect, getNearbyFoodListings);

// Get, update and delete specific food listing
router.get("/:id", protect, getFoodListing);
router.patch("/:id", protect, updateFoodListing);
router.delete("/:id", protect, deleteFoodListing);

module.exports = router;
