const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const userRoutes = require('./routes/userRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const adminRoutes = require('./routes/adminRoutes'); // ✗ ADDED THIS

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: NODE_ENV === 'production',
    crossOriginEmbedderPolicy: NODE_ENV === 'production'
}));

// CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:3000', 
        'http://localhost:5500', 
        'http://127.0.0.1:5500', 
        'https://mkokelaadam-wq.github.io',
        'http://localhost:5000',  // For local API testing
        'http://127.0.0.1:5000'   // For local API testing
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// HTTP request logger (different format for production)
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        skip: (req, res) => res.statusCode < 400 // Log only errors in production
    }));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// STATIC FILES
// ============================================

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve public assets
app.use('/public', express.static(path.join(__dirname, 'public')));

// ============================================
// ROUTES
// ============================================

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/admin', adminRoutes); // ✗ ADDED THIS

// ============================================
// ROOT ENDPOINTS
// ============================================

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        success: true,
        message: '🍔 Food Express Backend API', 
        status: 'running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        endpoints: {
            auth: '/api/auth',
            menu: '/api/menu',
            orders: '/api/orders',
            cart: '/api/cart',
            users: '/api/users',
            restaurants: '/api/restaurants',
            admin: '/api/admin',
            documentation: '/api',
            health: '/health'
        },
        documentation: 'Visit /api for API documentation'
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    const docs = {
        success: true,
        message: 'Food Express API Documentation',
        version: '1.0.0',
        baseUrl: `http://${req.headers.host}/api`,
        endpoints: {
            // Authentication
            auth: {
                register: { method: 'POST', path: '/auth/register', description: 'Register new user' },
                login: { method: 'POST', path: '/auth/login', description: 'Login user' },
                logout: { method: 'POST', path: '/auth/logout', description: 'Logout user' },
                forgotPassword: { method: 'POST', path: '/auth/forgot-password', description: 'Request password reset' }
            },
            // Menu
            menu: {
                getAll: { method: 'GET', path: '/menu', description: 'Get all menu items' },
                getById: { method: 'GET', path: '/menu/:id', description: 'Get single menu item' },
                getByCategory: { method: 'GET', path: '/menu/category/:category', description: 'Get menu items by category' }
            },
            // Cart
            cart: {
                add: { method: 'POST', path: '/cart/add', description: 'Add item to cart' },
                get: { method: 'GET', path: '/cart', description: 'Get user cart' },
                update: { method: 'PUT', path: '/cart/:id', description: 'Update cart item' },
                remove: { method: 'DELETE', path: '/cart/:id', description: 'Remove from cart' },
                clear: { method: 'DELETE', path: '/cart/clear', description: 'Clear cart' }
            },
            // Orders
            orders: {
                create: { method: 'POST', path: '/orders', description: 'Create new order' },
                getAll: { method: 'GET', path: '/orders', description: 'Get user orders' },
                getById: { method: 'GET', path: '/orders/:id', description: 'Get order details' },
                track: { method: 'GET', path: '/orders/:id/track', description: 'Track order status' }
            },
            // Users
            users: {
                profile: { method: 'GET', path: '/users/profile', description: 'Get user profile' },
                updateProfile: { method: 'PUT', path: '/users/profile', description: 'Update profile' },
                uploadPhoto: { method: 'POST', path: '/users/profile/upload', description: 'Upload profile picture' },
                addresses: { method: 'GET', path: '/users/addresses', description: 'Get user addresses' },
                favorites: { method: 'GET', path: '/users/favorites', description: 'Get user favorites' }
            },
            // Restaurants
            restaurants: {
                getAll: { method: 'GET', path: '/restaurants', description: 'Get all restaurants' },
                getById: { method: 'GET', path: '/restaurants/:id', description: 'Get restaurant details' },
                getMenu: { method: 'GET', path: '/restaurants/:id/menu', description: 'Get restaurant menu' },
                search: { method: 'GET', path: '/restaurants/search', description: 'Search restaurants' }
            },
            // Admin (requires admin role)
            admin: {
                dashboard: { method: 'GET', path: '/admin/dashboard', description: 'Admin dashboard stats' },
                users: { method: 'GET', path: '/admin/users', description: 'Manage users' },
                restaurants: { method: 'GET', path: '/admin/restaurants', description: 'Manage restaurants' },
                orders: { method: 'GET', path: '/admin/orders', description: 'Manage all orders' }
            }
        },
        authentication: 'Most endpoints require JWT token in Authorization header',
        responseFormat: {
            success: 'boolean',
            message: 'string',
            data: 'object/array',
            error: 'string (only when success is false)'
        }
    };
    
    res.json(docs);
});

// Health check endpoint (for monitoring)
app.get('/health', (req, res) => {
    const health = {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: NODE_ENV,
        database: 'connected' // You can add actual DB health check here
    };
    
    res.json(health);
});

// API status endpoint
app.get('/status', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        serverTime: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())} seconds`
    });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'API endpoint not found',
        requestedUrl: req.originalUrl,
        method: req.method,
        suggestions: [
            'Check the API documentation at /api',
            'Verify the endpoint URL and HTTP method',
            'Ensure you have proper authentication'
        ]
    });
});

// General 404 handler
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        res.status(404).json({ 
            success: false,
            error: 'Route not found',
            requestedUrl: req.originalUrl,
            method: req.method
        });
    } else {
        res.status(404).json({ 
            success: false,
            error: 'Not Found',
            message: 'Welcome to Food Express API. Please use API endpoints starting with /api',
            documentation: '/api',
            healthCheck: '/'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    const errorResponse = {
        success: false,
        error: message,
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    };
    
    // Include stack trace only in development
    if (NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }
    
    res.status(statusCode).json(errorResponse);
});

// ============================================
// SERVER STARTUP
// ============================================

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🍔 FOOD EXPRESS BACKEND SERVER');
    console.log('='.repeat(60));
    console.log(`✅ Server started successfully!`);
    console.log(`⚡ Environment: ${NODE_ENV}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`📚 Documentation: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`⏰ Server Time: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    console.log('Available Routes:');
    console.log(`  - Auth: http://localhost:${PORT}/api/auth`);
    console.log(`  - Menu: http://localhost:${PORT}/api/menu`);
    console.log(`  - Cart: http://localhost:${PORT}/api/cart`);
    console.log(`  - Orders: http://localhost:${PORT}/api/orders`);
    console.log(`  - Users: http://localhost:${PORT}/api/users`);
    console.log(`  - Restaurants: http://localhost:${PORT}/api/restaurants`);
    console.log(`  - Admin: http://localhost:${PORT}/api/admin`);
    console.log('='.repeat(60));
});

// ============================================
// SERVER ERROR HANDLING
// ============================================

// Handle server errors
server.on('error', (error) => {
    console.error('❌ Server Error:', error);
    
    if (error.code === 'EADDRINUSE') {
        console.error(`⚠️ Port ${PORT} is already in use!`);
        console.log(`💡 Try one of these solutions:`);
        console.log(`   1. Change PORT in .env file`);
        console.log(`   2. Kill process using port: kill -9 $(lsof -t -i:${PORT})`);
        console.log(`   3. Use different port: PORT=5001 npm start`);
    } else if (error.code === 'EACCES') {
        console.error(`⚠️ Permission denied for port ${PORT}`);
        console.log(`💡 Try using a port above 1024 (e.g., 5000, 8080, 3000)`);
    }
    
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    console.log('🔄 Restarting server...');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    server.close(() => {
        console.log('✅ HTTP server closed');
        console.log('👋 Goodbye!');
        process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Listen for shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Export for testing
module.exports = app;
