import React from "react";

const CustomInput = function Input({ 
  label,
  error,
  className = "",
  size = "default",
  ...props 
}) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm", 
    lg: "px-4 py-3 text-base",
    default: "px-3 py-2.5 text-sm"
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        className={`
          w-full border rounded-lg bg-gray-50 dark:bg-gray-800 
          text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          transition-colors duration-200
          ${error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default CustomInput;
export { CustomInput };
