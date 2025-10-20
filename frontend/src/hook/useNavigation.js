import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for navigation that replaces window.location.href usage
 * Provides React Router navigation with proper fallbacks
 */
export const useNavigation = () => {
  const navigate = useNavigate();

  const navigateTo = useCallback((path, options = {}) => {
    try {
      navigate(path, options);
    } catch (error) {
      console.warn('Navigation failed, falling back to window.location:', error);
      // Fallback for cases where React Router navigation fails
      window.location.href = path;
    }
  }, [navigate]);

  const navigateToLogin = useCallback(() => {
    navigateTo('/login', { replace: true });
  }, [navigateTo]);

  const navigateToHome = useCallback(() => {
    navigateTo('/', { replace: true });
  }, [navigateTo]);

  const navigateBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const navigateForward = useCallback(() => {
    navigate(1);
  }, [navigate]);

  const replaceCurrent = useCallback((path) => {
    navigate(path, { replace: true });
  }, [navigate]);

  return {
    navigateTo,
    navigateToLogin,
    navigateToHome,
    navigateBack,
    navigateForward,
    replaceCurrent,
    navigate // Expose the raw navigate function for advanced usage
  };
};
