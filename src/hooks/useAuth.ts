import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        console.log('🔍 Initial auth state:', {
          user: session?.user?.email || 'null',
          hasSession: !!session
        });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔄 Auth state change event:', event, session?.user?.email || 'no user');
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in:', session.user.email);
        // Create or update profile
        await supabase.from('profiles').upsert({
          id: session.user.id,
          display_name: session.user.email?.split('@')[0] || 'Chef',
        });
      } else if (event === 'SIGNED_OUT') {
        console.log('🔓 User signed out');
        setUser(null);
        setSession(null);
        
        // Clear any cached data
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email);
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Sign in failed:', error.message);
      setLoading(false);
    } else {
      console.log('✅ Sign in successful');
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    console.log('📝 Attempting sign up for:', email);
    setLoading(true);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Sign up failed:', error.message);
      setLoading(false);
    } else {
      console.log('✅ Sign up successful');
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('🔓 Starting logout process...');
    
    setLoading(true);
    
    // Clear state immediately
    setUser(null);
    setSession(null);
    
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Logout error:', error);
    } else {
      console.log('✅ Logout successful');
    }
    
    setLoading(false);
    
    // Redirect to home page
    window.location.href = '/';
    
    return { error };
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