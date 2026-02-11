const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const userRoutes = require('./routes/userRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const adminRoutes = require('./routes/adminRoutes');

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
    crossOriginEmbedderPolicy: false // Allow serving frontend
}));

// Cookie parser (for auth tokens)
app.use(cookieParser());

// CORS configuration - CRITICAL FOR FRONTEND
const corsOptions = {
    origin: [
        'http://localhost:3000', 
        'http://localhost:5500', 
        'http://127.0.0.1:5500',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'https://mkokelaadam-wq.github.io',
        // 🔥 GitHub Pages yako moja kwa moja
        'https://mkokelaadam-wq.github.io/Food_ordering-system',
        'https://mkokelaadam-wq.github.io/Food_ordering-system/',
        // 🔥 Render deployment (badilisha na URL yako baada ya kudeploy)
        process.env.FRONTEND_URL || 'https://foodexpress-frontend.onrender.com'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Logger
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        skip: (req, res) => res.statusCode < 400
    }));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// 🔥 SERVE FRONTEND FILES (STATIC)
// ============================================

// Serve frontend files - HII NI MUHIMU SANA!
// Hii inafanya backend yako iweze kuserve HTML files moja kwa moja
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// ============================================
// 🔥 API ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/admin', adminRoutes);

// ============================================
// 🔥 ROOT ENDPOINTS
// ============================================

// API Health check
app.get('/api', (req, res) => {
    res.json({ 
        success: true,
        message: '🍔 Food Express Backend API', 
        status: 'running',
        version: '1.0.0',
        environment: NODE_ENV,
        endpoints: {
            auth: '/api/auth',
            menu: '/api/menu',
            orders: '/api/orders',
            cart: '/api/cart',
            users: '/api/users',
            restaurants: '/api/restaurants',
            admin: '/api/admin'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV
    });
});

// ============================================
// 🔥 SERVE FRONTEND HTML PAGES
// ============================================

// Serve index.html kwenye root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve all HTML pages moja kwa moja
app.get('/*.html', (req, res) => {
    const pagePath = path.join(__dirname, '../frontend', req.path);
    res.sendFile(pagePath, (err) => {
        if (err) {
            // Kama file haipo, serve 404 page
            res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
        }
    });
});

// ============================================
// 🔥 ERROR HANDLING
// ============================================

// 404 handler for API
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'API endpoint not found',
        requestedUrl: req.originalUrl,
        method: req.method
    });
});

// 404 handler for frontend
app.use('*', (req, res) => {
    // Kama ni API request
    if (req.originalUrl.startsWith('/api')) {
        res.status(404).json({ 
            success: false,
            error: 'Route not found'
        });
    } else {
        // Kama ni frontend page, serve 404.html
        res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', {
        message: err.message,
        url: req.originalUrl,
        method: req.method
    });
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    // Kama ni API request
    if (req.originalUrl.startsWith('/api')) {
        res.status(statusCode).json({
            success: false,
            error: message,
            ...(NODE_ENV === 'development' && { stack: err.stack })
        });
    } else {
        // Kama ni frontend page, redirect to error page
        res.status(statusCode).send(`
            <!DOCTYPE html>
            <html>
                <head><title>Error</title></head>
                <body>
                    <h1>${statusCode} - ${message}</h1>
                    <a href="/">Back to Home</a>
                </body>
            </html>
        `);
    }
});

// ============================================
// SERVER STARTUP
// ============================================

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🍔 FOOD EXPRESS BACKEND SERVER');
    console.log('='.repeat(60));
    console.log(`✅ Server started successfully!`);
    console.log(`⚡ Environment: ${NODE_ENV}`);
    console.log(`🌐 API URL: http://localhost:${PORT}/api`);
    console.log(`🏠 Frontend URL: http://localhost:${PORT}`);
    console.log(`📁 Frontend Path: ${path.join(__dirname, '../frontend')}`);
    console.log('='.repeat(60));
    console.log('📌 Available Frontend Pages:');
    console.log(`   - Home: http://localhost:${PORT}`);
    console.log(`   - Login: http://localhost:${PORT}/login.html`);
    console.log(`   - Signup: http://localhost:${PORT}/signup.html`);
    console.log(`   - Menu: http://localhost:${PORT}/menu.html`);
    console.log(`   - Cart: http://localhost:${PORT}/cart.html`);
    console.log(`   - Checkout: http://localhost:${PORT}/checkout.html`);
    console.log(`   - Orders: http://localhost:${PORT}/orders.html`);
    console.log(`   - Profile: http://localhost:${PORT}/profile.html`);
    console.log('='.repeat(60));
    console.log('📌 API Endpoints:');
    console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
    console.log(`   - Menu: http://localhost:${PORT}/api/menu`);
    console.log(`   - Orders: http://localhost:${PORT}/api/orders`);
    console.log('='.repeat(60));
});

// ============================================
// ERROR HANDLING
// ============================================

server.on('error', (error) => {
    console.error('❌ Server Error:', error);
    
    if (error.code === 'EADDRINUSE') {
        console.error(`⚠️ Port ${PORT} is already in use!`);
        console.log(`💡 Try: PORT=5001 npm start`);
    }
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    server.close(() => {
        console.log('✅ HTTP server closed');
        console.log('👋 Goodbye!');
        process.exit(0);
    });
    
    setTimeout(() => {
        console.error('⚠️ Forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = app;
