const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  firstName:    { type: String, required: true },
  lastName:     { type: String, required: true },
  email:        { type: String, required: true, lowercase: true },
  phone:        { type: String },
  companyName:  { type: String, required: true },
  website:      { type: String },
  monthlyOrders: { type: String, required: true },
  productType:  { type: String, required: true },
  storageNeeds: { type: String },
  currentProvider: { type: String },
  services:     [{ type: String }], // Array: ['Warehousing', 'Pick Pack Ship', 'Returns']
  additionalInfo: { type: String },
  status:       { type: String, enum: ['pending', 'reviewing', 'quoted', 'accepted', 'rejected'], default: 'pending' },
  quotedPrice:  { type: Number },
  quoteNotes:   { type: String },
  createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quote', quoteSchema);
