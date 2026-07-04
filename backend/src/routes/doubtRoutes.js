const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getAvailableTeachers, createSessions, getMySessionsStudent,
  getSessionsForTeacher, getMessages, sendMessage, toggleSave, resolveSession,
} = require('../controllers/doubtController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.use(protect);

router.get('/available-teachers',     authorize('student'),           getAvailableTeachers);
router.post('/sessions',              authorize('student'),           upload.single('file'), createSessions);
router.get('/sessions/mine',          authorize('student'),           getMySessionsStudent);
router.get('/sessions/teacher',       authorize('teacher'),           getSessionsForTeacher);
router.get('/sessions/:id/messages',  authorize('student','teacher'), getMessages);
router.post('/sessions/:id/messages', authorize('student','teacher'), upload.single('file'), sendMessage);
router.patch('/sessions/:id/save',    authorize('student','teacher'), toggleSave);
router.patch('/sessions/:id/resolve', authorize('teacher'),           resolveSession);

module.exports = router;