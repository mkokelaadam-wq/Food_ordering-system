// ============================================
// 🍔 FOOD EXPRESS - DATABASE CONFIGURATION
// ============================================
// ✅ Imeunganisha: .env, Category.js, MenuItem.js, Order.js, User.js, Restaurant.js
// ✅ Inahitaji: mysql2, dotenv
// ============================================

/**
 * Database Configuration and Connection Pool
 * Enhanced version with better error handling, logging, and utilities
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// ============================================
// 🔥 DATABASE CONFIGURATION FROM .ENV
// ============================================

// Database configuration with enhanced options
const dbConfig = {
    // Basic connection settings
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123',
    database: process.env.DB_NAME || 'food_express_db',
    port: parseInt(process.env.DB_PORT) || 3306,
    
    // Connection pool settings
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 20,
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
    maxIdle: parseInt(process.env.DB_MAX_IDLE) || 10,
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 60000,
    
    // Timeout settings
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 10000,
    
    // Performance optimizations
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    
    // Timezone - important for date consistency
    timezone: 'UTC',
    dateStrings: true,
    
    // Connection retry
    retryDelay: 1000,
    maxRetries: 3,
    
    // SSL configuration (for production)
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : undefined,
    
    // Debug mode (for development)
    debug: process.env.NODE_ENV === 'development' && process.env.DB_LOGGING === 'true',
    
    // Connection attributes
    charset: process.env.DB_CHARSET || 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true,
    
    // Multiple statements
    multipleStatements: process.env.DB_MULTIPLE_STATEMENTS === 'true' || false
};

// ============================================
// 🔥 CREATE CONNECTION POOL
// ============================================

// Create connection pool with enhanced configuration
const pool = mysql.createPool(dbConfig);

// ============================================
// 🔥 ERROR HANDLING
// ============================================

/**
 * Handle database query errors
 * @param {Error} error - The error object
 * @param {string} query - The SQL query
 * @param {Array} params - Query parameters
 * @throws {Error} - User-friendly error
 */
const handleQueryError = (error, query, params) => {
    console.error('❌ ========== DATABASE QUERY ERROR ==========');
    console.error('📝 Error Type:', error.name || 'DatabaseError');
    console.error('💬 Message:', error.message);
    console.error('🔢 Code:', error.code);
    console.error('🔢 Errno:', error.errno);
    console.error('🔢 SQL State:', error.sqlState);
    console.error('📋 SQL Query:', query.substring(0, 300) + (query.length > 300 ? '...' : ''));
    console.error('📦 Parameters:', params);
    console.error('🕒 Timestamp:', new Date().toISOString());
    console.error('❌ ==========================================');
    
    // Map common MySQL errors to user-friendly messages
    let friendlyMessage = 'Database operation failed';
    
    if (error.code === 'ER_DUP_ENTRY') {
        friendlyMessage = 'Duplicate entry. This record already exists.';
    } else if (error.code === 'ER_NO_REFERENCED_ROW') {
        friendlyMessage = 'Referenced record does not exist.';
    } else if (error.code === 'ER_ROW_IS_REFERENCED') {
        friendlyMessage = 'Cannot delete because this record is in use.';
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
        friendlyMessage = 'Required field cannot be empty.';
    } else if (error.code === 'ER_PARSE_ERROR') {
        friendlyMessage = 'Invalid query format.';
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        friendlyMessage = 'Database access denied. Check credentials.';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
        friendlyMessage = 'Database does not exist. Please create it first.';
    } else if (error.code === 'ECONNREFUSED') {
        friendlyMessage = 'Database server is not running.';
    }
    
    const friendlyError = new Error(friendlyMessage);
    friendlyError.originalError = error;
    friendlyError.code = error.code;
    friendlyError.errno = error.errno;
    friendlyError.sqlState = error.sqlState;
    throw friendlyError;
};

// ============================================
// 🔥 CORE QUERY FUNCTIONS
// ============================================

/**
 * Execute a database query
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
const query = async (sql, params = []) => {
    const startTime = Date.now();
    let connection;
    
    try {
        // Get connection from pool
        connection = await pool.getConnection();
        
        // Execute query
        const [rows] = await connection.execute(sql, params);
        const queryTime = Date.now() - startTime;
        
        // Log slow queries (if taking more than 1 second)
        if (queryTime > 1000) {
            console.warn(`⚠️ Slow Query detected (${queryTime}ms):`, {
                sql: sql.substring(0, 150) + (sql.length > 150 ? '...' : ''),
                params: params,
                executionTime: `${queryTime}ms`,
                rows: Array.isArray(rows) ? rows.length : 1
            });
        }
        
        // Log successful query in development
        if (process.env.NODE_ENV === 'development' && process.env.DB_LOGGING === 'true') {
            console.log(`✅ Query executed (${queryTime}ms):`, {
                sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
                rows: Array.isArray(rows) ? rows.length : 1,
                executionTime: `${queryTime}ms`
            });
        }
        
        return rows;
    } catch (error) {
        handleQueryError(error, sql, params);
    } finally {
        // Always release connection back to pool
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Get single row (first result)
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} - First row or null
 */
