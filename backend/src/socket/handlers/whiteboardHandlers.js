import Whiteboard from "../../models/whiteboard.model.js";

/**
 * Whiteboard Socket Handlers
 * Handles real-time whiteboard collaboration including drawing, shapes, and cursor movements
 */
export const registerWhiteboardHandlers = (socket, io, state) => {
  const { activeUsers, whiteboardRooms } = state;

  // Helper function to get active users in a whiteboard room
  const getActiveUsersInRoom = (whiteboardId) => {
    const room = whiteboardRooms.get(whiteboardId);
    if (!room) return [];
    
    return Array.from(room).map(socketId => {
      const user = Array.from(activeUsers.values()).find(u => u.socketId === socketId);
      return user?.userInfo;
    }).filter(Boolean);
  };

  // Helper function to remove user from room
  const removeUserFromRoom = (whiteboardId, socketId) => {
    const room = whiteboardRooms.get(whiteboardId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        whiteboardRooms.delete(whiteboardId);
      }
    }
  };

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
        removeUserFromRoom(socket.currentWhiteboardId, socket.id);
      }

      // Join new room
      socket.join(`whiteboard:${whiteboardId}`);
      socket.currentWhiteboardId = whiteboardId;

      // Add user to active users
      activeUsers.set(socket.userId, {
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
      if (!whiteboardRooms.has(whiteboardId)) {
        whiteboardRooms.set(whiteboardId, new Set());
      }
      whiteboardRooms.get(whiteboardId).add(socket.id);

      // Notify others in the room
      socket.to(`whiteboard:${whiteboardId}`).emit("user_joined", {
        user: activeUsers.get(socket.userId).userInfo,
        activeUsers: getActiveUsersInRoom(whiteboardId),
      });

      // Send current active users to the joining user
      socket.emit("active_users", {
        activeUsers: getActiveUsersInRoom(whiteboardId),
      });

    } catch (error) {
      console.error('Error in join_whiteboard handler:', error);
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
        userInfo: activeUsers.get(socket.userId)?.userInfo,
      });
    }
  });

  // Handle cursor movement
  socket.on("cursor_move", (data) => {
    if (socket.currentWhiteboardId) {
      socket.to(`whiteboard:${socket.currentWhiteboardId}`).emit("cursor_move", {
        ...data,
        userId: socket.userId,
        userInfo: activeUsers.get(socket.userId)?.userInfo,
      });
    }
  });

  // Handle canvas state sync
  socket.on("canvas_state", (data) => {
    if (socket.currentWhiteboardId) {
      // Check canvas data size to prevent performance issues
      const dataSize = JSON.stringify(data).length;
      const MAX_CANVAS_SIZE = 1000000; // 1MB limit
      
      if (dataSize > MAX_CANVAS_SIZE) {
        socket.emit("error", { 
          message: "Canvas data too large. Please simplify your drawing or clear some elements.",
          code: "CANVAS_SIZE_EXCEEDED",
          maxSize: MAX_CANVAS_SIZE,
          currentSize: dataSize
        });
        console.warn(`⚠️ Canvas size exceeded: ${dataSize} bytes (max: ${MAX_CANVAS_SIZE})`);
        return;
      }
      
      socket.to(`whiteboard:${socket.currentWhiteboardId}`).emit("canvas_state", {
        ...data,
        userId: socket.userId,
        userInfo: activeUsers.get(socket.userId)?.userInfo,
      });
    }
  });

  // Handle shape creation
  socket.on("shape_created", (data) => {
    if (socket.currentWhiteboardId) {
      socket.to(`whiteboard:${socket.currentWhiteboardId}`).emit("shape_created", {
        ...data,
        userId: socket.userId,
        userInfo: activeUsers.get(socket.userId)?.userInfo,
      });
    }
  });

  // Handle text creation
  socket.on("text_created", (data) => {
    if (socket.currentWhiteboardId) {
      socket.to(`whiteboard:${socket.currentWhiteboardId}`).emit("text_created", {
        ...data,
        userId: socket.userId,
        userInfo: activeUsers.get(socket.userId)?.userInfo,
      });
    }
  });

  // Handle object deletion
  socket.on("object_deleted", (data) => {
    if (socket.currentWhiteboardId) {
      socket.to(`whiteboard:${socket.currentWhiteboardId}`).emit("object_deleted", {
        ...data,
        userId: socket.userId,
        userInfo: activeUsers.get(socket.userId)?.userInfo,
      });
    }
  });

  // Handle object modification
  socket.on("object_modified", (data) => {
    if (socket.currentWhiteboardId) {
      socket.to(`whiteboard:${socket.currentWhiteboardId}`).emit("object_modified", {
        ...data,
        userId: socket.userId,
        userInfo: activeUsers.get(socket.userId)?.userInfo,
      });
    }
  });

  // Handle whiteboard chat messages
  socket.on("chat_message", (data) => {
    if (socket.currentWhiteboardId) {
      const message = {
        ...data,
        userId: socket.userId,
        userInfo: activeUsers.get(socket.userId)?.userInfo,
        timestamp: new Date(),
      };
      
      // Broadcast to all users in the room including sender
      io.to(`whiteboard:${socket.currentWhiteboardId}`).emit("chat_message", message);
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
        userInfo: activeUsers.get(socket.userId)?.userInfo,
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
          console.error('Error saving whiteboard:', error);
        }
      }
    } catch (error) {
      console.error('Error in whiteboard-update handler:', error);
    }
  });

  // Return cleanup function
  return {
    cleanup: () => {
      if (socket.currentWhiteboardId) {
        removeUserFromRoom(socket.currentWhiteboardId, socket.id);
      }
    },
    getActiveUsersInRoom,
    removeUserFromRoom
  };
};
