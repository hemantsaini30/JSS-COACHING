const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getStudentFeeProfile,
  addNextMonthFee,
  updateFeePayment,
  getFeeSummary,
  getMyFees,
  deleteFeeRecord,
} = require('../controllers/feeController');

router.use(protect);

router.get('/my', getMyFees);
router.get('/summary', authorize('admin'), getFeeSummary);
router.get('/student/:studentId', authorize('admin'), getStudentFeeProfile);
router.post('/student/:studentId/next-month', authorize('admin'), addNextMonthFee);
router.patch('/:id/payment', authorize('admin'), updateFeePayment);
router.delete('/:id', authorize('admin'), deleteFeeRecord);

module.exports = router;