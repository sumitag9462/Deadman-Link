const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const Otp = require('../models/Otp');
const User = require('../models/user'); 

// --- CONFIGURATION ---
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// Rate Limiter
const sendOtpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10,
    message: { message: 'Too many requests, please try again later.' }
});

// Transporter (Email)
const createTransporter = async () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
    });
};

// --- ROUTES ---

// 1. SEND OTP (Updated with Existence Check)
router.post('/send-otp', sendOtpLimiter, async (req, res) => {
    try {
        const { email, purpose = 'signin' } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });
        
        const cleanEmail = email.toLowerCase().trim();

        // --- BUG FIX STARTS HERE ---
        // If trying to Register (signup), check if user ALREADY exists.
        if (purpose === 'signup') {
            const existingUser = await User.findOne({ email: cleanEmail });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already registered. Please login.' });
            }
        }

        // If trying to Login (signin) or Forgot Password, check if user DOES NOT exist.
        if (purpose === 'signin' || purpose === 'forgot') {
            const existingUser = await User.findOne({ email: cleanEmail });
            if (!existingUser) {
                return res.status(404).json({ message: 'User not found. Please register first.' });
            }
        }
        // --- BUG FIX ENDS HERE ---

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // Store OTP
        const salt = await bcrypt.genSalt(10);
        const codeHash = await bcrypt.hash(code, salt);

        await Otp.findOneAndUpdate(
            { email: cleanEmail, purpose }, 
            { codeHash, expiresAt, used: false },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Send Email
        const transporter = await createTransporter();
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'no-reply@deadman.link',
            to: cleanEmail,
            subject: `Deadman Verification Code: ${code}`,
            text: `Your code is ${code}. It expires in 10 minutes.`,
        };

        const info = await transporter.sendMail(mailOptions);
        
        const response = { message: 'OTP sent' };
        if (nodemailer.getTestMessageUrl && nodemailer.getTestMessageUrl(info)) {
            response.previewUrl = nodemailer.getTestMessageUrl(info);
        }

        res.json(response);

    } catch (err) {
        console.error('Send OTP error:', err);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
});

// 2. VERIFY OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, code, purpose = 'signin' } = req.body;
        if (!email || !code) return res.status(400).json({ message: 'Email and code required' });

        const cleanEmail = email.toLowerCase().trim();
        const cleanCode = code.trim();

        const record = await Otp.findOne({ email: cleanEmail, purpose });
        
        if (!record) return res.status(400).json({ message: 'OTP not found. Resend code.' });
        if (record.used) return res.status(400).json({ message: 'Code already used.' });
        if (new Date() > record.expiresAt) return res.status(400).json({ message: 'Code expired.' });

        const isValid = await bcrypt.compare(cleanCode, record.codeHash);
        if (!isValid) return res.status(400).json({ message: 'Invalid code.' });

        // Mark as used
        record.used = true;
        await record.save();

        const tempToken = jwt.sign({ email: cleanEmail, purpose }, JWT_SECRET, { expiresIn: '15m' });

        res.json({ verified: true, token: tempToken });

    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. REGISTER (Final Check)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const cleanEmail = email.toLowerCase().trim();

        // DOUBLE CHECK: Just in case they bypassed the OTP check
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email: cleanEmail,
            password: hashedPassword
        });

        const token = jwt.sign(
            { id: newUser._id, role: newUser.role, email: newUser.email }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.status(201).json({ 
            token, 
            user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } 
        });

    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// 4. LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({ 
            token, 
            user: { _id: user._id, name: user.name, email: user.email, role: user.role } 
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 5. RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword, token } = req.body;
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.email !== email.toLowerCase().trim() || decoded.purpose !== 'forgot') {
                 throw new Error();
            }
        } catch (e) {
            return res.status(401).json({ message: 'Session expired. Verify OTP again.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { password: hashedPassword }
        );

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'Password updated successfully' });

    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;