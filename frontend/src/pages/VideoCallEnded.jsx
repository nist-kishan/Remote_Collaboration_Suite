import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Phone, 
  MessageSquare,
  User,
  Video,
  PhoneOff
} from 'lucide-react';

const VideoCallEnded = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { message, caller, receiver } = location.state || {};

  const getCallEndIcon = () => {
    if (message?.includes('rejected')) {
      return <PhoneOff className="w-20 h-20 text-red-500" />;
    }
    return <Video className="w-20 h-20 text-gray-500" />;
  };

  const getCallEndColor = () => {
    if (message?.includes('rejected')) {
      return 'text-red-500';
    }
    return 'text-gray-500';
  };

  const handleGoHome = () => {
    navigate('/chat');
  };

  const handleCallAgain = () => {
    const userId = caller?._id || receiver?._id;
    if (userId) {
      navigate(`/video-call/caller/${userId}`);
    }
  };

  const handleSendMessage = () => {
    const userId = caller?._id || receiver?._id;
    if (userId) {
      navigate(`/chat/user/${userId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        {/* Call End Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          {getCallEndIcon()}
        </motion.div>

        {/* Call End Message */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`text-2xl font-bold mb-4 ${getCallEndColor()}`}
        >
          {message || 'Call Ended'}
        </motion.h1>

        {/* User Info */}
        {(caller || receiver) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                {(caller || receiver)?.avatar ? (
                  <img 
                    src={(caller || receiver).avatar} 
                    alt={(caller || receiver).name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(caller || receiver)?.name || 'Unknown User'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {caller ? 'Caller' : 'Receiver'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          {/* Call Again Button */}
          {(caller || receiver) && (
            <button
              onClick={handleCallAgain}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Call Again
            </button>
          )}

          {/* Send Message Button */}
          {(caller || receiver) && (
            <button
              onClick={handleSendMessage}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Send Message
            </button>
          )}

          {/* Go Home Button */}
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Chat
          </button>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {message?.includes('rejected') 
              ? 'The call was declined by the recipient.'
              : 'The video call has ended.'
            }
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VideoCallEnded;
