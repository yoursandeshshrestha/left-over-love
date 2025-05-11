const express = require("express");
const router = express.Router();
const { getPlatformStats } = require("../controllers/statsController");

// Public endpoint for platform stats
router.get("/", getPlatformStats);

module.exports = router;
