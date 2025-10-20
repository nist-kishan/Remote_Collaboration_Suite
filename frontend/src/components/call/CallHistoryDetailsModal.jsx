import React from 'react';
import { X, Video, VideoOff, Clock, Users, User, Calendar, Phone } from 'lucide-react';
import CustomButton from '../ui/CustomButton';
import UserProfileAvatar from '../ui/UserProfileAvatar';

const CallDetailsModal = ({ call, isVisible, onClose }) => {
  if (!isVisible || !call) return null;

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    const callDate = new Date(date);
    return callDate.toLocaleString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCallStatus = (call) => {
    switch (call.status) {
      case 'ended': return 'Completed';
      case 'missed': return 'Missed';
      case 'rejected': return 'Rejected';
      case 'ongoing': return 'Ongoing';
      case 'ringing': return 'Ringing';
      default: return 'Unknown';
    }
  };

  const getCallTypeIcon = (type) => {
    return type === 'group' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Call Details
          </h2>
          <CustomButton
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </CustomButton>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Call Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getCallTypeIcon(call.type)}
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {call.type === 'group' ? 'Group Call' : 'Video Call'}
              </span>
            </div>
            <div className="ml-auto">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                call.status === 'ended' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                call.status === 'missed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                call.status === 'rejected' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {getCallStatus(call)}
              </span>
            </div>
          </div>

          {/* Call Duration */}
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Duration</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{formatDuration(call.duration)}</p>
            </div>
          </div>

          {/* Call Date */}
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Date & Time</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(call.startedAt)}</p>
            </div>
          </div>

          {/* Started By */}
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div className="flex items-center gap-2">
              <UserProfileAvatar user={call.startedBy} size="sm" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Started by</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{call.startedBy.name}</p>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Participants ({call.participants.length})
            </p>
            <div className="space-y-2">
              {call.participants.map((participant, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={participant.user} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {participant.user.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {participant.status === 'joined' ? 'Joined' :
                         participant.status === 'left' ? 'Left' :
                         participant.status === 'missed' ? 'Missed' :
                         participant.status === 'rejected' ? 'Rejected' :
                         'Invited'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {participant.videoEnabled ? (
                      <Video className="w-4 h-4 text-green-500" />
                    ) : (
                      <VideoOff className="w-4 h-4 text-red-500" />
                    )}
                    {participant.duration && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDuration(participant.duration)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <CustomButton onClick={onClose} variant="outline">
            Close
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default CallDetailsModal;
