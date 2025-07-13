/*
  # Fix RLS SELECT Policy for Recipes Table

  1. Problem
    - Current SELECT policy is blocking legitimate users from accessing their own recipes
    - Queries are timing out instead of returning data
    - Users cannot edit recipes they created

  2. Solution
    - Drop existing problematic SELECT policy
    - Create new SELECT policy that properly allows:
      - Public read access for viewing recipes (anon + authenticated)
      - Author access for editing their own recipes (authenticated)
    - Ensure policy uses correct auth.uid() function

  3. Security
    - Maintains security by only allowing authors to access their own recipes for editing
    - Allows public viewing of all recipes for browse/explore functionality
    - Uses proper Supabase auth functions
*/

-- Drop existing SELECT policy that may be causing issues
DROP POLICY IF EXISTS "Recipes are viewable by everyone" ON recipes;
DROP POLICY IF EXISTS "Users can view all recipes" ON recipes;
DROP POLICY IF EXISTS "Public recipes are viewable by everyone" ON recipes;
DROP POLICY IF EXISTS "Enable read access for all users" ON recipes;

-- Create new SELECT policy that allows proper access
CREATE POLICY "Enable read access for all users" ON recipes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Ensure UPDATE policy is correct for authors only
DROP POLICY IF EXISTS "Authors can update own recipes" ON recipes;
CREATE POLICY "Authors can update own recipes" ON recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Ensure DELETE policy is correct for authors only  
DROP POLICY IF EXISTS "Authors can delete own recipes" ON recipes;
CREATE POLICY "Authors can delete own recipes" ON recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Ensure INSERT policy is correct
DROP POLICY IF EXISTS "Authenticated users can create recipes" ON recipes;
CREATE POLICY "Authenticated users can create recipes" ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);