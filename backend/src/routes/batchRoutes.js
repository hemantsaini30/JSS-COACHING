const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createBatch, getAllBatches, deleteBatch } = require('../controllers/batchController');

router.use(protect);

router.get('/', getAllBatches);
router.post('/', authorize('admin'), createBatch);
router.delete('/:id', authorize('admin'), deleteBatch);

module.exports = router;