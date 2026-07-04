const User = require('../models/User');
const bcrypt = require('bcryptjs');

const createTeacher = async (req, res, next) => {
  try {
    const { fullName, username, password, subject, phone } = req.body;
    if (!fullName || !username || !password) {
      return res.status(400).json({ success: false, message: 'Full name, username and password are required' });
    }
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      role: 'teacher',
      fullName,
      subject: subject || '',
      phone: phone || '',
      assignedBatches: [],
    });
    res.status(201).json({
      success: true,
      message: 'Teacher account created',
      data: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        subject: user.subject,
        phone: user.phone,
        role: user.role,
        assignedBatches: [],
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllTeachers = async (req, res, next) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-password')
      .populate('assignedBatches', 'name course')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: teachers });
  } catch (error) {
    next(error);
  }
};

const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await User.findOneAndDelete({ _id: req.params.id, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.json({ success: true, message: 'Teacher account deleted' });
  } catch (error) {
    next(error);
  }
};

const resetTeacherPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    teacher.password = await bcrypt.hash(newPassword, 10);
    await teacher.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

const assignBatches = async (req, res, next) => {
  try {
    const { batchIds } = req.body;
    if (!Array.isArray(batchIds)) {
      return res.status(400).json({ success: false, message: 'batchIds must be an array' });
    }
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    teacher.assignedBatches = batchIds;
    await teacher.save();
    await teacher.populate('assignedBatches', 'name course');
    res.json({ success: true, message: 'Batches assigned successfully', data: teacher.assignedBatches });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTeacher, getAllTeachers, deleteTeacher, resetTeacherPassword, assignBatches };