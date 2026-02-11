/**
 * JWT Configuration Module
 * Contains JWT secret and token settings
 */

const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    // JWT Secret Key - Change this in production!
    secret: process.env.JWT_SECRET || 'foodexpress-secret-key-2024-dev-change-in-production',
    
    // Token expiration time
    accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '24h',    // 24 hours
    refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',   // 7 days
    
    // Token types
    tokenTypes: {
        ACCESS: 'access',
        REFRESH: 'refresh',
        RESET_PASSWORD: 'resetPassword',
        VERIFY_EMAIL: 'verifyEmail'
    },
    
    // Token issuer and audience
    issuer: process.env.JWT_ISSUER || 'foodexpress-api',
    audience: process.env.JWT_AUDIENCE || 'foodexpress-app',
    
    // Algorithm
    algorithm: 'HS256',
    
    // Cookie settings for tokens
    cookieOptions: {
        httpOnly: true,     // Prevent XSS attacks
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict', // CSRF protection
        maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        path: '/'
    },
    
    // Generate token configuration
    getAccessTokenConfig: function() {
        return {
            expiresIn: this.accessTokenExpiration,
            issuer: this.issuer,
            audience: this.audience
        };
    },
    
    // Generate refresh token configuration
    getRefreshTokenConfig: function() {
        return {
            expiresIn: this.refreshTokenExpiration,
            issuer: this.issuer,
            audience: this.audience
        };
    },
    
    // Password reset token config
    getResetPasswordConfig: function() {
        return {
            expiresIn: '1h', // 1 hour for password reset
            issuer: this.issuer,
            audience: this.audience
        };
    },
    
    // Email verification token config
    getVerifyEmailConfig: function() {
        return {
            expiresIn: '24h', // 24 hours for email verification
            issuer: this.issuer,
            audience: this.audience
        };
    },
    
    // Validate token payload
    validateTokenPayload: function(payload) {
        const requiredFields = ['id', 'email', 'role', 'iat', 'exp'];
        return requiredFields.every(field => payload.hasOwnProperty(field));
    },
    
    // Get user payload for token
    getUserPayload: function(user) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status
        };
    }
};
