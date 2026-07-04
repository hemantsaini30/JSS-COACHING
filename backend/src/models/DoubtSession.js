const mongoose = require('mongoose');

const doubtSessionSchema = new mongoose.Schema({
  studentId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacherId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batchId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  title:            { type: String, default: 'Doubt' },   // first 60 chars of initial message
  isSavedByStudent: { type: Boolean, default: false },
  isSavedByTeacher: { type: Boolean, default: false },
  lastMessageAt:    { type: Date, default: Date.now },
  status:           { type: String, enum: ['open', 'resolved'], default: 'open' },
}, { timestamps: true });

// No unique index — each doubt submission creates a new session

module.exports = mongoose.model('DoubtSession', doubtSessionSchema);