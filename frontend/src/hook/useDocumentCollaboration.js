import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

export const useDocumentCollaboration = (documentId) => {
  const { socket, isConnected } = useSocket();
  const [activeCollaborators, setActiveCollaborators] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [saveStatus, setSaveStatus] = useState({});
  const [isJoined, setIsJoined] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const lastCursorPositionRef = useRef(null);

  // Join document room
  const joinDocument = useCallback(() => {
    if (socket && documentId && isConnected) {
      console.log(`Joining document room: ${documentId}`);
      socket.emit('join_document', { documentId });
      setIsJoined(true);
    }
  }, [socket, documentId, isConnected]);

  // Leave document room
  const leaveDocument = useCallback(() => {
    if (socket && documentId && isJoined) {
      console.log(`Leaving document room: ${documentId}`);
      socket.emit('leave_document', { documentId });
      setIsJoined(false);
      setActiveCollaborators([]);
      setTypingUsers([]);
      setSaveStatus({});
    }
  }, [socket, documentId, isJoined]);

  // Send content changes
  const sendContentChange = useCallback((changeData) => {
    if (socket && documentId && isJoined) {
      socket.emit('document_content_change', {
        documentId,
        ...changeData,
      });
    }
  }, [socket, documentId, isJoined]);

  // Send cursor movement
  const sendCursorMove = useCallback((cursorData) => {
    if (socket && documentId && isJoined) {
      // Throttle cursor updates to avoid spam
      const now = Date.now();
      if (lastCursorPositionRef.current && now - lastCursorPositionRef.current < 100) {
        return;
      }
      lastCursorPositionRef.current = now;

      socket.emit('document_cursor_move', {
        documentId,
        ...cursorData,
      });
    }
  }, [socket, documentId, isJoined]);

  // Send selection changes
  const sendSelectionChange = useCallback((selectionData) => {
    if (socket && documentId && isJoined) {
      socket.emit('document_selection_change', {
        documentId,
        ...selectionData,
      });
    }
  }, [socket, documentId, isJoined]);

  // Send typing indicator
  const sendTyping = useCallback((typingData = {}) => {
    if (socket && documentId && isJoined) {
      socket.emit('document_typing', {
        documentId,
        ...typingData,
      });
      
      setIsTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping();
      }, 2000);
    }
  }, [socket, documentId, isJoined]);

  // Send stop typing
  const sendStopTyping = useCallback(() => {
    if (socket && documentId && isJoined) {
      socket.emit('document_stop_typing', { documentId });
      setIsTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [socket, documentId, isJoined]);

  // Send format changes
  const sendFormatChange = useCallback((formatData) => {
    if (socket && documentId && isJoined) {
      socket.emit('document_format_change', {
        documentId,
        ...formatData,
      });
    }
  }, [socket, documentId, isJoined]);

  // Send structure changes
  const sendStructureChange = useCallback((structureData) => {
    if (socket && documentId && isJoined) {
      socket.emit('document_structure_change', {
        documentId,
        ...structureData,
      });
    }
  }, [socket, documentId, isJoined]);

  // Send title changes
  const sendTitleChange = useCallback((titleData) => {
    if (socket && documentId && isJoined) {
      socket.emit('document_title_change', {
        documentId,
        ...titleData,
      });
    }
  }, [socket, documentId, isJoined]);

  // Send save status
  const sendSaveStatus = useCallback((statusData) => {
    if (socket && documentId && isJoined) {
      socket.emit('document_save_status', {
        documentId,
        ...statusData,
      });
    }
  }, [socket, documentId, isJoined]);

  // Setup event listeners
  useEffect(() => {
    if (!socket || !documentId) return;

    // User joined document
    const handleUserJoined = (data) => {
      console.log('User joined document:', data);
      setActiveCollaborators(data.activeCollaborators || []);
    };

    // User left document
    const handleUserLeft = (data) => {
      console.log('User left document:', data);
      setActiveCollaborators(data.activeCollaborators || []);
    };

    // Active collaborators update
    const handleActiveCollaborators = (data) => {
      console.log('Active collaborators:', data);
      setActiveCollaborators(data.activeCollaborators || []);
    };

    // Content changes
    const handleContentChange = (data) => {
      console.log('Document content change received:', data);
      // This will be handled by the editor component
    };

    // Cursor movement
    const handleCursorMove = (data) => {
      // This will be handled by the editor component to show other users' cursors
    };

    // Selection changes
    const handleSelectionChange = (data) => {
      // This will be handled by the editor component to show other users' selections
    };

    // Typing indicators
    const handleUserTyping = (data) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.userId !== data.userId);
        return [...filtered, {
          userId: data.userId,
          userName: data.userName,
          avatar: data.avatar,
          timestamp: Date.now(),
        }];
      });
    };

    const handleUserStopTyping = (data) => {
      setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
    };

    // Format changes
    const handleFormatChange = (data) => {
      console.log('Document format change received:', data);
      // This will be handled by the editor component
    };

    // Structure changes
    const handleStructureChange = (data) => {
      console.log('Document structure change received:', data);
      // This will be handled by the editor component
    };

    // Title changes
    const handleTitleChange = (data) => {
      console.log('Document title change received:', data);
      // This will be handled by the editor component
    };

    // Save status
    const handleSaveStatus = (data) => {
      console.log('Document save status received:', data);
      setSaveStatus(prev => ({
        ...prev,
        [data.userId]: {
          status: data.status,
          timestamp: data.timestamp,
          userInfo: data.userInfo,
        },
      }));
    };

    // Error handling
    const handleError = (error) => {
      console.error('Document collaboration error:', error);
    };

    // Register event listeners
    socket.on('user_joined_document', handleUserJoined);
    socket.on('user_left_document', handleUserLeft);
    socket.on('active_collaborators', handleActiveCollaborators);
    socket.on('document_content_change', handleContentChange);
    socket.on('document_cursor_move', handleCursorMove);
    socket.on('document_selection_change', handleSelectionChange);
    socket.on('document_user_typing', handleUserTyping);
    socket.on('document_user_stop_typing', handleUserStopTyping);
    socket.on('document_format_change', handleFormatChange);
    socket.on('document_structure_change', handleStructureChange);
    socket.on('document_title_change', handleTitleChange);
    socket.on('document_save_status', handleSaveStatus);
    socket.on('error', handleError);

    // Cleanup function
    return () => {
      socket.off('user_joined_document', handleUserJoined);
      socket.off('user_left_document', handleUserLeft);
      socket.off('active_collaborators', handleActiveCollaborators);
      socket.off('document_content_change', handleContentChange);
      socket.off('document_cursor_move', handleCursorMove);
      socket.off('document_selection_change', handleSelectionChange);
      socket.off('document_user_typing', handleUserTyping);
      socket.off('document_user_stop_typing', handleUserStopTyping);
      socket.off('document_format_change', handleFormatChange);
      socket.off('document_structure_change', handleStructureChange);
      socket.off('document_title_change', handleTitleChange);
      socket.off('document_save_status', handleSaveStatus);
      socket.off('error', handleError);
    };
  }, [socket, documentId]);

  // Auto-join when connected
  useEffect(() => {
    if (isConnected && documentId && !isJoined) {
      joinDocument();
    }
  }, [isConnected, documentId, isJoined, joinDocument]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      leaveDocument();
    };
  }, [leaveDocument]);

  return {
    // State
    activeCollaborators,
    isTyping,
    typingUsers,
    saveStatus,
    isJoined,
    isConnected,
    
    // Actions
    joinDocument,
    leaveDocument,
    sendContentChange,
    sendCursorMove,
    sendSelectionChange,
    sendTyping,
    sendStopTyping,
    sendFormatChange,
    sendStructureChange,
    sendTitleChange,
    sendSaveStatus,
  };
};
