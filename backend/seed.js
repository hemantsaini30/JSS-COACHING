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

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await User.create([
      {
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
      },
      {
        username: 'teacher1',
        password: await bcrypt.hash('teacher123', 10),
        role: 'teacher',
      },
      {
        username: 'student1',
        password: await bcrypt.hash('student123', 10),
        role: 'student',
      },
    ]);

    console.log('✅ Users seeded successfully');
    console.log('');
    console.log('--- Login credentials ---');
    console.log('Admin    → username: admin     | password: admin123');
    console.log('Teacher  → username: teacher1  | password: teacher123');
    console.log('Student  → username: student1  | password: student123');
    console.log('-------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seed();