const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');

const app = express();

// Add CORS middleware
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173'], // Add your frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// In a real application, this would be in a database
const users = [];

const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

const auth = {
    // Register a new user
    register: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Check if user already exists
            if (users.find(user => user.email === email)) {
                return res.status(400).json({ message: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const user = {
                id: users.length + 1,
                email,
                password: hashedPassword
            };

            users.push(user);

            // Create token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        } catch (error) {
            res.status(500).json({ message: 'Error registering user', error: error.message });
        }
    },

    // Login user
    login: async (req, res) => {
        const { email, password } = req.body;
        console.log('Login attempt:', email);

        // First check if it's the test admin account
        if (email === 'admin' && password === 'password123') {
            const token = jwt.sign(
                { user: { id: 'admin' } },
                process.env.JWT_SECRET || 'hack2_campus_secret_key_2024',
                { expiresIn: '24h' }
            );
            return res.json({ 
                success: true,
                token,
                message: 'Admin login successful'
            });
        }

        try {
            // Check database for other users
            const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
            
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid credentials' 
                });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid credentials' 
                });
            }

            const token = jwt.sign(
                { user: { id: user.id } },
                process.env.JWT_SECRET || 'hack2_campus_secret_key_2024',
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token,
                message: 'Login successful'
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ 
                success: false, 
                message: 'Server error' 
            });
        }
    },

    // Middleware to verify token
    verifyToken: (req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        try {
            const verified = jwt.verify(token, JWT_SECRET);
            req.user = verified;
            next();
        } catch (error) {
            res.status(400).json({ message: 'Invalid token' });
        }
    }
};

module.exports = auth; 