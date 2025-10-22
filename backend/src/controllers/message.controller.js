import Message from '../models/Message.model.js';
import Chat from '../models/chat.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandle } from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/uploadOnCloudinary.js';
import { upload, optimizeMedia, handleUploadError } from '../middleware/compression.middleware.js';

// Send message - Simplified version matching Socket.IO handler
export const sendMessage = asyncHandle(async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;
    const { content, type, media, replyTo } = req.body;


    // Clean up undefined values exactly like Socket.IO handler
    const cleanReplyTo = (replyTo && replyTo !== 'undefined' && replyTo !== 'null') ? replyTo : null;
    const cleanMedia = (media && media !== 'undefined' && media !== 'null') ? media : null;


    // Validate exactly like Socket.IO handler
    if (!content && !cleanMedia && !cleanReplyTo) {
      throw new ApiError(400, 'Message content, media, or reply is required');
    }

    if (content && typeof content === 'string' && content.trim().length === 0 && !cleanMedia && !cleanReplyTo) {
      throw new ApiError(400, 'Message content cannot be empty');
    }

    // Verify chat exists and user is participant exactly like Socket.IO
    const chat = await Chat.findById(chatId).populate('participants.user', 'name email');
    if (!chat) {
      throw new ApiError(404, 'Chat not found');
    }

    const isParticipant = chat.participants.some(
      p => p.user && p.user._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      throw new ApiError(403, 'You are not a participant in this chat');
    }

    // Create message exactly like Socket.IO handler
    const message = await Message.create({
      chat: chatId,
      sender: userId,
      content,
      type: type || 'text',
      media: cleanMedia,
      replyTo: cleanReplyTo
    });

    await message.populate('sender', 'name avatar');
    await message.populate('replyTo');

    // Update chat exactly like Socket.IO handler
    chat.lastMessage = message._id;
    chat.lastMessageAt = new Date();
    chat.updatedAt = new Date();
    
    // Increment unread count for all participants except the sender
    try {
      // Ensure unreadCount is a Map
      if (!chat.unreadCount) {
        chat.unreadCount = new Map();
      } else if (typeof chat.unreadCount.set !== 'function') {
        // Convert object to Map
        chat.unreadCount = new Map(Object.entries(chat.unreadCount));
      }
      
      chat.participants.forEach(participant => {
        const participantUserId = participant.user._id ? participant.user._id.toString() : participant.user.toString();
        if (participantUserId !== userId.toString()) {
          const currentCount = chat.unreadCount.get(participantUserId) || 0;
          chat.unreadCount.set(participantUserId, currentCount + 1);
        }
      });
    } catch (error) {
      // Fallback: create new Map and set counts
      chat.unreadCount = new Map();
      chat.participants.forEach(participant => {
        const participantUserId = participant.user._id ? participant.user._id.toString() : participant.user.toString();
        if (participantUserId !== userId.toString()) {
          chat.unreadCount.set(participantUserId, 1);
        }
      });
    }
    
    await chat.save();

    // Broadcast the message to all participants in the chat via Socket.IO
    // Only broadcast if this message wasn't sent via Socket.IO (to prevent duplicates)
    const wasSentViaSocket = req.body.wasSentViaSocket;
    
    if (global.io && !wasSentViaSocket) {
      global.io.to(`chat:${chatId}`).emit("new_message", {
        message,
        chatId,
        sender: {
          _id: userId,
          name: message.sender.name,
          avatar: message.sender.avatar
        }
      });
    } else if (wasSentViaSocket) {
      // Message was sent via Socket.IO, skipping broadcast to prevent duplicates
    } else {
      // Socket.IO not available for broadcasting
    }

    return res.status(201).json(
      new ApiResponse(201, 'Message sent successfully', { message })
    );
  } catch (error) {
    throw new ApiError(500, 'Internal server error: ' + error.message);
  }
});

// Get messages for a chat
export const getChatMessages = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  // Verify chat exists and user is participant
  const chat = await Chat.findById(chatId).populate('participants.user', 'name email');
  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  const isParticipant = chat.participants.some(
    p => p.user && p.user._id.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant in this chat');
  }

  // Fetch messages
  const messages = await Message.find({ chat: chatId })
    .populate('sender', 'name avatar')
    .populate('replyTo')
    .populate('reactions.user', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Message.countDocuments({ chat: chatId });


  return res.status(200).json(
    new ApiResponse(200, 'Messages fetched successfully', {
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  );
});

// Edit message
export const editMessage = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId, messageId } = req.params;
  const { content } = req.body;

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  if (message.chat.toString() !== chatId) {
    throw new ApiError(400, 'Message does not belong to this chat');
  }

  if (message.sender.toString() !== userId.toString()) {
    throw new ApiError(403, 'You can only edit your own messages');
  }

  message.content = content;
  message.isEdited = true;
  message.editedAt = new Date();

  await message.save();
  await message.populate('sender', 'name avatar');

  return res.status(200).json(
    new ApiResponse(200, 'Message edited successfully', { message })
  );
});

