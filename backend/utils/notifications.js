const User = require('../models/User');

const createNotification = async (io, userSockets, { type, from, to, post }) => {
  try {
    // Create notification object
    const notification = {
      type,
      from,
      post: post || null,
      read: false,
      createdAt: new Date()
    };

    // Add to user's notifications array
    await User.findByIdAndUpdate(to, {
      $push: { notifications: { $each: [notification], $position: 0, $slice: 50 } }
    });

    // Get the updated user with populated notification
    const updatedUser = await User.findById(to)
      .select('notifications')
      .populate('notifications.from', 'fullName username profileImage')
      .populate('notifications.post', 'content images');

    const populatedNotification = updatedUser.notifications[0]; // Get the newest one

    // Send real-time notification via Socket.io
    const socketId = userSockets.get(to.toString());
    console.log(`🔔 Creating ${type} notification for user ${to}`);
    console.log(`📡 User socket ID: ${socketId}`);
    
    if (socketId) {
      io.to(socketId).emit('notification', populatedNotification);
      console.log('✅ Notification emitted successfully:', populatedNotification);
    } else {
      console.log('⚠️ User not connected, notification saved to DB only');
    }

    return populatedNotification;
  } catch (error) {
    console.error('❌ Notification creation error:', error);
  }
};

module.exports = { createNotification };