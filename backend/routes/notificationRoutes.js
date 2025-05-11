const express = require("express");
const router = express.Router();
const {
  sendNotification,
  getNGONotifications,
  markNotificationsAsRead,
} = require("../controllers/notificationController");
const { protect, authorize } = require("../middlewares/auth");

// Admin-only route for sending notifications
router.post("/send", protect, authorize("admin"), sendNotification);

// Get notifications
router.get("/:id", protect, getNGONotifications);

// Mark notifications as read
router.patch("/read", protect, markNotificationsAsRead);

module.exports = router;
