import React from 'react';

const Skeleton = ({ 
  className = '', 
  variant = 'default',
  width,
  height,
  rounded = 'md',
  animate = true,
  ...props 
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  const animateClasses = animate ? 'animate-pulse' : '';
  
  const variantClasses = {
    default: '',
    text: 'h-4',
    title: 'h-6',
    avatar: 'rounded-full',
    button: 'h-10',
    card: 'h-32',
    line: 'h-1',
    circle: 'rounded-full',
    rectangle: 'rounded-md'
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  };

  const style = {
    ...(width && { width }),
    ...(height && { height })
  };

  return (
    <div
      className={`
        ${baseClasses}
        ${animateClasses}
        ${variantClasses[variant] || ''}
        ${roundedClasses[rounded] || roundedClasses.md}
        ${className}
      `.trim()}
      style={style}
      {...props}
    />
  );
};

// Pre-built skeleton components
export const SkeletonText = ({ lines = 1, className = '', ...props }) => {
  if (lines === 1) {
    return <Skeleton variant="text" className={`w-full ${className}`} {...props} />;
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          className={`w-full ${index === lines - 1 ? 'w-3/4' : ''}`}
          {...props}
        />
      ))}
    </div>
  );
};

export const SkeletonAvatar = ({ size = 'md', className = '', ...props }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  return (
    <Skeleton
      variant="avatar"
      className={`${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
};

export const SkeletonButton = ({ className = '', ...props }) => (
  <Skeleton
    variant="button"
    className={`w-24 ${className}`}
    {...props}
  />
);

export const SkeletonCard = ({ className = '', ...props }) => (
  <Skeleton
    variant="card"
    className={`w-full ${className}`}
    {...props}
  />
);

export const SkeletonMessage = ({ isOwn = false, className = '', ...props }) => (
  <div className={`flex gap-2 mb-2 ${isOwn ? 'justify-end' : 'justify-start'} ${className}`}>
    {!isOwn && (
      <SkeletonAvatar size="sm" className="flex-shrink-0" />
    )}
    <div className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
      <Skeleton
        className={`h-8 ${
          isOwn 
            ? 'w-32 bg-indigo-200 dark:bg-indigo-800' 
            : 'w-40 bg-gray-200 dark:bg-gray-700'
        } rounded-2xl`}
        {...props}
      />
      <Skeleton
        variant="text"
        className={`w-16 h-3 ${isOwn ? 'ml-auto' : ''}`}
        {...props}
      />
    </div>
  </div>
);

export const SkeletonChatItem = ({ className = '', ...props }) => (
  <div className={`flex items-center gap-3 p-4 ${className}`}>
    <SkeletonAvatar size="lg" className="flex-shrink-0" />
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-12 h-3" />
      </div>
      <Skeleton className="w-full h-3" />
      <Skeleton className="w-3/4 h-3" />
    </div>
  </div>
);

export const SkeletonMessageList = ({ count = 5, className = '', ...props }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonMessage
        key={index}
        isOwn={index % 3 === 0} // Mix of own and other messages
        {...props}
      />
    ))}
  </div>
);

export const SkeletonChatList = ({ count = 8, className = '', ...props }) => (
  <div className={`space-y-1 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonChatItem key={index} {...props} />
    ))}
  </div>
);

export default Skeleton;
