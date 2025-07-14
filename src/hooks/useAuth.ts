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
        // Silent error handling
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes - MUST be non-blocking to prevent deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
                // Silent error handling
              }
            });
          }, 0);
        }
      }
    );

    // Handle tab visibility changes - refresh session when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Make it non-blocking to prevent deadlocks
        setTimeout(async () => {
          try {
            // Only refresh if we don't already have a valid session
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            
            if (!currentSession || !currentSession.user) {
              // Try to refresh the session first
              const refreshedSession = await refreshSession();
              
              if (refreshedSession) {
                setSession(refreshedSession);
                setUser(refreshedSession.user);
              } else {
                // If refresh fails, try force recovery
                const recoveredSession = await forceSessionRecovery();
                
                if (recoveredSession) {
                  setSession(recoveredSession);
                  setUser(recoveredSession.user);
                } else {
                  setSession(null);
                  setUser(null);
                }
              }
            }
          } catch (error) {
            // Silent error handling
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
                const refreshedSession = await refreshSession();
                if (refreshedSession) {
                  setSession(refreshedSession);
                  setUser(refreshedSession.user);
                }
              }
            }
          } catch (error) {
            // Silent error handling
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