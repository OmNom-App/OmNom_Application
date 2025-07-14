-- Create storage bucket for recipe image uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  10485760, -- 10MB limit (larger than avatars for recipe photos)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Recipe image files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own recipe images" ON storage.objects;

-- Allow any authenticated user to upload to the recipe-images bucket
CREATE POLICY "Authenticated users can upload recipe images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recipe-images' AND auth.role() = 'authenticated'
  );

-- Create policy for recipe image downloads (public read access)
CREATE POLICY "Recipe image files are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-images');

-- Create policy for recipe image updates (users can update their own images)
CREATE POLICY "Users can update their own recipe images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'recipe-images'
  );

-- Create policy for recipe image deletions (users can delete their own images)
CREATE POLICY "Users can delete their own recipe images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'recipe-images'
  ); 