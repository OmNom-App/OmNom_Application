-- Recreate likes table with proper user tracking
-- This migration restores the likes table for toggle-like functionality

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "likes_select_policy" ON likes;
DROP POLICY IF EXISTS "likes_insert_policy" ON likes;
DROP POLICY IF EXISTS "likes_delete_policy" ON likes;

-- Create RLS policies for likes
CREATE POLICY "likes_select_policy" ON likes
  FOR SELECT USING (true);

CREATE POLICY "likes_insert_policy" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_policy" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON likes(user_id);
CREATE INDEX IF NOT EXISTS likes_recipe_id_idx ON likes(recipe_id);

-- Create trigger function to update like_count
CREATE OR REPLACE FUNCTION update_recipe_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment like_count when a like is added
        UPDATE recipes 
        SET like_count = COALESCE(like_count, 0) + 1 
        WHERE id = NEW.recipe_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement like_count when a like is removed
        UPDATE recipes 
        SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) 
        WHERE id = OLD.recipe_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_update_recipe_like_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_like_count();

-- Ensure like_count column exists and has proper constraints
DO $$
BEGIN
    -- Add like_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'like_count'
    ) THEN
        ALTER TABLE recipes ADD COLUMN like_count INTEGER DEFAULT 0;
    END IF;
    
    -- Ensure like_count is not null and has a default
    ALTER TABLE recipes ALTER COLUMN like_count SET NOT NULL;
    ALTER TABLE recipes ALTER COLUMN like_count SET DEFAULT 0;
    
    -- Add constraint to ensure like_count is never negative
    ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_like_count_non_negative;
    ALTER TABLE recipes ADD CONSTRAINT recipes_like_count_non_negative CHECK (like_count >= 0);
    
    -- Set any null like_count values to 0
    UPDATE recipes SET like_count = 0 WHERE like_count IS NULL;
END $$;

-- Create index on like_count for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_like_count ON recipes(like_count DESC);

-- Drop existing policy if it exists, then add RLS policy to allow like_count updates for all users
DROP POLICY IF EXISTS "Allow like_count updates for all" ON recipes;
CREATE POLICY "Allow like_count updates for all"
  ON recipes
  FOR UPDATE
  USING (true)
  WITH CHECK (true); 