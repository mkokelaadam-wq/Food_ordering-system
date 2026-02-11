/**
 * Restaurant Model
 * Handles restaurant operations
 */

const db = require('../config/database');

class Restaurant {
    /**
     * Get all restaurants with filters
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Array of restaurants
     */
    static async getAll(filters = {}) {
        try {
            let sql = `
                SELECT 
                    r.*,
                    COUNT(DISTINCT mi.id) as menu_item_count,
                    AVG(rev.rating) as avg_rating,
                    COUNT(DISTINCT rev.id) as review_count
                FROM restaurants r
                LEFT JOIN menu_items mi ON r.id = mi.restaurant_id AND mi.is_available = TRUE
                LEFT JOIN reviews rev ON r.id = rev.restaurant_id AND rev.status = 'approved'
                WHERE r.status = 'active'
            `;
            
            const params = [];
            
            // Apply filters
            if (filters.is_open !== undefined) {
                sql += ' AND r.is_open = ?';
                params.push(filters.is_open ? 1 : 0);
            }
            
            if (filters.category_id) {
                sql += ' AND EXISTS (SELECT 1 FROM menu_items mi2 WHERE mi2.restaurant_id = r.id AND mi2.category_id = ?)';
                params.push(filters.category_id);
            }
            
            if (filters.search) {
                sql += ' AND (r.name LIKE ? OR r.description LIKE ? OR r.address LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
            
            if (filters.min_rating) {
                sql += ' HAVING avg_rating >= ?';
                params.push(parseFloat(filters.min_rating));
            }
            
            sql += ' GROUP BY r.id';
            
            // Apply sorting
            if (filters.sort_by) {
                switch (filters.sort_by) {
                    case 'rating':
                        sql += ' ORDER BY avg_rating DESC';
                        break;
                    case 'delivery_time':
                        sql += ' ORDER BY r.estimated_delivery_time ASC';
                        break;
                    case 'delivery_fee':
                        sql += ' ORDER BY r.delivery_fee ASC';
                        break;
                    case 'name':
                        sql += ' ORDER BY r.name ASC';
                        break;
                    default:
                        sql += ' ORDER BY r.created_at DESC';
                }
            } else {
                sql += ' ORDER BY r.created_at DESC';
            }
            
            // Apply pagination
            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(parseInt(filters.limit));
                
                if (filters.offset) {
                    sql += ' OFFSET ?';
                    params.push(parseInt(filters.offset));
                }
            }
            
            const [restaurants] = await db.query(sql, params);
            return restaurants;
        } catch (error) {
            console.error('Restaurant.getAll Error:', error);
            throw error;
        }
    }

    /**
     * Get restaurant by ID with details
     * @param {number} id - Restaurant ID
     * @returns {Promise<Object|null>} - Restaurant object or null
     */
    static async getById(id) {
        try {
            const [restaurants] = await db.query(
                `SELECT 
                    r.*,
                    AVG(rev.rating) as avg_rating,
                    COUNT(DISTINCT rev.id) as review_count,
                    u.name as owner_name,
                    u.email as owner_email
                FROM restaurants r
                LEFT JOIN reviews rev ON r.id = rev.restaurant_id AND rev.status = 'approved'
                LEFT JOIN users u ON r.owner_id = u.id
                WHERE r.id = ? AND r.status = 'active'
                GROUP BY r.id`,
                [id]
            );
            
            return restaurants[0] || null;
        } catch (error) {
            console.error('Restaurant.getById Error:', error);
            throw error;
        }
    }

