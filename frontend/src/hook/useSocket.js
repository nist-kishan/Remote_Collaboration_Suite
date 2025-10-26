import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { isExtensionError } from '../utils/errorHandler';
import { SOCKET_CONFIG, LOGGING_CONFIG } from '../config/environment';
import { getSocketInstance } from '../utils/socketInstance';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Clear any existing connection error
    setConnectionError(null);
    
    // Get the shared singleton socket instance
    socketRef.current = getSocketInstance();
    
    if (!socketRef.current) {
      console.error('❌ Failed to get socket instance');
      return;
    }
    
    // Update connection state if already connected
    if (socketRef.current.connected) {
      setIsConnected(true);
    }

    // Define event handlers
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    const handleDisconnect = (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socketRef.current?.connect();
      }
    };

    const handleConnectError = (error) => {
      // Don't log WebSocket transport errors as they're normal fallback behavior
      if (error.message.includes('WebSocket is closed before the connection is established')) {
        return;
      }
      setConnectionError(error.message);
      setIsConnected(false);
    };

    const handleReconnect = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    const handleReconnectError = (error) => {
      setConnectionError(error.message);
    };

    const handleReconnectFailed = () => {
      setConnectionError('Failed to reconnect to server');
    };

    const handleError = (error) => {
      // Check if this is a browser extension error
      if (isExtensionError(error)) {
        return;
      }
      
      // Filter out call-related errors when using meetings (different system)
      if (typeof error === 'string') {
        if (error.includes('call is already in progress') || 
            error.includes('Failed to start call') ||
            error.includes('Failed to send message')) {
          return; // Ignore these errors - they're handled by specific handlers
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Socket error:', error);
      }
    };

    // Register event listeners
    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('connect_error', handleConnectError);
    socketRef.current.on('reconnect', handleReconnect);
    socketRef.current.on('reconnect_error', handleReconnectError);
    socketRef.current.on('reconnect_failed', handleReconnectFailed);
    socketRef.current.on('error', handleError);

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('connect_error', handleConnectError);
        socketRef.current.off('reconnect', handleReconnect);
        socketRef.current.off('reconnect_error', handleReconnectError);
        socketRef.current.off('reconnect_failed', handleReconnectFailed);
        socketRef.current.off('error', handleError);
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

