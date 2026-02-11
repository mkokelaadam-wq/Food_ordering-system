/**
 * Admin Routes
 * Handles all admin operations for system management
 */

const express = require('express');
const router = express.Router();

// Import controllers
const AdminController = require('../controllers/adminController');
const UserController = require('../controllers/userController');
const RestaurantController = require('../controllers/restaurantController');
const MenuController = require('../controllers/menuController');
const OrderController = require('../controllers/orderController');

// Import middleware
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Apply admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// ============================================
// DASHBOARD & ANALYTICS
// ============================================

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/dashboard', AdminController.getDashboardStats);

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics data
// @access  Private/Admin
router.get('/analytics', AdminController.getAnalytics);

// @route   GET /api/admin/reports
// @desc    Generate reports
// @access  Private/Admin
router.get('/reports', AdminController.generateReports);

// ============================================
// USER MANAGEMENT
// ============================================

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private/Admin
router.get('/users', AdminController.getAllUsers);

// @route   GET /api/admin/users/:id
// @desc    Get user details by ID
// @access  Private/Admin
router.get('/users/:id', AdminController.getUserById);

// @route   POST /api/admin/users
// @desc    Create new user (admin)
// @access  Private/Admin
router.post('/users', AdminController.createUser);

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/users/:id', AdminController.updateUser);

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (active/inactive/suspended)
// @access  Private/Admin
router.put('/users/:id/status', AdminController.updateUserStatus);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private/Admin
router.put('/users/:id/role', AdminController.updateUserRole);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (soft delete)
// @access  Private/Admin
router.delete('/users/:id', AdminController.deleteUser);

// @route   GET /api/admin/users/:id/activity
// @desc    Get user activity logs
// @access  Private/Admin
router.get('/users/:id/activity', AdminController.getUserActivity);

// @route   GET /api/admin/users/:id/orders
// @desc    Get user orders
// @access  Private/Admin
router.get('/users/:id/orders', AdminController.getUserOrders);

// ============================================
// RESTAURANT MANAGEMENT
// ============================================

// @route   GET /api/admin/restaurants/pending
// @desc    Get pending restaurant applications
// @access  Private/Admin
router.get('/restaurants/pending', AdminController.getPendingRestaurants);

// @route   PUT /api/admin/restaurants/:id/approve
// @desc    Approve restaurant application
// @access  Private/Admin
router.put('/restaurants/:id/approve', AdminController.approveRestaurant);

// @route   PUT /api/admin/restaurants/:id/reject
// @desc    Reject restaurant application
// @access  Private/Admin
router.put('/restaurants/:id/reject', AdminController.rejectRestaurant);

// @route   GET /api/admin/restaurants/:id/details
// @desc    Get restaurant complete details
// @access  Private/Admin
router.get('/restaurants/:id/details', AdminController.getRestaurantDetails);

// @route   PUT /api/admin/restaurants/:id/verify
// @desc    Verify restaurant (mark as verified)
// @access  Private/Admin
router.put('/restaurants/:id/verify', AdminController.verifyRestaurant);

// @route   PUT /api/admin/restaurants/:id/feature
// @desc    Feature/unfeature restaurant
// @access  Private/Admin
router.put('/restaurants/:id/feature', AdminController.featureRestaurant);

// @route   GET /api/admin/restaurants/:id/performance
// @desc    Get restaurant performance metrics
// @access  Private/Admin
router.get('/restaurants/:id/performance', AdminController.getRestaurantPerformance);

// ============================================
// MENU MANAGEMENT
// ============================================

// @route   GET /api/admin/menu/items
// @desc    Get all menu items with filters
// @access  Private/Admin
router.get('/menu/items', AdminController.getAllMenuItems);

// @route   GET /api/admin/menu/items/:id
// @desc    Get menu item details
// @access  Private/Admin
router.get('/menu/items/:id', AdminController.getMenuItemDetails);

// @route   POST /api/admin/menu/items
// @desc    Create new menu item
// @access  Private/Admin
router.post('/menu/items', AdminController.createMenuItem);

// @route   PUT /api/admin/menu/items/:id
// @desc    Update menu item
// @access  Private/Admin
router.put('/menu/items/:id', AdminController.updateMenuItem);

// @route   DELETE /api/admin/menu/items/:id
// @desc    Delete menu item
// @access  Private/Admin
router.delete('/menu/items/:id', AdminController.deleteMenuItem);

// @route   POST /api/admin/menu/items/:id/image
// @desc    Upload menu item image
// @access  Private/Admin
router.post('/menu/items/:id/image', uploadMiddleware.menuImage, AdminController.uploadMenuItemImage);

