-- Fix like_count consistency issues
-- This migration ensures the like_count column stays in sync with the likes table

-- First, let's check if the trigger exists and recreate it if needed
DROP TRIGGER IF EXISTS trigger_update_recipe_like_count ON likes;

-- Drop and recreate the function to ensure it's working correctly
DROP FUNCTION IF EXISTS update_recipe_like_count();

-- Create an improved function that handles edge cases better
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

-- Fix any existing inconsistencies by recalculating all like_counts
UPDATE recipes 
SET like_count = (
    SELECT COUNT(*) 
    FROM likes 
    WHERE likes.recipe_id = recipes.id
);

-- Add a constraint to ensure like_count is never negative
ALTER TABLE recipes 
ADD CONSTRAINT recipes_like_count_non_negative 
CHECK (like_count >= 0);

-- Create a function to manually fix inconsistencies (for admin use)
CREATE OR REPLACE FUNCTION fix_recipe_like_counts()
RETURNS void AS $$
BEGIN
    UPDATE recipes 
    SET like_count = (
        SELECT COUNT(*) 
        FROM likes 
        WHERE likes.recipe_id = recipes.id
    );
END;
$$ LANGUAGE plpgsql; 