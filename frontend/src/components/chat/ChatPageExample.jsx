import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../hook/useSocket';
import { useReadStatus, useTotalUnreadCount } from '../../hook/useChat';
import TotalUnreadBadge from '../chat/TotalUnreadBadge';
import UnreadBadge from '../chat/UnreadBadge';
import ReadReceipt from '../chat/ReadReceipt';

// Example component showing how to integrate read/unread functionality
const ChatPageExample = ({ chatId }) => {
  const { user } = useSelector((state) => state.auth);
  const { socket } = useSocket();
  const { 
    markMessagesAsRead, 
    markMessageAsDelivered, 
    markMessageAsRead,
    handleMessageReceived,
    handleChatOpened 
  } = useReadStatus(chatId);
  
  const { data: totalUnreadData } = useTotalUnreadCount();
  const [messages, setMessages] = useState([]);

  // Handle incoming messages and mark as delivered
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      setMessages(prev => [...prev, data.message]);
      
      // Mark message as delivered if it's not from current user
      if (data.message.sender._id !== user?._id) {
        handleMessageReceived(data.message);
      }
    };

    const handleMessagesRead = (data) => {
      if (data.chatId === chatId) {
        // Update UI to reflect read status
        console.log(`Messages read by user ${data.userId}`);
      }
    };

    const handleMessageDelivered = (data) => {
      if (data.chatId === chatId) {
        // Update UI to reflect delivery status
        console.log(`Message delivered to user ${data.userId}`);
      }
    };

    const handleChatUpdated = (data) => {
      if (data.chatId === chatId) {
        // Update chat list with new unread counts
        console.log('Chat updated:', data.updatedFields);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('chat_updated', handleChatUpdated);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('chat_updated', handleChatUpdated);
    };
  }, [socket, chatId, user, handleMessageReceived]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (chatId) {
      handleChatOpened();
    }
  }, [chatId, handleChatOpened]);

  const handleSendMessage = (content) => {
    // Send message logic here
    // The message will be marked as delivered when received by other users
  };

  const handleScrollToBottom = () => {
    // Mark all messages as read when user scrolls to bottom
    markMessagesAsRead();
  };

  const handleMessageClick = (messageId) => {
    // Mark specific message as read (for read receipts)
    markMessageAsRead(messageId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with total unread count */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-lg font-semibold">Chat</h1>
        <TotalUnreadBadge />
      </div>

      {/* Chat list with individual unread counts */}
      <div className="flex-1 overflow-y-auto">
        {/* Example chat items */}
        <div className="p-4 border-b hover:bg-gray-50 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">John Doe</h3>
              <p className="text-sm text-gray-500">Last message content...</p>
            </div>
            <div className="flex items-center gap-2">
              <UnreadBadge chatId={chatId} />
              <span className="text-xs text-gray-400">2:30 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto" onScroll={handleScrollToBottom}>
        {messages.map((message) => (
          <div key={message._id} className="p-2">
            <div className="flex items-center gap-2">
              <span>{message.content}</span>
              {message.sender._id === user?._id && (
                <ReadReceipt 
                  chatId={chatId} 
                  messageId={message._id} 
                  senderId={message.sender._id}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message input */}
      <div className="p-4 border-t">
        <input
          type="text"
          placeholder="Type a message..."
          className="w-full p-2 border rounded"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage(e.target.value);
              e.target.value = '';
            }
          }}
        />
      </div>
    </div>
  );
};

export default ChatPageExample;

