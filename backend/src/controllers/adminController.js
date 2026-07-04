const User = require('../models/User');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Inquiry = require('../models/Inquiry');

const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalStudents,
      totalBatches,
      todayAttendance,
      feeSummary,
      newInquiries,
      recentInquiries,
    ] = await Promise.all([
      Student.countDocuments(),
      Batch.countDocuments({ isActive: true }),
      Attendance.find({ date: today }),
      Fee.find(),
      Inquiry.countDocuments({ status: 'pending' }),
      Inquiry.find().sort({ createdAt: -1 }).limit(5),
    ]);

    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const attendancePercent = totalStudents === 0 ? 0 : Math.round((presentToday / totalStudents) * 100);

    const totalFeesDue = feeSummary.reduce((sum, f) => sum + f.amount, 0);
    const totalFeesCollected = feeSummary.reduce((sum, f) => sum + f.paidAmount, 0);
    const totalFeesPending = totalFeesDue - totalFeesCollected;

    res.json({
      success: true,
      data: {
        totalStudents,
        totalBatches,
        attendancePercent,
        presentToday,
        totalFeesDue,
        totalFeesCollected,
        totalFeesPending,
        newInquiries,
        recentInquiries,
      }
    });
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res) => {
  res.json({ success: true, message: 'Admin dashboard data' });
};

module.exports = { getDashboard, getDashboardStats };