const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String },
  price:       { type: Number, required: true },
  oldPrice:    { type: Number },
  category:    { type: String, enum: ['boxes', 'mailers', 'tape', 'protection'], required: true },
  stock:       { type: Number, default: 0 },
  image:       { type: String },
  images:      [{ type: String }],
  rating:      { type: Number, default: 0, min: 0, max: 5 },
  reviews:     { type: Number, default: 0 },
  badge:       { type: String }, // 'sale', 'new-badge', 'featured'
  badgeText:   { type: String },
  featured:    { type: Boolean, default: false },
  active:      { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
