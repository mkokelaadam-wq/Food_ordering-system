// ============================================
// 🍔 FOOD EXPRESS - CATEGORY MODEL
// ============================================
// ✅ Imeunganisha: database connection, menu_items, restaurants, orders
// ✅ Inahitaji: ../config/database, ../models/MenuItem.js (optional)
// ============================================

/**
 * Category Model
 * Handles food category operations
 * 
 * DATABASE TABLE STRUCTURE:
 * 
 * CREATE TABLE categories (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   name VARCHAR(100) NOT NULL,
 *   name_sw VARCHAR(100), -- Swahili name
 *   description TEXT,
 *   description_sw TEXT, -- Swahili description
 *   image_url VARCHAR(255),
 *   icon VARCHAR(50), -- Font Awesome icon class
 *   restaurant_id INT, -- NULL for global categories
 *   parent_id INT DEFAULT NULL, -- For subcategories
 *   sort_order INT DEFAULT 0,
 *   is_active BOOLEAN DEFAULT TRUE,
 *   is_featured BOOLEAN DEFAULT FALSE,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *   created_by INT,
 *   updated_by INT,
 *   FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
 *   FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
 *   INDEX idx_restaurant (restaurant_id),
 *   INDEX idx_active (is_active),
 *   INDEX idx_sort (sort_order)
 * );
 */

const db = require('../config/database');
// const MenuItem = require('./MenuItem'); // Optional - uncomment if needed

class Category {
    
    // ============================================
    // 🔥 BASIC CRUD OPERATIONS
    // ============================================

    /**
     * Get all categories with optional filters
     * @param {Object} filters - Filter options
     * @param {number} filters.restaurant_id - Filter by restaurant
     * @param {boolean} filters.is_active - Filter by active status
     * @param {boolean} filters.is_featured - Filter by featured
     * @param {number} filters.parent_id - Filter by parent category
     * @param {string} filters.search - Search by name
     * @param {string} filters.language - 'en' or 'sw' for translations
     * @returns {Promise<Array>} - Array of categories
     */
    static async getAll(filters = {}) {
        try {
            let sql = `
                SELECT 
                    c.*,
                    COUNT(DISTINCT mi.id) as item_count,
                    COUNT(DISTINCT oi.id) as order_count,
                    r.name as restaurant_name,
                    parent.name as parent_category_name
                FROM categories c
                LEFT JOIN menu_items mi ON c.id = mi.category_id AND mi.is_available = TRUE
                LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
                LEFT JOIN restaurants r ON c.restaurant_id = r.id
                LEFT JOIN categories parent ON c.parent_id = parent.id
                WHERE 1=1
            `;
            
            const params = [];
            
            // Apply filters
            if (filters.restaurant_id !== undefined) {
                sql += ' AND (c.restaurant_id = ? OR c.restaurant_id IS NULL)';
                params.push(filters.restaurant_id);
            }
            
            if (filters.is_active !== undefined) {
                sql += ' AND c.is_active = ?';
                params.push(filters.is_active ? 1 : 0);
            }
            
            if (filters.is_featured !== undefined) {
                sql += ' AND c.is_featured = ?';
                params.push(filters.is_featured ? 1 : 0);
            }
            
            if (filters.parent_id !== undefined) {
                if (filters.parent_id === null) {
                    sql += ' AND c.parent_id IS NULL';
                } else {
                    sql += ' AND c.parent_id = ?';
                    params.push(filters.parent_id);
                }
            }
            
            if (filters.search) {
                sql += ' AND (c.name LIKE ? OR c.name_sw LIKE ? OR c.description LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
            
            sql += ' GROUP BY c.id ORDER BY c.sort_order ASC, c.name ASC';
            
            // Add pagination
            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(filters.limit);
            }
            
            if (filters.offset) {
                sql += ' OFFSET ?';
                params.push(filters.offset);
            }
            
            const [categories] = await db.query(sql, params);
            
            // Handle language translation
            if (filters.language === 'sw') {
                return categories.map(cat => ({
                    ...cat,
                    name: cat.name_sw || cat.name,
                    description: cat.description_sw || cat.description
                }));
            }
            
            return categories;
        } catch (error) {
            console.error('❌ Category.getAll Error:', error);
            throw new Error(`Failed to get categories: ${error.message}`);
        }
    }

