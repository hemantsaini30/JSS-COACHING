const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User         = require('../models/User');
const Student      = require('../models/Student');

// ── helpers ──────────────────────────────────────────────────

const findRecipientUserIds = async (targetType, targetBatchIds) => {
  const ids = new Set();

  if (targetType === 'all_teachers' || targetType === 'everyone') {
    const teachers = await User.find({ role: 'teacher' }).select('_id');
    teachers.forEach(t => ids.add(t._id.toString()));
  }

  if (targetType === 'all_students' || targetType === 'everyone') {
    const students = await User.find({ role: 'student' }).select('_id');
    students.forEach(s => ids.add(s._id.toString()));
  }

  if (targetType === 'batch' && targetBatchIds?.length) {
    const students = await Student.find({ batchId: { $in: targetBatchIds } }).select('userId');
    students.forEach(s => { if (s.userId) ids.add(s.userId.toString()); });
  }

  return [...ids];
};

// ── create & broadcast ───────────────────────────────────────

const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, targetType, targetBatchIds } = req.body;

    if (!title?.trim() || !message?.trim() || !targetType)
      return res.status(400).json({ success: false, message: 'title, message and targetType are required' });

    if (req.user.role === 'teacher' && targetType !== 'batch')
      return res.status(403).json({ success: false, message: 'Teachers can only send to batches' });

    if (targetType === 'batch' && (!targetBatchIds || !targetBatchIds.length))
      return res.status(400).json({ success: false, message: 'targetBatchIds required for batch announcements' });

    // Teachers can only send to their own assigned batches
    if (req.user.role === 'teacher' && targetType === 'batch') {
      const assigned = (req.user.assignedBatches || []).map(id => id.toString());
      const allValid = targetBatchIds.every(id => assigned.includes(id.toString()));
      if (!allValid)
        return res.status(403).json({ success: false, message: 'You can only send to your assigned batches' });
    }

    const senderName = req.user.fullName || req.user.username;

    const announcement = await Announcement.create({
      senderId: req.user._id,
      senderRole: req.user.role,
      senderName,
      title: title.trim(),
      message: message.trim(),
      targetType,
      targetBatchIds: targetBatchIds || [],
    });

    // Create one Notification doc per recipient (for persistence + unread count)
    const recipientIds = await findRecipientUserIds(targetType, targetBatchIds);
    // Exclude the sender themselves
    const filtered = recipientIds.filter(id => id !== req.user._id.toString());

    if (filtered.length) {
      await Notification.insertMany(
        filtered.map(recipientId => ({ recipientId, announcementId: announcement._id }))
      );
    }

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      const payload = {
        _id: announcement._id,
        title: announcement.title,
        message: announcement.message,
        senderRole: announcement.senderRole,
        senderName,
        targetType,
        createdAt: announcement.createdAt,
      };

      if (targetType === 'all_teachers') {
        io.to('role:teacher').emit('new_notification', payload);
      } else if (targetType === 'all_students') {
        io.to('role:student').emit('new_notification', payload);
      } else if (targetType === 'everyone') {
        io.to('role:teacher').to('role:student').emit('new_notification', payload);
      } else if (targetType === 'batch') {
        // Each batch room contains only students in that batch
        targetBatchIds.forEach(batchId => {
          io.to(`batch:${batchId}`).emit('new_notification', payload);
        });
      }
    }

    res.status(201).json({ success: true, message: 'Announcement sent', data: announcement });
  } catch (err) { next(err); }
};

// ── fetch notifications for logged-in user ───────────────────

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .populate('announcementId')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id, isRead: false,
    });

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) { next(err); }
};

// ── mark as read ─────────────────────────────────────────────

const markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ── sent history ─────────────────────────────────────────────

const getMySentAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find({ senderId: req.user._id })
      .populate('targetBatchIds', 'name course')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (err) { next(err); }
};

module.exports = {
  createAnnouncement, getMyNotifications,
  markAsRead, markAllAsRead, getMySentAnnouncements,
};