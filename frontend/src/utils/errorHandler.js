export const setupGlobalErrorHandling = () => {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error && typeof error === 'string') {
      if (error.includes('message channel closed') || 
          error.includes('listener indicated an asynchronous response') ||
          error.includes('Extension context invalidated') ||
          error.includes('A listener indicated an asynchronous response') ||
          error.includes('message channel closed before a response was received') ||
          error.includes('NotSupportedError') ||
          error.includes('The element has no supported sources') ||
          error.includes('WebSocket is closed before the connection is established')) {
        event.preventDefault();
        return;
      }
    }
    
    // Also check error objects
    if (error && error.message) {
      const errorMessage = error.message;
      if (errorMessage.includes('message channel closed') || 
          errorMessage.includes('listener indicated an asynchronous response') ||
          errorMessage.includes('Extension context invalidated') ||
          errorMessage.includes('A listener indicated an asynchronous response') ||
          errorMessage.includes('message channel closed before a response was received') ||
          errorMessage.includes('NotSupportedError') ||
          errorMessage.includes('The element has no supported sources') ||
          errorMessage.includes('WebSocket is closed before the connection is established')) {
        event.preventDefault();
        return;
      }
    }
  });


  window.addEventListener('error', (event) => {
    const error = event.error;
    if (error && typeof error === 'string') {
      if (error.includes('message channel closed') || 
          error.includes('listener indicated an asynchronous response') ||
          error.includes('Extension context invalidated') ||
          error.includes('A listener indicated an asynchronous response') ||
          error.includes('message channel closed before a response was received') ||
          error.includes('NotSupportedError') ||
          error.includes('The element has no supported sources')) {
        event.preventDefault();
        return;
      }
    }

    if (error && error.message) {
      const errorMessage = error.message;
      if (errorMessage.includes('message channel closed') || 
          errorMessage.includes('listener indicated an asynchronous response') ||
          errorMessage.includes('Extension context invalidated') ||
          errorMessage.includes('A listener indicated an asynchronous response') ||
          errorMessage.includes('message channel closed before a response was received') ||
          errorMessage.includes('NotSupportedError') ||
          errorMessage.includes('The element has no supported sources') ||
          errorMessage.includes('WebSocket is closed before the connection is established')) {
        event.preventDefault();
        return;
      }
    }
    
    // Log other errors for debugging
  });

  // Handle console errors from extensions
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Filter out extension-related errors
    if (message.includes('message channel closed') || 
        message.includes('listener indicated an asynchronous response') ||
        message.includes('Extension context invalidated') ||
        message.includes('chrome-extension://') ||
        message.includes('moz-extension://') ||
        message.includes('A listener indicated an asynchronous response') ||
        message.includes('message channel closed before a response was received') ||
        message.includes('NotSupportedError') ||
        message.includes('The element has no supported sources') ||
        message.includes('WebSocket is closed before the connection is established')) {
      return;
    }
    
    // Log legitimate errors
    originalConsoleError.apply(console, args);
  };
};

// Function to check if the error is from a browser extension
export const isExtensionError = (error) => {
  if (!error) return false;
  
  const errorString = typeof error === 'string' ? error : error.toString();
  
  return errorString.includes('message channel closed') ||
         errorString.includes('listener indicated an asynchronous response') ||
         errorString.includes('Extension context invalidated') ||
         errorString.includes('chrome-extension://') ||
         errorString.includes('moz-extension://') ||
         errorString.includes('A listener indicated an asynchronous response') ||
         errorString.includes('message channel closed before a response was received') ||
         errorString.includes('NotSupportedError') ||
         errorString.includes('The element has no supported sources') ||
         errorString.includes('WebSocket is closed before the connection is established');
};

// Function to safely handle async operations
export const safeAsync = async (asyncFunction, fallback = null) => {
  try {
    return await asyncFunction();
  } catch (error) {
    if (isExtensionError(error)) {
      return fallback;
    }
    throw error;
  }
};

// Function to create a safe promise wrapper
export const createSafePromise = (promise, fallback = null) => {
  return promise.catch(error => {
    if (isExtensionError(error)) {
      return fallback;
    }
    throw error;
  });
};
