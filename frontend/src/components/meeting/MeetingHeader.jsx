import React, { useState } from 'react';
import { Copy, Check, Settings, Info, Minimize2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * MeetingHeader Component - Top bar with meeting info and actions
 * Pure UI component
 */
const MeetingHeader = ({ 
  meetingTitle, 
  meetingId, 
  duration,
  connectionStatus,
  onMinimize 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Meeting link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Meeting Info */}
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-white text-xl font-semibold truncate max-w-md">
              {meetingTitle || 'Meeting Room'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-gray-400 text-sm">
                ID: {meetingId?.slice(-8) || 'N/A'}
              </span>
              {duration && (
                <>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-400 text-sm">{duration}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
            <span className="text-gray-300 text-sm capitalize">
              {connectionStatus || 'connecting'}
            </span>
          </div>

          {/* Minimize Button */}
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
              title="Minimize meeting"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          )}

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
            title="Copy meeting link"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Settings Button */}
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            title="Meeting settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Info Button */}
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            title="Meeting info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingHeader;
