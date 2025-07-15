import { supabase } from './supabase';

/**
 * Utility functions for managing recipe likes with user tracking
 */

/**
 * Like a recipe (adds user to likes table and increments like_count)
 */
export async function likeRecipe(recipeId: string, userId: string): Promise<number> {
  // First check if user already liked this recipe
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)
    .maybeSingle();

  if (existingLike) {
    // User already liked this recipe, return current count
    const { data } = await supabase
      .from('recipes')
      .select('like_count')
      .eq('id', recipeId)
      .single();
    return data?.like_count || 0;
  }

  // Add the like
  const { error: likeError } = await supabase
    .from('likes')
    .insert({ user_id: userId, recipe_id: recipeId });

  if (likeError) throw likeError;

  // Get the updated like count
  const { data } = await supabase
    .from('recipes')
    .select('like_count')
    .eq('id', recipeId)
    .single();

  return data?.like_count || 0;
}

/**
 * Unlike a recipe (removes user from likes table and decrements like_count)
 */
export async function unlikeRecipe(recipeId: string, userId: string): Promise<number> {
  // Remove the like
  const { error: unlikeError } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('recipe_id', recipeId);

  if (unlikeError) throw unlikeError;

  // Get the updated like count
  const { data } = await supabase
    .from('recipes')
    .select('like_count')
    .eq('id', recipeId)
    .single();

  return data?.like_count || 0;
}

/**
 * Check if a user has liked a recipe
 */
export async function checkUserLikeStatus(recipeId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)
    .maybeSingle();

  return !!data;
}

/**
 * Get the current like count for a recipe
 */
export async function getRecipeLikeCount(recipeId: string): Promise<number> {
  const { data } = await supabase
    .from('recipes')
    .select('like_count')
    .eq('id', recipeId)
    .single();
  return data?.like_count || 0;
}

/**
 * Toggle like status for a recipe
 */
export async function toggleRecipeLike(recipeId: string, userId: string): Promise<{
  newLikeCount: number;
  isLiked: boolean;
}> {
  // Check current like status
  const isCurrentlyLiked = await checkUserLikeStatus(recipeId, userId);
  
  let newLikeCount: number;
  
  if (isCurrentlyLiked) {
    // Unlike the recipe
    newLikeCount = await unlikeRecipe(recipeId, userId);
  } else {
    // Like the recipe
    newLikeCount = await likeRecipe(recipeId, userId);
  }

  return {
    newLikeCount,
    isLiked: !isCurrentlyLiked
  };
} 