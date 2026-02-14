const Community = require('../models/Community');
const User = require('../models/User');
const Post = require('../models/Post');
const cloudinary = require('../config/cloudinary');

// Create community
exports.createCommunity = async (req, res) => {
  try {
    const { name, description, category, privacy, rules, tags } = req.body;

    const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const existing = await Community.findOne({ slug }).lean();
    if (existing) {
      return res.status(400).json({ message: 'Community name already taken' });
    }

    let coverImage = {};
    if (req.files?.coverImage) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'hobbysphere/communities' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.files.coverImage[0].buffer);
      });
      coverImage = { url: result.secure_url, publicId: result.public_id };
    }

    const community = await Community.create({
      name,
      slug,
      description,
      category,
      privacy: privacy || 'public',
      coverImage,
      creator: req.user._id,
      moderators: [req.user._id],
      members: [req.user._id],
      memberCount: 1,
      rules: rules || '',
      tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : (tags || [])
    });

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { 
        communities: community._id,
        createdCommunities: community._id,
        moderatingCommunities: community._id
      }
    });

    const populated = await Community.findById(community._id)
      .populate('creator', 'username fullName profileImage')
      .populate('moderators', 'username fullName profileImage')
      .lean();

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ OPTIMIZED: Get all communities with membership info
exports.getCommunities = async (req, res) => {
  try {
    const { category, search, sort = 'popular', page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    let query = { privacy: 'public' };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { memberCount: -1, createdAt: -1 };
        break;
      case 'trending':
        sortOption = { isTrending: -1, memberCount: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'active':
        sortOption = { postCount: -1, createdAt: -1 };
        break;
      default:
        sortOption = { memberCount: -1 };
    }

    // ✅ Use .lean() for read-only data - 5x faster
    const [communities, total] = await Promise.all([
      Community.find(query)
        .populate('creator', 'username fullName profileImage')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Community.countDocuments(query)
    ]);

    // ✅ Add membership info for current user
    const userId = req.user._id.toString();
    const communitiesWithMembership = communities.map(community => ({
      ...community,
      isMember: community.members.some(m => m.toString() === userId),
      isCreator: community.creator._id.toString() === userId
    }));

    res.json({
      communities: communitiesWithMembership,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ OPTIMIZED: Get single community
exports.getCommunity = async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findById(id)
      .populate('creator', 'username fullName profileImage')
      .populate('moderators', 'username fullName profileImage')
      .lean();

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // ✅ Faster membership check with Set
    const memberSet = new Set(community.members.map(m => m.toString()));
    const modSet = new Set(community.moderators.map(m => m._id.toString()));
    
    const userId = req.user._id.toString();
    const isMember = memberSet.has(userId);
    const isModerator = modSet.has(userId);
    const isCreator = community.creator._id.toString() === userId;

    res.json({
      ...community,
      isMember,
      isModerator,
      isCreator
    });
  } catch (error) {
    console.error('Get community error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Join community
exports.joinCommunity = async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    if (community.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already a member of this community' });
    }

    community.members.push(req.user._id);
    community.memberCount = community.members.length;
    await community.save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { communities: community._id }
    });

    res.json({ message: 'Joined community successfully', memberCount: community.memberCount });
  } catch (error) {
    console.error('Join community error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Leave community
exports.leaveCommunity = async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    if (community.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Creator cannot leave community. Delete it instead.' });
    }

    community.members = community.members.filter(m => m.toString() !== req.user._id.toString());
    community.moderators = community.moderators.filter(m => m.toString() !== req.user._id.toString());
    community.memberCount = community.members.length;
    await community.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { 
        communities: community._id,
        moderatingCommunities: community._id
      }
    });

    res.json({ message: 'Left community successfully' });
  } catch (error) {
    console.error('Leave community error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ OPTIMIZED: Get community posts
exports.getCommunityPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // ✅ Parallel queries for speed
    const [posts, total] = await Promise.all([
      Post.find({ community: id })
        .populate('author', 'username fullName profileImage')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Post.countDocuments({ community: id })
    ]);

    res.json({
      posts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get community posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ OPTIMIZED: Get community members
exports.getCommunityMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const community = await Community.findById(id).select('members memberCount moderators creator').lean();
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const members = await User.find({ _id: { $in: community.members } })
      .select('username fullName profileImage bio')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      members,
      total: community.memberCount,
      moderators: community.moderators,
      creator: community.creator
    });
  } catch (error) {
    console.error('Get community members error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ OPTIMIZED: Get user's communities
exports.getUserCommunities = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'communities',
        populate: { path: 'creator', select: 'username fullName profileImage' }
      })
      .lean();

    res.json(user.communities);
  } catch (error) {
    console.error('Get user communities error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update community
exports.updateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, rules, tags } = req.body;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const isModerator = community.moderators.some(mod => mod.toString() === req.user._id.toString());
    if (!isModerator) {
      return res.status(403).json({ message: 'Only moderators can update community' });
    }

    if (description) community.description = description;
    if (rules) community.rules = JSON.parse(rules);
    if (tags) community.tags = JSON.parse(tags);

    await community.save();

    res.json(community);
  } catch (error) {
    console.error('Update community error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete community
exports.deleteCommunity = async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    if (community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only creator can delete community' });
    }

    if (community.coverImage?.publicId) {
      await cloudinary.uploader.destroy(community.coverImage.publicId);
    }

    await User.updateMany(
      { communities: id },
      { $pull: { communities: id, createdCommunities: id, moderatingCommunities: id } }
    );

    await Community.findByIdAndDelete(id);

    res.json({ message: 'Community deleted successfully' });
  } catch (error) {
    console.error('Delete community error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ OPTIMIZED: Suggested communities
exports.getSuggestedCommunities = async (req, res) => {
  try {
    const userId = req.user._id;

    const communities = await Community.find({
      members: { $ne: userId }
    })
      .sort({ memberCount: -1 })
      .limit(5)
      .select('name coverImage memberCount category')
      .lean();

    res.json(communities);
  } catch (error) {
    console.error('Suggested communities error:', error);
    res.status(500).json({ message: 'Failed to fetch suggestions' });
  }
};