const getOne = async (sql, params = []) => {
    const rows = await query(sql, params);
    return rows[0] || null;
};

/**
 * Check if a record exists
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<boolean>} - True if record exists
 */
const exists = async (sql, params = []) => {
    const row = await getOne(sql, params);
    return !!row;
};

// ============================================
// 🔥 CRUD OPERATIONS
// ============================================

/**
 * Insert a record into a table
 * @param {string} table - Table name
 * @param {Object} data - Data to insert
 * @returns {Promise<number>} - Inserted ID
 */
const insert = async (table, data) => {
    // Add timestamps automatically
    if (!data.created_at) {
        data.created_at = new Date();
    }
    if (!data.updated_at) {
        data.updated_at = new Date();
    }
    
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    
    return result.insertId;
};

/**
 * Insert multiple records at once
 * @param {string} table - Table name
 * @param {Array} records - Array of records to insert
 * @returns {Promise<number>} - Number of affected rows
 */
const insertMany = async (table, records) => {
    if (!records || records.length === 0) return 0;
    
    // Add timestamps to all records
    const now = new Date();
    records = records.map(record => ({
        ...record,
        created_at: now,
        updated_at: now
    }));
    
    const columns = Object.keys(records[0]).join(', ');
    const placeholders = records.map(() => 
        '(' + Object.keys(records[0]).map(() => '?').join(', ') + ')'
    ).join(', ');
    
    const values = records.flatMap(Object.values);
    
    const sql = `INSERT INTO ${table} (${columns}) VALUES ${placeholders}`;
    const result = await query(sql, values);
    
    return result.affectedRows;
};

/**
 * Update records in a table
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {string} where - WHERE clause
 * @param {Array} whereParams - WHERE parameters
 * @returns {Promise<number>} - Number of affected rows
 */
const update = async (table, data, where, whereParams = []) => {
    // Update timestamp automatically
    data.updated_at = new Date();
    
    const setClause = Object.keys(data)
        .map(key => `${key} = ?`)
        .join(', ');
    const values = [...Object.values(data), ...whereParams];
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const result = await query(sql, values);
    
    return result.affectedRows;
};

/**
 * Delete records from a table
 * @param {string} table - Table name
 * @param {string} where - WHERE clause
 * @param {Array} params - WHERE parameters
 * @returns {Promise<number>} - Number of affected rows
 */
const remove = async (table, where, params = []) => {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = await query(sql, params);
    
    return result.affectedRows;
};

// ============================================
// 🔥 ADVANCED OPERATIONS
// ============================================

