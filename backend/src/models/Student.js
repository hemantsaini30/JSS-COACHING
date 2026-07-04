const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, required: true, trim: true },
  parentPhone: { type: String, required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  monthlyFee: { type: Number, default: 0 },
  feeStatus: { type: String, enum: ['paid', 'pending', 'partial'], default: 'pending' },
  joiningDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);