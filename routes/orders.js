const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { sendEmail, emailTemplate } = require('../config/email');
const { protect } = require('../middleware/auth');

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', async (req, res) => {
  try {
    const { items, shippingAddress, customerEmail, customerPhone } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty.' });
    }
    if (!customerEmail) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
    const tax = subtotal * 0.08;               // 8% tax
    const total = subtotal + shipping + tax;

    const order = await Order.create({
      items,
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress,
      customerEmail,
      customerPhone,
      user: req.user?._id
    });

    // Send order confirmation email
    const itemsHtml = items.map(i => 
      `<tr><td style="padding:8px;border-bottom:1px solid #E2E8F0;">${i.name}</td>
       <td style="padding:8px;border-bottom:1px solid #E2E8F0;text-align:center;">${i.quantity}</td>
       <td style="padding:8px;border-bottom:1px solid #E2E8F0;text-align:right;">$${(i.price * i.quantity).toFixed(2)}</td></tr>`
    ).join('');

    const content = `
      <p>Thank you for your order! We've received it and will process it shortly.</p>
      <div class="info-box">
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr style="background:#F7F9FC;">
          <th style="padding:10px;text-align:left;">Item</th>
          <th style="padding:10px;text-align:center;">Qty</th>
          <th style="padding:10px;text-align:right;">Price</th>
        </tr>
        ${itemsHtml}
      </table>
      <table style="width:100%;margin-top:20px;">
        <tr><td style="padding:4px;">Subtotal:</td><td style="padding:4px;text-align:right;">$${subtotal.toFixed(2)}</td></tr>
        <tr><td style="padding:4px;">Shipping:</td><td style="padding:4px;text-align:right;">$${shipping.toFixed(2)}</td></tr>
        <tr><td style="padding:4px;">Tax:</td><td style="padding:4px;text-align:right;">$${tax.toFixed(2)}</td></tr>
        <tr><td style="padding:8px 4px;border-top:2px solid #1B3A52;font-weight:700;font-size:18px;">Total:</td>
            <td style="padding:8px 4px;text-align:right;border-top:2px solid #1B3A52;font-weight:700;font-size:18px;color:#3EAFA8;">$${total.toFixed(2)}</td></tr>
      </table>
    `;

    await sendEmail({
      to: customerEmail,
      subject: `✅ Order Confirmation #${order.orderNumber}`,
      html: emailTemplate('Order Received!', content)
    });

    // Notify admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `🛒 New Order: ${order.orderNumber} - $${total.toFixed(2)}`,
      html: emailTemplate('New Order Received', content)
    });

    res.status(201).json({ message: 'Order placed successfully!', order });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/orders/my-orders
 */
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
