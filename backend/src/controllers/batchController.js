const Batch = require('../models/Batch');

const createBatch = async (req, res, next) => {
  try {
    const { name, course, description } = req.body;
    if (!name || !course) {
      return res.status(400).json({ success: false, message: 'Name and course are required' });
    }
    const existing = await Batch.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Batch name already exists' });
    }
    const batch = await Batch.create({ name, course, description });
    res.status(201).json({ success: true, message: 'Batch created', data: batch });
  } catch (error) {
    next(error);
  }
};

const getAllBatches = async (req, res, next) => {
  try {
    const assignedBatches = req.user.assignedBatches ?? []
    const query = req.user.role === 'teacher'
      ? { _id: { $in: assignedBatches } }
      : {}
    const batches = await Batch.find(query).sort({ createdAt: -1 })
    res.json({ success: true, data: batches })
  } catch (error) {
    next(error)
  }
}

const deleteBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    res.json({ success: true, message: 'Batch deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBatch, getAllBatches, deleteBatch };