    /**
     * Get category by ID
     * @param {number} id - Category ID
     * @param {Object} options - Options
     * @returns {Promise<Object|null>} - Category object or null
     */
    static async getById(id, options = {}) {
        try {
            const [categories] = await db.query(
                `SELECT 
                    c.*,
                    r.name as restaurant_name,
                    r.logo_url as restaurant_logo,
                    parent.name as parent_category_name,
                    creator.name as created_by_name,
                    updater.name as updated_by_name
                FROM categories c
                LEFT JOIN restaurants r ON c.restaurant_id = r.id
                LEFT JOIN categories parent ON c.parent_id = parent.id
                LEFT JOIN users creator ON c.created_by = creator.id
                LEFT JOIN users updater ON c.updated_by = updater.id
                WHERE c.id = ?`,
                [id]
            );
            
            const category = categories[0] || null;
            
            if (category && options.with_items) {
                // Get menu items in this category
                const [items] = await db.query(
                    `SELECT 
                        mi.*,
                        r.name as restaurant_name,
                        COUNT(oi.id) as times_ordered,
                        AVG(rt.rating) as avg_rating
                    FROM menu_items mi
                    LEFT JOIN restaurants r ON mi.restaurant_id = r.id
                    LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
                    LEFT JOIN reviews rt ON mi.id = rt.menu_item_id
                    WHERE mi.category_id = ? AND mi.is_available = TRUE
                    GROUP BY mi.id
                    ORDER BY mi.is_featured DESC, mi.name ASC`,
                    [id]
                );
                category.items = items;
                category.item_count = items.length;
            }
            
            return category;
        } catch (error) {
            console.error('❌ Category.getById Error:', error);
            throw new Error(`Failed to get category: ${error.message}`);
        }
    }

