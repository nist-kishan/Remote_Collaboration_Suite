import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MediaViewer from '../components/media/MediaViewer';
import { useQuery } from '@tanstack/react-query';

const MediaViewerPage = () => {
  const { chatId, messageId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [mediaItems, setMediaItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get media items from location state or fetch from API
  useEffect(() => {
    if (location.state?.mediaItems) {
      setMediaItems(location.state.mediaItems);
      setCurrentIndex(location.state.currentIndex || 0);
    } else if (chatId && messageId) {
      // Fetch specific message and its media
      fetchMessageMedia();
    } else if (chatId) {
      // Fetch all media from chat
      fetchChatMedia();
    }
  }, [chatId, messageId, location.state]);

  const fetchMessageMedia = async () => {
    try {
      const { getChatMessages } = await import('../api/chatApi');
      const response = await getChatMessages(chatId, { messageId });
      const message = response.data?.data?.messages?.[0];
      
      if (message?.media) {
        setMediaItems(message.media);
      }
    } catch (error) {
      console.error('Error fetching message media:', error);
    }
  };

  const fetchChatMedia = async () => {
    try {
      const { getChatMessages } = await import('../api/chatApi');
      const response = await getChatMessages(chatId, { 
        limit: 100,
        type: { $in: ['image', 'video'] }
      });
      
      const messages = response.data?.data?.messages || [];
      const allMedia = [];
      
      messages.forEach(message => {
        if (message.media) {
          message.media.forEach(mediaItem => {
            allMedia.push({
              ...mediaItem,
              messageId: message._id,
              sender: message.sender,
              timestamp: message.createdAt
            });
          });
        }
      });
      
      setMediaItems(allMedia);
    } catch (error) {
      console.error('Error fetching chat media:', error);
    }
  };

  const handleClose = () => {
    // Go back to previous page or chat
    if (location.state?.returnTo) {
      navigate(location.state.returnTo);
    } else {
      navigate(-1);
    }
  };

  const handleIndexChange = (newIndex) => {
    setCurrentIndex(newIndex);
    
    // Update URL to reflect current media
    if (mediaItems[newIndex]) {
      const newUrl = `/media/${chatId}/${mediaItems[newIndex].messageId}`;
      window.history.replaceState(null, '', newUrl);
    }
  };

  if (mediaItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Media Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No media files found in this chat.
          </p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <MediaViewer
      isOpen={true}
      mediaItems={mediaItems}
      currentIndex={currentIndex}
      onClose={handleClose}
      onIndexChange={handleIndexChange}
    />
  );
};

export default MediaViewerPage;
