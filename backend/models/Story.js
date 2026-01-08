const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'text'],
    default: 'image'
  },
  image: {
    url: String,
    publicId: String
  },
  text: {
    content: String,
    backgroundColor: {
      type: String,
      default: '#667eea'
    },
    textColor: {
      type: String,
      default: '#ffffff'
    }
  },
  viewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, { 
  timestamps: true 
});

// TTL Index - MongoDB will auto-delete documents when expiresAt is reached
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', storySchema);