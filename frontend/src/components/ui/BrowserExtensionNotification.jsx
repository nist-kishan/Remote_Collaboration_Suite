import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import CustomButton from './CustomButton';

const BrowserExtensionWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [extensionErrors, setExtensionErrors] = useState(0);

  useEffect(() => {
    // Listen for console errors that might be from extensions
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('message channel closed') || 
          message.includes('listener indicated an asynchronous response') ||
          message.includes('Extension context invalidated')) {
        setExtensionErrors(prev => prev + 1);
        if (prev === 0) {
          setShowWarning(true);
        }
      }
      originalConsoleError.apply(console, args);
    };

    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('message channel closed') || 
          message.includes('listener indicated an asynchronous response') ||
          message.includes('Extension context invalidated')) {
        setExtensionErrors(prev => prev + 1);
        if (prev === 0) {
          setShowWarning(true);
        }
      }
      originalConsoleWarn.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  const handleDismiss = () => {
    setShowWarning(false);
    setExtensionErrors(0);
  };

  const handleIgnore = () => {
    setShowWarning(false);
    // Don't reset extensionErrors so we don't show again
  };

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 left-4 z-50 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Browser Extension Detected
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            We detected {extensionErrors} error(s) from browser extensions. These don't affect the app functionality.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <CustomButton
              onClick={handleDismiss}
              size="sm"
              variant="outline"
              className="text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
            >
              Dismiss
            </CustomButton>
            <CustomButton
              onClick={handleIgnore}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Ignore Future
            </CustomButton>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded"
        >
          <X className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        </button>
      </div>
    </div>
  );
};

export default BrowserExtensionWarning;
