const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  createTest, getMyTests, getTestById, updateTest,
  addQuestion, addBulkQuestions, deleteQuestion,
  publishTest, closeTest, deleteTest,
  getAvailableTests, startTest, submitTest, getTestResult,
  getTestAnalytics, getAllTestsAdmin, getAnalyticsOverview,
  getTestLeaderboard
} = require('../controllers/testController');
const { generateQuestions } = require('../controllers/aiController');

router.post('/ai-generate', protect, authorize('teacher'), generateQuestions);
router.post('/', protect, authorize('teacher'), createTest);
router.get('/my', protect, authorize('teacher'), getMyTests);
router.get('/available', protect, authorize('student'), getAvailableTests);
router.get('/analytics/overview', protect, authorize('admin'), getAnalyticsOverview);
router.get('/', protect, authorize('admin'), getAllTestsAdmin);

router.get('/:id', protect, authorize('admin', 'teacher'), getTestById);
router.patch('/:id', protect, authorize('teacher'), updateTest);
router.delete('/:id', protect, authorize('teacher'), deleteTest);
router.post('/:id/questions', protect, authorize('teacher'), addQuestion);
router.post('/:id/questions/bulk', protect, authorize('teacher'), addBulkQuestions);
router.delete('/:id/questions/:qId', protect, authorize('teacher'), deleteQuestion);
router.patch('/:id/publish', protect, authorize('teacher'), publishTest);
router.patch('/:id/close', protect, authorize('teacher'), closeTest);
router.get('/:id/analytics', protect, authorize('admin', 'teacher'), getTestAnalytics);
router.post('/:id/start', protect, authorize('student'), startTest);
router.post('/:id/submit', protect, authorize('student'), submitTest);
router.get('/:id/result', protect, authorize('student'), getTestResult);
router.get('/:id/leaderboard', protect, authorize('student'), getTestLeaderboard);

module.exports = router;