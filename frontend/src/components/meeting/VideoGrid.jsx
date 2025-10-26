import React, { useRef, useEffect } from 'react';
import { MicOff } from 'lucide-react';

/**
 * VideoGrid Component - Displays local and remote video streams
 * Pure UI component with no business logic
 */
const VideoTile = ({ stream, userName, isMuted, isLocal = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-white text-3xl">
            {userName?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      )}
      <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2">
        <span>{userName || 'Unknown'}</span>
        {isMuted && <MicOff className="w-4 h-4" />}
      </div>
    </div>
  );
};

const VideoGrid = ({ localStream, remoteStreams, participants, currentUser, isMuted }) => {
  // Convert remoteStreams object to array
  const remoteStreamArray = Object.entries(remoteStreams || {}).map(([userId, stream]) => ({
    userId,
    stream,
    participant: participants.find(p => p.user?._id === userId)
  }));

  const totalVideos = 1 + remoteStreamArray.length; // 1 for local + remote participants

  // Determine grid layout based on number of participants
  const getGridClass = () => {
    if (totalVideos === 1) return 'grid-cols-1';
    if (totalVideos === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (totalVideos <= 4) return 'grid-cols-1 sm:grid-cols-2';
    if (totalVideos <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    if (totalVideos <= 9) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className={`grid ${getGridClass()} gap-2 sm:gap-4 p-2 sm:p-4 h-full overflow-y-auto bg-gray-900`}>
      {/* Local Video */}
      <VideoTile
        stream={localStream}
        userName={`${currentUser?.name || 'You'} (You)`}
        isMuted={isMuted}
        isLocal={true}
      />

      {/* Remote Videos */}
      {remoteStreamArray.map(({ userId, stream, participant }) => (
        <VideoTile
          key={userId}
          stream={stream}
          userName={participant?.user?.name || 'Participant'}
          isMuted={participant?.isMuted || false}
          isLocal={false}
        />
      ))}
    </div>
  );
};

export default VideoGrid;
