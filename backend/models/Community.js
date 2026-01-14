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
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  memberCount: { type: Number, default: 0 },
  privacy: { type: String, enum: ['public', 'private'], default: 'public' },
  rules: { type: String, maxlength: 2000 },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

communitySchema.index({ slug: 1 });
communitySchema.index({ category: 1 });
communitySchema.index({ memberCount: -1 });

module.exports = mongoose.model('Community', communitySchema);