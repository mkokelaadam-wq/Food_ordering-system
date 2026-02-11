const db = require('../config/database');

class Cart {
    // Add item to cart
    static async addItem(userId, menuId, quantity = 1) {
        try {
            // Check if item already in cart
            const [existing] = await db.execute(
                'SELECT * FROM cart WHERE user_id = ? AND menu_id = ?',
                [userId, menuId]
            );
            
            if (existing.length > 0) {
                // Update quantity if exists
                const [result] = await db.execute(
                    'UPDATE cart SET quantity = quantity + ? WHERE id = ?',
                    [quantity, existing[0].id]
                );
                return { updated: true, id: existing[0].id };
            } else {
                // Insert new item
                const [result] = await db.execute(
                    'INSERT INTO cart (user_id, menu_id, quantity) VALUES (?, ?, ?)',
                    [userId, menuId, quantity]
                );
                return { added: true, id: result.insertId };
            }
        } catch (error) {
            throw error;
        }
    }

    // Get user cart
    static async getCart(userId) {
        try {
            const [rows] = await db.execute(
                `SELECT c.*, m.name, m.price, m.image_url, m.description 
                 FROM cart c 
                 JOIN menu_items m ON c.menu_id = m.id 
                 WHERE c.user_id = ?`,
                [userId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Update cart item quantity
    static async updateQuantity(cartId, quantity) {
        try {
            const [result] = await db.execute(
                'UPDATE cart SET quantity = ? WHERE id = ?',
                [quantity, cartId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Remove item from cart
    static async removeItem(cartId) {
        try {
            const [result] = await db.execute(
                'DELETE FROM cart WHERE id = ?',
                [cartId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Clear user cart
    static async clearCart(userId) {
        try {
            const [result] = await db.execute(
                'DELETE FROM cart WHERE user_id = ?',
                [userId]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Get cart total
    static async getCartTotal(userId) {
        try {
            const [rows] = await db.execute(
                `SELECT SUM(m.price * c.quantity) as total 
                 FROM cart c 
                 JOIN menu_items m ON c.menu_id = m.id 
                 WHERE c.user_id = ?`,
                [userId]
            );
            return rows[0].total || 0;
        } catch (error) {
            throw error;
        }
    }

    // Get cart count (for navbar)
    static async getCartCount(userId) {
        try {
            const [rows] = await db.execute(
                `SELECT SUM(quantity) as count 
                 FROM cart 
                 WHERE user_id = ?`,
                [userId]
            );
            return rows[0].count || 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Cart;
