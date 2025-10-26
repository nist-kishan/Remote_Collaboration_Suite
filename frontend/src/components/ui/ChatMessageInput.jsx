import React, { useState, useRef, useEffect, forwardRef } from "react";
import {
  Send,
  Image as ImageIcon,
  FileText,
  Mic,
  Smile,
  X,
  MoreVertical,
} from "lucide-react";
import EmojiPicker from "./EmojiSelector";
import MediaPreview from "../chat/MediaPreview";
import WhatsAppLoader from "./WhatsAppLoader";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const MessageInput = forwardRef(
  (
    {
      onSendMessage,
      onTyping,
      disabled = false,
      replyTo = null,
      onCancelReply,
      autoFocus = false,
      placeholder = "Type a message...",
      chatId,
      className = "",
    },
    ref
  ) => {
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMediaMenu, setShowMediaMenu] = useState(false);
    const [previewFiles, setPreviewFiles] = useState([]);
    const [fileCaptions, setFileCaptions] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentUploadFile, setCurrentUploadFile] = useState(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const queryClient = useQueryClient();

    const handleInputChange = (e) => {
      setMessage(e.target.value);

      if (!isTyping) {
        onTyping?.(true);
        setIsTyping(true);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        onTyping?.(false);
        setIsTyping(false);
      }, 1000);
    };

    const handleSend = () => {
      if (message.trim() || replyTo) {
        const messageData = {
          content: message.trim(),
        };

        if (replyTo && replyTo._id) {
          messageData.replyTo = replyTo._id;
        }

        onSendMessage?.(messageData);
        setMessage("");
        if (replyTo) {
          onCancelReply?.();
        }
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleFileSelect = (type) => {
      if (!fileInputRef.current) {
        console.error("fileInputRef.current is null");
        return;
      }
      fileInputRef.current.setAttribute("data-type", type);
    };

    useEffect(() => {
      if (autoFocus && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [autoFocus]);

    useEffect(() => {
      return () => {
        previewFiles.forEach((file) => {
          if (file.url) {
            URL.revokeObjectURL(file.url);
          }
        });
      };
    }, [previewFiles]);

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        return;
      }

      const type = e.target.getAttribute("data-type");
      const fileUrl = URL.createObjectURL(file);

      const newFile = {
        url: fileUrl,
        type,
        name: file.name,
        size: file.size,
        file: file,
      };

      setPreviewFiles((prev) => {
        const updated = [...prev, newFile];
        return updated;
      });

      e.target.value = "";
    };

    const handleEmojiSelect = (emoji) => {
      setMessage((prev) => prev + emoji);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    };

    const handleRemovePreviewFile = (index) => {
      const fileToRemove = previewFiles[index];
      if (fileToRemove.url) {
        URL.revokeObjectURL(fileToRemove.url);
      }

      setPreviewFiles((prev) => prev.filter((_, i) => i !== index));

      setFileCaptions((prev) => {
        const newCaptions = { ...prev };
        delete newCaptions[index];
        const adjustedCaptions = {};
        Object.keys(newCaptions).forEach((key) => {
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
      setFileCaptions((prev) => ({
        ...prev,
        [index]: caption,
      }));
    };

    const handleSendMedia = async () => {
      if (previewFiles.length === 0) return;

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const { uploadFile } = await import("../../api/chatApi");

        if (!chatId) {
          console.error("Chat ID is required for file upload");
          toast.error(
            "Chat ID is missing. Please refresh the page and try again."
          );
          setIsUploading(false);
          return;
        }

        for (let i = 0; i < previewFiles.length; i++) {
          const previewFile = previewFiles[i];
          const caption = fileCaptions[i] || "";

          setCurrentUploadFile(previewFile);
          setUploadProgress(0);

          try {
            const response = await uploadFile(
              chatId,
              previewFile.file,
              previewFile.type,
              (progress) => {
                const overallProgress =
                  (i / previewFiles.length) * 100 +
                  progress / previewFiles.length;
                setUploadProgress(overallProgress);
              }
            );

            if (response?.data?.message && chatId) {
              queryClient.invalidateQueries(["messages", chatId]);
              queryClient.invalidateQueries(["chats"]);
            }

            if (caption.trim()) {
              onSendMessage?.({
                content: caption.trim(),
                replyTo: replyTo?._id,
              });
            }
          } catch (fileError) {
            console.error(
              `Error uploading file ${previewFile.name}:`,
              fileError
            );
          }
        }

        setUploadProgress(100);

        previewFiles.forEach((file) => {
          if (file.url) {
            URL.revokeObjectURL(file.url);
          }
        });
        setPreviewFiles([]);
        setFileCaptions({});

        setTimeout(() => {
          setIsUploading(false);
          setCurrentUploadFile(null);
          setUploadProgress(0);
        }, 1000);
      } catch (error) {
        console.error("Error uploading files:", error);
        setIsUploading(false);
        setCurrentUploadFile(null);
        setUploadProgress(0);
        toast.error("Failed to upload files. Please try again.");
      }
    };

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (showMediaMenu && !event.target.closest(".media-menu-container")) {
          setShowMediaMenu(false);
        }
      };

      if (showMediaMenu) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [showMediaMenu]);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          showEmojiPicker &&
          !event.target.closest(".emoji-picker-container")
        ) {
          setShowEmojiPicker(false);
        }
      };

      if (showEmojiPicker) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [showEmojiPicker]);

    return (
      <div className={`bg-white dark:bg-gray-900 min-h-[60px] ${className}`}>
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

        {replyTo && (
          <div className="mb-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                Replying to {replyTo.sender?.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {replyTo.content?.substring(0, 50)}
                {replyTo.content?.length > 50 && "..."}
              </p>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded flex-shrink-0"
            >
              <X className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 md:gap-2 p-2 md:p-4 min-h-[60px] overflow-hidden">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="relative flex-shrink-0 emoji-picker-container">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className={`h-10 md:h-12 px-2 md:px-3 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 rounded-xl transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg backdrop-blur-sm flex items-center justify-center ${
                showEmojiPicker
                  ? "text-indigo-600 dark:text-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-md scale-105"
                  : ""
              }`}
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            <EmojiPicker
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onEmojiSelect={handleEmojiSelect}
            />
          </div>

          <div className="relative media-menu-container flex-shrink-0">
            <button
              onClick={() => {
              }}
              disabled={disabled}
              className={`h-10 md:h-12 px-2 md:px-3 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 rounded-xl transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg backdrop-blur-sm flex items-center justify-center ${
                showMediaMenu
                  ? "text-indigo-600 dark:text-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-md scale-105"
                  : ""
              }`}
              title="Send media files"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Media Menu Dropdown */}
            {showMediaMenu && (
              <div className="absolute bottom-full left-0 mb-3 w-52 bg-white/95 dark:bg-gray-800/95 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl backdrop-blur-xl z-50 animate-in slide-in-from-bottom-2 duration-300">
                <div className="py-2">
                  <button
                    onClick={() => {
                      // handleFileSelect('image');
                      setShowMediaMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-all duration-200 ease-in-out hover:scale-[1.02] rounded-xl mx-2"
                  >
                    <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg">
                      <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium">Send Image</span>
                  </button>
                  <button
                    onClick={() => {
                      handleFileSelect("audio");
                      setShowMediaMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-all duration-200 ease-in-out hover:scale-[1.02] rounded-xl mx-2"
                  >
                    <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg">
                      <Mic className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="font-medium">Send Audio</span>
                  </button>
                  <button
                    onClick={() => {
                      handleFileSelect("file");
                      setShowMediaMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-all duration-200 ease-in-out hover:scale-[1.02] rounded-xl mx-2"
                  >
                    <div className="p-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg">
                      <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="font-medium">Send File</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Message Input with Integrated Buttons */}
          <div className="flex-1 min-w-0 relative">
            <div className="relative group">
              <textarea
                ref={ref || textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={replyTo ? "Reply to message..." : placeholder}
                disabled={disabled}
                rows={1}
                className="w-full px-4 pr-12 md:pr-16 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base transition-all duration-300 ease-in-out shadow-sm hover:shadow-md focus:shadow-lg backdrop-blur-sm"
                style={{
                  minHeight: "48px",
                  maxHeight: "120px",
                  lineHeight: "1.4",
                }}
              />

              {/* Fancy Border Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-sm"></div>
            </div>

            {/* Right Side Send Button (Inside Input) */}
            <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2">
              <button
                onClick={handleSend}
                disabled={disabled || (!message.trim() && !replyTo)}
                className="p-1.5 md:p-2.5 text-gray-500 dark:text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 dark:hover:from-indigo-600 dark:hover:to-purple-700 rounded-xl transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 hover:shadow-lg backdrop-blur-sm disabled:hover:scale-100 disabled:hover:shadow-none"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp-style Upload Loader */}
        <WhatsAppLoader
          isVisible={isUploading}
          progress={uploadProgress}
          fileName={currentUploadFile?.name}
          fileSize={currentUploadFile?.size}
          onCancel={() => {
            setIsUploading(false);
            setCurrentUploadFile(null);
            setUploadProgress(0);
          }}
        />
      </div>
    );
  }
);

MessageInput.displayName = "MessageInput";

export default MessageInput;
