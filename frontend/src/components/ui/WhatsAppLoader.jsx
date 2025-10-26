import React from 'react';

const WhatsAppLoader = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};

export default WhatsAppLoader;
