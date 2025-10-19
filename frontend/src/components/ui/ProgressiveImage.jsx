import React, { useState, useEffect } from 'react';

const ProgressiveImage = ({ 
  src, 
  placeholderSrc, 
  alt = "Image", 
  className = "",
  maxHeight = "max-h-80",
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(placeholderSrc || src);
  const [imageRef, setImageRef] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
    };
  }, [src]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${maxHeight} transition-all duration-500 ${
        imageSrc === src ? 'opacity-100 blur-0' : 'opacity-70 blur-sm'
      }`}
      {...props}
    />
  );
};

export default ProgressiveImage;
