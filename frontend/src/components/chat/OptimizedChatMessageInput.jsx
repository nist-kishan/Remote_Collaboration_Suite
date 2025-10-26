import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Mic,
  Smile,
  X,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import MediaPreview from './MediaPreview';
import { 
  optimizeFiles, 
  validateFile, 
  formatFileSize,
  UploadProgressTracker 
} from '../../utils/mediaOptimizer';
import { 
  createOptimizedMessageSender,
  validateMessage 
} from '../../utils/messageOptimizer';

const OptimizedChatMessageInput = ({ 
  onSendMessage, 
  onTyping, 
  disabled = false,
  replyTo = null,
  onCancelReply,
  autoFocus = false,
  chatId
}) => {
  const [message, setMessage] = useState('');
  const [previewFiles, setPreviewFiles] = useState([]);
  const [fileCaptions, setFileCaptions] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [sendStatus, setSendStatus] = useState({});
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const uploadTrackerRef = useRef(new UploadProgressTracker());
  const messageSenderRef = useRef(createOptimizedMessageSender());

  // Handle input change with optimized typing
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Optimized typing detection
    messageSenderRef.current.typingOptimizer.startTyping((isTyping) => {
      onTyping(isTyping);
    });
  }, [onTyping]);

  // Optimized send function
  const handleSend = useCallback(async () => {
    if (!message.trim() && !replyTo && previewFiles.length === 0) return;

    const startTime = Date.now();
    
    try {
      // Validate message
      const messageData = {
        content: message.trim(),
        replyTo: replyTo?._id || null,
        type: previewFiles.length > 0 ? 'media' : 'text'
      };

      const validation = validateMessage(messageData);
      if (!validation.valid) {
        return;
      }

      // Optimize and send message
      await messageSenderRef.current.messageOptimizer.sendMessage(
        messageData,
        onSendMessage
      );

      // Clear state
      setMessage('');
      if (replyTo) {
        onCancelReply();
      }
      
      // Clear preview files
      previewFiles.forEach(file => {
        if (file.url) {
          URL.revokeObjectURL(file.url);
        }
      });
      setPreviewFiles([]);
      setFileCaptions({});

    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [message, replyTo, previewFiles, onSendMessage, onCancelReply]);

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Optimized file handling
  const handleFileSelect = useCallback(async (type) => {
    fileInputRef.current.setAttribute('accept', getAcceptType(type));
    fileInputRef.current.setAttribute('data-type', type);
    fileInputRef.current.click();
  }, []);

  // File change handler with optimization
  const handleFileChange = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const type = e.target.getAttribute('data-type');
    setIsOptimizing(true);

    try {
      // Validate files
      files.forEach(file => {
        validateFile(file, type);
      });

      // Optimize files
      const optimizedFiles = await optimizeFiles(files, {
        maxImageSize: 1920,
        quality: 0.8,
        maxFileSize: type === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024
      });

      // Create preview objects
      const newPreviewFiles = optimizedFiles.map(optimizedFile => ({
        ...optimizedFile,
        originalFile: files.find(f => f.name === optimizedFile.name),
        optimized: true,
        compressionRatio: optimizedFile.compressionRatio
      }));

      setPreviewFiles(prev => [...prev, ...newPreviewFiles]);

    } catch (error) {
      toast.error(`File error: ${error.message}`);
    } finally {
      setIsOptimizing(false);
      e.target.value = '';
    }
  }, []);

  // Remove preview file
  const handleRemovePreviewFile = useCallback((index) => {
    const fileToRemove = previewFiles[index];
    if (fileToRemove.url) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
    
    // Remove caption
    setFileCaptions(prev => {
      const newCaptions = { ...prev };
      delete newCaptions[index];
      
      // Adjust indices
      const adjustedCaptions = {};
      Object.keys(newCaptions).forEach(key => {
        const keyNum = parseInt(key);
        if (keyNum > index) {
          adjustedCaptions[keyNum - 1] = newCaptions[key];
        } else {
          adjustedCaptions[key] = newCaptions[key];
        }
      });
      return adjustedCaptions;
    });
  }, [previewFiles]);

  // Caption change handler
  const handleCaptionChange = useCallback((index, caption) => {
    setFileCaptions(prev => ({
      ...prev,
      [index]: caption
    }));
  }, []);

  // Optimized media send
  const handleSendMedia = useCallback(async () => {
    if (previewFiles.length === 0) return;

    setIsUploading(true);
    const startTime = Date.now();

    try {
      // Send files in parallel
      const sendPromises = previewFiles.map(async (previewFile, index) => {
        const caption = fileCaptions[index] || '';
        
        // Update upload progress
        uploadTrackerRef.current.setProgress(index, 0);
        
        const messageData = {
          content: caption,
          type: previewFile.type,
          media: [{
            url: previewFile.url,
            type: previewFile.type,
            name: previewFile.name,
            size: previewFile.size,
            optimized: previewFile.optimized,
            compressionRatio: previewFile.compressionRatio
          }]
        };

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          uploadTrackerRef.current.setProgress(index, progress);
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        await messageSenderRef.current.messageOptimizer.sendMessage(
          messageData,
          onSendMessage
        );

        uploadTrackerRef.current.setProgress(index, 100);
      });

      await Promise.all(sendPromises);

      // Clear state
      previewFiles.forEach(file => {
        if (file.url) {
          URL.revokeObjectURL(file.url);
        }
      });
      setPreviewFiles([]);
      setFileCaptions({});
      uploadTrackerRef.current.clear();

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsUploading(false);
    }
  }, [previewFiles, fileCaptions, onSendMessage]);

  // Get accept type
  const getAcceptType = (type) => {
    switch (type) {
      case 'image':
        return 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
      case 'video':
        return 'video/mp4,video/webm,video/ogg';
      case 'audio':
        return 'audio/mp3,audio/wav,audio/ogg,audio/m4a';
      default:
        return '*/*';
    }
  };

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      previewFiles.forEach(file => {
        if (file.url) {
          URL.revokeObjectURL(file.url);
        }
      });
      messageSenderRef.current.clear();
    };
  }, [previewFiles]);

  // Upload progress effect
  useEffect(() => {
    const unsubscribe = uploadTrackerRef.current.addListener((progress) => {
      setUploadProgress(new Map(progress));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 relative z-20">
      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-600 dark:text-blue-400">
              Uploading {previewFiles.length} file{previewFiles.length > 1 ? 's' : ''}...
            </span>
          </div>
          {Array.from(uploadProgress.entries()).map(([index, progress]) => (
            <div key={index} className="mb-1">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{previewFiles[index]?.name}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Preview */}
      {previewFiles.length > 0 && (
        <MediaPreview
          files={previewFiles}
          onRemoveFile={handleRemovePreviewFile}
          onSend={handleSendMedia}
          onCaptionChange={handleCaptionChange}
          captions={fileCaptions}
          disabled={disabled || isUploading}
        />
      )}

      {/* Reply Preview */}
      {replyTo && (
        <div className="mb-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
              Replying to {replyTo.sender.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {replyTo.content?.substring(0, 50)}
              {replyTo.content?.length > 50 && '...'}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded"
          >
            <X className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment Buttons */}
        <div className="flex gap-1">
          <button
            onClick={() => handleFileSelect('image')}
            disabled={disabled || isOptimizing}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handleFileSelect('video')}
            disabled={disabled || isOptimizing}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send video"
          >
            <Video className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handleFileSelect('file')}
            disabled={disabled || isOptimizing}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send file"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          multiple
        />

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={replyTo ? 'Reply to message...' : 'Type a message...'}
            disabled={disabled || isOptimizing}
            rows={1}
            className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !replyTo && previewFiles.length === 0) || isOptimizing || isUploading}
          className="flex items-center gap-2"
        >
          {isOptimizing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Optimization Status */}
      {isOptimizing && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Optimizing files for faster upload...</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedChatMessageInput;
