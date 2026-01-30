const User = require('../models/User');
const mongoose = require('mongoose');

const createNotification = async (io, userSockets, { type, from, to, post, community }) => {
  try {
    console.log('🔔 Creating notification:', { type, from, to, post });

    // Create notification object with proper _id
    const notification = {
      _id: new mongoose.Types.ObjectId(),
      type,
      from,
      post: post || null,
      community: community || null,
      read: false,
      createdAt: new Date()
    };

    // Add to user's notifications array
    const updatedUser = await User.findByIdAndUpdate(
      to,
      {
        $push: { 
          notifications: { 
            $each: [notification], 
            $position: 0, 
            $slice: 50 
          } 
        }
      },
      { new: true }
    )
    .select('notifications')
    .populate({
      path: 'notifications.from',
      select: 'fullName username profileImage'
    })
    .populate({
      path: 'notifications.post',
      select: 'content images'
    });

    if (!updatedUser) {
      console.error('❌ User not found:', to);
      return null;
    }

    // Get the newly created notification (first one)
    const populatedNotification = updatedUser.notifications[0];
    
    console.log('✅ Notification created in DB:', populatedNotification._id);

    // Send real-time notification via Socket.io
    const socketId = userSockets.get(to.toString());
    console.log(`📡 Looking for socket for user ${to}:`, socketId);
    
    if (socketId) {
      io.to(socketId).emit('notification', populatedNotification);

    }

    return populatedNotification;
  } catch (error) {
    console.error('❌ Notification creation error:', error);
    return null;
  }
};

module.exports = { createNotification };