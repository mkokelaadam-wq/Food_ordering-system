const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// ============================================
// 🔥 PUBLIC ROUTES - HAZITOKEN
// ============================================

/**
 * @route   GET /api/menu
 * @desc    Get all menu items
 * @access  Public
 */
router.get('/', menuController.getAllMenu);

/**
 * @route   GET /api/menu/:id
 * @desc    Get single menu item by ID
 * @access  Public
 */
router.get('/:id', menuController.getMenuItemById);

/**
 * @route   GET /api/menu/category/:category
 * @desc    Get menu items by category
 * @access  Public
 */
router.get('/category/:category', menuController.getMenuByCategory);

/**
 * @route   GET /api/menu/restaurant/:restaurantId
 * @desc    Get menu items by restaurant
 * @access  Public
 */
router.get('/restaurant/:restaurantId', menuController.getMenuByRestaurant);

/**
 * @route   GET /api/menu/search
 * @desc    Search menu items
 * @access  Public
 */
router.get('/search', menuController.searchMenu);

// ============================================
// 🔥 PROTECTED ROUTES - ZINAHITAJI TOKEN
// ============================================

/**
 * @route   POST /api/menu/favorite/:id
 * @desc    Add menu item to favorites
 * @access  Private (requires token from authRoutes)
 */
router.post('/favorite/:id', 
    authMiddleware, 
    menuController.addToFavorites
);

/**
 * @route   DELETE /api/menu/favorite/:id
 * @desc    Remove menu item from favorites
 * @access  Private
 */
router.delete('/favorite/:id', 
    authMiddleware, 
    menuController.removeFromFavorites
);

/**
 * @route   GET /api/menu/favorites
 * @desc    Get user's favorite menu items
 * @access  Private
 */
router.get('/favorites', 
    authMiddleware, 
    menuController.getFavorites
);

// ============================================
// 🔥 ADMIN ROUTES - ZINAHITAJI ADMIN TOKEN
// ============================================

/**
 * @route   POST /api/menu
 * @desc    Create new menu item (admin only)
 * @access  Private/Admin
 */
router.post('/', 
    authMiddleware, 
    adminMiddleware, 
    menuController.createMenuItem
);

/**
 * @route   PUT /api/menu/:id
 * @desc    Update menu item (admin only)
 * @access  Private/Admin
 */
router.put('/:id', 
    authMiddleware, 
    adminMiddleware, 
    menuController.updateMenuItem
);

/**
 * @route   DELETE /api/menu/:id
 * @desc    Delete menu item (admin only)
 * @access  Private/Admin
 */
router.delete('/:id', 
    authMiddleware, 
    adminMiddleware, 
    menuController.deleteMenuItem
);

module.exports = router;
