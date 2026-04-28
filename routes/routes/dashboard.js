const express = require('express');
const router = express.Router();
const { adminOnly } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Contact = require('../models/Contact');
const Newsletter = require('../models/Newsletter');

/**
 * GET /api/admin/dashboard
 * Returns all dashboard metrics in one call
 */
router.get('/', adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // ===== ORDERS =====
    const totalOrders = await Order.countDocuments();
    const ordersToday = await Order.countDocuments({ createdAt: { $gte: startOfDay } });
    const ordersWeek = await Order.countDocuments({ createdAt: { $gte: startOfWeek } });
    const ordersMonth = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });

    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    // ===== REVENUE =====
    const revenueAggregation = async (startDate) => {
      const result = await Order.aggregate([
        { 
          $match: { 
            status: { $ne: 'cancelled' },
            ...(startDate && { createdAt: { $gte: startDate } })
          } 
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);
      return result[0]?.total || 0;
    };

    const revenueAll = await revenueAggregation();
    const revenueToday = await revenueAggregation(startOfDay);
    const revenueWeek = await revenueAggregation(startOfWeek);
    const revenueMonth = await revenueAggregation(startOfMonth);

    // ===== CONTACTS =====
    const totalContacts = await Contact.countDocuments();
    const newContacts = await Contact.countDocuments({ status: 'new' });

    // ===== NEWSLETTER =====
    const totalSubscribers = await Newsletter.countDocuments({ subscribed: true });

    // ===== PRODUCTS =====
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ active: true });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    // ===== TOP SELLING PRODUCTS =====
    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { 
        $group: { 
          _id: '$items.name', 
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        } 
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // ===== RECENT ORDERS =====
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber customerEmail shippingAddress total status createdAt');

    // ===== RECENT CONTACTS =====
    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email service status createdAt');

    // ===== ORDERS BY DAY (last 7 days for chart) =====
    const ordersChart = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await Order.countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });
      const revenueResult = await Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: dayStart, $lte: dayEnd },
            status: { $ne: 'cancelled' }
          } 
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);

      ordersChart.push({
        date: dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        orders: count,
        revenue: revenueResult[0]?.total || 0
      });
    }

    // ===== STATUS DISTRIBUTION (for pie/bar chart) =====
    const statusChart = [
      { status: 'Pending', count: pendingOrders, color: '#F59E0B' },
      { status: 'Confirmed', count: confirmedOrders, color: '#3B82F6' },
      { status: 'Shipped', count: shippedOrders, color: '#8B5CF6' },
      { status: 'Delivered', count: deliveredOrders, color: '#10B981' },
      { status: 'Cancelled', count: cancelledOrders, color: '#EF4444' }
    ];

    res.json({
      orders: {
        total: totalOrders,
        today: ordersToday,
        week: ordersWeek,
        month: ordersMonth,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders
      },
      revenue: {
        all: revenueAll,
        today: revenueToday,
        week: revenueWeek,
        month: revenueMonth
      },
      contacts: {
        total: totalContacts,
        new: newContacts
      },
      newsletter: {
        subscribers: totalSubscribers
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        outOfStock: outOfStockProducts
      },
      topProducts,
      recentOrders,
      recentContacts,
      charts: {
        ordersChart,
        statusChart
      },
      lastUpdated: new Date()
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
