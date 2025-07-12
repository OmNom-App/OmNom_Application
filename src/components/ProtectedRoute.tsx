import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If route requires auth but user is not authenticated
  if (requireAuth && !user) {
    // Store the intended destination
    const redirectTo = location.pathname + location.search;
    
    // Redirect to login with the intended destination
    return (
      <Navigate 
        to="/login" 
        state={{ from: redirectTo }} 
        replace 
      />
    );
  }

  // If user is authenticated but trying to access auth pages
  if (!requireAuth && user && (location.pathname === '/login' || location.pathname === '/signup')) {
    return <Navigate to="/explore" replace />;
  }

  return <>{children}</>;
}