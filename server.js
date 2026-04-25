/* ============================================================
   SWIFT E-COMM BACKEND - Main Server File
   This is the entry point for the backend API
============================================================ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();

/* ============================================================
   DATABASE CONNECTION
============================================================ */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ Database Connection Failed:', err.message);
    process.exit(1);
  }
};
connectDB();

/* ============================================================
   MIDDLEWARE
============================================================ */
app.use(helmet());           // Security headers
app.use(morgan('dev'));      // Logging
app.use(express.json());     // Parse JSON body

// CORS - Allow ALL origins for development (we'll restrict for production later)
app.use(cors());

// Rate limiting - Prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // Max 100 requests per window per IP
  message: { message: 'Too many requests. Try again later.' }
});
app.use('/api/', limiter);

/* ============================================================
   ROUTES
============================================================ */
app.use('/api/contact',     require('./routes/contact'));
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/quotes',      require('./routes/quotes'));
app.use('/api/products',    require('./routes/products'));
app.use('/api/orders',      require('./routes/orders'));
app.use('/api/newsletter',  require('./routes/newsletter'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: '✅ Swift E-Comm API is running',
    version: '1.0.0',
    endpoints: [
      'POST /api/contact - Contact form',
      'POST /api/auth/register - Sign up',
      'POST /api/auth/login - Sign in',
      'POST /api/quotes - Request quote',
      'GET  /api/products - Get products',
      'POST /api/orders - Create order',
      'POST /api/newsletter - Subscribe'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    message: 'Something went wrong on our end. Please try again.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/* ============================================================
   START SERVER
============================================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log(`🚀 Swift E-Comm API running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════════════');
  console.log('');
});