// @route   GET /api/admin/menu/categories
// @desc    Get all categories
// @access  Private/Admin
router.get('/menu/categories', AdminController.getAllCategories);

// @route   POST /api/admin/menu/categories
// @desc    Create new category
// @access  Private/Admin
router.post('/menu/categories', AdminController.createCategory);

// @route   PUT /api/admin/menu/categories/:id
// @desc    Update category
// @access  Private/Admin
router.put('/menu/categories/:id', AdminController.updateCategory);

// @route   DELETE /api/admin/menu/categories/:id
// @desc    Delete category
// @access  Private/Admin
router.delete('/menu/categories/:id', AdminController.deleteCategory);

// ============================================
// ORDER MANAGEMENT
// ============================================

// @route   GET /api/admin/orders
// @desc    Get all orders with filters
// @access  Private/Admin
router.get('/orders', AdminController.getAllOrders);

// @route   GET /api/admin/orders/:id
// @desc    Get order details
// @access  Private/Admin
router.get('/orders/:id', AdminController.getOrderDetails);

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/orders/:id/status', AdminController.updateOrderStatus);

// @route   PUT /api/admin/orders/:id/assign
// @desc    Assign order to delivery driver
// @access  Private/Admin
router.put('/orders/:id/assign', AdminController.assignOrderToDriver);

// @route   GET /api/admin/orders/:id/timeline
// @desc    Get order timeline
// @access  Private/Admin
router.get('/orders/:id/timeline', AdminController.getOrderTimeline);

// @route   GET /api/admin/orders/statistics
// @desc    Get order statistics
// @access  Private/Admin
router.get('/orders/statistics', AdminController.getOrderStatistics);

// @route   GET /api/admin/orders/revenue
// @desc    Get revenue statistics
// @access  Private/Admin
router.get('/orders/revenue', AdminController.getRevenueStatistics);

// @route   PUT /api/admin/orders/:id/refund
// @desc    Process order refund
// @access  Private/Admin
router.put('/orders/:id/refund', AdminController.processRefund);

// ============================================
// PAYMENT MANAGEMENT
// ============================================

// @route   GET /api/admin/payments
// @desc    Get all payments
// @access  Private/Admin
router.get('/payments', AdminController.getAllPayments);

// @route   GET /api/admin/payments/:id
// @desc    Get payment details
// @access  Private/Admin
router.get('/payments/:id', AdminController.getPaymentDetails);

// @route   PUT /api/admin/payments/:id/verify
// @desc    Verify payment
// @access  Private/Admin
router.put('/payments/:id/verify', AdminController.verifyPayment);

// @route   PUT /api/admin/payments/:id/refund
// @desc    Process payment refund
// @access  Private/Admin
router.put('/payments/:id/refund', AdminController.refundPayment);

// @route   GET /api/admin/payments/transactions
// @desc    Get payment transactions report
// @access  Private/Admin
router.get('/payments/transactions', AdminController.getPaymentTransactions);

// ============================================
// REVIEWS & RATINGS MANAGEMENT
// ============================================

// @route   GET /api/admin/reviews/pending
// @desc    Get pending reviews
// @access  Private/Admin
router.get('/reviews/pending', AdminController.getPendingReviews);

// @route   GET /api/admin/reviews
// @desc    Get all reviews with filters
// @access  Private/Admin
router.get('/reviews', AdminController.getAllReviews);

// @route   PUT /api/admin/reviews/:id/approve
// @desc    Approve review
// @access  Private/Admin
router.put('/reviews/:id/approve', AdminController.approveReview);

// @route   PUT /api/admin/reviews/:id/reject
// @desc    Reject review
// @access  Private/Admin
router.put('/reviews/:id/reject', AdminController.rejectReview);

// @route   DELETE /api/admin/reviews/:id
// @desc    Delete review
// @access  Private/Admin
router.delete('/reviews/:id', AdminController.deleteReview);

// @route   GET /api/admin/reviews/statistics
// @desc    Get reviews statistics
// @access  Private/Admin
router.get('/reviews/statistics', AdminController.getReviewStatistics);

// ============================================
// PROMOTIONS & COUPONS MANAGEMENT
// ============================================

// @route   GET /api/admin/promotions
// @desc    Get all promotions
// @access  Private/Admin
router.get('/promotions', AdminController.getAllPromotions);

// @route   POST /api/admin/promotions
// @desc    Create new promotion
// @access  Private/Admin
router.post('/promotions', AdminController.createPromotion);

// @route   PUT /api/admin/promotions/:id
// @desc    Update promotion
// @access  Private/Admin
router.put('/promotions/:id', AdminController.updatePromotion);

