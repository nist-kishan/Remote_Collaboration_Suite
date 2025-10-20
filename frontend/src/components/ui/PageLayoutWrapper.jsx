import React from "react";
import CustomContainer from "./CustomContainer";

export default function PageLayout({ 
  children, 
  title,
  subtitle,
  className = "",
  containerSize = "default",
  ...props 
}) {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${className}`} {...props}>
      <CustomContainer size={containerSize}>
        <div className="py-6 sm:py-8 lg:py-12">
          {(title || subtitle) && (
            <div className="mb-6 sm:mb-8 lg:mb-10 text-center">
              {title && (
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </CustomContainer>
    </div>
  );
}
