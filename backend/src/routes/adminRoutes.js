const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { getDashboard, getDashboardStats } = require('../controllers/adminController');
const { getAllInquiries, updateInquiryStatus, deleteInquiry } = require('../controllers/inquiryController');
const { runFeeAutoGenerate } = require('../jobs/index');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/stats', getDashboardStats);
router.get('/inquiries', getAllInquiries);
router.patch('/inquiries/:id', updateInquiryStatus);
router.delete('/inquiries/:id', deleteInquiry);

// Manual trigger for testing — remove before final production launch
router.post('/run-fee-job', async (req, res) => {
  try {
    await runFeeAutoGenerate();
    res.json({ success: true, message: 'Fee auto-generate job completed. Check server logs.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;