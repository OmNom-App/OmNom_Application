import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Heart, 
  Bookmark, 
  Users, 
  Clock, 
  Star,
  ChefHat,
  Sparkles,
  Shield,
  Zap,
  Share2,
  Calendar,
  Filter,
  ArrowRight,
  Quote
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
import { ParticleBackground } from '../components/ParticleBackground';

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

export function Home() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedRecipes();
  }, []);

  const loadFeaturedRecipes = async () => {
    setLoading(true);
    console.log('🔍 Loading featured recipes...');
    
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        profiles:author_id (
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('❌ Error loading featured recipes:', error);
    } else {
      console.log('✅ Featured recipes loaded:', data?.length || 0, 'recipes');
      setFeaturedRecipes(data || []);
    }
    
    setLoading(false);
  };

  const handleRecipeClick = (recipeId: string) => {
    if (!user) {
      // Show a more informative message and provide clear call-to-action
      const shouldSignUp = window.confirm(
        'Sign up to view full recipe details, save favorites, and create your own recipes!'
      );
      if (shouldSignUp) {
        navigate('/signup');
      }
    } else {
      navigate(`/recipe/${recipeId}`);
    }
  };

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Home Cook",
      content: "OmNom transformed my cooking! The ad-free experience and recipe remixing feature helped me discover my passion for fusion cuisine.",
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    },
    {
      name: "Marcus Rodriguez",
      role: "Food Blogger",
      content: "Finally, a recipe platform that puts the food first! No distractions, just pure culinary inspiration and an amazing community.",
      avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    },
    {
      name: "Emily Johnson",
      role: "Busy Parent",
      content: "The clean interface and quick search make meal planning so much easier. My family loves the variety of recipes I've discovered!",
      avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    }
  ];

  const features = [
    {
      icon: ChefHat,
      title: "Recipe Management",
      description: "Create, edit, and organize your recipes with our intuitive interface",
      visual: "🍳"
    },
    {
      icon: Calendar,
      title: "Meal Planning",
      description: "Plan your weekly meals and generate shopping lists automatically",
      visual: "📅"
    },
    {
      icon: Sparkles,
      title: "Personalization",
      description: "Get recipe recommendations based on your preferences and dietary needs",
      visual: "✨"
    },
    {
      icon: Share2,
      title: "Recipe Sharing",
      description: "Share your culinary creations and discover recipes from the community",
      visual: "🤝"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 relative">
      <ParticleBackground />
      
      {/* Hero Section */}
      <div className="relative z-10 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Cook Without
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent block">
              Distractions
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
          >
            Join our ad-free community of food lovers. Discover, create, and share amazing recipes 
            in a clean, distraction-free environment designed for passionate cooks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link to={user ? "/explore" : "/signup"}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200 flex items-center"
              >
                {user ? "Explore Recipes" : "Start Cooking Free"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
            </Link>
            
            <Link to="/pricing">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-orange-500 text-orange-500 px-8 py-4 rounded-full font-semibold text-lg hover:bg-orange-50 transition-all duration-200"
              >
                View Pricing
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6 text-sm text-gray-600"
          >
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-green-500" />
              <span>Ad-Free Forever</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-500" />
              <span>Community Driven</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 mr-2 text-yellow-500" />
              <span>Lightning Fast</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Featured Recipes */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Recipes</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover amazing recipes from our community of passionate cooks
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-80 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                onClick={() => handleRecipeClick(recipe.id)}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
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
                  
                  {!user && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="text-center text-white">
                        <p className="font-semibold mb-2">Sign in to view recipe details</p>
                        <p className="text-sm opacity-90">Create an account to save favorites</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="font-semibold text-xl text-gray-900 mb-2 line-clamp-2">
                    {recipe.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    A delicious recipe with {recipe.ingredients.length} ingredients, 
                    ready in {recipe.prep_time + recipe.cook_time} minutes.
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{recipe.prep_time + recipe.cook_time} mins</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{recipe.profiles?.display_name || 'Chef'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link to={user ? "/explore" : "/signup"}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-3 rounded-full font-semibold hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
            >
              {user ? "View All Recipes" : "Sign Up to See More"}
            </motion.button>
          </Link>
        </div>
      </div>

      {/* About Section */}
      <div className="relative z-10 bg-white/70 backdrop-blur-sm py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose OmNom?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're revolutionizing the way people discover and share recipes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ad-Free Experience</h3>
              <p className="text-gray-600">
                Cook without distractions. No ads, no pop-ups, just pure culinary inspiration.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Driven</h3>
              <p className="text-gray-600">
                Connect with passionate cooks, share recipes, and learn from each other.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Features</h3>
              <p className="text-gray-600">
                Intelligent recipe recommendations, meal planning, and personalized cooking experience.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to elevate your cooking experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-6"
                >
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl flex items-center justify-center text-4xl">
                      {feature.visual}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                      <IconComponent className="w-5 h-5 mr-2 text-orange-500" />
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="relative z-10 bg-white/70 backdrop-blur-sm py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Community Says</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of happy cooks who've transformed their kitchen experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <Quote className="w-8 h-8 text-orange-500 mb-4" />
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-12 text-white"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Start Cooking?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join our community today and discover your next favorite recipe
            </p>
            <Link to={user ? "/explore" : "/signup"}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-orange-500 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all duration-200 flex items-center mx-auto"
              >
                {user ? "Explore Recipes" : "Get Started Free"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}