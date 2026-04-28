const express = require('express');
const router = express.Router();
const { adminOnly } = require('../middleware/auth');
const Product = require('../models/Product');

/**
 * GET /api/admin/products
 * Get ALL products (including inactive)
 */
router.get('/', adminOnly, async (req, res) => {
  try {
    const { category, search, active } = req.query;
    const filter = {};

    if (category && category !== 'all') filter.category = category;
    if (active === 'true') filter.active = true;
    if (active === 'false') filter.active = false;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/admin/products
 * Create new product
 */
router.post('/', adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/products/:id
 * Update product (full update)
 */
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated successfully', product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * PATCH /api/admin/products/:id/toggle
 * Quick toggle active/inactive
 */
router.patch('/:id/toggle', adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.active = !product.active;
    product.updatedAt = new Date();
    await product.save();

    res.json({ 
      message: `Product ${product.active ? 'activated' : 'deactivated'}`, 
      product 
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * DELETE /api/admin/products/:id
 */
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
