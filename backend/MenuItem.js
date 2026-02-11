// ============================================
// 🍔 FOOD EXPRESS - MENU ITEM MODEL
// ============================================
// ✅ Imeunganisha: database.js, Category.js, Restaurant.js, Order.js, Cart.js
// ✅ Inahitaji: ../config/database
// ============================================

const db = require('../config/database');

/**
 * MenuItem Model
 * Handles all menu item-related database operations
 * 
 * DATABASE TABLE STRUCTURE:
 * 
 * CREATE TABLE menu_items (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   restaurant_id INT NOT NULL,
 *   category_id INT,
 *   name VARCHAR(100) NOT NULL,
 *   name_sw VARCHAR(100), -- Swahili name
 *   description TEXT,
 *   description_sw TEXT, -- Swahili description
 *   price DECIMAL(10,2) NOT NULL,
 *   discounted_price DECIMAL(10,2),
 *   discount_percent INT DEFAULT 0,
 *   image_url VARCHAR(255),
 *   ingredients TEXT, -- JSON string of ingredients
 *   nutritional_info TEXT, -- JSON string of nutritional info
 *   preparation_time INT, -- in minutes
 *   calories INT,
 *   is_vegetarian BOOLEAN DEFAULT FALSE,
 *   is_vegan BOOLEAN DEFAULT FALSE,
 *   is_gluten_free BOOLEAN DEFAULT FALSE,
 *   is_spicy BOOLEAN DEFAULT FALSE,
 *   is_available BOOLEAN DEFAULT TRUE,
 *   is_featured BOOLEAN DEFAULT FALSE,
 *   is_popular BOOLEAN DEFAULT FALSE,
 *   sort_order INT DEFAULT 0,
 *   max_quantity_per_order INT DEFAULT 10,
 *   min_quantity_per_order INT DEFAULT 1,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *   created_by INT,
 *   updated_by INT,
 *   INDEX idx_restaurant (restaurant_id),
 *   INDEX idx_category (category_id),
 *   INDEX idx_available (is_available),
 *   INDEX idx_featured (is_featured),
 *   INDEX idx_popular (is_popular),
 *   INDEX idx_price (price),
 *   FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
 *   FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
 * );
 */

class MenuItem {
    
    // ============================================
    // 🔥 BASIC CRUD OPERATIONS
    // ============================================

