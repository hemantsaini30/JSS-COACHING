const mongoose = require('mongoose');

const batchSessionSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  date:    { type: String, required: true },
}, { timestamps: true });

batchSessionSchema.index({ batchId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('BatchSession', batchSessionSchema);