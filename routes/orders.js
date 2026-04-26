const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { sendEmail, emailTemplate, isEmailConfigured } = require('../config/email');

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', async (req, res) => {
  try {
    const { items, shippingAddress, customerEmail, customerPhone, notes, subtotal, shipping, tax, total } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty.' });
    }
    if (!customerEmail) {
      return res.status(400).json({ message: 'Email is required.' });
    }
    if (!shippingAddress || !shippingAddress.street) {
      return res.status(400).json({ message: 'Shipping address is required.' });
    }

    // Save order to database
    const order = await Order.create({
      items,
      subtotal: subtotal || 0,
      shipping: shipping || 0,
      tax: tax || 0,
      total: total || 0,
      shippingAddress,
      customerEmail,
      customerPhone,
      notes,
      status: 'pending',
      paymentStatus: 'pending'
    });

    console.log('✅ New order created:', order.orderNumber);

    // Send emails (only if configured - won't crash if not)
    if (isEmailConfigured()) {
      try {
        // Build items table HTML
        const itemsHtml = items.map(i => 
          `<tr>
            <td style="padding:10px;border-bottom:1px solid #E2E8F0;">${i.name}</td>
            <td style="padding:10px;border-bottom:1px solid #E2E8F0;text-align:center;">${i.quantity}</td>
            <td style="padding:10px;border-bottom:1px solid #E2E8F0;text-align:right;">$${(i.price * i.quantity).toFixed(2)}</td>
          </tr>`
        ).join('');

        const orderTable = `
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr style="background:#F7F9FC;">
              <th style="padding:12px;text-align:left;color:#1B3A52;">Item</th>
              <th style="padding:12px;text-align:center;color:#1B3A52;">Qty</th>
              <th style="padding:12px;text-align:right;color:#1B3A52;">Price</th>
            </tr>
            ${itemsHtml}
          </table>
          <table style="width:100%;margin-top:20px;">
            <tr><td style="padding:6px;color:#64748B;">Subtotal:</td><td style="padding:6px;text-align:right;">$${(subtotal || 0).toFixed(2)}</td></tr>
            <tr><td style="padding:6px;color:#64748B;">Shipping:</td><td style="padding:6px;text-align:right;">${shipping === 0 ? 'FREE' : '$' + (shipping || 0).toFixed(2)}</td></tr>
            <tr><td style="padding:6px;color:#64748B;">Tax:</td><td style="padding:6px;text-align:right;">$${(tax || 0).toFixed(2)}</td></tr>
            <tr><td style="padding:10px 6px;border-top:2px solid #1B3A52;font-weight:700;font-size:18px;color:#1B3A52;">Total:</td>
                <td style="padding:10px 6px;text-align:right;border-top:2px solid #1B3A52;font-weight:700;font-size:18px;color:#3EAFA8;">$${(total || 0).toFixed(2)}</td></tr>
          </table>
        `;

        const addressHtml = `
          <div class="info-box">
            <p><strong>Shipping Address:</strong></p>
            <p>${shippingAddress.name}<br>
            ${shippingAddress.street}<br>
            ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}<br>
            ${shippingAddress.country}</p>
            <p><strong>Phone:</strong> ${customerPhone}</p>
          </div>
        `;

        // EMAIL 1: Confirmation to CUSTOMER
        const customerContent = `
          <p>Hi <strong>${shippingAddress.name}</strong>,</p>
          <p>Thank you for your order! We've received it and our team will review it shortly.</p>
          <div class="info-box">
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          ${orderTable}
          ${addressHtml}
          <p><strong>What happens next?</strong></p>
          <ul style="padding-left:20px;color:#64748B;line-height:1.8;">
            <li>Our team will contact you within 24 hours to confirm your order</li>
            <li>We'll arrange payment & shipping details with you directly</li>
            <li>Your order will ship within 1-2 business days after confirmation</li>
            <li>You'll receive a tracking number once shipped</li>
          </ul>
          ${notes ? `<p><strong>Your notes:</strong> ${notes}</p>` : ''}
          <p style="margin-top:24px;">Questions? Reply to this email or contact us at <strong>hello@swiftecomm.com</strong></p>
          <p>Thank you for choosing Swift!<br><strong>— The Swift E-Comm Team</strong></p>
        `;

        await sendEmail({
          to: customerEmail,
          subject: `✅ Order Confirmation #${order.orderNumber} - Swift E-Comm`,
          html: emailTemplate('Order Received!', customerContent)
        });

        // EMAIL 2: Notification to ADMIN
        const adminContent = `
          <p>🎉 You have a new order!</p>
          <div class="info-box">
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Total:</strong> $${(total || 0).toFixed(2)}</p>
            <p><strong>Customer:</strong> ${shippingAddress.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${customerEmail}">${customerEmail}</a></p>
            <p><strong>Phone:</strong> ${customerPhone}</p>
          </div>
          ${orderTable}
          ${addressHtml}
          ${notes ? `<p><strong>Customer Notes:</strong> ${notes}</p>` : ''}
          <p style="margin-top:24px;"><strong>⚡ Action Required:</strong> Contact the customer within 24 hours to confirm the order and arrange payment & shipping.</p>
        `;

        await sendEmail({
          to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
          subject: `🛒 New Order #${order.orderNumber} - $${(total || 0).toFixed(2)}`,
          html: emailTemplate('New Order Received!', adminContent, `Email ${shippingAddress.name}`, `mailto:${customerEmail}`)
        });

        console.log('📧 Order emails sent successfully');
      } catch (emailErr) {
        console.error('Email sending failed (order still saved):', emailErr.message);
        // Don't fail the request just because email failed
      }
    } else {
      console.log('📧 Email skipped - not configured');
    }

    res.status(201).json({ 
      message: 'Order placed successfully!', 
      order: {
        orderNumber: order.orderNumber,
        _id: order._id,
        total: order.total
      }
    });

  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ 
      message: 'Failed to place order. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/orders/:orderNumber
 * Get order by order number (public lookup)
 */
router.get('/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
