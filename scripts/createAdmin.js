/* ============================================================
   CREATE ADMIN USER
   Run this ONCE to create your admin account.
   Usage: node scripts/createAdmin.js
============================================================ */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (q) => new Promise(resolve => rl.question(q, resolve));

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔐 Create Admin Account for Swift E-Comm\n');

    const firstName = await ask('First Name: ');
    const lastName = await ask('Last Name: ');
    const email = await ask('Email: ');
    const password = await ask('Password (min 6 chars): ');

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('\n⚠️  User with this email already exists.');
      const update = await ask('Update to admin role? (y/n): ');
      if (update.toLowerCase() === 'y') {
        existing.role = 'admin';
        existing.password = password;
        await existing.save();
        console.log('\n✅ User upgraded to admin successfully!');
      }
    } else {
      await User.create({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password,
        role: 'admin',
        emailVerified: true
      });
      console.log('\n✅ Admin account created successfully!');
    }

    console.log('\n📝 Login Details:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🌐 You can now log in at the admin portal.\n');

    rl.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

createAdmin();
