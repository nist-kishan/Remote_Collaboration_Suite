import React from 'react';
import { X, Clock, Calendar, AlertCircle } from 'lucide-react';
import CustomButton from '../ui/CustomButton';

const MeetingScheduleNotification = ({ 
  isOpen, 
  onClose, 
  meetingTitle, 
  scheduledTime,
  type = 'too-early' // 'too-early' or 'ended'
}) => {
  if (!isOpen) return null;

  const formattedTime = scheduledTime ? new Date(scheduledTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              type === 'too-early' 
                ? 'bg-blue-100 dark:bg-blue-900/20' 
                : 'bg-red-100 dark:bg-red-900/20'
            }`}>
              {type === 'too-early' ? (
                <Clock className={`w-6 h-6 ${
                  type === 'too-early' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {type === 'too-early' ? 'Meeting Not Started' : 'Meeting Ended'}
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
        <div className="p-6 space-y-4">
          {/* Meeting Title */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Meeting</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {meetingTitle}
            </p>
          </div>

          {/* Message */}
          {type === 'too-early' ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    This meeting is scheduled for:
                  </p>
                  <p className="text-base font-bold text-blue-900 dark:text-blue-100">
                    {formattedTime}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium mb-1">You can join this meeting:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Up to <strong>10 minutes before</strong> the scheduled start time</li>
                      <li>During the meeting duration</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Please return closer to the scheduled time to join this meeting.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                    This meeting has already ended.
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    The scheduled meeting time was: <strong>{formattedTime}</strong>
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Please contact the meeting organizer if you need to schedule a new meeting.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <CustomButton
            onClick={onClose}
            variant="primary"
            className="flex-1"
          >
            {type === 'too-early' ? 'Back to Meetings' : 'Close'}
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default MeetingScheduleNotification;
