const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  recordPayment,
  getAllPayments,
  getMyPayments,
  getPaymentsByFee,
  deletePayment,
  getStudentLedger,
} = require('../controllers/paymentController');

router.use(protect);

router.get('/my', getMyPayments);
router.get('/', authorize('admin'), getAllPayments);
router.post('/', authorize('admin'), recordPayment);
router.get('/fee/:feeId', authorize('admin'), getPaymentsByFee);
router.get('/ledger/:studentId', authorize('admin'), getStudentLedger);

module.exports = router;