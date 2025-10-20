import React from 'react';
import { AlertCircle } from 'lucide-react';

class DocumentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 text-center mb-4">
            {this.state.error?.message || 'An error occurred while loading documents'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              // Use React navigation instead of page reload
              window.history.go(0);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DocumentErrorBoundary;

