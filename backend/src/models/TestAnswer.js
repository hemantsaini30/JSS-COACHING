const mongoose = require('mongoose');

const testAnswerSchema = new mongoose.Schema({
  submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSubmission', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedOption: { type: String, enum: ['A', 'B', 'C', 'D', null], default: null },
  isCorrect: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('TestAnswer', testAnswerSchema);