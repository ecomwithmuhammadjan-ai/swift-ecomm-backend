const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * GET /api/products
 * Get all products (public)
 */
router.get('/', async (req, res) => {
  try {
    const { category, featured, limit } = req.query;
    const filter = { active: true };
    if (category) filter.category = category;
    if (featured) filter.featured = true;

    let query = Product.find(filter).sort({ createdAt: -1 });
    if (limit) query = query.limit(Number(limit));

    const products = await query;
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/products/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/products (admin only)
 */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * PUT /api/products/:id (admin only)
 */
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * DELETE /api/products/:id (admin only)
 */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
