import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  Edit3, 
  Heart, 
  Bookmark, 
  Clock, 
  ChefHat,
  Grid,
  List,
  ArrowLeft,
  Settings,
  Share2,
  Upload,
  X,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';

import { RecipeCard } from '../components/RecipeCard';
import { Modal } from '../components/Modal';
import { FollowButton } from '../components/FollowButton';
import { FollowedUsers } from '../components/FollowedUsers';
import { format } from 'date-fns';

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

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
  original_recipe_id: string | null;
  is_remix: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
  like_count: number;
  save_count?: number;
}

export function Profile() {
  const { userId } = useParams();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [createdRecipes, setCreatedRecipes] = useState<Recipe[]>([]);
  const [remixedRecipes, setRemixedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [createdLoading, setCreatedLoading] = useState(false);
  const [remixedLoading, setRemixedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'created' | 'remixed'>('created');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createdPage, setCreatedPage] = useState(0);
  const [remixedPage, setRemixedPage] = useState(0);
  const [createdHasMore, setCreatedHasMore] = useState(true);
  const [remixedHasMore, setRemixedHasMore] = useState(true);
  const [error, setError] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const ITEMS_PER_PAGE = 12;
  const profileId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  // Removed periodic session check to prevent constant re-initialization

  useEffect(() => {
    // Scroll to top when profile ID changes
    window.scrollTo(0, 0);
    
    if (profileId) {
      loadProfile();
      loadCreatedRecipes(true);
      loadRemixedRecipes(true);
    }
  }, [profileId]);

  const loadProfile = async () => {
    if (!profileId) return;

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;
      setProfile(data);

      // Load follower and following counts
      const [followerResult, followingResult] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profileId),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profileId)
      ]);

      setFollowerCount(followerResult.count || 0);
      setFollowingCount(followingResult.count || 0);
    } catch (err: any) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadCreatedRecipes = async (reset = false) => {
    if (!profileId) return;

    setCreatedLoading(true);
    const currentPage = reset ? 0 : createdPage;

    try {
      let query = supabase
        .from('recipes')
        .select(`
          *,
          profiles:author_id (
            display_name,
            avatar_url
          )
        `)
        .eq('author_id', profileId);

      // Only get created recipes (not remixed)
      query = query.eq('is_remix', false);

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      // Use like_count from database and get save counts
      const recipesWithCounts = await Promise.all(
        (data || []).map(async (recipe) => {
          const saveResult = await supabase
            .from('saves')
            .select('*', { count: 'exact', head: true })
            .eq('recipe_id', recipe.id);

          return {
            ...recipe,
            like_count: recipe.like_count || 0,
            save_count: saveResult.count || 0
          };
        })
      );

      if (reset) {
        setCreatedRecipes(recipesWithCounts);
        setCreatedPage(0);
      } else {
        setCreatedRecipes(prev => [...prev, ...recipesWithCounts]);
      }

      setCreatedHasMore((data || []).length === ITEMS_PER_PAGE);
    } catch (err: any) {
      setError('Failed to load recipes');
    } finally {
      setCreatedLoading(false);
    }
  };

  const loadRemixedRecipes = async (reset = false) => {
    if (!profileId) return;

    setRemixedLoading(true);
    const currentPage = reset ? 0 : remixedPage;

    try {
      let query = supabase
        .from('recipes')
        .select(`
          *,
          profiles:author_id (
            display_name,
            avatar_url
          )
        `)
        .eq('author_id', profileId);

      // Only get remixed recipes
      query = query.eq('is_remix', true);

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      // Use like_count from database and get save counts
      const recipesWithCounts = await Promise.all(
        (data || []).map(async (recipe) => {
          const saveResult = await supabase
            .from('saves')
            .select('*', { count: 'exact', head: true })
            .eq('recipe_id', recipe.id);

          return {
            ...recipe,
            like_count: recipe.like_count || 0,
            save_count: saveResult.count || 0
          };
        })
      );

      if (reset) {
        setRemixedRecipes(recipesWithCounts);
        setRemixedPage(0);
      } else {
        setRemixedRecipes(prev => [...prev, ...recipesWithCounts]);
      }

      setRemixedHasMore((data || []).length === ITEMS_PER_PAGE);
    } catch (err: any) {
      setError('Failed to load remixed recipes');
    } finally {
      setRemixedLoading(false);
    }
  };

  const loadMoreCreated = () => {
    if (!createdLoading && createdHasMore) {
      setCreatedPage(prev => prev + 1);
      loadCreatedRecipes(false);
    }
  };

  const loadMoreRemixed = () => {
    if (!remixedLoading && remixedHasMore) {
      setRemixedPage(prev => prev + 1);
      loadRemixedRecipes(false);
    }
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return;

    setUploadingAvatar(true);
    setError('');

    try {
      // Prepare file path
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) {
        throw new Error('Failed to upload avatar');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        setError('Failed to get public URL for avatar.');
        return;
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error('Failed to update profile');
      }

      // Update local state only if everything succeeded
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
      setShowAvatarModal(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err: any) {
      setError('Failed to upload avatar: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const shareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${profileId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.display_name}'s Profile on OmNom`,
          url: profileUrl
        });
          } catch (error) {
      // Silent error handling
    }
    } else {
      navigator.clipboard.writeText(profileUrl);
      // You could show a toast notification here
    }
  };

  // Get current recipes and loading state based on active tab
  const currentRecipes = activeTab === 'created' ? createdRecipes : remixedRecipes;
  const currentLoading = activeTab === 'created' ? createdLoading : remixedLoading;
  const currentHasMore = activeTab === 'created' ? createdHasMore : remixedHasMore;
  const loadMore = activeTab === 'created' ? loadMoreCreated : loadMoreRemixed;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h3>
            <p className="text-gray-600 mb-6">
              {error || "The profile you're looking for doesn't exist."}
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

  const createdCount = createdRecipes.length;
  const remixedCount = remixedRecipes.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/explore')}
          className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Explore</span>
        </motion.button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-orange-100 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
                )}
              </div>
              {isOwnProfile && (
                <button 
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 sm:mb-0">
                  {profile.display_name}
                </h1>
                <div className="flex items-center space-x-2">
                  <FollowButton targetUserId={profile.id} />
                  <button
                    onClick={shareProfile}
                    className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                  {isOwnProfile && (
                    <button 
                      onClick={() => navigate('/settings')}
                      className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                      <span>Settings</span>
                    </button>
                  )}
                </div>
              </div>

              {profile.bio && (
                <p className="text-gray-600 mb-4 max-w-2xl">{profile.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
                </div>
                <div className="flex items-center">
                  <ChefHat className="w-4 h-4 mr-2" />
                  <span>{createdRecipes.length + remixedRecipes.length} recipes</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{followerCount} followers • {followingCount} following</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Followed Users Section (only for own profile) */}
        {isOwnProfile && (
          <FollowedUsers userId={profile.id} className="mb-8" />
        )}

        {/* Recipe Collections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100"
        >
          {/* Tabs and Controls */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('created')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'created'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Created Recipes ({createdCount})
                </button>
                <button
                  onClick={() => setActiveTab('remixed')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'remixed'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Remixed Recipes ({remixedCount})
                </button>
              </div>

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

          {/* Recipe Grid/List */}
          <div className="p-6">
            {(createdLoading || remixedLoading) && currentRecipes.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : currentRecipes.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">👨‍🍳</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No {activeTab} recipes yet
                </h3>
                <p className="text-gray-600 mb-6">
                  {isOwnProfile
                    ? `Start ${activeTab === 'created' ? 'creating' : 'remixing'} recipes to see them here!`
                    : `${profile.display_name} hasn't ${activeTab} any recipes yet.`
                  }
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/create')}
                    className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Create Recipe
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentRecipes.map((recipe) => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe}
                      onLike={async (recipeId, newLikeCount) => {
                        // Fetch the latest recipe from Supabase
                        const { data: updatedRecipe } = await supabase
                          .from('recipes')
                          .select('*')
                          .eq('id', recipeId)
                          .single();
                        if (updatedRecipe) {
                          if (activeTab === 'created') {
                            setCreatedRecipes(prev => 
                              prev.map(r => 
                                r.id === recipeId 
                                  ? { ...r, ...updatedRecipe }
                                  : r
                              )
                            );
                          } else {
                            setRemixedRecipes(prev => 
                              prev.map(r => 
                                r.id === recipeId 
                                  ? { ...r, ...updatedRecipe }
                                  : r
                              )
                            );
                          }
                        }
                      }}
                    />
                  ))}
                </div>

                {currentHasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={loadMore}
                      disabled={currentLoading}
                      className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                      {currentLoading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {currentRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {recipe.image_url ? (
                          <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-2xl">🍽️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 truncate">
                          {recipe.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {recipe.ingredients.length} ingredients • {recipe.prep_time + recipe.cook_time} mins
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            <span>{recipe.like_count || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <Bookmark className="w-4 h-4 mr-1" />
                            <span>{recipe.save_count || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{format(new Date(recipe.created_at), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Avatar Upload Modal */}
        <Modal
          isOpen={showAvatarModal}
          onClose={() => {
            setShowAvatarModal(false);
            setAvatarFile(null);
            setAvatarPreview(null);
            setError('');
          }}
          title="Update Profile Picture"
        >
          <div className="space-y-6">
            {/* Current Avatar */}
            <div className="text-center">
              <div className="inline-block relative">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {avatarPreview ? 'New avatar preview' : 'Current avatar'}
              </p>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-2 block">
                  Choose an image
                </span>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="avatar-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="avatar-upload"
                          name="avatar-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>
              </label>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowAvatarModal(false);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={uploadAvatar}
                  disabled={!avatarFile || uploadingAvatar}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}