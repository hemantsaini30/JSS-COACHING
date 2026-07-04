const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['admin', 'teacher'], required: true },
  senderName: { type: String, default: '' },
  title:      { type: String, required: true },
  message:    { type: String, required: true },
  targetType: {
    type: String,
    enum: ['all_teachers', 'all_students', 'everyone', 'batch'],
    required: true,
  },
  targetBatchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);