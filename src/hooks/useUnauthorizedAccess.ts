import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

interface UnauthorizedAccessOptions {
  resourceType: string;
  resourceId?: string;
  attemptedAction: string;
  redirectTo?: string;
  message?: string;
}

export function useUnauthorizedAccess() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const handleUnauthorizedAccess = ({
    resourceType,
    resourceId,
    attemptedAction,
    redirectTo = '/explore',
    message = 'You do not have permission to access this content.'
  }: UnauthorizedAccessOptions) => {
    // Log unauthorized access attempt for security monitoring
    if (user) {
      console.warn('🚨 UNAUTHORIZED ACCESS ATTEMPT:', {
        userId: user.id,
        userEmail: user.email,
        resourceType,
        resourceId,
        attemptedAction,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });

      // In a production app, you would send this to your security monitoring service
      // Example: sendSecurityAlert({ userId: user.id, ... })
    }

    // Store error message in session storage for display on redirect page
    sessionStorage.setItem('unauthorizedAccessMessage', message);
    
    // Redirect to safe page
    navigate(redirectTo, { replace: true });
  };

  return { handleUnauthorizedAccess };
}