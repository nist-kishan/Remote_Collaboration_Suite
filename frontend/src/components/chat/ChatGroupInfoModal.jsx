import React, { useState, useRef } from 'react';
import { X, Camera, Users, Edit2, Save, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import UserAvatar from '../ui/UserAvatar';
import CustomButton from '../ui/CustomButton';
import { updateGroupChat, removeGroupMember, leaveGroup } from '../../api/chatApi';

const ChatGroupInfoModal = ({ isOpen, onClose, chat, onUpdate }) => {
  const { user } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(chat?.name || '');
  const [groupDescription, setGroupDescription] = useState(chat?.description || '');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(chat?.avatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !chat) return null;

  const isAdmin = chat.participants?.some(
    p => p.user._id === user?._id && p.role === 'admin'
  );

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      
      if (groupName.trim() !== chat.name) {
        formData.append('name', groupName.trim());
      }
      
      if (groupDescription.trim() !== (chat.description || '')) {
        formData.append('description', groupDescription.trim());
      }
      
      if (selectedImage) {
        formData.append('avatar', selectedImage);
      }

      const response = await updateGroupChat(chat._id, formData);
      
      toast.success('Group updated successfully!');
      setIsEditing(false);
      setSelectedImage(null);
      onUpdate?.(response.data);
      onClose();
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error(error.response?.data?.message || 'Failed to update group');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await removeGroupMember(chat._id, memberId);
      toast.success('Member removed successfully');
      onUpdate?.();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    try {
      await leaveGroup(chat._id);
      toast.success('Left group successfully');
      onClose();
      onUpdate?.();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Group Info</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Group Avatar and Name */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={groupName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center border-4 border-gray-200 dark:border-gray-700">
                  <Users className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
              
              {isAdmin && isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
                  title="Change group picture"
                >
                  <Camera className="w-5 h-5" />
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {isEditing ? (
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="mt-4 text-2xl font-bold text-center bg-transparent border-b-2 border-blue-500 focus:outline-none text-gray-900 dark:text-white px-4"
                placeholder="Group name"
              />
            ) : (
              <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{chat.name}</h3>
            )}
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {chat.participants?.length || 0} participants
            </p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              {isAdmin && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Add a group description..."
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                {chat.description || 'No description'}
              </p>
            )}
          </div>

          {/* Save/Cancel Buttons (when editing) */}
          {isEditing && (
            <div className="flex gap-3 mb-6">
              <CustomButton
                onClick={handleSave}
                variant="primary"
                className="flex-1"
                disabled={isUploading}
              >
                {isUploading ? 'Saving...' : 'Save Changes'}
              </CustomButton>
              <CustomButton
                onClick={() => {
                  setIsEditing(false);
                  setGroupName(chat.name);
                  setGroupDescription(chat.description || '');
                  setSelectedImage(null);
                  setImagePreview(chat.avatar);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </CustomButton>
            </div>
          )}

          {/* Members List */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Members ({chat.participants?.length || 0})
            </h4>
            <div className="space-y-2">
              {chat.participants?.map((participant) => (
                <div
                  key={participant.user._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar user={participant.user} size="sm" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {participant.user.name}
                        {participant.user._id === user?._id && ' (You)'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {participant.role === 'admin' ? '👑 Admin' : 'Member'}
                      </p>
                    </div>
                  </div>
                  
                  {isAdmin && participant.user._id !== user?._id && (
                    <button
                      onClick={() => handleRemoveMember(participant.user._id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 p-2"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Leave Group Button */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <CustomButton
              onClick={handleLeaveGroup}
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 border-red-600 hover:border-red-700"
            >
              Leave Group
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatGroupInfoModal;
