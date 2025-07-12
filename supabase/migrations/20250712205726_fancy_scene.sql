/*
  # Create handle_new_user trigger function

  1. New Functions
    - `handle_new_user()` - Automatically creates a profile when a user signs up
    
  2. New Triggers
    - Trigger on auth.users table to call handle_new_user() on INSERT
    
  3. Security
    - Function runs with SECURITY DEFINER to bypass RLS during profile creation
    
  This fixes the "Database error saving new user" issue by ensuring every new user
  automatically gets a profile record created in the profiles table.
*/

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();