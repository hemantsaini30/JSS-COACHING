const mongoose = require('mongoose');

const doubtMessageSchema = new mongoose.Schema({
  sessionId:    { type: mongoose.Schema.Types.ObjectId, ref: 'DoubtSession', required: true },
  senderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole:   { type: String, enum: ['student', 'teacher'], required: true },
  type:         { type: String, enum: ['text', 'image', 'voice'], default: 'text' },
  text:         { type: String, default: '' },
  fileUrl:      { type: String, default: '' },       // Cloudinary secure URL
  filePublicId: { type: String, default: '' },       // for deletion on cleanup
  fileMimeType: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('DoubtMessage', doubtMessageSchema);