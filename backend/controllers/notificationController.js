const Notification = require("../models/Notification");
const logger = require("../utils/logger");

// @desc    Send notification (internal API for other services)
// @route   POST /notify/send
// @access  Private (Admin only or internal use)
exports.sendNotification = async (req, res, next) => {
  try {
    const { recipient, type, title, message, relatedTo, isUrgent } = req.body;

    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedTo,
      isUrgent: isUrgent || false,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (err) {
    logger.error("Send notification error:", err);
    next(err);
  }
};

// @desc    Get notifications for an NGO
// @route   GET /notify/ngo/:id
// @access  Private (Admin or NGO itself)
exports.getNGONotifications = async (req, res, next) => {
  try {
    // Check authorization
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to access these notifications",
      });
    }

    // Build query
    const readFilter = req.query.read
      ? { isRead: req.query.read === "true" }
      : {};

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const total = await Notification.countDocuments({
      recipient: req.params.id,
      ...readFilter,
    });

    const notifications = await Notification.find({
      recipient: req.params.id,
      ...readFilter,
    })
      .sort("-createdAt")
      .skip(startIndex)
      .limit(limit);

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      recipient: req.params.id,
      isRead: false,
    });

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
      count: notifications.length,
      unreadCount,
      pagination,
      data: notifications,
    });
  } catch (err) {
    logger.error(`Get NGO notifications error for ID ${req.params.id}:`, err);
    next(err);
  }
};

// @desc    Mark notifications as read
// @route   PATCH /notify/read
// @access  Private
exports.markNotificationsAsRead = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        error: "Please provide an array of notification IDs",
      });
    }

    // Verify user owns these notifications
    const notificationsToUpdate = await Notification.find({
      _id: { $in: notificationIds },
      recipient: req.user.id,
    });

    if (notificationsToUpdate.length !== notificationIds.length) {
      return res.status(403).json({
        success: false,
        error: "You can only mark your own notifications as read",
      });
    }

    // Update notifications
    await Notification.updateMany(
      { _id: { $in: notificationIds } },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      data: {},
      message: `${notificationsToUpdate.length} notifications marked as read`,
    });
  } catch (err) {
    logger.error("Mark notifications as read error:", err);
    next(err);
  }
};
