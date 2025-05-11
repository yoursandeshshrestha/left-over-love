const express = require("express");
const router = express.Router();
const {
  getAvailableFoodListings,
  claimFoodListing,
  getClaimedPickups,
  updatePickupStatus,
  getPickupHistory,
} = require("../controllers/ngoController");
const { protect, authorize, isVerified } = require("../middlewares/auth");

// All routes require NGO role and verification
router.use(protect);
router.use(authorize("ngo"));
router.use(isVerified);

// NGO routes
router.get("/available", getAvailableFoodListings);
router.post("/claim/:foodId", claimFoodListing);
router.get("/claimed", getClaimedPickups);
router.patch("/pickup/:pickupId", updatePickupStatus);
router.get("/history", getPickupHistory);

module.exports = router;
