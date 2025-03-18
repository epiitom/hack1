const express = require('express');
const router = express.Router();
const auth = require('../auth');

// Register route
router.post('/register', auth.register);

// Login route
router.post('/login', auth.login);

// Protected route example
router.get('/profile', auth.verifyToken, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router; 