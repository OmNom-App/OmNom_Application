/*
  # Create recipes table

  1. New Tables
    - `recipes`
      - `id` (uuid, primary key)
      - `title` (text) - recipe title
      - `ingredients` (text array) - list of ingredients
      - `instructions` (text array) - cooking steps
      - `prep_time` (integer) - preparation time in minutes
      - `cook_time` (integer) - cooking time in minutes
      - `difficulty` (text) - Easy, Medium, or Hard
      - `tags` (text array) - recipe tags
      - `image_url` (text, optional) - recipe image
      - `author_id` (uuid) - foreign key to profiles
      - `original_recipe_id` (uuid, optional) - for remixes
      - `is_remix` (boolean) - whether this is a remix
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `recipes` table
    - Add policies for public read access and author write access
*/

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

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read recipes
CREATE POLICY "Recipes are viewable by everyone"
  ON recipes
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow authenticated users to create recipes
CREATE POLICY "Authenticated users can create recipes"
  ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Allow authors to update their own recipes
CREATE POLICY "Authors can update own recipes"
  ON recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

-- Allow authors to delete their own recipes
CREATE POLICY "Authors can delete own recipes"
  ON recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS recipes_author_id_idx ON recipes(author_id);
CREATE INDEX IF NOT EXISTS recipes_created_at_idx ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS recipes_tags_idx ON recipes USING GIN(tags);