import React from "react";

export default function Container({ 
  children, 
  className = "", 
  size = "default",
  ...props 
}) {
  const sizeClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl", 
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    default: "max-w-6xl"
  };

  return (
    <div 
      className={`mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
