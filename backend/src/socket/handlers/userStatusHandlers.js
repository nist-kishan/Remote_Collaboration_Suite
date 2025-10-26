import { retryableUserUpdate } from "../../utils/databaseRetry.js";

/**
 * User Status Socket Handlers
 * Handles user online/offline status, location tracking, and online users list
 */
export const registerUserStatusHandlers = (socket, io, state) => {
  const { userLocations, lastUserStatusUpdate, lastUserStatusBroadcast } = state;

  // Handle user online status (with throttling)
  socket.on('user_online', async (data) => {
    try {
      const { userId } = data;
      if (userId && userId === socket.userId) {
        // Check if we already processed this user recently (throttling)
        const lastUpdate = lastUserStatusUpdate?.get(userId);
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
        if (!state.lastUserStatusUpdate) {
          state.lastUserStatusUpdate = new Map();
        }
        state.lastUserStatusUpdate.set(userId, now);
        
        // Notify all users about this user coming online
        io.emit('user_online', {
          userId: userId,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error in user_online handler:', error);
    }
  });

  // Handle user offline status (with throttling)
  socket.on('user_offline', async (data) => {
    try {
      const { userId } = data;
      if (userId && userId === socket.userId) {
        // Check if we already processed this user recently (throttling)
        const lastUpdate = lastUserStatusUpdate?.get(userId);
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
        if (!state.lastUserStatusUpdate) {
          state.lastUserStatusUpdate = new Map();
        }
        state.lastUserStatusUpdate.set(userId, now);
        
        // Notify all users about this user going offline
        io.emit('user_offline', {
          userId: userId,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error in user_offline handler:', error);
    }
  });

  // Handle get online users request (with throttling)
  socket.on('get_online_users', async () => {
    try {
      // Throttle get_online_users requests to prevent spam
      const socketId = socket.id;
      const lastRequest = state.lastGetOnlineUsersRequest?.get(socketId);
      const now = Date.now();
      
      if (lastRequest && (now - lastRequest) < 2000) { // 2 second throttle
        return; // Skip this request
      }
      
      // Track last request time
      if (!state.lastGetOnlineUsersRequest) {
        state.lastGetOnlineUsersRequest = new Map();
      }
      state.lastGetOnlineUsersRequest.set(socketId, now);
      
      // Get all online users from database
      const User = (await import("../../models/user.model.js")).default;
      const onlineUsers = await User.find({ isOnline: true }).select('_id name avatar');
      
      socket.emit('online_users', {
        users: onlineUsers,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error in get_online_users handler:', error);
    }
  });

  // Handle user location updates
  socket.on('update_location', (data) => {
    try {
      const { currentPage } = data;
      if (currentPage) {
        userLocations.set(socket.userId, {
          currentPage,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error in update_location handler:', error);
    }
  });

  // Handle get user location request
  socket.on('get_user_location', (data) => {
    try {
      const { userId } = data;
      const location = userLocations.get(userId);
      socket.emit('user_location', {
        userId,
        location: location || null
      });
    } catch (error) {
      console.error('Error in get_user_location handler:', error);
    }
  });
};
