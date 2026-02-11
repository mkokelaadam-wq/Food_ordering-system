const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all cart routes
// This ensures only logged-in users can access cart
router.use(authMiddleware);

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private (requires login)
router.post('/add', cartController.addToCart);

// @route   GET /api/cart
// @desc    Get user's cart items
// @access  Private
router.get('/', cartController.getCart);

// @route   GET /api/cart/count
// @desc    Get cart item count for navbar
// @access  Private
router.get('/count', cartController.getCartCount);

// @route   PUT /api/cart/:id
// @desc    Update cart item quantity
// @access  Private
router.put('/:id', cartController.updateCartItem);

// @route   DELETE /api/cart/:id
// @desc    Remove item from cart
// @access  Private
router.delete('/:id', cartController.removeFromCart);

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete('/clear', cartController.clearCart);

module.exports = router;
