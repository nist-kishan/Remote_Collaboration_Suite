import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';

const AutoSaveIndicator = ({ 
  status = 'idle', // 'idle', 'saving', 'saved', 'error'
  lastSaved = null,
  isAutoSaveEnabled = false 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Clock,
          text: 'Auto-saving...',
          className: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'saved':
        return {
          icon: Check,
          text: 'Saved',
          className: 'text-green-600 dark:text-green-400',
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save failed',
          className: 'text-red-600 dark:text-red-400',
        };
      default:
        return {
          icon: null,
          text: isAutoSaveEnabled ? 'Auto-save enabled (5s)' : 'Auto-save disabled',
          className: 'text-gray-500 dark:text-gray-400',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatLastSaved = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const saved = new Date(timestamp);
    const diffMs = now - saved;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      return saved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {Icon && <Icon className="w-4 h-4" />}
      <span className={config.className}>
        {config.text}
      </span>
      {lastSaved && status === 'saved' && (
        <span className="text-gray-500 dark:text-gray-400 text-xs">
          {formatLastSaved(lastSaved)}
        </span>
      )}
    </div>
  );
};

export default AutoSaveIndicator;
