import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Auth } from './pages/Auth';
import { CreateRecipe } from './pages/CreateRecipe';
import { EditRecipe } from './pages/EditRecipe';
import { RecipeDetail } from './pages/RecipeDetail';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Saved } from './pages/Saved';
import { Pricing } from './pages/Pricing';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

function AppContent() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/create" element={
            <ProtectedRoute>
              <CreateRecipe />
            </ProtectedRoute>
          } />
          <Route path="/edit-recipe/:id" element={
            <ProtectedRoute>
              <EditRecipe />
            </ProtectedRoute>
          } />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/saved" element={
            <ProtectedRoute>
              <Saved />
            </ProtectedRoute>
          } />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;