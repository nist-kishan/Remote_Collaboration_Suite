import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';

const UploadProgress = ({ 
  files = [], 
  onComplete, 
  onCancel,
  onRetry 
}) => {
  const [uploadStates, setUploadStates] = useState({});
  const [completedFiles, setCompletedFiles] = useState(new Set());
  const [failedFiles, setFailedFiles] = useState(new Set());

  useEffect(() => {
    // Initialize upload states for all files
    const initialState = {};
    files.forEach((file, index) => {
      initialState[index] = {
        progress: 0,
        status: 'uploading', // 'uploading', 'completed', 'failed'
        error: null
      };
    });
    setUploadStates(initialState);
  }, [files]);

  const updateProgress = (fileIndex, progress, status = 'uploading', error = null) => {
    setUploadStates(prev => ({
      ...prev,
      [fileIndex]: { progress, status, error }
    }));

    if (status === 'completed') {
      setCompletedFiles(prev => new Set([...prev, fileIndex]));
    } else if (status === 'failed') {
      setFailedFiles(prev => new Set([...prev, fileIndex]));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return (
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'video':
        return (
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'audio':
        return (
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusIcon = (status, progress) => {
    if (status === 'completed') {
      return <Check className="w-4 h-4 text-green-500" />;
    } else if (status === 'failed') {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    } else if (progress > 0) {
      return (
        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      );
    } else {
      return (
        <div className="flex space-x-0.5">
          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
        </div>
      );
    }
  };

  const allCompleted = files.length > 0 && completedFiles.size === files.length;
  const hasFailures = failedFiles.size > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {allCompleted ? 'Upload Complete' : 'Sending Media'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Files List */}
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {files.map((file, index) => {
            const uploadState = uploadStates[index] || { progress: 0, status: 'uploading' };
            
            return (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {/* File Icon */}
                {getFileIcon(file.type)}
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                  
                  {/* Progress Bar */}
                  {uploadState.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadState.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Error Message */}
                  {uploadState.status === 'failed' && uploadState.error && (
                    <p className="text-xs text-red-500 mt-1">{uploadState.error}</p>
                  )}
                </div>
                
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(uploadState.status, uploadState.progress)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          {hasFailures && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              Retry Failed
            </button>
          )}
          
          {allCompleted && (
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;
