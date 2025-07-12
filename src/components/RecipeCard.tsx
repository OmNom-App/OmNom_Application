import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Bookmark, Clock, Users, Star, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';

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
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (user) {
      checkLikeStatus();
      checkSaveStatus();
    }
    getLikeCount();
  }, [user, recipe.id]);

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

  const getLikeCount = async () => {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', recipe.id);
    
    setLikeCount(count || 0);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate('/login');
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
      navigate('/login');
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

  const totalTime = recipe.prep_time + recipe.cook_time;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      <Link to={`/recipe/${recipe.id}`}>
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
          
          <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full ${getDifficultyColor(recipe.difficulty)}`}>
            {recipe.difficulty}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
            {recipe.title}
          </h3>
          
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Users className="w-4 h-4 mr-1" />
            <span>{recipe.profiles?.display_name || 'Chef'}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600 mb-3">
            <Clock className="w-4 h-4 mr-1" />
            <span>{totalTime} mins</span>
            <Star className="w-4 h-4 ml-4 mr-1" />
            <span>{recipe.ingredients.length} ingredients</span>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{recipe.tags.length - 3}</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                className={`flex items-center space-x-1 ${
                  isLiked ? 'text-red-500' : 'text-gray-400'
                } hover:text-red-500 transition-colors`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{likeCount}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSave}
                className={`${
                  isSaved ? 'text-orange-500' : 'text-gray-400'
                } hover:text-orange-500 transition-colors`}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </motion.button>

              {onShare && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onShare}
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}