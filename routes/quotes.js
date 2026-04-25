const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const { sendEmail, emailTemplate } = require('../config/email');

/**
 * POST /api/quotes
 * Request a custom quote
 */
router.post('/', async (req, res) => {
  try {
    const quoteData = req.body;

    if (!quoteData.firstName || !quoteData.lastName || !quoteData.email || !quoteData.companyName) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    const quote = await Quote.create(quoteData);

    // Email to admin
    const adminContent = `
      <p>A new quote request has come in:</p>
      <div class="info-box">
        <p><strong>Company:</strong> ${quoteData.companyName}</p>
        <p><strong>Contact:</strong> ${quoteData.firstName} ${quoteData.lastName}</p>
        <p><strong>Email:</strong> <a href="mailto:${quoteData.email}">${quoteData.email}</a></p>
        <p><strong>Phone:</strong> ${quoteData.phone || 'Not provided'}</p>
        <p><strong>Website:</strong> ${quoteData.website || 'Not provided'}</p>
        <p><strong>Monthly Orders:</strong> ${quoteData.monthlyOrders}</p>
        <p><strong>Product Type:</strong> ${quoteData.productType}</p>
        <p><strong>Storage Needs:</strong> ${quoteData.storageNeeds || 'Not specified'}</p>
        <p><strong>Services:</strong> ${(quoteData.services || []).join(', ')}</p>
      </div>
      ${quoteData.additionalInfo ? `<p><strong>Additional Info:</strong></p><p>${quoteData.additionalInfo}</p>` : ''}
    `;

    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `💼 New Quote Request: ${quoteData.companyName}`,
      html: emailTemplate('New Quote Request', adminContent, 'Reply Now', `mailto:${quoteData.email}`)
    });

    // Confirmation to customer
    const customerContent = `
      <p>Hi <strong>${quoteData.firstName}</strong>,</p>
      <p>Thank you for requesting a quote from Swift E-Comm & Fulfillment!</p>
      <p>We've received your request for <strong>${quoteData.companyName}</strong> and our team will prepare a custom proposal for you.</p>
      <div class="info-box">
        <p><strong>Here's what happens next:</strong></p>
        <p style="margin:8px 0;">1️⃣ Our team reviews your requirements (usually within 24 hours)</p>
        <p style="margin:8px 0;">2️⃣ We prepare a custom quote tailored to your business</p>
        <p style="margin:8px 0;">3️⃣ A dedicated account manager will contact you to discuss</p>
      </div>
      <p>In the meantime, if you have any urgent questions, feel free to reach out!</p>
    `;

    await sendEmail({
      to: quoteData.email,
      subject: '💼 Your Quote Request Received - Swift E-Comm',
      html: emailTemplate('Quote Request Received!', customerContent)
    });

    res.status(201).json({ 
      message: 'Quote request submitted successfully!',
      quoteId: quote._id 
    });
  } catch (err) {
    console.error('Quote error:', err);
    res.status(500).json({ message: 'Failed to submit quote. Please try again.' });
  }
});

module.exports = router;
