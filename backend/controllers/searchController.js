const Post = require('../models/Post');
const User = require('../models/User');

// Search posts by hashtag
exports.searchByHashtag = async (req, res) => {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ hashtags: `#${tag.toLowerCase()}` })
      .populate('author', 'username fullName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ hashtags: `#${tag.toLowerCase()}` });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ UPDATED: Search users (excludes guest accounts)
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.json([]);
    }
    
    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { fullName: { $regex: query, $options: 'i' } }
          ]
        },
        // ✅ EXCLUDE GUEST ACCOUNTS - Both by flag and username pattern
        { 
          $or: [
            { isGuest: { $ne: true } },
            { isGuest: { $exists: false } }
          ]
        },
        {
          username: { $not: /^guest_/i }
        }
      ]
    })
    .select('username fullName profileImage bio')
    .limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get trending hashtags
exports.getTrendingHashtags = async (req, res) => {
  try {
    const trending = await Post.aggregate([
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json(trending);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};