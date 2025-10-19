import React from "react";
import Input from "../ui/Input";

const DocumentTitleBar = ({ 
  title, 
  onTitleChange, 
  placeholder = "Untitled document",
  className = "",
  canEdit = true
}) => {
  return (
    <div className={`bg-white dark:bg-gray-900 transition-colors duration-200 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
        <div className="relative">
          {canEdit ? (
            <Input
              placeholder={placeholder}
              value={title}
              onChange={onTitleChange}
              className="text-xl sm:text-2xl lg:text-3xl font-normal border-none p-0 focus:ring-0 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 w-full leading-tight transition-colors duration-200"
            />
          ) : (
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-normal text-gray-900 dark:text-gray-100 w-full leading-tight transition-colors duration-200">
              {title || placeholder}
            </h1>
          )}
          {canEdit && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 opacity-0 focus-within:opacity-100 transition-opacity duration-200"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentTitleBar;
