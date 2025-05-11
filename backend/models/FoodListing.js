const mongoose = require("mongoose");

const FoodListingSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please add a title for the food listing"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    quantity: {
      value: {
        type: Number,
        required: [true, "Please specify the quantity value"],
        min: [0.1, "Quantity must be greater than 0"],
      },
      unit: {
        type: String,
        required: [true, "Please specify the quantity unit"],
        enum: ["kg", "liters", "servings", "plates", "boxes", "items"],
      },
    },
    foodType: {
      type: [String],
      required: [true, "Please specify at least one food type"],
    },
    expiryTime: {
      type: Date,
      required: [true, "Please add an expiry time"],
    },
    pickupDetails: {
      address: {
        street: String,
        city: {
          type: String,
          required: [true, "Please add a city"],
        },
        state: {
          type: String,
          required: [true, "Please add a state"],
        },
        zipCode: String,
        country: {
          type: String,
          default: "India",
        },
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          index: "2dsphere",
          required: [true, "Please add pickup location coordinates"],
        },
      },
      startTime: {
        type: Date,
        required: [true, "Please add a pickup start time"],
      },
      endTime: {
        type: Date,
        required: [true, "Please add a pickup end time"],
      },
      contactName: {
        type: String,
        required: [true, "Please add a contact name for pickup"],
      },
      contactPhone: {
        type: String,
        required: [true, "Please add a contact phone for pickup"],
        match: [/^[0-9]{10}$/, "Please add a valid 10-digit phone number"],
      },
    },
    images: [String],
    specialInstructions: String,
    status: {
      type: String,
      enum: ["available", "claimed", "picked_up", "expired", "cancelled"],
      default: "available",
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    claimedAt: Date,
    pickupDetails: {
      estimatedPickupTime: Date,
      actualPickupTime: Date,
      status: {
        type: String,
        enum: ["scheduled", "in_progress", "picked_up", "cancelled"],
      },
      ngoFeedback: String,
      vendorFeedback: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create index for expiry time and status for efficient querying
FoodListingSchema.index({ expiryTime: 1, status: 1 });

// Prevent vendors from submitting more than one listing with the same title on the same day
FoodListingSchema.index(
  { vendor: 1, title: 1, createdAt: 1 },
  { unique: true, partialFilterExpression: { status: "available" } }
);

// Virtual for time remaining before expiry
FoodListingSchema.virtual("timeRemaining").get(function () {
  return this.expiryTime - Date.now();
});

// Virtual for whether the listing is expired
FoodListingSchema.virtual("isExpired").get(function () {
  return Date.now() > this.expiryTime;
});

// Set listing to expired if past expiry time when retrieved
FoodListingSchema.pre(/^find/, function (next) {
  this.populate({
    path: "vendor",
    select:
      "name email phone address.city vendorDetails.businessName isVerified reputationScore",
  });
  next();
});

module.exports = mongoose.model("FoodListing", FoodListingSchema);
