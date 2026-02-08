const pool = require('../config/database');

class Menu {
    // Get all menu items
    static async getAll() {
        const [rows] = await pool.execute(
            'SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name'
        );
        return rows;
    }

    // Get menu item by ID
    static async getById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM menu_items WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    // Get by category
    static async getByCategory(category) {
        const [rows] = await pool.execute(
            'SELECT * FROM menu_items WHERE category = ? AND available = 1',
            [category]
        );
        return rows;
    }
}

module.exports = Menu;
