/* ============================================================
   SWIFT E-COMM BACKEND - Main Server File (v2 - With Admin)
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
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests. Try again later.' }
});
app.use('/api/', limiter);

/* ============================================================
   PUBLIC ROUTES
============================================================ */
app.use('/api/contact',     require('./routes/contact'));
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/quotes',      require('./routes/quotes'));
app.use('/api/products',    require('./routes/products'));
app.use('/api/orders',      require('./routes/orders'));
app.use('/api/newsletter',  require('./routes/newsletter'));

/* ============================================================
   ADMIN ROUTES (all require admin authentication)
============================================================ */
app.use('/api/admin',           require('./routes/adminAuth'));
app.use('/api/admin/dashboard', require('./routes/dashboard'));
app.use('/api/admin/orders',    require('./routes/adminOrders'));
app.use('/api/admin/products',  require('./routes/adminProducts'));
app.use('/api/admin',           require('./routes/adminContacts'));

/* ============================================================
   HEALTH CHECK
============================================================ */
app.get('/', (req, res) => {
  res.json({ 
    status: '✅ Swift E-Comm API is running',
    version: '2.0.0',
    features: ['Public API', 'Admin Portal', 'Order Management', 'Product Management'],
    endpoints: {
      public: [
        'POST /api/contact',
        'POST /api/orders',
        'GET  /api/products',
        'POST /api/newsletter'
      ],
      admin: [
        'POST /api/admin/login',
        'GET  /api/admin/dashboard',
        'GET  /api/admin/orders',
        'PATCH /api/admin/orders/:id/status',
        'GET  /api/admin/products',
        'POST /api/admin/products',
        'PUT  /api/admin/products/:id'
      ]
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    message: 'Something went wrong on our end. Please try again.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log(`🚀 Swift E-Comm API v2.0 running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔐 Admin: http://localhost:${PORT}/api/admin/login`);
  console.log('═══════════════════════════════════════════════');
});
