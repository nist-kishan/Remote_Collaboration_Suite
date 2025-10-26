import { io } from 'socket.io-client';
import { SOCKET_CONFIG, LOGGING_CONFIG } from '../config/environment';

let socketInstance = null;
let isInitializing = false;

/**
 * Get or create a single shared Socket.IO instance
 * Ensures only one connection per app lifecycle
 */
export const getSocketInstance = () => {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  if (isInitializing) {
    return socketInstance;
  }

  isInitializing = true;

  try {
    socketInstance = io(SOCKET_CONFIG.URL, {
      withCredentials: true,
      transports: SOCKET_CONFIG.TRANSPORTS,
      timeout: SOCKET_CONFIG.TIMEOUT,
      reconnection: true,
      reconnectionAttempts: SOCKET_CONFIG.RECONNECTION_ATTEMPTS,
      reconnectionDelay: SOCKET_CONFIG.RECONNECTION_DELAY,
      reconnectionDelayMax: SOCKET_CONFIG.RECONNECTION_DELAY * 5,
      autoConnect: true,
    });

    // Expose to window for global access (used by useMessages hook)
    if (typeof window !== 'undefined') {
      window.socket = socketInstance;
    }

  } catch (error) {
    console.error('❌ Failed to create socket instance:', error);
  } finally {
    isInitializing = false;
  }

  return socketInstance;
};

/**
 * Disconnect and reset the socket instance
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

/**
 * Get the current socket instance without creating a new one
 */
export const getCurrentSocket = () => {
  return socketInstance;
};
