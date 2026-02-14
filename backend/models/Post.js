const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  content: { type: String, required: true, maxlength: 2000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
  
  // ✅ NEW: Multi-media support
  media: [{
    url: String,
    publicId: String,
    type: { 
      type: String, 
      enum: ['image', 'video', 'audio', 'pdf', 'document'],
      default: 'image' 
    },
    fileName: String,
    fileSize: Number,
    mimeType: String
  }],
  
  // ✅ DEPRECATED: Keep for backward compatibility with old posts
  images: [{
    url: String,
    publicId: String,
    type: { 
      type: String, 
      enum: ['image', 'video'],
      default: 'image' 
    }
  }],
  
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentCount: { type: Number, default: 0 },
  hashtags: [String],
  isPinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ✅ CRITICAL INDEXES FOR PERFORMANCE
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ community: 1, isPinned: -1, createdAt: -1 });
postSchema.index({ hashtags: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likes: 1 });

module.exports = mongoose.model('Post', postSchema);