/*
  # Create likes table

  1. New Tables
    - `likes`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - foreign key to profiles
      - `recipe_id` (uuid) - foreign key to recipes
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `likes` table
    - Add policies for users to manage their own likes
    - Unique constraint to prevent duplicate likes
*/

CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Allow users to read all likes
CREATE POLICY "Likes are viewable by everyone"
  ON likes
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow authenticated users to create likes
CREATE POLICY "Authenticated users can create likes"
  ON likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own likes
CREATE POLICY "Users can delete own likes"
  ON likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON likes(user_id);
CREATE INDEX IF NOT EXISTS likes_recipe_id_idx ON likes(recipe_id);