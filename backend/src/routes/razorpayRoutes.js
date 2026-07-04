const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createOrder, verifyPayment, getOnlinePayments } = require('../controllers/razorpayController');

router.post('/create-order', protect, authorize('student'), createOrder);
router.post('/verify-payment', protect, authorize('student'), verifyPayment);
router.get('/online-payments', protect, authorize('admin'), getOnlinePayments);

module.exports = router;