const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// User routes (authentication required)
router.post('/', authMiddleware, orderController.createOrder);
router.get('/my-orders', authMiddleware, orderController.getUserOrders);
router.get('/:id', authMiddleware, orderController.getOrderDetails);
router.get('/:id/status', authMiddleware, orderController.getOrderStatus);
router.put('/:id/cancel', authMiddleware, orderController.cancelOrder);

// Admin routes (admin authentication required)
router.get('/admin/all', authMiddleware, adminMiddleware, orderController.getAllOrders);
router.put('/admin/:id/status', authMiddleware, adminMiddleware, orderController.updateOrderStatus);
router.get('/admin/stats', authMiddleware, adminMiddleware, orderController.getOrderStats);
// router.delete('/admin/:id', authMiddleware, adminMiddleware, orderController.deleteOrder);

// Health check
router.get('/health/status', (req, res) => {
    res.json({
        success: true,
        message: 'Order service is healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
            createOrder: 'POST /api/orders',
            myOrders: 'GET /api/orders/my-orders',
            orderDetails: 'GET /api/orders/:id',
            cancelOrder: 'PUT /api/orders/:id/cancel'
        }
    });
});

module.exports = router;
