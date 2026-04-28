const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderNumber: { type: String, unique: true },
  items: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productId: Number,
    name:     String,
    price:    Number,
    quantity: Number,
    image:    String
  }],
  subtotal:   { type: Number, required: true },
  shipping:   { type: Number, default: 0 },
  tax:        { type: Number, default: 0 },
  total:      { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zip: String,
    country: { type: String, default: 'United States' }
  },
  customerEmail: String,
  customerPhone: String,
  notes: String,                    // Customer notes
  internalNotes: String,            // Admin-only notes
  trackingNumber: String,
  cancelReason: String,             // Reason for cancellation
  statusHistory: [{                 // Track all status changes
    status: String,
    changedAt: { type: Date, default: Date.now },
    note: String
  }],
  createdAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'SE-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
