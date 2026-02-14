const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3, maxlength: 50, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true, maxlength: 500 },
  category: { type: String, required: true },
  coverImage: {
    url: String,
    publicId: String
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  memberCount: { type: Number, default: 0 },
  privacy: { type: String, enum: ['public', 'private'], default: 'public' },
  rules: { type: String, maxlength: 2000 },
  tags: [String],
  postCount: { type: Number, default: 0 },
  isTrending: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ✅ INDEXES - slug index removed (already created by unique: true)
communitySchema.index({ category: 1, memberCount: -1 });
communitySchema.index({ memberCount: -1, createdAt: -1 });
communitySchema.index({ members: 1 });
communitySchema.index({ privacy: 1, memberCount: -1 });
communitySchema.index({ postCount: -1, createdAt: -1 });

// Text search index
communitySchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Community', communitySchema);