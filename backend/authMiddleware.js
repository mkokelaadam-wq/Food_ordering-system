// ============================================
// Food_ordering-system/backend/middleware/authMiddleware.js
// ============================================
// KAZI: KUHIFADHI TOKEN NA KUHakiki MWENYEJI WA TOKEN

const jwt = require('jsonwebtoken');

/**
 * @desc    Verify JWT token - Hii ndio inakagua kama user ameingia
 * @access  Middleware
 */
exports.authMiddleware = (req, res, next) => {
    try {
        // 1. TAFUTA TOKEN - Inaweza kuwa kwenye Header au Cookie
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.cookies?.token ||
                     req.headers?.token ||
                     req.query?.token;

        // 2. KAMA HAKUNA TOKEN - RUDISHA ERROR
        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({
                success: false,
                error: 'No authentication token. Please login first.',
                message: 'Access denied. Token is missing.'
            });
        }

        console.log('🔑 Token received:', token.substring(0, 20) + '...');

        // 3. THIBITISHA TOKEN - KAGUA KAMA NI HALALI
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'foodexpress_secret_key_2024'
        );

        // 4. ONGEZA USER DATA KWENYE REQUEST
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role || 'customer'
        };

        console.log('✅ User authenticated:', req.user.email);
        
        // 5. ENDELEA KWA MIDDLEWARE INAYOFUATA
        next();

    } catch (error) {
        console.error('❌ Auth middleware error:', error.message);

        // 6. SHUGHULIKIA AINA ZA MAKOSA
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token. Please login again.',
                details: 'Token verification failed'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired. Please login again.',
                expiredAt: error.expiredAt
            });
        }

        res.status(500).json({
            success: false,
            error: 'Authentication failed. Please try again.',
            message: error.message
        });
    }
};

/**
 * @desc    Check if user is admin - Hii inakagua kama user ni admin
 * @access  Middleware
 */
exports.adminMiddleware = (req, res, next) => {
    try {
        // 1. KAGUA KAMA USER AMEWASHA KWA TOKEN
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'Please login first'
            });
        }

        // 2. KAGUA KAMA USER NI ADMIN
        if (req.user.role === 'admin') {
            console.log('👑 Admin access granted:', req.user.email);
            next();
        } else {
            console.log('❌ Non-admin access denied:', req.user.email);
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.',
                message: 'You do not have permission to access this resource.'
            });
        }
    } catch (error) {
        console.error('❌ Admin middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Authorization failed',
            message: error.message
        });
    }
};

/**
 * @desc    Optional auth - Hii inajaribu kupata token lakini haitishi kama hakuna
 * @access  Middleware
 */
exports.optionalAuthMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.cookies?.token;

        if (token) {
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || 'foodexpress_secret_key_2024'
            );
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role || 'customer'
            };
            console.log('👤 Optional auth user:', req.user.email);
        }
        
        next();
    } catch (error) {
        // Kama token ni mbaya, endelea tu bila user
        next();
    }
};

/**
 * @desc    Generate JWT token - Hii inaunda token mpya
 * @access  Internal
 */
exports.generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role || 'customer' 
        },
        process.env.JWT_SECRET || 'foodexpress_secret_key_2024',
        { expiresIn: '7d' }
    );
};

/**
 * @desc    Refresh token - Hii inafanya token mpya kama ya zamani bado ni nzuri
 * @access  Private
 */
exports.refreshToken = (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }

        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'foodexpress_secret_key_2024',
            { ignoreExpiration: true }
        );

        const newToken = jwt.sign(
            { 
                id: decoded.id, 
                email: decoded.email, 
                role: decoded.role 
            },
            process.env.JWT_SECRET || 'foodexpress_secret_key_2024',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token: newToken,
            message: 'Token refreshed successfully'
        });

    } catch (error) {
        console.error('❌ Token refresh error:', error);
        res.status(401).json({
            success: false,
            error: 'Failed to refresh token',
            message: error.message
        });
    }
};
