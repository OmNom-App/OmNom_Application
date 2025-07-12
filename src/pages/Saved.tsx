import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Star,
  Heart,
  Bookmark,
  Share2,
  SlidersHorizontal,
  X,
  Grid,
  List,
  ArrowLeft,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  ChefHat,
  Trash2,
  FolderPlus,
  Flag,
  CheckSquare,
  Square
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
import { RecipeCard } from '../components/RecipeCard';
import { format } from 'date-fns';

interface SavedRecipe {
  id: string;
  recipe_id: string;
  created_at: string;
  recipes: {
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
  };
}

interface Filters {
  search: string;
  cookingTime: string;
  cuisine: string;
  dietary: string[];
  difficulty: string;
  sortBy: string;
}

interface RecipeStats {
  totalRecipes: number;
  avgCookTime: number;
  topTags: { tag: string; count: number }[];
  topCreators: { name: string; count: number }[];
  difficultyBreakdown: { difficulty: string; count: number }[];
  cuisineBreakdown: { cuisine: string; count: number }[];
}

export function Saved() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [stats, setStats] = useState<RecipeStats | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    cookingTime: '',
    cuisine: '',
    dietary: [],
    difficulty: '',
    sortBy: 'newest'
  });

  const ITEMS_PER_PAGE = 12;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user) {
      loadSavedRecipes();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [savedRecipes, filters]);

  const loadSavedRecipes = async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('saves')
        .select(`
          id,
          recipe_id,
          created_at,
          recipes (
            id,
            title,
            ingredients,
            instructions,
            prep_time,
            cook_time,
            difficulty,
            tags,
            image_url,
            author_id,
            is_remix,
            created_at,
            profiles:author_id (
              display_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validSaves = (data || []).filter(save => save.recipes);
      setSavedRecipes(validSaves);
      calculateStats(validSaves);
    } catch (error) {
      console.error('Error loading saved recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (recipes: SavedRecipe[]) => {
    if (recipes.length === 0) {
      setStats(null);
      return;
    }

    const totalRecipes = recipes.length;
    const avgCookTime = recipes.reduce((sum, save) => 
      sum + save.recipes.prep_time + save.recipes.cook_time, 0) / totalRecipes;

    // Top tags
    const tagCounts: Record<string, number> = {};
    recipes.forEach(save => {
      save.recipes.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top creators
    const creatorCounts: Record<string, number> = {};
    recipes.forEach(save => {
      const creator = save.recipes.profiles?.display_name || 'Unknown Chef';
      creatorCounts[creator] = (creatorCounts[creator] || 0) + 1;
    });
    const topCreators = Object.entries(creatorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Difficulty breakdown
    const difficultyCounts: Record<string, number> = {};
    recipes.forEach(save => {
      const difficulty = save.recipes.difficulty;
      difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1;
    });
    const difficultyBreakdown = Object.entries(difficultyCounts)
      .map(([difficulty, count]) => ({ difficulty, count }));

    // Cuisine breakdown (from tags)
    const cuisines = ['italian', 'mexican', 'asian', 'indian', 'mediterranean', 'american'];
    const cuisineCounts: Record<string, number> = {};
    recipes.forEach(save => {
      save.recipes.tags.forEach(tag => {
        if (cuisines.includes(tag.toLowerCase())) {
          cuisineCounts[tag] = (cuisineCounts[tag] || 0) + 1;
        }
      });
    });
    const cuisineBreakdown = Object.entries(cuisineCounts)
      .map(([cuisine, count]) => ({ cuisine, count }))
      .sort((a, b) => b.count - a.count);

    setStats({
      totalRecipes,
      avgCookTime: Math.round(avgCookTime),
      topTags,
      topCreators,
      difficultyBreakdown,
      cuisineBreakdown
    });
  };

  const applyFilters = () => {
    let filtered = [...savedRecipes];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(save =>
        save.recipes.title.toLowerCase().includes(searchLower) ||
        save.recipes.ingredients.some(ingredient => 
          ingredient.toLowerCase().includes(searchLower)
        ) ||
        save.recipes.tags.some(tag => 
          tag.toLowerCase().includes(searchLower)
        )
      );
    }

    // Cooking time filter
    if (filters.cookingTime) {
      const maxTime = parseInt(filters.cookingTime);
      filtered = filtered.filter(save => 
        save.recipes.prep_time + save.recipes.cook_time <= maxTime
      );
    }

    // Cuisine filter
    if (filters.cuisine) {
      filtered = filtered.filter(save =>
        save.recipes.tags.some(tag => 
          tag.toLowerCase() === filters.cuisine.toLowerCase()
        )
      );
    }

    // Dietary filters
    if (filters.dietary.length > 0) {
      filtered = filtered.filter(save =>
        filters.dietary.every(diet =>
          save.recipes.tags.some(tag => 
            tag.toLowerCase() === diet.toLowerCase()
          )
        )
      );
    }

    // Difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(save => 
        save.recipes.difficulty === filters.difficulty
      );
    }

    // Sort
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.recipes.title.localeCompare(b.recipes.title));
        break;
      case 'quickest':
        filtered.sort((a, b) => 
          (a.recipes.prep_time + a.recipes.cook_time) - 
          (b.recipes.prep_time + b.recipes.cook_time)
        );
        break;
    }

    setFilteredRecipes(filtered);
  };

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
      search: '',
      cookingTime: '',
      cuisine: '',
      dietary: [],
      difficulty: '',
      sortBy: 'newest'
    });
  };

  const toggleRecipeSelection = (recipeId: string) => {
    setSelectedRecipes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  };

  const selectAllRecipes = () => {
    setSelectedRecipes(new Set(filteredRecipes.map(save => save.recipe_id)));
  };

  const clearSelection = () => {
    setSelectedRecipes(new Set());
  };

  const bulkUnsave = async () => {
    if (!user || selectedRecipes.size === 0) return;

    try {
      const { error } = await supabase
        .from('saves')
        .delete()
        .eq('user_id', user.id)
        .in('recipe_id', Array.from(selectedRecipes));

      if (error) throw error;

      // Update local state
      setSavedRecipes(prev => 
        prev.filter(save => !selectedRecipes.has(save.recipe_id))
      );
      setSelectedRecipes(new Set());
      setBulkMode(false);
    } catch (error) {
      console.error('Error bulk unsaving recipes:', error);
    }
  };

  const dietaryOptions = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'keto', 'paleo'];
  const cuisineOptions = ['italian', 'mexican', 'asian', 'indian', 'mediterranean', 'american'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-80 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Saved Recipes</h1>
              <p className="text-gray-600">
                {filteredRecipes.length} of {savedRecipes.length} recipes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                showStats ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Stats</span>
            </button>
            
            {savedRecipes.length > 0 && (
              <button
                onClick={() => setBulkMode(!bulkMode)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  bulkMode ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CheckSquare className="w-5 h-5" />
                <span>Select</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && stats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-orange-100 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recipe Statistics</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Overview Stats */}
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-orange-800 font-medium">Total Recipes</span>
                  <Bookmark className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-900">{stats.totalRecipes}</div>
              </div>

              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-800 font-medium">Avg Cook Time</span>
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900">{stats.avgCookTime} min</div>
              </div>

              {/* Top Tags */}
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-800 font-medium">Top Tags</span>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="space-y-1">
                  {stats.topTags.slice(0, 3).map((tag, index) => (
                    <div key={tag.tag} className="flex justify-between text-sm">
                      <span className="text-green-800">#{tag.tag}</span>
                      <span className="text-green-600">{tag.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty Breakdown */}
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-800 font-medium">Difficulty</span>
                  <PieChart className="w-5 h-5 text-purple-600" />
                </div>
                <div className="space-y-1">
                  {stats.difficultyBreakdown.map((item) => (
                    <div key={item.difficulty} className="flex justify-between text-sm">
                      <span className="text-purple-800">{item.difficulty}</span>
                      <span className="text-purple-600">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Creators */}
            {stats.topCreators.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Top Recipe Creators</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.topCreators.map((creator) => (
                    <div key={creator.name} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <ChefHat className="w-4 h-4 text-gray-600 mr-2" />
                        <span className="text-gray-800">{creator.name}</span>
                      </div>
                      <span className="text-gray-600 font-medium">{creator.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {savedRecipes.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved recipes yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start building your recipe collection by saving recipes you love. 
              Explore our community to find amazing dishes!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/explore')}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Explore Recipes
              </button>
              <button
                onClick={() => navigate('/create')}
                className="border border-orange-500 text-orange-500 px-6 py-3 rounded-lg hover:bg-orange-50 transition-colors"
              >
                Create Recipe
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Search and Controls */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-orange-100 mb-8">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search saved recipes..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-4">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="newest">Recently Saved</option>
                    <option value="oldest">Oldest First</option>
                    <option value="alphabetical">A-Z</option>
                    <option value="quickest">Quickest First</option>
                  </select>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                    <span>Filters</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-orange-100 text-orange-600'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list'
                          ? 'bg-orange-100 text-orange-600'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
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
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Cooking Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Cook Time
                      </label>
                      <select
                        value={filters.cookingTime}
                        onChange={(e) => handleFilterChange('cookingTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                      >
                        <option value="">Any time</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>

                    {/* Cuisine */}
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

                  {/* Dietary Restrictions */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dietary Restrictions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {dietaryOptions.map((diet) => (
                        <button
                          key={diet}
                          onClick={() => toggleDietaryFilter(diet)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            filters.dietary.includes(diet)
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {diet}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Bulk Actions */}
              {bulkMode && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {selectedRecipes.size} recipes selected
                      </span>
                      <button
                        onClick={selectAllRecipes}
                        className="text-sm text-blue-500 hover:text-blue-600"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearSelection}
                        className="text-sm text-gray-500 hover:text-gray-600"
                      >
                        Clear Selection
                      </button>
                    </div>
                    
                    {selectedRecipes.size > 0 && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={bulkUnsave}
                          className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Unsave Selected</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recipe Grid/List */}
            <div className="pb-20">
              {filteredRecipes.length === 0 ? (
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
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredRecipes.map((save) => (
                    <div key={save.id} className="relative">
                      {bulkMode && (
                        <button
                          onClick={() => toggleRecipeSelection(save.recipe_id)}
                          className="absolute top-2 left-2 z-10 bg-white rounded-full p-1 shadow-md"
                        >
                          {selectedRecipes.has(save.recipe_id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-500" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      )}
                      <RecipeCard 
                        recipe={save.recipes}
                        onShare={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: save.recipes.title,
                              url: `${window.location.origin}/recipe/${save.recipes.id}`
                            });
                          }
                        }}
                      />
                      <div className="absolute bottom-2 right-2 bg-white rounded-full px-2 py-1 text-xs text-gray-500 shadow-sm">
                        Saved {format(new Date(save.created_at), 'MMM d')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecipes.map((save) => (
                    <div
                      key={save.id}
                      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        {bulkMode && (
                          <button
                            onClick={() => toggleRecipeSelection(save.recipe_id)}
                            className="flex-shrink-0"
                          >
                            {selectedRecipes.has(save.recipe_id) ? (
                              <CheckSquare className="w-5 h-5 text-blue-500" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        )}
                        
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {save.recipes.image_url ? (
                            <img
                              src={save.recipes.image_url}
                              alt={save.recipes.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-2xl">🍽️</div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 truncate">
                            {save.recipes.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            By {save.recipes.profiles?.display_name || 'Unknown Chef'} • 
                            {save.recipes.prep_time + save.recipes.cook_time} mins • 
                            {save.recipes.difficulty}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Saved {format(new Date(save.created_at), 'MMM d, yyyy')}</span>
                            <div className="flex space-x-2">
                              {save.recipes.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}