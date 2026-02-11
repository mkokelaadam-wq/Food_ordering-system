/**
 * OrderItem Model
 * Handles order item operations
 */

const db = require('../config/database');

class OrderItem {
    /**
     * Create order items from cart
     * @param {number} orderId - Order ID
     * @param {number} userId - User ID
     * @returns {Promise<Array>} - Array of created order items
     */
    static async createFromCart(orderId, userId) {
        try {
            // Get cart items for user
            const cartItems = await db.query(
                `SELECT 
                    c.menu_item_id,
                    c.quantity,
                    c.special_instructions,
                    mi.name as menu_item_name,
                    COALESCE(mi.discounted_price, mi.price) as price
                FROM cart c
                INNER JOIN menu_items mi ON c.menu_item_id = mi.id
                WHERE c.user_id = ? AND mi.is_available = TRUE`,
                [userId]
            );
            
            if (cartItems.length === 0) {
                throw new Error('Cart is empty or items are unavailable');
            }
            
            const orderItems = [];
            
            // Insert each cart item as order item
            for (const item of cartItems) {
                const subtotal = item.price * item.quantity;
                
                const [result] = await db.query(
                    `INSERT INTO order_items 
                    (order_id, menu_item_id, menu_item_name, menu_item_price, quantity, subtotal, special_instructions) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [orderId, item.menu_item_id, item.menu_item_name, item.price, item.quantity, subtotal, item.special_instructions]
                );
                
                orderItems.push({
                    id: result.insertId,
                    ...item,
                    subtotal
                });
            }
            
            return orderItems;
        } catch (error) {
            console.error('OrderItem.createFromCart Error:', error);
            throw error;
        }
    }

    /**
     * Get order items for an order
     * @param {number} orderId - Order ID
     * @returns {Promise<Array>} - Array of order items
     */
    static async getByOrderId(orderId) {
        try {
            const [items] = await db.query(
                `SELECT 
                    oi.*,
                    mi.image_url,
                    mi.description,
                    r.name as restaurant_name,
                    r.logo_url as restaurant_logo
                FROM order_items oi
                LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
                LEFT JOIN restaurants r ON mi.restaurant_id = r.id
                WHERE oi.order_id = ?
                ORDER BY oi.created_at`,
                [orderId]
            );
            
            return items;
        } catch (error) {
            console.error('OrderItem.getByOrderId Error:', error);
            throw error;
        }
    }

    /**
     * Get order items with details
     * @param {number} orderId - Order ID
     * @returns {Promise<Object>} - Order with items
     */
    static async getOrderWithItems(orderId) {
        try {
            // Get order details
            const [orders] = await db.query(
                `SELECT 
                    o.*,
                    r.name as restaurant_name,
                    r.logo_url as restaurant_logo,
                    r.phone as restaurant_phone,
                    u.name as customer_name,
                    u.email as customer_email
                FROM orders o
                LEFT JOIN restaurants r ON o.restaurant_id = r.id
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id = ?`,
                [orderId]
            );
            
            if (orders.length === 0) {
                return null;
            }
            
            const order = orders[0];
            
            // Get order items
            const items = await this.getByOrderId(orderId);
            
            // Calculate totals
            const itemTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
            const deliveryFee = order.delivery_fee || 0;
            const taxAmount = order.tax_amount || 0;
            const discountAmount = order.discount_amount || 0;
            const grandTotal = itemTotal + deliveryFee + taxAmount - discountAmount;
            
            return {
                ...order,
                items,
                totals: {
                    item_total: itemTotal,
                    delivery_fee: deliveryFee,
                    tax_amount: taxAmount,
                    discount_amount: discountAmount,
                    grand_total: grandTotal
                }
            };
        } catch (error) {
            console.error('OrderItem.getOrderWithItems Error:', error);
            throw error;
        }
    }

    /**
     * Update order item quantity
     * @param {number} orderItemId - Order item ID
     * @param {number} quantity - New quantity
     * @returns {Promise<boolean>} - Success status
     */
    static async updateQuantity(orderItemId, quantity) {
        try {
            if (quantity < 1) {
                throw new Error('Quantity must be at least 1');
            }
            
            // Get current price
            const [current] = await db.query(
                'SELECT menu_item_price FROM order_items WHERE id = ?',
                [orderItemId]
            );
            
            if (current.length === 0) {
                throw new Error('Order item not found');
            }
            
            const newSubtotal = current[0].menu_item_price * quantity;
            
            const [result] = await db.query(
                'UPDATE order_items SET quantity = ?, subtotal = ? WHERE id = ?',
                [quantity, newSubtotal, orderItemId]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('OrderItem.updateQuantity Error:', error);
            throw error;
        }
    }

    /**
     * Update order item special instructions
     * @param {number} orderItemId - Order item ID
     * @param {string} instructions - Special instructions
     * @returns {Promise<boolean>} - Success status
     */
    static async updateInstructions(orderItemId, instructions) {
        try {
            const [result] = await db.query(
                'UPDATE order_items SET special_instructions = ? WHERE id = ?',
                [instructions, orderItemId]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('OrderItem.updateInstructions Error:', error);
            throw error;
        }
    }

    /**
     * Add item to existing order
     * @param {number} orderId - Order ID
     * @param {number} menuItemId - Menu item ID
     * @param {number} quantity - Quantity
     * @param {string} instructions - Special instructions
     * @returns {Promise<number>} - New order item ID
     */
    static async addToOrder(orderId, menuItemId, quantity = 1, instructions = '') {
        try {
            // Get menu item details
            const [menuItem] = await db.query(
                'SELECT name, COALESCE(discounted_price, price) as price FROM menu_items WHERE id = ?',
                [menuItemId]
            );
            
            if (menuItem.length === 0) {
                throw new Error('Menu item not found');
            }
            
            const subtotal = menuItem[0].price * quantity;
            
            const [result] = await db.query(
                `INSERT INTO order_items 
                (order_id, menu_item_id, menu_item_name, menu_item_price, quantity, subtotal, special_instructions) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orderId, menuItemId, menuItem[0].name, menuItem[0].price, quantity, subtotal, instructions]
            );
            
            return result.insertId;
        } catch (error) {
            console.error('OrderItem.addToOrder Error:', error);
            throw error;
        }
    }

