const mongoose = require('mongoose');

const razorpayOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  feeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amountInPaise: { type: Number, required: true },
  amountInRupees: { type: Number, required: true },
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  razorpayPaymentId: { type: String, default: null },
  razorpaySignature: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('RazorpayOrder', razorpayOrderSchema);