// Delete message
export const deleteMessage = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId, messageId } = req.params;

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  if (message.chat.toString() !== chatId) {
    throw new ApiError(400, 'Message does not belong to this chat');
  }

  if (message.sender.toString() !== userId.toString()) {
    throw new ApiError(403, 'You can only delete your own messages');
  }

  message.isDeleted = true;
  message.deletedAt = new Date();
  message.deletedBy = userId;

  await message.save();

  return res.status(200).json(
    new ApiResponse(200, 'Message deleted successfully', {})
  );
});

// Add reaction to message
export const addReaction = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId, messageId } = req.params;
  const { emoji } = req.body;

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  if (message.chat.toString() !== chatId) {
    throw new ApiError(400, 'Message does not belong to this chat');
  }

  // Remove existing reaction from this user
  message.reactions = message.reactions.filter(
    r => r.user.toString() !== userId.toString()
  );

  // Add new reaction
  message.reactions.push({
    user: userId,
    emoji
  });

  await message.save();
  await message.populate('reactions.user', 'name avatar');

  return res.status(200).json(
    new ApiResponse(200, 'Reaction added successfully', { message })
  );
});

// Remove reaction from message
export const removeReaction = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId, messageId } = req.params;

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  if (message.chat.toString() !== chatId) {
    throw new ApiError(400, 'Message does not belong to this chat');
  }

  message.reactions = message.reactions.filter(
    r => r.user.toString() !== userId.toString()
  );

  await message.save();

  return res.status(200).json(
    new ApiResponse(200, 'Reaction removed successfully', { message })
  );
});

// Mark messages as read
export const markAsRead = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;
  const { messageId } = req.body; // Optional: specific message to mark as read

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  const isParticipant = chat.participants.some(
    p => p.user.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant in this chat');
  }

  // Update last seen
  const participant = chat.participants.find(
    p => p.user.toString() === userId.toString()
  );
  participant.lastSeen = new Date();

  if (messageId) {
    // Mark specific message as read
    const message = await Message.findById(messageId);
    if (!message) {
      throw new ApiError(404, 'Message not found');
    }

    if (message.chat.toString() !== chatId) {
      throw new ApiError(400, 'Message does not belong to this chat');
    }

    // Check if already read by this user
    const alreadyRead = message.readBy.some(
      read => read.user.toString() === userId.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({
        user: userId,
        readAt: new Date()
      });
      await message.save();
    }
  } else {
    // Mark all messages in chat as read
    await Message.updateMany(
      { 
        chat: chatId,
        sender: { $ne: userId }, // Don't mark own messages as read
        'readBy.user': { $ne: userId } // Only update messages not already read
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );
  }

  // Mark unread count as 0 - handle both Map and object cases
  try {
    if (!chat.unreadCount) {
      chat.unreadCount = new Map();
    }
    
    if (typeof chat.unreadCount.set === 'function') {
      // It's a Map
      chat.unreadCount.set(userId.toString(), 0);
    } else {
      // It's an object, convert to Map
      chat.unreadCount = new Map(Object.entries(chat.unreadCount));
      chat.unreadCount.set(userId.toString(), 0);
    }
  } catch (error) {
    // Fallback: create new Map
    chat.unreadCount = new Map();
    chat.unreadCount.set(userId.toString(), 0);
  }
  
  await chat.save();

  // Broadcast read status update
  if (global.io) {
    global.io.to(`chat:${chatId}`).emit('messages_read', {
      chatId,
      userId,
      messageId: messageId || null,
      readAt: new Date()
    });
  }

  return res.status(200).json(
    new ApiResponse(200, 'Messages marked as read', {})
  );
});

// Mark message as delivered
export const markAsDelivered = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId, messageId } = req.params;

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  if (message.chat.toString() !== chatId) {
    throw new ApiError(400, 'Message does not belong to this chat');
  }

  // Check if already delivered to this user
  const alreadyDelivered = message.deliveredTo.some(
    delivered => delivered.user.toString() === userId.toString()
  );

  if (!alreadyDelivered) {
    message.deliveredTo.push({
      user: userId,
      deliveredAt: new Date()
    });
    await message.save();

    // Broadcast delivery status update
    if (global.io) {
      global.io.to(`chat:${chatId}`).emit('message_delivered', {
        chatId,
        messageId,
        userId,
        deliveredAt: new Date()
      });
    }
  }

  return res.status(200).json(
    new ApiResponse(200, 'Message marked as delivered', {})
  );
});

