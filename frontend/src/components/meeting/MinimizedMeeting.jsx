import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Maximize2, X, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { restoreMeeting, selectIsMinimized, selectMinimizedMeetingId, selectCurrentMeeting, selectIsMuted, selectIsVideoOn } from '../../store/slice/meetingSlice';
import { useMeeting } from '../../hook/useMeeting';

/**
 * MinimizedMeeting Component - Picture-in-picture style minimized meeting box
 * Shows in bottom-right corner when user navigates away from meeting
 */
const MinimizedMeeting = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const videoRef = useRef(null);
  
  const isMinimized = useSelector(selectIsMinimized);
  const minimizedMeetingId = useSelector(selectMinimizedMeetingId);
  const currentMeeting = useSelector(selectCurrentMeeting);
  const isMuted = useSelector(selectIsMuted);
  const isVideoOn = useSelector(selectIsVideoOn);
  
  const { localStream, handleLeaveMeeting } = useMeeting(minimizedMeetingId);

  // Attach local stream to video element
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleRestore = () => {
    dispatch(restoreMeeting());
    navigate(`/meeting/${minimizedMeetingId}`);
  };

  const handleClose = () => {
    if (window.confirm('Are you sure you want to leave the meeting?')) {
      handleLeaveMeeting();
      dispatch(restoreMeeting());
    }
  };

  if (!isMinimized || !minimizedMeetingId) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Video Preview */}
      <div className="relative bg-gray-900 aspect-video">
        {isVideoOn && localStream ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-white text-2xl font-semibold">
              {currentMeeting?.title?.[0]?.toUpperCase() || 'M'}
            </div>
          </div>
        )}
        
        {/* Status Indicators */}
        <div className="absolute bottom-2 left-2 flex gap-2">
          {isMuted && (
            <div className="bg-red-600 rounded-full p-1.5">
              <MicOff className="w-4 h-4 text-white" />
            </div>
          )}
          {!isVideoOn && (
            <div className="bg-red-600 rounded-full p-1.5">
              <VideoOff className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={handleRestore}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1.5 transition-all"
            title="Restore meeting"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleClose}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 transition-all"
            title="Leave meeting"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Meeting Info */}
      <div 
        onClick={handleRestore}
        className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {currentMeeting?.title || 'Meeting'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              In progress
            </p>
          </div>
          <div className="flex gap-1">
            {!isMuted && <Mic className="w-4 h-4 text-green-500" />}
            {isVideoOn && <Video className="w-4 h-4 text-green-500" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimizedMeeting;
