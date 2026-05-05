
const express = require('express');
const { getUserProfile, getUserProfileById, updateUserProfile, changePassword, uploadProfilePicture } = require('../controllers/userController');
const {verifyToken, ensureAdmin} = require('../middlewares/auth'); // Token verification middleware
const router = express.Router();

// Route to fetch user profile (GET)
router.get("/profile", verifyToken, getUserProfile);

// Route to fetch specific user profile (GET)
router.get("/profile/:id", verifyToken, getUserProfileById);

// Route to update user profile with image upload (PUT)
router.put("/profile", verifyToken, uploadProfilePicture, updateUserProfile);

// Route to change password
router.put("/change-password", verifyToken, changePassword);

module.exports = router;
