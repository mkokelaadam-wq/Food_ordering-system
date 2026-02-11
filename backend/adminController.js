/**
 * Admin Controller
 * Handles admin operations for system management
 */

const db = require('../config/database');

class AdminController {
    /**
     * Get dashboard statistics
     */
    static async getDashboardStats(req, res) {
        try {
            // Get today's date
            const today = new Date().toISOString().split('T')[0];
            
            // Get various statistics
            const [
                usersStats,
                ordersStats,
                restaurantsStats,
                revenueStats,
                recentOrders,
                recentUsers
            ] = await Promise.all([
                // Users statistics
                db.query(`
                    SELECT 
                        COUNT(*) as total_users,
                        SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customers,
                        SUM(CASE WHEN role = 'restaurant' THEN 1 ELSE 0 END) as restaurants,
                        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
                        SUM(CASE WHEN role = 'delivery' THEN 1 ELSE 0 END) as drivers,
                        SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) as new_today
                    FROM users
                `, [today]),
                
                // Orders statistics
                db.query(`
                    SELECT 
                        COUNT(*) as total_orders,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
                        SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing,
                        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready,
                        SUM(CASE WHEN status = 'out_for_delivery' THEN 1 ELSE 0 END) as out_for_delivery,
                        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
                        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                        SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) as today_orders
                    FROM orders
                `, [today]),
                
                // Restaurants statistics
                db.query(`
                    SELECT 
                        COUNT(*) as total_restaurants,
                        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
                        SUM(CASE WHEN is_open = TRUE THEN 1 ELSE 0 END) as open_now
                    FROM restaurants
                `),
                
                // Revenue statistics
                db.query(`
                    SELECT 
                        COALESCE(SUM(total_amount), 0) as total_revenue,
                        COALESCE(SUM(CASE WHEN DATE(created_at) = ? THEN total_amount ELSE 0 END), 0) as today_revenue,
                        COALESCE(SUM(CASE WHEN DATE(created_at) = DATE_SUB(?, INTERVAL 1 DAY) THEN total_amount ELSE 0 END), 0) as yesterday_revenue,
                        COALESCE(AVG(total_amount), 0) as avg_order_value
                    FROM orders 
                    WHERE status = 'delivered'
                `, [today, today]),
                
                // Recent orders
                db.query(`
                    SELECT 
                        o.id,
                        o.order_number,
                        o.total_amount,
                        o.status,
                        o.created_at,
                        o.customer_name,
                        r.name as restaurant_name
                    FROM orders o
                    LEFT JOIN restaurants r ON o.restaurant_id = r.id
                    ORDER BY o.created_at DESC
                    LIMIT 10
                `),
                
                // Recent users
                db.query(`
                    SELECT 
                        id,
                        name,
                        email,
                        role,
                        created_at
                    FROM users
                    ORDER BY created_at DESC
                    LIMIT 10
                `)
            ]);
            
            // Format response
            const response = {
                success: true,
                data: {
                    statistics: {
                        users: usersStats[0][0],
                        orders: ordersStats[0][0],
                        restaurants: restaurantsStats[0][0],
                        revenue: revenueStats[0][0]
                    },
                    recent_orders: recentOrders[0],
                    recent_users: recentUsers[0],
                    timestamp: new Date().toISOString()
                }
            };
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Get Dashboard Stats Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get dashboard statistics'
            });
        }
    }
    
    /**
     * Get all users with pagination
     */
    static async getAllUsers(req, res) {
        try {
            const { 
                page = 1, 
                limit = 20, 
                role, 
                status, 
                search 
            } = req.query;
            
            const offset = (page - 1) * limit;
            
            let sql = `
                SELECT 
                    id,
                    name,
                    email,
                    phone,
                    role,
                    status,
                    email_verified,
                    last_login,
                    created_at,
                    updated_at
                FROM users 
                WHERE 1=1
            `;
            
            let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
            const params = [];
            const countParams = [];
            
            // Apply filters
            if (role) {
                sql += ' AND role = ?';
                countSql += ' AND role = ?';
                params.push(role);
                countParams.push(role);
            }
            
            if (status) {
                sql += ' AND status = ?';
                countSql += ' AND status = ?';
                params.push(status);
                countParams.push(status);
            }
            
            if (search) {
                sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
                countSql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
                countParams.push(searchTerm, searchTerm, searchTerm);
            }
            
            sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);
            
            const [users] = await db.query(sql, params);
            const [countResult] = await db.query(countSql, countParams);
            
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);
            
            res.status(200).json({
                success: true,
                data: {
                    users,
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
            console.error('Get All Users Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get users'
            });
        }
    }
    
    /**
     * Get user by ID
     */
    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            
            const [users] = await db.query(
                `SELECT 
                    id,
                    name,
                    email,
                    phone,
                    address,
                    profile_picture,
                    role,
                    status,
                    email_verified,
                    last_login,
                    created_at,
                    updated_at
                FROM users 
                WHERE id = ?`,
                [id]
            );
            
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            // Get user statistics
            const [stats] = await db.query(
                `SELECT 
                    (SELECT COUNT(*) FROM orders WHERE user_id = ?) as total_orders,
                    (SELECT COUNT(*) FROM reviews WHERE user_id = ?) as total_reviews,
                    (SELECT COUNT(*) FROM favorites WHERE user_id = ?) as total_favorites
                FROM DUAL`,
                [id, id, id]
            );
            
            res.status(200).json({
                success: true,
                data: {
                    user: users[0],
                    statistics: stats[0]
                }
            });
        } catch (error) {
            console.error('Get User By ID Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get user'
            });
        }
    }
    
    /**
     * Update user status
     */
    static async updateUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Valid status is required (active, inactive, or suspended)'
                });
            }
            
            // Don't allow modifying own status
            if (parseInt(id) === req.user.id) {
                return res.status(400).json({
                    success: false,
                    error: 'You cannot modify your own status'
                });
            }
            
            const [result] = await db.query(
                'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
                [status, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: `User status updated to ${status}`
            });
        } catch (error) {
            console.error('Update User Status Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update user status'
            });
        }
    }
    
    /**
     * Update user role
     */
    static async updateUserRole(req, res) {
        try {
            const { id } = req.params;
            const { role } = req.body;
            
            if (!role || !['customer', 'restaurant', 'admin', 'delivery'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    error: 'Valid role is required'
                });
            }
            
            // Don't allow modifying own role
            if (parseInt(id) === req.user.id) {
                return res.status(400).json({
                    success: false,
                    error: 'You cannot modify your own role'
                });
            }
            
            // Don't allow demoting other admins unless you're super admin
            const [currentUser] = await db.query(
                'SELECT role FROM users WHERE id = ?',
                [id]
            );
            
            if (currentUser[0].role === 'admin' && req.user.email !== 'superadmin@foodexpress.com') {
                return res.status(403).json({
                    success: false,
                    error: 'Only super admin can modify other admin roles'
                });
            }
            
            const [result] = await db.query(
                'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
                [role, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: `User role updated to ${role}`
            });
        } catch (error) {
            console.error('Update User Role Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update user role'
            });
        }
    }
    
    /**
     * Get pending restaurants
     */
    static async getPendingRestaurants(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;
            
            const [restaurants] = await db.query(
                `SELECT 
                    r.*,
                    u.name as owner_name,
                    u.email as owner_email,
                    u.phone as owner_phone
                FROM restaurants r
                LEFT JOIN users u ON r.owner_id = u.id
                WHERE r.status = 'pending'
                ORDER BY r.created_at DESC
                LIMIT ? OFFSET ?`,
                [parseInt(limit), offset]
            );
            
            const [countResult] = await db.query(
                'SELECT COUNT(*) as total FROM restaurants WHERE status = "pending"'
            );
            
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);
            
            res.status(200).json({
                success: true,
                data: {
                    restaurants,
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
            console.error('Get Pending Restaurants Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get pending restaurants'
            });
        }
    }
    
    /**
     * Approve restaurant
     */
    static async approveRestaurant(req, res) {
        try {
            const { id } = req.params;
            
            const [result] = await db.query(
                `UPDATE restaurants 
                SET status = 'active', 
                    is_open = TRUE, 
                    updated_at = NOW() 
                WHERE id = ? AND status = 'pending'`,
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found or already processed'
                });
            }
            
            // Notify restaurant owner (you can implement email notification here)
            
            res.status(200).json({
                success: true,
                message: 'Restaurant approved successfully'
            });
        } catch (error) {
            console.error('Approve Restaurant Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to approve restaurant'
            });
        }
    }
    
    /**
     * Reject restaurant
     */
    static async rejectRestaurant(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            
            const [result] = await db.query(
                `UPDATE restaurants 
                SET status = 'inactive', 
                    is_open = FALSE, 
                    updated_at = NOW() 
                WHERE id = ? AND status = 'pending'`,
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found or already processed'
                });
            }
            
            // Notify restaurant owner with reason (you can implement email notification here)
            
            res.status(200).json({
                success: true,
                message: 'Restaurant rejected successfully'
            });
        } catch (error) {
            console.error('Reject Restaurant Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to reject restaurant'
            });
        }
    }
    
    /**
     * Get all orders with filters
     */
    static async getAllOrders(req, res) {
        try {
            const { 
                page = 1, 
                limit = 20, 
                status, 
                restaurant_id,
                user_id,
                date_from,
                date_to,
                search 
            } = req.query;
            
            const offset = (page - 1) * limit;
            
            let sql = `
                SELECT 
                    o.*,
                    r.name as restaurant_name,
                    r.logo_url as restaurant_logo,
                    u.name as customer_name,
                    u.email as customer_email
                FROM orders o
                LEFT JOIN restaurants r ON o.restaurant_id = r.id
                LEFT JOIN users u ON o.user_id = u.id
                WHERE 1=1
            `;
            
            let countSql = `
                SELECT COUNT(*) as total
                FROM orders o
                WHERE 1=1
            `;
            
            const params = [];
            const countParams = [];
            
            // Apply filters
            if (status) {
                sql += ' AND o.status = ?';
                countSql += ' AND o.status = ?';
                params.push(status);
                countParams.push(status);
            }
            
            if (restaurant_id) {
                sql += ' AND o.restaurant_id = ?';
                countSql += ' AND o.restaurant_id = ?';
                params.push(restaurant_id);
                countParams.push(restaurant_id);
            }
            
            if (user_id) {
                sql += ' AND o.user_id = ?';
                countSql += ' AND o.user_id = ?';
                params.push(user_id);
                countParams.push(user_id);
            }
            
            if (date_from) {
                sql += ' AND DATE(o.created_at) >= ?';
                countSql += ' AND DATE(o.created_at) >= ?';
                params.push(date_from);
                countParams.push(date_from);
            }
            
            if (date_to) {
                sql += ' AND DATE(o.created_at) <= ?';
                countSql += ' AND DATE(o.created_at) <= ?';
                params.push(date_to);
                countParams.push(date_to);
            }
            
            if (search) {
                sql += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)';
                countSql += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
                countParams.push(searchTerm, searchTerm, searchTerm);
            }
            
            sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);
            
            const [orders] = await db.query(sql, params);
            const [countResult] = await db.query(countSql, countParams);
            
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);
            
            res.status(200).json({
                success: true,
                data: {
                    orders,
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
            console.error('Get All Orders Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get orders'
            });
        }
    }
    
    /**
     * Update order status
     */
    static async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            const validStatuses = [
                'pending', 'confirmed', 'preparing', 'ready', 
                'out_for_delivery', 'delivered', 'cancelled'
            ];
            
            if (!status || !validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Valid status is required'
                });
            }
            
            const [result] = await db.query(
                `UPDATE orders 
                SET status = ?, 
                    updated_at = NOW(),
                    ${status === 'delivered' ? 'actual_delivery_time = NOW(),' : ''}
                    ${status === 'cancelled' ? 'cancellation_time = NOW(),' : ''}
                    ${status === 'out_for_delivery' ? 'estimated_delivery_time = DATE_ADD(NOW(), INTERVAL 30 MINUTE),' : ''}
                    status = ?
                WHERE id = ?`,
                [status, status, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Order not found'
                });
            }
            
            // Send notification to user (you can implement this)
            
            res.status(200).json({
                success: true,
                message: `Order status updated to ${status}`
            });
        } catch (error) {
            console.error('Update Order Status Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update order status'
            });
        }
    }
    
    /**
     * Get order details
     */
    static async getOrderDetails(req, res) {
        try {
            const { id } = req.params;
            
            // Get order with details
            const [orders] = await db.query(
                `SELECT 
                    o.*,
                    r.name as restaurant_name,
                    r.logo_url as restaurant_logo,
                    r.phone as restaurant_phone,
                    r.address as restaurant_address,
                    u.name as customer_full_name,
                    u.email as customer_email,
                    u.phone as customer_full_phone
                FROM orders o
                LEFT JOIN restaurants r ON o.restaurant_id = r.id
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id = ?`,
                [id]
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
                [id]
            );
            
            // Calculate totals
            const itemTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
            const deliveryFee = order.delivery_fee || 0;
            const taxAmount = order.tax_amount || 0;
            const discountAmount = order.discount_amount || 0;
            const grandTotal = itemTotal + deliveryFee + taxAmount - discountAmount;
            
            // Get payment details if exists
            const [payments] = await db.query(
                'SELECT * FROM payments WHERE order_id = ?',
                [id]
            );
            
            // Get assigned driver if exists
            const [driver] = await db.query(
                `SELECT 
                    u.id,
                    u.name,
                    u.phone
                FROM users u
                WHERE u.id = ? AND u.role = 'delivery'`,
                [order.assigned_driver_id]
            );
            
            res.status(200).json({
                success: true,
                data: {
                    order,
                    items,
                    payments: payments[0] || null,
                    driver: driver[0] || null,
                    totals: {
                        item_total: itemTotal,
                        delivery_fee: deliveryFee,
                        tax_amount: taxAmount,
                        discount_amount: discountAmount,
                        grand_total: grandTotal
                    }
                }
            });
        } catch (error) {
            console.error('Get Order Details Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get order details'
            });
        }
    }
    
    /**
     * Get pending reviews
     */
    static async getPendingReviews(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;
            
            const [reviews] = await db.query(
                `SELECT 
                    rev.*,
                    u.name as user_name,
                    u.email as user_email,
                    r.name as restaurant_name,
                    mi.name as menu_item_name,
                    o.order_number
                FROM reviews rev
                LEFT JOIN users u ON rev.user_id = u.id
                LEFT JOIN restaurants r ON rev.restaurant_id = r.id
                LEFT JOIN menu_items mi ON rev.menu_item_id = mi.id
                LEFT JOIN orders o ON rev.order_id = o.id
                WHERE rev.status = 'pending'
                ORDER BY rev.created_at DESC
                LIMIT ? OFFSET ?`,
                [parseInt(limit), offset]
            );
            
            const [countResult] = await db.query(
                'SELECT COUNT(*) as total FROM reviews WHERE status = "pending"'
            );
            
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);
            
            res.status(200).json({
                success: true,
                data: {
                    reviews,
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
            console.error('Get Pending Reviews Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get pending reviews'
            });
        }
    }
    
    /**
     * Approve review
     */
    static async approveReview(req, res) {
        try {
            const { id } = req.params;
            
            const [result] = await db.query(
                `UPDATE reviews 
                SET status = 'approved', 
                    updated_at = NOW() 
                WHERE id = ? AND status = 'pending'`,
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Review not found or already processed'
                });
            }
            
            // Update restaurant rating
            const [review] = await db.query(
                'SELECT restaurant_id FROM reviews WHERE id = ?',
                [id]
            );
            
            if (review[0].restaurant_id) {
                await db.query(
                    `CALL UpdateRestaurantRating(?)`,
                    [review[0].restaurant_id]
                );
            }
            
            res.status(200).json({
                success: true,
                message: 'Review approved successfully'
            });
        } catch (error) {
            console.error('Approve Review Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to approve review'
            });
        }
    }
    
    /**
     * Reject review
     */
    static async rejectReview(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            
            const [result] = await db.query(
                `UPDATE reviews 
                SET status = 'rejected', 
                    updated_at = NOW() 
                WHERE id = ? AND status = 'pending'`,
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Review not found or already processed'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Review rejected successfully'
            });
        } catch (error) {
            console.error('Reject Review Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to reject review'
            });
        }
    }
    
    /**
     * Get system health status
     */
    static async getSystemHealth(req, res) {
        try {
            const healthChecks = [];
            
            // Check database connection
            try {
                const [dbResult] = await db.query('SELECT 1 as status');
                healthChecks.push({
                    component: 'Database',
                    status: 'healthy',
                    message: 'Connected successfully',
                    timestamp: new Date().toISOString()
                });
            } catch (dbError) {
                healthChecks.push({
                    component: 'Database',
                    status: 'unhealthy',
                    message: dbError.message,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Check disk space (simplified)
            const diskUsage = {
                total: 100, // GB
                used: 45,   // GB
                free: 55,   // GB
                percent: 45
            };
            
            healthChecks.push({
                component: 'Disk Space',
                status: diskUsage.percent > 90 ? 'warning' : 'healthy',
                message: `${diskUsage.percent}% used (${diskUsage.free}GB free)`,
                data: diskUsage,
                timestamp: new Date().toISOString()
            });
            
            // Check memory usage (simplified)
            const memoryUsage = {
                total: 8,   // GB
                used: 3.2,  // GB
                free: 4.8,  // GB
                percent: 40
            };
            
            healthChecks.push({
                component: 'Memory',
                status: memoryUsage.percent > 85 ? 'warning' : 'healthy',
                message: `${memoryUsage.percent}% used (${memoryUsage.free}GB free)`,
                data: memoryUsage,
                timestamp: new Date().toISOString()
            });
            
            // Overall status
            const unhealthyCount = healthChecks.filter(h => h.status === 'unhealthy').length;
            const warningCount = healthChecks.filter(h => h.status === 'warning').length;
            
            let overallStatus = 'healthy';
            if (unhealthyCount > 0) {
                overallStatus = 'unhealthy';
            } else if (warningCount > 0) {
                overallStatus = 'warning';
            }
            
            res.status(200).json({
                success: true,
                data: {
                    status: overallStatus,
                    checks: healthChecks,
                    summary: {
                        total: healthChecks.length,
                        healthy: healthChecks.filter(h => h.status === 'healthy').length,
                        warning: warningCount,
                        unhealthy: unhealthyCount
                    },
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime() // seconds
                }
            });
        } catch (error) {
            console.error('Get System Health Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get system health status'
            });
        }
    }
    
    // Note: Add more methods as needed for other admin functionalities
    
}

module.exports = AdminController;
