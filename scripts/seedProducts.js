/* ============================================================
   SEED PRODUCTS
   Migrates the 8 hardcoded products from frontend to MongoDB.
   Run this ONCE: node scripts/seedProducts.js
============================================================ */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const PRODUCTS = [
  { 
    name: 'Heavy-Duty Corrugated Shipping Box 12×10×8"', 
    description: 'Strong, double-walled corrugated boxes perfect for shipping heavy items. Pack of 25.',
    category: 'boxes', 
    price: 34.99, 
    oldPrice: 42.99, 
    stock: 150,
    rating: 5, 
    reviews: 142, 
    badge: 'new-badge', 
    badgeText: 'New', 
    image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=400&auto=format&fit=crop&q=80',
    active: true,
    featured: true
  },
  { 
    name: 'Poly Bubble Mailers 6×9" — Pack of 50', 
    description: 'Lightweight, water-resistant bubble mailers ideal for small items.',
    category: 'mailers', 
    price: 19.99, 
    stock: 300,
    rating: 5, 
    reviews: 289, 
    badge: '', 
    badgeText: 'Best Seller', 
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&auto=format&fit=crop&q=80',
    active: true,
    featured: true
  },
  { 
    name: 'Industrial Packing Tape 2" × 110 Yds — 6 Rolls', 
    description: 'Strong, clear packing tape for sealing boxes securely.',
    category: 'tape', 
    price: 24.99, 
    stock: 200,
    rating: 4, 
    reviews: 97, 
    image: 'https://images.unsplash.com/photo-1635405446898-1ac0b2b63f0a?w=400&auto=format&fit=crop&q=80',
    active: true
  },
  { 
    name: 'Large Bubble Wrap Roll 12" × 100 Ft', 
    description: 'Premium bubble wrap for protecting fragile items during shipping.',
    category: 'protection', 
    price: 21.99, 
    oldPrice: 29.99, 
    stock: 100,
    rating: 5, 
    reviews: 203, 
    badge: 'sale', 
    badgeText: 'Sale', 
    image: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400&auto=format&fit=crop&q=80',
    active: true
  },
  { 
    name: 'Flat-Rate Priority Shipping Boxes — Pack of 25', 
    description: 'USPS-compatible flat rate boxes for predictable shipping costs.',
    category: 'boxes', 
    price: 39.99, 
    stock: 80,
    rating: 5, 
    reviews: 311, 
    image: 'https://images.unsplash.com/photo-1586528116022-aeda1700e5b3?w=400&auto=format&fit=crop&q=80',
    active: true
  },
  { 
    name: 'Kraft Padded Mailers 9.5×14.5" — Pack of 25', 
    description: 'Eco-friendly kraft mailers with bubble interior for added protection.',
    category: 'mailers', 
    price: 27.99, 
    stock: 120,
    rating: 4, 
    reviews: 55, 
    badge: 'new-badge', 
    badgeText: 'New', 
    image: 'https://images.unsplash.com/photo-1595246140961-2ebe9ab1cdb3?w=400&auto=format&fit=crop&q=80',
    active: true
  },
  { 
    name: 'Thermal Shipping Labels 4×6" — 500 Count', 
    description: 'Self-adhesive thermal labels compatible with all major label printers.',
    category: 'tape', 
    price: 16.99, 
    stock: 250,
    rating: 5, 
    reviews: 178, 
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&auto=format&fit=crop&q=80',
    active: true
  },
  { 
    name: 'Foam Packing Peanuts 14 Cu Ft Bag', 
    description: 'Lightweight foam peanuts for void fill in shipping boxes.',
    category: 'protection', 
    price: 26.99, 
    oldPrice: 35.00, 
    stock: 60,
    rating: 4, 
    reviews: 88, 
    badge: 'sale', 
    badgeText: 'Sale', 
    image: 'https://images.unsplash.com/photo-1607083204963-cb94a4bb527c?w=400&auto=format&fit=crop&q=80',
    active: true
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const existing = await Product.countDocuments();
    if (existing > 0) {
      console.log(`⚠️  ${existing} products already exist in database.`);
      console.log('Run this command to delete all and reseed:');
      console.log('  await Product.deleteMany({})\n');
      console.log('Or update the script to handle existing data.\n');
      process.exit(0);
    }

    console.log(`📦 Inserting ${PRODUCTS.length} products...\n`);
    
    for (const p of PRODUCTS) {
      await Product.create(p);
      console.log(`✅ Added: ${p.name}`);
    }

    console.log(`\n🎉 Successfully seeded ${PRODUCTS.length} products!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seed();
