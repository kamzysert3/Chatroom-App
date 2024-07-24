const express = require('express');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');

router.use(bodyParser.json())

// Use the generated secret key
const JWT_SECRET = '9878924f604a926a44cacd21fd5e9b8061c2beae286f570902d16b0229f224f9fcf4e3d046e682e614c6971327b49409626de20248677f6fcbaaba3ef063147a'; // Replace with your actual generated secret key

// Register a new user
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        const user = new User({ name, email, password });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        // Send the token in a cookie
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });

        res.status(200).json({
            redirect: '/chat',
            user: {
                name: user.name
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Login a User
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        // Send the token in a cookie
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });

        res.status(200).json({ 
            redirect: '/chat',
            user: {
                name: user.name
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Logout a User
router.post('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'strict' });
    res.redirect('/');
});

module.exports = router;
