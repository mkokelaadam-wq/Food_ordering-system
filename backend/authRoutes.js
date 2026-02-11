const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { validateRegistration, validateLogin, validatePasswordReset } = require('../middleware/validationMiddleware');
const rateLimit = require('express-rate-limit');

// ============================================
// RATE LIMITING - KINGA YA SPAM
// ============================================

// Login rate limiter - max 5 attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        error: 'Too many login attempts. Please try again after 15 minutes.'
    }
});

// Register rate limiter - max 3 accounts per hour
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        success: false,
        error: 'Too many registration attempts. Please try again later.'
    }
});

// Password reset limiter - max 3 requests per hour
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        success: false,
        error: 'Too many password reset attempts. Please try again later.'
    }
});

// ============================================
// 🔥 PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', 
    registerLimiter,
    validateRegistration,
    authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', 
    loginLimiter,
    validateLogin,
    authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public (but requires token to clear)
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password',
    passwordResetLimiter,
    authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password/:token',
    validatePasswordReset,
    authController.resetPassword
);

/**
 * @route   POST /api/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email/:token', authController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification link
 * @access  Public
 */
router.post('/resend-verification', 
    passwordResetLimiter,
    authController.resendVerification
);

// ============================================
// 🔥 PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', 
    authMiddleware, 
    authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', 
    authMiddleware, 
    authController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', 
    authMiddleware, 
    validatePasswordReset,
    authController.changePassword
);

/**
 * @route   POST /api/auth/verify-password
 * @desc    Verify current password before sensitive actions
 * @access  Private
 */
router.post('/verify-password',
    authMiddleware,
    authController.verifyPassword
);

/**
 * @route   DELETE /api/auth/delete-account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/delete-account',
    authMiddleware,
    authController.deleteAccount
);

// ============================================
// 🔥 ADMIN ROUTES (Admin authentication required)
// ============================================

/**
 * @route   GET /api/auth/admin/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/admin/users', 
    authMiddleware, 
    adminMiddleware, 
    authController.getAllUsers
);

/**
 * @route   GET /api/auth/admin/users/:id
 * @desc    Get single user by ID (admin only)
 * @access  Private/Admin
 */
router.get('/admin/users/:id', 
    authMiddleware, 
    adminMiddleware, 
    authController.getUserById
);

/**
 * @route   PUT /api/auth/admin/users/:id
 * @desc    Update user (admin only)
 * @access  Private/Admin
 */
router.put('/admin/users/:id', 
    authMiddleware, 
    adminMiddleware, 
    authController.updateUserByAdmin
);

/**
 * @route   DELETE /api/auth/admin/users/:id
 * @desc    Delete user (admin only)
 * @access  Private/Admin
 */
router.delete('/admin/users/:id', 
    authMiddleware, 
    adminMiddleware, 
    authController.deleteUserByAdmin
);

/**
 * @route   GET /api/auth/admin/stats
 * @desc    Get user statistics (admin only)
 * @access  Private/Admin
 */
router.get('/admin/stats', 
    authMiddleware, 
    adminMiddleware, 
    authController.getUserStats
);

/**
 * @route   POST /api/auth/admin/create-admin
 * @desc    Create new admin user (super admin only)
 * @access  Private/Admin (super admin)
 */
router.post('/admin/create-admin',
    authMiddleware,
    adminMiddleware,
    authController.createAdmin
);

// ============================================
// 🔥 GOOGLE OAUTH (Optional - add if needed)
// ============================================

/**
 * @route   GET /api/auth/google
 * @desc    Google OAuth login
 * @access  Public
 */
router.get('/google', authController.googleAuth);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', authController.googleAuthCallback);

// ============================================
// 🔥 SESSION & STATUS
// ============================================

/**
 * @route   GET /api/auth/session
 * @desc    Check if user session is valid
 * @access  Private
 */
router.get('/session', 
    authMiddleware, 
    authController.checkSession
);

/**
 * @route   GET /api/auth/status
 * @desc    Check if user is authenticated
 * @access  Public
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: 'Auth service is running',
        timestamp: new Date().toISOString(),
        endpoints: {
            register: '/api/auth/register',
            login: '/api/auth/login',
            logout: '/api/auth/logout',
            profile: '/api/auth/profile',
            forgotPassword: '/api/auth/forgot-password',
            resetPassword: '/api/auth/reset-password/:token',
            verifyEmail: '/api/auth/verify-email/:token',
            admin: '/api/auth/admin/users'
        }
    });
});

/**
 * @route   GET /api/auth/health
 * @desc    Health check for auth service
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Auth service is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;
