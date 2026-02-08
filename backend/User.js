const pool = require('../config/database');

class User {
    // Create new user
    static async create(userData) {
        const sql = `INSERT INTO users (name, email, password, phone, address) 
                     VALUES (?, ?, ?, ?, ?)`;
        const [result] = await pool.execute(sql, [
            userData.name,
            userData.email,
            userData.password,
            userData.phone || null,
            userData.address || null
        ]);
        return result.insertId;
    }

    // Find user by email
    static async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    // Find user by ID
    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, name, email, phone, address, role FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }
}

module.exports = User;
