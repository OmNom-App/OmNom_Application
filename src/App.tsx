import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Pricing } from './pages/Pricing';
import { CreateRecipe } from './pages/CreateRecipe';
import { EditRecipe } from './pages/EditRecipe';
import { Explore } from './pages/Explore';
import { Profile } from './pages/Profile';
import { Saved } from './pages/Saved';
import { RecipeDetail } from './pages/RecipeDetail';

function AppContent() {  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        
        {/* Auth routes - redirect if already authenticated */}
        <Route 
          path="/login" 
          element={
            <ProtectedRoute requireAuth={false}>
              <Auth mode="login" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <ProtectedRoute requireAuth={false}>
              <Auth mode="signup" />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected routes - require authentication */}
        <Route 
          path="/explore" 
          element={
            <ProtectedRoute>
              <Explore />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create" 
          element={
            <ProtectedRoute>
              <CreateRecipe />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/edit-recipe/:id" 
          element={
            <ProtectedRoute>
              <EditRecipe />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/recipe/:id" 
          element={
            <ProtectedRoute>
              <RecipeDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile/:userId?" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/saved" 
          element={
            <ProtectedRoute>
              <Saved />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;