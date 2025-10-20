import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import CustomButton from '../ui/CustomButton';

const WhiteboardError = ({ message = "Something went wrong", onRetry }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Oops! Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        {onRetry && (
          <CustomButton
            onClick={onRetry}
            className="flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </CustomButton>
        )}
      </div>
    </div>
  );
};

export default WhiteboardError;
