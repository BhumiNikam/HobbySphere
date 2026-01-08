const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { createNotification } = require('../utils/notifications');

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'username fullName profileImage')
      .populate('lastMessage.sender', 'username fullName')
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, userId] }
    }).populate('participants', 'username fullName profileImage');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, userId]
      });
      conversation = await conversation.populate('participants', 'username fullName profileImage');
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username fullName profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ conversation: conversationId });

    res.json({
      messages: messages.reverse(),
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, image } = req.body;

    if (!text && !image) {
      return res.status(400).json({ message: 'Message text or image required' });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    let imageUrl = '';
    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: 'hobbysphere/messages'
      });
      imageUrl = result.secure_url;
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      text: text || '',
      image: imageUrl
    });

    await message.populate('sender', 'username fullName profileImage');


    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text: text || '📷 Image',
        sender: req.user.id,
        createdAt: message.createdAt
      },
      updatedAt: Date.now()
    });

    // 🆕 CREATE NOTIFICATION FOR RECIPIENT
    const recipientId = conversation.participants.find(
      id => id.toString() !== req.user.id
    );
    if (recipientId) {
      await createNotification(
        recipientId,
        req.user.id,
        'message',
        message._id
      );
    }

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id) {
        const socketId = userSockets.get(participantId.toString());
        if (socketId) {
          io.to(socketId).emit('newMessage', {
            conversationId,
            message
          });
        }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user.id },
        read: false
      },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    });

    let unreadCount = 0;
    for (const conv of conversations) {
      const count = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: req.user.id },
        read: false
      });
      unreadCount += count;
    }

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};