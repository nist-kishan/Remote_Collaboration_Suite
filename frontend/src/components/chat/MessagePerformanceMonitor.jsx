import React, { useState, useEffect } from 'react';
import { Activity, Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const MessagePerformanceMonitor = ({ performanceMonitor, className = '' }) => {
  const [metrics, setMetrics] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!performanceMonitor) return;

    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
    };

    // Update metrics every second
    const interval = setInterval(updateMetrics, 1000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [performanceMonitor]);

  if (!metrics || !isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-4 right-4 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-50 ${className}`}
        title="Show Performance Monitor"
      >
        <Activity className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-80 z-50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          Performance
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ×
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Messages Sent */}
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Sent
            </span>
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {metrics.sentMessages}
          </div>
        </div>

        {/* Failed Messages */}
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              Failed
            </span>
          </div>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">
            {metrics.failedMessages}
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Success Rate
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {metrics.successRate.toFixed(1)}%
          </div>
        </div>

        {/* Messages/Second */}
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Msg/sec
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {metrics.messagesPerSecond.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Average Send Time:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {metrics.averageSendTime.toFixed(0)}ms
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total Send Time:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {(metrics.totalSendTime / 1000).toFixed(1)}s
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {(metrics.uptime / 1000).toFixed(0)}s
          </span>
        </div>
      </div>

      {/* Performance Status */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            metrics.successRate > 95 ? 'bg-green-500' : 
            metrics.successRate > 80 ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {metrics.successRate > 95 ? 'Excellent' : 
             metrics.successRate > 80 ? 'Good' : 'Needs Improvement'}
          </span>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => performanceMonitor.reset()}
        className="mt-3 w-full py-2 px-3 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        Reset Metrics
      </button>
    </div>
  );
};

export default MessagePerformanceMonitor;
