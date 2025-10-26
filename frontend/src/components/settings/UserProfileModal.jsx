import React, { useState, useRef } from 'react';
import { X, Camera, Save, User, Mail, Briefcase, MapPin, Edit2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import UserAvatar from '../ui/UserAvatar';
import CustomButton from '../ui/CustomButton';
import CustomInput from '../ui/CustomInput';
import ApiClient from '../../api/ApiClient';
import { setUser } from '../../store/slice/authSlice';

const UserProfileModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    designation: user?.designation || '',
    location: user?.location || '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.avatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !user) return null;

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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      const formDataToSend = new FormData();
      
      // Add text fields
      if (formData.name !== user.name) {
        formDataToSend.append('name', formData.name);
      }
      if (formData.bio !== (user.bio || '')) {
        formDataToSend.append('bio', formData.bio);
      }
      if (formData.designation !== (user.designation || '')) {
        formDataToSend.append('designation', formData.designation);
      }
      if (formData.location !== (user.location || '')) {
        formDataToSend.append('location', formData.location);
      }
      
      // Add avatar if selected
      if (selectedImage) {
        formDataToSend.append('avatar', selectedImage);
      }

      const response = await ApiClient.put('/auth/update-profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update Redux store with new user data
      dispatch(setUser(response.data.data.user));
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setSelectedImage(null);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      designation: user?.designation || '',
      location: user?.location || '',
    });
    setSelectedImage(null);
    setImagePreview(user?.avatar);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Profile Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={formData.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-4 border-gray-200 dark:border-gray-700">
                  <User className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
                  title="Change profile picture"
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

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name *
              </label>
              {isEditing ? (
                <CustomInput
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              ) : (
                <p className="text-gray-900 dark:text-white font-medium">{user.name}</p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed
              </p>
            </div>

            {/* Bio/Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio / About Me
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  {user.bio || 'No bio added yet'}
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.bio.length}/500 characters
                </p>
              )}
            </div>

            {/* Designation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Briefcase className="w-4 h-4 inline mr-2" />
                Designation / Job Title
              </label>
              {isEditing ? (
                <CustomInput
                  type="text"
                  value={formData.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager"
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  {user.designation || 'Not specified'}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Location
              </label>
              {isEditing ? (
                <CustomInput
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., New York, USA"
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  {user.location || 'Not specified'}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <CustomButton
                onClick={handleSave}
                variant="primary"
                className="flex-1"
                disabled={isUploading || !formData.name.trim()}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </CustomButton>
              <CustomButton
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
                disabled={isUploading}
              >
                Cancel
              </CustomButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
