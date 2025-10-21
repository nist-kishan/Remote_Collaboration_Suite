import React from 'react';
import { X, Image as ImageIcon, Video, FileText, Send } from 'lucide-react';

const MediaPreview = ({ 
  files = [], 
  onRemoveFile,
  onSend,
  onCaptionChange,
  captions = {},
  disabled = false,
  className = '' 
}) => {
  if (!files || files.length === 0) return null;

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (file.type?.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 relative z-10 ${className}`}>
      {/* Files List */}
      <div className="flex flex-wrap gap-2 mb-3">
        {files.map((file, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
          >
            {getFileIcon(file)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getFileSize(file.size)}
              </p>
            </div>
            {onRemoveFile && (
              <button
                onClick={() => onRemoveFile(index)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Caption Input */}
      {files.length > 0 && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Add a caption (optional)"
            value={captions[0] || ''}
            onChange={(e) => onCaptionChange?.(0, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={disabled}
          />
        </div>
      )}

      {/* Send Button */}
      {onSend && (
        <div className="flex justify-end">
          <button
            onClick={onSend}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            Send {files.length} file{files.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaPreview;
