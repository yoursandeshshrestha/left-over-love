const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  verifyUser,
  removeUser,
  getPlatformReports,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middlewares/auth");

// All routes require admin role
router.use(protect);
router.use(authorize("admin"));

// Admin routes
router.get("/users", getAllUsers);
router.patch("/verify/:userId", verifyUser);
router.delete("/remove/:userId", removeUser);
router.get("/reports", getPlatformReports);

module.exports = router;
