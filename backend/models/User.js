const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true },
  password: { type: String, required: true, minlength: 6 },
  fullName: { type: String, required: true },
  bio: { type: String, maxlength: 160, default: '' },
  profileImage: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  
  // Social connections
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  
  // 🆕 COMMUNITY FIELDS - ADD THESE TO YOUR EXISTING User.js
  communities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  }],
  interests: [{
    type: String,
    lowercase: true
  }],
  createdCommunities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  }],
  moderatingCommunities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  }],
  
  // Profile info
  website: { type: String, default: '' },
  location: { type: String, default: '' },
  
  // Guest user flag
  isGuest: {
    type: Boolean,
    default: false
  },
  
  // Notifications (updated to include community notifications)
  notifications: [{
    type: { 
      type: String, 
      enum: ['follow', 'like', 'comment', 'community_invite', 'community_post'], 
      required: true 
    },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ communities: 1 });
userSchema.index({ interests: 1 });

module.exports = mongoose.model('User', userSchema);