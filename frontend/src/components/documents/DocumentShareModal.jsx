import React, { useState, useEffect, useRef } from "react";
import { useOrigin } from "../../hook/useOrigin";
import { useSelector } from "react-redux";
import { 
  X, 
  UserPlus, 
  Mail, 
  Copy, 
  Users, 
  Crown, 
  Edit, 
  Eye,
  Trash2,
  Send,
  Link,
  Search,
  Settings,
  FileText
} from "lucide-react";
import CustomButton from "../ui/CustomButton";
import CustomInput from "../ui/CustomInput";
import CustomCard from "../ui/CustomCard";
import { toast } from "react-hot-toast";
import { searchUsers } from "../../api/userApi";
import { shareDocument, updateCollaboratorRole, removeCollaborator, shareDocumentViaEmail } from "../../api/documentApi";

const ShareModal = ({ 
  document, 
  isOpen, 
  onClose, 
  onShare, 
  onUpdateRole, 
  onRemoveCollaborator,
  onShareViaEmail,
  loading = false 
}) => {
  const { getDocumentShareUrl } = useOrigin();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [shareLink, setShareLink] = useState("");
  const [activeTab, setActiveTab] = useState("preview"); // "preview", "add", "view", or "settings"
  const [emailList, setEmailList] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailRole, setEmailRole] = useState("viewer");
  
  // User search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef(null);
  const isSearchingRef = useRef(false);
  
  // Selected users to invite
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Visibility state
  const [visibility, setVisibility] = useState(document?.visibility || "private");
  
  // Check if current user is owner
  const isOwner = document?.owner?._id === currentUser?._id;

  useEffect(() => {
    if (document && isOpen) {
      // Generate share link using the custom hook
      setShareLink(getDocumentShareUrl(document._id));
    }
  }, [document?._id, isOpen]); // Removed unnecessary fetch

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchResults && !event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      window.document.addEventListener('mousedown', handleClickOutside);
      return () => window.document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSearchResults]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Helper component for user avatar with profile picture
  const UserAvatar = ({ user, size = "w-10 h-10", textSize = "text-sm" }) => {
    // Check for various profile picture field names
    const profilePictureUrl = user?.profilePicture || user?.avatar || user?.profileImage || user?.picture;
    const hasProfilePicture = !!profilePictureUrl;
    
    // Get initials fallback
    const getInitials = () => {
      if (user?.name) {
        return user.name.charAt(0).toUpperCase();
      }
      if (user?.email) {
        return user.email.charAt(0).toUpperCase();
      }
      if (user?.firstName) {
        return user.firstName.charAt(0).toUpperCase();
      }
      return 'U';
    };
    
    return (
      <div className={`${size} rounded-full flex items-center justify-center overflow-hidden`}>
        {hasProfilePicture ? (
          <img
            src={profilePictureUrl}
            alt={user?.name || user?.email || 'User'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white ${textSize} font-semibold`}
          style={{ display: hasProfilePicture ? 'none' : 'flex' }}
        >
          {getInitials()}
        </div>
      </div>
    );
  };

  const handleShare = async () => {
    if (!email.trim() || !document?._id) return;
    
    try {
      // Find user by email first
      const searchResults = await searchUsers(email, 1);
      if (searchResults.data?.users?.length === 0) {
        toast.error("User not found. Please check the email address.");
        return;
      }
      
      const user = searchResults.data.users[0];
      const response = await shareDocument(document._id, {
        userIds: [user._id],
        role
      });
      
      if (response.success) {
        toast.success(`Document shared with ${user.name} as ${role}`);
        setEmail("");
        // Refresh the document data
        if (onShare) onShare(response.data);
      }
    } catch (error) {
      console.error('Failed to share document:', error);
      toast.error(error.response?.data?.message || "Failed to share document");
    }
  };

  const handleSearchUsers = async (term) => {
    // Skip if already searching
    if (isSearchingRef.current) {
      return;
    }
    
    // Require at least 3 characters to search
    if (term.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search (1000ms)
    searchTimeoutRef.current = setTimeout(async () => {
      // Skip if already searching
      if (isSearchingRef.current) {
        return;
      }
      
      isSearchingRef.current = true;
      
      try {
        const response = await searchUsers(term, 10); // Limit to 10 suggestions
        const users = response.data?.users || [];
        
        // Filter out users who are already collaborators and the current user
        const existingCollaboratorIds = (document?.collaborators || []).map(c => c.user._id.toString());
        const filteredUsers = users.filter(user => 
          !existingCollaboratorIds.includes(user._id.toString()) &&
          user._id.toString() !== currentUser?._id?.toString()
        );
        
        setSearchResults(filteredUsers);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        isSearchingRef.current = false;
      }
    }, 1000); // Debounce for 1000ms (1 second)
  };

  const handleUserSelect = (user) => {
    // Check if user is already selected
    if (selectedUsers.some(u => u._id === user._id)) {
      toast.error('User already selected');
      return;
    }
    
    // Add user to selected list with current role
    setSelectedUsers([...selectedUsers, { ...user, role }]);
    toast.success(`${user.name} added to invite list`);
    
    // Clear search
    setSearchTerm('');
    setShowSearchResults(false);
  };
  
  const handleRemoveSelectedUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };
  
  const handleInviteSelected = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }
    
    try {
      const userIds = selectedUsers.map(u => u._id);
      const response = await shareDocument(document._id, {
        userIds,
        role
      });
      
      if (response.success) {
        toast.success(`Document shared with ${selectedUsers.length} user(s) as ${role}`);
        setSelectedUsers([]);
        // Refresh the document data
        if (onShare) onShare(response.data);
      }
    } catch (error) {
      console.error('Failed to share document:', error);
      toast.error(error.response?.data?.message || "Failed to share document");
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    if (!document?._id) return;
    
    try {
      const response = await updateCollaboratorRole(document._id, userId, newRole);
      if (response.success) {
        toast.success("Collaborator role updated successfully");
        // Refresh the document data
        if (onUpdateRole) onUpdateRole(userId, newRole);
      }
    } catch (error) {
      console.error('Failed to update collaborator role:', error);
      toast.error(error.response?.data?.message || "Failed to update collaborator role");
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    if (!document?._id) return;
    
    try {
      const response = await removeCollaborator(document._id, userId);
      if (response.success) {
        toast.success("Collaborator removed successfully");
        // Refresh the document data
        if (onRemoveCollaborator) onRemoveCollaborator(userId);
      }
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      toast.error(error.response?.data?.message || "Failed to remove collaborator");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard!");
  };

  const handleVisibilityChange = (newVisibility) => {
    setVisibility(newVisibility);
    // You can add an API call here to update document visibility
    toast.success(`Document visibility set to ${newVisibility}`);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "owner": return <Crown className="w-4 h-4 text-purple-600" />;
      case "editor": return <Edit className="w-4 h-4 text-blue-600" />;
      case "viewer": return <Eye className="w-4 h-4 text-gray-600" />;
      default: return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "owner": return "text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200";
      case "editor": return "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200";
      case "viewer": return "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4 lg:p-6" style={{ zIndex: 9999 }}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 mx-2 sm:mx-0" style={{ zIndex: 10000 }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  Share Document
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                  {document?.title || "Untitled Document"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-120px)]">
          {/* Quick Share */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Share Link
              </h3>
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors w-full sm:w-auto"
              >
                <Copy className="w-3 h-3" />
                Copy Link
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-md p-2 sm:p-3 border border-gray-200 dark:border-gray-600 font-mono break-all overflow-x-auto">
              {shareLink}
            </div>
          </div>

          {/* Simple Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                activeTab === "preview"
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Preview</span>
                <span className="xs:hidden">View</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`flex-1 py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                activeTab === "add"
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Add People</span>
                <span className="xs:hidden">Add</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("view")}
              className={`flex-1 py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                activeTab === "view"
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Collaborators</span>
                <span className="xs:hidden">View</span>
              </div>
            </button>
            {isOwner && (
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex-1 py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  activeTab === "settings"
                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Settings</span>
                  <span className="xs:hidden">Settings</span>
                </div>
              </button>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === "preview" && (
            <div className="space-y-6">
              {/* Document Preview */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Document Preview
                  </h3>
                </div>
                
                {document?.content ? (
                  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {document.content.substring(0, 500)}
                      {document.content.length > 500 && '...'}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {document.content.length} characters
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600 p-8">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm">No content found</p>
                      <p className="text-xs mt-1">This document appears to be empty</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "add" && (
            <div className="space-y-6">
              {isOwner ? (
                <>
                  {/* Document Information */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Document Information
                    </h3>
                    <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                      <p><span className="font-medium">Title:</span> {document?.title || 'Untitled Document'}</p>
                      <p><span className="font-medium">Status:</span> <span className="capitalize">{document?.status || 'draft'}</span></p>
                      <p><span className="font-medium">Owner:</span> {document?.owner?.name || 'Unknown'}</p>
                      <p><span className="font-medium">Created:</span> {document?.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                  </div>

                  {/* User Search */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Add Collaborators
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Search for existing users by name or email. Only users with accounts can be added as collaborators.
                    </p>
                    <div className="relative search-container">
                      <input
                        type="text"
                        placeholder="Type name or email to search users..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          handleSearchUsers(e.target.value);
                        }}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      />
                      
                      {/* Search Results */}
                      {showSearchResults && searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 sm:max-h-48 overflow-y-auto">
                          {searchResults.map((user) => (
                            <button
                              key={user._id}
                              onClick={() => handleUserSelect(user)}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 sm:space-x-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                            >
                              <UserAvatar user={user} size="w-6 h-6 sm:w-8 sm:h-8" textSize="text-xs" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* No results message */}
                      {showSearchResults && searchResults.length === 0 && searchTerm.length >= 3 && (
                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            No users found matching "{searchTerm}". Make sure the user has an account in the system.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invite by Email */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Invite by Email
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <CustomInput
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1"
                      />
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <CustomButton
                        onClick={handleShare}
                        disabled={!email.trim() || loading}
                        loading={loading}
                        className="px-4 py-2"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Share
                      </CustomButton>
                    </div>
                  </div>

                  {/* Selected Users List */}
                  {selectedUsers.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                          Selected Users ({selectedUsers.length})
                        </h3>
                        <button
                          onClick={handleInviteSelected}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors flex items-center gap-2 text-sm"
                        >
                          <UserPlus className="w-4 h-4" />
                          Invite All
                        </button>
                      </div>
                      <div className="space-y-2">
                        {selectedUsers.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-md border border-green-200 dark:border-green-700"
                          >
                            <div className="flex items-center gap-2">
                              <UserAvatar user={user} size="w-6 h-6" textSize="text-xs" />
                              <div>
                                <p className="text-xs font-medium text-gray-900 dark:text-white">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 capitalize">
                                {user.role}
                              </span>
                              <button
                                onClick={() => handleRemoveSelectedUser(user._id)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Invite */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
                      Quick Invite
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                        <button
                          onClick={handleShare}
                          disabled={!email.trim() || loading}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                          <UserPlus className="w-4 h-4" />
                          Invite
                        </button>
                      </div>
                    </div>
                  </div>

                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Access Restricted
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Only the document owner can manage collaborators and invite new people.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Contact the document owner if you need to invite collaborators.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "view" && (
            <div>
              {document?.collaborators && document.collaborators.length > 0 ? (
                <div className="space-y-3">
                  {/* Owner Section */}
                  {document.owner && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <UserAvatar user={document.owner} size="w-10 h-10 sm:w-12 sm:h-12" textSize="text-base sm:text-lg" />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 truncate">
                              {document.owner.name || "Document Owner"}
                              <Crown className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                              {document.owner.email || "No email"}
                            </div>
                              </div>
                            </div>
                        <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex items-center gap-1 sm:gap-2 self-start sm:self-auto">
                          <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                          Owner
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Collaborators Section */}
                  {document.collaborators.filter(c => c.role !== "owner").length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Collaborators ({document.collaborators.filter(c => c.role !== "owner").length})
                      </h4>
                      <div className="space-y-2">
                        {document.collaborators
                          .filter(collaborator => collaborator.role !== "owner")
                          .map((collaborator, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <UserAvatar user={collaborator.user} size="w-8 h-8 sm:w-10 sm:h-10" textSize="text-xs sm:text-sm" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                                  {collaborator.user?.name || "Unknown User"}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                                  {collaborator.user?.email || "No email"}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                              {isOwner ? (
                                <select
                                  value={collaborator.role}
                                  onChange={(e) => handleUpdateRole(collaborator.user._id, e.target.value)}
                                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                  <option value="viewer">Viewer</option>
                                  <option value="editor">Editor</option>
                                </select>
                              ) : (
                                <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${getRoleColor(collaborator.role)} flex items-center gap-1`}>
                                  {getRoleIcon(collaborator.role)}
                                  {collaborator.role.charAt(0).toUpperCase() + collaborator.role.slice(1)}
                                </span>
                              )}

                              {isOwner && (
                                <CustomButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveCollaborator(collaborator.user._id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 sm:p-2"
                                  title="Remove collaborator"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </CustomButton>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No collaborators yet. Add people to start collaborating on this document.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {isOwner ? (
                <>
                  {/* Document Visibility */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
                      Document Visibility
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-green-700 dark:text-green-300 min-w-[80px]">
                          Visibility:
                        </span>
                        <select
                          value={visibility}
                          onChange={(e) => handleVisibilityChange(e.target.value)}
                          className="px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="private">🔒 Private</option>
                          <option value="shared">🔗 Shared</option>
                          <option value="public">🌐 Public</option>
                        </select>
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {visibility === "private" && "Only you and invited collaborators can access this document"}
                        {visibility === "shared" && "Anyone with the link can access this document"}
                        {visibility === "public" && "This document is publicly accessible"}
                      </div>
                    </div>
                  </div>

                  {/* Document Settings */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-3">
                      Document Settings
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            Allow Comments
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            Let collaborators add comments to the document
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            Allow Download
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            Let collaborators download the document
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked={false}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Access Restricted
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Only the document owner can manage document settings and visibility.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Permission Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Permission Levels
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Owner:</span>
                <span className="text-gray-600 dark:text-gray-300">Full control</span>
              </div>
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Editor:</span>
                <span className="text-gray-600 dark:text-gray-300">Can edit and share</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-600" />
                <span className="font-medium">Viewer:</span>
                <span className="text-gray-600 dark:text-gray-300">Can only view</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
