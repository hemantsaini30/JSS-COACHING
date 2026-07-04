const mongoose = require('mongoose');

const testSubmissionSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  startedAt: { type: Date, required: true },
  submittedAt: { type: Date, default: null },
  status: { type: String, enum: ['in_progress', 'submitted', 'auto_submitted'], default: 'in_progress' },
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 },
}, { timestamps: true });

testSubmissionSchema.index({ studentId: 1, testId: 1 }, { unique: true });

module.exports = mongoose.model('TestSubmission', testSubmissionSchema);