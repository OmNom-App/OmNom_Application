import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Minus, Clock, Tag, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';

export function EditRecipe() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    prep_time: 15,
    cook_time: 30,
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
    ingredients: [''],
    instructions: [''],
    tags: [''],
    image_url: '',
  });

  // Immediate authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('🚫 No authenticated user, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    if (!authLoading && user && id) {
      verifyRecipeOwnership();
    }
  }, [id, user, authLoading, navigate]);

  const logUnauthorizedAccess = (details: any) => {
    console.warn('🚨 UNAUTHORIZED RECIPE ACCESS ATTEMPT:', {
      timestamp: new Date().toISOString(),
      userId: user?.id,
      userEmail: user?.email,
      recipeId: id,
      action: 'EDIT_ATTEMPT',
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...details
    });
    
    // In production, send this to your security monitoring service
    // Example: sendSecurityAlert({ userId: user.id, action: 'unauthorized_edit', recipeId: id });
  };

  const verifyRecipeOwnership = async () => {
    if (!id || !user) {
      console.log('🚫 Missing recipe ID or user');
      setError('Recipe not found or invalid URL.');
      setLoading(false);
      return;
    }

    console.log('🔍 Verifying recipe ownership:', { recipeId: id, userId: user.id });
    setLoading(true);
    setError('');

    try {
      // Step 1: First try a simple query without author filter to test basic access
      console.log('📡 Testing basic recipe access...');
      
      const queryPromise = supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 10000);
      });
      
      const { data: recipe, error: fetchError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]);

      console.log('📝 Recipe fetch result:', { 
        hasRecipe: !!recipe,
        recipeAuthor: recipe?.author_id
      });

      if (fetchError) {
        console.error('❌ Database error:', fetchError);
        setError(`Failed to load recipe: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      if (!recipe) {
        console.log('🚫 Recipe not found');
        setError('Recipe not found.');
        setLoading(false);
        return;
      }

      // Step 3: Check if user is the author
      if (recipe.author_id !== user.id) {
        console.log('🚫 User is not the recipe owner');
        
        logUnauthorizedAccess({
          recipeAuthor: recipe.author_id,
          attemptedBy: user.id,
          recipeTitle: recipe.title
        });
        
        redirectWithError('You can only modify recipes you have created');
        return;
      }

      // Step 4: User is authorized - populate form
      console.log('✅ User authorized to edit recipe');
      setFormData({
        title: recipe.title || '',
        prep_time: recipe.prep_time || 15,
        cook_time: recipe.cook_time || 30,
        difficulty: recipe.difficulty || 'Easy',
        ingredients: recipe.ingredients && recipe.ingredients.length > 0 ? recipe.ingredients : [''],
        instructions: recipe.instructions && recipe.instructions.length > 0 ? recipe.instructions : [''],
        tags: recipe.tags && recipe.tags.length > 0 ? recipe.tags : [''],
        image_url: recipe.image_url || '',
      });

    } catch (err: any) {
      setError(`An error occurred: ${err.message}`);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const redirectWithError = (message: string) => {
    console.log('🔄 Redirecting with error:', message);
    sessionStorage.setItem('unauthorizedAccessMessage', message);
    navigate('/explore', { replace: true });
  };

  const updateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !id) {
      setError('You must be logged in to edit recipes');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Starting recipe update with server-side validation');

      // Prepare update data
      const recipeData = {
        title: formData.title.trim() || 'Untitled Recipe',
        prep_time: formData.prep_time || 0,
        cook_time: formData.cook_time || 0,
        difficulty: formData.difficulty,
        ingredients: formData.ingredients.filter(i => i.trim()),
        instructions: formData.instructions.filter(i => i.trim()),
        tags: formData.tags.filter(t => t.trim()),
        image_url: formData.image_url.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // Server-side validation: RLS policy ensures only author can update
      // The .eq('author_id', user.id) provides explicit client-side check
      const { data: updatedRecipe, error: updateError } = await supabase
        .from('recipes')
        .update(recipeData)
        .eq('id', id)
        .eq('author_id', user.id) // Explicit authorization check
        .select()
        .single();

      console.log('📝 Update result:', { 
        hasUpdatedRecipe: !!updatedRecipe,
        error: updateError
      });

      if (updateError) {
        // Handle authorization errors (403 equivalent)
        if (updateError.code === 'PGRST301' || 
            updateError.message.includes('permission') ||
            updateError.message.includes('policy')) {
          
          logUnauthorizedAccess({
            action: 'UPDATE_DENIED',
            error: updateError.message
          });
          
          redirectWithError('You can only modify recipes you have created');
          return;
        }
        
        throw updateError;
      }

      // Verify update actually happened
      if (!updatedRecipe) {
        console.log('🚫 No recipe updated - likely authorization failure');
        logUnauthorizedAccess({
          action: 'UPDATE_NO_ROWS',
          reason: 'No rows affected by update'
        });
        
        redirectWithError('You can only modify recipes you have created');
        return;
      }

      console.log('✅ Recipe updated successfully');
      setSuccess('Recipe updated successfully!');
      
      // Redirect to recipe page after success
      setTimeout(() => {
        navigate(`/recipe/${id}`);
      }, 1500);

    } catch (err: any) {
      console.error('❌ Error updating recipe:', err);
      setError(err.message || 'Failed to update recipe');
    } finally {
      setSaving(false);
    }
  };

  const deleteRecipe = async () => {
    if (!user || !id) return;
    
    // Enhanced confirmation with security warning
    const confirmed = window.confirm(
      `⚠️ DELETE RECIPE WARNING ⚠️\n\nAre you absolutely sure you want to permanently delete "${formData.title}"?\n\nThis action cannot be undone and will:\n• Remove the recipe completely\n• Delete all comments and likes\n• Remove it from all saved collections\n\nType "DELETE" in the next prompt to confirm.`
    );
    
    if (!confirmed) return;
    
    // Double confirmation for security
    const confirmText = window.prompt(
      'To confirm deletion, please type "DELETE" (all caps):'
    );
    
    if (confirmText !== 'DELETE') {
      console.log('🚫 Delete cancelled - incorrect confirmation text');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      console.log('🗑️ Starting recipe deletion with server-side validation');

      // Server-side validation: RLS policy + explicit author check
      const { data: deletedRecipes, error: deleteError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
        .eq('author_id', user.id) // Explicit authorization check
        .select();

      console.log('📝 Delete result:', { 
        deletedCount: deletedRecipes?.length || 0,
        error: deleteError
      });

      if (deleteError) {
        // Handle authorization errors (403 equivalent)
        if (deleteError.code === 'PGRST301' || 
            deleteError.message.includes('permission') ||
            deleteError.message.includes('policy') ||
            deleteError.code === '42501') {
          
          logUnauthorizedAccess({
            action: 'DELETE_DENIED',
            error: deleteError.message
          });
          
          redirectWithError('You can only modify recipes you have created');
          return;
        }
        
        throw deleteError;
      }

      // Verify deletion actually happened
      if (!deletedRecipes || deletedRecipes.length === 0) {
        console.log('🚫 No recipe deleted - likely authorization failure');
        logUnauthorizedAccess({
          action: 'DELETE_NO_ROWS',
          reason: 'No rows affected by delete'
        });
        
        redirectWithError('You can only modify recipes you have created');
        return;
      }

      console.log('✅ Recipe deleted successfully');
      setSuccess('Recipe deleted successfully! Redirecting...');
      
      // Redirect to profile page
      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 1500);

    } catch (err: any) {
      console.error('❌ Error deleting recipe:', err);
      setError(err.message || 'Failed to delete recipe. Please try again.');
    } finally {
      setDeleting(false);
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

  // Show loading while checking authorization
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-orange-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/recipe/${id}`)}
                className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Recipe</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Recipe</h1>
                <p className="text-gray-600">Make changes to your recipe</p>
              </div>
            </div>

            {/* Delete Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={deleteRecipe}
              disabled={deleting}
              className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleting ? 'Deleting...' : 'Delete Recipe'}</span>
            </motion.button>
          </div>

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

          <form onSubmit={updateRecipe} className="space-y-8">
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
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.prep_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, prep_time: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Cook Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.cook_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, cook_time: parseInt(e.target.value) || 0 }))}
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
                  Image URL (optional)
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
                onClick={() => navigate(`/recipe/${id}`)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}