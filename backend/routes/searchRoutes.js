const express = require('express');
const { searchByHashtag, searchUsers, getTrendingHashtags } = require('../controllers/searchController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/hashtag/:tag', auth, searchByHashtag);
router.get('/users', auth, searchUsers);
router.get('/trending', auth, getTrendingHashtags);

module.exports = router;