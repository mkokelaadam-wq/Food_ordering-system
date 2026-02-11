// ============================================
// 🍔 FOOD EXPRESS - USER MODEL
// ============================================
// ✅ Imeunganisha: database.js, authController.js, authMiddleware.js
// ✅ Inahitaji: ../config/database, bcryptjs (for password hashing)
// ============================================

const db = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * User Model
 * Handles all user-related database operations
 * 
 * DATABASE TABLE STRUCTURE:
 * 
 * CREATE TABLE users (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   name VARCHAR(100) NOT NULL,
 *   email VARCHAR(100) UNIQUE NOT NULL,
 *   password VARCHAR(255) NOT NULL,
 *   phone VARCHAR(20),
 *   address TEXT,
 *   role ENUM('customer', 'admin', 'partner') DEFAULT 'customer',
 *   is_active BOOLEAN DEFAULT TRUE,
 *   is_verified BOOLEAN DEFAULT FALSE,
 *   verification_token VARCHAR(255),
 *   reset_password_token VARCHAR(255),
 *   reset_password_expires DATETIME,
 *   profile_image VARCHAR(255),
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *   last_login TIMESTAMP NULL,
 *   INDEX idx_email (email),
 *   INDEX idx_role (role),
 *   INDEX idx_active (is_active)
 * );
 */

class User {
    
    // ============================================
    // 🔥 CREATE OPERATIONS
    // ============================================

