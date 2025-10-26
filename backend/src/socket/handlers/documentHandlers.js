import Document from "../../models/document.model.js";

/**
 * Document Collaboration Socket Handlers
 * Handles real-time document editing, cursor tracking, and collaborative features
 */
export const registerDocumentHandlers = (socket, io, state) => {
  const { documentRooms, documentCollaborators } = state;

  // Helper function to get active collaborators in a document
  const getActiveCollaboratorsInDocument = (documentId) => {
    const collaborators = documentCollaborators.get(documentId);
    if (!collaborators) return [];
    
    return Array.from(collaborators.values()).map(collab => ({
      ...collab.userInfo,
      cursor: collab.cursor,
      selection: collab.selection,
    }));
  };

  // Helper function to remove user from document room
  const removeUserFromDocumentRoom = (documentId, socketId) => {
    const room = documentRooms.get(documentId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        documentRooms.delete(documentId);
      }
    }
    
    const collaborators = documentCollaborators.get(documentId);
    if (collaborators) {
      collaborators.delete(socket.userId);
      if (collaborators.size === 0) {
        documentCollaborators.delete(documentId);
      }
    }
  };

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
        removeUserFromDocumentRoom(socket.currentDocumentId, socket.id);
      }

      // Join new document room
      socket.join(`document:${documentId}`);
      socket.currentDocumentId = documentId;

      // Add to document room
      if (!documentRooms.has(documentId)) {
        documentRooms.set(documentId, new Set());
      }
      documentRooms.get(documentId).add(socket.id);

      // Add to document collaborators
      if (!documentCollaborators.has(documentId)) {
        documentCollaborators.set(documentId, new Map());
      }
      
      documentCollaborators.get(documentId).set(socket.userId, {
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
        user: documentCollaborators.get(documentId).get(socket.userId).userInfo,
        activeCollaborators: getActiveCollaboratorsInDocument(documentId),
      });

      // Send current active collaborators to the joining user
      socket.emit("active_collaborators", {
        activeCollaborators: getActiveCollaboratorsInDocument(documentId),
      });

    } catch (error) {
      console.error('Error in join_document handler:', error);
      socket.emit("error", { message: "Failed to join document" });
    }
  });

  // Leave document room
  socket.on("leave_document", (data) => {
    const { documentId } = data;
    if (socket.currentDocumentId === documentId) {
      socket.leave(`document:${documentId}`);
      removeUserFromDocumentRoom(documentId, socket.id);
      socket.currentDocumentId = null;
      
      // Notify others
      socket.to(`document:${documentId}`).emit("user_left_document", {
        userId: socket.userId,
        activeCollaborators: getActiveCollaboratorsInDocument(documentId),
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
        userInfo: documentCollaborators.get(socket.currentDocumentId)?.get(socket.userId)?.userInfo,
        timestamp: new Date(),
      });
    }
  });

  // Handle cursor movement
  socket.on("document_cursor_move", (data) => {
    if (socket.currentDocumentId) {
      const documentId = socket.currentDocumentId;
      
      // Update cursor position for this user
      if (documentCollaborators.has(documentId)) {
        const collaborator = documentCollaborators.get(documentId).get(socket.userId);
        if (collaborator) {
          collaborator.cursor = data;
        }
      }

      // Broadcast to others
      socket.to(`document:${documentId}`).emit("document_cursor_move", {
        ...data,
        userId: socket.userId,
        userInfo: documentCollaborators.get(documentId)?.get(socket.userId)?.userInfo,
      });
    }
  });

  // Handle text selection
  socket.on("document_selection_change", (data) => {
    if (socket.currentDocumentId) {
      const documentId = socket.currentDocumentId;
      
      // Update selection for this user
      if (documentCollaborators.has(documentId)) {
        const collaborator = documentCollaborators.get(documentId).get(socket.userId);
        if (collaborator) {
          collaborator.selection = data;
        }
      }

      // Broadcast to others
      socket.to(`document:${documentId}`).emit("document_selection_change", {
        ...data,
        userId: socket.userId,
        userInfo: documentCollaborators.get(documentId)?.get(socket.userId)?.userInfo,
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
        userInfo: documentCollaborators.get(socket.currentDocumentId)?.get(socket.userId)?.userInfo,
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
        userInfo: documentCollaborators.get(socket.currentDocumentId)?.get(socket.userId)?.userInfo,
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
        userInfo: documentCollaborators.get(socket.currentDocumentId)?.get(socket.userId)?.userInfo,
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
        userInfo: documentCollaborators.get(socket.currentDocumentId)?.get(socket.userId)?.userInfo,
        timestamp: new Date(),
      });
    }
  });

  // Handle document comments
  socket.on("document_comment_added", (data) => {
    if (socket.currentDocumentId) {
      socket.to(`document:${socket.currentDocumentId}`).emit("document_comment_added", {
        ...data,
        userId: socket.userId,
        userInfo: documentCollaborators.get(socket.currentDocumentId)?.get(socket.userId)?.userInfo,
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
        userInfo: documentCollaborators.get(socket.currentDocumentId)?.get(socket.userId)?.userInfo,
        timestamp: new Date(),
      });
    }
  });

  // Return cleanup function
  return {
    cleanup: () => {
      if (socket.currentDocumentId) {
        removeUserFromDocumentRoom(socket.currentDocumentId, socket.id);
      }
    },
    getActiveCollaboratorsInDocument,
    removeUserFromDocumentRoom
  };
};
