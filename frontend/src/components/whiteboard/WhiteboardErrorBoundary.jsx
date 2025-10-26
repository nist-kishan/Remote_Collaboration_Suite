import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import CustomButton from '../ui/CustomButton';
import CustomCard from '../ui/CustomCard';

const WhiteboardErrorBoundary = ({ 
  children, 
  fallback = null,
  onRetry = null,
  className = '' 
}) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (errorEvent) => {
      setHasError(true);
      setError(errorEvent.error);
    };

    const handleUnhandledRejection = (event) => {
      setHasError(true);
      setError(event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleRetry = () => {
    setHasError(false);
    setError(null);
    if (onRetry) {
      onRetry();
    }
  };

  if (hasError) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center ${className}`}>
        <CustomCard className="p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            {error?.message || 'An unexpected error occurred while loading whiteboards.'}
          </p>
          <CustomButton onClick={handleRetry} variant="primary" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </CustomButton>
        </CustomCard>
      </div>
    );
  }

  return children;
};

export default WhiteboardErrorBoundary;
