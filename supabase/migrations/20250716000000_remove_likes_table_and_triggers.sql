-- Remove likes table and all related triggers/functions
-- This migration cleans up the database after removing the likes table

-- Drop the likes table if it still exists (should be already deleted)
DROP TABLE IF EXISTS likes CASCADE;

-- Drop any existing triggers related to likes (use conditional logic)
DO $$
BEGIN
    -- Drop trigger on likes table if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_recipe_like_count' 
        AND event_object_table = 'likes'
    ) THEN
        DROP TRIGGER IF EXISTS trigger_update_recipe_like_count ON likes;
    END IF;
    
    -- Drop trigger on recipes table if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_recipe_like_count' 
        AND event_object_table = 'recipes'
    ) THEN
        DROP TRIGGER IF EXISTS trigger_update_recipe_like_count ON recipes;
    END IF;
END $$;

-- Drop the trigger functions
DROP FUNCTION IF EXISTS update_recipe_like_count();
DROP FUNCTION IF EXISTS fix_all_recipe_like_counts();
DROP FUNCTION IF EXISTS fix_recipe_like_counts();

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

-- Create a simple function to increment like_count (for future use if needed)
CREATE OR REPLACE FUNCTION increment_like_count(recipe_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE recipes 
    SET like_count = like_count + 1 
    WHERE id = recipe_id;
END;
$$ LANGUAGE plpgsql;

-- Create a simple function to decrement like_count (for future use if needed)
CREATE OR REPLACE FUNCTION decrement_like_count(recipe_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE recipes 
    SET like_count = GREATEST(like_count - 1, 0) 
    WHERE id = recipe_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION increment_like_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_like_count(uuid) TO authenticated; 