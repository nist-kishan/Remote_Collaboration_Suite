import React, { useState } from 'react';
import { X, Video, Calendar, Users, Lock, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CustomButton from '../ui/CustomButton';
import CustomInput from '../ui/CustomInput';

const MeetingCreateModal = ({ isOpen, onClose, onCreateMeeting }) => {
  const [meetingType, setMeetingType] = useState('instant'); // 'instant' or 'scheduled'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    accessType: 'private',
    password: '',
    maxParticipants: 50,
    attendees: [],
    settings: {
      enableChat: true,
      enableScreenShare: true,
      enableRecording: false,
      muteOnJoin: false,
      videoOnJoin: true
    }
  });

  const [scheduledData, setScheduledData] = useState({
    startTime: '',
    endTime: ''
  });

  const handleInputChange = (field, value) => {
    if (field.startsWith('settings.')) {
      const setting = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [setting]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }

    if (meetingType === 'scheduled') {
      if (!scheduledData.startTime || !scheduledData.endTime) {
        toast.error('Please select start and end times');
        return;
      }
      onCreateMeeting({
        ...formData,
        startTime: scheduledData.startTime,
        endTime: scheduledData.endTime
      }, 'scheduled');
    } else {
      onCreateMeeting(formData, 'instant');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Meeting</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Meeting Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Meeting Type
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setMeetingType('instant')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  meetingType === 'instant'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Video className="w-5 h-5" />
                <span className="font-medium">Instant</span>
              </button>
              <button
                type="button"
                onClick={() => setMeetingType('scheduled')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  meetingType === 'scheduled'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Scheduled</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meeting Title *
            </label>
            <CustomInput
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter meeting title"
              required
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter meeting description"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Scheduled Meeting Times */}
          {meetingType === 'scheduled' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time *
                </label>
                <CustomInput
                  type="datetime-local"
                  value={scheduledData.startTime}
                  onChange={(e) => setScheduledData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Time *
                </label>
                <CustomInput
                  type="datetime-local"
                  value={scheduledData.endTime}
                  onChange={(e) => setScheduledData(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Access Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Access Type
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleInputChange('accessType', 'public')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  formData.accessType === 'public'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Globe className="w-5 h-5" />
                <span className="font-medium">Public</span>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('accessType', 'private')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  formData.accessType === 'private'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Lock className="w-5 h-5" />
                <span className="font-medium">Private</span>
              </button>
            </div>
          </div>

          {/* Password for Private Meetings */}
          {formData.accessType === 'private' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Password (optional)
              </label>
              <CustomInput
                type="text"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Leave empty to auto-generate"
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                If left empty, a random password will be generated
              </p>
            </div>
          )}

          {/* Max Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Participants
            </label>
            <CustomInput
              type="number"
              value={formData.maxParticipants}
              onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
              min={1}
              max={100}
              className="w-full"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <CustomButton
              type="button"
              onClick={onClose}
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
              Create Meeting
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingCreateModal;

