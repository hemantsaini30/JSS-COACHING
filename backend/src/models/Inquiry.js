const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  targetCourse: { type: String, required: true },
  status: { type: String, enum: ['pending', 'contacted', 'resolved'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);