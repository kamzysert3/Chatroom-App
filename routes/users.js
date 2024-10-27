const express = require('express');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');
const privateChat = require('../models/PrivateChat');
const nodemailer = require('nodemailer')
const redis = require('redis');

const redisClient = redis.createClient({
    url: 'redis://red-csfao188fa8c739tetvg:6379'
});
redisClient.connect();

router.use(bodyParser.json())

// Use the generated secret key
const JWT_SECRET = '9878924f604a926a44cacd21fd5e9b8061c2beae286f570902d16b0229f224f9fcf4e3d046e682e614c6971327b49409626de20248677f6fcbaaba3ef063147a'; // Replace with your actual generated secret key

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'hq.chatter@gmail.com',
        pass: 'etrc kpdl meew yvnd'
    }
})

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
        const tag = await getSmallestTag()

        const user = new User({ name, email, password, tag });
        await user.save();

        const AIchat = new privateChat({
            privateChatName: [
               name.toLowerCase(),
               "ai chat"
            ].sort(),
            name: `${name}, AI chat`
        });
        await AIchat.save()

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        // Send the token in a cookie
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });

        res.status(200).json({
            redirect: '/chat',
            user: {
                name: user.name,
                email: user.email
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
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

router.post('/get_otp', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'User not found'
            });
        }
        const generateAlphanumericOtp = (length = 6) => {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let otp = '';
            for (let i = 0; i < length; i++) {
                otp += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return otp;
        };
        const setOtp = generateAlphanumericOtp(6);
        console.log(setOtp);
        
        const otpExpirationTime = 10 * 60

        await redisClient.setEx(`otp:${email}`, otpExpirationTime, setOtp)

        const mailOptions = {
            from: 'hq.chatter@gmail.com',
            to: email,
            subject: 'OTP Verification',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; text-align: center; padding: 20px;">
                    <h2 style="color: #4CAF50;">OTP Verification</h2>
                    <p>Dear ${user.name},</p>
                    <p>Your One Time Password (OTP) for verification is:</p>
                    <h1 style="background-color: #f4f4f4; display: inline-block; padding: 10px 20px; border-radius: 5px; color: #333;">${setOtp}</h1>
                    <p>Please enter this code to complete your verification. This OTP is valid for the next 10 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <br>
                    <p>Best regards,</p>
                    <p>Chatter Team</p>
                </div>
            `
        }
        // transporter.sendMail(mailOptions, (error, info) => {
        //     if (error) {
        //         console.log(error);
        //     } else {
        //         console.log('Email sent: ', info.response);
        //     }
        // });
        res.status(200).json({
            success: true,
            message: 'OTP sent successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/verify_otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        // Retrieve OTP from Redis
        const storedOtp = await redisClient.get(`otp:${email}`);
    
        if (!storedOtp) {
            return res.status(400).json({
                success: false,
                error: 'OTP not found or expired'
            });
        }

        if (storedOtp.toString() === otp.toString()) {
            await redisClient.del(`otp:${email}`);

            res.status(200).json({
                success: true,
                message: 'OTP verified successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Invalid OTP'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/change-password', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'User not found'
            });
        }
        user.password = password;
        await user.save();
        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
            redirect: '/'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Logout a User
router.get('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'strict' });
    res.redirect('/');
});

async function getSmallestTag() {

    var USERS_LIST = Array.from(await User.find())

    USERS_LIST.sort((a, b) => a.tag - b.tag);

    if (USERS_LIST.length === 0 || USERS_LIST[0].tag !== 1) {
        return 1
    }

    for (let j = 0; j < USERS_LIST.length - 1; j++) {
        if (USERS_LIST[j + 1].tag !== USERS_LIST[j].tag + 1) {
            return (USERS_LIST[j].tag + 1);
        }        
    }

    return (USERS_LIST[USERS_LIST.length - 1].tag + 1);
}

module.exports = router;
