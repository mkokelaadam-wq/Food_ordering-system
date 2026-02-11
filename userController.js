/**
 * User Controller
 * Handles user profile and account operations
 */

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { uploadConfig } = require('../config/uploadConfig');

class UserController {
    /**
     * Get user profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getProfile(req, res) {
        try {
            const userId = req.user.id;
            
            const [users] = await db.query(
                `SELECT 
                    id, name, email, phone, address, 
                    profile_picture, role, status,
                    email_verified, last_login, 
                    created_at, updated_at
                FROM users 
                WHERE id = ?`,
                [userId]
            );
            
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            const user = users[0];
            
            // Get user statistics
            const [stats] = await db.query(
                `SELECT 
                    (SELECT COUNT(*) FROM orders WHERE user_id = ?) as total_orders,
                    (SELECT COUNT(*) FROM orders WHERE user_id = ? AND status = 'delivered') as completed_orders,
                    (SELECT COUNT(*) FROM reviews WHERE user_id = ?) as total_reviews,
                    (SELECT COUNT(*) FROM favorites WHERE user_id = ?) as total_favorites
                FROM DUAL`,
                [userId, userId, userId, userId]
            );
            
            // Get recent orders
            const [recentOrders] = await db.query(
                `SELECT 
                    id, order_number, total_amount, status,
                    created_at, delivery_address
                FROM orders 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT 5`,
                [userId]
            );
            
            // Format response
            const response = {
                success: true,
                data: {
                    user: {
                        ...user,
                        profile_picture_url: user.profile_picture 
                            ? uploadConfig.getFileUrl(user.profile_picture, 'profile')
                            : null
                    },
                    statistics: stats[0] || {
                        total_orders: 0,
                        completed_orders: 0,
                        total_reviews: 0,
                        total_favorites: 0
                    },
                    recent_orders: recentOrders
                }
            };
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Get Profile Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get user profile'
            });
        }
    }

    /**
     * Update user profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { name, phone, address } = req.body;
            
            // Validate input
            if (!name || name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Name must be at least 2 characters long'
                });
            }
            
            const updateData = {
                name: name.trim(),
                updated_at: new Date()
            };
            
            if (phone) updateData.phone = phone.trim();
            if (address) updateData.address = address.trim();
            
            const [result] = await db.query(
                'UPDATE users SET ? WHERE id = ?',
                [updateData, userId]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            // Get updated user
            const [users] = await db.query(
                'SELECT id, name, email, phone, address, profile_picture, role FROM users WHERE id = ?',
                [userId]
            );
            
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    user: users[0],
                    profile_picture_url: users[0].profile_picture 
                        ? uploadConfig.getFileUrl(users[0].profile_picture, 'profile')
                        : null
                }
            });
        } catch (error) {
            console.error('Update Profile Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update profile'
            });
        }
    }

    /**
     * Upload profile picture
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async uploadProfilePicture(req, res) {
        try {
            const userId = req.user.id;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }
            
            // Delete old profile picture if exists
            const [user] = await db.query(
                'SELECT profile_picture FROM users WHERE id = ?',
                [userId]
            );
            
            if (user[0].profile_picture) {
                await uploadConfig.deleteFile(
                    uploadConfig.getFilePath(user[0].profile_picture, 'profile')
                );
            }
            
            // Update user with new profile picture
            const [result] = await db.query(
                'UPDATE users SET profile_picture = ?, updated_at = NOW() WHERE id = ?',
                [req.file.filename, userId]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            const profileUrl = uploadConfig.getFileUrl(req.file.filename, 'profile');
            
            res.status(200).json({
                success: true,
                message: 'Profile picture uploaded successfully',
                data: {
                    profile_picture: req.file.filename,
                    profile_picture_url: profileUrl
                }
            });
        } catch (error) {
            console.error('Upload Profile Picture Error:', error);
            
            // Delete uploaded file if error occurred
            if (req.file) {
                await uploadConfig.deleteFile(req.file.path);
            }
            
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to upload profile picture'
            });
        }
    }

    /**
     * Get user's orders
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getUserOrders(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10, status } = req.query;
            const offset = (page - 1) * limit;
            
            let sql = `
                SELECT 
                    o.*,
                    r.name as restaurant_name,
                    r.logo_url as restaurant_logo,
                    COUNT(DISTINCT oi.id) as item_count
                FROM orders o
                LEFT JOIN restaurants r ON o.restaurant_id = r.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.user_id = ?
            `;
            
            const params = [userId];
            
            // Filter by status if provided
            if (status && status !== 'all') {
                sql += ' AND o.status = ?';
                params.push(status);
            }
            
            sql += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);
            
            const [orders] = await db.query(sql, params);
            
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
            const countParams = [userId];
            
            if (status && status !== 'all') {
                countSql += ' AND status = ?';
                countParams.push(status);
            }
            
            const [countResult] = await db.query(countSql, countParams);
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);
            
            // Format orders with item details
            const formattedOrders = await Promise.all(
                orders.map(async (order) => {
                    const [items] = await db.query(
                        'SELECT * FROM order_items WHERE order_id = ?',
                        [order.id]
                    );
                    
                    return {
                        ...order,
                        items,
                        restaurant_logo_url: order.restaurant_logo 
                            ? uploadConfig.getFileUrl(order.restaurant_logo, 'restaurant_logo')
                            : null
                    };
                })
            );
            
            res.status(200).json({
                success: true,
                data: {
                    orders: formattedOrders,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    }
                }
            });
        } catch (error) {
            console.error('Get User Orders Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get user orders'
            });
        }
    }

    /**
     * Get single order details
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getOrderDetails(req, res) {
        try {
            const userId = req.user.id;
            const { orderId } = req.params;
            
            // Get order with restaurant details
            const [orders] = await db.query(
                `SELECT 
                    o.*,
                    r.name as restaurant_name,
                    r.logo_url as restaurant_logo,
                    r.phone as restaurant_phone,
                    r.address as restaurant_address
                FROM orders o
                LEFT JOIN restaurants r ON o.restaurant_id = r.id
                WHERE o.id = ? AND o.user_id = ?`,
                [orderId, userId]
            );
            
            if (orders.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Order not found'
                });
            }
            
            const order = orders[0];
            
            // Get order items
            const [items] = await db.query(
                `SELECT 
                    oi.*,
                    mi.image_url,
                    mi.description
                FROM order_items oi
                LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
                WHERE oi.order_id = ?
                ORDER BY oi.created_at`,
                [orderId]
            );
            
            // Calculate totals
            const itemTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
            const deliveryFee = order.delivery_fee || 0;
            const taxAmount = order.tax_amount || 0;
            const discountAmount = order.discount_amount || 0;
            const grandTotal = itemTotal + deliveryFee + taxAmount - discountAmount;
            
            // Format response
            const response = {
                success: true,
                data: {
                    order: {
                        ...order,
                        restaurant_logo_url: order.restaurant_logo 
                            ? uploadConfig.getFileUrl(order.restaurant_logo, 'restaurant_logo')
                            : null
                    },
                    items: items.map(item => ({
                        ...item,
                        image_url: item.image_url 
                            ? uploadConfig.getFileUrl(item.image_url, 'menu')
                            : null
                    })),
                    totals: {
                        item_total: itemTotal,
                        delivery_fee: deliveryFee,
                        tax_amount: taxAmount,
                        discount_amount: discountAmount,
                        grand_total: grandTotal
                    },
                    timeline: this.generateOrderTimeline(order)
                }
            };
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Get Order Details Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get order details'
            });
        }
    }

    /**
     * Generate order timeline based on status
     * @param {Object} order - Order object
     * @returns {Array} - Timeline array
     */
    static generateOrderTimeline(order) {
        const timeline = [];
        const now = new Date();
        
        // Order placed
        timeline.push({
            status: 'Order Placed',
            description: 'Your order has been received',
            timestamp: order.created_at,
            completed: true,
            current: false
        });
        
        // Order confirmed
        if (order.status === 'confirmed' || 
            order.status === 'preparing' || 
            order.status === 'ready' || 
            order.status === 'out_for_delivery' || 
            order.status === 'delivered') {
            timeline.push({
                status: 'Order Confirmed',
                description: 'Restaurant has confirmed your order',
                timestamp: order.updated_at,
                completed: true,
                current: false
            });
        } else {
            timeline.push({
                status: 'Order Confirmed',
                description: 'Waiting for restaurant confirmation',
                timestamp: null,
                completed: false,
                current: order.status === 'pending'
            });
        }
        
        // Food preparing
        if (order.status === 'preparing' || 
            order.status === 'ready' || 
            order.status === 'out_for_delivery' || 
            order.status === 'delivered') {
            timeline.push({
                status: 'Preparing Food',
                description: 'Restaurant is preparing your food',
                timestamp: order.updated_at,
                completed: true,
                current: false
            });
        } else {
            timeline.push({
                status: 'Preparing Food',
                description: 'Food preparation will start soon',
                timestamp: null,
                completed: false,
                current: order.status === 'confirmed'
            });
        }
        
        // Food ready
        if (order.status === 'ready' || 
            order.status === 'out_for_delivery' || 
            order.status === 'delivered') {
            timeline.push({
                status: 'Food Ready',
                description: 'Your food is ready for delivery',
                timestamp: order.updated_at,
                completed: true,
                current: false
            });
        } else {
            timeline.push({
                status: 'Food Ready',
                description: 'Food will be ready soon',
                timestamp: null,
                completed: false,
                current: order.status === 'preparing'
            });
        }
        
        // Out for delivery
        if (order.status === 'out_for_delivery' || order.status === 'delivered') {
            timeline.push({
                status: 'Out for Delivery',
                description: 'Delivery driver is on the way',
                timestamp: order.updated_at,
                completed: true,
                current: false
            });
        } else {
            timeline.push({
                status: 'Out for Delivery',
                description: 'Waiting for delivery driver',
                timestamp: null,
                completed: false,
                current: order.status === 'ready'
            });
        }
        
        // Delivered
        if (order.status === 'delivered') {
            timeline.push({
                status: 'Delivered',
                description: 'Your order has been delivered',
                timestamp: order.actual_delivery_time || order.updated_at,
                completed: true,
                current: true
            });
        } else {
            timeline.push({
                status: 'Delivered',
                description: 'Your order is on the way',
                timestamp: null,
                completed: false,
                current: order.status === 'out_for_delivery'
            });
        }
        
        return timeline;
    }

