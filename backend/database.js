/**
 * Database Configuration and Connection Pool
 * Enhanced version with better error handling, logging, and utilities
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration with enhanced options
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'food_express_db',
    port: parseInt(process.env.DB_PORT) || 3306,
    
    // Connection pool settings
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 20,
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
    maxIdle: parseInt(process.env.DB_MAX_IDLE) || 10,
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 60000,
    
    // Timeout settings
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000, // 10 seconds
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 10000, // 10 seconds
    
    // Performance optimizations
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    
    // Timezone - important for date consistency
    timezone: 'UTC',
    dateStrings: true, // Return dates as strings instead of Date objects
    
    // Connection retry
    retryDelay: 1000, // 1 second delay between retries
    maxRetries: 3, // Maximum retry attempts
    
    // SSL configuration (for production)
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : undefined,
    
    // Debug mode (for development)
    debug: process.env.NODE_ENV === 'development' ? ['ComQueryPacket'] : false,
    
    // Connection attributes
    charset: 'utf8mb4', // Support for emojis and special characters
    supportBigNumbers: true,
    bigNumberStrings: true,
    
    // Multiple statements (use with caution)
    multipleStatements: process.env.DB_MULTIPLE_STATEMENTS === 'true' || false
};

// Create connection pool with enhanced configuration
const pool = mysql.createPool(dbConfig);

// Enhanced error handling wrapper
const handleQueryError = (error, query, params) => {
    console.error('❌ Database Query Error:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        params: params,
        timestamp: new Date().toISOString()
    });
    
    // Return a more user-friendly error
    const friendlyError = new Error('Database operation failed');
    friendlyError.originalError = error;
    friendlyError.code = error.code;
    throw friendlyError;
};

// Enhanced query function with better error handling and logging
const query = async (sql, params = []) => {
    const startTime = Date.now();
    let connection;
    
    try {
        // Get connection from pool
        connection = await pool.getConnection();
        
        // Execute query
        const [rows, fields] = await connection.execute(sql, params);
        const queryTime = Date.now() - startTime;
        
        // Log slow queries (if taking more than 1 second)
        if (queryTime > 1000) {
            console.warn(`⚠️ Slow Query detected (${queryTime}ms):`, {
                sql: sql.substring(0, 150),
                params: params,
                executionTime: `${queryTime}ms`
            });
        }
        
        // Log successful query in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Query executed (${queryTime}ms):`, {
                sql: sql.substring(0, 100),
                rowCount: Array.isArray(rows) ? rows.length : 1
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

// Transaction helper with automatic rollback on error
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Pass the connection to the callback
        const result = await callback(connection);
        
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        console.error('❌ Transaction rolled back:', error.message);
        throw error;
    } finally {
        connection.release();
    }
};

// Multiple queries in single transaction
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

// Get single row (first result)
const getOne = async (sql, params = []) => {
    const rows = await query(sql, params);
    return rows[0] || null;
};

// Check if a record exists
const exists = async (sql, params = []) => {
    const row = await getOne(sql, params);
    return !!row;
};

// Insert and return inserted ID
const insert = async (table, data) => {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    
    return result.insertId;
};

// Update and return affected rows
const update = async (table, data, where, whereParams = []) => {
    const setClause = Object.keys(data)
        .map(key => `${key} = ?`)
        .join(', ');
    const values = [...Object.values(data), ...whereParams];
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const result = await query(sql, values);
    
    return result.affectedRows;
};

// Delete and return affected rows
const remove = async (table, where, params = []) => {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = await query(sql, params);
    
    return result.affectedRows;
};

// Pagination helper
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

// Database health check
const healthCheck = async () => {
    try {
        const startTime = Date.now();
        const [result] = await query('SELECT 1 as status, NOW() as timestamp');
        const responseTime = Date.now() - startTime;
        
        // Get pool statistics
        const poolStats = {
            totalConnections: pool._allConnections?.length || 0,
            freeConnections: pool._freeConnections?.length || 0,
            connectionLimit: dbConfig.connectionLimit,
            queueSize: pool._queue?.length || 0
        };
        
        return {
            status: 'healthy',
            database: dbConfig.database,
            responseTime: `${responseTime}ms`,
            timestamp: result.timestamp,
            poolStats
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

// Test database connection on startup
const testConnection = async () => {
    try {
        console.log('🔍 Testing database connection...');
        
        const connection = await pool.getConnection();
        
        // Test basic query
        const [result] = await connection.execute('SELECT VERSION() as version, DATABASE() as database');
        
        console.log('✅ Database connected successfully!');
        console.log(`📊 Database: ${result[0].database}`);
        console.log(`⚡ MySQL Version: ${result[0].version}`);
        
        // Check tables count
        const [tables] = await connection.execute(
            'SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?',
            [dbConfig.database]
        );
        
        console.log(`🗃️ Tables in database: ${tables[0].table_count}`);
        
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('💡 Troubleshooting tips:');
        console.error('1. Check if MySQL server is running');
        console.error('2. Verify database credentials in .env file');
        console.error('3. Ensure database exists: CREATE DATABASE ' + dbConfig.database);
        console.error('4. Check if user has proper permissions');
        return false;
    }
};

// Graceful shutdown
const shutdown = async () => {
    console.log('🔄 Closing database connections...');
    try {
        await pool.end();
        console.log('✅ Database connections closed gracefully');
    } catch (error) {
        console.error('❌ Error closing database connections:', error.message);
    }
};

// Export everything
module.exports = {
    // Core
    pool,
    query,
    getOne,
    
    // CRUD operations
    insert,
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
    
    // Raw pool for special cases
    getConnection: () => pool.getConnection(),
    
    // Configuration
    config: dbConfig
};
