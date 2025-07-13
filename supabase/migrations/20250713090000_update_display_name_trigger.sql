/*
  # Update Display Name Trigger

  This migration updates the handle_new_user function to use the full_name
  from user metadata instead of the email prefix for the display name.

  Changes:
  - Updated handle_new_user() function to prioritize full_name from user metadata
  - Falls back to email prefix if no full_name is provided
  - Maintains backward compatibility for existing users
*/

-- Update the handle_new_user function to use full_name from metadata
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