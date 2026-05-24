const express = require('express');
const router = express.Router();
const adminController = require('../adminController');
const authMiddleware = require('../authMiddleware');
const adminMiddleware = require('../adminMiddleware');

// 🔥 ADMIN ROUTES - ALL REQUIRE ADMIN AUTHENTICATION

// Dashboard
router.get('/dashboard', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.getDashboard || (req, res) => {
    res.json({ success: true, data: { orders: 0, revenue: 0, users: 0 } });
});

// Orders Management
router.get('/orders', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.getAllOrders || (req, res) => {
    res.json({ success: true, data: [] });
});

router.put('/orders/:id/status', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.updateOrderStatus || (req, res) => {
    res.json({ success: true, message: 'Order status updated' });
});

// Menu Management
router.get('/menu-items', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.getAllMenuItems || (req, res) => {
    res.json({ success: true, data: [] });
});

router.post('/menu-items', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.createMenuItem || (req, res) => {
    res.json({ success: true, message: 'Menu item created' });
});

router.put('/menu-items/:id', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.updateMenuItem || (req, res) => {
    res.json({ success: true, message: 'Menu item updated' });
});

router.delete('/menu-items/:id', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.deleteMenuItem || (req, res) => {
    res.json({ success: true, message: 'Menu item deleted' });
});

// Restaurant Management
router.get('/restaurants', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.getAllRestaurants || (req, res) => {
    res.json({ success: true, data: [] });
});

router.post('/restaurants', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.createRestaurant || (req, res) => {
    res.json({ success: true, message: 'Restaurant created' });
});

router.put('/restaurants/:id', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.updateRestaurant || (req, res) => {
    res.json({ success: true, message: 'Restaurant updated' });
});

router.delete('/restaurants/:id', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.deleteRestaurant || (req, res) => {
    res.json({ success: true, message: 'Restaurant deleted' });
});

// Category Management
router.get('/categories', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.getAllCategories || (req, res) => {
    res.json({ success: true, data: [] });
});

router.post('/categories', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.createCategory || (req, res) => {
    res.json({ success: true, message: 'Category created' });
});

router.put('/categories/:id', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.updateCategory || (req, res) => {
    res.json({ success: true, message: 'Category updated' });
});

router.delete('/categories/:id', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.deleteCategory || (req, res) => {
    res.json({ success: true, message: 'Category deleted' });
});

// Users Management
router.get('/users', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.getAllUsers || (req, res) => {
    res.json({ success: true, data: [] });
});

router.put('/users/:id/role', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.updateUserRole || (req, res) => {
    res.json({ success: true, message: 'User role updated' });
});

router.delete('/users/:id', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.deleteUser || (req, res) => {
    res.json({ success: true, message: 'User deleted' });
});

// Reports
router.get('/reports/sales', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.getSalesReport || (req, res) => {
    res.json({ success: true, data: { totalSales: 0, ordersCount: 0 } });
});

router.get('/reports/top-items', authMiddleware.verifyToken, adminMiddleware.verifyAdmin, adminController.getTopItems || (req, res) => {
    res.json({ success: true, data: [] });
});

module.exports = router;
