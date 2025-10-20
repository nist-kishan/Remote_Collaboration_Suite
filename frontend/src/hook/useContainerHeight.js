import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for tracking container height with resize handling
 * Replaces direct window resize listeners with React patterns
 */
export const useContainerHeight = () => {
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    
    // Use ResizeObserver for better performance than window resize
    const resizeObserver = new ResizeObserver(updateHeight);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { containerRef, containerHeight };
};
