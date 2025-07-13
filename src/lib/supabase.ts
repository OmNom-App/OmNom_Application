import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with standard configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Simple session and user getters
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Robust session refresh for tab switching issues
export const refreshSession = async () => {
  try {
    console.log('🔄 Refreshing session...');
    
    // Force refresh the session
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('❌ Session refresh error:', error);
      return null;
    }
    
    if (session) {
      console.log('✅ Session refreshed successfully');
      return session;
    } else {
      console.log('❌ No session after refresh');
      return null;
    }
  } catch (error) {
    console.error('❌ Unexpected error during session refresh:', error);
    return null;
  }
};

// Force session recovery for stuck states
export const forceSessionRecovery = async () => {
  try {
    console.log('🔄 Force session recovery...');
    
    // Clear any stuck state
    await supabase.auth.signOut();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to get session again
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('✅ Session recovery successful');
      return session;
    } else {
      console.log('❌ No session after recovery');
      return null;
    }
  } catch (error) {
    console.error('❌ Session recovery failed:', error);
    return null;
  }
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
      };
      recipes: {
        Row: {
          id: string;
          title: string;
          ingredients: string[];
          instructions: string[];
          prep_time: number;
          cook_time: number;
          difficulty: 'Easy' | 'Medium' | 'Hard';
          tags: string[];
          cuisine: string | null;
          dietary: string[];
          image_url: string | null;
          author_id: string;
          original_recipe_id: string | null;
          is_remix: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          ingredients: string[];
          instructions: string[];
          prep_time: number;
          cook_time: number;
          difficulty: 'Easy' | 'Medium' | 'Hard';
          tags: string[];
          cuisine?: string | null;
          dietary?: string[];
          image_url?: string | null;
          author_id: string;
          original_recipe_id?: string | null;
          is_remix?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          ingredients?: string[];
          instructions?: string[];
          prep_time?: number;
          cook_time?: number;
          difficulty?: 'Easy' | 'Medium' | 'Hard';
          tags?: string[];
          image_url?: string | null;
          author_id?: string;
          original_recipe_id?: string | null;
          is_remix?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          recipe_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipe_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipe_id?: string;
          created_at?: string;
        };
      };
      saves: {
        Row: {
          id: string;
          user_id: string;
          recipe_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipe_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipe_id?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          content: string;
          user_id: string;
          recipe_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          user_id: string;
          recipe_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          user_id?: string;
          recipe_id?: string;
          created_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
    };
  };
};