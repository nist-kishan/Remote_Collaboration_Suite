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
          text: 'Saving...',
          className: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'saved':
        return {
          icon: Check,
          text: 'All changes saved',
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
          icon: Clock,
          text: isAutoSaveEnabled ? 'Auto-save active' : 'Auto-save disabled',
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
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 10) {
      return 'just now';
    } else if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return saved.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-all duration-200 ${
      status === 'saving' ? 'bg-yellow-100 dark:bg-yellow-900/30 animate-pulse' :
      status === 'saved' ? 'bg-green-100 dark:bg-green-900/30' :
      status === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
      'bg-gray-100 dark:bg-gray-800'
    }`}>
      {Icon && <Icon className={`w-3 h-3 flex-shrink-0 ${
        status === 'saving' ? 'animate-spin' : ''
      }`} />}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`${config.className} font-semibold whitespace-nowrap`}>
          {config.text}
        </span>
        {lastSaved && status === 'saved' && (
          <span className="text-gray-500 dark:text-gray-400 text-[10px] font-medium whitespace-nowrap">
            {formatLastSaved(lastSaved)}
          </span>
        )}
      </div>
    </div>
  );
};

export default AutoSaveIndicator;
