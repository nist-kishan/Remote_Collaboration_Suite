import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrCreateOneToOneChat } from '../../api/chatApi';
import { toast } from 'react-hot-toast';
import UserSearch from './UserSearch';
import { X, MessageCircle, Users } from 'lucide-react';
import Button from '../ui/Button';

const NewChatModal = ({ isOpen, onClose, onChatCreated }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatType, setChatType] = useState('one-to-one'); // 'one-to-one' or 'group'
  const queryClient = useQueryClient();

  const createChatMutation = useMutation({
    mutationFn: (userId) => getOrCreateOneToOneChat(userId),
    onSuccess: (data) => {
      
      // Don't show success toast for seamless experience
      queryClient.invalidateQueries(['chats']);
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
    if (chatType === 'one-to-one') {
      // Immediately create and open chat
      createChatMutation.mutate(user._id);
    } else {
      setSelectedUser(user);
    }
  };

  const handleCreateGroup = () => {
    // This should trigger the CreateGroupModal
    // For now, just close this modal and let the parent handle group creation
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Start New Chat
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {chatType === 'one-to-one' 
                ? 'Search by name, email, username, or phone number'
                : 'Search and select users to create a group chat'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Chat Type Selection */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setChatType('one-to-one')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                chatType === 'one-to-one'
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">One-to-One</span>
            </button>
            <button
              onClick={() => setChatType('group')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                chatType === 'group'
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Group</span>
            </button>
          </div>
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
          <UserSearch
            onSelectUser={setSelectedUser}
            onStartChat={handleStartChat}
            placeholder={`Search users to ${chatType === 'one-to-one' ? 'chat with' : 'add to group'}...`}
          />

          {/* Selected User Display */}
          {selectedUser && chatType === 'group' && (
            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedUser.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleCreateGroup}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Create Group
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          {chatType === 'group' && selectedUser && (
            <Button
              onClick={handleCreateGroup}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Create Group
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
