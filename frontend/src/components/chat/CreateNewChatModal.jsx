import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrCreateOneToOneChat } from '../../api/chatApi';
import { toast } from 'react-hot-toast';
import ChatUserSearch from './ChatUserSearch';
import { X, MessageCircle } from 'lucide-react';
import CustomButton from '../ui/CustomButton';

const NewChatModal = ({ isOpen, onClose, onChatCreated, onCreateGroup }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const queryClient = useQueryClient();

  const createChatMutation = useMutation({
    mutationFn: (userId) => getOrCreateOneToOneChat(userId),
    onSuccess: (data) => {
      // For one-to-one chats, invalidate queries since they should appear immediately
      // For groups, don't invalidate since they have no messages yet
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['recentChats']);
      queryClient.invalidateQueries(['groupChats']);
      
      if (onChatCreated) {
        // Handle Axios response structure: response.data.data.chat
        const chat = data?.data?.data?.chat || data?.data?.chat || data?.chat || data;
        
        if (chat && chat._id) {
          onChatCreated(chat);
        } else {
          toast.error('Chat created but failed to open - invalid chat data');
        }
      }
      onClose();
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to create chat');
    }
  });

  const handleStartChat = (user) => {
    // Immediately create and open chat
    createChatMutation.mutate(user._id);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl max-w-md w-full border border-white/20 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Start New Chat
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Search by name, email, username, or phone number
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>


        {/* User Search */}
        <div className="p-6">
          {createChatMutation.isPending && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  Creating chat...
                </span>
              </div>
            </div>
          )}
          <ChatUserSearch
            onSelectUser={setSelectedUser}
            onStartChat={handleStartChat}
            placeholder="Search users to chat with..."
          />

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <CustomButton
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
