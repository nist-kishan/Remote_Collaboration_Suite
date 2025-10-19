import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "../ui/Button";
import Container from "../ui/Container";

const DocumentError = ({ 
  message = "Something went wrong", 
  onRetry,
  className = ""
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 ${className}`}>
      <Container>
        <div className="text-center max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {message}
          </p>
          {onRetry && (
            <Button
              onClick={onRetry}
              className="flex items-center gap-2 mx-auto px-6 py-3"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
        </div>
      </Container>
    </div>
  );
};

export default DocumentError;
