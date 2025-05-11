const express = require("express");
const router = express.Router();
const {
  getVendorImpactReport,
  getNGOPickupStats,
  getLeaderboard,
} = require("../controllers/reputationController");
const { protect } = require("../middlewares/auth");

// Public route for leaderboard
router.get("/leaderboard", getLeaderboard);

// Protected routes for reports
router.get("/vendor/:id", protect, getVendorImpactReport);
router.get("/ngo/:id", protect, getNGOPickupStats);

module.exports = router;
