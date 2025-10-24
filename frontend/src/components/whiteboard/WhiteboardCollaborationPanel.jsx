import React, { useState, useEffect } from 'react';
import { 
  Users, 
  X, 
  UserPlus, 
  Mail, 
  Copy, 
  Eye, 
  Edit, 
  Trash2,
  Crown,
  Shield,
  User,
  MessageSquare,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Search
} from 'lucide-react';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';
import { shareWhiteboard, updateCollaboratorRole, removeCollaborator } from '../../api/whiteboardApi';
import { searchUsers } from '../../api/userApi';

const WhiteboardCollaborationPanel = ({
  whiteboardId,
  currentUser,
  whiteboard,
  isOpen,
  onClose,
  activeUsers = [],
  onCollaboratorUpdate,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'view'
  const [collaborators, setCollaborators] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // User search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Check if current user is owner
  const isOwner = whiteboard?.owner?._id === currentUser?._id;

  // Load collaborators from whiteboard data
  useEffect(() => {
    if (whiteboard?.collaborators) {
      setCollaborators(whiteboard.collaborators);
    }
  }, [whiteboard]);

  // Mock chat messages (replace with actual socket events)
  useEffect(() => {
    const mockMessages = [
      {
        id: 1,
        user: { name: 'John Doe', avatar: null },
        message: 'Welcome to the whiteboard!',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        type: 'system'
      },
      {
        id: 2,
        user: { name: 'Jane Smith', avatar: null },
        message: 'Let\'s start brainstorming ideas',
        timestamp: new Date(Date.now() - 1000 * 60 * 3),
        type: 'user'
      }
    ];
    setChatMessages(mockMessages);
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        user: { name: currentUser?.name || 'You', avatar: currentUser?.avatar },
        message: newMessage.trim(),
        timestamp: new Date(),
        type: 'user'
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInviteUser = async () => {
    if (inviteEmail.trim()) {
      try {
        setIsLoading(true);
        await shareWhiteboard(whiteboardId, {
          email: inviteEmail,
          role: inviteRole
        });
        toast.success('User invited successfully');
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('editor');
        // Refresh collaborators
        if (onCollaboratorUpdate) {
          onCollaboratorUpdate();
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to invite user');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSearchUsers = async (term) => {
    if (term.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    try {
      const response = await searchUsers(term);
      const users = response.data?.users || [];
      // Filter out users who are already collaborators
      const existingCollaboratorIds = collaborators.map(c => c.user._id.toString());
      const filteredUsers = users.filter(user => !existingCollaboratorIds.includes(user._id.toString()));
      setSearchResults(filteredUsers);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setInviteEmail(user.email);
    setSearchTerm(user.name);
    setShowSearchResults(false);
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    
    try {
      setIsLoading(true);
      await shareWhiteboard(whiteboardId, {
        email: inviteEmail,
        role: inviteRole
      });
      toast.success('User invited successfully');
      setInviteEmail('');
      setSearchTerm('');
      setSelectedUser(null);
      setInviteRole('editor');
      // Refresh collaborators
      if (onCollaboratorUpdate) {
        onCollaboratorUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to invite user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setIsLoading(true);
      await updateCollaboratorRole(whiteboardId, userId, newRole);
      toast.success('Role updated successfully');
      setCollaborators(prev => 
        prev.map(collab => 
          collab.user._id === userId 
            ? { ...collab, role: newRole }
            : collab
        )
      );
      if (onCollaboratorUpdate) {
        onCollaboratorUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      setIsLoading(true);
      await removeCollaborator(whiteboardId, userId);
      toast.success('Collaborator removed successfully');
      setCollaborators(prev => prev.filter(collab => collab.user._id !== userId));
      if (onCollaboratorUpdate) {
        onCollaboratorUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove collaborator');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'editor':
        return <Edit className="w-4 h-4 text-green-500" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'admin':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'editor':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'viewer':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Collaboration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'add'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Add Collaborators
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'view'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              View All Collaborators ({collaborators.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'add' ? (
              // Add Collaborators Tab
              <div className="p-4">
                {isOwner ? (
                  <>
                    {/* User Search */}
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Search for Users
                      </h3>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by name or email..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            handleSearchUsers(e.target.value);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        {/* Search Results Dropdown */}
                        {showSearchResults && searchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {searchResults.map((user) => (
                              <button
                                key={user._id}
                                onClick={() => handleUserSelect(user)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                              >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Invite Form */}
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Invite by Email
                      </h3>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="Enter email address"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={handleInviteByEmail}
                          disabled={isLoading || !inviteEmail.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Inviting...' : 'Invite'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Only the owner can invite collaborators
                    </p>
                  </div>
                )}

                {/* Active Users */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Online Now ({activeUsers.length})
                  </h3>
                  <div className="space-y-2">
                    {activeUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="relative">
                          <div 
                            className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
                            style={{ backgroundColor: user.color || '#3B82F6' }}
                          >
                            <span className="text-xs font-medium text-white">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.isDrawing ? 'Drawing...' : 'Viewing'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activeUsers.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No other users online
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // View All Collaborators Tab
              <div className="p-4">
                <div className="space-y-2">
                  {collaborators.map((collab) => (
                    <div key={collab.user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {collab.user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {collab.user.name}
                          </p>
                          <div className="flex items-center space-x-1">
                            {getRoleIcon(collab.role)}
                            <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(collab.role)}`}>
                              {collab.role}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isOwner && collab.user._id !== currentUser?._id && (
                        <div className="flex items-center space-x-1">
                          <select
                            value={collab.role}
                            onChange={(e) => handleUpdateRole(collab.user._id, e.target.value)}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleRemoveCollaborator(collab.user._id)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {collaborators.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No collaborators yet
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Chat
              </h3>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((message) => (
                <div key={message.id} className="flex space-x-3">
                  <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {message.user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {message.user.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    setIsTyping(e.target.value.length > 0);
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
              {isTyping && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Typing...
                </p>
              )}
            </div>
          </div>

          {/* Media Controls */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Media Controls
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  isAudioEnabled 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                title={isAudioEnabled ? 'Mute Audio' : 'Enable Audio'}
              >
                {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  isVideoEnabled 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                title={isVideoEnabled ? 'Disable Video' : 'Enable Video'}
              >
                {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
              <button className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                <Phone className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Invite Collaborator
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteUser}
                disabled={!inviteEmail.trim() || isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhiteboardCollaborationPanel;