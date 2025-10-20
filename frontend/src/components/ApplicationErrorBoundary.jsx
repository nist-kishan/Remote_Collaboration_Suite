import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { LOGGING_CONFIG, FEATURE_FLAGS } from '../config/environment';
import { navigateToHome } from '../utils/navigation';
import { useCurrentPath } from '../hook/useCurrentPath';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log error for debugging
    if (LOGGING_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.error('🚨 Error Boundary caught an error:', {
        errorId,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }

    // Report error to external service in production
    if (FEATURE_FLAGS.ENABLE_ERROR_REPORTING && import.meta.env.PROD) {
      this.reportError(error, errorInfo, errorId);
    }
  }

  reportError = async (error, errorInfo, errorId) => {
    try {
      // You can integrate with services like Sentry, LogRocket, etc.
      const errorData = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: this.props.pathname || window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };

      // Send to your error reporting endpoint
      await fetch('/api/v1/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    navigateToHome();
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const { errorId, error } = this.state;

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>

            {errorId && (
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Error ID: <code className="font-mono text-xs">{errorId}</code>
                </p>
              </div>
            )}

            {import.meta.env.DEV && error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md text-left">
                <p className="text-sm text-red-800 dark:text-red-200 font-mono">
                  {error.message}
                </p>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-red-700 dark:text-red-300 mt-1 whitespace-pre-wrap overflow-auto">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Home className="h-4 w-4" />
                Go Home
              </button>
            </div>

            <button
              onClick={this.handleReload}
              className="mt-3 w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Or reload the page
            </button>

            {import.meta.env.PROD && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  If this problem persists, please contact support with the Error ID above.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component that provides pathname via hook
const ErrorBoundaryWrapper = (props) => {
  const pathname = useCurrentPath();
  return <ErrorBoundary {...props} pathname={pathname} />;
};

export default ErrorBoundaryWrapper;
