/*
  # Create follows table

  1. New Tables
    - `follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid) - foreign key to profiles (who is following)
      - `following_id` (uuid) - foreign key to profiles (who is being followed)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `follows` table
    - Add policies for users to manage their own follows
    - Unique constraint to prevent duplicate follows
*/

CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Allow users to read all follows
CREATE POLICY "Follows are viewable by everyone"
  ON follows
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow authenticated users to create follows
CREATE POLICY "Authenticated users can create follows"
  ON follows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Allow users to delete their own follows
CREATE POLICY "Users can delete own follows"
  ON follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);