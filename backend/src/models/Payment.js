const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee', required: true },
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  receiptNumber: { type: String, required: true, unique: true },
  paymentMethod: { type: String, enum: ['cash', 'online', 'cheque'], default: 'cash' },
  note: { type: String, default: '' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);