    /**
     * Create new user
     * @param {Object} userData - User data
     * @returns {Promise<number>} - New user ID
     */
    static async create(userData) {
        try {
            const sql = `INSERT INTO users (
                name, email, password, phone, address, role, 
                is_active, is_verified, verification_token, profile_image
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const [result] = await db.pool.execute(sql, [
                userData.name,
                userData.email,
                userData.password,
                userData.phone || null,
                userData.address || null,
                userData.role || 'customer',
                userData.is_active !== undefined ? userData.is_active : 1,
                userData.is_verified || 0,
                userData.verification_token || null,
                userData.profile_image || null
            ]);

            console.log(`✅ User created successfully with ID: ${result.insertId}`);
            return result.insertId;
        } catch (error) {
            console.error('❌ User.create Error:', error);
            throw error;
        }
    }

    /**
     * Create multiple users at once (bulk insert)
     * @param {Array} usersData - Array of user data objects
     * @returns {Promise<number>} - Number of inserted rows
     */
    static async createMany(usersData) {
        try {
            const values = usersData.map(user => [
                user.name,
                user.email,
                user.password,
                user.phone || null,
                user.address || null,
                user.role || 'customer',
                1, // is_active
                0, // is_verified
                null, // verification_token
                null // profile_image
            ]);

            const sql = `INSERT INTO users (
                name, email, password, phone, address, role,
                is_active, is_verified, verification_token, profile_image
            ) VALUES ?`;

            const [result] = await db.pool.query(sql, [values]);
            console.log(`✅ ${result.affectedRows} users created successfully`);
            return result.affectedRows;
        } catch (error) {
            console.error('❌ User.createMany Error:', error);
            throw error;
        }
    }

    // ============================================
    // 🔥 READ OPERATIONS
    // ============================================

    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Promise<Object|null>} - User object or null
     */
    static async findByEmail(email) {
        try {
            const [rows] = await db.pool.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('❌ User.findByEmail Error:', error);
            throw error;
        }
    }

    /**
     * Find user by ID
     * @param {number} id - User ID
     * @param {boolean} includePassword - Include password in result
     * @returns {Promise<Object|null>} - User object without password
     */
    static async findById(id, includePassword = false) {
        try {
            let sql;
            if (includePassword) {
                sql = 'SELECT * FROM users WHERE id = ?';
            } else {
                sql = `SELECT 
                    id, name, email, phone, address, role, 
                    is_active, is_verified, profile_image,
                    created_at, updated_at, last_login
                FROM users WHERE id = ?`;
            }

            const [rows] = await db.pool.execute(sql, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('❌ User.findById Error:', error);
            throw error;
        }
    }

    /**
     * Find user by verification token
     * @param {string} token - Verification token
     * @returns {Promise<Object|null>} - User object
     */
    static async findByVerificationToken(token) {
        try {
            const [rows] = await db.pool.execute(
                'SELECT * FROM users WHERE verification_token = ?',
                [token]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('❌ User.findByVerificationToken Error:', error);
            throw error;
        }
    }

    /**
     * Find user by reset password token
     * @param {string} token - Reset password token
     * @returns {Promise<Object|null>} - User object
     */
    static async findByResetToken(token) {
        try {
            const [rows] = await db.pool.execute(
                `SELECT * FROM users 
                 WHERE reset_password_token = ? 
                 AND reset_password_expires > NOW()`,
                [token]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('❌ User.findByResetToken Error:', error);
            throw error;
        }
    }

    /**
     * Get all users with pagination and filters
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Users and pagination
     */
    static async getAll(options = {}) {
        try {
            let sql = `SELECT 
                id, name, email, phone, address, role, 
                is_active, is_verified, profile_image,
                created_at, updated_at, last_login
                FROM users WHERE 1=1`;
            
            const params = [];

            // Apply filters
            if (options.role) {
                sql += ' AND role = ?';
                params.push(options.role);
            }

            if (options.is_active !== undefined) {
                sql += ' AND is_active = ?';
                params.push(options.is_active ? 1 : 0);
            }

            if (options.is_verified !== undefined) {
                sql += ' AND is_verified = ?';
                params.push(options.is_verified ? 1 : 0);
            }

            if (options.search) {
                sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
                const searchTerm = `%${options.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            // Get total count before pagination
            const countSql = sql.replace(
                /SELECT .*? FROM/,
                'SELECT COUNT(*) as total FROM'
            );
            const [countResult] = await db.pool.execute(countSql, params);
            const total = countResult[0].total;

            // Add sorting
            sql += ' ORDER BY ' + (options.sortBy || 'created_at') + ' ' + (options.sortOrder || 'DESC');

            // Add pagination
            const page = options.page || 1;
            const limit = options.limit || 20;
            const offset = (page - 1) * limit;
            sql += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await db.pool.execute(sql, params);

            return {
                data: rows,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('❌ User.getAll Error:', error);
            throw error;
        }
    }

    /**
     * Get user statistics
     * @returns {Promise<Object>} - User statistics
     */
    static async getStats() {
        try {
            const sql = `SELECT 
                COUNT(*) as total_users,
                SUM(role = 'customer') as total_customers,
                SUM(role = 'admin') as total_admins,
                SUM(role = 'partner') as total_partners,
                SUM(is_active = 1) as active_users,
                SUM(is_verified = 1) as verified_users,
                COUNT(DISTINCT DATE(created_at)) as days_with_registrations,
                MIN(created_at) as first_user,
                MAX(created_at) as latest_user
                FROM users`;

            const [rows] = await db.pool.execute(sql);
            return rows[0];
        } catch (error) {
            console.error('❌ User.getStats Error:', error);
            throw error;
        }
    }

    // ============================================
    // 🔥 UPDATE OPERATIONS
    // ============================================

    /**
     * Update user profile
     * @param {number} id - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<boolean>} - Success status
     */
    static async update(id, updateData) {
        try {
            // Remove sensitive fields that shouldn't be updated directly
            delete updateData.id;
            delete updateData.password;
            delete updateData.email;
            delete updateData.role;
            delete updateData.created_at;
            delete updateData.verification_token;
            delete updateData.reset_password_token;
            delete updateData.reset_password_expires;

            // Build dynamic SET clause
            const fields = Object.keys(updateData);
            const values = Object.values(updateData);

            if (fields.length === 0) return true;

            const setClause = fields.map(field => `${field} = ?`).join(', ');
            const sql = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = ?`;

            const [result] = await db.pool.execute(sql, [...values, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ User.update Error:', error);
            throw error;
        }
    }

    /**
     * Update user password
     * @param {number} id - User ID
     * @param {string} hashedPassword - New hashed password
     * @returns {Promise<boolean>} - Success status
     */
    static async updatePassword(id, hashedPassword) {
        try {
            const sql = `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`;
            const [result] = await db.pool.execute(sql, [hashedPassword, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ User.updatePassword Error:', error);
            throw error;
        }
    }

    /**
     * Update user email (requires verification)
     * @param {number} id - User ID
     * @param {string} newEmail - New email
     * @returns {Promise<boolean>} - Success status
     */
    static async updateEmail(id, newEmail) {
        try {
            const sql = `UPDATE users SET email = ?, is_verified = 0, verification_token = NULL, updated_at = NOW() WHERE id = ?`;
            const [result] = await db.pool.execute(sql, [newEmail, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ User.updateEmail Error:', error);
            throw error;
        }
    }

    /**
     * Update user role
     * @param {number} id - User ID
     * @param {string} role - New role (customer, admin, partner)
     * @returns {Promise<boolean>} - Success status
     */
    static async updateRole(id, role) {
        try {
            const sql = `UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?`;
            const [result] = await db.pool.execute(sql, [role, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ User.updateRole Error:', error);
            throw error;
        }
    }

    /**
     * Update user status (active/inactive)
     * @param {number} id - User ID
     * @param {boolean} isActive - Active status
     * @returns {Promise<boolean>} - Success status
     */
    static async updateStatus(id, isActive) {
        try {
            const sql = `UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?`;
            const [result] = await db.pool.execute(sql, [isActive ? 1 : 0, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ User.updateStatus Error:', error);
            throw error;
        }
    }

    /**
     * Verify user email
     * @param {number} id - User ID
     * @returns {Promise<boolean>} - Success status
     */
    static async verifyEmail(id) {
        try {
            const sql = `UPDATE users SET is_verified = 1, verification_token = NULL, updated_at = NOW() WHERE id = ?`;
            const [result] = await db.pool.execute(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ User.verifyEmail Error:', error);
            throw error;
        }
    }

    /**
     * Set verification token
     * @param {number} id - User ID
     * @param {string} token - Verification token
     * @returns {Promise<boolean>} - Success status
     */
    static async setVerificationToken(id, token) {
        try {
            const sql = `UPDATE users SET verification_token = ?, updated_at = NOW() WHERE id = ?`;
            const [result] = await db.pool.execute(sql, [token, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ User.setVerificationToken Error:', error);
            throw error;
        }
    }

    /**
     * Set reset password token
     * @param {string} email - User email
     * @param {string} token - Reset token
     * @param {Date} expires - Expiration date
     * @returns {Promise<boolean>} - Success status
     */
    static async setResetToken(email, token, expires) {
        try {
            const sql = `UPDATE users SET reset_password_token = ?, reset_password_expires = ?, updated_at = NOW() WHERE email = ?`;
            const [result] = await db.pool.execute(sql, [token, expires, email]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ User.setResetToken Error:', error);
            throw error;
        }
    }

    /**
     * Clear reset password token
     * @param {number} id - User ID
     * @returns {Promise<boolean>} - Success status
     */
    static async clearResetToken(id) {
        try {
            const sql = `UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL, updated_at = NOW() WHERE id = ?`;
            const [result] = await db.pool.execute(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ User.clearResetToken Error:', error);
            throw error;
        }
    }

    /**
     * Update last login timestamp
     * @param {number} id - User ID
     * @returns {Promise<boolean>} - Success status
     */
    static async updateLastLogin(id) {
        try {
            const sql = `UPDATE users SET last_login = NOW() WHERE id = ?`;
            const [result] = await db.pool.execute(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ User.updateLastLogin Error:', error);
            throw error;
        }
    }

    /**
     * Update profile image
     * @param {number} id - User ID
     * @param {string} imageUrl - Profile image URL
     * @returns {Promise<boolean>} - Success status
     */
    static async updateProfileImage(id, imageUrl) {
        try {
            const sql = `UPDATE users SET profile_image = ?, updated_at = NOW() WHERE id = ?`;
            const [result] = await db.pool.execute(sql, [imageUrl, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ User.updateProfileImage Error:', error);
            throw error;
        }
    }

    // ============================================
    // 🔥 DELETE OPERATIONS
    // ============================================

    /**
     * Delete user (soft delete by deactivating)
     * @param {number} id - User ID
     * @returns {Promise<boolean>} - Success status
     */
    static async delete(id) {
        try {
            // Soft delete - just deactivate
            const sql = `UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?`;
            const [result] = await db.pool.execute(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ User.delete Error:', error);
            throw error;
        }
    }

    /**
     * Permanently delete user from database
     * @param {number} id - User ID
     * @returns {Promise<boolean>} - Success status
     */
    static async permanentDelete(id) {
        try {
            const sql = `DELETE FROM users WHERE id = ?`;
            const [result] = await db.pool.execute(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ User.permanentDelete Error:', error);
            throw error;
        }
    }

    /**
     * Delete multiple users
     * @param {Array} ids - Array of user IDs
     * @returns {Promise<number>} - Number of deleted users
     */
    static async deleteMany(ids) {
        try {
            const placeholders = ids.map(() => '?').join(',');
            const sql = `DELETE FROM users WHERE id IN (${placeholders})`;
            const [result] = await db.pool.execute(sql, ids);
            return result.affectedRows;
        } catch (error) {
            console.error('❌ User.deleteMany Error:', error);
            throw error;
        }
    }

    // ============================================
    // 🔥 VALIDATION & UTILITY
    // ============================================

    /**
     * Check if email already exists
     * @param {string} email - Email to check
     * @param {number} excludeId - User ID to exclude from check
     * @returns {Promise<boolean>} - True if exists
     */
    static async emailExists(email, excludeId = null) {
        try {
            let sql = 'SELECT id FROM users WHERE email = ?';
            const params = [email];

            if (excludeId) {
                sql += ' AND id != ?';
                params.push(excludeId);
            }

            const [rows] = await db.pool.execute(sql, params);
            return rows.length > 0;
        } catch (error) {
            console.error('❌ User.emailExists Error:', error);
            throw error;
        }
    }

    /**
     * Get user count by role
     * @param {string} role - User role
     * @returns {Promise<number>} - User count
     */
    static async countByRole(role) {
        try {
            const [rows] = await db.pool.execute(
                'SELECT COUNT(*) as count FROM users WHERE role = ?',
                [role]
            );
            return rows[0].count;
        } catch (error) {
            console.error('❌ User.countByRole Error:', error);
            throw error;
        }
    }

    /**
     * Get users registered in date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Array>} - Users in range
     */
    static async getRegisteredInRange(startDate, endDate) {
        try {
            const sql = `SELECT 
                id, name, email, role, created_at
                FROM users 
                WHERE DATE(created_at) BETWEEN ? AND ?
                ORDER BY created_at DESC`;

            const [rows] = await db.pool.execute(sql, [startDate, endDate]);
            return rows;
        } catch (error) {
            console.error('❌ User.getRegisteredInRange Error:', error);
            throw error;
        }
    }

    /**
     * Search users
     * @param {string} query - Search query
     * @param {number} limit - Result limit
     * @returns {Promise<Array>} - Search results
     */
    static async search(query, limit = 10) {
        try {
            const sql = `SELECT 
                id, name, email, phone, role, profile_image
                FROM users 
                WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
                LIMIT ?`;

            const searchTerm = `%${query}%`;
            const [rows] = await db.pool.execute(sql, [
                searchTerm,
                searchTerm,
                searchTerm,
                limit
            ]);
            return rows;
        } catch (error) {
            console.error('❌ User.search Error:', error);
            throw error;
        }
    }
}

module.exports = User;
