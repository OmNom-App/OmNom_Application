import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Heart, 
  Bookmark, 
  Share2, 
  MessageCircle,
  Star,
  ChefHat,
  Copy,
  Edit,
  Flag,
  MoreHorizontal,
  Send,
  Trash2,
  Shuffle,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
import { toggleRecipeLike } from '../lib/likeUtils';

import { format } from 'date-fns';

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  dietary: string[];
  cuisine: string;
  image_url: string | null;
  author_id: string;
  original_recipe_id: string | null;
  is_remix: boolean;
  created_at: string;
  updated_at: string;
  like_count: number;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
}

// Component to display original recipe information
function OriginalRecipeCard({ originalRecipeId }: { originalRecipeId: string }) {
  const [originalRecipe, setOriginalRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOriginalRecipe();
  }, [originalRecipeId]);

  const loadOriginalRecipe = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          prep_time,
          cook_time,
          difficulty,
          image_url,
          profiles:author_id (
            display_name,
            avatar_url
          )
        `)
        .eq('id', originalRecipeId)
        .single();

      if (error) throw error;
      setOriginalRecipe(data);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 border border-purple-200 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!originalRecipe) {
    return (
      <div className="bg-white rounded-lg p-4 border border-purple-200">
        <p className="text-gray-600 text-sm">Original recipe no longer available</p>
      </div>
    );
  }

  return (
    <Link to={`/recipe/${originalRecipe.id}`}>
      <div className="bg-white rounded-lg p-4 border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {originalRecipe.image_url ? (
              <img
                src={originalRecipe.image_url}
                alt={originalRecipe.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-2xl">🍽️</div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate mb-1">
              {originalRecipe.title}
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              By {originalRecipe.profiles?.display_name || 'Unknown Chef'}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{originalRecipe.prep_time + originalRecipe.cook_time} mins</span>
              <span>{originalRecipe.difficulty}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-purple-600">
            <span className="text-sm font-medium">View Original</span>
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saveCount, setSaveCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    // Scroll to top when recipe ID changes
    window.scrollTo(0, 0);
    
    if (id) {
      loadRecipe();
      loadComments();
      if (user) {
        checkUserInteractions();
      }
    }
  }, [id, user]);

  const loadRecipe = async () => {
    if (!id) return;

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles:author_id (
            display_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setRecipe(data);

      // Set like count from the loaded recipe data
      setLikeCount(data.like_count || 0);

      // Load other interaction counts
      await loadInteractionCounts();
    } catch (err: any) {
      setError('Recipe not found');
    } finally {
      setLoading(false);
    }
  };

  const loadInteractionCounts = async () => {
    if (!id) return;

    try {
      const [saveResult, commentResult] = await Promise.all([
        supabase
          .from('saves')
          .select('*', { count: 'exact', head: true })
          .eq('recipe_id', id),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('recipe_id', id)
      ]);

      setSaveCount(saveResult.count || 0);
      setCommentCount(commentResult.count || 0);
    } catch (error) {
      // Silent error handling
    }
  };

  const checkUserInteractions = async () => {
    if (!user || !id) return;

    try {
      const [likeResult, saveResult] = await Promise.all([
        supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('recipe_id', id)
          .maybeSingle(),
        supabase
          .from('saves')
          .select('id')
          .eq('user_id', user.id)
          .eq('recipe_id', id)
          .maybeSingle()
      ]);

      setIsLiked(!!likeResult.data);
      setIsSaved(!!saveResult.data);
    } catch (error) {
      // Errors are expected when no records exist
    }
  };

  const loadComments = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('recipe_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setComments(data || []);
    } catch (error) {
      // Silent error handling
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!id) return;

    try {
      const { newLikeCount, isLiked } = await toggleRecipeLike(id, user.id);
      setLikeCount(newLikeCount);
      setIsLiked(isLiked);
      
      // Refresh recipe data to ensure consistency
      const { data: updatedRecipe } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (updatedRecipe) {
        setRecipe({ ...recipe!, ...updatedRecipe });
      }
    } catch (error) {
      // Silent error handling for production
    }
  };

  const handleSave = async () => {
    if (!user || !id) {
      navigate('/login');
      return;
    }

    try {
      if (isSaved) {
        await supabase
          .from('saves')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', id);
        setSaveCount(prev => prev - 1);
      } else {
        await supabase
          .from('saves')
          .insert({ user_id: user.id, recipe_id: id });
        setSaveCount(prev => prev + 1);
      }
      setIsSaved(!isSaved);
    } catch (error) {
      // Silent error handling
    }
  };

  const handleShare = async () => {
    const recipeUrl = `${window.location.origin}/recipe/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe?.title,
          text: `Check out this recipe: ${recipe?.title}`,
          url: recipeUrl
        });
      } catch (error) {
        // Silent error handling
      }
    } else {
      navigator.clipboard.writeText(recipeUrl);
      // You could show a toast notification here
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !id || !newComment.trim()) {
      if (!user) navigate('/login');
      return;
    }

    setCommentLoading(true);

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          user_id: user.id,
          recipe_id: id
        });

      if (error) throw error;

      setNewComment('');
      setCommentCount(prev => prev + 1);
      await loadComments();
    } catch (error) {
      // Silent error handling
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;



    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setCommentCount(prev => prev - 1);
      await loadComments();
    } catch (error) {
      // Silent error handling
    }
  };

  const handleRemix = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/create', { state: { originalRecipe: recipe } });
  };

  const handleDeleteRecipe = async () => {
    if (!user || !id) {
      navigate('/login');
      return;
    }

    // Check if user owns the recipe
    if (!isOwner) {
      setError('You can only delete recipes you have created.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
        .eq('author_id', user.id);

      if (error) {
        setError('Failed to delete recipe');
        return;
      }

      navigate('/explore');
    } catch (error) {
      setError('Failed to delete recipe.');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="h-64 bg-gray-200 rounded-xl mb-6"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Recipe not found</h3>
            <p className="text-gray-600 mb-6">
              {error || "The recipe you're looking for doesn't exist."}
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

  const totalTime = recipe.prep_time + recipe.cook_time;
  const isOwner = user?.id === recipe.author_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </motion.button>

        {/* Recipe Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100 overflow-hidden mb-8"
        >
          {/* Recipe Image */}
          <div className="relative h-64 md:h-80 bg-gradient-to-br from-orange-100 to-pink-100">
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">
                🍽️
              </div>
            )}
            
            {/* Overlay badges */}
            <div className="absolute top-4 left-4 flex space-x-2">
              {recipe.is_remix && (
                <span className="bg-purple-500 text-white text-sm px-3 py-1 rounded-full">
                  Remix
                </span>
              )}
              <span className={`text-sm px-3 py-1 rounded-full ${getDifficultyColor(recipe.difficulty)}`}>
                {recipe.difficulty}
              </span>
            </div>

            {/* Action buttons */}
            <div className="absolute top-4 right-4 flex space-x-2">
              {isOwner && (
                <>
                  <button 
                    onClick={() => navigate(`/edit-recipe/${recipe.id}`)}
                    className="bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-colors"
                    title="Edit Recipe"
                  >
                    <Edit className="w-5 h-5 text-gray-600" />
                  </button>
                  <button 
                    onClick={handleDeleteRecipe}
                    className="bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-red-50 transition-colors"
                    title="Delete Recipe"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </>
              )}
              <button 
                onClick={handleShare}
                className="bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-colors"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Recipe Info */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
              <div className="flex-1 mb-4 md:mb-0">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {recipe.title}
                </h1>
                
                <div className="flex items-center space-x-6 text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    <Link 
                      to={`/profile/${recipe.author_id}`}
                      className="hover:text-orange-500 transition-colors"
                    >
                      {recipe.profiles?.display_name || 'Chef'}
                    </Link>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>{totalTime} mins total</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    <span>{recipe.ingredients.length} ingredients</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                  <span>Prep: {recipe.prep_time} mins</span>
                  <span>Cook: {recipe.cook_time} mins</span>
                  <span>Created {format(new Date(recipe.created_at), 'MMM d, yyyy')}</span>
                </div>

                {/* Tags */}
                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Dietary Information */}
                {recipe.dietary && recipe.dietary.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</h3>
                    <div className="flex flex-wrap gap-2">
                      {recipe.dietary.map((diet) => (
                        <span
                          key={diet}
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm capitalize"
                        >
                          {diet}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cuisine Information */}
                {recipe.cuisine && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Cuisine Type</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm capitalize">
                        {recipe.cuisine}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 md:ml-6">
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isLiked 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likeCount}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isSaved 
                        ? 'bg-orange-100 text-orange-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    <span>{saveCount}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{commentCount}</span>
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRemix}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                >
                  <Shuffle className="w-5 h-5" />
                  <span>Remix Recipe</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Original Recipe Reference for Remixes */}
        {recipe.is_remix && recipe.original_recipe_id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-purple-50 border border-purple-200 rounded-2xl shadow-xl p-6 mb-8"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Shuffle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">This is a Remix</h3>
                <p className="text-purple-700 text-sm">Based on an original recipe</p>
              </div>
            </div>
            
            <OriginalRecipeCard originalRecipeId={recipe.original_recipe_id} />
          </motion.div>
        )}

        {/* Recipe Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Ingredients */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-orange-100"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Star className="w-6 h-6 mr-2 text-orange-500" />
              Ingredients
            </h2>
            
            <div className="space-y-3">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700">{ingredient}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-orange-100"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <ChefHat className="w-6 h-6 mr-2 text-orange-500" />
              Instructions
            </h2>
            
            <div className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <div key={index} className="flex space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 pt-1">{instruction}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-orange-100"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-500" />
            Comments ({commentCount})
          </h2>

          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={handleAddComment} className="mb-8">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 self-start">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this recipe..."
                    className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={!newComment.trim() || commentLoading}
                      className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <Send className="w-4 h-4" />
                      <span>{commentLoading ? 'Posting...' : 'Post Comment'}</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600 mb-4">Sign in to leave a comment</p>
              <Link
                to="/login"
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 self-start">
                    {comment.profiles.avatar_url ? (
                      <img
                        src={comment.profiles.avatar_url}
                        alt={comment.profiles.display_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-2 space-y-2 sm:space-y-0">
                        <Link
                          to={`/profile/${comment.user_id}`}
                          className="font-semibold text-gray-900 hover:text-orange-500 transition-colors"
                        >
                          {comment.profiles.display_name}
                        </Link>
                        <div className="flex items-center justify-between sm:justify-end space-x-3">
                          <span className="text-sm text-gray-500">
                            {format(new Date(comment.created_at), 'MMM d, yyyy')}
                          </span>
                          {user?.id === comment.user_id && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}