// @route   DELETE /api/admin/promotions/:id
// @desc    Delete promotion
// @access  Private/Admin
router.delete('/promotions/:id', AdminController.deletePromotion);

// @route   PUT /api/admin/promotions/:id/activate
// @desc    Activate/deactivate promotion
// @access  Private/Admin
router.put('/promotions/:id/activate', AdminController.togglePromotionStatus);

// @route   GET /api/admin/promotions/:id/usage
// @desc    Get promotion usage statistics
// @access  Private/Admin
router.get('/promotions/:id/usage', AdminController.getPromotionUsage);

// ============================================
// DELIVERY MANAGEMENT
// ============================================

// @route   GET /api/admin/drivers
// @desc    Get all delivery drivers
// @access  Private/Admin
router.get('/drivers', AdminController.getAllDrivers);

// @route   POST /api/admin/drivers
// @desc    Create new driver account
// @access  Private/Admin
router.post('/drivers', AdminController.createDriver);

// @route   PUT /api/admin/drivers/:id
// @desc    Update driver details
// @access  Private/Admin
router.put('/drivers/:id', AdminController.updateDriver);

// @route   PUT /api/admin/drivers/:id/status
// @desc    Update driver status
// @access  Private/Admin
router.put('/drivers/:id/status', AdminController.updateDriverStatus);

// @route   GET /api/admin/drivers/:id/assignments
// @desc    Get driver assignments
// @access  Private/Admin
router.get('/drivers/:id/assignments', AdminController.getDriverAssignments);

// @route   GET /api/admin/drivers/:id/performance
// @desc    Get driver performance metrics
// @access  Private/Admin
router.get('/drivers/:id/performance', AdminController.getDriverPerformance);

// @route   GET /api/admin/deliveries/active
// @desc    Get active deliveries
// @access  Private/Admin
router.get('/deliveries/active', AdminController.getActiveDeliveries);

// @route   GET /api/admin/deliveries/completed
// @desc    Get completed deliveries
// @access  Private/Admin
router.get('/deliveries/completed', AdminController.getCompletedDeliveries);

// ============================================
// SYSTEM SETTINGS & CONFIGURATION
// ============================================

// @route   GET /api/admin/settings
// @desc    Get system settings
// @access  Private/Admin
router.get('/settings', AdminController.getSystemSettings);

// @route   PUT /api/admin/settings
// @desc    Update system settings
// @access  Private/Admin
router.put('/settings', AdminController.updateSystemSettings);

// @route   GET /api/admin/settings/delivery
// @desc    Get delivery settings
// @access  Private/Admin
router.get('/settings/delivery', AdminController.getDeliverySettings);

// @route   PUT /api/admin/settings/delivery
// @desc    Update delivery settings
// @access  Private/Admin
router.put('/settings/delivery', AdminController.updateDeliverySettings);

// @route   GET /api/admin/settings/payment
// @desc    Get payment settings
// @access  Private/Admin
router.get('/settings/payment', AdminController.getPaymentSettings);

// @route   PUT /api/admin/settings/payment
// @desc    Update payment settings
// @access  Private/Admin
router.put('/settings/payment', AdminController.updatePaymentSettings);

// @route   GET /api/admin/settings/tax
// @desc    Get tax settings
// @access  Private/Admin
router.get('/settings/tax', AdminController.getTaxSettings);

// @route   PUT /api/admin/settings/tax
// @desc    Update tax settings
// @access  Private/Admin
router.put('/settings/tax', AdminController.updateTaxSettings);

// ============================================
// LOGS & AUDIT TRAIL
// ============================================

// @route   GET /api/admin/logs/activity
// @desc    Get activity logs
// @access  Private/Admin
router.get('/logs/activity', AdminController.getActivityLogs);

// @route   GET /api/admin/logs/error
// @desc    Get error logs
// @access  Private/Admin
router.get('/logs/error', AdminController.getErrorLogs);

// @route   GET /api/admin/logs/access
// @desc    Get access logs
// @access  Private/Admin
router.get('/logs/access', AdminController.getAccessLogs);

// @route   GET /api/admin/logs/audit
// @desc    Get audit trail
// @access  Private/Admin
router.get('/logs/audit', AdminController.getAuditTrail);

// ============================================
// BACKUP & MAINTENANCE
// ============================================

// @route   POST /api/admin/backup
// @desc    Create database backup
// @access  Private/Admin
router.post('/backup', AdminController.createBackup);

// @route   GET /api/admin/backups
// @desc    Get list of backups
// @access  Private/Admin
router.get('/backups', AdminController.getBackups);

