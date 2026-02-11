/**
 * Admin Middleware
 * Verifies if user has admin privileges
 */

const adminMiddleware = (req, res, next) => {
    try {
        // Check if user exists in request (from authMiddleware)
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
        
        // Check if admin account is active
        if (req.user.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'Your admin account is not active'
            });
        }
        
        // Log admin access (optional)
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔐 Admin Access: ${req.user.email} - ${req.method} ${req.originalUrl}`);
        }
        
        next();
    } catch (error) {
        console.error('Admin Middleware Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error in admin verification'
        });
    }
};

module.exports = adminMiddleware;
