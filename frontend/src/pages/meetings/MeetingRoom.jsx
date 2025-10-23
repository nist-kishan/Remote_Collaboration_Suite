import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, Users, X, Copy, Check } from 'lucide-react';
import { useMeeting } from '../../hook/useMeeting';
import { useSelector } from 'react-redux';
import CustomButton from '../../components/ui/CustomButton';
import { toast } from 'react-hot-toast';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const {
    currentMeeting,
    participants,
    isLoading,
    isMuted,
    isVideoOn,
    isScreenSharing,
    chatMessages,
    isChatOpen,
    handleToggleMute,
    handleToggleVideo,
    handleToggleScreenShare,
    handleToggleChat,
    handleLeaveMeeting,
    refetchMeeting
  } = useMeeting(meetingId);

  const localVideoRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (meetingId && isLoading === false) {
      refetchMeeting();
    }
  }, [meetingId, refetchMeeting, isLoading]);

  useEffect(() => {
    // Initialize user media stream
    const initializeStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoOn,
          audio: !isMuted
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast.error('Failed to access camera/microphone');
      }
    };

    initializeStream();

    return () => {
      // Cleanup stream on unmount
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoOn, isMuted]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Meeting link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading meeting...</div>
      </div>
    );
  }

  if (!currentMeeting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Meeting not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-white text-lg font-semibold truncate">
            {currentMeeting.title}
          </h2>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </button>
        </div>
        <button
          onClick={handleLeaveMeeting}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
          Leave
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Video Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {user?.name || 'You'} {isMuted && '(Muted)'}
            </div>
          </div>

          {/* Remote Participants */}
          {participants.map((participant) => (
            <div key={participant.user._id} className="relative bg-gray-800 rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center text-white text-4xl">
                  {participant.user.name?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {participant.user.name}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        {isChatOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">Chat</h3>
              <button
                onClick={handleToggleChat}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  No messages yet
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="text-white font-medium text-sm mb-1">
                        {message.user}
                      </div>
                      <div className="text-gray-300 text-sm">
                        {message.text}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {message.time}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-700">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Participants Panel */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-white font-semibold">Participants</h3>
            <span className="text-gray-400 text-sm">{participants.length + 1}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-gray-700 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{user?.name || 'You'}</div>
                  <div className="text-gray-400 text-xs">Host</div>
                </div>
                {isMuted && <MicOff className="w-4 h-4 text-gray-400" />}
              </div>
              {participants.map((participant) => (
                <div key={participant.user._id} className="flex items-center gap-3 p-2 bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm">
                    {participant.user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">{participant.user.name}</div>
                    <div className="text-gray-400 text-xs capitalize">{participant.role}</div>
                  </div>
                  {participant.isMuted && <MicOff className="w-4 h-4 text-gray-400" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleToggleMute}
            className={`p-3 rounded-full transition-colors ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>

          <button
            onClick={handleToggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoOn 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isVideoOn ? (
              <Video className="w-6 h-6 text-white" />
            ) : (
              <VideoOff className="w-6 h-6 text-white" />
            )}
          </button>

          <button
            onClick={handleToggleScreenShare}
            className={`p-3 rounded-full transition-colors ${
              isScreenSharing 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Monitor className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={handleToggleChat}
            className={`p-3 rounded-full transition-colors ${
              isChatOpen 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <MessageSquare className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={handleLeaveMeeting}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;

