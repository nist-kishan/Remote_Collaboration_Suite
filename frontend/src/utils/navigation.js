// Global navigation utility for non-React contexts
let navigateFunction = null;

export const setNavigateFunction = (navigate) => {
  navigateFunction = navigate;
};

export const navigateTo = (path, options = {}) => {
  if (navigateFunction) {
    navigateFunction(path, options);
  } else {
    console.warn('Navigation function not set. Please ensure React Router is properly initialized.');
    
    if (path.startsWith('http') || path.startsWith('//')) {
      window.location.href = path;
    } else {
      // For internal routes, try to use history API
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState(null, '', path);
        // Dispatch a popstate event to trigger React Router
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        window.location.href = path;
      }
    }
  }
};

export const navigateToLogin = () => {
  navigateTo('/login', { replace: true });
};

export const navigateToHome = () => {
  navigateTo('/', { replace: true });
};
