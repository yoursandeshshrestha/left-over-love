const mongoose = require("mongoose");

const PickupSchema = new mongoose.Schema(
  {
    foodListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodListing",
      required: true,
    },
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
    estimatedPickupTime: {
      type: Date,
      required: [true, "Please specify an estimated pickup time"],
    },
    actualPickupTime: Date,
    transportMethod: {
      type: String,
      enum: [
        "Car",
        "Van",
        "Bike",
        "Scooter",
        "On Foot",
        "Public Transport",
        "Other",
      ],
      required: [true, "Please specify transport method"],
    },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "picked_up", "cancelled", "missed"],
      default: "scheduled",
    },
    specialRequirements: String,
    contactPerson: {
      type: String,
      required: [true, "Please specify a contact person for pickup"],
    },
    contactPhone: {
      type: String,
      required: [true, "Please specify a contact phone for pickup"],
      match: [/^[0-9]{10}$/, "Please add a valid 10-digit phone number"],
    },
    feedbackForVendor: String,
    feedbackForNGO: String,
    quantityCollected: {
      value: Number,
      unit: String,
    },
    completedAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    cancelledBy: {
      type: String,
      enum: ["ngo", "vendor", "admin", "system"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Define index for efficient querying
PickupSchema.index({ ngo: 1, status: 1 });
PickupSchema.index({ vendor: 1, status: 1 });
PickupSchema.index({ foodListing: 1 }, { unique: true });

// Populate references when fetching pickup
PickupSchema.pre(/^find/, function (next) {
  this.populate({
    path: "foodListing",
    select:
      "title description quantity foodType expiryTime pickupDetails images",
  })
    .populate({
      path: "ngo",
      select: "name email phone address ngoDetails",
    })
    .populate({
      path: "vendor",
      select: "name email phone address vendorDetails",
    });
  next();
});

module.exports = mongoose.model("Pickup", PickupSchema);
