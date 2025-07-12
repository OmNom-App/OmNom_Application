import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

export function useAuthRedirect() {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // If user just logged in and there's a stored destination
    if (user && location.state?.from) {
      const destination = location.state.from;
      console.log('🔄 Redirecting to intended destination:', destination);
      navigate(destination, { replace: true });
      return;
    }

    // If user just logged in without a stored destination
    if (user && (location.pathname === '/login' || location.pathname === '/signup')) {
      console.log('🔄 User authenticated, redirecting to explore');
      navigate('/explore', { replace: true });
      return;
    }
  }, [user, loading, location, navigate]);
}