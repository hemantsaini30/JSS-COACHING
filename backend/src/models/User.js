const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
  fullName: { type: String, default: '' },
  subject: { type: String, default: '' },
  phone: { type: String, default: '' },
  assignedBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);