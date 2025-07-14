import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  User, 
  Heart, 
  Bookmark, 
  LogOut, 
  Menu, 
  X,
  ChefHat,
  Settings
} from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';

export function Navbar() {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    console.log('🔄 Logout button clicked');
    
    // Close mobile menu immediately
    setIsMenuOpen(false);
    
    // Add timeout to prevent hanging
    const logoutTimeout = setTimeout(() => {
      console.log('⚠️ Logout timeout reached, forcing redirect');
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }, 5000); // 5 second timeout
    
    try {
      const { error } = await signOut();
      
      clearTimeout(logoutTimeout);
      
      if (error) {
        console.error('❌ Sign out failed:', error);
        // Force clear any local state and redirect
        window.location.href = '/';
        return;
      }
      
      console.log('✅ Sign out successful');
      // Navigate to home page after successful logout
      navigate('/');
      
    } catch (err) {
      clearTimeout(logoutTimeout);
      console.error('❌ Unexpected error during logout:', err);
      // Force redirect to home and clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/90 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center"
            >
              <ChefHat className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              OmNom
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          {user && (
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                />
              </div>
            </form>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/create">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create</span>
                  </motion.button>
                </Link>
                <Link to="/explore">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    <span>Explore</span>
                  </motion.button>
                </Link>
                <Link to="/saved">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Bookmark className="w-6 h-6 text-gray-600 hover:text-orange-500 transition-colors" />
                  </motion.div>
                </Link>
                <Link to="/profile">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <User className="w-6 h-6 text-gray-600 hover:text-orange-500 transition-colors" />
                  </motion.div>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-6 h-6" />
                </motion.button>
              </>
            ) : (
              <>
                <Link to="/explore">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Search className="w-6 h-6 text-gray-600 hover:text-orange-500 transition-colors" />
                  </motion.div>
                </Link>
                <Link to="/signup">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors"
                  >
                    Sign Up
                  </motion.button>
                </Link>
                <Link to="/pricing">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-gray-600 hover:text-orange-500 transition-colors px-4 py-2"
                  >
                    Pricing
                  </motion.button>
                </Link>
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-gray-600 hover:text-orange-500 transition-colors px-4 py-2"
                  >
                    Login
                  </motion.button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 space-y-4"
          >
            {/* Mobile Search */}
            {user && (
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search recipes..."
                    className="w-full pl-10 pr-4 py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                  />
                </div>
              </form>
            )}

            {user ? (
              <div className="space-y-2">
                <Link to="/create" className="flex items-center space-x-2 p-3">
                  <Plus className="w-5 h-5" />
                  <span>Create Recipe</span>
                </Link>
                <Link to="/explore" className="flex items-center space-x-2 p-3">
                  <Search className="w-5 h-5" />
                  <span>Explore Recipes</span>
                </Link>
                <Link to="/saved" className="flex items-center space-x-2 p-3">
                  <Bookmark className="w-5 h-5" />
                  <span>Saved Recipes</span>
                </Link>
                <Link to="/profile" className="flex items-center space-x-2 p-3">
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <Link to="/settings" className="flex items-center space-x-2 p-3">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
                <button onClick={handleSignOut} className="flex items-center space-x-2 p-3 text-red-500">
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to="/signup" className="block p-3 bg-orange-500 text-white rounded-lg text-center">
                  Sign Up
                </Link>
                <Link to="/pricing" className="block p-3">Pricing</Link>
                <Link to="/login" className="block p-3">Login</Link>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}