import { forwardRef } from 'react';

const CustomTextarea = forwardRef(({ 
  className = '', 
  error, 
  ...props 
}, ref) => {
  const baseClasses = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500';
  
  const errorClasses = error 
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500';
  
  const classes = `${baseClasses} ${errorClasses} ${className}`;

  return (
    <div>
      <textarea
        ref={ref}
        className={classes}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

CustomTextarea.displayName = 'CustomTextarea';

export default CustomTextarea;

