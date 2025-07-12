/*
  # Create profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - links to auth.users
      - `display_name` (text) - user's display name
      - `avatar_url` (text, optional) - profile picture URL
      - `bio` (text, optional) - user bio
      - `created_at` (timestamp) - when profile was created

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for users to read all profiles and update their own
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);