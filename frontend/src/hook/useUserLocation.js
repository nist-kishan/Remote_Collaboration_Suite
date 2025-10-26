import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocket } from './useSocket';

/**
 * Hook to track and broadcast user's current page location
 * This allows other users to know where you are in the app
 */
export const useUserLocation = () => {
  const location = useLocation();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Send location update to server
    const currentPage = location.pathname;
    
    socket.emit('update_location', {
      currentPage,
      timestamp: new Date()
    });

    console.log('📍 Location updated:', currentPage);
  }, [location.pathname, socket, isConnected]);

  return {
    currentPage: location.pathname
  };
};

/**
 * Hook to get another user's current location
 */
export const useGetUserLocation = (userId) => {
  const { socket, isConnected } = useSocket();

  const getUserLocation = (callback) => {
    if (!socket || !isConnected || !userId) {
      callback(null);
      return;
    }

    // Request user location
    socket.emit('get_user_location', { userId });

    // Listen for response
    const handleLocationResponse = (data) => {
      if (data.userId === userId) {
        callback(data.location);
        socket.off('user_location_response', handleLocationResponse);
      }
    };

    socket.on('user_location_response', handleLocationResponse);

    // Cleanup after timeout
    setTimeout(() => {
      socket.off('user_location_response', handleLocationResponse);
    }, 5000);
  };

  return { getUserLocation };
};
