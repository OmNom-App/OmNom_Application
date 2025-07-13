import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';

interface RecipeAccessResult {
  loading: boolean;
  error: string | null;
  recipe: any | null;
  isOwner: boolean;
}

export function useRecipeAccess(requireOwnership = false): RecipeAccessResult {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuthContext();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<any | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading before making any decisions
    if (authLoading) {
      setLoading(true);
      return;
    }
    
    // After auth is loaded, check if user is authenticated
    if (!user) {
      setError('not_found');
      setLoading(false);
      return;
    }
    
    // User is authenticated, proceed with recipe access check
    if (user && id) {
      checkRecipeAccess();
    } else {
      setLoading(false);
    }
  }, [id, user, authLoading]);

  const checkRecipeAccess = async () => {
    if (!id || !user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        setError('not_found');
        setLoading(false);
        return;
      }
      
      if (!data) {
        setError('not_found');
        setLoading(false);
        return;
      }
      
      if (requireOwnership && data.author_id !== user.id) {
        setError('not_found');
        setLoading(false);
        return;
      }
      
      setRecipe(data);
      setLoading(false);
      
    } catch (err) {
      setError('not_found');
      setLoading(false);
    }
  };

  const isOwner = user?.id === recipe?.author_id;

  return {
    loading,
    error,
    recipe,
    isOwner
  };
} 