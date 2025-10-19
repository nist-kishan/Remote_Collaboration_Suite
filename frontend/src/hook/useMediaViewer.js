import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useMediaViewer = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openMediaViewer = useCallback((items, index = 0, options = {}) => {
    setMediaItems(items);
    setCurrentIndex(index);
    setIsOpen(true);
  }, []);

  const openMediaInPage = useCallback((chatId, messageId, items, index = 0) => {
    navigate(`/media/${chatId}/${messageId}`, {
      state: {
        mediaItems: items,
        currentIndex: index,
        returnTo: window.location.pathname
      }
    });
  }, [navigate]);

  const closeMediaViewer = useCallback(() => {
    setIsOpen(false);
    setMediaItems([]);
    setCurrentIndex(0);
  }, []);

  const goToNext = useCallback(() => {
    if (currentIndex < mediaItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, mediaItems.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const downloadCurrentMedia = useCallback(() => {
    const currentMedia = mediaItems[currentIndex];
    if (currentMedia?.url) {
      const link = document.createElement('a');
      link.href = currentMedia.url;
      link.download = currentMedia.name || 'media';
      link.click();
    }
  }, [mediaItems, currentIndex]);

  const shareCurrentMedia = useCallback(async () => {
    const currentMedia = mediaItems[currentIndex];
    if (navigator.share && currentMedia?.url) {
      try {
        await navigator.share({
          title: currentMedia.name || 'Media',
          url: currentMedia.url
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(currentMedia?.url || '');
    }
  }, [mediaItems, currentIndex]);

  return {
    isOpen,
    mediaItems,
    currentIndex,
    openMediaViewer,
    openMediaInPage,
    closeMediaViewer,
    goToNext,
    goToPrevious,
    downloadCurrentMedia,
    shareCurrentMedia,
    canGoNext: currentIndex < mediaItems.length - 1,
    canGoPrevious: currentIndex > 0,
    currentMedia: mediaItems[currentIndex] || null
  };
};
