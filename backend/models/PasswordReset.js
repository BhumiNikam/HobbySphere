const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 3600000) // 1 hour from now
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Auto-delete after 1 hour
  }
});

// Index for faster queries
passwordResetSchema.index({ token: 1 });
passwordResetSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);