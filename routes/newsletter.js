const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { sendEmail, emailTemplate } = require('../config/email');

/**
 * POST /api/newsletter
 * Subscribe to newsletter
 */
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email.' });
    }

    const existing = await Newsletter.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'You are already subscribed!' });
    }

    await Newsletter.create({ email });

    // Send welcome email
    const content = `
      <p>You're in! 🎉</p>
      <p>Thanks for subscribing to the Swift E-Comm newsletter. You'll now receive:</p>
      <div class="info-box">
        <p style="margin:8px 0;">📈 Logistics tips & industry insights</p>
        <p style="margin:8px 0;">🚀 Early access to new services & features</p>
        <p style="margin:8px 0;">💡 eCommerce growth strategies</p>
        <p style="margin:8px 0;">🎁 Exclusive offers for subscribers</p>
      </div>
      <p>Stay tuned for our first email soon!</p>
    `;

    try {
      await sendEmail({
        to: email,
        subject: '🎉 Welcome to Swift E-Comm Newsletter!',
        html: emailTemplate('Welcome aboard!', content)
      });
    } catch (e) { console.log('Newsletter email skipped:', e.message); }

    res.status(201).json({ message: 'Subscribed successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
