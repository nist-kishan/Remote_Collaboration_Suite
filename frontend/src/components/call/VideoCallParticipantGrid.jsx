import React from 'react';
import { PhoneOff, Video, VideoOff } from 'lucide-react';

const ParticipantGrid = ({ participants, localVideoRef, remoteVideoRef }) => {
  const getGridCols = (count) => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className={`grid ${getGridCols(participants.length)} gap-4 p-4 h-full`}>
      {participants.map((participant, index) => (
        <div
          key={participant.userId || index}
          className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video"
        >
          {/* Video or Avatar */}
          {participant.videoEnabled ? (
            <video
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
                <PhoneOff className="w-12 h-12 text-gray-400" />
              </div>
            </div>
          )}

          {/* Participant Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-3">
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold truncate">
                {participant.userName || 'Unknown'}
              </p>
              <div className="flex items-center gap-2">
                {participant.videoEnabled ? (
                  <Video className="w-4 h-4 text-green-400" />
                ) : (
                  <VideoOff className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ParticipantGrid;

