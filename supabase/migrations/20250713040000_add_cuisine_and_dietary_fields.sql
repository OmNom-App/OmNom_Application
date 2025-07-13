-- Add cuisine and dietary fields to recipes table
-- This migration adds structured fields for cuisine type and dietary restrictions
-- to enable proper filtering on the Explore page

-- Add cuisine field
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS cuisine text;

-- Add dietary field as text array
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS dietary text[] DEFAULT '{}';

-- Create index for cuisine field for better performance
CREATE INDEX IF NOT EXISTS recipes_cuisine_idx ON recipes(cuisine);

-- Create index for dietary field for better performance
CREATE INDEX IF NOT EXISTS recipes_dietary_idx ON recipes USING gin(dietary);

-- Add comment to document the new fields
COMMENT ON COLUMN recipes.cuisine IS 'Cuisine type (e.g., italian, mexican, asian, indian, mediterranean, american)';
COMMENT ON COLUMN recipes.dietary IS 'Array of dietary restrictions (e.g., vegan, vegetarian, gluten-free, dairy-free, keto, paleo)'; 