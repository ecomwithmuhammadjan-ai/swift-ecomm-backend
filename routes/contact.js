const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { sendEmail, emailTemplate } = require('../config/email');

/**
 * POST /api/contact
 * Handle contact form submissions
 * - Saves to database
 * - Sends email to admin
 * - Sends confirmation email to user
 */
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, service, orderVolume, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ 
        message: 'Please fill in all required fields (First Name, Last Name, Email, Message).' 
      });
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    // Save to database
    const contact = await Contact.create({
      firstName, lastName, email, phone, service, orderVolume, message
    });

    /* ============================================================
       EMAIL 1: Send notification to ADMIN
    ============================================================ */
    const adminContent = `
      <p>You have a new inquiry from the Swift E-Comm website:</p>
      <div class="info-box">
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Service Interested In:</strong> ${service || 'Not specified'}</p>
        <p><strong>Monthly Order Volume:</strong> ${orderVolume || 'Not specified'}</p>
      </div>
      <p><strong>Message:</strong></p>
      <p style="background:#F7F9FC;padding:16px;border-radius:6px;">${message.replace(/\n/g, '<br>')}</p>
      <p style="font-size:13px;color:#94A3B8;margin-top:24px;">Submitted at: ${new Date().toLocaleString()}</p>
    `;

    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `🔔 New Lead: ${firstName} ${lastName} - ${service || 'General Inquiry'}`,
      html: emailTemplate('New Contact Form Submission', adminContent, `Reply to ${firstName}`, `mailto:${email}`)
    });

    /* ============================================================
       EMAIL 2: Send confirmation to USER
    ============================================================ */
    const userContent = `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Thank you for reaching out to Swift E-Comm & Fulfillment! We've received your message and our team will review it carefully.</p>
      <div class="info-box">
        <p><strong>What happens next?</strong></p>
        <p style="margin:8px 0;">✅ A member of our team will contact you within <strong>24 business hours</strong></p>
        <p style="margin:8px 0;">✅ We'll discuss your specific fulfillment needs</p>
        <p style="margin:8px 0;">✅ You'll receive a custom quote tailored to your business</p>
      </div>
      <p>In the meantime, feel free to explore our services or reach out directly if you have urgent questions.</p>
      <p><strong>Have an urgent question?</strong><br>
      📧 Email: hello@swiftecomm.com<br>
      📞 Phone: +1 (800) 555-0199</p>
      <p style="margin-top:24px;">Thanks for considering Swift — we're excited to help scale your business!</p>
      <p><strong>— The Swift E-Comm Team</strong></p>
    `;

    await sendEmail({
      to: email,
      subject: '✅ We received your message - Swift E-Comm',
      html: emailTemplate(`Thanks for reaching out, ${firstName}!`, userContent)
    });

    res.status(201).json({ 
      message: 'Message sent successfully! Check your email for confirmation.',
      contactId: contact._id 
    });

  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ 
      message: 'Something went wrong. Please try again or email us directly at hello@swiftecomm.com'
    });
  }
});

/**
 * GET /api/contact (admin only - view all submissions)
 */
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
