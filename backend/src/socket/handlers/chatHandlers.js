import Chat from "../../models/chat.model.js";
import Message from "../../models/Message.model.js";

/**
 * Chat Socket Handlers
 * Handles real-time chat messaging, typing indicators, and read receipts
 */
export const registerChatHandlers = (socket, io, state) => {
  const { chatRooms } = state;

  // Helper function to remove user from chat room
  const removeUserFromChatRoom = (chatId, socketId) => {
    const room = chatRooms.get(chatId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        chatRooms.delete(chatId);
      }
    }
  };

  // Join chat room
  socket.on("join_chat", async (data) => {
    try {
      const { chatId } = data;
      
      // Verify user has access to chat
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit("error", { message: "Chat not found" });
        return;
      }

      const isParticipant = chat.participants.some(
        p => p.user.toString() === socket.userId
      );

      if (!isParticipant) {
        socket.emit("error", { message: "You don't have access to this chat" });
        return;
      }

      // Leave previous chat if any
      if (socket.currentChatId) {
        socket.leave(socket.currentChatId);
        removeUserFromChatRoom(socket.currentChatId, socket.id);
      }

      // Join new chat room
      socket.join(`chat:${chatId}`);
      socket.currentChatId = chatId;
      
      // Also join user-specific room for individual messaging
      socket.join(`user:${socket.userId}`);

      // Add to chat room
      if (!chatRooms.has(chatId)) {
        chatRooms.set(chatId, new Set());
      }
      chatRooms.get(chatId).add(socket.id);

      // Emit confirmation to the user who joined
      socket.emit('chat_joined', { 
        chatId, 
        message: `Joined chat ${chatId}` 
      });

      // Notify others in the chat
      socket.to(`chat:${chatId}`).emit("user_joined_chat", {
        userId: socket.userId,
        userName: socket.user.name,
        avatar: socket.user.avatar
      });
      
      // Send current online status of all participants to the user who joined
      const participants = chat.participants || [];
      for (const participant of participants) {
        if (participant.user._id.toString() !== socket.userId.toString()) {
          // Check if this participant is currently online
          const isOnline = io.sockets.adapter.rooms.has(`user:${participant.user._id}`);
          
          socket.emit('user_status_changed', {
            userId: participant.user._id,
            isOnline: isOnline,
            lastSeen: new Date()
          });
        }
      }

    } catch (error) {
      console.error('Error in join_chat handler:', error);
      socket.emit("error", { message: "Failed to join chat" });
    }
  });

  // Leave chat room
  socket.on("leave_chat", (data) => {
    const { chatId } = data;
    if (socket.currentChatId === chatId) {
      socket.leave(`chat:${chatId}`);
      removeUserFromChatRoom(chatId, socket.id);
      socket.currentChatId = null;
    }
  });

  // Send message
  socket.on("send_message", async (data) => {
    try {
      const { chatId, content, type, media, replyTo } = data;
      
      // Clean up undefined values first
      const cleanReplyTo = (replyTo && replyTo !== 'undefined' && replyTo !== 'null') ? replyTo : null;
      const cleanMedia = (media && media !== 'undefined' && media !== 'null') ? media : null;
      
      // Ensure ObjectId fields are strings
      const cleanChatId = typeof chatId === 'object' ? chatId.toString() : chatId;
      const cleanSenderId = typeof socket.userId === 'object' ? socket.userId.toString() : socket.userId;
      const cleanReplyToId = cleanReplyTo && typeof cleanReplyTo === 'object' ? cleanReplyTo.toString() : cleanReplyTo;
      
      // Validate required fields
      if (!cleanChatId) {
        socket.emit("error", "Chat ID is required");
        return;
      }
      
      if (!content && !cleanMedia && !cleanReplyTo) {
        socket.emit("error", "Message content, media, or reply is required");
        return;
      }
      
      // Validate content if provided
      if (content && typeof content === 'string' && content.trim().length === 0 && !cleanMedia && !cleanReplyTo) {
        socket.emit("error", "Message content cannot be empty");
        return;
      }
      
      // Verify chat exists and user is participant
      const chat = await Chat.findById(cleanChatId).populate('participants.user', 'name email');
      if (!chat) {
        socket.emit("error", "Chat not found");
        return;
      }

      // Check if user is a participant
      const isParticipant = chat.participants.some(
        p => p.user && p.user._id.toString() === cleanSenderId.toString()
      );

      if (!isParticipant) {
        socket.emit("error", "You are not a participant in this chat");
        return;
      }

      // Create message in database
      const messageData = {
        chat: cleanChatId,
        sender: cleanSenderId,
        content,
        type: type || 'text',
        media: cleanMedia,
        replyTo: cleanReplyToId
      };

      const message = await Message.create(messageData);

      await message.populate('sender', 'name avatar');
      await message.populate('replyTo');

      // Handle chat updates (last message, unread count, etc.)
      try {
        // Update basic chat info
        chat.lastMessage = message._id;
        chat.lastMessageAt = new Date();
        chat.updatedAt = new Date();
        
        // Handle unread count updates safely
        try {
          // Ensure unreadCount is a Map
          if (!chat.unreadCount) {
            chat.unreadCount = new Map();
          } else if (typeof chat.unreadCount.set !== 'function') {
            // Convert object to Map
            chat.unreadCount = new Map(Object.entries(chat.unreadCount));
          }
          
          // Increment unread count for all participants except the sender
          chat.participants.forEach(participant => {
            const participantUserId = participant.user._id ? participant.user._id.toString() : participant.user.toString();
            if (participantUserId !== cleanSenderId.toString()) {
              const currentCount = chat.unreadCount.get(participantUserId) || 0;
              chat.unreadCount.set(participantUserId, currentCount + 1);
            }
          });
        } catch (unreadCountError) {
          // Reset unreadCount to empty Map if there's an issue
          chat.unreadCount = new Map();
          chat.participants.forEach(participant => {
            const participantUserId = participant.user._id ? participant.user._id.toString() : participant.user.toString();
            if (participantUserId !== socket.userId.toString()) {
              chat.unreadCount.set(participantUserId, 1);
            }
          });
        }
        
        await chat.save();
      } catch (chatUpdateError) {
        console.error('Error updating chat:', chatUpdateError);
        // Continue - message was still created successfully
      }

      // Send confirmation to the sender first
      socket.emit("message_confirmed", {
        messageId: message._id,
        content: message.content,
        chatId: cleanChatId,
        message: message // Include full message object
      });

      // Broadcast to all users in the chat
      // Get the number of clients in the room
      const room = io.sockets.adapter.rooms.get(`chat:${cleanChatId}`);
      const clientCount = room ? room.size : 0;

      const broadcastData = {
        message,
        chatId: cleanChatId,
        sender: {
          _id: cleanSenderId,
          name: socket.user.name,
          avatar: socket.user.avatar
        }
      };

      console.log(`📢 Broadcasting new message to chat:${cleanChatId} (${clientCount} clients)`);

      // Broadcast to chat room (excluding sender if needed)
      io.to(`chat:${cleanChatId}`).emit("new_message", broadcastData);

      // Also emit to individual users as backup (excluding sender)
      chat.participants.forEach(participant => {
        if (participant.user._id.toString() !== cleanSenderId.toString()) {
          console.log(`📬 Sending new_message to user:${participant.user._id}`);
          io.to(`user:${participant.user._id}`).emit("new_message", broadcastData);
        }
      });

      // Broadcast updated chat data to all connected users for chat list updates
      io.emit("chat_updated", {
        chatId: cleanChatId,
        updatedFields: {
          lastMessage: message,
          unreadCount: chat.unreadCount,
          updatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Error in send_message handler:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
      
      // Send more specific error message
      let errorMessage = "Failed to send message";
      if (error.name === 'ValidationError') {
        errorMessage = "Invalid message data";
        console.error('❌ Validation errors:', error.errors);
      } else if (error.name === 'CastError') {
        errorMessage = "Invalid chat or user ID";
        console.error('❌ Cast error path:', error.path, 'value:', error.value);
      } else if (error.code === 11000) {
        errorMessage = "Duplicate message";
      }
      
      socket.emit("error", errorMessage);
    }
  });

  // Typing indicator
  socket.on("typing", (data) => {
    const { chatId } = data;
    socket.to(`chat:${chatId}`).emit("user_typing", {
      userId: socket.userId,
      userName: socket.user.name,
      avatar: socket.user.avatar
    });
  });

  // Stop typing
  socket.on("stop_typing", (data) => {
    const { chatId } = data;
    socket.to(`chat:${chatId}`).emit("user_stop_typing", {
      userId: socket.userId
    });
  });

  // Mark messages as read
  socket.on("mark_as_read", async (data) => {
    try {
      const { chatId, messageId } = data;
      
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      // Update last seen
      const participant = chat.participants.find(
        p => p.user.toString() === socket.userId
      );
      if (participant) {
        participant.lastSeen = new Date();
        
        // Initialize unreadCount if it doesn't exist and handle Map/object conversion
        try {
          if (!chat.unreadCount) {
            chat.unreadCount = new Map();
          } else if (typeof chat.unreadCount.set !== 'function') {
            // Convert object to Map
            chat.unreadCount = new Map(Object.entries(chat.unreadCount));
          }
          
          chat.unreadCount.set(socket.userId.toString(), 0);
        } catch (error) {
          chat.unreadCount = new Map();
          chat.unreadCount.set(socket.userId.toString(), 0);
        }
        await chat.save();
      }

      if (messageId) {
        // Mark specific message as read
        const message = await Message.findById(messageId);
        if (message && message.chat.toString() === chatId) {
          const alreadyRead = message.readBy.some(
            read => read.user.toString() === socket.userId
          );

          if (!alreadyRead) {
            message.readBy.push({
              user: socket.userId,
              readAt: new Date()
            });
            await message.save();
          }
        }
      } else {
        // Mark all messages in chat as read
        await Message.updateMany(
          { 
            chat: chatId,
            sender: { $ne: socket.userId },
            'readBy.user': { $ne: socket.userId }
          },
          {
            $push: {
              readBy: {
                user: socket.userId,
                readAt: new Date()
              }
            }
          }
        );
      }

      // Notify others and broadcast updated chat data
      socket.to(`chat:${chatId}`).emit("messages_read", {
        userId: socket.userId,
        chatId,
        messageId: messageId || null,
        readAt: new Date()
      });

      // Broadcast updated chat data to all connected users for chat list updates
      io.emit("chat_updated", {
        chatId,
        updatedFields: {
          unreadCount: chat.unreadCount,
          lastSeen: participant.lastSeen
        }
      });
    } catch (error) {
      console.error('Error in mark_as_read handler:', error);
    }
  });

  // Mark message as delivered
  socket.on("mark_as_delivered", async (data) => {
    try {
      const { chatId, messageId } = data;
      
      const message = await Message.findById(messageId);
      if (!message || message.chat.toString() !== chatId) return;

      const alreadyDelivered = message.deliveredTo.some(
        delivered => delivered.user.toString() === socket.userId
      );

      if (!alreadyDelivered) {
        message.deliveredTo.push({
          user: socket.userId,
          deliveredAt: new Date()
        });
        await message.save();

        // Broadcast delivery status update
        socket.to(`chat:${chatId}`).emit("message_delivered", {
          chatId,
          messageId,
          userId: socket.userId,
          deliveredAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error in mark_as_delivered handler:', error);
    }
  });

  // Return cleanup function
  return {
    cleanup: () => {
      if (socket.currentChatId) {
        removeUserFromChatRoom(socket.currentChatId, socket.id);
      }
    },
    removeUserFromChatRoom
  };
};
