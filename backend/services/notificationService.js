const Notification = require("../models/Notification");
const User = require("../models/User");
const logger = require("../utils/logger");
// Could add SMS or email service integrations here

// Create notification
const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    logger.info(`Notification created: ${notification._id}`);
    return notification;
  } catch (err) {
    logger.error("Error creating notification:", err);
    throw err;
  }
};

// Notify users about new food listing
const notifyNGOsAboutNewFoodListing = async (foodListing) => {
  try {
    // Find NGOs within radius of the food listing
    const radius = 20; // 20 km
    const [longitude, latitude] =
      foodListing.pickupDetails.location.coordinates;

    const nearbyNGOs = await User.find({
      role: "ngo",
      isVerified: true,
      "address.location": {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radius / 6378.1], // Earth's radius in km
        },
      },
    });

    logger.info(
      `Found ${nearbyNGOs.length} NGOs near food listing ${foodListing._id}`
    );

    // Create notifications for each NGO
    const notifications = [];
    for (const ngo of nearbyNGOs) {
      const notification = await createNotification({
        recipient: ngo._id,
        type: "new_food_listing",
        title: "New Food Available Nearby",
        message: `${
          foodListing.title
        } is available for pickup. Expires at ${new Date(
          foodListing.expiryTime
        ).toLocaleString()}`,
        relatedTo: {
          model: "FoodListing",
          id: foodListing._id,
        },
        isUrgent: foodListing.isUrgent,
      });
      notifications.push(notification);

      // TODO: If implementing push notifications or SMS, would send them here
    }

    return notifications;
  } catch (err) {
    logger.error(
      `Error notifying NGOs about food listing ${foodListing._id}:`,
      err
    );
    throw err;
  }
};

// Notify vendor about food claim
const notifyVendorAboutClaim = async (pickup) => {
  try {
    const notification = await createNotification({
      recipient: pickup.vendor,
      type: "food_claimed",
      title: "Your Food Listing Has Been Claimed",
      message: `Your listing "${
        pickup.foodListing.title
      }" has been claimed by an NGO and scheduled for pickup at ${new Date(
        pickup.estimatedPickupTime
      ).toLocaleString()}`,
      relatedTo: {
        model: "Pickup",
        id: pickup._id,
      },
    });

    // TODO: If implementing push notifications or SMS, would send them here

    return notification;
  } catch (err) {
    logger.error(`Error notifying vendor about pickup ${pickup._id}:`, err);
    throw err;
  }
};

// Notify NGO about verification status change
const notifyUserAboutVerification = async (user, isVerified) => {
  try {
    const notification = await createNotification({
      recipient: user._id,
      type: isVerified ? "account_verified" : "account_rejected",
      title: isVerified ? "Account Verified" : "Account Verification Issue",
      message: isVerified
        ? "Your account has been verified! You can now use all platform features."
        : "There was an issue with your account verification. Please contact support for details.",
      relatedTo: {
        model: "User",
        id: user._id,
      },
    });

    // TODO: If implementing push notifications or SMS, would send them here

    return notification;
  } catch (err) {
    logger.error(`Error notifying user ${user._id} about verification:`, err);
    throw err;
  }
};

// Notify about pickup status change
const notifyAboutPickupStatusChange = async (pickup, previousStatus) => {
  try {
    // Notify vendor
    const vendorNotification = await createNotification({
      recipient: pickup.vendor,
      type: "pickup_updated",
      title: "Pickup Status Updated",
      message: `Pickup status for "${pickup.foodListing.title}" has changed from ${previousStatus} to ${pickup.status}`,
      relatedTo: {
        model: "Pickup",
        id: pickup._id,
      },
    });

    // If completed pickup, also notify NGO
    if (pickup.status === "picked_up") {
      await createNotification({
        recipient: pickup.ngo,
        type: "pickup_completed",
        title: "Pickup Completed",
        message:
          "Thank you for completing the pickup! Your contribution helps reduce food waste.",
        relatedTo: {
          model: "Pickup",
          id: pickup._id,
        },
      });
    }

    // TODO: If implementing push notifications or SMS, would send them here

    return vendorNotification;
  } catch (err) {
    logger.error(
      `Error notifying about pickup ${pickup._id} status change:`,
      err
    );
    throw err;
  }
};

module.exports = {
  createNotification,
  notifyNGOsAboutNewFoodListing,
  notifyVendorAboutClaim,
  notifyUserAboutVerification,
  notifyAboutPickupStatusChange,
};