    /**
     * Get all menu items with filters
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Array of menu items
     */
    static async getAll(filters = {}) {
        try {
            let sql = `
                SELECT 
                    mi.*,
                    r.name as restaurant_name,
                    r.logo_url as restaurant_logo,
                    r.delivery_fee,
                    r.estimated_delivery_time,
                    c.name as category_name,
                    c.icon as category_icon,
                    (SELECT COUNT(*) FROM order_items oi WHERE oi.menu_item_id = mi.id) as times_ordered,
                    (SELECT AVG(rating) FROM reviews WHERE menu_item_id = mi.id) as avg_rating,
                    (SELECT COUNT(*) FROM reviews WHERE menu_item_id = mi.id) as review_count
                FROM menu_items mi
                INNER JOIN restaurants r ON mi.restaurant_id = r.id
                LEFT JOIN categories c ON mi.category_id = c.id
                WHERE mi.is_available = TRUE AND r.status = 'active' AND r.is_open = TRUE
            `;
            
            const params = [];

            // Apply filters
            if (filters.restaurant_id) {
                sql += ' AND mi.restaurant_id = ?';
                params.push(filters.restaurant_id);
            }

            if (filters.category_id) {
                sql += ' AND mi.category_id = ?';
                params.push(filters.category_id);
            }

            if (filters.is_vegetarian !== undefined) {
                sql += ' AND mi.is_vegetarian = ?';
                params.push(filters.is_vegetarian ? 1 : 0);
            }

            if (filters.is_vegan !== undefined) {
                sql += ' AND mi.is_vegan = ?';
                params.push(filters.is_vegan ? 1 : 0);
            }

            if (filters.is_gluten_free !== undefined) {
                sql += ' AND mi.is_gluten_free = ?';
                params.push(filters.is_gluten_free ? 1 : 0);
            }

            if (filters.is_spicy !== undefined) {
                sql += ' AND mi.is_spicy = ?';
                params.push(filters.is_spicy ? 1 : 0);
            }

            if (filters.is_featured !== undefined) {
                sql += ' AND mi.is_featured = ?';
                params.push(filters.is_featured ? 1 : 0);
            }

            if (filters.is_popular !== undefined) {
                sql += ' AND mi.is_popular = ?';
                params.push(filters.is_popular ? 1 : 0);
            }

            if (filters.min_price !== undefined) {
                sql += ' AND COALESCE(mi.discounted_price, mi.price) >= ?';
                params.push(filters.min_price);
            }

            if (filters.max_price !== undefined) {
                sql += ' AND COALESCE(mi.discounted_price, mi.price) <= ?';
                params.push(filters.max_price);
            }

            if (filters.search) {
                sql += ' AND (mi.name LIKE ? OR mi.description LIKE ? OR mi.ingredients LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (filters.has_discount !== undefined) {
                if (filters.has_discount) {
                    sql += ' AND mi.discounted_price IS NOT NULL AND mi.discounted_price < mi.price';
                } else {
                    sql += ' AND (mi.discounted_price IS NULL OR mi.discounted_price >= mi.price)';
                }
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
                        sql += ' ORDER BY times_ordered DESC, mi.is_popular DESC, mi.is_featured DESC';
                        break;
                    case 'rating':
                        sql += ' ORDER BY avg_rating DESC, review_count DESC';
                        break;
                    case 'newest':
                        sql += ' ORDER BY mi.created_at DESC';
                        break;
                    default:
                        sql += ' ORDER BY mi.sort_order ASC, mi.name ASC';
                }
            } else {
                sql += ' ORDER BY mi.sort_order ASC, mi.name ASC';
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

            const [items] = await db.query(sql, params);
            
            // Parse JSON fields
            items.forEach(item => {
                if (item.ingredients) {
                    try {
                        item.ingredients = JSON.parse(item.ingredients);
                    } catch (e) {
                        item.ingredients = item.ingredients;
                    }
                }
                if (item.nutritional_info) {
                    try {
                        item.nutritional_info = JSON.parse(item.nutritional_info);
                    } catch (e) {
                        item.nutritional_info = item.nutritional_info;
                    }
                }
            });
            
            return items;
        } catch (error) {
            console.error('❌ MenuItem.getAll Error:', error);
            throw error;
        }
    }

    /**
     * Get menu item by ID
     * @param {number} id - Menu item ID
     * @param {Object} options - Options
     * @returns {Promise<Object|null>} - Menu item object or null
     */
    static async getById(id, options = {}) {
        try {
            const [items] = await db.query(
                `SELECT 
                    mi.*,
                    r.name as restaurant_name,
                    r.logo_url as restaurant_logo,
                    r.delivery_fee,
                    r.estimated_delivery_time,
                    r.address as restaurant_address,
                    c.name as category_name,
                    c.icon as category_icon,
                    (SELECT COUNT(*) FROM order_items oi WHERE oi.menu_item_id = mi.id) as times_ordered,
                    (SELECT AVG(rating) FROM reviews WHERE menu_item_id = mi.id) as avg_rating,
                    (SELECT COUNT(*) FROM reviews WHERE menu_item_id = mi.id) as review_count
                FROM menu_items mi
                INNER JOIN restaurants r ON mi.restaurant_id = r.id
                LEFT JOIN categories c ON mi.category_id = c.id
                WHERE mi.id = ?`,
                [id]
            );
            
            const item = items[0] || null;
            
            if (item) {
                // Parse JSON fields
                if (item.ingredients) {
                    try {
                        item.ingredients = JSON.parse(item.ingredients);
                    } catch (e) {
                        item.ingredients = item.ingredients;
                    }
                }
                if (item.nutritional_info) {
                    try {
                        item.nutritional_info = JSON.parse(item.nutritional_info);
                    } catch (e) {
                        item.nutritional_info = item.nutritional_info;
                    }
                }
                
                // Get reviews if requested
                if (options.with_reviews) {
                    const [reviews] = await db.query(
                        `SELECT 
                            r.*,
                            u.name as user_name,
                            u.profile_image
                        FROM reviews r
                        INNER JOIN users u ON r.user_id = u.id
                        WHERE r.menu_item_id = ? AND r.status = 'approved'
                        ORDER BY r.created_at DESC
                        LIMIT 10`,
                        [id]
                    );
                    item.reviews = reviews;
                }
                
                // Get similar items if requested
                if (options.with_similar) {
                    const [similar] = await db.query(
                        `SELECT 
                            id, name, price, discounted_price, image_url
                        FROM menu_items
                        WHERE restaurant_id = ? AND category_id = ? AND id != ? AND is_available = TRUE
                        LIMIT 4`,
                        [item.restaurant_id, item.category_id, id]
                    );
                    item.similar_items = similar;
                }
            }
            
            return item;
        } catch (error) {
            console.error('❌ MenuItem.getById Error:', error);
            throw error;
        }
    }

