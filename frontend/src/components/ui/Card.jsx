import React from "react";

export default function Card({ 
  children, 
  className = "", 
  variant = "default",
  padding = "default",
  ...props 
}) {
  const variantClasses = {
    default: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
    glass: "bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/30 dark:border-gray-800",
    elevated: "bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
  };

  const paddingClasses = {
    sm: "p-4",
    md: "p-6", 
    lg: "p-8",
    default: "p-6"
  };

  return (
    <div 
      className={`rounded-xl ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
