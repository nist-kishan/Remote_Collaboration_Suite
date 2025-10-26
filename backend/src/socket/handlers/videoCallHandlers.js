/**
 * Video Call Socket Handlers - Refactored
 * Handles call signaling and WebRTC relay
 */

module.exports = (io, socket) => {
  console.log(`📞 Video call handlers registered for user: ${socket.userId}`);

  /**
   * User joins a call room
   */
  socket.on('call:join', async ({ callId, userId }) => {
    try {
      console.log(`👤 User ${userId} joining call: ${callId}`);
      
      // Join the call room
      socket.join(`call:${callId}`);
      
      // Notify others in the room that a new user joined
      socket.to(`call:${callId}`).emit('call:user-joined', {
        userId,
        user: {
          _id: socket.userId,
          name: socket.user?.name,
          avatar: socket.user?.avatar
        }
      });
      
      console.log(`✅ User ${userId} joined call room: call:${callId}`);
      
    } catch (error) {
      console.error('❌ Error joining call:', error);
      socket.emit('call:error', { message: 'Failed to join call' });
    }
  });

  /**
   * User leaves a call room
   */
  socket.on('call:leave', async ({ callId, userId }) => {
    try {
      console.log(`👤 User ${userId} leaving call: ${callId}`);
      
      // Leave the call room
      socket.leave(`call:${callId}`);
      
      // Notify others that user left
      socket.to(`call:${callId}`).emit('call:ended', {
        callId,
        userId
      });
      
      console.log(`✅ User ${userId} left call room: call:${callId}`);
      
    } catch (error) {
      console.error('❌ Error leaving call:', error);
    }
  });

  /**
   * User rejects a call
   */
  socket.on('call:reject', async ({ callId, userId }) => {
    try {
      console.log(`❌ User ${userId} rejected call: ${callId}`);
      
      // Notify the caller that call was rejected
      socket.to(`call:${callId}`).emit('call:rejected', {
        callId,
        userId
      });
      
    } catch (error) {
      console.error('❌ Error rejecting call:', error);
    }
  });

  /**
   * WebRTC: Relay SDP offer to other peer
   */
  socket.on('webrtc:offer', ({ callId, offer }) => {
    try {
      console.log(`📤 Relaying WebRTC offer for call: ${callId}`);
      
      // Relay offer to other peer in the call room
      socket.to(`call:${callId}`).emit('webrtc:offer', {
        offer,
        fromUserId: socket.userId
      });
      
    } catch (error) {
      console.error('❌ Error relaying offer:', error);
    }
  });

  /**
   * WebRTC: Relay SDP answer to other peer
   */
  socket.on('webrtc:answer', ({ callId, answer }) => {
    try {
      console.log(`📤 Relaying WebRTC answer for call: ${callId}`);
      
      // Relay answer to other peer in the call room
      socket.to(`call:${callId}`).emit('webrtc:answer', {
        answer,
        fromUserId: socket.userId
      });
      
    } catch (error) {
      console.error('❌ Error relaying answer:', error);
    }
  });

  /**
   * WebRTC: Relay ICE candidate to other peer
   */
  socket.on('webrtc:ice-candidate', ({ callId, candidate }) => {
    try {
      console.log(`🧊 Relaying ICE candidate for call: ${callId}`);
      
      // Relay ICE candidate to other peer in the call room
      socket.to(`call:${callId}`).emit('webrtc:ice-candidate', {
        candidate,
        fromUserId: socket.userId
      });
      
    } catch (error) {
      console.error('❌ Error relaying ICE candidate:', error);
    }
  });

  /**
   * Handle disconnect - cleanup call rooms
   */
  socket.on('disconnect', () => {
    console.log(`📞 User ${socket.userId} disconnected, cleaning up call rooms`);
    
    // Get all rooms this socket is in
    const rooms = Array.from(socket.rooms);
    
    // Find call rooms (format: call:callId)
    const callRooms = rooms.filter(room => room.startsWith('call:'));
    
    // Notify others in each call room
    callRooms.forEach(room => {
      const callId = room.replace('call:', '');
      socket.to(room).emit('call:ended', {
        callId,
        userId: socket.userId
      });
    });
  });
};
