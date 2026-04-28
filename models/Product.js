const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price:       { type: Number, required: true },
  oldPrice:    { type: Number },                              // For sale display
  category:    { 
    type: String, 
    enum: ['boxes', 'mailers', 'tape', 'protection'], 
    required: true 
  },
  stock:       { type: Number, default: 100 },
  image:       { type: String, default: '' },                // Main image URL
  images:      [{ type: String }],                            // Additional image URLs
  rating:      { type: Number, default: 5, min: 0, max: 5 },
  reviews:     { type: Number, default: 0 },
  badge:       { type: String, default: '' },                // 'sale', 'new-badge', ''
  badgeText:   { type: String, default: '' },                // 'New', 'Sale', 'Best Seller'
  active:      { type: Boolean, default: true },             // Show on shop?
  featured:    { type: Boolean, default: false },            // Featured product?
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

// Auto-update updatedAt on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
