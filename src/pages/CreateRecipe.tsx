import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Minus, Clock, Tag, ArrowLeft, Shuffle, ExternalLink, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';

export function CreateRecipe() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Check if this is a remix from another recipe
  const originalRecipe = location.state?.originalRecipe;
  const isRemix = !!originalRecipe;
  
  const [formData, setFormData] = useState({
    title: isRemix ? `${originalRecipe?.title} (Remix)` : '',
    prep_time: isRemix ? String(originalRecipe?.prep_time || 15) : '15',
    cook_time: isRemix ? String(originalRecipe?.cook_time || 30) : '30',
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
    ingredients: isRemix ? [...(originalRecipe?.ingredients || [''])] : [''],
    instructions: isRemix ? [...(originalRecipe?.instructions || [''])] : [''],
    tags: isRemix ? [...(originalRecipe?.tags || ['']), 'remix'] : [''],
    cuisine: isRemix ? originalRecipe?.cuisine || '' : '',
    dietary: isRemix ? originalRecipe?.dietary || [] : [],
    image_url: '',
  });

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const cuisineOptions = ['italian', 'mexican', 'asian', 'indian', 'mediterranean', 'american', 'other'];
  const dietaryOptions = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'pescatarian', 'other'];



  // Create recipe - SIMPLIFIED VERSION
  const createRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a recipe');
      return;
    }

    // Validate required fields
    const prepTimeNum = parseInt(formData.prep_time, 10);
    const cookTimeNum = parseInt(formData.cook_time, 10);
    if (!formData.prep_time || isNaN(prepTimeNum) || prepTimeNum <= 0) {
      setError('Prep time must be greater than 0');
      return;
    }
    if (!formData.cook_time || isNaN(cookTimeNum) || cookTimeNum <= 0) {
      setError('Cook time must be greater than 0');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Upload image if selected
      let imageUrl = formData.image_url.trim() || null;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          throw new Error('Upload failed');
        }
      }

      // Prepare recipe data - NO PROFILE CHECK
      const recipeData = {
        title: formData.title.trim() || 'Untitled Recipe',
        prep_time: prepTimeNum,
        cook_time: cookTimeNum,
        difficulty: formData.difficulty,
        ingredients: formData.ingredients.filter(i => i.trim()).length > 0 
          ? formData.ingredients.filter(i => i.trim()) 
          : ['No ingredients listed'],
        instructions: formData.instructions.filter(i => i.trim()).length > 0 
          ? formData.instructions.filter(i => i.trim()) 
          : ['No instructions provided'],
        tags: formData.tags.filter(t => t.trim()),
        cuisine: formData.cuisine,
        dietary: formData.dietary,
        image_url: imageUrl,
        author_id: user.id, // Direct user ID - no profile check
        is_remix: isRemix,
        original_recipe_id: isRemix ? originalRecipe?.id : null,
      };

      // Insert recipe directly - NO PROFILE OPERATIONS
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert(recipeData)
        .select()
        .single();

      if (recipeError) {
        throw new Error('Recipe creation failed');
      }
      setSuccess('Recipe created successfully!');

      // Redirect to the new recipe
      setTimeout(() => {
        navigate(`/recipe/${recipe.id}`);
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Failed to create recipe');
    } finally {
      setLoading(false);
    }
  };

  const addField = (field: 'ingredients' | 'instructions' | 'tags') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeField = (field: 'ingredients' | 'instructions' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateField = (field: 'ingredients' | 'instructions' | 'tags', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const toggleDietaryRestriction = (diet: string) => {
    setFormData(prev => ({
      ...prev,
      dietary: prev.dietary.includes(diet)
        ? prev.dietary.filter((d: string) => d !== diet)
        : [...prev.dietary, diet]
    }));
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setImageFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!user || !imageFile) return null;

    setUploadingImage(true);
    setError('');

    try {
      // Upload to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err: any) {
      setError('Failed to upload image: ' + (err.message || 'Unknown error'));
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-orange-100"
        >
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Recipe</h1>
              <p className="text-gray-600">
                {isRemix 
                  ? 'Create your own version of this amazing recipe' 
                  : 'Share your culinary creation with the OmNom community'
                }
              </p>
            </div>
          </div>

          {/* Remix Info */}
          {isRemix && originalRecipe && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-purple-50 border border-purple-200 rounded-xl p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Shuffle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">Remixing Recipe</h3>
                  <p className="text-purple-700 text-sm">Based on the original by {originalRecipe.profiles?.display_name}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{originalRecipe.title}</h4>
                    <p className="text-sm text-gray-600">
                      {originalRecipe.prep_time + originalRecipe.cook_time} mins • {originalRecipe.difficulty}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/recipe/${originalRecipe.id}`)}
                    className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    <span className="text-sm">View Original</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-purple-700">
                <p>💡 <strong>Tip:</strong> Make it your own! Modify ingredients, adjust cooking times, or add your special touch.</p>
              </div>
            </motion.div>
          )}

          {/* Status Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <strong>Success:</strong> {success}
            </div>
          )}



          <form onSubmit={createRecipe} className="space-y-8">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="Give your recipe a delicious name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Prep Time (minutes) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.prep_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, prep_time: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Cook Time (minutes) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.cook_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, cook_time: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine Type
                </label>
                <select
                  value={formData.cuisine}
                  onChange={(e) => setFormData(prev => ({ ...prev, cuisine: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <option value="">Select cuisine type</option>
                  {cuisineOptions.map((cuisine) => (
                    <option key={cuisine} value={cuisine} className="capitalize">
                      {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Restrictions
                </label>
                <div className="space-y-2">
                  {dietaryOptions.map((diet) => (
                    <label key={diet} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.dietary.includes(diet)}
                        onChange={() => toggleDietaryRestriction(diet)}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{diet}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Image (optional)
                </label>
                
                {/* Image Preview */}
                {(imagePreview || formData.image_url) && (
                  <div className="mb-4 relative">
                    <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Recipe preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* File Upload */}
                {!imagePreview && !formData.image_url && (
                  <div className="space-y-4">
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="recipe-image-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                          >
                            <span>Upload an image</span>
                            <input
                              id="recipe-image-upload"
                              name="recipe-image-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* URL Input (fallback) */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or provide an image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Ingredients *
              </label>
              <div className="space-y-3">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => updateField('ingredients', index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                      placeholder={`Ingredient ${index + 1}`}
                    />
                    {formData.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField('ingredients', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addField('ingredients')}
                  className="flex items-center space-x-2 text-orange-500 hover:text-orange-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Ingredient</span>
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Instructions *
              </label>
              <div className="space-y-3">
                {formData.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-sm text-gray-500 mt-3 min-w-[1.5rem]">{index + 1}.</span>
                    <textarea
                      value={instruction}
                      onChange={(e) => updateField('instructions', index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 min-h-[60px]"
                      placeholder={`Step ${index + 1}`}
                    />
                    {formData.instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField('instructions', index)}
                        className="text-red-500 hover:text-red-700 mt-2"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addField('instructions')}
                  className="flex items-center space-x-2 text-orange-500 hover:text-orange-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Step</span>
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags (optional)
              </label>
              <div className="space-y-3">
                {formData.tags.map((tag, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-gray-400">#</span>
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateField('tags', index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                      placeholder={`Tag ${index + 1} (e.g., vegan, quick, dessert)`}
                    />
                    {formData.tags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField('tags', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addField('tags')}
                  className="flex items-center space-x-2 text-orange-500 hover:text-orange-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Tag</span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || uploadingImage}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Recipe...' : uploadingImage ? 'Uploading Image...' : 'Create Recipe'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}