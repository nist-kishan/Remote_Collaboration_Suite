import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  User,
  RotateCcw
} from 'lucide-react';
import { useCall } from '../hook/useCall';
import { toast } from 'react-hot-toast';

const VideoCallCaller = () => {
  const { senderId } = useParams();
  const navigate = useNavigate();
  const { 
    socket, 
    startCall, 
    endCall,
    callStatus: useCallStatus, 
    isCallLoading 
  } = useCall();
  const [callData, setCallData] = useState(null);
  // Use call status from useCall hook
  const callStatus = useCallStatus || 'calling';
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const ringtoneRef = useRef(null);
  const localStreamRef = useRef(null);

  // Auto-hide controls
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls]);

  // Play ringing tone for outgoing call
  useEffect(() => {
    if (callStatus === 'calling') {
      // Create audio element if it doesn't exist or is not in document
      if (!ringtoneRef.current || !document.contains(ringtoneRef.current)) {
        try {
          ringtoneRef.current = new Audio('/sounds/outgoing-call.mp3');
          ringtoneRef.current.loop = true;
          ringtoneRef.current.volume = 0.7;
          
          // Add error handling for audio loading
          ringtoneRef.current.addEventListener('error', (e) => {
            console.warn('🔇 Audio file failed to load, using fallback:', e);
            // Create a simple beep sound as fallback
            try {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              oscillator.frequency.value = 800;
              oscillator.type = 'sine';
              gainNode.gain.value = 0.1;
              
              oscillator.start();
              setTimeout(() => oscillator.stop(), 200);
            } catch (fallbackError) {
              console.warn('🔇 Fallback audio also failed:', fallbackError);
            }
          });
          
          ringtoneRef.current.addEventListener('canplaythrough', () => {
            console.log('🔊 Audio file loaded successfully');
          });
        } catch (error) {
          console.warn('🔇 Failed to create audio element:', error);
        }
      }
      
      // Play the audio
      if (ringtoneRef.current && ringtoneRef.current.paused) {
        ringtoneRef.current.play().catch((error) => {
          console.log('🔇 Ringing tone play failed:', error.message);
        });
      }
    } else {
      // Stop the audio
      if (ringtoneRef.current && !ringtoneRef.current.paused) {
        try {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
        } catch (error) {
          console.log('🔇 Ringing tone pause failed:', error.message);
        }
      }
    }
  }, [callStatus]);

  // Timer for call duration
  useEffect(() => {
    let interval;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Format time
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Load call data from localStorage or Redux store
  useEffect(() => {
    const savedCallData = localStorage.getItem('activeCallData');
    if (savedCallData) {
      try {
        const parsedData = JSON.parse(savedCallData);
        console.log('📞 VideoCallCaller - Loaded call data:', parsedData);
        if (parsedData.status === 'connecting' || parsedData.status === 'calling') {
          setCallData(parsedData);
          setCallStatus('calling');
        }
      } catch (error) {
        console.error('Error parsing saved call data:', error);
      }
    } else {
      console.log('📞 VideoCallCaller - No saved call data found');
    }
  }, []);

  // If senderId is undefined, show error
  useEffect(() => {
    if (!senderId || senderId === 'undefined') {
      console.error('❌ Invalid sender ID:', senderId);
      toast.error('Invalid call parameters');
      navigate('/chat');
    }
  }, [senderId, navigate]);

  // Initialize call using useCall hook
  useEffect(() => {
    const initializeCall = async () => {
      try {
        console.log('🎥 VideoCallCaller - Starting call for sender:', senderId);
        
        // Check if call is already in progress
        const savedCallData = localStorage.getItem('activeCallData');
        if (savedCallData) {
          const parsedData = JSON.parse(savedCallData);
          if (parsedData.status === 'connecting' || parsedData.status === 'calling') {
            console.log('📞 Call already in progress, skipping initialization');
            return;
          }
        }
        
        // Use the useCall hook's startCall function
        await startCall(senderId);
        
        console.log('✅ VideoCallCaller - Call initiated successfully');
      } catch (error) {
        console.error('❌ VideoCallCaller - Error starting call:', error);
        toast.error('Failed to start call');
        navigate('/chat');
      }
    };

    // Start initialization immediately
    initializeCall();
  }, [startCall, senderId, navigate]);

  // Handle cancel call
  const handleCancelCall = () => {
    // Use the useCall hook's endCall function
    endCall();
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Clear persisted call data
    localStorage.removeItem('activeCallData');
    
    navigate('/chat');
  };

  // Handle end call
  const handleEndCall = () => {
    // Use the useCall hook's endCall function
    endCall();
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Clear persisted call data
    localStorage.removeItem('activeCallData');
    
    navigate('/video-call/ended', { 
      state: { 
        message: 'Call ended',
        receiver: callData?.receiver 
      } 
    });
  };

  // Handle mute toggle
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Handle video toggle
  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = (data) => {
      console.log('Call accepted:', data);
      setCallData(data);
      setCallStatus('connected');
      toast.success('Call accepted');
    };

    const handleCallRejected = (data) => {
      console.log('Call rejected:', data);
      setCallStatus('ended');
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      navigate('/video-call/ended', { 
        state: { 
          message: 'Call rejected',
          receiver: data.receiver 
        } 
      });
    };

    const handleCallEnded = (data) => {
      console.log('Call ended:', data);
      setCallStatus('ended');
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      navigate('/video-call/ended', { 
        state: { 
          message: 'Call ended by receiver',
          receiver: callData?.receiver 
        } 
      });
    };

    const handleRemoteStream = (data) => {
      console.log('Remote stream received:', data);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = data.stream;
      }
    };

    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);
    socket.on('remote_stream', handleRemoteStream);

    return () => {
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
      socket.off('remote_stream', handleRemoteStream);
    };
  }, [socket, callData, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Stop ringing tone
      if (ringtoneRef.current) {
        try {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
        } catch (error) {
          console.log('🔇 Cleanup ringing tone error:', error.message);
        }
      }
    };
  }, []);

  if (callStatus === 'calling') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        {/* Ringing Tone - Created programmatically */}

        <div className="text-center text-white max-w-md mx-auto p-6">
          {/* Local Video Preview */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 mx-auto mb-6 bg-gray-700 rounded-full overflow-hidden"
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Call Status */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-semibold mb-2"
          >
            Calling...
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 mb-8"
          >
            Waiting for answer
          </motion.p>

          {/* Cancel Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center"
          >
            <button
              onClick={handleCancelCall}
              className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
            >
              <PhoneOff className="w-8 h-8 text-white" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (callStatus === 'connecting') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Connecting...</p>
        </div>
      </div>
    );
  }

  if (callStatus === 'connected') {
    return (
      <div 
        className="fixed inset-0 bg-black z-50 flex flex-col"
        onClick={() => setShowControls(!showControls)}
      >
        {/* Remote Video (Main) */}
        <div className="flex-1 relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            className="w-full h-full object-cover"
          />
          
          {/* Local Video (Picture-in-picture) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Local Video Status */}
            <div className="absolute top-2 left-2 flex items-center gap-1">
              {isMuted && (
                <div className="bg-red-600 rounded-full p-1">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              )}
              {!isVideoEnabled && (
                <div className="bg-red-600 rounded-full p-1">
                  <VideoOff className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Call Timer */}
          <div className="absolute top-4 left-4 bg-black/70 rounded-lg px-3 py-2">
            <p className="text-white font-medium">{formatTime(timeElapsed)}</p>
          </div>
        </div>

        {/* Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-center gap-4">
                  {/* Mute Button */}
                  <button
                    onClick={handleToggleMute}
                    className={`p-4 rounded-full transition-all duration-200 ${
                      isMuted 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>

                  {/* Video Button */}
                  <button
                    onClick={handleToggleVideo}
                    className={`p-4 rounded-full transition-all duration-200 ${
                      !isVideoEnabled 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                  >
                    {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  </button>

                  {/* End Call Button */}
                  <button
                    onClick={handleEndCall}
                    className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-all duration-200 text-white"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
};

export default VideoCallCaller;
