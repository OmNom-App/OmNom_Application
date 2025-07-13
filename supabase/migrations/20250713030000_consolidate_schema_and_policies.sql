/*
  # Consolidate Schema and RLS Policies - Best Practices

  This migration consolidates all database schema and RLS policies into a single,
  well-documented migration following Supabase best practices.

  Features:
  - Complete schema definition for all tables
  - Proper RLS policies with clear naming
  - Performance indexes
  - Automatic profile creation for new users
  - Proper foreign key constraints
  - Data validation constraints

  Security Model:
  - Public read access for browsing content
  - Authenticated users can create content
  - Users can only modify their own content
  - Proper ownership validation using auth.uid()
*/

-- ========================================
-- PROFILES TABLE
-- ========================================

-- Create profiles table with proper structure
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create RLS policies for profiles
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ========================================
-- RECIPES TABLE
-- ========================================

-- Create recipes table with proper structure
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  ingredients text[] NOT NULL DEFAULT '{}',
  instructions text[] NOT NULL DEFAULT '{}',
  prep_time integer NOT NULL DEFAULT 0,
  cook_time integer NOT NULL DEFAULT 0,
  difficulty text NOT NULL DEFAULT 'Easy' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  tags text[] NOT NULL DEFAULT '{}',
  image_url text,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  is_remix boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Recipes are viewable by everyone" ON recipes;
DROP POLICY IF EXISTS "Users can view all recipes" ON recipes;
DROP POLICY IF EXISTS "Public recipes are viewable by everyone" ON recipes;
DROP POLICY IF EXISTS "Enable read access for all users" ON recipes;
DROP POLICY IF EXISTS "Authors can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Authenticated users can create recipes" ON recipes;
DROP POLICY IF EXISTS "Authors can delete own recipes" ON recipes;

-- Create RLS policies for recipes
CREATE POLICY "recipes_select_policy" ON recipes
  FOR SELECT USING (true);

CREATE POLICY "recipes_insert_policy" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "recipes_update_policy" ON recipes
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "recipes_delete_policy" ON recipes
  FOR DELETE USING (auth.uid() = author_id);

-- ========================================
-- LIKES TABLE
-- ========================================

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view all likes" ON likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
DROP POLICY IF EXISTS "Public likes are viewable by everyone" ON likes;

-- Create RLS policies for likes
CREATE POLICY "likes_select_policy" ON likes
  FOR SELECT USING (true);

CREATE POLICY "likes_insert_policy" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_policy" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- SAVES TABLE
-- ========================================

-- Create saves table
CREATE TABLE IF NOT EXISTS saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Enable RLS
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view all saves" ON saves;
DROP POLICY IF EXISTS "Users can insert own saves" ON saves;
DROP POLICY IF EXISTS "Users can delete own saves" ON saves;
DROP POLICY IF EXISTS "Public saves are viewable by everyone" ON saves;

-- Create RLS policies for saves
CREATE POLICY "saves_select_policy" ON saves
  FOR SELECT USING (true);

CREATE POLICY "saves_insert_policy" ON saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saves_delete_policy" ON saves
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- COMMENTS TABLE
-- ========================================

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view all comments" ON comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Public comments are viewable by everyone" ON comments;

-- Create RLS policies for comments
CREATE POLICY "comments_select_policy" ON comments
  FOR SELECT USING (true);

CREATE POLICY "comments_insert_policy" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_policy" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- FOLLOWS TABLE
-- ========================================

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view all follows" ON follows;
DROP POLICY IF EXISTS "Users can insert own follows" ON follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON follows;
DROP POLICY IF EXISTS "Public follows are viewable by everyone" ON follows;

-- Create RLS policies for follows
CREATE POLICY "follows_select_policy" ON follows
  FOR SELECT USING (true);

CREATE POLICY "follows_insert_policy" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_policy" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Recipes indexes
CREATE INDEX IF NOT EXISTS recipes_author_id_idx ON recipes(author_id);
CREATE INDEX IF NOT EXISTS recipes_created_at_idx ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS recipes_tags_idx ON recipes USING gin(tags);
CREATE INDEX IF NOT EXISTS recipes_difficulty_idx ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS recipes_is_remix_idx ON recipes(is_remix);

-- Likes indexes
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON likes(user_id);
CREATE INDEX IF NOT EXISTS likes_recipe_id_idx ON likes(recipe_id);

-- Saves indexes
CREATE INDEX IF NOT EXISTS saves_user_id_idx ON saves(user_id);
CREATE INDEX IF NOT EXISTS saves_recipe_id_idx ON saves(recipe_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS comments_recipe_id_idx ON comments(recipe_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at DESC);

-- Follows indexes
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);

-- ========================================
-- AUTOMATIC PROFILE CREATION
-- ========================================

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (new.id, COALESCE(new.email, 'Chef'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ========================================
-- UPDATE TRIGGERS
-- ========================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 