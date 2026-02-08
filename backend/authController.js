const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register user
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        
        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const userId = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address
        });
        
        // Generate token
        const token = jwt.sign(
            { userId, email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            message: 'User registered successfully',
            user: { id: userId, name, email },
            token
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
