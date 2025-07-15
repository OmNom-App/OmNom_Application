-- Fix the like_count trigger that's not working
-- This migration recreates the trigger with proper error handling

-- First, let's check what triggers exist
DO $$
BEGIN
    -- Drop the existing trigger if it exists
    DROP TRIGGER IF EXISTS trigger_update_recipe_like_count ON likes;
    
    -- Drop the function if it exists
    DROP FUNCTION IF EXISTS update_recipe_like_count();
    
    RAISE NOTICE 'Dropped existing trigger and function';
END $$;

-- Create a new, improved function with better error handling
CREATE OR REPLACE FUNCTION update_recipe_like_count()
RETURNS TRIGGER AS $$
DECLARE
    recipe_exists BOOLEAN;
BEGIN
    -- Check if the recipe exists
    SELECT EXISTS(SELECT 1 FROM recipes WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id)) INTO recipe_exists;
    
    IF NOT recipe_exists THEN
        RAISE WARNING 'Recipe % does not exist, skipping like_count update', COALESCE(NEW.recipe_id, OLD.recipe_id);
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF TG_OP = 'INSERT' THEN
        -- Increment like_count when a like is added
        UPDATE recipes 
        SET like_count = COALESCE(like_count, 0) + 1 
        WHERE id = NEW.recipe_id;
        
        RAISE NOTICE 'Incremented like_count for recipe %', NEW.recipe_id;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement like_count when a like is removed
        UPDATE recipes 
        SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) 
        WHERE id = OLD.recipe_id;
        
        RAISE NOTICE 'Decremented like_count for recipe %', OLD.recipe_id;
        RETURN OLD;
        
    END IF;
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in update_recipe_like_count trigger: %', SQLERRM;
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_update_recipe_like_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_like_count();

-- Test the trigger by manually fixing all like_counts
UPDATE recipes 
SET like_count = (
    SELECT COUNT(*) 
    FROM likes 
    WHERE likes.recipe_id = recipes.id
);

-- Add a constraint to ensure like_count is never negative
ALTER TABLE recipes 
DROP CONSTRAINT IF EXISTS recipes_like_count_non_negative;

ALTER TABLE recipes 
ADD CONSTRAINT recipes_like_count_non_negative 
CHECK (like_count >= 0);

-- Create a function to manually fix inconsistencies
CREATE OR REPLACE FUNCTION fix_all_recipe_like_counts()
RETURNS void AS $$
BEGIN
    UPDATE recipes 
    SET like_count = (
        SELECT COUNT(*) 
        FROM likes 
        WHERE likes.recipe_id = recipes.id
    );
    
    RAISE NOTICE 'Fixed like_counts for all recipes';
END;
$$ LANGUAGE plpgsql;

-- Run the fix function
SELECT fix_all_recipe_like_counts(); 