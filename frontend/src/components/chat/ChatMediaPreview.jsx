import React, { useState } from 'react';
import { X, Send, FileText, Play, Image as ImageIcon } from 'lucide-react';
import UploadProgress from '../ui/UploadProgress';

const MediaPreview = ({ 
  files, 
  onRemoveFile, 
  onSend, 
  onCaptionChange, 
  captions = {},
  disabled = false 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleSendWithProgress = async () => {
    setIsUploading(true);
    
    try {
      // Call the original onSend function with progress tracking
      if (onSend && typeof onSend === 'function') {
        await onSend();
      } else {
      }
    } catch (error) {
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadComplete = () => {
    setIsUploading(false);
    setUploadProgress({});
  };

  const handleUploadCancel = () => {
    setIsUploading(false);
    setUploadProgress({});
  };

  if (!files || files.length === 0) return null;

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
        return <ImageIcon className="w-8 h-8 text-blue-500" />;
      case 'video':
        return <Play className="w-8 h-8 text-purple-500" />;
      case 'audio':
        return <Play className="w-8 h-8 text-green-500" />;
      default:
        return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  const renderMediaPreview = (file, index) => {
    switch (file.type) {
      case 'image':
        return (
          <div className="relative">
            <img
              src={file.url}
              alt={file.name}
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              onClick={() => onRemoveFile(index)}
              className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      
      case 'video':
        return (
          <div className="relative">
            <video
              src={file.url}
              className="w-full h-32 object-cover rounded-lg"
              controls={false}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
              <Play className="w-8 h-8 text-white" />
            </div>
            <button
              onClick={() => onRemoveFile(index)}
              className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {getFileIcon(file.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              onClick={() => onRemoveFile(index)}
              className="p-1 text-gray-500 hover:text-red-500 transition-colors"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
    }
  };

  return (
    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Media Preview ({files.length} file{files.length > 1 ? 's' : ''})
        </h4>
        <button
          onClick={() => files.forEach((_, index) => onRemoveFile(index))}
          className="text-xs text-gray-500 hover:text-red-500 transition-colors"
          disabled={disabled}
        >
          Clear all
        </button>
      </div>

      <div className="space-y-3">
        {files.map((file, index) => (
          <div key={index} className="space-y-2">
            {renderMediaPreview(file, index)}
            
            {/* Caption input for each file */}
            <div className="space-y-1">
              <label className="text-xs text-gray-600 dark:text-gray-400">
                Caption (optional)
              </label>
              <textarea
                value={captions[index] || ''}
                onChange={(e) => onCaptionChange(index, e.target.value)}
                placeholder="Add a caption..."
                disabled={disabled}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Send button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSendWithProgress}
          disabled={disabled || isUploading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {isUploading ? 'Sending...' : `Send ${files.length > 1 ? 'Files' : 'File'}`}
        </button>
      </div>

      {/* Upload Progress Modal */}
      {isUploading && (
        <UploadProgress
          files={files}
          onComplete={handleUploadComplete}
          onCancel={handleUploadCancel}
        />
      )}
    </div>
  );
};

export default MediaPreview;
