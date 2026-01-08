const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const messageController = require('../controllers/messageController');

router.use(auth);

router.get('/conversations', messageController.getConversations);
router.get('/conversations/:userId', messageController.getOrCreateConversation);
router.get('/conversations/:conversationId/messages', messageController.getMessages);
router.post('/conversations/:conversationId/messages', messageController.sendMessage);
router.put('/conversations/:conversationId/read', messageController.markAsRead);
router.get('/unread-count', messageController.getUnreadCount);

module.exports = router;    