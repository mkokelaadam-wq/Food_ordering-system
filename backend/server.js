const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');        // ✗ ADD THIS
const userRoutes = require('./routes/userRoutes');        // ✗ ADD THIS
const restaurantRoutes = require('./routes/restaurantRoutes'); // ✗ ADD THIS

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'https://mkokelaadam-wq.github.io'],
    credentials: true
}));
app.use(morgan('dev')); // HTTP request logger
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);        // ✗ ADD THIS
app.use('/api/users', userRoutes);       // ✗ ADD THIS
app.use('/api/restaurants', restaurantRoutes); // ✗ ADD THIS

// Health check - Improved
app.get('/', (req, res) => {
    res.json({ 
        message: '🍔 Food Express Backend API', 
        status: 'running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth',
            menu: '/api/menu',
            orders: '/api/orders',
            cart: '/api/cart',
            users: '/api/users',
            restaurants: '/api/restaurants'
        }
    });
});

// API documentation
app.get('/api', (req, res) => {
    res.json({
        message: 'Food Express API Documentation',
        endpoints: [
            { method: 'POST', path: '/api/auth/register', description: 'Register new user' },
            { method: 'POST', path: '/api/auth/login', description: 'Login user' },
            { method: 'GET', path: '/api/menu', description: 'Get all menu items' },
            { method: 'GET', path: '/api/menu/:id', description: 'Get single menu item' },
            { method: 'POST', path: '/api/orders', description: 'Create new order' },
            { method: 'POST', path: '/api/cart/add', description: 'Add item to cart' },
            { method: 'GET', path: '/api/cart', description: 'Get user cart' },
            { method: 'PUT', path: '/api/cart/:id', description: 'Update cart item' },
            { method: 'DELETE', path: '/api/cart/:id', description: 'Remove from cart' },
            { method: 'GET', path: '/api/users/profile', description: 'Get user profile' },
            { method: 'PUT', path: '/api/users/profile', description: 'Update profile' },
            { method: 'GET', path: '/api/restaurants', description: 'Get all restaurants' }
        ]
    });
});

// Static file serving for uploaded images
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
        success: false,
        error: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler - Improved
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Route not found',
        requestedUrl: req.originalUrl,
        method: req.method,
        suggestions: [
            'Check the API documentation at /api',
            'Verify the endpoint URL',
            'Ensure proper HTTP method (GET, POST, etc.)'
        ]
    });
});

// Start server with better logging
const server = app.listen(PORT, () => {
    console.log(`✅ Food Express Server started successfully!`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    console.log(`📚 Documentation: http://localhost:${PORT}/api`);
    console.log(`⏰ Server time: ${new Date().toLocaleString()}`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log(`💡 Try: kill -9 $(lsof -t -i:${PORT}) or change PORT in .env`);
        process.exit(1);
    } else {
        console.error('❌ Server error:', error);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔻 Shutting down server gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🔻 Received SIGTERM, shutting down...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Export for testing
module.exports = app;
