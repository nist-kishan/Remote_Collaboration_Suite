import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreVertical, User, Crown, Shield, UserCheck, UserX } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { workspaceApi } from '../../api/workspaceApi';
import CustomButton from '../ui/CustomButton';
import CustomCard from '../ui/CustomCard';
import CustomModal from '../ui/CustomModal';

const WorkspaceMemberList = ({ workspace, canManageMembers = true }) => {
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.auth.user);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  // Check if current user is the owner
  const isOwner = workspace?.owner?._id === currentUser?._id;

  // Search users for workspace
  const { data: searchResults, isLoading: searching, error: searchError } = useQuery({
    queryKey: ['search-workspace-users', workspace._id, searchQuery],
    queryFn: async () => {
      const response = await workspaceApi.searchUsers(workspace._id, searchQuery);
      return response;
    },
    enabled: showAddMember && searchQuery.length >= 2,
    onError: (error) => {
      // Error handled by toast notification
    }
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: ({ userId, role }) => workspaceApi.addMember(workspace._id, { userId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace', workspace._id]);
      toast.success('Member added successfully');
      setShowAddMember(false);
      setSearchQuery('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId) => workspaceApi.removeMember(workspace._id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace', workspace._id]);
      toast.success('Member removed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => workspaceApi.updateMemberRole(workspace._id, userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace', workspace._id]);
      toast.success('Role updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'member':
        return <User className="w-4 h-4 text-blue-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'member':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const handleAddMember = (member, role) => {
    addMemberMutation.mutate({ userId: member._id, role });
  };

  const handleRemoveMember = (member) => {
    removeMemberMutation.mutate(member.user._id);
  };

  const handleUpdateRole = (member, newRole) => {
    updateRoleMutation.mutate({ userId: member.user._id, role: newRole });
  };

  const roleOptions = [
    { value: 'member', label: 'Member' },
    { value: 'admin', label: 'Admin' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Workspace Members ({workspace.members?.length || 0})
        </h3>
        {canManageMembers && (
          <CustomButton onClick={() => setShowAddMember(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Member
          </CustomButton>
        )}
      </div>

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspace.members?.map((member) => (
          <CustomCard key={member.user._id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                {member.user.avatar ? (
                  <img
                    src={member.user.avatar}
                    alt={member.user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className={`text-indigo-600 dark:text-indigo-400 font-medium ${member.user.avatar ? 'hidden' : ''}`}>
                  {member.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {member.user.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {member.user.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {getRoleIcon(member.role)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                    {member.role.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="relative">
                {isOwner && (
                  <button
                    onClick={() => setSelectedMember(selectedMember === member ? null : member)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                )}
                
                {selectedMember === member && (
                  <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-32">
                    {canManageMembers && (
                      <>
                        {roleOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleUpdateRole(member, option.value)}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            disabled={member.role === 'owner'}
                          >
                            Set as {option.label}
                          </button>
                        ))}
                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      </>
                    )}
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      disabled={member.role === 'owner' || !canManageMembers}
                    >
                      <UserX className="w-4 h-4 inline mr-1" />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CustomCard>
        ))}
      </div>

      {/* Add Member Modal */}
      <CustomModal isOpen={showAddMember} onClose={() => setShowAddMember(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add Team Member
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Search and add members from your workspace
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Members
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {searching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            )}

            {searchError && (
              <div className="text-center py-4 text-red-500 dark:text-red-400">
                Error searching members: {searchError.response?.data?.message || searchError.message}
              </div>
            )}

            {searchResults?.data?.data?.users && searchResults.data.data.users.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.data.data.users.map((member) => (
                  <div key={member._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span className={`text-xs font-medium text-indigo-600 dark:text-indigo-400 ${member.avatar ? 'hidden' : ''}`}>
                          {member.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {member.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {member.email || 'No email'}
                        </p>
                      </div>
                    </div>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddMember(member, e.target.value);
                        }
                      }}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-shrink-0 ml-2"
                      defaultValue=""
                    >
                      <option value="" disabled>Select Role</option>
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !searching && !searchResults?.data?.data?.users && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <p>Start typing to search for members...</p>
                <p className="text-xs mt-2">Results will appear here</p>
              </div>
            )}

            {searchQuery.length >= 2 && !searching && searchResults?.data?.data?.users?.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No members found matching "{searchQuery}"
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <CustomButton
              variant="outline"
              onClick={() => setShowAddMember(false)}
              className="flex-1"
            >
              Cancel
            </CustomButton>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default WorkspaceMemberList;

