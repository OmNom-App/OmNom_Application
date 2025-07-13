import React, { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';

interface FollowButtonProps {
  targetUserId: string;
  className?: string;
}

export function FollowButton({ targetUserId, className = '' }: FollowButtonProps) {
  const { user } = useAuthContext();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const checkFollowStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking follow status:', error);
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.id !== targetUserId) {
      checkFollowStatus();
    }
  }, [targetUserId, user?.id]);

  // Don't show follow button if user is viewing their own profile
  if (!user || user.id === targetUserId) {
    return null;
  }

  const handleFollow = async () => {
    if (!user || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
        setIsFollowing(false);
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });

        if (error) throw error;
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className={`flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={followLoading}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        isFollowing
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-orange-500 text-white hover:bg-orange-600'
      } ${className}`}
    >
      {followLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      <span>
        {followLoading
          ? 'Loading...'
          : isFollowing
          ? 'Unfollow'
          : 'Follow'}
      </span>
    </button>
  );
} 