    /**
     * Create new menu item
     * @param {Object} menuData - Menu item data
     * @returns {Promise<number>} - New menu item ID
     */
    static async create(menuData) {
        try {
            // Validate required fields
            if (!menuData.restaurant_id) {
                throw new Error('Restaurant ID is required');
            }
            if (!menuData.name) {
                throw new Error('Menu item name is required');
            }
            if (!menuData.price || menuData.price <= 0) {
                throw new Error('Valid price is required');
            }

            // Set default values
            if (!menuData.sort_order) {
                const [maxOrder] = await db.query(
                    'SELECT MAX(sort_order) as max_order FROM menu_items WHERE restaurant_id = ?',
                    [menuData.restaurant_id]
                );
                menuData.sort_order = (maxOrder[0].max_order || 0) + 1;
            }

            // Convert arrays to JSON strings
            if (menuData.ingredients && Array.isArray(menuData.ingredients)) {
                menuData.ingredients = JSON.stringify(menuData.ingredients);
            }
            if (menuData.nutritional_info && typeof menuData.nutritional_info === 'object') {
                menuData.nutritional_info = JSON.stringify(menuData.nutritional_info);
            }

            // Calculate discount percent if discounted_price is provided
            if (menuData.discounted_price && menuData.discounted_price < menuData.price) {
                menuData.discount_percent = Math.round(
                    ((menuData.price - menuData.discounted_price) / menuData.price) * 100
                );
            }

            const [result] = await db.query(
                'INSERT INTO menu_items SET ?',
                [menuData]
            );

            console.log(`✅ Menu item created successfully with ID: ${result.insertId}`);
            return result.insertId;
        } catch (error) {
            console.error('❌ MenuItem.create Error:', error);
            throw error;
        }
    }

