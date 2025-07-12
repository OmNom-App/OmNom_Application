/*
  # Create saves table

  1. New Tables
    - `saves`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - foreign key to profiles
      - `recipe_id` (uuid) - foreign key to recipes
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `saves` table
    - Add policies for users to manage their own saves
    - Unique constraint to prevent duplicate saves
*/

CREATE TABLE IF NOT EXISTS saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own saves
CREATE POLICY "Users can view own saves"
  ON saves
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to create saves
CREATE POLICY "Authenticated users can create saves"
  ON saves
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own saves
CREATE POLICY "Users can delete own saves"
  ON saves
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS saves_user_id_idx ON saves(user_id);
CREATE INDEX IF NOT EXISTS saves_recipe_id_idx ON saves(recipe_id);