// @route   POST /api/admin/backups/:id/restore
// @desc    Restore from backup
// @access  Private/Admin
router.post('/backups/:id/restore', AdminController.restoreBackup);

// @route   DELETE /api/admin/backups/:id
// @desc    Delete backup
// @access  Private/Admin
router.delete('/backups/:id', AdminController.deleteBackup);

// @route   POST /api/admin/maintenance/start
// @desc    Start maintenance mode
// @access  Private/Admin
router.post('/maintenance/start', AdminController.startMaintenance);

// @route   POST /api/admin/maintenance/stop
// @desc    Stop maintenance mode
// @access  Private/Admin
router.post('/maintenance/stop', AdminController.stopMaintenance);

// @route   GET /api/admin/system/health
// @desc    Get system health status
// @access  Private/Admin
router.get('/system/health', AdminController.getSystemHealth);

// ============================================
// NOTIFICATIONS MANAGEMENT
// ============================================

// @route   GET /api/admin/notifications
// @desc    Get all system notifications
// @access  Private/Admin
router.get('/notifications', AdminController.getAllNotifications);

// @route   POST /api/admin/notifications
// @desc    Send system notification
// @access  Private/Admin
router.post('/notifications', AdminController.sendNotification);

// @route   DELETE /api/admin/notifications/:id
// @desc    Delete notification
// @access  Private/Admin
router.delete('/notifications/:id', AdminController.deleteNotification);

// @route   POST /api/admin/notifications/broadcast
// @desc    Broadcast notification to all users
// @access  Private/Admin
router.post('/notifications/broadcast', AdminController.broadcastNotification);

// ============================================
// SUPPORT & TICKETS
// ============================================

// @route   GET /api/admin/support/tickets
// @desc    Get all support tickets
// @access  Private/Admin
router.get('/support/tickets', AdminController.getSupportTickets);

// @route   GET /api/admin/support/tickets/:id
// @desc    Get ticket details
// @access  Private/Admin
router.get('/support/tickets/:id', AdminController.getTicketDetails);

// @route   PUT /api/admin/support/tickets/:id/status
// @desc    Update ticket status
// @access  Private/Admin
router.put('/support/tickets/:id/status', AdminController.updateTicketStatus);

// @route   POST /api/admin/support/tickets/:id/reply
// @desc    Reply to ticket
// @access  Private/Admin
router.post('/support/tickets/:id/reply', AdminController.replyToTicket);

// @route   GET /api/admin/support/statistics
// @desc    Get support statistics
// @access  Private/Admin
router.get('/support/statistics', AdminController.getSupportStatistics);

// ============================================
// EXPORT & IMPORT
// ============================================

// @route   GET /api/admin/export/users
// @desc    Export users data
// @access  Private/Admin
router.get('/export/users', AdminController.exportUsers);

// @route   GET /api/admin/export/orders
// @desc    Export orders data
// @access  Private/Admin
router.get('/export/orders', AdminController.exportOrders);

// @route   GET /api/admin/export/restaurants
// @desc    Export restaurants data
// @access  Private/Admin
router.get('/export/restaurants', AdminController.exportRestaurants);

// @route   POST /api/admin/import/users
// @desc    Import users data
// @access  Private/Admin
router.post('/import/users', AdminController.importUsers);

// @route   POST /api/admin/import/menu
// @desc    Import menu data
// @access  Private/Admin
router.post('/import/menu', AdminController.importMenu);

// ============================================
// ADMIN PROFILE
// ============================================

// @route   GET /api/admin/profile
// @desc    Get admin profile
// @access  Private/Admin
router.get('/profile', UserController.getProfile);

// @route   PUT /api/admin/profile
// @desc    Update admin profile
// @access  Private/Admin
router.put('/profile', UserController.updateProfile);

// @route   POST /api/admin/profile/upload
// @desc    Upload admin profile picture
// @access  Private/Admin
router.post('/profile/upload', uploadMiddleware.profilePicture, UserController.uploadProfilePicture);

// @route   PUT /api/admin/change-password
// @desc    Change admin password
// @access  Private/Admin
router.put('/change-password', UserController.changePassword);

// ============================================
// ADMIN ACTIVITY LOG
// ============================================

// @route   GET /api/admin/activity/my
// @desc    Get current admin activity log
// @access  Private/Admin
router.get('/activity/my', AdminController.getMyActivity);

// ============================================
// API DOCUMENTATION
// ============================================

// @route   GET /api/admin/api-docs
// @desc    Get admin API documentation
// @access  Private/Admin
router.get('/api-docs', AdminController.getApiDocumentation);

module.exports = router;
