-- Ensure the profiles table has the updated_at column
DO $$
BEGIN
    -- Check if updated_at column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'updated_at'
    ) THEN
        -- Add the updated_at column if it doesn't exist
        ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update updated_at if the column exists
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate the profiles trigger
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 