const Student          = require('../models/Student');
const User             = require('../models/User');
const DoubtSession     = require('../models/DoubtSession');
const DoubtMessage     = require('../models/DoubtMessage');
const { uploadToCloudinary } = require('../config/cloudinary');

// ─── helpers ────────────────────────────────────────────────

const findStudent = (userId) =>
  Student.findOne({ userId }).populate('batchId', '_id name course');

const teacherOwns = (session, userId) =>
  session.teacherId.toString() === userId.toString();

const studentOwns = (session, studentId) =>
  session.studentId.toString() === studentId.toString();

const attachLastMessage = async (sessions) =>
  Promise.all(sessions.map(async (s) => {
    const last = await DoubtMessage.findOne({ sessionId: s._id })
      .sort({ createdAt: -1 })
      .select('text type senderRole createdAt');
    return { ...s.toObject(), lastMessage: last };
  }));

const uploadFile = async (file) => {
  if (!file) return { fileUrl: '', filePublicId: '', fileMimeType: '' };
  const isVoice = file.mimetype.startsWith('audio/');
  const result = await uploadToCloudinary(file.buffer, {
    resource_type: isVoice ? 'video' : 'image',
    folder: isVoice ? 'instora/doubts/voice' : 'instora/doubts/images',
  });
  return { fileUrl: result.secure_url, filePublicId: result.public_id, fileMimeType: file.mimetype };
};

const makeTitle = (text, hasFile) => {
  if (text?.trim()) return text.trim().slice(0, 60) + (text.trim().length > 60 ? '…' : '');
  if (hasFile) return '📷 Image doubt';
  return 'Doubt';
};

// ─── student: list available teachers ───────────────────────

const getAvailableTeachers = async (req, res, next) => {
  try {
    const student = await findStudent(req.user._id);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const raw = student.batchId;
    const batchIds = Array.isArray(raw)
      ? raw.map(b => b._id || b)
      : [raw?._id || raw].filter(Boolean);

    if (!batchIds.length) return res.json({ success: true, data: { teachers: [], studentBatchId: null } });

    const teachers = await User.find({ role: 'teacher', assignedBatches: { $in: batchIds } })
      .select('_id fullName username subject assignedBatches')
      .populate('assignedBatches', '_id name course');

    const result = teachers.map(t => ({
      _id: t._id,
      fullName: t.fullName || t.username,
      username: t.username,
      subject: t.subject,
      sharedBatches: t.assignedBatches.filter(b =>
        batchIds.some(bid => bid.toString() === b._id.toString())
      ),
    }));

    const studentBatchId = (batchIds[0]?._id || batchIds[0])?.toString();
    res.json({ success: true, data: { teachers: result, studentBatchId } });
  } catch (err) { next(err); }
};

// ─── student: create session(s) + initial message ───────────
// Always creates a NEW session — each doubt is its own thread

const createSessions = async (req, res, next) => {
  try {
    let { teacherIds, batchId, text, type } = req.body;

    if (typeof teacherIds === 'string') teacherIds = [teacherIds];
    if (!Array.isArray(teacherIds) || !teacherIds.length)
      return res.status(400).json({ success: false, message: 'Select at least one teacher' });
    if (!batchId)
      return res.status(400).json({ success: false, message: 'batchId is required' });
    if (!text && !req.file)
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });

    const student = await findStudent(req.user._id);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const { fileUrl, filePublicId, fileMimeType } = await uploadFile(req.file);
    const title = makeTitle(text, !!req.file);

    const sessionIds = [];
    for (const teacherId of teacherIds) {
      // Always create a fresh session — no findOne
      const session = await DoubtSession.create({
        studentId: student._id,
        teacherId,
        batchId,
        title,
      });

      await DoubtMessage.create({
        sessionId: session._id,
        senderId: req.user._id,
        senderRole: 'student',
        type: type || 'text',
        text: text || '',
        fileUrl,
        filePublicId,
        fileMimeType,
      });

      session.lastMessageAt = new Date();
      await session.save();
      sessionIds.push(session._id);
    }

    res.status(201).json({ success: true, message: 'Doubt sent', data: { sessionIds } });
  } catch (err) { next(err); }
};

