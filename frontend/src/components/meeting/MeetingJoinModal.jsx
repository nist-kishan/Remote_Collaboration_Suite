import React, { useState } from 'react';
import { X, Video, Key, Link as LinkIcon, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../ui/CustomButton';
import CustomInput from '../ui/CustomInput';

const MeetingJoinModal = ({ isOpen, onClose, onJoinMeeting }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('link'); // 'link' or 'id'
  
  // Link tab state
  const [meetingLink, setMeetingLink] = useState('');
  
  // ID tab state
  const [meetingId, setMeetingId] = useState('');
  const [password, setPassword] = useState('');
  
  const [errors, setErrors] = useState({});

  const handleJoinByLink = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!meetingLink.trim()) {
      newErrors.meetingLink = 'Meeting link is required';
      setErrors(newErrors);
      return;
    }
    
    try {
      // Extract meeting ID from link
      const url = new URL(meetingLink.trim());
      const pathParts = url.pathname.split('/');
      const extractedMeetingId = pathParts[pathParts.length - 1];
      
      if (!extractedMeetingId) {
        newErrors.meetingLink = 'Invalid meeting link';
        setErrors(newErrors);
        return;
      }
      
      // Navigate to meeting
      handleClose();
      navigate(`/meeting/${extractedMeetingId}`);
    } catch (error) {
      newErrors.meetingLink = 'Invalid meeting link format';
      setErrors(newErrors);
    }
  };

  const handleJoinById = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!meetingId.trim()) {
      newErrors.meetingId = 'Meeting ID is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onJoinMeeting(meetingId.trim(), password);
      handleClose();
    }
  };

  const handleClose = () => {
    setMeetingLink('');
    setMeetingId('');
    setPassword('');
    setErrors({});
    setActiveTab('link');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Join Meeting</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              type="button"
              onClick={() => {
                setActiveTab('link');
                setErrors({});
              }}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'link'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <LinkIcon className="w-4 h-4 inline mr-2" />
              Join by Link
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('id');
                setErrors({});
              }}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'id'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Hash className="w-4 h-4 inline mr-2" />
              Join by ID
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Join by Link Tab */}
          {activeTab === 'link' && (
            <form onSubmit={handleJoinByLink} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <LinkIcon className="w-4 h-4 inline mr-2" />
                  Meeting Link *
                </label>
                <CustomInput
                  type="text"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://example.com/meeting/MTG-..."
                  required
                  className={`w-full ${errors.meetingLink ? 'border-red-500' : ''}`}
                />
                {errors.meetingLink && (
                  <p className="text-sm text-red-500 mt-1">{errors.meetingLink}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Paste the complete meeting link you received
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Quick Join:</strong> Simply paste the meeting link and click join. If the meeting is private, you'll be prompted for a password.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <CustomButton
                  type="button"
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  Join Meeting
                </CustomButton>
              </div>
            </form>
          )}

          {/* Join by ID Tab */}
          {activeTab === 'id' && (
            <form onSubmit={handleJoinById} className="space-y-6">
              {/* Meeting ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Hash className="w-4 h-4 inline mr-2" />
                  Meeting ID *
                </label>
                <CustomInput
                  type="text"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  placeholder="MTG-1234567890-ABCDEF"
                  required
                  className={`w-full ${errors.meetingId ? 'border-red-500' : ''}`}
                />
                {errors.meetingId && (
                  <p className="text-sm text-red-500 mt-1">{errors.meetingId}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter the meeting ID provided by the organizer
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Key className="w-4 h-4 inline mr-2" />
                  Meeting Password (Optional)
                </label>
                <CustomInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password if meeting is private"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Required only for private meetings
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Note:</strong> If you don't have the password for a private meeting, you'll be prompted to enter it when joining.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <CustomButton
                  type="button"
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  Join Meeting
                </CustomButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingJoinModal;

