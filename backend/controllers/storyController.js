// Story feature deleted
const Story = require('../models/Story');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const cloudinary = require('../config/cloudinary');

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res) => {
  try {
    const { type, image, text } = req.body;

    // Set expiry to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let storyData = {
      author: req.user._id,
      type,
      expiresAt
    };

    if (type === 'image' && image) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(image, {
        folder: 'hobbysphere/stories',
        resource_type: 'auto'
      });

      storyData.image = {
        url: result.secure_url,
        publicId: result.public_id
      };
    } else if (type === 'text' && text) {
      storyData.text = {
        content: text.content,
        backgroundColor: text.backgroundColor || '#667eea',
        textColor: text.textColor || '#ffffff'
      };
    } else {
      return res.status(400).json({ message: 'Invalid story data' });
    }

    const story = await Story.create(storyData);
    await story.populate('author', 'username fullName profileImage');

    res.status(201).json(story);
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get stories feed (from following + self)
// @route   GET /api/stories/feed
// @access  Private
exports.getStoriesFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const following = user.following;

    // Get active stories from following + self
    const stories = await Story.find({
      author: { $in: [...following, req.user._id] },
      expiresAt: { $gt: new Date() }
    })
      .populate('author', 'username fullName profileImage')
      .sort({ createdAt: -1 });

    // Group stories by author
    const grouped = {};
    
    stories.forEach(story => {
      const authorId = story.author._id.toString();
      
      if (!grouped[authorId]) {
        grouped[authorId] = {
          author: story.author,
          stories: [],
          hasUnviewed: false
        };
      }

      // Check if current user has viewed this story
      const hasViewed = story.viewers.some(v => 
        v.user.toString() === req.user._id.toString()
      );

      if (!hasViewed) {
        grouped[authorId].hasUnviewed = true;
      }

      grouped[authorId].stories.push(story);
    });

    // Convert to array and sort (user's own stories first, then by unviewed)
    const feedArray = Object.values(grouped).sort((a, b) => {
      // User's own stories always first
      if (a.author._id.toString() === req.user._id.toString()) return -1;
      if (b.author._id.toString() === req.user._id.toString()) return 1;
      
      // Then unviewed stories
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      
      return 0;
    });

    res.json(feedArray);
  } catch (error) {
    console.error('Get stories feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's own stories
// @route   GET /api/stories/my-stories
// @access  Private
exports.getMyStories = async (req, res) => {
  try {
    const stories = await Story.find({
      author: req.user._id,
      expiresAt: { $gt: new Date() }
    })
      .populate('author', 'username fullName profileImage')
      .populate('viewers.user', 'username fullName profileImage')
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error('Get my stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark story as viewed
// @route   POST /api/stories/:storyId/view
// @access  Private
exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if already viewed
    const hasViewed = story.viewers.some(v => 
      v.user.toString() === req.user._id.toString()
    );

    if (!hasViewed) {
      story.viewers.push({ user: req.user._id });
      await story.save();
    }

    res.json({ message: 'Story viewed', viewerCount: story.viewers.length });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get story viewers
// @route   GET /api/stories/:storyId/viewers
// @access  Private
exports.getStoryViewers = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId)
      .populate('viewers.user', 'username fullName profileImage');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Only author can see viewers
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(story.viewers);
  } catch (error) {
    console.error('Get story viewers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    React to story (sends DM with reaction)
// @route   POST /api/stories/:storyId/react
// @access  Private
exports.reactToStory = async (req, res) => {
  try {
    const { reaction } = req.body; // emoji like "❤️", "🔥", "😂"
    const story = await Story.findById(req.params.storyId).populate('author');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Can't react to your own story
    if (story.author._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot react to your own story' });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, story.author._id] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, story.author._id]
      });
    }

    // ✅ FIXED: Use 'text' instead of 'content' to match Message schema
    const messageText = `Reacted ${reaction} to your story`;
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: messageText,  // ← FIXED: Changed from 'content' to 'text'
      messageType: 'story_reaction',
      storyReference: story._id
    });

    // Update conversation with proper lastMessage structure
    conversation.lastMessage = {
      text: messageText,
      sender: req.user._id,
      createdAt: message.createdAt
    };
    conversation.updatedAt = Date.now();
    await conversation.save();

    // Populate message sender info
    await message.populate('sender', 'username fullName profileImage');

    // Socket.io notification
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const recipientSocketId = userSockets.get(story.author._id.toString());
    
    if (recipientSocketId) {
      // Emit new message event
      io.to(recipientSocketId).emit('newMessage', {
        conversationId: conversation._id,
        message
      });
      
      // Emit story reaction notification
      io.to(recipientSocketId).emit('story_reaction', {
        storyId: story._id,
        reactor: {
          _id: req.user._id,
          username: req.user.username,
          fullName: req.user.fullName,
          profileImage: req.user.profileImage
        },
        reaction
      });
    }

    res.json({ message: 'Reaction sent', data: message });
  } catch (error) {
    console.error('React to story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:storyId
// @access  Private
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check ownership
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete from Cloudinary if image story
    if (story.type === 'image' && story.image.publicId) {
      await cloudinary.uploader.destroy(story.image.publicId);
    }

    await Story.findByIdAndDelete(req.params.storyId);

    res.json({ message: 'Story deleted' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};