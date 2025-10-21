import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Whiteboard from "../models/whiteboard.model.js";
import Chat from "../models/chat.model.js";
import Message from "../models/Message.model.js";
import Call from "../models/call.model.js";
import Document from "../models/document.model.js";
import { retryableUserUpdate, retryableUserFind, retryableChatUpdate, retryableMessageCreate, retryableMessageFind, waitForConnection } from "../utils/databaseRetry.js";

class SocketServer {
  constructor(server) {
    // Get frontend URL from environment or use fallbacks
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
    
    // Production-ready CORS configuration
    const corsOrigins = [
      frontendUrl
    ];

    // Remove duplicates and filter out undefined values
    const uniqueOrigins = [...new Set(corsOrigins.filter(Boolean))];

    // console.log('🔌 Socket.IO CORS Origins:', uniqueOrigins);

    this.io = new Server(server, {
      cors: {
        origin: function (origin, callback) {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);
          
          if (uniqueOrigins.includes(origin)) {
            callback(null, true);
          } else {
            console.warn('🚫 Socket.IO CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
      },
    });

    // Make io instance globally accessible
    global.io = this.io;

    this.activeUsers = new Map(); // userId -> { socketId, whiteboardId, userInfo }
    this.whiteboardRooms = new Map(); // whiteboardId -> Set of socketIds
    this.chatRooms = new Map(); // chatId -> Set of socketIds
    this.activeCalls = new Map(); // callId -> { participants, status }
    this.callTimeouts = new Map(); // callId -> timeoutId for tracking call timeouts
    this.documentRooms = new Map(); // documentId -> Set of socketIds
    this.documentCollaborators = new Map(); // documentId -> Map of userId -> { cursor, selection, userInfo }

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        // Extract token from cookies (same as auth middleware)
        const cookies = socket.handshake.headers.cookie;
        let token = null;
        
        if (cookies) {
          const tokenMatch = cookies.match(/accessToken=([^;]+)/);
          if (tokenMatch) {
            token = decodeURIComponent(tokenMatch[1]);
          }
        }
        
        // Also check auth token as fallback
        if (!token) {
          token = socket.handshake.auth.token;
        }
        
        // Also check Authorization header as fallback
        if (!token) {
          const authHeader = socket.handshake.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
          }
        }
        
        if (!token) {
          return next(new Error("Authentication error"));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
          return next(new Error("User not found"));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });
  }

