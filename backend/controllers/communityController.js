const Community = require('../models/Community');
const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const cloudinary = require('../config/cloudinary');

// Create community
exports.createCommunity = async (req, res) => {
  try {
    const { name, description, category, privacy, rules, tags } = req.body;

    // Check if community name already exists
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const existing = await Community.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: 'Community name already taken' });
    }

    // Upload cover image if provided
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

    // Create community
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

    // Add to user's communities
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { 
        communities: community._id,
        createdCommunities: community._id,
        moderatingCommunities: community._id
      }
    });

    const populated = await Community.findById(community._id)
      .populate('creator', 'username fullName profileImage')
      .populate('moderators', 'username fullName profileImage');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all communities (with filters)
exports.getCommunities = async (req, res) => {
  try {
    const { category, search, sort = 'popular', page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    let query = { privacy: 'public' };

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search by name or description
    if (search) {
      query.$text = { $search: search };
    }

    // Sort options
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

    const communities = await Community.find(query)
      .populate('creator', 'username fullName profileImage')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Community.countDocuments(query);

    res.json({
      communities,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single community
exports.getCommunity = async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findById(id)
      .populate('creator', 'username fullName profileImage')
      .populate('moderators', 'username fullName profileImage');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user is member
    const isMember = community.members.includes(req.user._id);
    const isModerator = community.moderators.some(mod => mod._id.toString() === req.user._id.toString());
    const isCreator = community.creator._id.toString() === req.user._id.toString();

    res.json({
      ...community.toObject(),
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

    // Check if already a member
    if (community.members.includes(req.user._id)) {
      return res.status(400).json({ error: 'Already a member of this community' });
    }

    // Add user to community
    community.members.push(req.user._id);
    community.memberCount = community.members.length;
    await community.save();

    // Add community to user
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

    // Can't leave if you're the creator
    if (community.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Creator cannot leave community. Delete it instead.' });
    }

    // Remove user from community
    community.members = community.members.filter(m => m.toString() !== req.user._id.toString());
    community.moderators = community.moderators.filter(m => m.toString() !== req.user._id.toString());
    community.memberCount = community.members.length;
    await community.save();

    // Remove community from user
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

// Get community posts
exports.getCommunityPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const posts = await Post.find({ community: id })
      .populate('author', 'username fullName profileImage')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({ community: id });

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

// Get community members
exports.getCommunityMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const members = await User.find({ _id: { $in: community.members } })
      .select('username fullName profileImage bio')
      .skip(skip)
      .limit(parseInt(limit));

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

// Get user's communities
exports.getUserCommunities = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'communities',
      populate: { path: 'creator', select: 'username fullName profileImage' }
    });

    res.json(user.communities);
  } catch (error) {
    console.error('Get user communities error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update community (moderator/creator only)
exports.updateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, rules, tags } = req.body;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user is moderator or creator
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

// Delete community (creator only)
exports.deleteCommunity = async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Only creator can delete
    if (community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only creator can delete community' });
    }

    // Delete cover image from cloudinary
    if (community.coverImage?.publicId) {
      await cloudinary.uploader.destroy(community.coverImage.publicId);
    }

    // Remove community from all users
    await User.updateMany(
      { communities: id },
      { $pull: { communities: id, createdCommunities: id, moderatingCommunities: id } }
    );

    // Delete all posts in community (optional - you might want to keep them)
    // await Post.deleteMany({ community: id });

    await Community.findByIdAndDelete(id);

    res.json({ message: 'Community deleted successfully' });
  } catch (error) {
    console.error('Delete community error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};