    /**
     * Update menu item
     * @param {number} id - Menu item ID
     * @param {Object} updateData - Update data
     * @returns {Promise<boolean>} - Success status
     */
    static async update(id, updateData) {
        try {
            // Remove fields that shouldn't be updated directly
            delete updateData.id;
            delete updateData.created_at;
            delete updateData.times_ordered;
            delete updateData.avg_rating;
            delete updateData.review_count;

            // Convert arrays to JSON strings
            if (updateData.ingredients && Array.isArray(updateData.ingredients)) {
                updateData.ingredients = JSON.stringify(updateData.ingredients);
            }
            if (updateData.nutritional_info && typeof updateData.nutritional_info === 'object') {
                updateData.nutritional_info = JSON.stringify(updateData.nutritional_info);
            }

            // Recalculate discount percent
            if (updateData.discounted_price !== undefined && updateData.price) {
                updateData.discount_percent = Math.round(
                    ((updateData.price - updateData.discounted_price) / updateData.price) * 100
                );
            } else if (updateData.price && updateData.discounted_price === undefined) {
                // Get current discounted price
                const [current] = await db.query(
                    'SELECT discounted_price FROM menu_items WHERE id = ?',
                    [id]
                );
                if (current[0] && current[0].discounted_price) {
                    updateData.discount_percent = Math.round(
                        ((updateData.price - current[0].discounted_price) / updateData.price) * 100
                    );
                }
            }

            updateData.updated_at = new Date();

            const [result] = await db.query(
                'UPDATE menu_items SET ? WHERE id = ?',
                [updateData, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ MenuItem.update Error:', error);
            throw error;
        }
    }

    /**
     * Update menu item availability
     * @param {number} id - Menu item ID
     * @param {boolean} isAvailable - Available status
     * @returns {Promise<boolean>} - Success status
     */
    static async updateAvailability(id, isAvailable) {
        try {
            const [result] = await db.query(
                'UPDATE menu_items SET is_available = ?, updated_at = NOW() WHERE id = ?',
                [isAvailable ? 1 : 0, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ MenuItem.updateAvailability Error:', error);
            throw error;
        }
    }

    /**
     * Toggle featured status
     * @param {number} id - Menu item ID
     * @param {boolean} isFeatured - Featured status
     * @returns {Promise<boolean>} - Success status
     */
    static async toggleFeatured(id, isFeatured) {
        try {
            const [result] = await db.query(
                'UPDATE menu_items SET is_featured = ?, updated_at = NOW() WHERE id = ?',
                [isFeatured ? 1 : 0, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ MenuItem.toggleFeatured Error:', error);
            throw error;
        }
    }

    /**
     * Toggle popular status
     * @param {number} id - Menu item ID
     * @param {boolean} isPopular - Popular status
     * @returns {Promise<boolean>} - Success status
     */
    static async togglePopular(id, isPopular) {
        try {
            const [result] = await db.query(
                'UPDATE menu_items SET is_popular = ?, updated_at = NOW() WHERE id = ?',
                [isPopular ? 1 : 0, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ MenuItem.togglePopular Error:', error);
            throw error;
        }
    }

    /**
     * Update price
     * @param {number} id - Menu item ID
     * @param {number} price - New price
     * @param {number} discountedPrice - New discounted price (optional)
     * @returns {Promise<boolean>} - Success status
     */
    static async updatePrice(id, price, discountedPrice = null) {
        try {
            let discountPercent = 0;
            if (discountedPrice && discountedPrice < price) {
                discountPercent = Math.round(((price - discountedPrice) / price) * 100);
            }

            const [result] = await db.query(
                'UPDATE menu_items SET price = ?, discounted_price = ?, discount_percent = ?, updated_at = NOW() WHERE id = ?',
                [price, discountedPrice, discountPercent, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ MenuItem.updatePrice Error:', error);
            throw error;
        }
    }

    /**
     * Delete menu item
     * @param {number} id - Menu item ID
     * @returns {Promise<boolean>} - Success status
     */
    static async delete(id) {
        try {
            // Check if item is in any orders
            const [orders] = await db.query(
                'SELECT COUNT(*) as count FROM order_items WHERE menu_item_id = ?',
                [id]
            );

            if (orders[0].count > 0) {
                // Soft delete - just mark as unavailable
                const [result] = await db.query(
                    'UPDATE menu_items SET is_available = FALSE, updated_at = NOW() WHERE id = ?',
                    [id]
                );
                return result.affectedRows > 0;
            } else {
                // Hard delete - no orders
                const [result] = await db.query(
                    'DELETE FROM menu_items WHERE id = ?',
                    [id]
                );
                return result.affectedRows > 0;
            }
        } catch (error) {
            console.error('❌ MenuItem.delete Error:', error);
            throw error;
        }
    }

    // ============================================
    // 🔥 ADVANCED QUERIES
    // ============================================

    /**
     * Get popular menu items
     * @param {number} limit - Number of items to return
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Array of popular items
     */
    static async getPopular(limit = 10, filters = {}) {
        try {
            let sql = `
                SELECT 
                    mi.*,
                    r.name as restaurant_name,
                    COUNT(oi.id) as order_count,
                    SUM(oi.quantity) as total_sold,
                    AVG(rev.rating) as avg_rating
                FROM menu_items mi
                INNER JOIN restaurants r ON mi.restaurant_id = r.id
                LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
                LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('delivered', 'completed')
                LEFT JOIN reviews rev ON mi.id = rev.menu_item_id
                WHERE mi.is_available = TRUE AND r.is_open = TRUE
            `;

            const params = [];

            if (filters.restaurant_id) {
                sql += ' AND mi.restaurant_id = ?';
                params.push(filters.restaurant_id);
            }

            if (filters.category_id) {
                sql += ' AND mi.category_id = ?';
                params.push(filters.category_id);
            }

            sql += ' GROUP BY mi.id ORDER BY total_sold DESC, order_count DESC, avg_rating DESC LIMIT ?';
            params.push(limit);

            const [items] = await db.query(sql, params);
            return items;
        } catch (error) {
            console.error('❌ MenuItem.getPopular Error:', error);
            throw error;
        }
    }

    /**
     * Get featured menu items
     * @param {number} limit - Number of items to return
     * @returns {Promise<Array>} - Array of featured items
     */
    static async getFeatured(limit = 10) {
        try {
            const [items] = await db.query(
                `SELECT 
                    mi.*,
                    r.name as restaurant_name,
                    r.logo_url as restaurant_logo
                FROM menu_items mi
                INNER JOIN restaurants r ON mi.restaurant_id = r.id
                WHERE mi.is_featured = TRUE 
                    AND mi.is_available = TRUE 
                    AND r.is_open = TRUE
                    AND r.status = 'active'
                ORDER BY mi.sort_order
                LIMIT ?`,
                [limit]
            );
            return items;
        } catch (error) {
            console.error('❌ MenuItem.getFeatured Error:', error);
            throw error;
        }
    }

    /**
     * Get menu items by restaurant
     * @param {number} restaurantId - Restaurant ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Array of menu items
     */
    static async getByRestaurant(restaurantId, filters = {}) {
        return await this.getAll({ ...filters, restaurant_id: restaurantId });
    }

    /**
     * Get menu items by category
     * @param {number} categoryId - Category ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Array of menu items
     */
    static async getByCategory(categoryId, filters = {}) {
        return await this.getAll({ ...filters, category_id: categoryId });
    }

    /**
     * Search menu items
     * @param {string} query - Search query
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Search results
     */
    static async search(query, filters = {}) {
        try {
            let sql = `
                SELECT 
                    mi.*,
                    r.name as restaurant_name,
                    r.logo_url as restaurant_logo,
                    c.name as category_name
                FROM menu_items mi
                INNER JOIN restaurants r ON mi.restaurant_id = r.id
                LEFT JOIN categories c ON mi.category_id = c.id
                WHERE mi.is_available = TRUE 
                    AND r.is_open = TRUE
                    AND r.status = 'active'
                    AND (
                        mi.name LIKE ? 
                        OR mi.description LIKE ? 
                        OR mi.ingredients LIKE ?
                        OR c.name LIKE ?
                    )
            `;

            const searchTerm = `%${query}%`;
            const params = [searchTerm, searchTerm, searchTerm, searchTerm];

            if (filters.restaurant_id) {
                sql += ' AND mi.restaurant_id = ?';
                params.push(filters.restaurant_id);
            }

            if (filters.category_id) {
                sql += ' AND mi.category_id = ?';
                params.push(filters.category_id);
            }

            if (filters.min_price) {
                sql += ' AND COALESCE(mi.discounted_price, mi.price) >= ?';
                params.push(filters.min_price);
            }

            if (filters.max_price) {
                sql += ' AND COALESCE(mi.discounted_price, mi.price) <= ?';
                params.push(filters.max_price);
            }

            sql += ' ORDER BY mi.name ASC LIMIT 50';

            const [items] = await db.query(sql, params);
            return items;
        } catch (error) {
            console.error('❌ MenuItem.search Error:', error);
            throw error;
        }
    }

    /**
     * Get discounted menu items
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Array of discounted items
     */
    static async getDiscounted(filters = {}) {
        try {
            let sql = `
                SELECT 
                    mi.*,
                    r.name as restaurant_name,
                    r.logo_url as restaurant_logo,
                    ((mi.price - mi.discounted_price) / mi.price * 100) as discount_percent_calculated
                FROM menu_items mi
                INNER JOIN restaurants r ON mi.restaurant_id = r.id
                WHERE mi.discounted_price IS NOT NULL 
                    AND mi.discounted_price < mi.price
                    AND mi.is_available = TRUE
                    AND r.is_open = TRUE
            `;

            const params = [];

            if (filters.restaurant_id) {
                sql += ' AND mi.restaurant_id = ?';
                params.push(filters.restaurant_id);
            }

            if (filters.category_id) {
                sql += ' AND mi.category_id = ?';
                params.push(filters.category_id);
            }

            sql += ' ORDER BY discount_percent_calculated DESC';

            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(filters.limit);
            }

            const [items] = await db.query(sql, params);
            return items;
        } catch (error) {
            console.error('❌ MenuItem.getDiscounted Error:', error);
            throw error;
        }
    }

    /**
     * Get menu item statistics
     * @param {number} menuItemId - Menu item ID
     * @returns {Promise<Object>} - Statistics object
     */
    static async getStatistics(menuItemId) {
        try {
            const [stats] = await db.query(
                `SELECT 
                    (SELECT COUNT(*) FROM order_items WHERE menu_item_id = ?) as total_orders,
                    (SELECT SUM(quantity) FROM order_items WHERE menu_item_id = ?) as total_sold,
                    (SELECT AVG(rating) FROM reviews WHERE menu_item_id = ? AND status = 'approved') as avg_rating,
                    (SELECT COUNT(*) FROM reviews WHERE menu_item_id = ? AND status = 'approved') as total_reviews,
                    (SELECT SUM(rating) / COUNT(*) FROM reviews WHERE menu_item_id = ? AND status = 'approved') as weighted_rating,
                    (SELECT COUNT(DISTINCT user_id) FROM reviews WHERE menu_item_id = ?) as unique_reviewers,
                    (SELECT created_at FROM orders o 
                     JOIN order_items oi ON o.id = oi.order_id 
                     WHERE oi.menu_item_id = ? 
                     ORDER BY o.created_at DESC LIMIT 1) as last_ordered_date
                FROM DUAL`,
                [menuItemId, menuItemId, menuItemId, menuItemId, menuItemId, menuItemId, menuItemId]
            );
            
            return stats[0] || {
                total_orders: 0,
                total_sold: 0,
                avg_rating: 0,
                total_reviews: 0,
                weighted_rating: 0,
                unique_reviewers: 0,
                last_ordered_date: null
            };
        } catch (error) {
            console.error('❌ MenuItem.getStatistics Error:', error);
            throw error;
        }
    }

    // ============================================
    // 🔥 BULK OPERATIONS
    // ============================================

    /**
     * Bulk update menu items
     * @param {Array} items - Array of items with id and update data
     * @returns {Promise<Array>} - Results
     */
    static async bulkUpdate(items) {
        try {
            const results = [];
            for (const item of items) {
                const { id, ...updateData } = item;
                const success = await this.update(id, updateData);
                results.push({ id, success });
            }
            return results;
        } catch (error) {
            console.error('❌ MenuItem.bulkUpdate Error:', error);
            throw error;
        }
    }

    /**
     * Bulk delete menu items
     * @param {Array} ids - Array of menu item IDs
     * @returns {Promise<number>} - Number of deleted items
     */
    static async bulkDelete(ids) {
        try {
            // Check which items have orders
            const [orders] = await db.query(
                'SELECT DISTINCT menu_item_id FROM order_items WHERE menu_item_id IN (?)',
                [ids]
            );
            
            const orderItemIds = orders.map(o => o.menu_item_id);
            
            // Hard delete items without orders
            const hardDeleteIds = ids.filter(id => !orderItemIds.includes(id));
            
            // Soft delete items with orders
            const softDeleteIds = ids.filter(id => orderItemIds.includes(id));
            
            let affectedRows = 0;
            
            if (hardDeleteIds.length > 0) {
                const [result] = await db.query(
                    'DELETE FROM menu_items WHERE id IN (?)',
                    [hardDeleteIds]
                );
                affectedRows += result.affectedRows;
            }
            
            if (softDeleteIds.length > 0) {
                const [result] = await db.query(
                    'UPDATE menu_items SET is_available = FALSE, updated_at = NOW() WHERE id IN (?)',
                    [softDeleteIds]
                );
                affectedRows += result.affectedRows;
            }
            
            return affectedRows;
        } catch (error) {
            console.error('❌ MenuItem.bulkDelete Error:', error);
            throw error;
        }
    }

    /**
     * Bulk update sort order
     * @param {Array} sortOrders - Array of {id, sort_order}
     * @returns {Promise<Array>} - Results
     */
    static async bulkUpdateSortOrder(sortOrders) {
        try {
            const results = [];
            for (const item of sortOrders) {
                const [result] = await db.query(
                    'UPDATE menu_items SET sort_order = ?, updated_at = NOW() WHERE id = ?',
                    [item.sort_order, item.id]
                );
                results.push({ id: item.id, success: result.affectedRows > 0 });
            }
            return results;
        } catch (error) {
            console.error('❌ MenuItem.bulkUpdateSortOrder Error:', error);
            throw error;
        }
    }

    /**
     * Bulk update availability
     * @param {Array} ids - Array of menu item IDs
     * @param {boolean} isAvailable - Available status
     * @returns {Promise<number>} - Number of updated items
     */
    static async bulkUpdateAvailability(ids, isAvailable) {
        try {
            const [result] = await db.query(
                'UPDATE menu_items SET is_available = ?, updated_at = NOW() WHERE id IN (?)',
                [isAvailable ? 1 : 0, ids]
            );
            return result.affectedRows;
        } catch (error) {
            console.error('❌ MenuItem.bulkUpdateAvailability Error:', error);
            throw error;
        }
    }

    // ============================================
    // 🔥 VALIDATION & UTILITY
    // ============================================

    /**
     * Check if menu item exists
     * @param {number} id - Menu item ID
     * @returns {Promise<boolean>} - True if exists
     */
    static async exists(id) {
        try {
            const [result] = await db.query(
                'SELECT id FROM menu_items WHERE id = ?',
                [id]
            );
            return result.length > 0;
        } catch (error) {
            console.error('❌ MenuItem.exists Error:', error);
            throw error;
        }
    }

    /**
     * Check if menu item is available
     * @param {number} id - Menu item ID
     * @returns {Promise<boolean>} - True if available
     */
    static async isAvailable(id) {
        try {
            const [result] = await db.query(
                'SELECT is_available FROM menu_items WHERE id = ?',
                [id]
            );
            return result.length > 0 && result[0].is_available === 1;
        } catch (error) {
            console.error('❌ MenuItem.isAvailable Error:', error);
            throw error;
        }
    }

    /**
     * Get current price
     * @param {number} id - Menu item ID
     * @returns {Promise<number>} - Current price (with discount if available)
     */
    static async getCurrentPrice(id) {
        try {
            const [result] = await db.query(
                'SELECT COALESCE(discounted_price, price) as current_price FROM menu_items WHERE id = ?',
                [id]
            );
            return result.length > 0 ? parseFloat(result[0].current_price) : 0;
        } catch (error) {
            console.error('❌ MenuItem.getCurrentPrice Error:', error);
            throw error;
        }
    }

    /**
     * Get menu items count by restaurant
     * @param {number} restaurantId - Restaurant ID
     * @returns {Promise<number>} - Count of menu items
     */
    static async countByRestaurant(restaurantId) {
        try {
            const [result] = await db.query(
                'SELECT COUNT(*) as count FROM menu_items WHERE restaurant_id = ? AND is_available = TRUE',
                [restaurantId]
            );
            return result[0].count;
        } catch (error) {
            console.error('❌ MenuItem.countByRestaurant Error:', error);
            throw error;
        }
    }

    /**
     * Get menu items count by category
     * @param {number} categoryId - Category ID
     * @returns {Promise<number>} - Count of menu items
     */
    static async countByCategory(categoryId) {
        try {
            const [result] = await db.query(
                'SELECT COUNT(*) as count FROM menu_items WHERE category_id = ? AND is_available = TRUE',
                [categoryId]
            );
            return result[0].count;
        } catch (error) {
            console.error('❌ MenuItem.countByCategory Error:', error);
            throw error;
        }
    }

    /**
     * Clone menu item (copy to another restaurant or same restaurant)
     * @param {number} id - Source menu item ID
     * @param {number} targetRestaurantId - Target restaurant ID
     * @returns {Promise<number>} - New menu item ID
     */
    static async clone(id, targetRestaurantId) {
        try {
            // Get source menu item
            const [source] = await db.query(
                'SELECT * FROM menu_items WHERE id = ?',
                [id]
            );
            
            if (source.length === 0) {
                throw new Error('Source menu item not found');
            }
            
            const itemData = source[0];
            
            // Remove id and timestamps
            delete itemData.id;
            delete itemData.created_at;
            delete itemData.updated_at;
            
            // Set new restaurant
            itemData.restaurant_id = targetRestaurantId;
            itemData.is_featured = false;
            itemData.is_popular = false;
            
            // Add "Copy" to name
            itemData.name = `${itemData.name} (Copy)`;
            
            // Create new item
            const newId = await this.create(itemData);
            return newId;
        } catch (error) {
            console.error('❌ MenuItem.clone Error:', error);
            throw error;
        }
    }
}

module.exports = MenuItem;
