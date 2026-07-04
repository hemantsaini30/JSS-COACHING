const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes      = require('./routes/authRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const publicRoutes    = require('./routes/publicRoutes');
const batchRoutes     = require('./routes/batchRoutes');
const studentRoutes   = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const feeRoutes       = require('./routes/feeRoutes');
const paymentRoutes   = require('./routes/paymentRoutes');
const teacherRoutes   = require('./routes/teacherRoutes');
const testRoutes      = require('./routes/testRoutes');
const razorpayRoutes  = require('./routes/razorpayRoutes');
const doubtRoutes     = require('./routes/doubtRoutes');
const announcementRoutes = require('./routes/announcementRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));

// Increased to 10 mb to allow base64 image/voice payloads in doubt messages
app.use(express.json({ limit: '10mb' }));

// NoSQL injection guard — checks keys only so user text containing $ is allowed
const hasInjection = (obj) => {
  if (typeof obj !== 'object' || obj === null) return false;
  return Object.keys(obj).some(k =>
    k.includes('$') || k.includes('\x00') || hasInjection(obj[k])
  );
};
const noSQLInjection = (req, res, next) => {
  if (hasInjection(req.body))
    return res.status(400).json({ success: false, message: 'Invalid input' });
  next();
};
app.use(noSQLInjection);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

app.use('/api/auth',       authRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/public',     publicRoutes);
app.use('/api/batches',    batchRoutes);
app.use('/api/students',   studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees',       feeRoutes);
app.use('/api/payments',   paymentRoutes);
app.use('/api/teachers',   teacherRoutes);
app.use('/api/tests',      testRoutes);
app.use('/api/razorpay',   razorpayRoutes);
app.use('/api/doubts',     doubtRoutes);
app.use('/api/announcements', announcementRoutes);

app.get('/', (req, res) => res.json({ message: 'Instora API is running ✅' }));
app.use(errorHandler);

module.exports = app;