import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Minus, Clock, Tag, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
import { useRecipeAccess } from '../hooks/useRecipeAccess';

export function EditRecipe() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Use the new access control hook with ownership requirement
  const { loading, error: accessError, recipe, isOwner } = useRecipeAccess(true);
  
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

  // Populate form when recipe is loaded
  useEffect(() => {
    if (recipe) {
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
    }
  }, [recipe]);

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

      // RLS will automatically ensure only the author can update
      const { data: updatedRecipe, error } = await supabase
        .from('recipes')
        .update(recipeData)
        .eq('id', id)
        .eq('author_id', user.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('permission')) {
          setError('You do not have permission to edit this recipe');
        } else {
          setError('Failed to update recipe');
        }
        return;
      }

      if (!updatedRecipe) {
        setError('You do not have permission to edit this recipe');
        return;
      }

      setSuccess('Recipe updated successfully!');
      
      // Redirect to recipe page after success
      setTimeout(() => {
        navigate(`/recipe/${id}`);
      }, 1500);

    } catch (err: any) {
      console.error('Error updating recipe:', err);
      setError('Failed to update recipe');
    } finally {
      setSaving(false);
    }
  };

  const deleteRecipe = async () => {
    if (!user || !id) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${formData.title}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    setDeleting(true);
    setError('');

    try {
      // RLS will automatically ensure only the author can delete
      const { data: deletedRecipes, error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
        .eq('author_id', user.id)
        .select();

      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('permission')) {
          setError('You do not have permission to delete this recipe');
        } else {
          setError('Failed to delete recipe');
        }
        return;
      }

      if (!deletedRecipes || deletedRecipes.length === 0) {
        setError('You do not have permission to delete this recipe');
        return;
      }

      setSuccess('Recipe deleted successfully! Redirecting...');
      
      // Redirect to profile page
      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 1500);

    } catch (err: any) {
      console.error('Error deleting recipe:', err);
      setError('Failed to delete recipe');
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
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading recipe...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show 404 not found if access denied or recipe not found
  if (accessError && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Recipe not found</h3>
            <p className="text-gray-600 mb-6">
              The recipe you're looking for doesn't exist or you do not have permission to edit it.
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Back to Explore
            </button>
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

          {/* Recipe Form */}
          <form onSubmit={updateRecipe} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter recipe title"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="prep_time" className="block text-sm font-medium text-gray-700 mb-2">
                    Prep Time (minutes)
                  </label>
                  <input
                    type="number"
                    id="prep_time"
                    value={formData.prep_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, prep_time: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="cook_time" className="block text-sm font-medium text-gray-700 mb-2">
                    Cook Time (minutes)
                  </label>
                  <input
                    type="number"
                    id="cook_time"
                    value={formData.cook_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, cook_time: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
                <button
                  type="button"
                  onClick={() => addField('ingredients')}
                  className="flex items-center space-x-2 bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Ingredient</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => updateField('ingredients', index, e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder={`Ingredient ${index + 1}`}
                    />
                    {formData.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField('ingredients', index)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Instructions</h2>
                <button
                  type="button"
                  onClick={() => addField('instructions')}
                  className="flex items-center space-x-2 bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Step</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium mt-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={instruction}
                        onChange={(e) => updateField('instructions', index, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-vertical"
                        rows={3}
                        placeholder={`Step ${index + 1}`}
                      />
                    </div>
                    {formData.instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField('instructions', index)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors mt-3"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Tags</h2>
                <button
                  type="button"
                  onClick={() => addField('tags')}
                  className="flex items-center space-x-2 bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Tag</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.tags.map((tag, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Tag className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateField('tags', index, e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter tag"
                    />
                    {formData.tags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField('tags', index)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/recipe/${id}`)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={saving}
                className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}