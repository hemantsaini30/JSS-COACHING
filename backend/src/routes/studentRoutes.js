const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  createStudent,
  getAllStudents,
  getStudentById,
  deleteStudent,
  getMyProfile,
} = require('../controllers/studentController');

router.use(protect);

router.get('/me', getMyProfile);

router.get('/', authorize('admin', 'teacher'), getAllStudents);
router.post('/', authorize('admin'), createStudent);
router.get('/:id', authorize('admin', 'teacher'), getStudentById);
router.delete('/:id', authorize('admin'), deleteStudent);

module.exports = router;