import React, { useState } from 'react';
import { Video, VideoOff, Monitor, PhoneOff, Phone, Settings, Mic, MicOff } from 'lucide-react';
import Button from '../ui/Button';
import { updateCallSettings } from '../../api/callApi';
import { toast } from 'react-hot-toast';

const CallControls = ({
  isVideoEnabled,
  isScreenSharing,
  callStatus,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
  callId,
  isMuted = false,
  onToggleMute
}) => {
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const handleToggleVideo = async () => {
    if (!callId) {
      onToggleVideo();
      return;
    }

    try {
      setIsUpdatingSettings(true);
      await updateCallSettings(callId, { videoEnabled: !isVideoEnabled });
      onToggleVideo();
      toast.success(isVideoEnabled ? 'Camera turned off' : 'Camera turned on');
    } catch (error) {
      toast.error('Failed to update camera settings');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleToggleScreenShare = async () => {
    if (!callId) {
      onToggleScreenShare();
      return;
    }

    try {
      setIsUpdatingSettings(true);
      await updateCallSettings(callId, { screenSharing: !isScreenSharing });
      onToggleScreenShare();
      toast.success(isScreenSharing ? 'Screen sharing stopped' : 'Screen sharing started');
    } catch (error) {
      toast.error('Failed to update screen sharing settings');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-6">
      <div className="flex items-center justify-center gap-4">
        {/* Microphone On/Off */}
        {onToggleMute && (
          <Button
            onClick={onToggleMute}
            variant="ghost"
            size="lg"
            className={`rounded-full w-14 h-14 ${
              !isMuted
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            disabled={isUpdatingSettings}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>
        )}

        {/* Video On/Off */}
        <Button
          onClick={handleToggleVideo}
          variant="ghost"
          size="lg"
          className={`rounded-full w-14 h-14 ${
            isVideoEnabled
              ? 'bg-white/10 hover:bg-white/20 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          disabled={isUpdatingSettings}
        >
          {isVideoEnabled ? (
            <Video className="w-6 h-6" />
          ) : (
            <VideoOff className="w-6 h-6" />
          )}
        </Button>

        {/* Screen Share */}
        <Button
          onClick={handleToggleScreenShare}
          variant="ghost"
          size="lg"
          className={`rounded-full w-14 h-14 ${
            isScreenSharing
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          disabled={isUpdatingSettings}
        >
          <Monitor className="w-6 h-6" />
        </Button>

        {/* End Call */}
        <Button
          onClick={onEndCall}
          variant="ghost"
          size="lg"
          className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 text-white"
          title="End call"
          disabled={isUpdatingSettings}
        >
          {callStatus === 'ringing' ? (
            <PhoneOff className="w-6 h-6" />
          ) : (
            <Phone className="w-6 h-6 rotate-135" />
          )}
        </Button>
      </div>

      {/* Settings Status Indicator */}
      {isUpdatingSettings && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full text-white text-xs">
            <Settings className="w-3 h-3 animate-spin" />
            <span>Updating settings...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallControls;

