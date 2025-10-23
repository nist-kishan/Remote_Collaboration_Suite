import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Key, Users, Calendar, Video, Lock, Globe, AlertCircle } from 'lucide-react';
import { useMeeting } from '../../hook/useMeeting';
import { useSelector } from 'react-redux';
import CustomButton from '../ui/CustomButton';
import CustomInput from '../ui/CustomInput';
import { toast } from 'react-hot-toast';

const MeetingDetailsModal = ({ isOpen, onClose, meeting }) => {
  const { user } = useSelector((state) => state.auth);
  const { handleJoinMeeting } = useMeeting();
  const [copied, setCopied] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type} copied!`);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleJoin = () => {
    if (meeting.accessType === 'protected' && !password) {
      toast.error('Please enter the meeting password');
      return;
    }
    handleJoinMeeting(meeting.meetingId, password);
    onClose();
  };

  if (!isOpen || !meeting) return null;

  const meetingLink = `${window.location.origin}/meeting/${meeting.meetingId}`;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {meeting.meetingType === 'instant' ? (
              <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            ) : (
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            )}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {meeting.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {meeting.description && (
            <div>
              <p className="text-gray-600 dark:text-gray-400">{meeting.description}</p>
            </div>
          )}

          {/* Meeting Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Meeting ID</div>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                  {meeting.meetingId}
                </code>
                <button
                  onClick={() => handleCopy(meeting.meetingId, 'Meeting ID')}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  {copied === 'Meeting ID' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {meeting.accessType === 'protected' && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Password</div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={meeting.password}
                      readOnly
                      className="text-lg font-mono font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none flex-1"
                    />
                    <Key className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => handleCopy(meeting.password, 'Password')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    {copied === 'Password' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Access Type */}
          <div className="flex items-center gap-2">
            {meeting.accessType === 'protected' ? (
              <>
                <Lock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">Protected Meeting</span>
              </>
            ) : (
              <>
                <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">Public Meeting</span>
              </>
            )}
          </div>

          {/* Meeting Link */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Meeting Link</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={meetingLink}
                readOnly
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              />
              <button
                onClick={() => handleCopy(meetingLink, 'Link')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {copied === 'Link' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Participants Info */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{meeting.currentParticipants || 0} / {meeting.maxParticipants} participants</span>
            </div>
          </div>

          {/* Join Section */}
          {meeting.accessType === 'protected' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Enter Password to Join
              </label>
              <CustomInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter meeting password"
                className="w-full"
              />
            </div>
          )}

          {/* Warning for Protected Meeting */}
          {meeting.accessType === 'protected' && (
            <div className="flex items-start gap-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div className="text-sm text-orange-800 dark:text-orange-200">
                This is a protected meeting. You need the password to join.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <CustomButton
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </CustomButton>
            <CustomButton
              onClick={handleJoin}
              variant="primary"
              className="flex-1"
            >
              Join Meeting
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailsModal;

