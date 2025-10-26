import React from 'react';

const Skeleton = ({ className = '', ...props }) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      {...props}
    />
  );
};

export const SkeletonMessageList = ({ className = '' }) => {
  return (
    <div className={`space-y-4 p-4 ${className}`}>
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-start space-x-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
