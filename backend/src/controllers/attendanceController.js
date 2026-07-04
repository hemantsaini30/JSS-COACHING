const Attendance    = require('../models/Attendance');
const Student       = require('../models/Student');
const BatchSession  = require('../models/BatchSession');

const canAccessBatch = (user, batchId) => {
  if (user.role !== 'teacher') return true;
  return user.assignedBatches.map(id => id.toString()).includes(batchId.toString());
};

const pad = (n) => String(n).padStart(2, '0');

// All distinct class dates for a batch (BatchSessions + legacy Attendance dates)
const getAllClassDates = async (batchId) => {
  const [sessions, attDates] = await Promise.all([
    BatchSession.find({ batchId }).distinct('date'),
    Attendance.find({ batchId }).distinct('date'),
  ]);
  return [...new Set([...sessions, ...attDates])];
};

// Class dates for a specific month only
const getMonthClassDates = async (batchId, year, month) => {
  const start = `${year}-${pad(month)}-01`;
  const end   = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;
  const [sessions, attDates] = await Promise.all([
    BatchSession.find({ batchId, date: { $gte: start, $lte: end } }).distinct('date'),
    Attendance.find({ batchId, date: { $gte: start, $lte: end } }).distinct('date'),
  ]);
  return [...new Set([...sessions, ...attDates])].sort();
};

// ── mark attendance ─────────────────────────────────────────

const markAttendance = async (req, res, next) => {
  try {
    const { batchId, date, records } = req.body;
    if (!batchId || !date || !records || !Array.isArray(records))
      return res.status(400).json({ success: false, message: 'batchId, date and records are required' });
    if (!canAccessBatch(req.user, batchId))
      return res.status(403).json({ success: false, message: 'You are not assigned to this batch' });

    // 24-hour lock for teachers — admins bypass
    if (req.user.role === 'teacher') {
      const today     = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (date !== today && date !== yesterday)
        return res.status(403).json({
          success: false,
          message: 'Teachers can only mark attendance for today or yesterday. Contact admin for older corrections.',
        });
    }

    const ops = records.map(({ studentId, status }) => ({
      updateOne: {
        filter: { studentId, date },
        update: { $set: { studentId, batchId, date, status, markedBy: req.user._id } },
        upsert: true,
      }
    }));
    await Attendance.bulkWrite(ops);

    // Record that class was held on this date
    await BatchSession.findOneAndUpdate({ batchId, date }, { batchId, date }, { upsert: true, new: true });

    res.json({ success: true, message: 'Attendance saved successfully' });
  } catch (error) { next(error); }
};

// ── get attendance by batch + date ──────────────────────────

const getAttendanceByBatchAndDate = async (req, res, next) => {
  try {
    const { batchId, date } = req.query;
    if (!batchId || !date)
      return res.status(400).json({ success: false, message: 'batchId and date are required' });
    if (!canAccessBatch(req.user, batchId))
      return res.status(403).json({ success: false, message: 'You are not assigned to this batch' });
    const records = await Attendance.find({ batchId, date }).populate('studentId', 'fullName');
    res.json({ success: true, data: records });
  } catch (error) { next(error); }
};

// ── student's own overall attendance (overview card) ────────

const getAttendanceByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || student._id.toString() !== studentId)
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const records = await Attendance.find({ studentId }).sort({ date: -1 });
    const present = records.filter(r => r.status === 'present').length;
    const total   = records.length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
    res.json({ success: true, data: { records, total, present, absent: total - present, percentage } });
  } catch (error) { next(error); }
};

// ── summary table ────────────────────────────────────────────

const getBatchAttendanceSummary = async (req, res, next) => {
  try {
    const { batchId } = req.query;
    if (!batchId) return res.status(400).json({ success: false, message: 'Batch ID is required' });
    if (!canAccessBatch(req.user, batchId))
      return res.status(403).json({ success: false, message: 'You are not assigned to this batch' });

    const allClassDates = await getAllClassDates(batchId);
    const totalClasses  = allClassDates.length;

    const students = await Student.find({ batchId }).populate('userId', 'username');
    const summary = await Promise.all(students.map(async (student) => {
      const records = await Attendance.find({ studentId: student._id });
      const present = records.filter(r => r.status === 'present').length;
      const absent  = records.filter(r => r.status === 'absent').length;
      const percentage = totalClasses === 0 ? 0 : Math.round((present / totalClasses) * 100);
      return { studentId: student._id, fullName: student.fullName, username: student.userId?.username, present, absent, total: totalClasses, percentage };
    }));
    res.json({ success: true, data: summary });
  } catch (error) { next(error); }
};

// ── datewise (kept for backward compat) ─────────────────────

const getDatewiseAttendance = async (req, res, next) => {
  try {
    const { batchId } = req.query;
    if (!batchId) return res.status(400).json({ success: false, message: 'Batch ID is required' });
    if (!canAccessBatch(req.user, batchId))
      return res.status(403).json({ success: false, message: 'You are not assigned to this batch' });
    const records = await Attendance.find({ batchId }).sort({ date: 1 });
    const dateMap = {};
    records.forEach(r => {
      if (!dateMap[r.date]) dateMap[r.date] = { date: r.date, present: 0, absent: 0 };
      if (r.status === 'present') dateMap[r.date].present++;
      else dateMap[r.date].absent++;
    });
    res.json({ success: true, data: Object.values(dateMap) });
  } catch (error) { next(error); }
};

