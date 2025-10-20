import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Mic,
  Smile,
  X
} from 'lucide-react';
import Button from '../ui/Button';
import MediaPreview from './MediaPreview';

const MessageInput = ({ 
  onSendMessage, 
  onTyping, 
  disabled = false,
  replyTo = null,
  onCancelReply,
  autoFocus = false
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [fileCaptions, setFileCaptions] = useState({});
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    if (!isTyping) {
      onTyping(true);
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
      setIsTyping(false);
    }, 1000);
  };

  const handleSend = () => {
    if (message.trim() || replyTo) {
      const messageData = {
        content: message.trim()
      };
      
      // Only include replyTo if it exists and has an _id
      if (replyTo && replyTo._id) {
        messageData.replyTo = replyTo._id;
      }
      
      onSendMessage(messageData);
      setMessage('');
      if (replyTo) {
        onCancelReply();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (type) => {
    fileInputRef.current.setAttribute('accept', getAcceptType(type));
    fileInputRef.current.setAttribute('data-type', type);
    fileInputRef.current.click();
  };

  const getAcceptType = (type) => {
    switch (type) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      case 'audio':
        return 'audio/*';
      default:
        return '*/*';
    }
  };

  // Auto-focus when component mounts or autoFocus prop changes
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      previewFiles.forEach(file => {
        if (file.url) {
          URL.revokeObjectURL(file.url);
        }
      });
    };
  }, [previewFiles]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const type = e.target.getAttribute('data-type');
    
    // Create file URL for preview
    const fileUrl = URL.createObjectURL(file);
    
    // Add file to preview instead of sending immediately
    const newFile = {
      url: fileUrl,
      type,
      name: file.name,
      size: file.size,
      file: file // Keep the actual file object for sending
    };
    
    setPreviewFiles(prev => [...prev, newFile]);

    // Reset input
    e.target.value = '';
  };

  const handleRemovePreviewFile = (index) => {
    const fileToRemove = previewFiles[index];
    // Revoke the object URL to free memory
    if (fileToRemove.url) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
    
    // Remove caption for this file
    setFileCaptions(prev => {
      const newCaptions = { ...prev };
      delete newCaptions[index];
      // Adjust indices for remaining captions
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
  };

  const handleCaptionChange = (index, caption) => {
    setFileCaptions(prev => ({
      ...prev,
      [index]: caption
    }));
  };

  const handleSendMedia = () => {
    if (previewFiles.length === 0) return;

    // Send each file as a separate message or batch them
    previewFiles.forEach((previewFile, index) => {
      const caption = fileCaptions[index] || '';
      
      onSendMessage({
        content: caption,
        type: previewFile.type,
        media: [{
          url: previewFile.url,
          type: previewFile.type,
          name: previewFile.name,
          size: previewFile.size
        }]
      });
    });

    // Clear preview state
    previewFiles.forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    });
    setPreviewFiles([]);
    setFileCaptions({});
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      {/* Media Preview */}
      {previewFiles.length > 0 && (
        <MediaPreview
          files={previewFiles}
          onRemoveFile={handleRemovePreviewFile}
          onSend={handleSendMedia}
          onCaptionChange={handleCaptionChange}
          captions={fileCaptions}
          disabled={disabled}
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
        {/* Attachment Button */}
        <div className="relative">
          <button
            onClick={() => handleFileSelect('image')}
            disabled={disabled}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Video Button */}
        <button
          onClick={() => handleFileSelect('video')}
          disabled={disabled}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send video"
        >
          <Video className="w-5 h-5" />
        </button>

        {/* File Button */}
        <button
          onClick={() => handleFileSelect('file')}
          disabled={disabled}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send file"
        >
          <FileText className="w-5 h-5" />
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={replyTo ? 'Reply to message...' : 'Type a message...'}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !replyTo)}
          className="flex items-center gap-2"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;

