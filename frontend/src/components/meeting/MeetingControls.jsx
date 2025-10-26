import React from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, PhoneOff, Users } from 'lucide-react';

/**
 * MeetingControls Component - Control buttons for meeting
 * Pure UI component with callbacks for actions
 */
const MeetingControls = ({
  isMuted,
  isVideoOn,
  isScreenSharing,
  isChatOpen,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onLeaveCall,
  participantCount = 0
}) => {
  return (
    <div className="bg-gray-800 dark:bg-gray-900 border-t border-gray-700 dark:border-gray-800 px-2 sm:px-4 py-3 sm:py-4">
      <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 flex-wrap">
        {/* Mute/Unmute */}
        <button
          onClick={onToggleMute}
          className={`p-3 sm:p-4 rounded-full transition-all hover:scale-105 ${
            isMuted 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-gray-700 hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          ) : (
            <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          )}
        </button>

        {/* Video On/Off */}
        <button
          onClick={onToggleVideo}
          className={`p-3 sm:p-4 rounded-full transition-all hover:scale-105 ${
            isVideoOn 
              ? 'bg-gray-700 hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
          title={isVideoOn ? 'Turn off video' : 'Turn on video'}
        >
          {isVideoOn ? (
            <Video className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          ) : (
            <VideoOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          )}
        </button>

        {/* Screen Share - Hidden on small screens */}
        <button
          onClick={onToggleScreenShare}
          className={`hidden sm:flex p-3 sm:p-4 rounded-full transition-all hover:scale-105 ${
            isScreenSharing 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-700 hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700'
          }`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>

        {/* Chat */}
        <button
          onClick={onToggleChat}
          className={`p-3 sm:p-4 rounded-full transition-all hover:scale-105 relative ${
            isChatOpen 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-700 hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700'
          }`}
          title="Toggle chat"
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>

        {/* Participants Info */}
        <div className="px-3 sm:px-4 py-2 bg-gray-700 dark:bg-gray-800 rounded-full flex items-center gap-1 sm:gap-2">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          <span className="text-white text-xs sm:text-sm font-medium">{participantCount}</span>
        </div>

        {/* Leave Call */}
        <button
          onClick={onLeaveCall}
          className="px-4 sm:px-6 py-3 sm:py-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all hover:scale-105 flex items-center gap-1 sm:gap-2 ml-1 sm:ml-4"
          title="Leave call"
        >
          <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base font-medium hidden sm:inline">Leave</span>
        </button>
      </div>
    </div>
  );
};

export default MeetingControls;