    /**
     * Remove item from order
     * @param {number} orderItemId - Order item ID
     * @returns {Promise<boolean>} - Success status
     */
    static async removeFromOrder(orderItemId) {
        try {
            const [result] = await db.query(
                'DELETE FROM order_items WHERE id = ?',
                [orderItemId]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('OrderItem.removeFromOrder Error:', error);
            throw error;
        }
    }

    /**
     * Get order item by ID
     * @param {number} orderItemId - Order item ID
     * @returns {Promise<Object|null>} - Order item or null
     */
    static async getById(orderItemId) {
        try {
            const [items] = await db.query(
                `SELECT 
                    oi.*,
                    o.order_number,
                    o.status as order_status,
                    mi.image_url,
                    r.name as restaurant_name
                FROM order_items oi
                LEFT JOIN orders o ON oi.order_id = o.id
                LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
                LEFT JOIN restaurants r ON mi.restaurant_id = r.id
                WHERE oi.id = ?`,
                [orderItemId]
            );
            
            return items[0] || null;
        } catch (error) {
            console.error('OrderItem.getById Error:', error);
            throw error;
        }
    }

    /**
     * Get order items for restaurant
     * @param {number} restaurantId - Restaurant ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Array of order items
     */
    static async getByRestaurant(restaurantId, filters = {}) {
        try {
            let sql = `
                SELECT 
                    oi.*,
                    o.order_number,
                    o.status as order_status,
                    o.created_at as order_date,
                    o.customer_name,
                    o.customer_phone,
                    mi.name as original_item_name,
                    mi.image_url
                FROM order_items oi
                INNER JOIN orders o ON oi.order_id = o.id
                LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
                WHERE o.restaurant_id = ?
            `;
            
            const params = [restaurantId];
            
            // Apply filters
            if (filters.status) {
                sql += ' AND o.status = ?';
                params.push(filters.status);
            }
            
            if (filters.date_from) {
                sql += ' AND DATE(o.created_at) >= ?';
                params.push(filters.date_from);
            }
            
            if (filters.date_to) {
                sql += ' AND DATE(o.created_at) <= ?';
                params.push(filters.date_to);
            }
            
            if (filters.search) {
                sql += ' AND (oi.menu_item_name LIKE ? OR o.customer_name LIKE ? OR o.order_number LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
            
            sql += ' ORDER BY o.created_at DESC';
            
            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(filters.limit);
            }
            
            const [items] = await db.query(sql, params);
            return items;
        } catch (error) {
            console.error('OrderItem.getByRestaurant Error:', error);
            throw error;
        }
    }

    /**
     * Get popular order items for restaurant
     * @param {number} restaurantId - Restaurant ID
     * @param {number} limit - Number of items to return
     * @returns {Promise<Array>} - Array of popular items
     */
    static async getPopularItems(restaurantId, limit = 10) {
        try {
            const [items] = await db.query(
                `SELECT 
                    oi.menu_item_id,
                    oi.menu_item_name,
                    COUNT(*) as order_count,
                    SUM(oi.quantity) as total_quantity,
                    AVG(oi.menu_item_price) as avg_price
                FROM order_items oi
                INNER JOIN orders o ON oi.order_id = o.id
                WHERE o.restaurant_id = ? AND o.status = 'delivered'
                GROUP BY oi.menu_item_id, oi.menu_item_name
                ORDER BY total_quantity DESC, order_count DESC
                LIMIT ?`,
                [restaurantId, limit]
            );
            
            return items;
        } catch (error) {
            console.error('OrderItem.getPopularItems Error:', error);
            throw error;
        }
    }

    /**
     * Get order item statistics
     * @param {number} orderId - Order ID
     * @returns {Promise<Object>} - Statistics object
     */
    static async getOrderStatistics(orderId) {
        try {
            const [stats] = await db.query(
                `SELECT 
                    COUNT(*) as item_count,
                    SUM(quantity) as total_quantity,
                    SUM(subtotal) as items_total,
                    AVG(menu_item_price) as avg_item_price,
                    MIN(menu_item_price) as min_item_price,
                    MAX(menu_item_price) as max_item_price
                FROM order_items 
                WHERE order_id = ?`,
                [orderId]
            );
            
            return stats[0] || {};
        } catch (error) {
            console.error('OrderItem.getOrderStatistics Error:', error);
            throw error;
        }
    }
}

module.exports = OrderItem;
