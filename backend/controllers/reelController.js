const Reel = require('../models/Reel');
const cloudinary = require('../config/cloudinary');

// Create new reel
exports.createReel = async (req, res) => {
  try {
    const { caption } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Video file required' });
    }
    
    // Upload video to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'hobbysphere/reels',
          eager: [
            { width: 540, height: 960, crop: 'fill', format: 'jpg' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });
    
    // Extract hashtags
    const hashtags = caption?.match(/#\w+/g) || [];
    
    const reel = await Reel.create({
      author: req.user._id,
      community: req.body.communityId, // ✅ NEW - Required
      caption: caption || '',
      video: {
        url: result.secure_url,
        publicId: result.public_id,
        thumbnail: result.eager?.[0]?.secure_url || result.secure_url,
        duration: result.duration
      },
      hashtags: hashtags.map(tag => tag.toLowerCase())
    });
    
    await reel.populate('author', 'username fullName profileImage');
    
    res.status(201).json(reel);
  } catch (error) {
    console.error('Reel upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

// Get reels feed (paginated)
exports.getReels = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get user's communities
    const user = await User.findById(req.user._id);
    const reels = await Reel.find({ community: { $in: user.communities } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profileImage');
    const total = await Reel.countDocuments({ community: { $in: user.communities } });
    res.json({
      reels,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReels: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reels', error: error.message });
  }
};

// Get single reel
exports.getReelById = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.reelId)
      .populate('author', 'username fullName profileImage');
    
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }
    
    res.json(reel);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reel', error: error.message });
  }
};

// Get user's reels
exports.getUserReels = async (req, res) => {
  try {
    const reels = await Reel.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'username fullName profileImage');
    
    res.json(reels);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user reels', error: error.message });
  }
};

// Like/unlike reel
exports.likeReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.reelId);
    
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }
    
    const likeIndex = reel.likes.indexOf(req.user._id);
    
    if (likeIndex === -1) {
      reel.likes.push(req.user._id);
    } else {
      reel.likes.splice(likeIndex, 1);
    }
    
    await reel.save();
    
    res.json({
      likes: reel.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to like reel', error: error.message });
  }
};

// Increment view count
exports.incrementView = async (req, res) => {
  try {
    const reel = await Reel.findByIdAndUpdate(
      req.params.reelId,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }
    
    res.json({ viewCount: reel.viewCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update view count', error: error.message });
  }
};

// Delete reel
exports.deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.reelId);
    
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }
    
    // Check authorization
    if (reel.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this reel' });
    }
    
    // Delete video from Cloudinary
    await cloudinary.uploader.destroy(reel.video.publicId, { resource_type: 'video' });
    
    // Delete reel from database
    await Reel.findByIdAndDelete(req.params.reelId);
    
    res.json({ message: 'Reel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete reel', error: error.message });
  }
};