/**
 * Execute a transaction with automatic rollback on error
 * @param {Function} callback - Transaction callback
 * @returns {Promise<any>} - Transaction result
 */
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Pass the connection to the callback
        const result = await callback(connection);
        
        await connection.commit();
        console.log('✅ Transaction committed successfully');
        return result;
    } catch (error) {
        await connection.rollback();
        console.error('❌ Transaction rolled back:', error.message);
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Execute multiple queries in a single transaction
 * @param {Array} queries - Array of {sql, params} objects
 * @returns {Promise<Array>} - Array of results
 */
const multiQuery = async (queries) => {
    return transaction(async (connection) => {
        const results = [];
        for (const { sql, params } of queries) {
            const [rows] = await connection.execute(sql, params || []);
            results.push(rows);
        }
        return results;
    });
};

/**
 * Paginate query results
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} - Paginated results
 */
const paginate = async (sql, params = [], page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const paginatedSql = `${sql} LIMIT ? OFFSET ?`;
    const paginatedParams = [...params, limit, offset];
    
    // Get total count (remove ORDER BY and SELECT columns for count)
    const countSql = sql
        .replace(/SELECT .*? FROM/i, 'SELECT COUNT(*) as total FROM')
        .replace(/ORDER BY .*/i, '')
        .replace(/LIMIT .*/i, '');
    
    const [rows, countResult] = await Promise.all([
        query(paginatedSql, paginatedParams),
        getOne(countSql, params)
    ]);
    
    const total = countResult ? countResult.total : 0;
    const totalPages = Math.ceil(total / limit);
    
    return {
        data: rows,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
};

// ============================================
// 🔥 UTILITY FUNCTIONS
// ============================================

/**
 * Test database connection on startup
 * @returns {Promise<boolean>} - True if connected
 */
const testConnection = async () => {
    try {
        console.log('🔍 ========== TESTING DATABASE CONNECTION ==========');
        console.log(`📋 Host: ${dbConfig.host}:${dbConfig.port}`);
        console.log(`📋 Database: ${dbConfig.database}`);
        console.log(`📋 User: ${dbConfig.user}`);
        
        const connection = await pool.getConnection();
        
        // Test basic query
        const [result] = await connection.execute('SELECT VERSION() as version, DATABASE() as database, NOW() as time');
        
        console.log('✅ Database connected successfully!');
        console.log(`📊 Database: ${result[0].database}`);
        console.log(`⚡ MySQL Version: ${result[0].version}`);
        console.log(`🕒 Server Time: ${result[0].time}`);
        
        // Check tables count
        const [tables] = await connection.execute(
            'SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?',
            [dbConfig.database]
        );
        
        console.log(`🗃️ Tables in database: ${tables[0].table_count}`);
        console.log('🔍 ================================================');
        
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ ========== DATABASE CONNECTION FAILED ==========');
        console.error('💬 Error:', error.message);
        console.error('💡 Troubleshooting tips:');
        console.error('1. Check if MySQL server is running');
        console.error('2. Verify database credentials in .env file');
        console.error('3. Ensure database exists: CREATE DATABASE ' + dbConfig.database);
        console.error('4. Check if user has proper permissions');
        console.error('5. Try connecting with: mysql -u ' + dbConfig.user + ' -p');
        console.error('❌ ===============================================');
        return false;
    }
};

/**
 * Database health check
 * @returns {Promise<Object>} - Health status
 */
const healthCheck = async () => {
    try {
        const startTime = Date.now();
        const [result] = await query('SELECT 1 as status, NOW() as timestamp');
        const responseTime = Date.now() - startTime;
        
        // Get pool statistics
        const poolStats = {
            totalConnections: pool._allConnections?.length || 0,
            freeConnections: pool._freeConnections?.length || 0,
            usedConnections: (pool._allConnections?.length || 0) - (pool._freeConnections?.length || 0),
            connectionLimit: dbConfig.connectionLimit,
            queueSize: pool._queue?.length || 0,
            pendingCreates: pool._pendingConnections?.length || 0
        };
        
        return {
            status: 'healthy',
            database: dbConfig.database,
            responseTime: `${responseTime}ms`,
            timestamp: result.timestamp,
            poolStats,
            uptime: process.uptime()
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        };
    }
};

/**
 * Graceful shutdown - Close all database connections
 */
const shutdown = async () => {
    console.log('🔄 Closing database connections...');
    try {
        await pool.end();
        console.log('✅ Database connections closed gracefully');
    } catch (error) {
        console.error('❌ Error closing database connections:', error.message);
    }
};

/**
 * Get table schema information
 * @param {string} tableName - Table name
 * @returns {Promise<Array>} - Table schema
 */
const getTableSchema = async (tableName) => {
    const sql = `
        SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            COLUMN_KEY,
            COLUMN_DEFAULT,
            EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
    `;
    return await query(sql, [dbConfig.database, tableName]);
};

/**
 * Check if table exists
 * @param {string} tableName - Table name
 * @returns {Promise<boolean>} - True if table exists
 */
const tableExists = async (tableName) => {
    const sql = `
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = ?
    `;
    const result = await getOne(sql, [dbConfig.database, tableName]);
    return result && result.count > 0;
};

/**
 * Run a raw query with parameters
 * @param {string} sql - Raw SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
const raw = async (sql, params = []) => {
    return await query(sql, params);
};

// ============================================
// 🔥 EXPORT EVERYTHING
// ============================================

module.exports = {
    // Core
    pool,
    query,
    getOne,
    
    // CRUD operations
    insert,
    insertMany,
    update,
    remove,
    exists,
    
    // Advanced operations
    transaction,
    multiQuery,
    paginate,
    
    // Utility functions
    healthCheck,
    testConnection,
    shutdown,
    getTableSchema,
    tableExists,
    raw,
    
    // Raw pool for special cases
    getConnection: () => pool.getConnection(),
    
    // Configuration
    config: dbConfig
};
