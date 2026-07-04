const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true },
  instructions: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  liveDate: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
  totalMarks: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);