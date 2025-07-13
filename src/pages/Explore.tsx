import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Clock, 
  ChefHat, 
  Globe,
  Heart,
  Bookmark,
  Share2,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
import { AccessDeniedAlert } from '../components/AccessDeniedAlert';

import { RecipeCard } from '../components/RecipeCard';

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
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

interface Filters {
  dietary: string[];
  cookTime: string;
  difficulty: string;
  cuisine: string;
  ingredients: string;
}

export function Explore() {
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'quickest'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    dietary: [],
    cookTime: '',
    difficulty: '',
    cuisine: '',
    ingredients: ''
  });

  const ITEMS_PER_PAGE = 12;

  // Update URL when search query changes
  useEffect(() => {
    if (searchQuery) {
      setSearchParams({ q: searchQuery });
    } else {
      setSearchParams({});
    }
  }, [searchQuery, setSearchParams]);

  // Update search query when URL changes
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery || '');
    }
  }, [searchParams]);

  // Only load recipes when auth is not loading and we have stable dependencies
  useEffect(() => {
    if (!authLoading) {
      console.log('🔍 Explore: Auth loading finished, loading recipes...');
      loadRecipes(true);
    }
  }, [sortBy, filters, searchQuery, authLoading]);

  // Debug auth state changes
  useEffect(() => {
    console.log('🔍 Explore: Auth state changed', { 
      user: user?.email, 
      authLoading, 
      recipesCount: recipes.length 
    });
  }, [user, authLoading, recipes.length]);

  const loadRecipes = async (reset = false) => {
    console.log('🔍 Loading recipes...', { reset, page, searchQuery, filters, sortBy });
    
    // Don't reload if we already have recipes and auth is just refreshing
    if (!reset && recipes.length > 0 && authLoading) {
      console.log('🔍 Skipping recipe reload during auth refresh');
      return;
    }
    
    setLoading(true);
    const currentPage = reset ? 0 : page;
    
    let query = supabase
      .from('recipes')
      .select(`
        *,
        profiles:author_id (
          display_name,
          avatar_url
        )
      `);

    // Apply search
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
    }

    // Apply ingredient filter
    if (filters.ingredients) {
      query = query.or(`ingredients.cs.{${filters.ingredients}}`);
    }

    // Apply dietary filters
    if (filters.dietary.length > 0) {
      query = query.overlaps('dietary', filters.dietary);
    }

    // Apply difficulty filter
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    // Apply cook time filter
    if (filters.cookTime) {
      const maxTime = parseInt(filters.cookTime);
      query = query.lte('cook_time', maxTime);
    }

    // Apply cuisine filter
    if (filters.cuisine) {
      query = query.eq('cuisine', filters.cuisine);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'quickest':
        query = query.order('cook_time', { ascending: true });
        break;
      case 'popular':
        // For now, order by created_at. In a real app, you'd order by like count
        query = query.order('created_at', { ascending: false });
        break;
    }

    console.log('🔍 Executing query with range:', currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);
    
    const { data, error } = await query
      .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

    if (error) {
      console.error('❌ Error loading recipes:', error);
    } else {
      console.log('✅ Recipes loaded:', data?.length || 0, 'recipes');
      if (reset) {
        setRecipes(data || []);
        setPage(0);
      } else {
        setRecipes(prev => [...prev, ...(data || [])]);
      }
      setHasMore((data || []).length === ITEMS_PER_PAGE);
    }
    
    setLoading(false);
  };

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadRecipes(false);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleDietaryFilter = (diet: string) => {
    setFilters(prev => ({
      ...prev,
      dietary: prev.dietary.includes(diet)
        ? prev.dietary.filter(d => d !== diet)
        : [...prev.dietary, diet]
    }));
  };

  const clearFilters = () => {
    setFilters({
      dietary: [],
      cookTime: '',
      difficulty: '',
      cuisine: '',
      ingredients: ''
    });
  };

  const shareRecipe = async (recipeId: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this recipe on OmNom!',
          url: `${window.location.origin}/recipe/${recipeId}`
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/recipe/${recipeId}`);
      // You could show a toast notification here
    }
  };

  const dietaryOptions = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'keto', 'paleo'];
  const cuisineOptions = ['italian', 'mexican', 'asian', 'indian', 'mediterranean', 'american'];

    return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 pt-20">
      <AccessDeniedAlert />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Explore Recipes</h1>
          <p className="text-gray-600">
            {user ? 'Discover amazing recipes from our community' : 'Browse recipes and sign up to save your favorites'}
          </p>
          
          {!user && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800 text-sm">
                💡 <strong>Tip:</strong> Sign up to like, save, and create your own recipes!
              </p>
            </div>
          )}
        </div>

        {/* Search and Controls */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-orange-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes, ingredients, or tags..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>

            {/* Sort and Filter Controls */}
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="quickest">Quickest</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Dietary Restrictions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Restrictions
                  </label>
                  <div className="space-y-2">
                    {dietaryOptions.map((diet) => (
                      <label key={diet} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.dietary.includes(diet)}
                          onChange={() => toggleDietaryFilter(diet)}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-300"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{diet}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cook Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Cook Time
                  </label>
                  <select
                    value={filters.cookTime}
                    onChange={(e) => handleFilterChange('cookTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="">Any time</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="">Any difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {/* Cuisine Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuisine Type
                  </label>
                  <select
                    value={filters.cuisine}
                    onChange={(e) => handleFilterChange('cuisine', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="">Any cuisine</option>
                    {cuisineOptions.map((cuisine) => (
                      <option key={cuisine} value={cuisine} className="capitalize">
                        {cuisine}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ingredients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Must Include Ingredient
                  </label>
                  <input
                    type="text"
                    value={filters.ingredients}
                    onChange={(e) => handleFilterChange('ingredients', e.target.value)}
                    placeholder="e.g., chicken, tomato"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-2 text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Recipe Grid */}
        <div className="pb-20">
          {loading && recipes.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-80 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No recipes found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filters to find more recipes
              </p>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recipes.map((recipe) => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe}
                    onShare={() => shareRecipe(recipe.id)}
                  />
                ))}
              </div>

              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl h-80 animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!hasMore && recipes.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">You've reached the end! 🎉</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}