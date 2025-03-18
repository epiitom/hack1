const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
        try {
            const { email, password } = req.body;

            // Find user
            const user = users.find(user => user.email === email);
            if (!user) {
                return res.status(400).json({ message: 'User not found' });
            }

            // Check password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(400).json({ message: 'Invalid password' });
            }

            // Create token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        } catch (error) {
            res.status(500).json({ message: 'Error logging in', error: error.message });
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