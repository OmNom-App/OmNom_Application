-- Drop the old problematic policy that's still active
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;

-- Create the correct policy for avatar uploads
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  ); 