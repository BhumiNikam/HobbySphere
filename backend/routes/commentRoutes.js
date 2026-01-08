const express = require('express');
const { addComment, getComments, deleteComment } = require('../controllers/commentController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/:postId/comments', auth, addComment);
router.get('/:postId/comments', auth, getComments);
router.delete('/comments/:commentId', auth, deleteComment);

module.exports = router;