import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Loader2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface FollowedUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface FollowedUsersProps {
  userId: string;
  className?: string;
}

export function FollowedUsers({ userId, className = '' }: FollowedUsersProps) {
  const { user } = useAuthContext();
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFollowedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles!follows_following_id_fkey (
            id,
            display_name,
            avatar_url,
            bio,
            created_at
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const users = data?.map(follow => follow.profiles).filter(Boolean) || [];
      setFollowedUsers(users as unknown as FollowedUser[]);
    } catch (err: unknown) {
      console.error('Error loading followed users:', err);
      setError('Failed to load followed users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.id === userId) {
      loadFollowedUsers();
    }
  }, [userId, user?.id]);

  // Only show for own profile
  if (!user || user.id !== userId) {
    return null;
  }

  if (loading) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-semibold text-gray-900">Following</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-semibold text-gray-900">Following</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100 p-6 ${className}`}
    >
      <div className="flex items-center space-x-3 mb-6">
        <Users className="w-6 h-6 text-orange-500" />
        <h2 className="text-xl font-semibold text-gray-900">Following ({followedUsers.length})</h2>
      </div>

      {followedUsers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Not following anyone yet</h3>
          <p className="text-gray-600 mb-4">
            Start following other chefs to see their recipes in your feed!
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <span>Explore Chefs</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {followedUsers.map((user) => (
            <Link
              key={user.id}
              to={`/profile/${user.id}`}
              className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {user.display_name}
                </h3>
                {user.bio && (
                  <p className="text-sm text-gray-600 truncate">
                    {user.bio}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
} 