import React from 'react';
import { MicOff, Video, VideoOff, Crown, Users } from 'lucide-react';

/**
 * ParticipantsPanel Component - Shows list of meeting participants
 * Pure UI component
 */
const ParticipantItem = ({ participant, isHost = false, isCurrentUser = false }) => {
  const userName = participant?.user?.name || participant?.name || 'Unknown';
  const userAvatar = participant?.user?.avatar || participant?.avatar;
  const status = participant?.status || 'joined';
  
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
      {/* Avatar */}
      <div className="relative">
        {userAvatar ? (
          <img 
            src={userAvatar} 
            alt={userName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
            {userName[0]?.toUpperCase() || 'U'}
          </div>
        )}
        {status === 'joined' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-700"></div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-white text-sm font-medium truncate">
            {userName}
            {isCurrentUser && ' (You)'}
          </div>
          {isHost && (
            <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" title="Host" />
          )}
        </div>
        <div className="text-gray-400 text-xs capitalize">{status}</div>
      </div>

      {/* Status Icons */}
      <div className="flex items-center gap-2">
        {participant?.videoEnabled === false && (
          <VideoOff className="w-4 h-4 text-gray-400" title="Video off" />
        )}
        {participant?.isMuted && (
          <MicOff className="w-4 h-4 text-gray-400" title="Muted" />
        )}
      </div>
    </div>
  );
};

const ParticipantsPanel = ({ participants, currentUserId, hostId }) => {
  const participantCount = participants?.length || 0;

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-white font-semibold text-lg">Participants</h3>
        <span className="text-gray-400 text-sm bg-gray-700 px-3 py-1 rounded-full">
          {participantCount}
        </span>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4">
        {participantCount === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No participants yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {participants.map((participant) => {
              const userId = participant?.user?._id || participant?.userId;
              const isHost = userId === hostId;
              const isCurrentUser = userId === currentUserId;
              
              return (
                <ParticipantItem
                  key={userId}
                  participant={participant}
                  isHost={isHost}
                  isCurrentUser={isCurrentUser}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsPanel;
