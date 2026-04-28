const express = require('express');
const router = express.Router();
const { adminOnly } = require('../middleware/auth');
const Order = require('../models/Order');
const { sendEmail, emailTemplate, isEmailConfigured } = require('../config/email');

/**
 * GET /api/admin/orders
 * Get all orders with filters and search
 */
router.get('/', adminOnly, async (req, res) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ orders, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/admin/orders/:id
 */
router.get('/:id', adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Update order status with auto-email
 */
router.patch('/:id/status', adminOnly, async (req, res) => {
  try {
    const { status, note, trackingNumber, cancelReason } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (status === 'cancelled' && !cancelReason) {
      return res.status(400).json({ message: 'Cancel reason is required.' });
    }

    const oldStatus = order.status;
    order.status = status;

    // Update timestamps
    if (status === 'confirmed') order.confirmedAt = new Date();
    if (status === 'shipped') {
      order.shippedAt = new Date();
      if (trackingNumber) order.trackingNumber = trackingNumber;
    }
    if (status === 'delivered') order.deliveredAt = new Date();
    if (status === 'cancelled') {
      order.cancelledAt = new Date();
      order.cancelReason = cancelReason;
    }

    // Add to status history
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      note: note || `Status changed from ${oldStatus} to ${status}`
    });

    await order.save();

    // Send email to customer
    if (isEmailConfigured() && order.customerEmail) {
      try {
        const statusEmails = {
          confirmed: {
            subject: `✅ Order Confirmed - ${order.orderNumber}`,
            title: 'Your Order is Confirmed!',
            content: `
              <p>Hi <strong>${order.shippingAddress.name}</strong>,</p>
              <p>Great news! Your order has been confirmed and is being prepared for shipment.</p>
              <div class="info-box">
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
              </div>
              <p>We'll send you another email once your order ships.</p>
              <p>Thank you for choosing Swift!</p>
            `
          },
          shipped: {
            subject: `🚚 Order Shipped - ${order.orderNumber}`,
            title: 'Your Order is on the Way!',
            content: `
              <p>Hi <strong>${order.shippingAddress.name}</strong>,</p>
              <p>Exciting news! Your order has been shipped and is on its way to you.</p>
              <div class="info-box">
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
              </div>
              <p>You should receive your order within 2-5 business days.</p>
            `
          },
          delivered: {
            subject: `📦 Order Delivered - ${order.orderNumber}`,
            title: 'Your Order Has Been Delivered!',
            content: `
              <p>Hi <strong>${order.shippingAddress.name}</strong>,</p>
              <p>Your order has been delivered. We hope you love it!</p>
              <div class="info-box">
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              </div>
              <p>If you have any issues, reply to this email and we'll help right away.</p>
              <p>Thank you for being a valued customer!</p>
            `
          },
          cancelled: {
            subject: `❌ Order Cancelled - ${order.orderNumber}`,
            title: 'Your Order Has Been Cancelled',
            content: `
              <p>Hi <strong>${order.shippingAddress.name}</strong>,</p>
              <p>Your order has been cancelled. We're sorry for any inconvenience.</p>
              <div class="info-box">
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Reason:</strong> ${cancelReason}</p>
              </div>
              <p>If you have questions, please reply to this email.</p>
            `
          }
        };

        if (statusEmails[status]) {
          await sendEmail({
            to: order.customerEmail,
            subject: statusEmails[status].subject,
            html: emailTemplate(statusEmails[status].title, statusEmails[status].content)
          });
        }
      } catch (emailErr) {
        console.error('Status email failed:', emailErr.message);
      }
    }

    res.json({ message: `Order ${status} successfully`, order });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/admin/orders/:id/notes
 * Update internal notes
 */
router.patch('/:id/notes', adminOnly, async (req, res) => {
  try {
    const { internalNotes } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { internalNotes },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/admin/orders/:id/address
 * Update shipping address
 */
router.patch('/:id/address', adminOnly, async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { shippingAddress },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