    /**
     * Change user password
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { current_password, new_password, confirm_password } = req.body;
            
            // Validate input
            if (!current_password || !new_password || !confirm_password) {
                return res.status(400).json({
                    success: false,
                    error: 'All password fields are required'
                });
            }
            
            if (new_password !== confirm_password) {
                return res.status(400).json({
                    success: false,
                    error: 'New password and confirmation do not match'
                });
            }
            
            if (new_password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'New password must be at least 6 characters long'
                });
            }
            
            // Get current user with password
            const [users] = await db.query(
                'SELECT id, password FROM users WHERE id = ?',
                [userId]
            );
            
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            const user = users[0];
            
            // Verify current password
            const isPasswordValid = await bcrypt.compare(current_password, user.password);
            
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Current password is incorrect'
                });
            }
            
            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(new_password, salt);
            
            // Update password
            const [result] = await db.query(
                'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
                [hashedPassword, userId]
            );
            
            if (result.affectedRows === 0) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to update password'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change Password Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to change password'
            });
        }
    }

    /**
     * Get user favorites (restaurants and menu items)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getFavorites(req, res) {
        try {
            const userId = req.user.id;
            
            // Get favorite restaurants
            const [favoriteRestaurants] = await db.query(
                `SELECT 
                    r.*,
                    AVG(rev.rating) as avg_rating,
                    COUNT(DISTINCT rev.id) as review_count
                FROM favorites f
                INNER JOIN restaurants r ON f.restaurant_id = r.id
                LEFT JOIN reviews rev ON r.id = rev.restaurant_id AND rev.status = 'approved'
                WHERE f.user_id = ? AND f.restaurant_id IS NOT NULL
                AND r.status = 'active' AND r.is_open = TRUE
                GROUP BY r.id
                ORDER BY f.created_at DESC`,
                [userId]
            );
            
            // Get favorite menu items
            const [favoriteMenuItems] = await db.query(
                `SELECT 
                    mi.*,
                    r.name as restaurant_name,
                    r.logo_url as restaurant_logo,
                    c.name as category_name
                FROM favorites f
                INNER JOIN menu_items mi ON f.menu_item_id = mi.id
                INNER JOIN restaurants r ON mi.restaurant_id = r.id
                LEFT JOIN categories c ON mi.category_id = c.id
                WHERE f.user_id = ? AND f.menu_item_id IS NOT NULL
                AND mi.is_available = TRUE AND r.is_open = TRUE
                ORDER BY f.created_at DESC`,
                [userId]
            );
            
            // Format response with image URLs
            const formattedRestaurants = favoriteRestaurants.map(restaurant => ({
                ...restaurant,
                logo_url: restaurant.logo_url 
                    ? uploadConfig.getFileUrl(restaurant.logo_url, 'restaurant_logo')
                    : null,
                cover_image_url: restaurant.cover_image_url 
                    ? uploadConfig.getFileUrl(restaurant.cover_image_url, 'restaurant_cover')
                    : null
            }));
            
            const formattedMenuItems = favoriteMenuItems.map(item => ({
                ...item,
                image_url: item.image_url 
                    ? uploadConfig.getFileUrl(item.image_url, 'menu')
                    : null,
                restaurant_logo_url: item.restaurant_logo 
                    ? uploadConfig.getFileUrl(item.restaurant_logo, 'restaurant_logo')
                    : null
            }));
            
            res.status(200).json({
                success: true,
                data: {
                    restaurants: formattedRestaurants,
                    menu_items: formattedMenuItems,
                    counts: {
                        restaurants: formattedRestaurants.length,
                        menu_items: formattedMenuItems.length
                    }
                }
            });
        } catch (error) {
            console.error('Get Favorites Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get favorites'
            });
        }
    }

    /**
     * Add to favorites
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async addToFavorites(req, res) {
        try {
            const userId = req.user.id;
            const { restaurant_id, menu_item_id } = req.body;
            
            if (!restaurant_id && !menu_item_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Either restaurant_id or menu_item_id is required'
                });
            }
            
            // Check if already favorited
            const [existing] = await db.query(
                'SELECT id FROM favorites WHERE user_id = ? AND (restaurant_id = ? OR menu_item_id = ?)',
                [userId, restaurant_id || null, menu_item_id || null]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Item is already in favorites'
                });
            }
            
            // Add to favorites
            const [result] = await db.query(
                'INSERT INTO favorites (user_id, restaurant_id, menu_item_id) VALUES (?, ?, ?)',
                [userId, restaurant_id || null, menu_item_id || null]
            );
            
            let message = '';
            if (restaurant_id) {
                message = 'Restaurant added to favorites';
            } else {
                message = 'Menu item added to favorites';
            }
            
            res.status(201).json({
                success: true,
                message: message,
                data: {
                    favorite_id: result.insertId
                }
            });
        } catch (error) {
            console.error('Add to Favorites Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to add to favorites'
            });
        }
    }

    /**
     * Remove from favorites
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async removeFromFavorites(req, res) {
        try {
            const userId = req.user.id;
            const { favorite_id } = req.params;
            
            const [result] = await db.query(
                'DELETE FROM favorites WHERE id = ? AND user_id = ?',
                [favorite_id, userId]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Favorite item not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Removed from favorites'
            });
        } catch (error) {
            console.error('Remove from Favorites Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to remove from favorites'
            });
        }
    }

    /**
     * Get user addresses
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getAddresses(req, res) {
        try {
            const userId = req.user.id;
            
            const [addresses] = await db.query(
                `SELECT * FROM delivery_addresses 
                WHERE user_id = ? 
                ORDER BY is_default DESC, created_at DESC`,
                [userId]
            );
            
            res.status(200).json({
                success: true,
                data: {
                    addresses,
                    default_address: addresses.find(addr => addr.is_default) || null
                }
            });
        } catch (error) {
            console.error('Get Addresses Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get addresses'
            });
        }
    }

    /**
     * Add new address
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async addAddress(req, res) {
        try {
            const userId = req.user.id;
            const {
                label,
                address_line1,
                address_line2,
                city,
                state,
                postal_code,
                country,
                latitude,
                longitude,
                is_default
            } = req.body;
            
            // Validate required fields
            if (!label || !address_line1 || !city) {
                return res.status(400).json({
                    success: false,
                    error: 'Label, address line 1, and city are required'
                });
            }
            
            // If setting as default, unset other defaults
            if (is_default) {
                await db.query(
                    'UPDATE delivery_addresses SET is_default = FALSE WHERE user_id = ?',
                    [userId]
                );
            }
            
            const addressData = {
                user_id: userId,
                label,
                address_line1,
                address_line2: address_line2 || null,
                city,
                state: state || null,
                postal_code: postal_code || null,
                country: country || 'Tanzania',
                latitude: latitude || null,
                longitude: longitude || null,
                is_default: is_default ? 1 : 0
            };
            
            const [result] = await db.query(
                'INSERT INTO delivery_addresses SET ?',
                [addressData]
            );
            
            res.status(201).json({
                success: true,
                message: 'Address added successfully',
                data: {
                    address_id: result.insertId
                }
            });
        } catch (error) {
            console.error('Add Address Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to add address'
            });
        }
    }

    /**
     * Update address
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async updateAddress(req, res) {
        try {
            const userId = req.user.id;
            const { address_id } = req.params;
            const updateData = req.body;
            
            // Check if address belongs to user
            const [address] = await db.query(
                'SELECT id FROM delivery_addresses WHERE id = ? AND user_id = ?',
                [address_id, userId]
            );
            
            if (address.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Address not found'
                });
            }
            
            // If setting as default, unset other defaults
            if (updateData.is_default) {
                await db.query(
                    'UPDATE delivery_addresses SET is_default = FALSE WHERE user_id = ? AND id != ?',
                    [userId, address_id]
                );
            }
            
            const [result] = await db.query(
                'UPDATE delivery_addresses SET ? WHERE id = ? AND user_id = ?',
                [updateData, address_id, userId]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Address not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Address updated successfully'
            });
        } catch (error) {
            console.error('Update Address Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update address'
            });
        }
    }

    /**
     * Delete address
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async deleteAddress(req, res) {
        try {
            const userId = req.user.id;
            const { address_id } = req.params;
            
            const [result] = await db.query(
                'DELETE FROM delivery_addresses WHERE id = ? AND user_id = ?',
                [address_id, userId]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Address not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Address deleted successfully'
            });
        } catch (error) {
            console.error('Delete Address Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete address'
            });
        }
    }

    /**
     * Get user notifications
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getNotifications(req, res) {
        try {
            const userId = req.user.id;
            const { unread_only = false, limit = 20 } = req.query;
            
            let sql = `
                SELECT * FROM notifications 
                WHERE user_id = ?
            `;
            
            const params = [userId];
            
            if (unread_only) {
                sql += ' AND is_read = FALSE';
            }
            
            sql += ' ORDER BY created_at DESC LIMIT ?';
            params.push(parseInt(limit));
            
            const [notifications] = await db.query(sql, params);
            
            // Mark as read if specified
            if (req.query.mark_as_read === 'true') {
                await db.query(
                    'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
                    [userId]
                );
            }
            
            // Get unread count
            const [unreadCount] = await db.query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
                [userId]
            );
            
            res.status(200).json({
                success: true,
                data: {
                    notifications,
                    unread_count: unreadCount[0].count
                }
            });
        } catch (error) {
            console.error('Get Notifications Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get notifications'
            });
        }
    }

    /**
     * Mark notification as read
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async markNotificationRead(req, res) {
        try {
            const userId = req.user.id;
            const { notification_id } = req.params;
            
            const [result] = await db.query(
                'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
                [notification_id, userId]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Notification not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error) {
            console.error('Mark Notification Read Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark notification as read'
            });
        }
    }

    /**
     * Delete notification
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async deleteNotification(req, res) {
        try {
            const userId = req.user.id;
            const { notification_id } = req.params;
            
            const [result] = await db.query(
                'DELETE FROM notifications WHERE id = ? AND user_id = ?',
                [notification_id, userId]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Notification not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Notification deleted'
            });
        } catch (error) {
            console.error('Delete Notification Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete notification'
            });
        }
    }

    /**
     * Clear all notifications
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async clearNotifications(req, res) {
        try {
            const userId = req.user.id;
            
            await db.query(
                'DELETE FROM notifications WHERE user_id = ?',
                [userId]
            );
            
            res.status(200).json({
                success: true,
                message: 'All notifications cleared'
            });
        } catch (error) {
            console.error('Clear Notifications Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to clear notifications'
            });
        }
    }
}

module.exports = UserController;
