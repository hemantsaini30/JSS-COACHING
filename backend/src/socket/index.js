const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Student = require('../models/Student');

const setupSocket = (io) => {
  // Auth middleware — same logic as protect, on the handshake
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;

    // Personal room — always
    socket.join(`user:${user._id}`);

    if (user.role === 'admin') {
      socket.join('role:admin');
    }

    if (user.role === 'teacher') {
      socket.join('role:teacher');
      // Teachers do NOT join batch rooms — they send TO batches, not receive from them
    }

    if (user.role === 'student') {
      socket.join('role:student');
      // Students join their batch room to receive teacher announcements
      try {
        const student = await Student.findOne({ userId: user._id }).select('batchId');
        if (student?.batchId) socket.join(`batch:${student.batchId}`);
      } catch {}
    }

    socket.on('disconnect', () => {});
  });
};

module.exports = setupSocket;