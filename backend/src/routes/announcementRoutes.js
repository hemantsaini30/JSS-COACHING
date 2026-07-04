const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  createAnnouncement, getMyNotifications,
  markAsRead, markAllAsRead, getMySentAnnouncements,
} = require('../controllers/announcementController');

router.use(protect);

router.post('/',            authorize('admin', 'teacher'), createAnnouncement);
router.get('/my',           getMyNotifications);
router.get('/sent',         authorize('admin', 'teacher'), getMySentAnnouncements);
router.patch('/read-all',   markAllAsRead);
router.patch('/:id/read',   markAsRead);

module.exports = router;