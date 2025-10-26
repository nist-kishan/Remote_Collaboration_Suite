// Chat debugging utilities for real-time message issues
export const debugChatConnection = () => {
  console.log('🔍 Chat Connection Debug:');

  if (typeof window !== 'undefined' && window.socket) {
    const socket = window.socket;
    console.log('✅ Socket instance found:', socket.connected ? 'Connected' : 'Disconnected');
    console.log('📍 Socket ID:', socket.id);
    console.log('🔗 Socket URL:', socket.io?.engine?.transport?.uri);

    // Check current rooms
    if (socket.rooms) {
      console.log('🏠 Current rooms:', Array.from(socket.rooms));
    }

    // Test socket connectivity
    socket.emit('test_connection', { timestamp: Date.now() });
    console.log('📡 Test message sent');

  } else {
    console.log('❌ No socket instance found on window');
  }
};

export const debugMessageFlow = (chatId) => {
  console.log(`💬 Message Flow Debug for chat ${chatId}:`);

  if (typeof window !== 'undefined' && window.socket) {
    const socket = window.socket;

    // Test joining chat room
    console.log('🚪 Attempting to join chat room...');
    socket.emit('join_chat', { chatId });

    // Listen for debug events
    const debugHandler = (data) => {
      console.log('📨 Debug event received:', data);
      socket.off('debug_response', debugHandler);
    };

    socket.on('debug_response', debugHandler);
    socket.emit('debug_chat', { chatId, action: 'test' });

  } else {
    console.log('❌ Socket not available for message flow debug');
  }
};

export const forceChatRefresh = (chatId) => {
  console.log(`🔄 Force refreshing chat ${chatId}...`);

  // Invalidate React Query cache
  if (typeof window !== 'undefined') {
    // Try to access React Query
    if (window.queryClient) {
      window.queryClient.invalidateQueries(['messages', chatId]);
      window.queryClient.refetchQueries(['messages', chatId]);
      console.log('✅ React Query cache invalidated');
    } else {
      console.log('⚠️ React Query client not found on window');
    }

    // Try to trigger socket events
    if (window.socket) {
      window.socket.emit('join_chat', { chatId });
      console.log('🚪 Re-joined chat room via socket');
    }
  }
};
