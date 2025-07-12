/*
  # Fix Recipe Security Policies

  1. Security Issues Fixed
    - Ensure proper RLS policies for recipes table
    - Add proper authorization checks
    - Fix potential data leakage

  2. Changes
    - Review and fix all RLS policies on recipes table
    - Ensure only authors can update/delete their recipes
    - Add proper error handling for unauthorized access
*/

-- First, let's check and fix the recipes table RLS policies
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Recipes are viewable by everyone" ON recipes;
DROP POLICY IF EXISTS "Authenticated users can create recipes" ON recipes;
DROP POLICY IF EXISTS "Authors can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Authors can delete own recipes" ON recipes;

-- Recreate policies with proper security
CREATE POLICY "Recipes are viewable by everyone"
  ON recipes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create recipes"
  ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own recipes"
  ON recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own recipes"
  ON recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Ensure RLS is enabled
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;