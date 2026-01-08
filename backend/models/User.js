const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, minlength: 3, maxlength: 30 }, // unique removed
  email: { type: String, required: true }, // unique removed
  password: { type: String, required: true, minlength: 6 },
  fullName: { type: String, required: true },
  bio: { type: String, maxlength: 160, default: '' },
  profileImage: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  website: { type: String, default: '' },
  location: { type: String, default: '' },
  notifications: [{
    type: { type: String, enum: ['follow', 'like', 'comment'], required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Add unique indexes
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);