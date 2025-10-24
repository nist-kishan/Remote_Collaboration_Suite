import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { searchUsers, createGroupChat } from '../../api/chatApi';
import { X, Search, Users, UserPlus, UserMinus } from 'lucide-react';
import CustomButton from '../ui/CustomButton';
import UserAvatar from '../ui/UserAvatar';
import { toast } from 'react-hot-toast';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const { user } = useSelector((state) => state.auth);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  
  const queryClient = useQueryClient();

  // User search query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['userSearch', searchQuery],
    queryFn: () => searchUsers({ query: searchQuery }),
    enabled: showSearch && searchQuery.length >= 2,
    staleTime: 60000,
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (data) => createGroupChat(data),
    onSuccess: (response) => {
      const groupChat = response.data?.data?.chat || response.data?.chat || response.data;
      toast.success('Group created successfully!');
      
      // Don't immediately invalidate queries since group has no messages yet
      // The group will appear in chat list only after first message is sent
      onGroupCreated?.(groupChat);
      resetForm();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create group');
    },
  });

  const resetForm = () => {
    setGroupName('');
    setSearchQuery('');
    setSelectedMembers([]);
    setShowSearch(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddMember = (userToAdd) => {
    if (!selectedMembers.find(member => member._id === userToAdd._id)) {
      setSelectedMembers(prev => [...prev, userToAdd]);
    }
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleRemoveMember = (userId) => {
    setSelectedMembers(prev => prev.filter(member => member._id !== userId));
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedMembers.length < 2) {
      toast.error('Please select at least 2 members');
      return;
    }

    const participantIds = selectedMembers.map(member => member._id);
    
    createGroupMutation.mutate({
      name: groupName.trim(),
      participantIds
    });
  };

  const users = searchResults?.data?.data?.users || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/20 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Create Group Chat
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Selected Members */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Members ({selectedMembers.length} selected)
              </label>
              
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedMembers.map((member, index) => (
                    <div
                      key={member._id || `selected-member-${index}`}
                      className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/20 px-3 py-1 rounded-full"
                    >
                      <UserAvatar user={member} size="xs" />
                      <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        {member.name}
                      </span>
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="p-1 hover:bg-indigo-200 dark:hover:bg-indigo-900/40 rounded-full transition-colors"
                      >
                        <UserMinus className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Members */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    
                    <input
                      type="text"
                      placeholder="Search users to add..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSearch(e.target.value.length >= 2);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <CustomButton
                    onClick={() => setShowSearch(true)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add
                    </CustomButton>
                </div>

                {/* Search Results */}
                {showSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
                    {isSearching ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Searching...</p>
                      </div>
                    ) : users.length > 0 ? (
                      <div className="p-2">
                        {users
                          .filter(user => !selectedMembers.find(member => member._id === user._id))
                          .map((searchUser, index) => (
                            <div
                              key={searchUser._id || `search-user-${index}`}
                              onClick={() => handleAddMember(searchUser)}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg transition-colors"
                            >
                              <UserAvatar user={searchUser} size="md" />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {searchUser.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {searchUser.email}
                                </p>
                              </div>
                              <UserPlus className="w-4 h-4 text-gray-400" />
                            </div>
                          ))}
                      </div>
                    ) : searchQuery.length >= 2 ? (
                      <div className="p-4 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No users found</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Group Info */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Group Information</h3>
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Minimum 2 members required (including you)</li>
                <li>• You will be the group admin</li>
                <li>• Group name can be changed later</li>
                <li>• Members can be added or removed after creation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <CustomButton
            onClick={handleClose}
            variant="outline"
            disabled={createGroupMutation.isPending}
          >
            Cancel
                    </CustomButton>
            <CustomButton
            onClick={handleCreateGroup}
            disabled={createGroupMutation.isPending || !groupName.trim() || selectedMembers.length < 2}
            loading={createGroupMutation.isPending}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Create Group
                    </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;

