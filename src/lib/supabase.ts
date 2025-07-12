import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'omnom-recipe-app',
      'x-application-name': 'omnom-recipe-app'
    },
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
    }
  },
  realtime: {
    enabled: false,
    params: {
      eventsPerSecond: 10
    }
  }
});

// Add connection health check
export const checkSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    const start = performance.now();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();
    
    const duration = performance.now() - start;
    console.log(`✅ Supabase connection test completed in ${duration.toFixed(2)}ms`);
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Supabase connection error:', error);
      return { connected: false, error, duration };
    }
    
    return { connected: true, duration };
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return { connected: false, error, duration: 0 };
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