const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 🆕 COMMUNITY REFERENCE - Required for new reels
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: false // Set to true after migration
  },
  caption: {
    type: String,
    maxlength: 500
  },
  video: {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    thumbnail: String,
    duration: Number
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  commentCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  hashtags: [{
    type: String,
    lowercase: true
  }],
  music: {
    name: String,
    artist: String
  }
}, { timestamps: true });

// Indexes for performance
reelSchema.index({ author: 1, createdAt: -1 });
reelSchema.index({ community: 1, createdAt: -1 });
reelSchema.index({ hashtags: 1 });
reelSchema.index({ createdAt: -1 });
reelSchema.index({ viewCount: -1 });

module.exports = mongoose.model('Reel', reelSchema);