const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    const hashedPassword = await bcrypt.hash('vermajss06abhay', 10);

    await User.create([
      {
        username: 'AbhayVerma9818',
        password: hashedPassword,
        role: 'admin',
      },
    ]);

    console.log('✅ Users seeded successfully');
    console.log('');
    console.log('--- Login credentials ---');
    console.log('Admin    → username: admin     | password: admin123');
    

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seed();