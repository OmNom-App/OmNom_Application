/*
  # Temporarily Disable Trigger

  This migration temporarily disables the handle_new_user trigger
  to avoid 500 errors during signup. Profile creation will be handled
  in the frontend code instead.

  This is a backup plan if the trigger continues to cause issues.
*/

-- Drop the trigger to disable automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Keep the function for potential future use, but don't use it as a trigger
-- The function can be called manually if needed 