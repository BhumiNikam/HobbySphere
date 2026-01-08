const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getNotifications);
router.patch('/:notificationId/read', auth, markAsRead);
router.patch('/read-all', auth, markAllAsRead);
router.delete('/:notificationId', auth, deleteNotification);

module.exports = router;