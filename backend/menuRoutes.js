const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.get('/', menuController.getAllMenu);
router.get('/categories', menuController.getCategories);
router.get('/category/:category', menuController.getByCategory);
router.get('/search', menuController.searchMenu);
router.get('/featured', menuController.getFeatured);
router.get('/:id', menuController.getMenuItem);

// Protected routes (authentication required)
// router.post('/', authMiddleware, menuController.createMenuItem);
// router.put('/:id', authMiddleware, menuController.updateMenuItem);
// router.delete('/:id', authMiddleware, menuController.deleteMenuItem);

// Admin routes (admin authentication required)
router.post('/', authMiddleware, adminMiddleware, menuController.createMenuItem);
router.put('/:id', authMiddleware, adminMiddleware, menuController.updateMenuItem);
router.delete('/:id', authMiddleware, adminMiddleware, menuController.deleteMenuItem);

// Health check
router.get('/health/check', (req, res) => {
    res.json({
        success: true,
        message: 'Menu service is healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
            getAll: 'GET /api/menu',
            getById: 'GET /api/menu/:id',
            byCategory: 'GET /api/menu/category/:category',
            search: 'GET /api/menu/search?query=',
            featured: 'GET /api/menu/featured'
        }
    });
});

module.exports = router;
