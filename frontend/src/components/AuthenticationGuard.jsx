import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!loading && !isAuthenticated && !user) {
      navigate('/login');
    }
  }, [isAuthenticated, user, loading, navigate]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return children;
};

export default AuthGuard;
