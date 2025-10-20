import { useState, useEffect } from 'react';

/**
 * Custom hook for tracking window size with ResizeObserver for better performance
 * Replaces direct window.innerWidth/innerHeight usage with React patterns
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Use ResizeObserver for better performance if available
    if (typeof window !== 'undefined' && window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      
      // Observe the document body for window size changes
      resizeObserver.observe(document.body);
      
      return () => {
        resizeObserver.disconnect();
      };
    } else {
      // Fallback to window resize listener for older browsers
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);

  return windowSize;
};
