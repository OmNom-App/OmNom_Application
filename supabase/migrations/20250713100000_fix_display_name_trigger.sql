/*
  # Fix Display Name Trigger

  This migration fixes the handle_new_user function to correctly access
  user metadata fields for the display name.

  Changes:
  - Fixed the handle_new_user() function to use correct metadata field access
  - Uses raw_user_meta_data->>'full_name' for accessing the full name
  - Falls back to email prefix if no full_name is provided
  - Maintains backward compatibility
*/

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function with correct field access
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1),
      'Chef'
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 