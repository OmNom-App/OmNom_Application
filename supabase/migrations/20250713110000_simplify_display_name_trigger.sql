/*
  # Simplify Display Name Trigger

  This migration simplifies the handle_new_user function to be more robust
  and avoid potential errors that could cause 500 Internal Server Errors.

  Changes:
  - Simplified the function to be more defensive
  - Added better error handling
  - Uses a more straightforward approach to get the display name
*/

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a simpler, more robust handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  display_name text;
BEGIN
  -- Try to get full_name from metadata, fallback to email prefix
  display_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Chef'
  );
  
  -- Insert the profile
  INSERT INTO profiles (id, display_name)
  VALUES (new.id, display_name);
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, still create the profile with a default name
    INSERT INTO profiles (id, display_name)
    VALUES (new.id, COALESCE(split_part(new.email, '@', 1), 'Chef'));
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 