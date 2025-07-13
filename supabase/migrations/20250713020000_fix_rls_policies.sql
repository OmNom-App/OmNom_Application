/*
  # Fix RLS Policies - All Tables

  This migration fixes the RLS policies that are causing database queries to hang.
  
  Problem:
  - All database queries are hanging/timing out
  - RLS policies are likely too restrictive or malformed
  - Need to establish proper access control for all tables

  Solution:
  - Drop all existing problematic RLS policies
  - Create new, properly configured RLS policies
  - Ensure public read access where needed
  - Ensure authenticated users can perform appropriate operations
*/

-- ========================================
-- PROFILES TABLE
-- ========================================

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

-- Create new policies for profiles table
-- Allow public read access to profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
FOR SELECT USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- ========================================
-- RECIPES TABLE
-- ========================================

-- Drop all existing policies on recipes table
DROP POLICY IF EXISTS "Recipes are viewable by everyone" ON recipes;
DROP POLICY IF EXISTS "Users can view all recipes" ON recipes;
DROP POLICY IF EXISTS "Public recipes are viewable by everyone" ON recipes;
DROP POLICY IF EXISTS "Enable read access for all users" ON recipes;
DROP POLICY IF EXISTS "Authors can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Authenticated users can create recipes" ON recipes;
DROP POLICY IF EXISTS "Authors can delete own recipes" ON recipes;

-- Create new policies for recipes table
-- Allow public read access to recipes
CREATE POLICY "Public recipes are viewable by everyone" ON recipes
FOR SELECT USING (true);

-- Allow authenticated users to create recipes
CREATE POLICY "Authenticated users can create recipes" ON recipes
FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Allow authors to update their own recipes
CREATE POLICY "Authors can update own recipes" ON recipes
FOR UPDATE USING (auth.uid() = author_id);

-- Allow authors to delete their own recipes
CREATE POLICY "Authors can delete own recipes" ON recipes
FOR DELETE USING (auth.uid() = author_id);

-- ========================================
-- LIKES TABLE
-- ========================================

-- Drop all existing policies on likes table
DROP POLICY IF EXISTS "Users can view all likes" ON likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

-- Create new policies for likes table
-- Allow public read access to likes
CREATE POLICY "Public likes are viewable by everyone" ON likes
FOR SELECT USING (true);

-- Allow authenticated users to create likes
CREATE POLICY "Users can insert own likes" ON likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own likes
CREATE POLICY "Users can delete own likes" ON likes
FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- SAVES TABLE
-- ========================================

-- Drop all existing policies on saves table
DROP POLICY IF EXISTS "Users can view all saves" ON saves;
DROP POLICY IF EXISTS "Users can insert own saves" ON saves;
DROP POLICY IF EXISTS "Users can delete own saves" ON saves;

-- Create new policies for saves table
-- Allow public read access to saves
CREATE POLICY "Public saves are viewable by everyone" ON saves
FOR SELECT USING (true);

-- Allow authenticated users to create saves
CREATE POLICY "Users can insert own saves" ON saves
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own saves
CREATE POLICY "Users can delete own saves" ON saves
FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- COMMENTS TABLE
-- ========================================

-- Drop all existing policies on comments table
DROP POLICY IF EXISTS "Users can view all comments" ON comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- Create new policies for comments table
-- Allow public read access to comments
CREATE POLICY "Public comments are viewable by everyone" ON comments
FOR SELECT USING (true);

-- Allow authenticated users to create comments
CREATE POLICY "Users can insert own comments" ON comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- FOLLOWS TABLE
-- ========================================

-- Drop all existing policies on follows table
DROP POLICY IF EXISTS "Users can view all follows" ON follows;
DROP POLICY IF EXISTS "Users can insert own follows" ON follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON follows;

-- Create new policies for follows table
-- Allow public read access to follows
CREATE POLICY "Public follows are viewable by everyone" ON follows
FOR SELECT USING (true);

-- Allow authenticated users to create follows
CREATE POLICY "Users can insert own follows" ON follows
FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Allow users to delete their own follows
CREATE POLICY "Users can delete own follows" ON follows
FOR DELETE USING (auth.uid() = follower_id); 