    /**
     * Get restaurant menu items
     * @param {number} restaurantId - Restaurant ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Array of menu items
     */
    static async getMenu(restaurantId, filters = {}) {
        try {
            let sql = `
                SELECT 
                    mi.*,
                    c.name as category_name,
                    c.icon as category_icon
                FROM menu_items mi
                LEFT JOIN categories c ON mi.category_id = c.id
                WHERE mi.restaurant_id = ? AND mi.is_available = TRUE
            `;
            
            const params = [restaurantId];
            
            // Apply filters
            if (filters.category_id) {
                sql += ' AND mi.category_id = ?';
                params.push(filters.category_id);
            }
            
            if (filters.is_vegetarian !== undefined) {
                sql += ' AND mi.is_vegetarian = ?';
                params.push(filters.is_vegetarian ? 1 : 0);
            }
            
            if (filters.is_spicy !== undefined) {
                sql += ' AND mi.is_spicy = ?';
                params.push(filters.is_spicy ? 1 : 0);
            }
            
            if (filters.is_featured !== undefined) {
                sql += ' AND mi.is_featured = ?';
                params.push(filters.is_featured ? 1 : 0);
            }
            
            if (filters.search) {
                sql += ' AND (mi.name LIKE ? OR mi.description LIKE ? OR mi.ingredients LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
            
            // Apply sorting
            if (filters.sort_by) {
                switch (filters.sort_by) {
                    case 'price_low':
                        sql += ' ORDER BY COALESCE(mi.discounted_price, mi.price) ASC';
                        break;
                    case 'price_high':
                        sql += ' ORDER BY COALESCE(mi.discounted_price, mi.price) DESC';
                        break;
                    case 'name':
                        sql += ' ORDER BY mi.name ASC';
                        break;
                    case 'popular':
                        // You might want to implement popularity logic
                        sql += ' ORDER BY mi.is_featured DESC, mi.name ASC';
                        break;
                    default:
                        sql += ' ORDER BY c.sort_order, mi.sort_order, mi.name';
                }
            } else {
                sql += ' ORDER BY c.sort_order, mi.sort_order, mi.name';
            }
            
            const [menuItems] = await db.query(sql, params);
            return menuItems;
        } catch (error) {
            console.error('Restaurant.getMenu Error:', error);
            throw error;
        }
    }

    /**
     * Get restaurant categories
     * @param {number} restaurantId - Restaurant ID
     * @returns {Promise<Array>} - Array of categories
     */
    static async getCategories(restaurantId) {
        try {
            const [categories] = await db.query(
                `SELECT 
                    c.*,
                    COUNT(mi.id) as item_count
                FROM categories c
                LEFT JOIN menu_items mi ON c.id = mi.category_id AND mi.is_available = TRUE
                WHERE (c.restaurant_id = ? OR c.restaurant_id IS NULL) AND c.is_active = TRUE
                GROUP BY c.id
                ORDER BY c.sort_order, c.name`,
                [restaurantId]
            );
            
            return categories;
        } catch (error) {
            console.error('Restaurant.getCategories Error:', error);
            throw error;
        }
    }

    /**
     * Get restaurant reviews
     * @param {number} restaurantId - Restaurant ID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} - Reviews with pagination
     */
    static async getReviews(restaurantId, options = {}) {
        try {
            const page = options.page || 1;
            const limit = options.limit || 10;
            const offset = (page - 1) * limit;
            
            // Get reviews
            const [reviews] = await db.query(
                `SELECT 
                    rev.*,
                    u.name as user_name,
                    u.profile_picture,
                    o.order_number
                FROM reviews rev
                INNER JOIN users u ON rev.user_id = u.id
                LEFT JOIN orders o ON rev.order_id = o.id
                WHERE rev.restaurant_id = ? AND rev.status = 'approved'
                ORDER BY rev.created_at DESC
                LIMIT ? OFFSET ?`,
                [restaurantId, limit, offset]
            );
            
            // Get total count
            const [countResult] = await db.query(
                `SELECT COUNT(*) as total 
                 FROM reviews 
                 WHERE restaurant_id = ? AND status = 'approved'`,
                [restaurantId]
            );
            
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);
            
            // Get rating summary
            const [summary] = await db.query(
                `SELECT 
                    AVG(rating) as avg_rating,
                    AVG(food_rating) as avg_food_rating,
                    AVG(delivery_rating) as avg_delivery_rating,
                    AVG(service_rating) as avg_service_rating,
                    COUNT(*) as total_reviews,
                    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
                FROM reviews 
                WHERE restaurant_id = ? AND status = 'approved'`,
                [restaurantId]
            );
            
            return {
                reviews,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                summary: summary[0] || {
                    avg_rating: 0,
                    total_reviews: 0
                }
            };
        } catch (error) {
            console.error('Restaurant.getReviews Error:', error);
            throw error;
        }
    }

    /**
     * Create new restaurant
     * @param {Object} restaurantData - Restaurant data
     * @returns {Promise<number>} - New restaurant ID
     */
    static async create(restaurantData) {
        try {
            const [result] = await db.query(
                `INSERT INTO restaurants SET ?`,
                [restaurantData]
            );
            
            return result.insertId;
        } catch (error) {
            console.error('Restaurant.create Error:', error);
            throw error;
        }
    }

