const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

/**
 * GET /api/products
 * Get ALL active products (for public shop)
 * Inactive products show as "Out of Stock"
 */
router.get('/', async (req, res) => {
  try {
    const { category, featured, limit } = req.query;
    const filter = {};
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

module.exports = router;
