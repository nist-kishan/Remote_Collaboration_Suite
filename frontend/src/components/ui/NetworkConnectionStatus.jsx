import React from 'react';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useSocket } from '../../hook/useSocket';
import CustomButton from './CustomButton';

const ConnectionStatus = ({ className = '' }) => {
  const { isConnected, connectionError, reconnect } = useSocket();

  if (isConnected && !connectionError) {
    return null; // Don't show anything when connected
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Wifi className="w-4 h-4 text-green-600" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-600" />
        )}
        
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">
            {isConnected ? 'Connected' : 'Connection Issue'}
          </p>
          {connectionError && (
            <p className="text-xs text-red-600 mt-1">
              {connectionError}
            </p>
          )}
        </div>
        
        {!isConnected && (
          <CustomButton
            onClick={reconnect}
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </CustomButton>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