    /**
     * Update restaurant
     * @param {number} id - Restaurant ID
     * @param {Object} updateData - Update data
     * @returns {Promise<boolean>} - Success status
     */
    static async update(id, updateData) {
        try {
            updateData.updated_at = new Date();
            
            const [result] = await db.query(
                `UPDATE restaurants SET ? WHERE id = ?`,
                [updateData, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Restaurant.update Error:', error);
            throw error;
        }
    }

    /**
     * Update restaurant status
     * @param {number} id - Restaurant ID
     * @param {string} status - New status
     * @returns {Promise<boolean>} - Success status
     */
    static async updateStatus(id, status) {
        try {
            const [result] = await db.query(
                `UPDATE restaurants SET status = ?, updated_at = NOW() WHERE id = ?`,
                [status, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Restaurant.updateStatus Error:', error);
            throw error;
        }
    }

    /**
     * Update restaurant opening status
     * @param {number} id - Restaurant ID
     * @param {boolean} isOpen - Open status
     * @returns {Promise<boolean>} - Success status
     */
    static async updateOpenStatus(id, isOpen) {
        try {
            const [result] = await db.query(
                `UPDATE restaurants SET is_open = ?, updated_at = NOW() WHERE id = ?`,
                [isOpen ? 1 : 0, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Restaurant.updateOpenStatus Error:', error);
            throw error;
        }
    }

    /**
     * Delete restaurant (soft delete)
     * @param {number} id - Restaurant ID
     * @returns {Promise<boolean>} - Success status
     */
    static async delete(id) {
        try {
            // Soft delete by updating status
            const [result] = await db.query(
                `UPDATE restaurants SET status = 'inactive', is_open = FALSE, updated_at = NOW() WHERE id = ?`,
                [id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Restaurant.delete Error:', error);
            throw error;
        }
    }

    /**
     * Search restaurants
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array>} - Array of restaurants
     */
    static async search(query, options = {}) {
        try {
            let sql = `
                SELECT 
                    r.*,
                    COUNT(DISTINCT mi.id) as menu_item_count,
                    AVG(rev.rating) as avg_rating
                FROM restaurants r
                LEFT JOIN menu_items mi ON r.id = mi.restaurant_id AND mi.is_available = TRUE
                LEFT JOIN reviews rev ON r.id = rev.restaurant_id AND rev.status = 'approved'
                WHERE r.status = 'active' AND r.is_open = TRUE
                AND (
                    r.name LIKE ? 
                    OR r.description LIKE ? 
                    OR r.address LIKE ?
                    OR EXISTS (
                        SELECT 1 FROM menu_items mi2 
                        WHERE mi2.restaurant_id = r.id 
                        AND mi2.is_available = TRUE 
                        AND (mi2.name LIKE ? OR mi2.description LIKE ?)
                    )
                )
            `;
            
            const searchTerm = `%${query}%`;
            const params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
            
            // Apply filters
            if (options.category_id) {
                sql += ' AND EXISTS (SELECT 1 FROM menu_items mi3 WHERE mi3.restaurant_id = r.id AND mi3.category_id = ?)';
                params.push(options.category_id);
            }
            
            sql += ' GROUP BY r.id ORDER BY r.name';
            
            if (options.limit) {
                sql += ' LIMIT ?';
                params.push(options.limit);
            }
            
            const [restaurants] = await db.query(sql, params);
            return restaurants;
        } catch (error) {
            console.error('Restaurant.search Error:', error);
            throw error;
        }
    }

    /**
     * Get nearby restaurants by location
     * @param {number} latitude - User latitude
     * @param {number} longitude - User longitude
     * @param {number} radius - Radius in kilometers
     * @returns {Promise<Array>} - Array of nearby restaurants
     */
    static async getNearby(latitude, longitude, radius = 10) {
        try {
            // Haversine formula for distance calculation
            const sql = `
                SELECT 
                    r.*,
                    (6371 * acos(
                        cos(radians(?)) * 
                        cos(radians(latitude)) * 
                        cos(radians(longitude) - radians(?)) + 
                        sin(radians(?)) * 
                        sin(radians(latitude))
                    )) as distance_km
                FROM restaurants r
                WHERE r.status = 'active' 
                    AND r.is_open = TRUE 
                    AND r.latitude IS NOT NULL 
                    AND r.longitude IS NOT NULL
                HAVING distance_km <= ?
                ORDER BY distance_km ASC
                LIMIT 20
            `;
            
            const [restaurants] = await db.query(sql, [latitude, longitude, latitude, radius]);
            return restaurants;
        } catch (error) {
            console.error('Restaurant.getNearby Error:', error);
            throw error;
        }
    }

    /**
     * Get restaurant statistics
     * @param {number} restaurantId - Restaurant ID
     * @returns {Promise<Object>} - Statistics object
     */
    static async getStatistics(restaurantId) {
        try {
            const [stats] = await db.query(
                `SELECT 
                    (SELECT COUNT(*) FROM orders WHERE restaurant_id = ?) as total_orders,
                    (SELECT COUNT(*) FROM orders WHERE restaurant_id = ? AND status = 'delivered') as completed_orders,
                    (SELECT AVG(total_amount) FROM orders WHERE restaurant_id = ? AND status = 'delivered') as avg_order_value,
                    (SELECT SUM(total_amount) FROM orders WHERE restaurant_id = ? AND status = 'delivered') as total_revenue,
                    (SELECT COUNT(DISTINCT user_id) FROM orders WHERE restaurant_id = ?) as unique_customers,
                    (SELECT COUNT(*) FROM reviews WHERE restaurant_id = ? AND status = 'approved') as total_reviews,
                    (SELECT AVG(rating) FROM reviews WHERE restaurant_id = ? AND status = 'approved') as avg_rating
                FROM DUAL`,
                [restaurantId, restaurantId, restaurantId, restaurantId, restaurantId, restaurantId, restaurantId]
            );
            
            return stats[0] || {};
        } catch (error) {
            console.error('Restaurant.getStatistics Error:', error);
            throw error;
        }
    }
}

module.exports = Restaurant;
