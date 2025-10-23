import React from 'react';
import { Users, Wifi, WifiOff, Clock, Save } from 'lucide-react';
import { useWhiteboardCollaboration } from '../../hook/useWhiteboardCollaboration';
import { useWhiteboardAutoSave } from '../../hook/useWhiteboardAutoSave';

/**
 * Whiteboard Collaboration Status Component
 * Shows active collaborators, connection status, and auto-save status
 */
export const WhiteboardCollaborationStatus = ({ 
  whiteboardId, 
  currentUser, 
  canvasData,
  className = '' 
}) => {
  const {
    activeCollaborators,
    isConnected,
    getCollaborationStatus
  } = useWhiteboardCollaboration(whiteboardId, currentUser);
  
  const {
    isEnabled: autoSaveEnabled,
    isAutoSaving,
    lastSaved,
    hasUnsavedChanges,
    getAutoSaveStatus
  } = useWhiteboardAutoSave(whiteboardId, canvasData, {
    showToast: false // Don't show toast for auto-save status
  });

  const collaborationStatus = getCollaborationStatus();
  const autoSaveStatus = getAutoSaveStatus();

  const formatLastSaved = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className={`flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        {isConnected ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
        <span className="text-xs">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Active Collaborators */}
      <div className="flex items-center space-x-1">
        <Users className="w-4 h-4 text-blue-500" />
        <span className="text-xs">
          {collaborationStatus.activeUsers} active
        </span>
        {activeCollaborators.length > 0 && (
          <div className="flex -space-x-1 ml-2">
            {activeCollaborators.slice(0, 3).map((user, index) => (
              <div
                key={user.userId}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-xs text-white font-medium"
                title={user.userName}
              >
                {user.userName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            ))}
            {activeCollaborators.length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-500 flex items-center justify-center text-xs text-white font-medium">
                +{activeCollaborators.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auto-save Status */}
      <div className="flex items-center space-x-1">
        {isAutoSaving ? (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        ) : autoSaveEnabled ? (
          <Save className={`w-4 h-4 ${hasUnsavedChanges ? 'text-orange-500' : 'text-green-500'}`} />
        ) : (
          <Save className="w-4 h-4 text-gray-400" />
        )}
        <span className="text-xs">
          {isAutoSaving ? 'Saving...' : 
           autoSaveEnabled ? 
             (hasUnsavedChanges ? 'Unsaved changes' : 'Auto-saved') : 
             'Auto-save off'}
        </span>
      </div>

      {/* Last Saved Time */}
      {lastSaved && (
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-xs">
            Saved {formatLastSaved(lastSaved)}
          </span>
        </div>
      )}
    </div>
  );
};

export default WhiteboardCollaborationStatus;
