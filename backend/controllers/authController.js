const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
const crypto = require('crypto');
const PasswordReset = require('../models/PasswordReset');

// Password validation helper
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return 'Password must be at least 8 characters long';
  }
  if (!hasUpperCase) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!hasLowerCase) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!hasNumbers) {
    return 'Password must contain at least one number';
  }
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character (!@#$%^&*...)';
  }
  return null; // Valid password
};

// ─── Guest hash cache ────────────────────────────────────────────────────────
// Pre-compute bcrypt hash once at startup using only 4 rounds.
// Guest passwords are throwaway — speed matters, not security strength.
// This eliminates the 1–3s bcrypt delay on the first guest login request.
const GUEST_PASSWORD = 'Guest@123';
let _cachedGuestHash = null;
const _getGuestHash = async () => {
  if (!_cachedGuestHash) {
    _cachedGuestHash = await bcrypt.hash(GUEST_PASSWORD, 4);
  }
  return _cachedGuestHash;
};
_getGuestHash().catch(() => {}); // warm up on module load, ignore errors
// ─────────────────────────────────────────────────────────────────────────────

// Register
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Check if password exists
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Password validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName
    });

    // Send welcome email (don't wait for it)
    sendWelcomeEmail(user.email, user.fullName).catch(err => 
      console.error('Welcome email failed:', err)
    );

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        followers: [],
        following: []
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and populate followers/following
    const user = await User.findOne({ email })
      .populate('followers', '_id username fullName profileImage')
      .populate('following', '_id username fullName profileImage');
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        bio: user.bio,
        followers: user.followers,
        following: user.following
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Guest Login - Create unique temporary guest account
exports.guestLogin = async (req, res) => {
  try {
    // Use crypto for a unique 6-char hex ID (collision-safe)
    const randomId = crypto.randomBytes(3).toString('hex');
    const guestEmail = `guest_${randomId}@hobbysphere.com`;

    // Use pre-cached hash — no bcrypt cost on this request
    const hashedPassword = await _getGuestHash();

    const guestUser = await User.create({
      username: `guest_${randomId}`,
      email: guestEmail,
      password: hashedPassword,
      fullName: 'Guest User',
      bio: '👤 Temporary Guest Account',
      isGuest: true
    });

    // Generate token
    const token = jwt.sign({ id: guestUser._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        _id: guestUser._id,
        username: guestUser.username,
        email: guestUser.email,
        fullName: guestUser.fullName,
        profileImage: guestUser.profileImage,
        isGuest: true,
        followers: [],
        following: []
      }
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ message: 'Guest login failed' });
  }
};

// Get current user - FIXED to populate followers/following
exports.getMe = async (req, res) => {
  try {
    // Fetch fresh user data with populated followers/following
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('followers', '_id username fullName profileImage')
      .populate('following', '_id username fullName profileImage');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        coverImage: user.coverImage,
        bio: user.bio,
        location: user.location,
        website: user.website,
        followers: user.followers,
        following: user.following,
        isGuest: user.isGuest,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password - send reset email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not (security)
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    // Generate random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Save to database
    await PasswordReset.create({
      user: user._id,
      token: resetToken
    });

    // Send email
    await sendPasswordResetEmail(user.email, user.fullName, resetToken);

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find valid reset token
    const resetRequest = await PasswordReset.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!resetRequest) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await User.findByIdAndUpdate(resetRequest.user._id, {
      password: hashedPassword
    });

    // Mark token as used
    resetRequest.used = true;
    await resetRequest.save();

    res.json({ message: 'Password reset successful! You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout and cleanup guest data
exports.logout = async (req, res) => {
  try {
    // Check if logging out user is guest
    if (req.user.isGuest || (req.user.email && req.user.email.startsWith('guest_'))) {
      const Post = require('../models/Post');
      const Comment = require('../models/Comment');
      const Community = require('../models/Community');
      const Message = require('../models/Message');
      const Bookmark = require('../models/Bookmark');

      const guestId = req.user._id;

      // Delete all guest data including the user account
      await Promise.all([
        Post.deleteMany({ user: guestId }),
        Comment.deleteMany({ user: guestId }),
        Community.deleteMany({ creator: guestId }),
        Message.deleteMany({ sender: guestId }),
        Bookmark.deleteMany({ user: guestId }),
        
        // Remove guest from other users' followers/following
        User.updateMany(
          { followers: guestId },
          { $pull: { followers: guestId } }
        ),
        User.updateMany(
          { following: guestId },
          { $pull: { following: guestId } }
        ),
        
        // Remove guest from communities
        Community.updateMany(
          { members: guestId },
          { $pull: { members: guestId } }
        ),
        
        // Delete the guest user account completely
        User.findByIdAndDelete(guestId)
      ]);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};