// Get read receipts for a message
export const getReadReceipts = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId, messageId } = req.params;

  const message = await Message.findById(messageId)
    .populate('readBy.user', 'name avatar')
    .populate('deliveredTo.user', 'name avatar');

  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  if (message.chat.toString() !== chatId) {
    throw new ApiError(400, 'Message does not belong to this chat');
  }

  // Verify user is participant in chat
  const chat = await Chat.findById(chatId);
  const isParticipant = chat.participants.some(
    p => p.user.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant in this chat');
  }

  return res.status(200).json(
    new ApiResponse(200, 'Read receipts fetched successfully', {
      readBy: message.readBy,
      deliveredTo: message.deliveredTo
    })
  );
});

// Get unread count for a specific chat
export const getUnreadCount = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  // Validate chatId format (MongoDB ObjectId should be 24 characters)
  if (!chatId || chatId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(chatId)) {
    throw new ApiError(400, 'Invalid chat ID format');
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  const isParticipant = chat.participants.some(
    p => p.user.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant in this chat');
  }

  // Handle unreadCount safely - it might be an object or Map
  let unreadCount = 0;
  try {
    if (chat.unreadCount && typeof chat.unreadCount.get === 'function') {
      // It's a Map
      unreadCount = chat.unreadCount.get(userId.toString()) || 0;
    } else if (chat.unreadCount && typeof chat.unreadCount === 'object') {
      // It's an object
      unreadCount = chat.unreadCount[userId.toString()] || 0;
    }
  } catch (error) {
    unreadCount = 0;
  }

  return res.status(200).json(
    new ApiResponse(200, 'Unread count fetched successfully', {
      unreadCount
    })
  );
});

// Get total unread count across all chats
export const getTotalUnreadCount = asyncHandle(async (req, res) => {
  const userId = req.user._id;

  const chats = await Chat.find({
    'participants.user': userId,
    $or: [
      // Chat is not hidden or deleted for this user
      { [`userVisibility.${userId}.isHidden`]: { $ne: true } },
      { [`userVisibility.${userId}.isDeleted`]: { $ne: true } },
      // Or userVisibility doesn't exist for this user yet (new chats)
      { [`userVisibility.${userId}`]: { $exists: false } }
    ]
  });

  let totalUnreadCount = 0;
  chats.forEach(chat => {
    let userUnreadCount = 0;
    try {
      if (chat.unreadCount && typeof chat.unreadCount.get === 'function') {
        // It's a Map
        userUnreadCount = chat.unreadCount.get(userId.toString()) || 0;
      } else if (chat.unreadCount && typeof chat.unreadCount === 'object') {
        // It's an object
        userUnreadCount = chat.unreadCount[userId.toString()] || 0;
      }
    } catch (error) {
      userUnreadCount = 0;
    }
    totalUnreadCount += userUnreadCount;
  });

  return res.status(200).json(
    new ApiResponse(200, 'Total unread count fetched successfully', {
      totalUnreadCount
    })
  );
});

// Upload file for chat
export const uploadFile = [
  upload.single('file'),
  optimizeMedia,
  handleUploadError,
  asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;
  const { type } = req.body;

  // Validate input
  if (!req.file) {
    throw new ApiError(400, 'File is required');
  }

  if (!type) {
    throw new ApiError(400, 'File type is required');
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (req.file.size > maxSize) {
    throw new ApiError(400, 'File size too large. Maximum size is 10MB');
  }

  // Verify chat exists and user is participant
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  const isParticipant = chat.participants.some(
    p => p.user && p.user._id.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant in this chat');
  }

  try {
    // Upload file to Cloudinary
    const fileLocalPath = req.file.path;
    
    const cloudinaryResponse = await uploadOnCloudinary(fileLocalPath);

    if (!cloudinaryResponse) {
      throw new ApiError(500, 'Failed to upload file to cloud storage');
    }

    // Determine file type based on MIME type
    const mimeType = req.file.mimetype;
    let fileType = type;
    
    if (mimeType.startsWith('image/')) {
      fileType = 'image';
    } else if (mimeType.startsWith('video/')) {
      fileType = 'video';
    } else if (mimeType.startsWith('audio/')) {
      fileType = 'audio';
    } else {
      fileType = 'file';
    }

    // Create media object
    const media = [{
      url: cloudinaryResponse.url,
      type: fileType,
      name: req.file.originalname,
      size: req.file.size,
      thumbnail: cloudinaryResponse.url // For images/videos, use the same URL as thumbnail
    }];

    // Create message with uploaded file
    const message = await Message.create({
      chat: chatId,
      sender: userId,
      content: '',
      type: fileType,
      media,
      replyTo: null
    });

    await message.populate('sender', 'name avatar');

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.lastMessageAt = new Date();
    await chat.save();

    // Emit socket event to notify all chat participants
    if (global.io) {
      global.io.to(`chat:${chatId}`).emit('new_message', {
        chatId,
        message
      });
    }

    return res.status(201).json(
      new ApiResponse(201, 'File uploaded successfully', {
        message,
        fileUrl: cloudinaryResponse.url
      })
    );

  } catch (error) {
    throw new ApiError(500, 'Failed to upload file: ' + error.message);
  }
  })
];

