// Austin: Updated CreatePost with real user data and post creation logic
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useZkLogin } from '../zklogin/useZkLogin';
import { API_ENDPOINTS } from '../config/api';

// Austin: Interface for user profile
interface UserProfile {
  objectId: string;
  username: string;
  imageUrl?: string;
}

export const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { userAddress: zkLoginAddress, decodedJWT } = useZkLogin();
  
  // Austin: State management
  const [content, setContent] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Austin: Determine current user
  const userAddress = currentAccount?.address || zkLoginAddress;
  
  // Austin: Get display name
  const getDisplayName = () => {
    if (profile?.username) return profile.username;
    if (decodedJWT?.name) return decodedJWT.name;
    if (userAddress) return `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    return 'User';
  };

  // Austin: Get profile image
  const getProfileImage = () => {
    if (profile?.imageUrl) return profile.imageUrl;
    if (decodedJWT?.picture) return decodedJWT.picture;
    return `https://ui-avatars.com/api/?name=${getDisplayName()}&background=random`;
  };

  // Austin: Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userAddress) return;
      
      try {
        const response = await fetch(API_ENDPOINTS.profile(userAddress));
        
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setProfile({
              objectId: data.profile.objectId,
              username: data.profile.username,
              imageUrl: data.profile.image_url,
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };

    fetchProfile();
  }, [userAddress]);

  // Austin: Handle post creation
  const handleCreatePost = async () => {
    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    if (!userAddress) {
      setError('Please connect your wallet or login with zkLogin');
      return;
    }

    if (!profile?.objectId) {
      setError('Profile not found. Please create a profile first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.createPost, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId: profile.objectId,
          userAddress: userAddress,
          content: content.trim(),
          imageUrl: '', // Can be extended for image uploads
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      const result = await response.json();
      console.log('✅ Post created successfully:', result);

      // Reset form and navigate back to feed
      setContent('');
      navigate('/feed');
    } catch (err) {
      console.error('❌ Failed to create post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  // Austin: Character count (optional limit)
  const maxLength = 280;
  const remainingChars = maxLength - content.length;

  return (
    <div className="relative flex h-auto min-h-[500px] w-full flex-col items-center justify-start p-4 pt-10">
      
      {/* Austin: Modal/Card Container */}
      <div className="w-full max-w-xl rounded-xl bg-white dark:bg-[#1a2935] shadow-lg text-slate-800 dark:text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4">
          <h2 className="text-xl font-bold">Create Post</h2>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            disabled={loading}
          >
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">close</span>
          </button>
        </div>
        
        {/* Austin: Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {/* Composer Section */}
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Austin: Real User Avatar */}
            <div className="flex-shrink-0">
              <div 
                className="h-10 w-10 rounded-full bg-cover bg-center" 
                style={{ backgroundImage: `url('${getProfileImage()}')` }}
              ></div>
            </div>
            {/* Text Input Area */}
            <div className="flex w-full flex-col">
              <textarea 
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden border-0 bg-transparent text-lg text-slate-900 placeholder:text-slate-500 focus:outline-0 focus:ring-0 dark:text-white dark:placeholder:text-slate-400 p-0" 
                placeholder="What's happening?" 
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={maxLength}
                disabled={loading}
              ></textarea>
              {/* Austin: Character counter */}
              <div className="flex justify-end mt-2">
                <span className={`text-sm ${remainingChars < 20 ? 'text-red-500' : 'text-slate-400'}`}>
                  {remainingChars} characters remaining
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 p-4">
          {/* Action Icons Toolbar */}
          <div className="flex items-center gap-1">
            <button 
              className="flex items-center justify-center rounded-full p-2 text-primary hover:bg-primary/10"
              disabled={loading}
              title="Add image (coming soon)"
            >
              <span className="material-symbols-outlined">image</span>
            </button>
            <button 
              className="flex items-center justify-center rounded-full p-2 text-primary hover:bg-primary/10"
              disabled={loading}
              title="Add GIF (coming soon)"
            >
              <span className="material-symbols-outlined">gif_box</span>
            </button>
            <button 
              className="flex items-center justify-center rounded-full p-2 text-primary hover:bg-primary/10"
              disabled={loading}
              title="Add poll (coming soon)"
            >
              <span className="material-symbols-outlined">poll</span>
            </button>
            <button 
              className="flex items-center justify-center rounded-full p-2 text-primary hover:bg-primary/10"
              disabled={loading}
              title="Add emoji (coming soon)"
            >
              <span className="material-symbols-outlined">sentiment_satisfied</span>
            </button>
          </div>
          
          {/* Austin: Post Button with loading state */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handleCreatePost}
              disabled={loading || !content.trim() || !profile}
              className="min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-9 px-5 bg-primary text-white text-sm font-bold leading-normal disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 flex"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg mr-2">progress_activity</span>
                  <span className="truncate">Posting...</span>
                </>
              ) : (
                <span className="truncate">Post</span>
              )}
            </button>
          </div>
        </div>
        
        {/* Austin: Profile warning if no profile */}
        {!profile && userAddress && (
          <div className="mx-4 mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-700 rounded-lg">
            <p className="text-yellow-700 dark:text-yellow-400 text-sm">
              You need to create a profile before posting. 
              <button 
                onClick={() => navigate('/feed')}
                className="ml-2 underline hover:no-underline"
              >
                Go to feed to create one
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePost;
