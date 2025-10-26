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
    const frontendUrl = process.env.FRONTEND_URL;
    
    // Production-ready CORS configuration
    const corsOrigins = [
      frontendUrl
    ];

    // Remove duplicates and filter out undefined values
    const uniqueOrigins = [...new Set(corsOrigins.filter(Boolean))];

    this.io = new Server(server, {
      cors: {
        origin: function (origin, callback) {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);
          
          if (uniqueOrigins.includes(origin)) {
            callback(null, true);
          } else {
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
    this.callRooms = new Map(); // callId -> Map of userId -> socketId
    this.documentCollaborators = new Map(); // documentId -> Map of userId -> { cursor, selection, userInfo }
    this.userLocations = new Map(); // userId -> { currentPage, timestamp }

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startCallCleanup();
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
        
        // Also emit user_online event for frontend compatibility (with throttling)
        const lastBroadcast = this.lastUserStatusBroadcast?.get(socket.userId);
        const now = Date.now();
        
        if (!lastBroadcast || (now - lastBroadcast) > 5000) { // 5 second throttle
          this.io.emit('user_online', {
            userId: socket.userId,
            timestamp: new Date()
          });
          
          // Track last broadcast time
          if (!this.lastUserStatusBroadcast) {
            this.lastUserStatusBroadcast = new Map();
          }
          this.lastUserStatusBroadcast.set(socket.userId, now);
        }
        
      } catch (error) {
        }
      
      // Send connection confirmation
      socket.emit('connection_confirmed', {
        message: 'Socket connected successfully',
        userId: socket.userId,
        socketId: socket.id
      });

      // ========== USER STATUS EVENTS ==========
      
      // Handle user online status (with throttling)
      socket.on('user_online', async (data) => {
        try {
          const { userId } = data;
          if (userId && userId === socket.userId) {
            // Check if we already processed this user recently (throttling)
            const lastUpdate = this.lastUserStatusUpdate?.get(userId);
            const now = Date.now();
            
            if (lastUpdate && (now - lastUpdate) < 5000) { // 5 second throttle
              return; // Skip this update
            }
            
            // Update user online status
            await retryableUserUpdate(userId, {
              isOnline: true,
              lastSeen: new Date()
            });
            
            // Track last update time
            if (!this.lastUserStatusUpdate) {
              this.lastUserStatusUpdate = new Map();
            }
            this.lastUserStatusUpdate.set(userId, now);
            
            // Notify all users about this user coming online
            this.io.emit('user_online', {
              userId: userId,
              timestamp: new Date()
            });
          }
        } catch (error) {
          }
      });

      // Handle user offline status (with throttling)
      socket.on('user_offline', async (data) => {
        try {
          const { userId } = data;
          if (userId && userId === socket.userId) {
            // Check if we already processed this user recently (throttling)
            const lastUpdate = this.lastUserStatusUpdate?.get(userId);
            const now = Date.now();
            
            if (lastUpdate && (now - lastUpdate) < 5000) { // 5 second throttle
              return; // Skip this update
            }
            
            // Update user offline status
            await retryableUserUpdate(userId, {
              isOnline: false,
              lastSeen: new Date()
            });
            
            // Track last update time
            if (!this.lastUserStatusUpdate) {
              this.lastUserStatusUpdate = new Map();
            }
            this.lastUserStatusUpdate.set(userId, now);
            
            // Notify all users about this user going offline
            this.io.emit('user_offline', {
              userId: userId,
              timestamp: new Date()
            });
          }
        } catch (error) {
          }
      });

      // Handle get online users request (with throttling)
      socket.on('get_online_users', async () => {
        try {
          // Throttle get_online_users requests to prevent spam
          const socketId = socket.id;
          const lastRequest = this.lastOnlineUsersRequest?.get(socketId);
          const now = Date.now();
          
          if (lastRequest && (now - lastRequest) < 10000) { // 10 second throttle
            return; // Skip this request
          }
          
          // Track last request time
          if (!this.lastOnlineUsersRequest) {
            this.lastOnlineUsersRequest = new Map();
          }
          this.lastOnlineUsersRequest.set(socketId, now);
          
          // Get all online users from database
          const onlineUsers = await User.find(
            { isOnline: true },
            { _id: 1 }
          );
          
          const onlineUserIds = onlineUsers.map(user => user._id.toString());
          
          // Send bulk online users to the requesting socket
          socket.emit('bulk_online_users', {
            userIds: onlineUserIds,
            timestamp: new Date()
          });
        } catch (error) {
          }
      });

      // Handle user location updates
      socket.on('update_location', (data) => {
        try {
          const { currentPage } = data;
          if (currentPage) {
            this.userLocations.set(socket.userId, {
              currentPage,
              timestamp: new Date()
            });
          }
        } catch (error) {
          console.error('Error updating user location:', error);
        }
      });

      // Handle get user location request
      socket.on('get_user_location', (data) => {
        try {
          const { userId } = data;
          const location = this.userLocations.get(userId);
          socket.emit('user_location_response', {
            userId,
            location: location || null
          });
        } catch (error) {
          console.error('Error getting user location:', error);
        }
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

      // Handle whiteboard real-time updates for collaborative editing
      socket.on("whiteboard-update", async (data) => {
        try {
          const { whiteboardId, canvasData, shapes, elements, userId } = data;
          
          if (!whiteboardId || !socket.currentWhiteboardId || whiteboardId !== socket.currentWhiteboardId) {
            return;
          }

          // Broadcast the update to all other users in the room (excluding sender)
          socket.to(`whiteboard:${whiteboardId}`).emit("whiteboard-update", {
            ...data,
            userId: socket.userId,
            userInfo: this.activeUsers.get(socket.userId)?.userInfo,
            timestamp: new Date()
          });

          // Update the whiteboard in database with merged data
          if (shapes || elements || canvasData) {
            try {
              const whiteboard = await Whiteboard.findById(whiteboardId);
              if (whiteboard && whiteboard.hasPermission(socket.userId, "editor")) {
                // Merge the new data with existing canvas data
                const existingCanvasData = whiteboard.canvasData || {};
                
                if (shapes || elements) {
                  const existingShapes = existingCanvasData.shapes || existingCanvasData.elements || [];
                  const newShapes = shapes || elements || [];
                  
                  // Create a map of existing shapes by ID to avoid duplicates
                  const existingShapesMap = new Map();
                  existingShapes.forEach(shape => {
                    if (shape.id) {
                      existingShapesMap.set(shape.id, shape);
                    }
                  });
                  
                  // Add new shapes that don't already exist
                  const mergedShapes = [...existingShapes];
                  newShapes.forEach(shape => {
                    if (shape.id && !existingShapesMap.has(shape.id)) {
                      mergedShapes.push(shape);
                    } else if (!shape.id) {
                      // Add shapes without IDs (they are new)
                      mergedShapes.push(shape);
                    }
                  });
                  
                  // Update the canvas data with merged shapes
                  whiteboard.canvasData = {
                    ...existingCanvasData,
                    shapes: mergedShapes,
                    elements: mergedShapes,
                    lastModifiedBy: socket.userId,
                    lastModifiedAt: new Date()
                  };
                } else if (canvasData) {
                  // For other canvas data types, merge the objects
                  whiteboard.canvasData = {
                    ...existingCanvasData,
                    ...canvasData,
                    lastModifiedBy: socket.userId,
                    lastModifiedAt: new Date()
                  };
                }
                
                whiteboard.lastModifiedBy = socket.userId;
                whiteboard.version += 1;
                
                await whiteboard.save();
                }
            } catch (error) {
              }
          }
        } catch (error) {
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

          // Add to chat room
          if (!this.chatRooms.has(chatId)) {
            this.chatRooms.set(chatId, new Set());
          }
          this.chatRooms.get(chatId).add(socket.id);

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
            // Continue - message was still created successfully
          }

          // Send confirmation to the sender first
          socket.emit("message_confirmed", {
            messageId: message._id,
            content: message.content,
            chatId: cleanChatId
          });

          // Broadcast to all users in the chat
          
          const broadcastData = {
            message,
            chatId: cleanChatId,
            sender: {
              _id: cleanSenderId,
              name: socket.user.name,
              avatar: socket.user.avatar
            }
          };

          // Get the number of clients in the room
          const room = this.io.sockets.adapter.rooms.get(`chat:${cleanChatId}`);
          const clientCount = room ? room.size : 0;
          
          this.io.to(`chat:${cleanChatId}`).emit("new_message", broadcastData);
          
          // Also emit to individual users as backup
          chat.participants.forEach(participant => {
            if (participant.user._id.toString() !== cleanSenderId.toString()) {
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

            // Check for existing ongoing calls between the same participants
            // Only check for calls with the same type to avoid conflicts with meetings
            const existingCall = await Call.findOne({
              chat: chatId,
              type: type || 'video', // Only check for same call type
              status: { $in: ['ringing', 'ongoing'] },
              caller: socket.userId // Only check calls initiated by this user
            });

            if (existingCall) {
              console.log(`⚠️ User ${socket.userId} already has an active call in chat ${chatId}`);
              socket.emit("error", "You already have an active call in this chat");
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
              const targetUserId = participant.user._id.toString();
              const targetLocation = this.userLocations.get(targetUserId);
              
              console.log(`📞 Sending incoming_call to user:${targetUserId} (location: ${targetLocation?.currentPage || 'unknown'})`);
              
              // Send call notification to user's personal room (works from any page)
              this.io.to(`user:${targetUserId}`).emit("incoming_call", {
                callId: call._id,
                call,
                fromUserId: socket.userId,
                fromUserName: socket.user.name,
                fromUserAvatar: socket.user.avatar,
                recipientLocation: targetLocation?.currentPage || null,
                ringing: true,
                createdAt: new Date()
              });
              
              console.log(`✅ Incoming call emitted to user:${targetUserId}`);
            }
          });

          // Set auto-termination timer (45 seconds = 45000ms)
          const timeoutId = setTimeout(async () => {
            try {
              const activeCall = this.activeCalls.get(call._id.toString());
              if (activeCall && activeCall.status === 'ringing') {
                
                // Update call status in database
                await Call.findByIdAndUpdate(call._id, {
                  status: 'missed',
                  endedAt: new Date()
                });
                
                // Remove from active calls
                this.activeCalls.delete(call._id.toString());
                
                // Clear the timeout reference
                this.callTimeouts.delete(call._id.toString());
                
                // Notify all participants
                this.io.to(`call:${call._id}`).emit("call_ended", {
                  callId: call._id,
                  reason: 'missed',
                  message: 'Call not answered within 45 seconds'
                });
                
                // Also notify individual participants
                call.participants.forEach(participant => {
                  this.io.to(`user:${participant.user._id}`).emit("call_ended", {
                    callId: call._id,
                    reason: 'missed',
                    message: 'Call not answered within 45 seconds'
                  });
                });
                
              }
            } catch (error) {
              }
          }, parseInt(process.env.CALL_TIMEOUT_MS) || 45000); // Use environment variable
          
          // Store timeout reference for cleanup
          this.callTimeouts.set(call._id.toString(), timeoutId);

          socket.emit("call_started", { 
            call,
            ringing: true
          });

          // Set timeout to mark call as missed if not answered
          const timeoutDuration = parseInt(process.env.CALL_TIMEOUT_MS) || 30000; // 30 seconds
          const missedTimeoutId = setTimeout(async () => {
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
          
          // Store missed timeout reference
          this.callTimeouts.set(`missed_${call._id}`, missedTimeoutId);
          
          // Store timeout ID for potential cancellation
          this.callTimeouts.set(call._id.toString(), timeoutId);

        } catch (error) {
          console.error('❌ Error in start_call handler:', error.message);
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
          this.io.to(`call:${callId}`).emit("call_joined", { call, ringing: false });

          // Emit call_accepted to the caller specifically
          const caller = call.participants.find(p => p.user._id.toString() === call.startedBy.toString());
          if (caller) {
            this.io.to(`user:${call.startedBy}`).emit("call_accepted", { 
              call,
              acceptedBy: socket.userId,
              acceptedByName: socket.user.name,
              ringing: false
            });
          }

          // Also notify individual participants
          call.participants.forEach(participant => {
            this.io.to(`user:${participant.user._id}`).emit("call_joined", { call, ringing: false });
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
          
          const call = await Call.findById(callId);
          if (!call) {
            return;
          }

          // Clear any existing timeouts for this call
          if (this.callTimeouts && this.callTimeouts.has(callId)) {
            clearTimeout(this.callTimeouts.get(callId));
            this.callTimeouts.delete(callId);
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
              reason: 'ended',
              ringing: false
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
          
        } catch (error) {
          socket.emit("error", "Failed to end call");
        }
      });

      // Leave call (explicit leave, not disconnect)
      socket.on("leave_call", async (data) => {
        try {
          const { callId } = data;
          
          const call = await Call.findById(callId);
          if (!call) {
            socket.emit("error", "Call not found");
            return;
          }

          const participant = call.participants.find(
            p => p.user.toString() === socket.userId
          );

          if (!participant) {
            socket.emit("error", "You are not a participant in this call");
            return;
          }

          if (participant.status === 'joined') {
            participant.status = 'left';
            participant.leftAt = new Date();

            if (participant.joinedAt) {
              participant.duration = Math.floor(
                (new Date() - participant.joinedAt) / 1000
              );
            }

            // Check if all participants have left
            const allLeft = call.participants.every(p => 
              p.status === 'left' || p.status === 'rejected' || p.status === 'missed'
            );

            if (allLeft) {
              call.status = 'ended';
              call.endedAt = new Date();
            }

            await call.save();

            // Leave socket room
            socket.leave(`call:${callId}`);
            socket.currentCallId = null;

            // Notify others
            socket.to(`call:${callId}`).emit("participant_left", {
              callId,
              userId: socket.userId,
              userName: socket.user.name
            });

            }
        } catch (error) {
          socket.emit("error", "Failed to leave call");
        }
      });

      // Reject call
      socket.on("reject_call", async (data) => {
        try {
          const { callId } = data;
          const call = await Call.findById(callId);
          if (!call) {
            return;
          }

          // Clear any existing timeouts for this call
          if (this.callTimeouts && this.callTimeouts.has(callId)) {
            clearTimeout(this.callTimeouts.get(callId));
            this.callTimeouts.delete(callId);
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
          this.io.to(`user:${call.startedBy}`).emit("call_rejected", {
            callId,
            rejectedBy: socket.userId,
            rejectedByName: socket.user.name,
            ringing: false
          });

          // Also notify all participants that the call has ended
          call.participants.forEach(participant => {
            this.io.to(`user:${participant.user}`).emit("call_ended", {
              callId,
              reason: 'rejected',
              rejectedBy: socket.userId,
              rejectedByName: socket.user.name,
              ringing: false
            });
          });

        } catch (error) {
          socket.emit("error", "Failed to reject call");
        }
      });

      // Cancel call (caller cancels before receiver picks up)
      socket.on("cancel_call", async (data) => {
        try {
          const { callId } = data;
          const call = await Call.findById(callId);
          if (!call) {
            return;
          }

          // Verify that the person canceling is the one who started the call
          if (call.startedBy.toString() !== socket.userId) {
            socket.emit("error", "Only the caller can cancel the call");
            return;
          }

          // Clear any existing timeouts for this call
          if (this.callTimeouts && this.callTimeouts.has(callId)) {
            clearTimeout(this.callTimeouts.get(callId));
            this.callTimeouts.delete(callId);
          }
          if (this.callTimeouts && this.callTimeouts.has(`missed_${callId}`)) {
            clearTimeout(this.callTimeouts.get(`missed_${callId}`));
            this.callTimeouts.delete(`missed_${callId}`);
          }

          // Update call status
          call.status = 'cancelled';
          call.endedAt = new Date();
          this.activeCalls.delete(callId);

          await call.save();

          console.log(`🚫 Call ${callId} cancelled by ${socket.user.name}`);

          // Notify all participants that the call was cancelled
          call.participants.forEach(participant => {
            this.io.to(`user:${participant.user}`).emit("call_cancelled", {
              callId,
              cancelledBy: socket.userId,
              cancelledByName: socket.user.name,
              message: `${socket.user.name} cancelled the call`,
              ringing: false
            });
          });

          // Also emit call_ended for cleanup
          call.participants.forEach(participant => {
            this.io.to(`user:${participant.user}`).emit("call_ended", {
              callId,
              reason: 'cancelled',
              cancelledBy: socket.userId,
              cancelledByName: socket.user.name,
              ringing: false
            });
          });

        } catch (error) {
          console.error('❌ Error canceling call:', error);
          socket.emit("error", "Failed to cancel call");
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

      // Meeting room events
      socket.on("join_meeting_room", (data) => {
        const { meetingId } = data;
        if (meetingId) {
          console.log(`🔌 User ${socket.userId} joining meeting room: ${meetingId}`);
          socket.join(`meeting:${meetingId}`);
          socket.currentMeetingId = meetingId;
          
          // Notify others in the meeting room
          socket.to(`meeting:${meetingId}`).emit("participant_joined", {
            meetingId,
            participant: {
              user: socket.user,
              userId: socket.userId,
              joinedAt: new Date()
            }
          });
          
          // Confirm join to the user
          socket.emit("meeting_room_joined", {
            meetingId,
            message: "Joined meeting room successfully"
          });
        }
      });

      socket.on("leave_meeting_room", async (data) => {
        const { meetingId } = data;
        if (meetingId && socket.currentMeetingId === meetingId) {
          console.log(`👋 User ${socket.userId} leaving meeting room: ${meetingId}`);
          
          // Notify others in the meeting room
          socket.to(`meeting:${meetingId}`).emit("participant_left", {
            meetingId,
            userId: socket.userId,
            user: socket.user
          });
          
          socket.leave(`meeting:${meetingId}`);
          socket.currentMeetingId = null;
          
          // Confirm leave to the user
          socket.emit("meeting_room_left", {
            meetingId,
            message: "Left meeting room successfully"
          });

          // Check if meeting room is empty and delete instant meetings
          try {
            const Meeting = require("../models/meeting.model.js").default;
            const meeting = await Meeting.findById(meetingId);
            
            if (meeting && meeting.meetingType === 'instant') {
              // Get all sockets in the meeting room
              const socketsInRoom = await this.io.in(`meeting:${meetingId}`).fetchSockets();
              
              if (socketsInRoom.length === 0) {
                console.log(`🗑️ No participants left in instant meeting ${meetingId}, deleting...`);
                
                // Delete the meeting
                await Meeting.findByIdAndDelete(meetingId);
                
                // Notify all users that meeting was deleted
                this.io.emit("meeting_deleted", {
                  meetingId: meeting._id,
                  message: "Meeting ended - no participants remaining"
                });
                
                console.log(`✅ Instant meeting ${meetingId} deleted successfully`);
              }
            }
          } catch (error) {
            console.error(`❌ Error checking/deleting empty meeting:`, error);
          }
        }
      });

      // ========== WEBRTC SIGNALING EVENTS FOR MEETINGS ==========
      
      // Join call - WebRTC room for signaling
      socket.on("join-call", (data) => {
        const { callId, userId } = data;
        if (callId) {
          const userIdToUse = userId || socket.userId;
          console.log(`📞 User ${userIdToUse} joining WebRTC call: ${callId}`);
          
          socket.join(`call:${callId}`);
          socket.currentCallId = callId;
          
          // Track user in call room
          if (!this.callRooms.has(callId)) {
            this.callRooms.set(callId, new Map());
          }
          this.callRooms.get(callId).set(userIdToUse, socket.id);
          
          // Notify others that a new user joined (for WebRTC peer connection setup)
          socket.to(`call:${callId}`).emit("user-joined", {
            userId: userIdToUse,
            user: socket.user
          });
          
          console.log(`✅ User ${userIdToUse} joined call room: ${callId}`);
        }
      });

      // Leave call - WebRTC room cleanup
      socket.on("leave-call", (data) => {
        const { callId, userId } = data;
        if (callId && socket.currentCallId === callId) {
          const userIdToUse = userId || socket.userId;
          console.log(`📞 User ${userIdToUse} leaving WebRTC call: ${callId}`);
          
          // Remove user from call room tracking
          if (this.callRooms.has(callId)) {
            this.callRooms.get(callId).delete(userIdToUse);
            if (this.callRooms.get(callId).size === 0) {
              this.callRooms.delete(callId);
            }
          }
          
          // Notify others that user left
          socket.to(`call:${callId}`).emit("user-left", {
            userId: userIdToUse
          });
          
          socket.leave(`call:${callId}`);
          socket.currentCallId = null;
          
          console.log(`✅ User ${userIdToUse} left call room: ${callId}`);
        }
      });

      // WebRTC Offer - Send offer to specific peer
      socket.on("offer", (data) => {
        const { callId, offer, to } = data;
        console.log(`📤 Relaying offer from ${socket.userId} to ${to} in call ${callId}`);
        
        // Get target socket ID
        const targetSocketId = this.callRooms.get(callId)?.get(to);
        
        if (targetSocketId) {
          // Send offer to the specific peer
          this.io.to(targetSocketId).emit("offer", {
            from: socket.userId,
            offer: offer
          });
        } else {
          console.warn(`⚠️ Target user ${to} not found in call ${callId}`);
        }
      });

      // WebRTC Answer - Send answer to specific peer
      socket.on("answer", (data) => {
        const { callId, answer, to } = data;
        console.log(`📤 Relaying answer from ${socket.userId} to ${to} in call ${callId}`);
        
        // Get target socket ID
        const targetSocketId = this.callRooms.get(callId)?.get(to);
        
        if (targetSocketId) {
          // Send answer to the specific peer
          this.io.to(targetSocketId).emit("answer", {
            from: socket.userId,
            answer: answer
          });
        } else {
          console.warn(`⚠️ Target user ${to} not found in call ${callId}`);
        }
      });

      // WebRTC ICE Candidate - Exchange ICE candidates
      socket.on("ice-candidate", (data) => {
        const { callId, candidate, to } = data;
        console.log(`🧊 Relaying ICE candidate from ${socket.userId} to ${to} in call ${callId}`);
        
        // Get target socket ID
        const targetSocketId = this.callRooms.get(callId)?.get(to);
        
        if (targetSocketId) {
          // Send ICE candidate to the specific peer
          this.io.to(targetSocketId).emit("ice-candidate", {
            from: socket.userId,
            candidate: candidate
          });
        } else {
          console.warn(`⚠️ Target user ${to} not found in call ${callId}`);
        }
      });

      // Meeting chat message
      socket.on("meeting_chat_message", (data) => {
        const { meetingId, message, text } = data;
        if (socket.currentMeetingId === meetingId) {
          console.log(`💬 Chat message in meeting ${meetingId} from ${socket.userId}`);
          
          const chatMessage = {
            id: Date.now().toString(),
            meetingId,
            userId: socket.userId,
            senderId: socket.userId,
            userName: socket.user.name,
            userAvatar: socket.user.avatar,
            message: message || text,
            text: message || text,
            timestamp: new Date(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          
          // Broadcast to all users in the meeting including sender
          this.io.to(`meeting:${meetingId}`).emit("meeting_chat_message", chatMessage);
        }
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
          
          // Also emit user_offline event for frontend compatibility (with throttling)
          const lastBroadcast = this.lastUserStatusBroadcast?.get(socket.userId);
          const now = Date.now();
          
          if (!lastBroadcast || (now - lastBroadcast) > 5000) { // 5 second throttle
            this.io.emit('user_offline', {
              userId: socket.userId,
              timestamp: new Date()
            });
            
            // Track last broadcast time
            if (!this.lastUserStatusBroadcast) {
              this.lastUserStatusBroadcast = new Map();
            }
            this.lastUserStatusBroadcast.set(socket.userId, now);
          }
          
        } catch (error) {
          // Error handling for disconnect
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

        // Handle meeting room disconnect
        if (socket.currentMeetingId) {
          console.log(`👋 User ${socket.userId} disconnected from meeting: ${socket.currentMeetingId}`);
          socket.to(`meeting:${socket.currentMeetingId}`).emit("participant_left", {
            meetingId: socket.currentMeetingId,
            userId: socket.userId,
            user: socket.user
          });
          socket.leave(`meeting:${socket.currentMeetingId}`);
          socket.currentMeetingId = null;
        }

        // Handle call disconnect
        if (socket.currentCallId) {
          console.log(`📞 User ${socket.userId} disconnected from WebRTC call: ${socket.currentCallId}`);
          
          // Notify other peers in the call that this user left (for WebRTC cleanup)
          socket.to(`call:${socket.currentCallId}`).emit("user-left", {
            userId: socket.userId
          });
          
          socket.leave(`call:${socket.currentCallId}`);
          
          try {
            // Update call participant status in database
            const call = await Call.findById(socket.currentCallId);
            if (call) {
              const participant = call.participants.find(
                p => p.user.toString() === socket.userId
              );

              if (participant && participant.status === 'joined') {
                participant.status = 'left';
                participant.leftAt = new Date();

                if (participant.joinedAt) {
                  participant.duration = Math.floor(
                    (new Date() - participant.joinedAt) / 1000
                  );
                }

                // Check if all participants have left
                const allLeft = call.participants.every(p => 
                  p.status === 'left' || p.status === 'rejected' || p.status === 'missed'
                );

                if (allLeft) {
                  call.status = 'ended';
                  call.endedAt = new Date();
                }

                await call.save();
                }
            }
          } catch (error) {
            }

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

        // If less than 2 participants, end the call
        if (activeParticipants.length < 2) {
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
        clearInterval(interval);
        this.participantMonitoringIntervals.delete(callId);
      }
    }, parseInt(process.env.SOCKET_CLEANUP_INTERVAL) || 5000); // Check every 5 seconds

    this.participantMonitoringIntervals.set(callId, interval);
  }

  // Start periodic cleanup of stale calls
  startCallCleanup() {
    // Run cleanup every 30 seconds
    setInterval(async () => {
      try {
        const now = new Date();
        const staleThreshold = new Date(now.getTime() - 60000); // 60 seconds ago

        // Find calls that are stuck in 'ringing' for more than 60 seconds
        const staleRingingCalls = await Call.find({
          status: 'ringing',
          startedAt: { $lt: staleThreshold }
        });

        for (const call of staleRingingCalls) {
          call.status = 'missed';
          call.endedAt = new Date();
          await call.save();
          console.log(` Cleaned up stale ringing call: ${call._id}`);
        }

        // Find calls that are still marked as 'ongoing' but have no active participants
        const staleCalls = await Call.find({
          status: 'ongoing',
          'participants.status': 'joined'
        });

        for (const call of staleCalls) {
          // Check if any participants are actually still active (not left)
          const activeParticipants = call.participants.filter(p => 
            p.status === 'joined' && !p.leftAt
          );

          if (activeParticipants.length < 2) {
            // Mark all participants as left
            call.participants.forEach(participant => {
              if (participant.status === 'joined') {
                participant.status = 'left';
                participant.leftAt = new Date();
                
                if (participant.joinedAt) {
                  participant.duration = Math.floor(
                    (new Date() - participant.joinedAt) / 1000
                  );
                }
              }
            });

            // End the call
            call.status = 'ended';
            call.endedAt = new Date();
            await call.save();
            console.log(` Cleaned up stale ongoing call: ${call._id}`);
          }
        }

      } catch (error) {
        console.error(' Error in call cleanup:', error);
      }
    }, 30000); // Run every 30 seconds
  }
}

export default SocketServer;
