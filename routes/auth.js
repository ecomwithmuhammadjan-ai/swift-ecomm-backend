const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail, emailTemplate } = require('../config/email');
const { protect } = require('../middleware/auth');

// Helper: Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/**
 * POST /api/auth/register
 * Sign up a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, companyName } = req.body;

    // Validate
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Create user
    const user = await User.create({ firstName, lastName, email, password, phone, companyName });

    // Send welcome email
    const welcomeContent = `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Welcome to Swift E-Comm & Fulfillment! Your account has been successfully created.</p>
      <div class="info-box">
        <p><strong>What's next?</strong></p>
        <p style="margin:8px 0;">✅ Request a custom quote for your fulfillment needs</p>
        <p style="margin:8px 0;">✅ Explore our packaging supplies shop</p>
        <p style="margin:8px 0;">✅ Access your dashboard anytime</p>
      </div>
      <p>Ready to start shipping smarter?</p>
    `;

    try {
      await sendEmail({
        to: email,
        subject: '🎉 Welcome to Swift E-Comm!',
        html: emailTemplate(`Welcome, ${firstName}!`, welcomeContent, 'Get Your Quote', `${process.env.CLIENT_URL}/#quote`)
      });
    } catch (e) { console.log('Welcome email skipped:', e.message); }

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Sign in a user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
