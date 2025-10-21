import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  Signal,
  Clock,
  Users,
  User
} from 'lucide-react';

const CallStatusBar = ({
  timeElapsed,
  connectionQuality = 'good',
  participantCount = 1,
  callerName = 'Unknown',
  className = ''
}) => {
  // Format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get connection quality color
  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Get connection quality icon
  const getConnectionQualityIcon = () => {
    switch (connectionQuality) {
      case 'excellent':
      case 'good':
        return <Wifi className="w-4 h-4" />;
      case 'poor':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <Signal className="w-4 h-4" />;
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Call Timer */}
      <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2">
        <div className="flex items-center gap-2 text-white">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <Clock className="w-4 h-4" />
          <p className="font-medium text-lg">{formatTime(timeElapsed)}</p>
        </div>
      </div>

      {/* Connection Quality */}
      <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2">
        <div className="flex items-center gap-2 text-white">
          <div className={getConnectionQualityColor()}>
            {getConnectionQualityIcon()}
          </div>
          <span className="text-sm font-medium capitalize">{connectionQuality}</span>
        </div>
      </div>

      {/* Participant Count */}
      {participantCount > 1 && (
        <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{participantCount}</span>
          </div>
        </div>
      )}

      {/* Caller Info */}
      <div className="bg-black/70 backdrop-blur-sm rounded-xl px-6 py-3">
        <div className="flex items-center gap-3 text-white">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <User className="w-4 h-4" />
          <span className="text-lg font-semibold">{callerName}</span>
        </div>
      </div>
    </div>
  );
};

export default CallStatusBar;
