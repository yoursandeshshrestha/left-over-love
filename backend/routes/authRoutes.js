const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  deleteUser,
} = require("../controllers/authController");
const { protect } = require("../middlewares/auth");

// User registration and login
router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);

// User profile management
router.get("/me", protect, getMe);
router.patch("/update", protect, updateDetails);
router.delete("/delete", protect, deleteUser);

module.exports = router;
