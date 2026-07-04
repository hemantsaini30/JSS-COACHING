const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  markAttendance, getAttendanceByBatchAndDate, getAttendanceByStudent,
  getBatchAttendanceSummary, getDatewiseAttendance,
  getMyCalendar, getStudentCalendar, getBatchCalendar,
} = require('../controllers/attendanceController');

router.use(protect);

router.post('/',                  authorize('admin','teacher'), markAttendance);
router.get('/',                   authorize('admin','teacher'), getAttendanceByBatchAndDate);
router.get('/summary',            authorize('admin','teacher'), getBatchAttendanceSummary);
router.get('/datewise',           authorize('admin','teacher'), getDatewiseAttendance);
router.get('/my-calendar',        authorize('student'),         getMyCalendar);
router.get('/student-calendar',   authorize('admin','teacher'), getStudentCalendar);
router.get('/batch-calendar',     authorize('admin','teacher'), getBatchCalendar);
router.get('/student/:studentId',                               getAttendanceByStudent);

module.exports = router;