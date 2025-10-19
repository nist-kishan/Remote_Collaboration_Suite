import React from "react";
import { FileText, Loader2 } from "lucide-react";
import Container from "../ui/Container";

const DocumentLoading = ({ message = "Loading document..." }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <Container>
        <div className="text-center">
          <div className="relative mx-auto w-24 h-24 mb-6">
            {/* Outer pulsing circle */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 animate-pulse"></div>
            
            {/* Document icon with spinner */}
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-white dark:bg-gray-800 shadow-lg">
              <FileText className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
              <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin absolute -bottom-2 -right-2" />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {message}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please wait while we load your document...
          </p>
        </div>
      </Container>
    </div>
  );
};

export default DocumentLoading;
