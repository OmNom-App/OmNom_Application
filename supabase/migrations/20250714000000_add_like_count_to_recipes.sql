-- Add like_count column to recipes table for efficient popular sorting
ALTER TABLE recipes ADD COLUMN like_count INTEGER DEFAULT 0;

-- Create an index on like_count for faster sorting
CREATE INDEX idx_recipes_like_count ON recipes(like_count DESC);

-- Create a function to update like_count when likes are added/removed
CREATE OR REPLACE FUNCTION update_recipe_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE recipes 
        SET like_count = like_count + 1 
        WHERE id = NEW.recipe_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE recipes 
        SET like_count = like_count - 1 
        WHERE id = OLD.recipe_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update like_count
CREATE TRIGGER trigger_update_recipe_like_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_like_count();

-- Initialize like_count for existing recipes
UPDATE recipes 
SET like_count = (
    SELECT COUNT(*) 
    FROM likes 
    WHERE likes.recipe_id = recipes.id
); 