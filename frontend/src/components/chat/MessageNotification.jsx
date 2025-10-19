import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hook/useSocket';
import { toast } from 'react-hot-toast';
import { MessageCircle, X } from 'lucide-react';
import Button from '../ui/Button';

const MessageNotification = () => {
  const { user } = useSelector((state) => state.auth);
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (socket && isConnected && user?._id) {
      // Listen for new messages
      socket.on('new_message', (data) => {
        // Only show notification if message is not from current user
        if (data.sender && data.sender._id && data.sender._id !== user?._id) {
          showMessageNotification(data);
        }
      });

      // Listen for incoming calls
      socket.on('incoming_call', (data) => {
        showCallNotification(data);
      });

      return () => {
        socket.off('new_message');
        socket.off('incoming_call');
      };
    }
  }, [socket, isConnected, user?._id]);

  const showMessageNotification = (messageData) => {
    const { sender, content, chat } = messageData;
    
    // Validate required data
    if (!sender || !chat || !chat._id) {
      return;
    }
    
    // Create notification object
    const notification = {
      id: Date.now(),
      type: 'message',
      title: sender.name || 'Unknown User',
      message: content || 'Sent a message',
      avatar: sender.avatar,
      chatId: chat._id,
      timestamp: new Date()
    };

    // Add to notifications array
    setNotifications(prev => [...prev, notification]);

    // Show toast notification
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {sender?.avatar ? (
                <img
                  className="h-10 w-10 rounded-full object-cover"
                  src={sender.avatar}
                  alt={sender?.name || 'User'}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {sender?.name || 'Unknown User'}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {content || 'Sent a message'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              handleNotificationClick(notification);
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Open
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-right'
    });

    // Play notification sound
    playNotificationSound();
  };

  const showCallNotification = (callData) => {
    const { fromUserName, callId } = callData;
    
    // Validate required data
    if (!callData || !callId) {
      return;
    }
    
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Incoming Video Call
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {fromUserName || 'Unknown User'}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Tap to answer
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              
              // Navigate to call page first
              navigate(`/call/${callId}`);
              
              // Trigger the accept call function
              if (window.acceptCall) {
                console.log('Triggering acceptCall from notification');
                try {
                  await window.acceptCall();
                  console.log('Call accepted successfully from notification');
                } catch (error) {
                  console.error('Error accepting call from notification:', error);
                }
              } else {
                console.warn('window.acceptCall function not available');
                // Fallback: try to trigger call acceptance via socket
                if (window.currentSocket) {
                  console.log('Triggering acceptCall via socket from notification');
                  window.currentSocket.emit('join_call', { callId });
                }
              }
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Answer
          </button>
        </div>
      </div>
    ), {
      duration: 60000, // 1 minute
      position: 'top-right'
    });

    // Play call sound
    playCallSound();
  };

  const handleNotificationClick = (notification) => {
    // Navigate to chat
    if (notification.type === 'message') {
      navigate(`/chat/${notification.chatId}`);
    }
    
    // Remove notification
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  };

  const playNotificationSound = () => {
    try {
      // Create audio context for notification sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7bllHgU6jdXzzn0vBSF+zfLbizEIHWq+8+OWT');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore if audio fails
      });
    } catch (error) {
      // Ignore if audio fails
    }
  };

  const playCallSound = () => {
    try {
      // Create audio context for call sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7bllHgU6jdXzzn0vBSF+zfLbizEIHWq+8+OWT');
      audio.volume = 0.5;
      audio.loop = true;
      audio.play().catch(() => {
        // Ignore if audio fails
      });
    } catch (error) {
      // Ignore if audio fails
    }
  };

  return null; // This component only handles notifications, no UI
};

export default MessageNotification;
