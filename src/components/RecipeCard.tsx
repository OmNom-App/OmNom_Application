import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Bookmark, Clock, Users, Star, Share2, ChefHat } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
import { Modal } from './Modal';

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  prep_time: number;
  cook_time: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  image_url: string | null;
  author_id: string;
  is_remix: boolean;
  created_at: string;
  like_count: number;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface RecipeCardProps {
  recipe: Recipe;
  onLike?: (recipeId: string, isLiked: boolean) => void;
  onSave?: (recipeId: string, isSaved: boolean) => void;
  onShare?: () => void;
}

export function RecipeCard({ recipe, onLike, onSave, onShare }: RecipeCardProps) {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(recipe.like_count || 0);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'like' | 'save' | null>(null);

  useEffect(() => {
    if (user) {
      checkLikeStatus();
      checkSaveStatus();
    }
    // Use the like_count from recipe data instead of fetching separately
    setLikeCount(recipe.like_count || 0);
  }, [user, recipe.id, recipe.like_count]);

  const checkLikeStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipe.id)
      .maybeSingle();
    
    setIsLiked(!!data);
  };

  const checkSaveStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('saves')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipe.id)
      .maybeSingle();
    
    setIsSaved(!!data);
  };



  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setActionType('like');
      setShowActionModal(true);
      return;
    }

    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipe.id);
      setLikeCount(prev => prev - 1);
    } else {
      await supabase
        .from('likes')
        .insert({ user_id: user.id, recipe_id: recipe.id });
      setLikeCount(prev => prev + 1);
    }
    
    setIsLiked(!isLiked);
    onLike?.(recipe.id, !isLiked);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setActionType('save');
      setShowActionModal(true);
      return;
    }

    if (isSaved) {
      await supabase
        .from('saves')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipe.id);
    } else {
      await supabase
        .from('saves')
        .insert({ user_id: user.id, recipe_id: recipe.id });
    }
    
    setIsSaved(!isSaved);
    onSave?.(recipe.id, !isSaved);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };



  const handleCardClick = () => {
    if (!user) {
      setShowSignUpModal(true);
    } else {
      navigate(`/recipe/${recipe.id}`);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer h-88 flex flex-col"
        onClick={handleCardClick}
      >
        <div className="relative">
          <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-6xl">🍽️</div>
            )}
          </div>
          
          {recipe.is_remix && (
            <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
              🔄 Remix
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          {/* Recipe Title */}
          <h3 className="font-semibold text-lg text-gray-900 mb-3 overflow-hidden" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            textOverflow: 'ellipsis'
          }}>
            {recipe.title}
          </h3>
          
          {/* Author */}
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <Users className="w-4 h-4 mr-2" />
            <span className="truncate">{recipe.profiles?.display_name || 'Chef'}</span>
          </div>

          {/* Recipe Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1.5" />
              <span>Prep {recipe.prep_time}m</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1.5" />
              <span>Cook {recipe.cook_time}m</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Star className="w-3 h-3 mr-1.5" />
              <span>{recipe.ingredients.length} ingredients</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <span className={`w-2 h-2 rounded-full mr-1.5 ${getDifficultyColor(recipe.difficulty).split(' ')[1]}`}></span>
              <span>{recipe.difficulty}</span>
            </div>
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {recipe.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200"
                >
                  #{tag}
                </span>
              ))}
              {recipe.tags.length > 2 && (
                <span className="text-xs text-gray-400">+{recipe.tags.length - 2}</span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                className={`flex items-center space-x-1 p-2 rounded-lg ${
                  isLiked ? 'text-red-500' : 'text-gray-400'
                } hover:text-red-500 transition-colors`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs font-medium">{likeCount}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className={`p-2 rounded-lg ${
                  isSaved ? 'text-orange-500' : 'text-gray-400'
                } hover:text-orange-500 transition-colors`}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </motion.button>

              {onShare && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onShare}
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sign Up Modal */}
      <Modal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        title="Join OmNom"
        showCloseButton={true}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Unlock Full Recipe Access
          </h3>
          <p className="text-gray-600 mb-6">
            Sign up to view full recipe details, save favorites, and create your own recipes!
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setShowSignUpModal(false);
                navigate('/signup');
              }}
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
            >
              Sign Up Now
            </button>
            <button
              onClick={() => setShowSignUpModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </Modal>

      {/* Action Modal for Like/Save */}
      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={actionType === 'like' ? 'Like This Recipe' : 'Save This Recipe'}
        showCloseButton={true}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            {actionType === 'like' ? (
              <Heart className="w-8 h-8 text-white" />
            ) : (
              <Bookmark className="w-8 h-8 text-white" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {actionType === 'like' ? 'Like This Recipe' : 'Save This Recipe'}
          </h3>
          <p className="text-gray-600 mb-6">
            {actionType === 'like' 
              ? 'Sign up to like recipes and show your appreciation for great cooking!'
              : 'Sign up to save recipes and build your personal collection of favorites!'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setShowActionModal(false);
                navigate('/signup');
              }}
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
            >
              Sign Up Now
            </button>
            <button
              onClick={() => setShowActionModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}