  setupEventHandlers() {
    this.io.on("connection", async (socket) => {

      // Ensure database connection is ready before proceeding
      try {
        await waitForConnection();
      } catch (error) {
        console.error('❌ Database not ready for socket operations:', error.message);
        socket.emit('error', { message: 'Database not ready' });
        return;
      }

      // Join user's personal room for notifications
      socket.join(`user:${socket.userId}`);
      
      // Update user online status with retry logic
      try {
        await retryableUserUpdate(socket.userId, {
          isOnline: true,
          lastSeen: new Date()
        });
        
        // Notify all connected users about this user's online status
        this.io.emit('user_status_changed', {
          userId: socket.userId,
          isOnline: true,
          lastSeen: new Date()
        });
        
        // console.log(`User ${socket.userId} is now online - broadcasting status to all users`);
      } catch (error) {
        console.error('Error updating user online status:', error);
      }
      
      // Send connection confirmation
      socket.emit('connection_confirmed', {
        message: 'Socket connected successfully',
        userId: socket.userId,
        socketId: socket.id
      });

      // Join whiteboard room
      socket.on("join_whiteboard", async (data) => {
        try {
          const { whiteboardId } = data;
          
          // Verify user has access to whiteboard
          const whiteboard = await Whiteboard.findById(whiteboardId);
          if (!whiteboard) {
            socket.emit("error", { message: "Whiteboard not found" });
            return;
          }

          const userRole = whiteboard.getUserRole(socket.userId);
          if (!userRole) {
            socket.emit("error", { message: "You don't have access to this whiteboard" });
            return;
          }

          // Leave previous room if any
          if (socket.currentWhiteboardId) {
            socket.leave(`whiteboard:${socket.currentWhiteboardId}`);
            this.removeUserFromRoom(socket.currentWhiteboardId, socket.id);
          }

          // Join new room
          socket.join(`whiteboard:${whiteboardId}`);
          socket.currentWhiteboardId = whiteboardId;

          // Add user to active users
          this.activeUsers.set(socket.userId, {
            socketId: socket.id,
            whiteboardId,
            userInfo: {
              id: socket.user._id,
              name: socket.user.name,
              email: socket.user.email,
              avatar: socket.user.avatar,
              role: userRole,
            },
          });

          // Add to whiteboard room
          if (!this.whiteboardRooms.has(whiteboardId)) {
            this.whiteboardRooms.set(whiteboardId, new Set());
          }
          this.whiteboardRooms.get(whiteboardId).add(socket.id);

          // Notify others in the room
          socket.to(`whiteboard:${whiteboardId}`).emit("user_joined", {
            user: this.activeUsers.get(socket.userId).userInfo,
            activeUsers: this.getActiveUsersInRoom(whiteboardId),
          });

          // Send current active users to the joining user
          socket.emit("active_users", {
            activeUsers: this.getActiveUsersInRoom(whiteboardId),
          });

        } catch (error) {
          socket.emit("error", { message: "Failed to join whiteboard" });
        }
      });

      // Handle drawing events
      socket.on("drawing", (data) => {
        if (socket.currentWhiteboardId) {
          // Broadcast to all users in the room except sender
          socket.to(`whiteboard:${socket.currentWhiteboardId}`).emit("drawing", {
            ...data,
            userId: socket.userId,
            userInfo: this.activeUsers.get(socket.userId)?.userInfo,
          });
        }
      });

      // Handle cursor movement
      socket.on("cursor_move", (data) => {
        if (socket.currentWhiteboardId) {
          socket.to(`whiteboard:${socket.currentWhiteboardId}`).emit("cursor_move", {
            ...data,
            userId: socket.userId,
            userInfo: this.activeUsers.get(socket.userId)?.userInfo,
          });
        }
      });

      // Handle canvas state sync
      socket.on("canvas_state", (data) => {
        if (socket.currentWhiteboardId) {
          socket.to(`whiteboard:${socket.currentWhiteboardId}`).emit("canvas_state", {
            ...data,
            userId: socket.userId,
            userInfo: this.activeUsers.get(socket.userId)?.userInfo,
          });
        }
      });

      // Handle shape creation
      socket.on("shape_created", (data) => {
        if (socket.currentWhiteboardId) {
          socket.to(`whiteboard:${socket.currentWhiteboardId}`).emit("shape_created", {
            ...data,
            userId: socket.userId,
            userInfo: this.activeUsers.get(socket.userId)?.userInfo,
          });
        }
      });

      // Handle text creation
      socket.on("text_created", (data) => {
        if (socket.currentWhiteboardId) {
          socket.to(`whiteboard:${socket.currentWhiteboardId}`).emit("text_created", {
            ...data,
            userId: socket.userId,
            userInfo: this.activeUsers.get(socket.userId)?.userInfo,
          });
        }
      });

      // Handle object deletion
      socket.on("object_deleted", (data) => {
        if (socket.currentWhiteboardId) {
          socket.to(`whiteboard:${socket.currentWhiteboardId}`).emit("object_deleted", {
            ...data,
            userId: socket.userId,
            userInfo: this.activeUsers.get(socket.userId)?.userInfo,
          });
        }
      });

      // Handle object modification
      socket.on("object_modified", (data) => {
        if (socket.currentWhiteboardId) {
          socket.to(`whiteboard:${socket.currentWhiteboardId}`).emit("object_modified", {
            ...data,
            userId: socket.userId,
            userInfo: this.activeUsers.get(socket.userId)?.userInfo,
          });
        }
      });

      // Handle whiteboard chat messages
      socket.on("chat_message", (data) => {
        if (socket.currentWhiteboardId) {
          const message = {
            ...data,
            userId: socket.userId,
            userInfo: this.activeUsers.get(socket.userId)?.userInfo,
            timestamp: new Date(),
          };
          
          // Broadcast to all users in the room including sender
          this.io.to(`whiteboard:${socket.currentWhiteboardId}`).emit("chat_message", message);
        }
      });

      // ========== DOCUMENT COLLABORATION EVENTS ==========
      
      // Join document room
      socket.on("join_document", async (data) => {
        try {
          const { documentId } = data;
          
          // Verify user has access to document
          const document = await Document.findById(documentId);
          if (!document) {
            socket.emit("error", { message: "Document not found" });
            return;
          }

          const userRole = document.getUserRole(socket.userId);
          if (!userRole) {
            socket.emit("error", { message: "You don't have access to this document" });
            return;
          }

          // Leave previous document room if any
          if (socket.currentDocumentId) {
            socket.leave(`document:${socket.currentDocumentId}`);
            this.removeUserFromDocumentRoom(socket.currentDocumentId, socket.id);
          }

          // Join new document room
          socket.join(`document:${documentId}`);
          socket.currentDocumentId = documentId;

          // Add to document room
          if (!this.documentRooms.has(documentId)) {
            this.documentRooms.set(documentId, new Set());
          }
          this.documentRooms.get(documentId).add(socket.id);

          // Add to document collaborators
          if (!this.documentCollaborators.has(documentId)) {
            this.documentCollaborators.set(documentId, new Map());
          }
          
          this.documentCollaborators.get(documentId).set(socket.userId, {
            cursor: null,
            selection: null,
            userInfo: {
              id: socket.user._id,
              name: socket.user.name,
              email: socket.user.email,
              avatar: socket.user.avatar,
              role: userRole,
            },
          });

          // Notify others in the room
          socket.to(`document:${documentId}`).emit("user_joined_document", {
            user: this.documentCollaborators.get(documentId).get(socket.userId).userInfo,
            activeCollaborators: this.getActiveCollaboratorsInDocument(documentId),
          });

          // Send current active collaborators to the joining user
          socket.emit("active_collaborators", {
            activeCollaborators: this.getActiveCollaboratorsInDocument(documentId),
          });

          // console.log(`User ${socket.userId} joined document room: document:${documentId}`);

        } catch (error) {
          socket.emit("error", { message: "Failed to join document" });
        }
      });

      // Leave document room
      socket.on("leave_document", (data) => {
        const { documentId } = data;
        if (socket.currentDocumentId === documentId) {
          socket.leave(`document:${documentId}`);
          this.removeUserFromDocumentRoom(documentId, socket.id);
          socket.currentDocumentId = null;
          
          // Notify others
          socket.to(`document:${documentId}`).emit("user_left_document", {
            userId: socket.userId,
            activeCollaborators: this.getActiveCollaboratorsInDocument(documentId),
          });
        }
      });

      // Handle document content changes
      socket.on("document_content_change", (data) => {
        if (socket.currentDocumentId) {
          // Broadcast to all users in the room except sender
          socket.to(`document:${socket.currentDocumentId}`).emit("document_content_change", {
            ...data,
            userId: socket.userId,
            userInfo: this.documentCollaborators.get(socket.currentDocumentId)?.get(socket.userId)?.userInfo,
            timestamp: new Date(),
          });
        }
      });

      // Handle cursor movement
      socket.on("document_cursor_move", (data) => {
        if (socket.currentDocumentId) {
          const documentId = socket.currentDocumentId;
          
          // Update cursor position for this user
          if (this.documentCollaborators.has(documentId)) {
            const collaborator = this.documentCollaborators.get(documentId).get(socket.userId);
            if (collaborator) {
              collaborator.cursor = data;
            }
          }

          // Broadcast to others
          socket.to(`document:${documentId}`).emit("document_cursor_move", {
            ...data,
            userId: socket.userId,
            userInfo: this.documentCollaborators.get(documentId)?.get(socket.userId)?.userInfo,
          });
        }
      });

      // Handle text selection
      socket.on("document_selection_change", (data) => {
        if (socket.currentDocumentId) {
          const documentId = socket.currentDocumentId;
          
          // Update selection for this user
          if (this.documentCollaborators.has(documentId)) {
            const collaborator = this.documentCollaborators.get(documentId).get(socket.userId);
            if (collaborator) {
              collaborator.selection = data;
            }
          }

          // Broadcast to others
          socket.to(`document:${documentId}`).emit("document_selection_change", {
            ...data,
            userId: socket.userId,
            userInfo: this.documentCollaborators.get(documentId)?.get(socket.userId)?.userInfo,
          });
        }
      });

      // Handle typing indicator
      socket.on("document_typing", (data) => {
        if (socket.currentDocumentId) {
          socket.to(`document:${socket.currentDocumentId}`).emit("document_user_typing", {
            userId: socket.userId,
            userName: socket.user.name,
            avatar: socket.user.avatar,
            ...data,
          });
        }
      });

      // Handle stop typing
      socket.on("document_stop_typing", (data) => {
        if (socket.currentDocumentId) {
          socket.to(`document:${socket.currentDocumentId}`).emit("document_user_stop_typing", {
            userId: socket.userId,
            ...data,
          });
        }
      });

      // Handle document formatting changes (bold, italic, etc.)
      socket.on("document_format_change", (data) => {
        if (socket.currentDocumentId) {
          socket.to(`document:${socket.currentDocumentId}`).emit("document_format_change", {
            ...data,
            userId: socket.userId,
            userInfo: this.documentCollaborators.get(socket.currentDocumentId)?.get(socket.userId)?.userInfo,
            timestamp: new Date(),
          });
        }
      });

      // Handle document structure changes (paragraphs, lists, etc.)
      socket.on("document_structure_change", (data) => {
        if (socket.currentDocumentId) {
          socket.to(`document:${socket.currentDocumentId}`).emit("document_structure_change", {
            ...data,
            userId: socket.userId,
            userInfo: this.documentCollaborators.get(socket.currentDocumentId)?.get(socket.userId)?.userInfo,
            timestamp: new Date(),
          });
        }
      });

      // Handle document title changes
      socket.on("document_title_change", (data) => {
        if (socket.currentDocumentId) {
          socket.to(`document:${socket.currentDocumentId}`).emit("document_title_change", {
            ...data,
            userId: socket.userId,
            userInfo: this.documentCollaborators.get(socket.currentDocumentId)?.get(socket.userId)?.userInfo,
            timestamp: new Date(),
          });
        }
      });

      // Handle document save status
      socket.on("document_save_status", (data) => {
        if (socket.currentDocumentId) {
          socket.to(`document:${socket.currentDocumentId}`).emit("document_save_status", {
            ...data,
            userId: socket.userId,
            userInfo: this.documentCollaborators.get(socket.currentDocumentId)?.get(socket.userId)?.userInfo,
            timestamp: new Date(),
          });
        }
      });

      // Handle document comments (if implemented)
      socket.on("document_comment_added", (data) => {
        if (socket.currentDocumentId) {
          socket.to(`document:${socket.currentDocumentId}`).emit("document_comment_added", {
            ...data,
            userId: socket.userId,
            userInfo: this.documentCollaborators.get(socket.currentDocumentId)?.get(socket.userId)?.userInfo,
            timestamp: new Date(),
          });
        }
      });

      // Handle document comment resolved
      socket.on("document_comment_resolved", (data) => {
        if (socket.currentDocumentId) {
          socket.to(`document:${socket.currentDocumentId}`).emit("document_comment_resolved", {
            ...data,
            userId: socket.userId,
            userInfo: this.documentCollaborators.get(socket.currentDocumentId)?.get(socket.userId)?.userInfo,
            timestamp: new Date(),
          });
        }
      });

      // ========== CHAT EVENTS ==========
      
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
            this.removeUserFromChatRoom(socket.currentChatId, socket.id);
          }

          // Join new chat room
          socket.join(`chat:${chatId}`);
          socket.currentChatId = chatId;
          
          // Also join user-specific room for individual messaging
          socket.join(`user:${socket.userId}`);
          // console.log(`User ${socket.userId} joined user-specific room: user:${socket.userId}`);

          // Add to chat room
          if (!this.chatRooms.has(chatId)) {
            this.chatRooms.set(chatId, new Set());
          }
          this.chatRooms.get(chatId).add(socket.id);
          
          // console.log(`User ${socket.userId} joined chat room: chat:${chatId}`);

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
              const isOnline = this.io.sockets.adapter.rooms.has(`user:${participant.user._id}`);
              
              socket.emit('user_status_changed', {
                userId: participant.user._id,
                isOnline: isOnline,
                lastSeen: new Date()
              });
            }
          }

        } catch (error) {
          socket.emit("error", { message: "Failed to join chat" });
        }
      });

      // Leave chat room
      socket.on("leave_chat", (data) => {
        const { chatId } = data;
        if (socket.currentChatId === chatId) {
          socket.leave(`chat:${chatId}`);
          this.removeUserFromChatRoom(chatId, socket.id);
          socket.currentChatId = null;
        }
      });

      // Send message
      socket.on("send_message", async (data) => {
        console.log('🔍 Socket.IO send_message received:', {
          chatId: data.chatId,
          chatIdType: typeof data.chatId,
          content: data.content,
          type: data.type,
          media: data.media ? 'present' : 'not present',
          replyTo: data.replyTo,
          replyToType: typeof data.replyTo,
          sender: socket.userId,
          senderType: typeof socket.userId
        });
        
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
          
          console.log('🔍 Creating message with data:', {
            chat: messageData.chat,
            chatType: typeof messageData.chat,
            sender: messageData.sender,
            senderType: typeof messageData.sender,
            content: messageData.content,
            type: messageData.type,
            media: messageData.media,
            replyTo: messageData.replyTo,
            replyToType: typeof messageData.replyTo
          });
          
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
              console.error('Error updating unreadCount in socket:', unreadCountError);
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
            // Continue - message was still created successfully
          }

          // Send confirmation to the sender first
          socket.emit("message_confirmed", {
            messageId: message._id,
            content: message.content,
            chatId: cleanChatId
          });

          // Broadcast to all users in the chat
          // console.log(`Broadcasting message to chat room: chat:${cleanChatId}`);
          // console.log(`Message details:`, {
          //   messageId: message._id,
          //   content: message.content,
          //   senderId: socket.userId,
          //   senderName: socket.user.name
          // });
          
          const broadcastData = {
            message,
            chatId: cleanChatId,
            sender: {
              _id: cleanSenderId,
              name: socket.user.name,
              avatar: socket.user.avatar
            }
          };
          
          // console.log(`Broadcasting to room chat:${cleanChatId} with data:`, broadcastData);
          
          // Get the number of clients in the room
          const room = this.io.sockets.adapter.rooms.get(`chat:${cleanChatId}`);
          const clientCount = room ? room.size : 0;
          // console.log(`Number of clients in room chat:${cleanChatId}:`, clientCount);
          
          this.io.to(`chat:${cleanChatId}`).emit("new_message", broadcastData);
          
          // Also emit to individual users as backup
          chat.participants.forEach(participant => {
            if (participant.user._id.toString() !== cleanSenderId.toString()) {
              // console.log(`Sending message to individual user: ${participant.user._id}`);
              this.io.to(`user:${participant.user._id}`).emit("new_message", broadcastData);
            }
          });

          // Broadcast updated chat data to all connected users for chat list updates
          this.io.emit("chat_updated", {
            chatId: cleanChatId,
            updatedFields: {
              lastMessage: message,
              unreadCount: chat.unreadCount,
              updatedAt: new Date()
            }
          });

        } catch (error) {
          
          // Send more specific error message
          let errorMessage = "Failed to send message";
          if (error.name === 'ValidationError') {
            errorMessage = "Invalid message data";
          } else if (error.name === 'CastError') {
            errorMessage = "Invalid chat or user ID";
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
              console.error('Error setting unreadCount in socket:', error);
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
          this.io.emit("chat_updated", {
            chatId,
            updatedFields: {
              unreadCount: chat.unreadCount,
              lastSeen: participant.lastSeen
            }
          });
        } catch (error) {
          console.error('Error marking messages as read:', error);
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
          console.error('Error marking message as delivered:', error);
        }
      });

      // ========== CALL EVENTS ==========
      
      // Start call
      socket.on("start_call", async (data) => {
        try {
          const { chatId, type, participantIds } = data;
          
          let participants = [];
          
          if (chatId) {
            const chat = await Chat.findById(chatId);
            if (!chat) {
              socket.emit("error", "Chat not found");
              return;
            }

            // Verify user is participant
            const isParticipant = chat.participants.some(
              p => p.user.toString() === socket.userId
            );

            if (!isParticipant) {
              socket.emit("error", "You are not a participant in this chat");
              return;
            }

            participants = chat.participants
              .filter(p => p.user.toString() !== socket.userId)
              .map(p => ({
                user: p.user,
                status: 'invited'
              }));

            participants.unshift({
              user: socket.userId,
              status: 'joined',
              joinedAt: new Date()
            });
          } else {
            participants = [
              { user: socket.userId, status: 'joined', joinedAt: new Date() },
              ...participantIds.map(id => ({ user: id, status: 'invited' }))
            ];
          }

          const call = await Call.create({
            type: type || 'one-to-one',
            chat: chatId,
            participants,
            startedBy: socket.userId,
            status: 'ringing'
          });

          await call.populate('participants.user', 'name avatar');
          await call.populate('startedBy', 'name avatar');

          // Store active call
          this.activeCalls.set(call._id.toString(), {
            callId: call._id.toString(),
            participants: call.participants.map(p => p.user._id.toString()),
            status: 'ringing'
          });

          // Join call room
          socket.join(`call:${call._id}`);
          socket.currentCallId = call._id.toString();

          // Notify participants
          call.participants.forEach(participant => {
            if (participant.user._id.toString() !== socket.userId) {
              this.io.to(`user:${participant.user._id}`).emit("incoming_call", {
                callId: call._id,
                call,
                fromUserId: socket.userId,
                fromUserName: socket.user.name,
                fromUserAvatar: socket.user.avatar
              });
            }
          });

          // Set auto-termination timer (1 minute = 60000ms)
          setTimeout(async () => {
            try {
              const activeCall = this.activeCalls.get(call._id.toString());
              if (activeCall && activeCall.status === 'ringing') {
                // console.log(`Auto-terminating unanswered call: ${call._id}`);
                
                // Update call status in database
                await Call.findByIdAndUpdate(call._id, {
                  status: 'missed',
                  endedAt: new Date()
                });
                
                // Remove from active calls
                this.activeCalls.delete(call._id.toString());
                
                // Notify all participants
                this.io.to(`call:${call._id}`).emit("call_ended", {
                  callId: call._id,
                  reason: 'missed',
                  message: 'Call not answered within 1 minute'
                });
                
                // Also notify individual participants
                call.participants.forEach(participant => {
                  this.io.to(`user:${participant.user._id}`).emit("call_ended", {
                    callId: call._id,
                    reason: 'missed',
                    message: 'Call not answered within 1 minute'
                  });
                });
                
                // console.log(`Call ${call._id} auto-terminated due to timeout`);
              }
            } catch (error) {
              console.error('Error in auto-termination:', error);
            }
          }, 60000); // 1 minute timeout

          socket.emit("call_started", { 
            call
          });

          // Set timeout to mark call as missed if not answered
          const timeoutDuration = 30000; // 30 seconds
          const timeoutId = setTimeout(async () => {
            try {
              const currentCall = await Call.findById(call._id);
              if (currentCall && currentCall.status === 'ringing') {
                currentCall.status = 'missed';
                currentCall.endedAt = new Date();
                
                // Mark all non-joined participants as missed
                currentCall.participants.forEach(participant => {
                  if (participant.status === 'invited') {
                    participant.status = 'missed';
                  }
                });

                await currentCall.save();
                
                // Remove from active calls
                this.activeCalls.delete(call._id.toString());
                
                // Clear timeout from tracking
                this.callTimeouts.delete(call._id.toString());
                
                // Notify all participants
                this.io.to(`call:${call._id}`).emit("call_missed", {
                  callId: call._id,
                  call: currentCall
                });
              }
            } catch (error) {
              // Error handling call timeout
            }
          }, timeoutDuration);
          
          // Store timeout ID for potential cancellation
          this.callTimeouts.set(call._id.toString(), timeoutId);

        } catch (error) {
          socket.emit("error", "Failed to start call");
        }
      });

      // Join call
      socket.on("join_call", async (data) => {
        try {
          const { callId } = data;
          
          const call = await Call.findById(callId);
          if (!call) {
            socket.emit("error", { message: "Call not found" });
            return;
          }

          // Clear any existing timeouts for this call since someone joined
          if (this.callTimeouts && this.callTimeouts.has(callId)) {
            clearTimeout(this.callTimeouts.get(callId));
            this.callTimeouts.delete(callId);
            console.log(`Cleared timeout for joined call ${callId}`);
          }

          const participant = call.participants.find(
            p => p.user.toString() === socket.userId
          );

          if (!participant) {
            socket.emit("error", { message: "You are not invited to this call" });
            return;
          }

          participant.status = 'joined';
          participant.joinedAt = new Date();

          if (call.status === 'ringing') {
            call.status = 'ongoing';
          }

          await call.save();
          await call.populate('participants.user', 'name avatar');

          // Join call room
          socket.join(`call:${callId}`);
          socket.currentCallId = callId;

          // Notify others
          socket.to(`call:${callId}`).emit("participant_joined", {
            callId,
            userId: socket.userId,
            userName: socket.user.name,
            avatar: socket.user.avatar
          });

          // Emit call_joined to all participants (including the person who joined)
          this.io.to(`call:${callId}`).emit("call_joined", { call });
          
          // Also notify individual participants
          call.participants.forEach(participant => {
            this.io.to(`user:${participant.user._id}`).emit("call_joined", { call });
          });

          // Start participant count monitoring for ongoing calls
          if (call.status === 'ongoing') {
            this.startParticipantMonitoring(callId);
          }
        } catch (error) {
          socket.emit("error", "Failed to join call");
        }
      });

      // End call
      socket.on("end_call", async (data) => {
        try {
          const { callId } = data;
          console.log(`Call ended by ${socket.userId} for call ${callId}`);
          
          const call = await Call.findById(callId);
          if (!call) {
            console.log('Call not found:', callId);
            return;
          }

          // Clear any existing timeouts for this call
          if (this.callTimeouts && this.callTimeouts.has(callId)) {
            clearTimeout(this.callTimeouts.get(callId));
            this.callTimeouts.delete(callId);
            console.log(`Cleared timeout for ended call ${callId}`);
          }

          const participant = call.participants.find(
            p => p.user.toString() === socket.userId
          );

          if (participant) {
            participant.status = 'left';
            participant.leftAt = new Date();

            if (participant.joinedAt) {
              participant.duration = Math.floor(
                (new Date() - participant.joinedAt) / 1000
              );
            }
          }

          const allLeft = call.participants.every(p => p.status === 'left');

          // If call is still ringing and caller ends it, mark as ended
          if (call.status === 'ringing') {
            call.status = 'ended';
            call.endedAt = new Date();
            call.duration = Math.floor((call.endedAt - call.startedAt) / 1000);
            this.activeCalls.delete(callId);
          } else if (allLeft) {
            call.status = 'ended';
            call.endedAt = new Date();
            call.duration = Math.floor((call.endedAt - call.startedAt) / 1000);
            this.activeCalls.delete(callId);
          }

          await call.save();

          // Notify all participants individually
          call.participants.forEach(participant => {
            this.io.to(`user:${participant.user}`).emit("call_ended", {
              callId,
              call,
              endedBy: socket.userId,
              reason: 'ended'
            });
          });

          // Also notify the caller if they're not in participants (for ringing calls)
          if (call.startedBy && call.status === 'ringing') {
            this.io.to(`user:${call.startedBy}`).emit("call_ended", {
              callId,
              call,
              endedBy: socket.userId,
              reason: 'ended'
            });
          }

          // Also notify the call room
          this.io.to(`call:${callId}`).emit("call_ended", {
            callId,
            call,
            endedBy: socket.userId,
            reason: 'ended'
          });

          // Leave call room
          socket.leave(`call:${callId}`);
          socket.currentCallId = null;
          
          // console.log(`Call ${callId} ended and all participants notified`);
        } catch (error) {
          console.error('Error ending call:', error);
          socket.emit("error", "Failed to end call");
        }
      });

      // Reject call
      socket.on("reject_call", async (data) => {
        try {
          const { callId } = data;
          console.log(`Call rejected by ${socket.userId} for call ${callId}`);
          
          const call = await Call.findById(callId);
          if (!call) {
            console.log('Call not found:', callId);
            return;
          }

          // Clear any existing timeouts for this call
          if (this.callTimeouts && this.callTimeouts.has(callId)) {
            clearTimeout(this.callTimeouts.get(callId));
            this.callTimeouts.delete(callId);
            console.log(`Cleared timeout for rejected call ${callId}`);
          }

          const participant = call.participants.find(
            p => p.user.toString() === socket.userId
          );

          if (participant) {
            participant.status = 'rejected';
          }

          if (call.type === 'one-to-one') {
            call.status = 'rejected';
            call.endedAt = new Date();
            this.activeCalls.delete(callId);
          }

          await call.save();

          // Notify caller
          // console.log(`Notifying caller ${call.startedBy} about rejection`);
          this.io.to(`user:${call.startedBy}`).emit("call_rejected", {
            callId,
            rejectedBy: socket.userId,
            rejectedByName: socket.user.name
          });

          // Also notify all participants that the call has ended
          call.participants.forEach(participant => {
            this.io.to(`user:${participant.user}`).emit("call_ended", {
              callId,
              reason: 'rejected',
              rejectedBy: socket.userId,
              rejectedByName: socket.user.name
            });
          });

          // console.log(`Call ${callId} rejected and all participants notified`);
        } catch (error) {
          console.error('Error rejecting call:', error);
          socket.emit("error", "Failed to reject call");
        }
      });

      // Update call settings (camera, screen share)
      socket.on("update_call_settings", async (data) => {
        try {
          const { callId, videoEnabled, screenSharing } = data;
          
          const call = await Call.findById(callId);
          if (!call) return;

          const participant = call.participants.find(
            p => p.user.toString() === socket.userId
          );

          if (participant) {
            if (videoEnabled !== undefined) participant.videoEnabled = videoEnabled;
            if (screenSharing !== undefined) participant.screenSharing = screenSharing;

            await call.save();

            // Notify others
            socket.to(`call:${callId}`).emit("call_settings_updated", {
              callId,
              userId: socket.userId,
              videoEnabled: participant.videoEnabled,
              screenSharing: participant.screenSharing
            });
          }
        } catch (error) {
          // Error updating call settings
        }
      });

      // WebRTC Signaling Events
      socket.on("ice_candidate", (data) => {
        const { callId, candidate } = data;
        socket.to(`call:${callId}`).emit("ice_candidate", {
          callId,
          candidate,
          fromUserId: socket.userId
        });
      });

      socket.on("sdp_offer", (data) => {
        const { callId, offer } = data;
        socket.to(`call:${callId}`).emit("sdp_offer", {
          callId,
          offer,
          fromUserId: socket.userId
        });
      });

      socket.on("sdp_answer", (data) => {
        const { callId, answer } = data;
        socket.to(`call:${callId}`).emit("sdp_answer", {
          callId,
          answer,
          fromUserId: socket.userId
        });
      });

      // Task management events
      socket.on("join_project", (data) => {
        const { projectId } = data;
        if (projectId) {
          socket.join(`project:${projectId}`);
        }
      });

      socket.on("leave_project", (data) => {
        const { projectId } = data;
        if (projectId) {
          socket.leave(`project:${projectId}`);
        }
      });

      // Task events
      socket.on("task_created", (data) => {
        const { projectId, task } = data;
        socket.to(`project:${projectId}`).emit("task_created", { task });
      });

      socket.on("task_updated", (data) => {
        const { projectId, task } = data;
        socket.to(`project:${projectId}`).emit("task_updated", { task });
      });

      socket.on("task_moved", (data) => {
        const { projectId, task, oldStatus, newStatus } = data;
        socket.to(`project:${projectId}`).emit("task_moved", { 
          task, 
          oldStatus, 
          newStatus 
        });
      });

      socket.on("task_deleted", (data) => {
        const { projectId, taskId } = data;
        socket.to(`project:${projectId}`).emit("task_deleted", { taskId });
      });

      // Meeting events
      socket.on("meeting_created", (data) => {
        const { projectId, meeting } = data;
        socket.to(`project:${projectId}`).emit("meeting_created", { meeting });
      });

      socket.on("meeting_updated", (data) => {
        const { projectId, meeting } = data;
        socket.to(`project:${projectId}`).emit("meeting_updated", { meeting });
      });

      socket.on("meeting_started", (data) => {
        const { projectId, meeting } = data;
        socket.to(`project:${projectId}`).emit("meeting_started", { meeting });
      });

      socket.on("meeting_ended", (data) => {
        const { projectId, meeting } = data;
        socket.to(`project:${projectId}`).emit("meeting_ended", { meeting });
      });

      // Notification events
      socket.on("join_notifications", () => {
        socket.join(`notifications:${socket.userId}`);
      });

      socket.on("leave_notifications", () => {
        socket.leave(`notifications:${socket.userId}`);
      });

      socket.on("notification_sent", (data) => {
        const { userId, notification } = data;
        socket.to(`notifications:${userId}`).emit("notification_received", { notification });
      });

      // Workspace events
      socket.on("workspace_updated", (data) => {
        const { workspaceId, workspace } = data;
        socket.to(`workspace:${workspaceId}`).emit("workspace_updated", { workspace });
      });

      socket.on("project_created", (data) => {
        const { workspaceId, project } = data;
        socket.to(`workspace:${workspaceId}`).emit("project_created", { project });
      });

      socket.on("project_updated", (data) => {
        const { workspaceId, project } = data;
        socket.to(`workspace:${workspaceId}`).emit("project_updated", { project });
      });

      // Handle disconnect
      socket.on("disconnect", async () => {
        
        // Update user offline status with retry logic
        try {
          await retryableUserUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date()
          });
          
          // Notify all connected users about this user's offline status
          this.io.emit('user_status_changed', {
            userId: socket.userId,
            isOnline: false,
            lastSeen: new Date()
          });
          
          // console.log(`User ${socket.userId} is now offline - broadcasting status to all users`);
        } catch (error) {
          console.error('Error updating user offline status:', error);
        }
        
        if (socket.currentWhiteboardId) {
          socket.leave(`whiteboard:${socket.currentWhiteboardId}`);
          // Remove user from room
          this.removeUserFromRoom(socket.currentWhiteboardId, socket.id);
          
          // Notify others in the room
          socket.to(`whiteboard:${socket.currentWhiteboardId}`).emit("user_left", {
            userId: socket.userId,
            userInfo: this.activeUsers.get(socket.userId)?.userInfo,
            activeUsers: this.getActiveUsersInRoom(socket.currentWhiteboardId),
          });
        }

        // Handle chat disconnect
        if (socket.currentChatId) {
          socket.leave(`chat:${socket.currentChatId}`);
          this.removeUserFromChatRoom(socket.currentChatId, socket.id);
          socket.to(`chat:${socket.currentChatId}`).emit("user_left_chat", {
            userId: socket.userId
          });
        }

        // Handle call disconnect
        if (socket.currentCallId) {
          socket.leave(`call:${socket.currentCallId}`);
          const callData = this.activeCalls.get(socket.currentCallId);
          if (callData) {
            socket.to(`call:${socket.currentCallId}`).emit("participant_left", {
              callId: socket.currentCallId,
              userId: socket.userId
            });
          }
        }

        // Handle document disconnect
        if (socket.currentDocumentId) {
          socket.leave(`document:${socket.currentDocumentId}`);
          this.removeUserFromDocumentRoom(socket.currentDocumentId, socket.id);
          socket.to(`document:${socket.currentDocumentId}`).emit("user_left_document", {
            userId: socket.userId,
            activeCollaborators: this.getActiveCollaboratorsInDocument(socket.currentDocumentId),
          });
        }

        // Remove from active users
        this.activeUsers.delete(socket.userId);
      });
    });
  }

  removeUserFromRoom(whiteboardId, socketId) {
    if (this.whiteboardRooms.has(whiteboardId)) {
      this.whiteboardRooms.get(whiteboardId).delete(socketId);
      
      // Clean up empty rooms
      if (this.whiteboardRooms.get(whiteboardId).size === 0) {
        this.whiteboardRooms.delete(whiteboardId);
      }
    }
  }

  removeUserFromChatRoom(chatId, socketId) {
    if (this.chatRooms.has(chatId)) {
      this.chatRooms.get(chatId).delete(socketId);
      
      // Clean up empty rooms
      if (this.chatRooms.get(chatId).size === 0) {
        this.chatRooms.delete(chatId);
      }
    }
  }

  getActiveUsersInRoom(whiteboardId) {
    const activeUsers = [];
    
    if (this.whiteboardRooms.has(whiteboardId)) {
      for (const [userId, userData] of this.activeUsers) {
        if (userData.whiteboardId === whiteboardId) {
          activeUsers.push(userData.userInfo);
        }
      }
    }
    
    return activeUsers;
  }

  // Method to get active users count for a whiteboard
  getActiveUsersCount(whiteboardId) {
    return this.whiteboardRooms.get(whiteboardId)?.size || 0;
  }

  // Method to broadcast to all users in a whiteboard
  broadcastToWhiteboard(whiteboardId, event, data) {
    this.io.to(whiteboardId).emit(event, data);
  }

  // Method to send notification to specific user
  sendToUser(userId, event, data) {
    const userData = this.activeUsers.get(userId);
    if (userData) {
      this.io.to(userData.socketId).emit(event, data);
    }
  }

  // ========== DOCUMENT COLLABORATION HELPER METHODS ==========

  removeUserFromDocumentRoom(documentId, socketId) {
    if (this.documentRooms.has(documentId)) {
      this.documentRooms.get(documentId).delete(socketId);
      
      // Clean up empty rooms
      if (this.documentRooms.get(documentId).size === 0) {
        this.documentRooms.delete(documentId);
        this.documentCollaborators.delete(documentId);
      }
    }
  }

  getActiveCollaboratorsInDocument(documentId) {
    const activeCollaborators = [];
    
    if (this.documentCollaborators.has(documentId)) {
      for (const [userId, collaboratorData] of this.documentCollaborators.get(documentId)) {
        activeCollaborators.push({
          ...collaboratorData.userInfo,
          cursor: collaboratorData.cursor,
          selection: collaboratorData.selection,
        });
      }
    }
    
    return activeCollaborators;
  }

  // Method to get active collaborators count for a document
  getActiveCollaboratorsCount(documentId) {
    return this.documentRooms.get(documentId)?.size || 0;
  }

  // Method to broadcast to all users in a document
  broadcastToDocument(documentId, event, data) {
    this.io.to(`document:${documentId}`).emit(event, data);
  }

  // Method to send document notification to specific user
  sendDocumentNotificationToUser(userId, event, data) {
    // Find the user's socket in document rooms
    for (const [documentId, collaborators] of this.documentCollaborators) {
      if (collaborators.has(userId)) {
        const room = this.documentRooms.get(documentId);
        if (room) {
          for (const socketId of room) {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket && socket.userId === userId) {
              socket.emit(event, data);
              return;
            }
          }
        }
      }
    }
  }

  // Start participant count monitoring for a call
  startParticipantMonitoring(callId) {
    // Clear any existing monitoring for this call
    if (this.participantMonitoringIntervals) {
      const existingInterval = this.participantMonitoringIntervals.get(callId);
      if (existingInterval) {
        clearInterval(existingInterval);
      }
    } else {
      this.participantMonitoringIntervals = new Map();
    }

    console.log(`👥 Starting participant monitoring for call: ${callId}`);
    
    const interval = setInterval(async () => {
      try {
        const call = await Call.findById(callId);
        if (!call || call.status !== 'ongoing') {
          // Call ended or not found, stop monitoring
          clearInterval(interval);
          this.participantMonitoringIntervals.delete(callId);
          return;
        }

        // Count active participants (joined and not left)
        const activeParticipants = call.participants.filter(p => 
          p.status === 'joined' && !p.leftAt
        );

        console.log(`👥 Call ${callId} has ${activeParticipants.length} active participants`);

        // If less than 2 participants, end the call
        if (activeParticipants.length < 2) {
          console.log(`📞 Auto-ending call ${callId} - insufficient participants`);
          
          // Update call status
          call.status = 'ended';
          call.endedAt = new Date();
          call.duration = Math.floor((call.endedAt - call.startedAt) / 1000);
          await call.save();

          // Remove from active calls
          this.activeCalls.delete(callId);

          // Notify all participants
          this.io.to(`call:${callId}`).emit("call_ended", {
            callId,
            reason: 'insufficient_participants',
            message: 'Call ended - insufficient participants'
          });

          // Also notify individual participants
          call.participants.forEach(participant => {
            this.io.to(`user:${participant.user._id}`).emit("call_ended", {
              callId,
              reason: 'insufficient_participants',
              message: 'Call ended - insufficient participants'
            });
          });

          // Stop monitoring
          clearInterval(interval);
          this.participantMonitoringIntervals.delete(callId);
        }
      } catch (error) {
        console.error('Error in participant monitoring:', error);
        clearInterval(interval);
        this.participantMonitoringIntervals.delete(callId);
      }
    }, 5000); // Check every 5 seconds

    this.participantMonitoringIntervals.set(callId, interval);
  }
}

export default SocketServer;
