import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, refreshSession, forceSessionRecovery } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes - MUST be non-blocking to prevent deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, 'User:', session?.user?.email);
        
        // Set state immediately (non-blocking)
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle sign in - create/update profile (non-blocking)
        if (event === 'SIGNED_IN' && session?.user) {
          // Use setTimeout to make it non-blocking
          setTimeout(() => {
            supabase.from('profiles').upsert({
              id: session.user.id,
              display_name: session.user.user_metadata?.full_name || 
                           session.user.email?.split('@')[0] || 'Chef',
            }).then(({ error }) => {
              if (error) {
                console.error('Error updating profile:', error);
              }
            });
          }, 0);
        }
      }
    );

    // Handle tab visibility changes - refresh session when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab became visible, refreshing session...');
        
        // Make it non-blocking to prevent deadlocks
        setTimeout(async () => {
          try {
            // Only refresh if we don't already have a valid session
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            
            if (!currentSession || !currentSession.user) {
              console.log('No valid session found, attempting refresh...');
              
              // Try to refresh the session first
              const refreshedSession = await refreshSession();
              
              if (refreshedSession) {
                console.log('Session refreshed successfully');
                setSession(refreshedSession);
                setUser(refreshedSession.user);
              } else {
                // If refresh fails, try force recovery
                console.log('Session refresh failed, trying force recovery...');
                const recoveredSession = await forceSessionRecovery();
                
                if (recoveredSession) {
                  console.log('Session recovered successfully');
                  setSession(recoveredSession);
                  setUser(recoveredSession.user);
                } else {
                  console.log('No session found on tab visibility change');
                  setSession(null);
                  setUser(null);
                }
              }
            } else {
              console.log('Valid session already exists, no refresh needed');
            }
          } catch (error) {
            console.error('Error refreshing session on visibility change:', error);
          }
        }, 0);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic session check to handle stuck states
    const sessionCheckInterval = setInterval(() => {
      if (!document.hidden) {
        // Make it non-blocking to prevent deadlocks
        setTimeout(async () => {
          try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            // If we have a session but no user, or vice versa, refresh
            if ((currentSession && !currentUser) || (!currentSession && currentUser)) {
              console.log('Session/user mismatch detected, refreshing...');
              const refreshedSession = await refreshSession();
              if (refreshedSession) {
                setSession(refreshedSession);
                setUser(refreshedSession.user);
              }
            }
            
            // Also check if we have a user but session is stale
            if (currentUser && currentSession && currentSession.expires_at) {
              const now = Date.now() / 1000;
              if (currentSession.expires_at < now) {
                console.log('Session expired, refreshing...');
                const refreshedSession = await refreshSession();
                if (refreshedSession) {
                  setSession(refreshedSession);
                  setUser(refreshedSession.user);
                }
              }
            }
          } catch (error) {
            console.error('Error during periodic session check:', error);
          }
        }, 0);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(sessionCheckInterval);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Add timeout to prevent hanging
      const timeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 10000)
      );
      
      const { error } = await Promise.race([
        supabase.auth.signOut(),
        timeout
      ]);
      
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
}