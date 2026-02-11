/**
 * Category Model
 * Handles food category operations
 */

const db = require('../config/database');

class Category {
    /**
     * Get all categories
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Array of categories
     */
    static async getAll(filters = {}) {
        try {
            let sql = `
                SELECT 
                    c.*,
                    COUNT(DISTINCT mi.id) as item_count
                FROM categories c
                LEFT JOIN menu_items mi ON c.id = mi.category_id AND mi.is_available = TRUE
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
            
            sql += ' GROUP BY c.id ORDER BY c.sort_order, c.name';
            
            const [categories] = await db.query(sql, params);
            return categories;
        } catch (error) {
            console.error('Category.getAll Error:', error);
            throw error;
        }
    }

    /**
     * Get category by ID
     * @param {number} id - Category ID
     * @returns {Promise<Object|null>} - Category object or null
     */
    static async getById(id) {
        try {
            const [categories] = await db.query(
                `SELECT 
                    c.*,
                    r.name as restaurant_name
                FROM categories c
                LEFT JOIN restaurants r ON c.restaurant_id = r.id
                WHERE c.id = ?`,
                [id]
            );
            
            return categories[0] || null;
        } catch (error) {
            console.error('Category.getById Error:', error);
            throw error;
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
                'SELECT * FROM categories WHERE id = ?',
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
                    r.logo_url as restaurant_logo
                FROM menu_items mi
                INNER JOIN restaurants r ON mi.restaurant_id = r.id
                WHERE mi.category_id = ? AND mi.is_available = TRUE AND r.is_open = TRUE
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
            
            if (filters.is_spicy !== undefined) {
                sql += ' AND mi.is_spicy = ?';
                params.push(filters.is_spicy ? 1 : 0);
            }
            
            if (filters.min_price !== undefined) {
                sql += ' AND COALESCE(mi.discounted_price, mi.price) >= ?';
                params.push(filters.min_price);
            }
            
            if (filters.max_price !== undefined) {
                sql += ' AND COALESCE(mi.discounted_price, mi.price) <= ?';
                params.push(filters.max_price);
            }
            
            sql += ' ORDER BY mi.is_featured DESC, mi.name';
            
            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(filters.limit);
            }
            
            const [items] = await db.query(sql, params);
            
            return {
                ...category,
                items,
                item_count: items.length
            };
        } catch (error) {
            console.error('Category.getWithItems Error:', error);
            throw error;
        }
    }

    /**
     * Create new category
     * @param {Object} categoryData - Category data
     * @returns {Promise<number>} - New category ID
     */
    static async create(categoryData) {
        try {
            // Set default values
            if (!categoryData.sort_order) {
                // Get max sort order for this restaurant
                const [maxOrder] = await db.query(
                    'SELECT MAX(sort_order) as max_order FROM categories WHERE restaurant_id = ? OR (? IS NULL AND restaurant_id IS NULL)',
                    [categoryData.restaurant_id || null, categoryData.restaurant_id || null]
                );
                
                categoryData.sort_order = (maxOrder[0].max_order || 0) + 1;
            }
            
            const [result] = await db.query(
                'INSERT INTO categories SET ?',
                [categoryData]
            );
            
            return result.insertId;
        } catch (error) {
            console.error('Category.create Error:', error);
            throw error;
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
            const [result] = await db.query(
                'UPDATE categories SET ? WHERE id = ?',
                [updateData, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Category.update Error:', error);
            throw error;
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
                'UPDATE categories SET sort_order = ? WHERE id = ?',
                [sortOrder, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Category.updateSortOrder Error:', error);
            throw error;
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
            console.error('Category.updateStatus Error:', error);
            throw error;
        }
    }

    /**
     * Delete category
     * @param {number} id - Category ID
     * @returns {Promise<boolean>} - Success status
     */
    static async delete(id) {
        try {
            // Check if category has menu items
            const [items] = await db.query(
                'SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?',
                [id]
            );
            
            if (items[0].count > 0) {
                throw new Error('Cannot delete category that has menu items. Please reassign items first.');
            }
            
            const [result] = await db.query(
                'DELETE FROM categories WHERE id = ?',
                [id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Category.delete Error:', error);
            throw error;
        }
    }

    /**
     * Reassign menu items to another category
     * @param {number} fromCategoryId - Source category ID
     * @param {number} toCategoryId - Target category ID
     * @returns {Promise<number>} - Number of items reassigned
     */
    static async reassignItems(fromCategoryId, toCategoryId) {
        try {
            const [result] = await db.query(
                'UPDATE menu_items SET category_id = ? WHERE category_id = ?',
                [toCategoryId, fromCategoryId]
            );
            
            return result.affectedRows;
        } catch (error) {
            console.error('Category.reassignItems Error:', error);
            throw error;
        }
    }

    /**
     * Get popular categories
     * @param {number} limit - Number of categories to return
     * @returns {Promise<Array>} - Array of popular categories
     */
    static async getPopular(limit = 10) {
        try {
            const [categories] = await db.query(
                `SELECT 
                    c.*,
                    COUNT(mi.id) as item_count,
                    COUNT(DISTINCT o.id) as order_count
                FROM categories c
                LEFT JOIN menu_items mi ON c.id = mi.category_id AND mi.is_available = TRUE
                LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
                LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
                WHERE c.is_active = TRUE
                GROUP BY c.id
                ORDER BY order_count DESC, item_count DESC
                LIMIT ?`,
                [limit]
            );
            
            return categories;
        } catch (error) {
            console.error('Category.getPopular Error:', error);
            throw error;
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
                    (SELECT COUNT(*) FROM menu_items WHERE category_id = ? AND is_available = TRUE) as active_items,
                    (SELECT COUNT(*) FROM menu_items WHERE category_id = ? AND is_available = FALSE) as inactive_items,
                    (SELECT AVG(price) FROM menu_items WHERE category_id = ?) as avg_price,
                    (SELECT MIN(price) FROM menu_items WHERE category_id = ? AND is_available = TRUE) as min_price,
                    (SELECT MAX(price) FROM menu_items WHERE category_id = ? AND is_available = TRUE) as max_price,
                    (SELECT COUNT(DISTINCT restaurant_id) FROM menu_items WHERE category_id = ?) as restaurant_count
                FROM DUAL`,
                [categoryId, categoryId, categoryId, categoryId, categoryId, categoryId]
            );
            
            return stats[0] || {};
        } catch (error) {
            console.error('Category.getStatistics Error:', error);
            throw error;
        }
    }
}

module.exports = Category;