    /**
     * Get category with menu items
     * @param {number} categoryId - Category ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} - Category with items
     */
    static async getWithItems(categoryId, filters = {}) {
        try {
            // Get category details
            const [categories] = await db.query(
                `SELECT 
                    c.*,
                    r.name as restaurant_name
                FROM categories c
                LEFT JOIN restaurants r ON c.restaurant_id = r.id
                WHERE c.id = ?`,
                [categoryId]
            );
            
            if (categories.length === 0) {
                return null;
            }
            
            const category = categories[0];
            
            // Get menu items in this category
            let sql = `
                SELECT 
                    mi.*,
                    r.name as restaurant_name,
                    r.logo_url as restaurant_logo,
                    r.delivery_fee,
                    r.minimum_order,
                    r.estimated_delivery_time,
                    COALESCE(mi.discounted_price, mi.price) as current_price,
                    (SELECT AVG(rating) FROM reviews WHERE menu_item_id = mi.id) as avg_rating,
                    (SELECT COUNT(*) FROM reviews WHERE menu_item_id = mi.id) as review_count
                FROM menu_items mi
                INNER JOIN restaurants r ON mi.restaurant_id = r.id
                WHERE mi.category_id = ? 
                AND mi.is_available = TRUE 
                AND r.is_open = TRUE
                AND r.is_active = TRUE
            `;
            
            const params = [categoryId];
            
            // Apply filters
            if (filters.restaurant_id) {
                sql += ' AND mi.restaurant_id = ?';
                params.push(filters.restaurant_id);
            }
            
            if (filters.is_vegetarian !== undefined) {
                sql += ' AND mi.is_vegetarian = ?';
                params.push(filters.is_vegetarian ? 1 : 0);
            }
            
            if (filters.is_vegan !== undefined) {
                sql += ' AND mi.is_vegan = ?';
                params.push(filters.is_vegan ? 1 : 0);
            }
            
            if (filters.is_spicy !== undefined) {
                sql += ' AND mi.is_spicy = ?';
                params.push(filters.is_spicy ? 1 : 0);
            }
            
            if (filters.is_featured !== undefined) {
                sql += ' AND mi.is_featured = ?';
                params.push(filters.is_featured ? 1 : 0);
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
                sql += ' AND (mi.name LIKE ? OR mi.description LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm);
            }
            
            sql += ' ORDER BY mi.is_featured DESC, mi.sort_order ASC, mi.name ASC';
            
            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(filters.limit);
            }
            
            if (filters.offset) {
                sql += ' OFFSET ?';
                params.push(filters.offset);
            }
            
            const [items] = await db.query(sql, params);
            
            return {
                ...category,
                items,
                item_count: items.length,
                filters_applied: filters
            };
        } catch (error) {
            console.error('❌ Category.getWithItems Error:', error);
            throw new Error(`Failed to get category with items: ${error.message}`);
        }
    }

    /**
     * Create new category
     * @param {Object} categoryData - Category data
     * @returns {Promise<number>} - New category ID
     */
    static async create(categoryData) {
        try {
            // Validation
            if (!categoryData.name) {
                throw new Error('Category name is required');
            }
            
            // Set default values
            if (!categoryData.sort_order) {
                // Get max sort order for this restaurant
                const [maxOrder] = await db.query(
                    `SELECT MAX(sort_order) as max_order 
                     FROM categories 
                     WHERE (restaurant_id = ? OR (? IS NULL AND restaurant_id IS NULL))`,
                    [categoryData.restaurant_id || null, categoryData.restaurant_id || null]
                );
                
                categoryData.sort_order = (maxOrder[0].max_order || 0) + 1;
            }
            
            // Set timestamps
            categoryData.created_at = new Date();
            categoryData.updated_at = new Date();
            
            const [result] = await db.query(
                'INSERT INTO categories SET ?',
                [categoryData]
            );
            
            return result.insertId;
        } catch (error) {
            console.error('❌ Category.create Error:', error);
            throw new Error(`Failed to create category: ${error.message}`);
        }
    }

    /**
     * Update category
     * @param {number} id - Category ID
     * @param {Object} updateData - Update data
     * @returns {Promise<boolean>} - Success status
     */
    static async update(id, updateData) {
        try {
            // Remove fields that shouldn't be updated
            delete updateData.id;
            delete updateData.created_at;
            
            // Update timestamp
            updateData.updated_at = new Date();
            
            const [result] = await db.query(
                'UPDATE categories SET ? WHERE id = ?',
                [updateData, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Category.update Error:', error);
            throw new Error(`Failed to update category: ${error.message}`);
        }
    }

    /**
     * Update category sort order
     * @param {number} id - Category ID
     * @param {number} sortOrder - New sort order
     * @returns {Promise<boolean>} - Success status
     */
    static async updateSortOrder(id, sortOrder) {
        try {
            const [result] = await db.query(
                'UPDATE categories SET sort_order = ?, updated_at = NOW() WHERE id = ?',
                [sortOrder, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Category.updateSortOrder Error:', error);
            throw new Error(`Failed to update sort order: ${error.message}`);
        }
    }

    /**
     * Update category status
     * @param {number} id - Category ID
     * @param {boolean} isActive - Active status
     * @returns {Promise<boolean>} - Success status
     */
    static async updateStatus(id, isActive) {
        try {
            const [result] = await db.query(
                'UPDATE categories SET is_active = ?, updated_at = NOW() WHERE id = ?',
                [isActive ? 1 : 0, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Category.updateStatus Error:', error);
            throw new Error(`Failed to update category status: ${error.message}`);
        }
    }

    /**
     * Toggle featured status
     * @param {number} id - Category ID
     * @param {boolean} isFeatured - Featured status
     * @returns {Promise<boolean>} - Success status
     */
    static async toggleFeatured(id, isFeatured) {
        try {
            const [result] = await db.query(
                'UPDATE categories SET is_featured = ?, updated_at = NOW() WHERE id = ?',
                [isFeatured ? 1 : 0, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Category.toggleFeatured Error:', error);
            throw new Error(`Failed to toggle featured status: ${error.message}`);
        }
    }

    /**
     * Delete category
     * @param {number} id - Category ID
     * @param {Object} options - Delete options
     * @returns {Promise<boolean>} - Success status
     */
    static async delete(id, options = {}) {
        try {
            // Check if category has menu items
            const [items] = await db.query(
                'SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?',
                [id]
            );
            
            if (items[0].count > 0) {
                if (options.force) {
                    // Force delete - move items to uncategorized
                    await db.query(
                        'UPDATE menu_items SET category_id = NULL WHERE category_id = ?',
                        [id]
                    );
                } else {
                    throw new Error('Cannot delete category that has menu items. Please reassign items first.');
                }
            }
            
            const [result] = await db.query(
                'DELETE FROM categories WHERE id = ?',
                [id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Category.delete Error:', error);
            throw new Error(`Failed to delete category: ${error.message}`);
        }
    }

    // ============================================
    // 🔥 ADVANCED QUERIES
    // ============================================

    /**
     * Reassign menu items to another category
     * @param {number} fromCategoryId - Source category ID
     * @param {number} toCategoryId - Target category ID
     * @returns {Promise<number>} - Number of items reassigned
     */
    static async reassignItems(fromCategoryId, toCategoryId) {
        try {
            const [result] = await db.query(
                'UPDATE menu_items SET category_id = ?, updated_at = NOW() WHERE category_id = ?',
                [toCategoryId, fromCategoryId]
            );
            
            return result.affectedRows;
        } catch (error) {
            console.error('❌ Category.reassignItems Error:', error);
            throw new Error(`Failed to reassign items: ${error.message}`);
        }
    }

    /**
     * Get popular categories based on order count
     * @param {number} limit - Number of categories to return
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Array of popular categories
     */
    static async getPopular(limit = 10, filters = {}) {
        try {
            let sql = `
                SELECT 
                    c.*,
                    COUNT(DISTINCT mi.id) as item_count,
                    COUNT(DISTINCT o.id) as order_count,
                    SUM(oi.quantity) as items_sold,
                    SUM(oi.subtotal) as revenue
                FROM categories c
                LEFT JOIN menu_items mi ON c.id = mi.category_id AND mi.is_available = TRUE
                LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
                LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('delivered', 'completed')
                WHERE c.is_active = TRUE
            `;
            
            const params = [];
            
            if (filters.restaurant_id) {
                sql += ' AND c.restaurant_id = ?';
                params.push(filters.restaurant_id);
            }
            
            if (filters.start_date) {
                sql += ' AND o.created_at >= ?';
                params.push(filters.start_date);
            }
            
            if (filters.end_date) {
                sql += ' AND o.created_at <= ?';
                params.push(filters.end_date);
            }
            
            sql += ' GROUP BY c.id ORDER BY order_count DESC, items_sold DESC, revenue DESC LIMIT ?';
            params.push(limit);
            
            const [categories] = await db.query(sql, params);
            return categories;
        } catch (error) {
            console.error('❌ Category.getPopular Error:', error);
            throw new Error(`Failed to get popular categories: ${error.message}`);
        }
    }

    /**
     * Get category tree (hierarchy)
     * @param {number} restaurantId - Restaurant ID
     * @returns {Promise<Array>} - Category tree
     */
    static async getCategoryTree(restaurantId = null) {
        try {
            // Get all categories for this restaurant
            const [allCategories] = await db.query(
                `SELECT * FROM categories 
                 WHERE restaurant_id = ? OR (restaurant_id IS NULL AND ? IS NULL)
                 ORDER BY sort_order, name`,
                [restaurantId, restaurantId]
            );
            
            // Build tree structure
            const categoryMap = {};
            const roots = [];
            
            allCategories.forEach(cat => {
                categoryMap[cat.id] = { ...cat, children: [] };
            });
            
            allCategories.forEach(cat => {
                if (cat.parent_id && categoryMap[cat.parent_id]) {
                    categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
                } else {
                    roots.push(categoryMap[cat.id]);
                }
            });
            
            return roots;
        } catch (error) {
            console.error('❌ Category.getCategoryTree Error:', error);
            throw new Error(`Failed to get category tree: ${error.message}`);
        }
    }

    /**
     * Get category statistics
     * @param {number} categoryId - Category ID
     * @returns {Promise<Object>} - Statistics object
     */
    static async getStatistics(categoryId) {
        try {
            const [stats] = await db.query(
                `SELECT 
                    (SELECT COUNT(*) FROM menu_items WHERE category_id = ?) as total_items,
                    (SELECT COUNT(*) FROM menu_items WHERE category_id = ? AND is_available = TRUE) as active_items,
                    (SELECT COUNT(*) FROM menu_items WHERE category_id = ? AND is_available = FALSE) as inactive_items,
                    (SELECT AVG(price) FROM menu_items WHERE category_id = ?) as avg_price,
                    (SELECT MIN(price) FROM menu_items WHERE category_id = ? AND is_available = TRUE) as min_price,
                    (SELECT MAX(price) FROM menu_items WHERE category_id = ? AND is_available = TRUE) as max_price,
                    (SELECT COUNT(DISTINCT restaurant_id) FROM menu_items WHERE category_id = ?) as restaurant_count,
                    (SELECT COUNT(DISTINCT o.id) 
                     FROM orders o
                     JOIN order_items oi ON o.id = oi.order_id
                     JOIN menu_items mi ON oi.menu_item_id = mi.id
                     WHERE mi.category_id = ?) as total_orders,
                    (SELECT SUM(oi.quantity * oi.price) 
                     FROM order_items oi
                     JOIN menu_items mi ON oi.menu_item_id = mi.id
                     WHERE mi.category_id = ?) as total_revenue
                FROM DUAL`,
                [categoryId, categoryId, categoryId, categoryId, categoryId, categoryId, categoryId, categoryId, categoryId]
            );
            
            return stats[0] || {
                total_items: 0,
                active_items: 0,
                inactive_items: 0,
                avg_price: 0,
                min_price: 0,
                max_price: 0,
                restaurant_count: 0,
                total_orders: 0,
                total_revenue: 0
            };
        } catch (error) {
            console.error('❌ Category.getStatistics Error:', error);
            throw new Error(`Failed to get category statistics: ${error.message}`);
        }
    }

    // ============================================
    // 🔥 BULK OPERATIONS
    // ============================================

    /**
     * Bulk update categories
     * @param {Array} categories - Array of category objects with id and update data
     * @returns {Promise<Array>} - Results
     */
    static async bulkUpdate(categories) {
        try {
            const results = [];
            
            for (const cat of categories) {
                const { id, ...updateData } = cat;
                const success = await this.update(id, updateData);
                results.push({ id, success });
            }
            
            return results;
        } catch (error) {
            console.error('❌ Category.bulkUpdate Error:', error);
            throw new Error(`Failed to bulk update categories: ${error.message}`);
        }
    }

    /**
     * Bulk delete categories
     * @param {Array} ids - Array of category IDs
     * @returns {Promise<number>} - Number of deleted categories
     */
    static async bulkDelete(ids) {
        try {
            const [result] = await db.query(
                'DELETE FROM categories WHERE id IN (?)',
                [ids]
            );
            
            return result.affectedRows;
        } catch (error) {
            console.error('❌ Category.bulkDelete Error:', error);
            throw new Error(`Failed to bulk delete categories: ${error.message}`);
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
                const success = await this.updateSortOrder(item.id, item.sort_order);
                results.push({ id: item.id, success });
            }
            
            return results;
        } catch (error) {
            console.error('❌ Category.bulkUpdateSortOrder Error:', error);
            throw new Error(`Failed to bulk update sort orders: ${error.message}`);
        }
    }

    // ============================================
    // 🔥 SEARCH & FILTER
    // ============================================

    /**
     * Search categories
     * @param {string} query - Search query
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Search results
     */
    static async search(query, filters = {}) {
        try {
            let sql = `
                SELECT 
                    c.*,
                    COUNT(DISTINCT mi.id) as item_count,
                    r.name as restaurant_name
                FROM categories c
                LEFT JOIN menu_items mi ON c.id = mi.category_id AND mi.is_available = TRUE
                LEFT JOIN restaurants r ON c.restaurant_id = r.id
                WHERE (c.name LIKE ? OR c.name_sw LIKE ? OR c.description LIKE ?)
            `;
            
            const searchTerm = `%${query}%`;
            const params = [searchTerm, searchTerm, searchTerm];
            
            if (filters.restaurant_id) {
                sql += ' AND (c.restaurant_id = ? OR c.restaurant_id IS NULL)';
                params.push(filters.restaurant_id);
            }
            
            if (filters.is_active !== undefined) {
                sql += ' AND c.is_active = ?';
                params.push(filters.is_active ? 1 : 0);
            }
            
            sql += ' GROUP BY c.id ORDER BY c.sort_order, c.name LIMIT 50';
            
            const [categories] = await db.query(sql, params);
            return categories;
        } catch (error) {
            console.error('❌ Category.search Error:', error);
            throw new Error(`Failed to search categories: ${error.message}`);
        }
    }

    /**
     * Get categories by restaurant
     * @param {number} restaurantId - Restaurant ID
     * @param {Object} options - Options
     * @returns {Promise<Array>} - Categories
     */
    static async getByRestaurant(restaurantId, options = {}) {
        try {
            let sql = `
                SELECT 
                    c.*,
                    COUNT(DISTINCT mi.id) as item_count
                FROM categories c
                LEFT JOIN menu_items mi ON c.id = mi.category_id AND mi.is_available = TRUE
                WHERE c.restaurant_id = ? OR c.restaurant_id IS NULL
            `;
            
            const params = [restaurantId];
            
            if (options.only_active) {
                sql += ' AND c.is_active = TRUE';
            }
            
            sql += ' GROUP BY c.id ORDER BY c.sort_order, c.name';
            
            const [categories] = await db.query(sql, params);
            return categories;
        } catch (error) {
            console.error('❌ Category.getByRestaurant Error:', error);
            throw new Error(`Failed to get restaurant categories: ${error.message}`);
        }
    }
}

module.exports = Category;
