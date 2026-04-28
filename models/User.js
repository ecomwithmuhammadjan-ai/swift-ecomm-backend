const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName:   { type: String, required: true, trim: true },
  lastName:    { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:    { type: String, required: true, minlength: 6 },
  phone:       { type: String, trim: true },
  companyName: { type: String, trim: true },
  role:        { type: String, enum: ['customer', 'client', 'admin'], default: 'customer' },
  emailVerified: { type: Boolean, default: false },
  lastLogin:   { type: Date },
  createdAt:   { type: Date, default: Date.now }
});

// Automatically hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
