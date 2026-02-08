const Order = require('../models/Order');
const Menu = require('../models/Menu');

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const { items, delivery_address, phone, payment_method, notes } = req.body;
        const user_id = req.user.userId;
        
        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Order items are required'
            });
        }
        
        if (!delivery_address) {
            return res.status(400).json({
                success: false,
                error: 'Delivery address is required'
            });
        }
        
        if (!phone) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required for delivery'
            });
        }
        
        // Calculate total and validate items
        let total_amount = 0;
        const orderItems = [];
        
        for (const item of items) {
            // Validate item structure
            if (!item.id || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid item format. Each item needs id and quantity'
                });
            }
            
            // Get menu item details
            const menuItem = await Menu.getById(item.id);
            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    error: `Menu item with ID ${item.id} not found`
                });
            }
            
            if (!menuItem.available) {
                return res.status(400).json({
                    success: false,
                    error: `Menu item "${menuItem.name}" is not available`
                });
            }
            
            const subtotal = menuItem.price * item.quantity;
            total_amount += subtotal;
            
            orderItems.push({
                menu_item_id: item.id,
                quantity: item.quantity,
                price: menuItem.price,
                subtotal: subtotal
            });
        }
        
        // Create order data
        const orderData = {
            user_id,
            total_amount,
            delivery_address,
            phone,
            payment_method: payment_method || 'cash',
            notes: notes || ''
        };
        
        // Create order in database
        const { orderId, orderNumber } = await Order.create(orderData, orderItems);
        
        // Get order details
        const orderDetails = await Order.getOrderDetails(orderId, user_id);
        
        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order: {
                id: orderId,
                order_number: orderNumber,
                ...orderDetails
            }
        });
        
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error placing order'
        });
    }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
    try {
        const user_id = req.user.userId;
        const orders = await Order.getByUser(user_id);
        
        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
        
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching orders'
        });
    }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const user_id = req.user.userId;
        
        const order = await Order.getOrderDetails(orderId, user_id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found or access denied'
            });
        }
        
        res.json({
            success: true,
            data: order
        });
        
    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching order details'
        });
    }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const user_id = req.user.userId;
        
        // Get order to check ownership
        const order = await Order.getOrderDetails(orderId, user_id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found or access denied'
            });
        }
        
        // Check if order can be cancelled (only pending orders)
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: `Cannot cancel order with status: ${order.status}`
            });
        }
        
        // Update order status to cancelled
        const updated = await Order.updateStatus(orderId, 'cancelled');
        
        if (!updated) {
            return res.status(500).json({
                success: false,
                error: 'Failed to cancel order'
            });
        }
        
        res.json({
            success: true,
            message: 'Order cancelled successfully'
        });
        
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error cancelling order'
        });
    }
};

// Get order status
exports.getOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const user_id = req.user.userId;
        
        const order = await Order.getOrderDetails(orderId, user_id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found or access denied'
            });
        }
        
        res.json({
            success: true,
            data: {
                id: order.id,
                status: order.status,
                order_number: order.order_number,
                created_at: order.created_at,
                estimated_delivery: order.estimated_delivery
            }
        });
        
    } catch (error) {
        console.error('Get order status error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching order status'
        });
    }
};

// ADMIN FUNCTIONS

// Get all orders (Admin)
exports.getAllOrders = async (req, res) => {
    try {
        // Check admin permission
        // if (req.user.role !== 'admin') {
        //     return res.status(403).json({
        //         success: false,
        //         error: 'Admin access required'
        //     });
        // }
        
        const { status, limit = 50, page = 1 } = req.query;
        const offset = (page - 1) * limit;
        
        let orders;
        if (status) {
            orders = await Order.getByStatus(status);
        } else {
            orders = await Order.getAll(parseInt(limit), offset);
        }
        
        res.json({
            success: true,
            count: orders.length,
            page: parseInt(page),
            limit: parseInt(limit),
            data: orders
        });
        
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching all orders'
        });
    }
};

// Update order status (Admin)
exports.updateOrderStatus = async (req, res) => {
    try {
        // Check admin permission
        // if (req.user.role !== 'admin') {
        //     return res.status(403).json({
        //         success: false,
        //         error: 'Admin access required'
        //     });
        // }
        
        const orderId = req.params.id;
        const { status } = req.body;
        
        // Validate status
        const validStatuses = ['pending', 'preparing', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }
        
        // Check if order exists
        const order = await Order.getOrderDetails(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        // Update status
        const updated = await Order.updateStatus(orderId, status);
        
        if (!updated) {
            return res.status(500).json({
                success: false,
                error: 'Failed to update order status'
            });
        }
        
        // Get updated order
        const updatedOrder = await Order.getOrderDetails(orderId);
        
        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            data: updatedOrder
        });
        
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error updating order status'
        });
    }
};

// Get order statistics (Admin)
exports.getOrderStats = async (req, res) => {
    try {
        // Check admin permission
        // if (req.user.role !== 'admin') {
        //     return res.status(403).json({
        //         success: false,
        //         error: 'Admin access required'
        //     });
        // }
        
        const allOrders = await Order.getAll(1000, 0);
        
        const stats = {
            total_orders: allOrders.length,
            total_revenue: allOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0),
            by_status: {
                pending: allOrders.filter(o => o.status === 'pending').length,
                preparing: allOrders.filter(o => o.status === 'preparing').length,
                delivered: allOrders.filter(o => o.status === 'delivered').length,
                cancelled: allOrders.filter(o => o.status === 'cancelled').length
            },
            recent_orders: allOrders.slice(0, 10)
        };
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching order statistics'
        });
    }
};
