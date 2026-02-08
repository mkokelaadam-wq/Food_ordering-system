const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes (authentication required)
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);

// Admin routes (admin authentication required)
// router.get('/users', authMiddleware, adminMiddleware, authController.getAllUsers);
// router.delete('/users/:id', authMiddleware, adminMiddleware, authController.deleteUser);

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Auth service is healthy',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