// ── student's own monthly calendar ──────────────────────────

const getMyCalendar = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) return res.status(400).json({ success: false, message: 'year and month required' });

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const start   = `${year}-${pad(month)}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end     = `${year}-${pad(month)}-${pad(lastDay)}`;

    const [records, classDates] = await Promise.all([
      Attendance.find({ studentId: student._id, date: { $gte: start, $lte: end } }).select('date status'),
      getMonthClassDates(student.batchId, year, month),
    ]);

    const recordMap = {};
    records.forEach(r => { recordMap[r.date] = r.status; });
    const classSet  = new Set(classDates);
    const today     = new Date().toISOString().split('T')[0];

    let present = 0, absent = 0, holiday = 0;
    classDates.forEach(d => { if (recordMap[d] === 'present') present++; else absent++; });
    for (let d = 1; d <= lastDay; d++) {
      const ds = `${year}-${pad(month)}-${pad(d)}`;
      if (ds > today) break;
      if (!classSet.has(ds)) holiday++;
    }
    const percentage = (present + absent) === 0 ? 0 : Math.round((present / (present + absent)) * 100);

    res.json({
      success: true,
      data: {
        records: records.map(r => ({ date: r.date, status: r.status })),
        classDates,
        monthStats: { present, absent, holiday, percentage },
      },
    });
  } catch (error) { next(error); }
};

// ── admin/teacher: any student's calendar ───────────────────

const getStudentCalendar = async (req, res, next) => {
  try {
    const { studentId, batchId, year, month } = req.query;
    if (!studentId || !batchId || !year || !month)
      return res.status(400).json({ success: false, message: 'studentId, batchId, year and month required' });
    if (!canAccessBatch(req.user, batchId))
      return res.status(403).json({ success: false, message: 'You are not assigned to this batch' });

    const start   = `${year}-${pad(month)}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end     = `${year}-${pad(month)}-${pad(lastDay)}`;

    const [records, classDates] = await Promise.all([
      Attendance.find({ studentId, date: { $gte: start, $lte: end } }).select('date status'),
      getMonthClassDates(batchId, year, month),
    ]);

    const recordMap = {};
    records.forEach(r => { recordMap[r.date] = r.status; });
    const classSet  = new Set(classDates);
    const today     = new Date().toISOString().split('T')[0];

    let present = 0, absent = 0, holiday = 0;
    classDates.forEach(d => { if (recordMap[d] === 'present') present++; else absent++; });
    for (let d = 1; d <= lastDay; d++) {
      const ds = `${year}-${pad(month)}-${pad(d)}`;
      if (ds > today) break;
      if (!classSet.has(ds)) holiday++;
    }
    const percentage = (present + absent) === 0 ? 0 : Math.round((present / (present + absent)) * 100);

    res.json({
      success: true,
      data: {
        records: records.map(r => ({ date: r.date, status: r.status })),
        classDates,
        monthStats: { present, absent, holiday, percentage },
      },
    });
  } catch (error) { next(error); }
};

// ── batch calendar (date cells with present counts) ─────────

const getBatchCalendar = async (req, res, next) => {
  try {
    const { batchId, year, month } = req.query;
    if (!batchId || !year || !month)
      return res.status(400).json({ success: false, message: 'batchId, year and month required' });
    if (!canAccessBatch(req.user, batchId))
      return res.status(403).json({ success: false, message: 'You are not assigned to this batch' });

    const start   = `${year}-${pad(month)}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end     = `${year}-${pad(month)}-${pad(lastDay)}`;

    const [totalStudents, records, classDates] = await Promise.all([
      Student.countDocuments({ batchId }),
      Attendance.find({ batchId, date: { $gte: start, $lte: end } }).select('date status'),
      getMonthClassDates(batchId, year, month),
    ]);

    const dateMap = {};
    records.forEach(r => {
      if (!dateMap[r.date]) dateMap[r.date] = { present: 0, absent: 0 };
      if (r.status === 'present') dateMap[r.date].present++;
      else dateMap[r.date].absent++;
    });
    classDates.forEach(d => { if (!dateMap[d]) dateMap[d] = { present: 0, absent: 0 }; });

    const days = [];
    for (let d = 1; d <= lastDay; d++) {
      const ds   = `${year}-${pad(month)}-${pad(d)}`;
      const data = dateMap[ds];
      days.push(data
        ? { date: ds, hasClass: true, present: data.present, absent: data.absent, total: totalStudents }
        : { date: ds, hasClass: false }
      );
    }

    res.json({ success: true, data: { days, totalStudents } });
  } catch (error) { next(error); }
};

module.exports = {
  markAttendance, getAttendanceByBatchAndDate, getAttendanceByStudent,
  getBatchAttendanceSummary, getDatewiseAttendance,
  getMyCalendar, getStudentCalendar, getBatchCalendar,
};