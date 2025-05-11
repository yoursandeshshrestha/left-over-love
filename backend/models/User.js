const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  },
  role: {
    type: String,
    enum: ["vendor", "ngo", "admin"],
    default: "vendor",
  },
  phone: {
    type: String,
    required: [true, "Please add a phone number"],
    match: [/^[0-9]{10}$/, "Please add a valid 10-digit phone number"],
  },
  address: {
    street: String,
    city: {
      type: String,
      required: [true, "Please add city"],
    },
    state: {
      type: String,
      required: [true, "Please add state"],
    },
    zipCode: String,
    country: {
      type: String,
      default: "India",
    },
    location: {
      // GeoJSON Point
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  reputationScore: {
    type: Number,
    default: 0,
  },
  profileImage: {
    type: String,
    default: "default-profile.jpg",
  },
  // Specific fields for vendors
  vendorDetails: {
    businessName: String,
    businessType: {
      type: String,
      enum: ["restaurant", "catering", "hotel", "event", "other"],
    },
    registrationNumber: String,
    contactPerson: String,
    foodTypes: [String], // Types of food they usually provide
  },
  // Specific fields for NGOs
  ngoDetails: {
    registrationNumber: String,
    foundedYear: Number,
    contactPerson: String,
    animalTypes: [String], // Types of animals they cater to
    capacity: Number, // How much food they can collect at once
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
