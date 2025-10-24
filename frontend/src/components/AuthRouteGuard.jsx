import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ApplicationLoadingSpinner from './ui/ApplicationLoadingSpinner';

const AuthRouteGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(location.pathname) || 
                       location.pathname.startsWith('/reset-password/');

  useEffect(() => {
    // Only run auth logic when not loading and we have determined auth status
    if (!loading) {
      if (isAuthenticated && user) {
        // User is logged in
        if (isPublicRoute && !location.pathname.startsWith('/reset-password/')) {
          // If logged in and trying to access public routes (except reset password), redirect to dashboard
          navigate('/', { replace: true });
        }
      } else {
        // User is not logged in
        if (!isPublicRoute) {
          // If not logged in and trying to access protected routes, redirect to login
          navigate('/login', { replace: true });
        }
      }
    }
  }, [isAuthenticated, user, loading, isPublicRoute, navigate, location.pathname]);

  // Show loading while authentication is being checked (but not on reset password pages)
  if (loading && !location.pathname.startsWith('/reset-password/')) {
    return <ApplicationLoadingSpinner message="Checking authentication..." />;
  }

  // If user is authenticated and on public route (except reset password), show loading while redirecting
  if (isAuthenticated && user && isPublicRoute && !location.pathname.startsWith('/reset-password/')) {
    return <ApplicationLoadingSpinner message="Redirecting to dashboard..." />;
  }

  // If user is not authenticated and on protected route, show loading while redirecting
  if (!isAuthenticated && !isPublicRoute) {
    return <ApplicationLoadingSpinner message="Redirecting to login..." />;
  }

  // Render children for valid routes
  return children;
};

export default AuthRouteGuard;
