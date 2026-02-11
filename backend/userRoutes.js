const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// All user routes require authentication
router.use(authMiddleware);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', userController.getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', userController.updateProfile);

// @route   POST /api/users/profile/upload
// @desc    Upload profile picture
// @access  Private
router.post('/profile/upload', uploadMiddleware.single('avatar'), userController.uploadProfilePicture);

// @route   GET /api/users/orders
// @desc    Get user's orders
// @access  Private
router.get('/orders', userController.getUserOrders);

// @route   PUT /api/users/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', userController.changePassword);

module.exports = router;
