const jwt = require('jsonwebtoken');

// Authentication middleware
const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No authorization token provided.'
            });
        }
        
        // Check if token format is correct
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token format. Use "Bearer <token>"'
            });
        }
        
        // Extract token
        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.'
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user info to request object
        req.user = decoded;
        
        // Continue to next middleware/route
        next();
        
    } catch (error) {
        console.error('Authentication error:', error.message);
        
        // Handle different JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token. Please login again.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired. Please login again.'
            });
        }
        
        // Generic error
        return res.status(401).json({
            success: false,
            error: 'Authentication failed. Please login again.'
        });
    }
};

// Admin middleware (checks if user is admin)
const adminMiddleware = (req, res, next) => {
    try {
        // Check if user is authenticated first
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        
        // Check if user has admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.'
            });
        }
        
        next();
        
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error checking admin privileges'
        });
    }
};

// Optional authentication (user can be null)
const optionalAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
            } catch (error) {
                // Token is invalid but we don't block the request
                // User will just be treated as guest
                console.log('Optional auth: Invalid token, continuing as guest');
            }
        }
        
        next();
        
    } catch (error) {
        console.error('Optional auth error:', error);
        next(); // Continue even if there's an error
    }
};

// Check if user owns resource (for user-specific operations)
const ownershipMiddleware = (req, res, next) => {
    try {
        const resourceUserId = req.params.userId || req.body.userId;
        const requestingUserId = req.user.userId;
        
        // Allow if user owns resource OR is admin
        if (requestingUserId.toString() !== resourceUserId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You can only access your own resources.'
            });
        }
        
        next();
        
    } catch (error) {
        console.error('Ownership middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error verifying ownership'
        });
    }
};

// Rate limiting middleware (basic example)
const rateLimitMiddleware = (req, res, next) => {
    // Simple rate limiting - in production use express-rate-limit
    const apiKey = req.header('API-Key') || req.user?.userId;
    
    // You can implement more sophisticated rate limiting here
    // For now, just pass through
    next();
};

// Logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    
    next();
};

// CORS middleware (already handled by cors package, but here's custom)
const corsMiddleware = (req, res, next) => {
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
        success: false,
        error: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

// 404 Not Found middleware
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`
    });
};

// Export all middlewares
module.exports = {
    authMiddleware,
    adminMiddleware,
    optionalAuthMiddleware,
    ownershipMiddleware,
    rateLimitMiddleware,
    requestLogger,
    corsMiddleware,
    errorHandler,
    notFoundHandler
};
