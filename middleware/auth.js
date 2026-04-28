const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Verify JWT token (any logged-in user)
 */
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ message: 'Not authorized. No token provided.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Middleware: Admin only — must be logged in AND role = 'admin'
 */
const adminOnly = async (req, res, next) => {
  // First protect (verify token)
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ message: 'Admin access required. Please log in.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired admin session. Please log in again.' });
  }
};

module.exports = { protect, adminOnly };
