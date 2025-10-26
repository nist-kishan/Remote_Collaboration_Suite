import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

const ConnectionStatus = ({ socket, className = '' }) => {
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setConnectionStatus('connected');
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleDisconnect = () => {
      setConnectionStatus('disconnected');
      setShowStatus(true);
    };

    const handleReconnect = () => {
      setConnectionStatus('reconnecting');
      setShowStatus(true);
    };

    const handleConnectError = () => {
      setConnectionStatus('error');
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 5000);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);
    socket.on('connect_error', handleConnectError);

    // Set initial status
    setConnectionStatus(socket.connected ? 'connected' : 'disconnected');

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [socket]);

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Connected',
          color: 'text-green-500',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/50'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          text: 'Disconnected',
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/50'
        };
      case 'reconnecting':
        return {
          icon: <Wifi className="w-4 h-4 animate-pulse" />,
          text: 'Reconnecting...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/50'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Connection Error',
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/50'
        };
      default:
        return {
          icon: <Wifi className="w-4 h-4" />,
          text: 'Unknown',
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/50'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
        >
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-sm ${config.bgColor} ${config.borderColor}`}>
            <div className={config.color}>
              {config.icon}
            </div>
            <span className={`text-sm font-medium ${config.color}`}>
              {config.text}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectionStatus;
