import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { isExtensionError } from '../utils/errorHandler';
import { SOCKET_CONFIG, LOGGING_CONFIG } from '../config/environment';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      // Clear any existing connection error
      setConnectionError(null);
      
      // Log connection attempt
      if (LOGGING_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('Attempting to connect to socket...');
      }
      
      socketRef.current = io(SOCKET_CONFIG.URL, {
        withCredentials: true, // Use cookies for authentication
        transports: SOCKET_CONFIG.TRANSPORTS,
        timeout: SOCKET_CONFIG.TIMEOUT,
        forceNew: true, // Force new connection
        reconnection: true,
        reconnectionAttempts: SOCKET_CONFIG.RECONNECTION_ATTEMPTS,
        reconnectionDelay: SOCKET_CONFIG.RECONNECTION_DELAY,
        reconnectionDelayMax: SOCKET_CONFIG.RECONNECTION_DELAY * 5,
        autoConnect: true
      });

      socketRef.current.on('connect', () => {
        // setIsConnected(true);
        setConnectionError(null);
      });

      socketRef.current.on('connection_confirmed', (data) => {
        // Connection confirmed
      });

      socketRef.current.on('user_status_changed', (data) => {
        // Handle user online/offline status changes
        // This will be handled by components that need to update user status
      });

      socketRef.current.on('messages_read', (data) => {
        // Handle messages read status updates
      });

      socketRef.current.on('message_delivered', (data) => {
        // Handle message delivery status updates
      });

      socketRef.current.on('chat_updated', (data) => {
        // Handle chat updates (unread count, last message, etc.)
      });

      socketRef.current.on('disconnect', (reason) => {
        // setIsConnected(false);
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          socketRef.current.connect();
        }
      });

      socketRef.current.on('connect_error', (error) => {
        // Don't log WebSocket transport errors as they're normal fallback behavior
        if (error.message.includes('WebSocket is closed before the connection is established')) {
          return;
        }

        setConnectionError(error.message);
        setIsConnected(false);
      });

      socketRef.current.on('reconnect', (attemptNumber) => {
        setIsConnected(true);
        setConnectionError(null);
      });

      socketRef.current.on('reconnect_error', (error) => {
        setConnectionError(error.message);
      });

      socketRef.current.on('reconnect_failed', () => {
        setConnectionError('Failed to reconnect to server');
      });

      socketRef.current.on('error', (error) => {
        // Check if this is a browser extension error
        if (isExtensionError(error)) {
          return;
        }
        console.error('Socket error:', error);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  return { 
    socket: socketRef.current, 
    isConnected, 
    connectionError,
    reconnect: () => {
      if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
    }
  };
};