// ─── student: list my sessions ──────────────────────────────

const getMySessionsStudent = async (req, res, next) => {
  try {
    const student = await findStudent(req.user._id);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const sessions = await DoubtSession.find({ studentId: student._id })
      .populate('teacherId', 'fullName username subject')
      .populate('batchId', 'name course')
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, data: await attachLastMessage(sessions) });
  } catch (err) { next(err); }
};

// ─── teacher: list sessions grouped by batch ────────────────

const getSessionsForTeacher = async (req, res, next) => {
  try {
    const sessions = await DoubtSession.find({ teacherId: req.user._id })
      .populate({ path: 'studentId', select: 'fullName userId', populate: { path: 'userId', select: 'username' } })
      .populate('batchId', '_id name course')
      .sort({ lastMessageAt: -1 });

    const withLast = await attachLastMessage(sessions);

    const map = {};
    withLast.forEach(s => {
      const key = s.batchId?._id?.toString();
      if (!map[key]) map[key] = { batch: s.batchId, sessions: [] };
      map[key].sessions.push(s);
    });

    res.json({ success: true, data: Object.values(map) });
  } catch (err) { next(err); }
};

// ─── shared: get messages ────────────────────────────────────

const getMessages = async (req, res, next) => {
  try {
    const session = await DoubtSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (req.user.role === 'teacher' && !teacherOwns(session, req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied' });

    if (req.user.role === 'student') {
      const student = await findStudent(req.user._id);
      if (!student || !studentOwns(session, student._id))
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const messages = await DoubtMessage.find({ sessionId: session._id }).sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  } catch (err) { next(err); }
};

// ─── shared: send message ────────────────────────────────────

const sendMessage = async (req, res, next) => {
  try {
    const { text, type } = req.body;
    if (!text && !req.file)
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });

    const session = await DoubtSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (req.user.role === 'teacher' && !teacherOwns(session, req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied' });

    if (req.user.role === 'student') {
      const student = await findStudent(req.user._id);
      if (!student || !studentOwns(session, student._id))
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { fileUrl, filePublicId, fileMimeType } = await uploadFile(req.file);

    const message = await DoubtMessage.create({
      sessionId: session._id,
      senderId:  req.user._id,
      senderRole: req.user.role,
      type: type || 'text',
      text: text || '',
      fileUrl,
      filePublicId,
      fileMimeType,
    });

    session.lastMessageAt = new Date();
    if (session.status === 'resolved') session.status = 'open';
    await session.save();

    res.status(201).json({ success: true, data: message });
  } catch (err) { next(err); }
};

// ─── shared: toggle save ─────────────────────────────────────

const toggleSave = async (req, res, next) => {
  try {
    const session = await DoubtSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (req.user.role === 'teacher') {
      if (!teacherOwns(session, req.user._id))
        return res.status(403).json({ success: false, message: 'Access denied' });
      session.isSavedByTeacher = !session.isSavedByTeacher;
    } else {
      const student = await findStudent(req.user._id);
      if (!student || !studentOwns(session, student._id))
        return res.status(403).json({ success: false, message: 'Access denied' });
      session.isSavedByStudent = !session.isSavedByStudent;
    }

    await session.save();
    res.json({ success: true, data: { isSavedByStudent: session.isSavedByStudent, isSavedByTeacher: session.isSavedByTeacher } });
  } catch (err) { next(err); }
};

// ─── teacher: resolve ────────────────────────────────────────

const resolveSession = async (req, res, next) => {
  try {
    const session = await DoubtSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!teacherOwns(session, req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied' });
    session.status = 'resolved';
    await session.save();
    res.json({ success: true, message: 'Session marked as resolved' });
  } catch (err) { next(err); }
};

module.exports = {
  getAvailableTeachers, createSessions, getMySessionsStudent,
  getSessionsForTeacher, getMessages, sendMessage, toggleSave, resolveSession,
};