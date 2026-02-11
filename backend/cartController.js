const Cart = require('../models/Cart');

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = async (req, res) => {
    try {
        const { menu_id, quantity = 1 } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!menu_id) {
            return res.status(400).json({
                success: false,
                error: 'Menu item ID is required'
            });
        }

        const result = await Cart.addItem(userId, menu_id, quantity);
        
        res.status(201).json({
            success: true,
            message: result.updated ? 
                'Item quantity updated in cart' : 
                'Item added to cart successfully',
            data: result
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add item to cart'
        });
    }
};

// @desc    Get user's cart items
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cartItems = await Cart.getCart(userId);
        const total = await Cart.getCartTotal(userId);
        const itemCount = await Cart.getCartCount(userId);
        
        res.status(200).json({
            success: true,
            data: {
                items: cartItems,
                total: total,
                itemCount: itemCount,
                itemQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0)
            }
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get cart'
        });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
exports.updateCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                error: 'Quantity must be at least 1'
            });
        }

        const updated = await Cart.updateQuantity(id, quantity);
        
        if (updated) {
            res.status(200).json({
                success: true,
                message: 'Cart item updated successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Cart item not found'
            });
        }
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update cart item'
        });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
exports.removeFromCart = async (req, res) => {
    try {
        const { id } = req.params;
        const removed = await Cart.removeItem(id);
        
        if (removed) {
            res.status(200).json({
                success: true,
                message: 'Item removed from cart'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Cart item not found'
            });
        }
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove item from cart'
        });
    }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart/clear
// @access  Private
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const clearedCount = await Cart.clearCart(userId);
        
        res.status(200).json({
            success: true,
            message: `Cart cleared successfully`,
            data: { itemsRemoved: clearedCount }
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear cart'
        });
    }
};

// @desc    Get cart count for navbar
// @route   GET /api/cart/count
// @access  Private
exports.getCartCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await Cart.getCartCount(userId);
        
        res.status(200).json({
            success: true,
            data: { count: count }
        });
    } catch (error) {
        console.error('Get cart count error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get cart count'
        });
    }
};
