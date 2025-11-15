import React, { useEffect, useRef, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useZkLogin } from '../zklogin/useZkLogin';
import { API_ENDPOINTS } from '../config/api';

// Austin: Kept all existing types and interfaces unchanged
interface FeedPost {
  id: string;
  content: string;
  author: string;
  authorName?: string;
  authorAvatar?: string;
  timestamp: string;
  likes: number;
}

// Austin: Interface for user profile
interface UserProfile {
  objectId: string;
  username: string;
  imageUrl?: string;
}

export const Feed: React.FC = () => {
  // Austin: Get current user data
  const currentAccount = useCurrentAccount();
  const { userAddress: zkLoginAddress, decodedJWT } = useZkLogin();
  const userAddress = currentAccount?.address || zkLoginAddress;

  // Austin: Preserved all existing state and logic
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Austin: New state for post composer
  const [newPostContent, setNewPostContent] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Austin: Fetch user profile
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

  // Austin: Kept the exact same data fetching logic
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.posts);

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        const postsData = data.data || [];

        const transformed: FeedPost[] = postsData.map((post: any) => ({
          id: post.objectId,
          content: post.content,
          author: post.author_address,
          authorName: post.author_username || post.author_address,
          authorAvatar: post.author_image_url || undefined,
          timestamp: new Date(Number(post.created_at_ms)).toISOString(),
          likes: post.like_count || 0,
        }));

        setPosts(transformed);
        setError(null);
      } catch (err) {
        console.error('Failed to load feed posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  // Austin: New handler for creating posts in the feed composer
  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !profile || !userAddress) return;

    setPostLoading(true);
    setPostError(null);

    try {
      let walrusImageUrl = '';
      
      // Austin: Upload image to Walrus if one is selected
      if (imageDataUrl) {
        try {
          // Convert base64 data URL to blob
          const response = await fetch(imageDataUrl);
          const blob = await response.blob();
          
          // Upload to Walrus via backend
          const formData = new FormData();
          formData.append('image', blob, imageFileName || 'image.jpg');
          
          const uploadResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/upload-image`, {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image to Walrus');
          }
          
          const uploadData = await uploadResponse.json();
          walrusImageUrl = uploadData.imageUrl || '';
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr);
          setPostError('Failed to upload image. Please try again.');
          setPostLoading(false);
          return;
        }
      }

      const response = await fetch(API_ENDPOINTS.createPost, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.objectId,
          userAddress: userAddress,
          content: newPostContent,
          imageUrl: walrusImageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      // Austin: Clear content and refresh posts after successful creation
      setNewPostContent('');
      clearSelectedImage();
      
      // Austin: Reload posts to show the new post
      const postsResponse = await fetch(API_ENDPOINTS.posts);
      if (postsResponse.ok) {
        const data = await postsResponse.json();
        const postsData = data.data || [];
        const transformed: FeedPost[] = postsData.map((post: any) => ({
          id: post.objectId,
          content: post.content,
          author: post.author_address,
          authorName: post.author_username || post.author_address,
          authorAvatar: post.author_image_url || undefined,
          timestamp: new Date(Number(post.created_at_ms)).toISOString(),
          likes: post.like_count || 0,
        }));
        setPosts(transformed);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setPostError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setPostLoading(false);
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      clearSelectedImage();
      return;
    }

    setImageFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setImageDataUrl(null);
    setImageFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Austin: Updated only the rendering, kept the same conditional logic
  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-8 flex justify-center">
          <span className="material-symbols-outlined text-primary text-3xl animate-spin">
            progress_activity
          </span>
        </div>
      );
    }

    if (error) {
      return <div className="p-4 text-red-500">Failed to load posts: {error}</div>;
    }

    if (posts.length === 0) {
      return <div className="p-4 text-slate-500 dark:text-slate-400">No posts yet. Be the first to share something!</div>;
    }

    return (
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {posts.map((post) => (
          <article key={post.id} className="p-4 flex gap-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
            <div className="shrink-0">
              <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12" 
                style={{ backgroundImage: `url(${post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName}&background=random`})` }}
              ></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-black dark:text-white text-base font-bold leading-normal">{post.authorName || 'Anonymous'}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal">
                    @{post.author.slice(0, 6)}...{post.author.slice(-4)} · {new Date(post.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <button className="flex items-center justify-center size-8 rounded-full text-slate-500 dark:text-slate-400 hover:bg-primary/10 hover:text-primary">
                  <span className="material-symbols-outlined text-xl">more_horiz</span>
                </button>
              </div>
              <p className="text-black dark:text-white text-base font-normal leading-normal mt-1">
                {post.content}
              </p>
              <div className="flex flex-wrap gap-4 mt-3 justify-between max-w-sm">
                <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary group">
                  <div className="p-2 rounded-full group-hover:bg-primary/10">
                    <span className="material-symbols-outlined text-xl">chat_bubble</span>
                  </div>
                  <p className="text-xs font-normal">0</p>
                </button>
                <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-green-500 group">
                  <div className="p-2 rounded-full group-hover:bg-green-500/10">
                    <span className="material-symbols-outlined text-xl">repeat</span>
                  </div>
                  <p className="text-xs font-normal">0</p>
                </button>
                <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-pink-500 group">
                  <div className="p-2 rounded-full group-hover:bg-pink-500/10">
                    <span className="material-symbols-outlined text-xl">favorite</span>
                  </div>
                  <p className="text-xs font-normal">{post.likes}</p>
                </button>
                <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary group">
                  <div className="p-2 rounded-full group-hover:bg-primary/10">
                    <span className="material-symbols-outlined text-xl">ios_share</span>
                  </div>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Austin: Updated composer UI with real user data and working post functionality */}
      <div className="sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10 p-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl font-bold text-black dark:text-white mb-4">Home</h1>
        <div className="flex items-start gap-3">
          {/* Austin: Using real user profile image */}
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 shrink-0" 
            style={{ backgroundImage: `url('${getProfileImage()}')` }}
          ></div>
          <div className="w-full">
            {/* Austin: Wired textarea to state */}
            <textarea 
              className="form-input w-full resize-none bg-transparent border-none text-black dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 text-xl font-normal p-0 focus:ring-0" 
              placeholder="What's happening?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              maxLength={280}
              rows={3}
            ></textarea>
            
            {/* Austin: Show error if post creation fails */}
            {postError && (
              <div className="text-red-500 text-sm mt-2">{postError}</div>
            )}
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="flex items-center justify-center p-2 rounded-full text-primary hover:bg-primary/10"
                  onClick={handleImageButtonClick}
                >
                  <span className="material-symbols-outlined text-xl">image</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <div className="flex items-center gap-3">
                {/* Austin: Character counter */}
                {newPostContent.length > 0 && (
                  <span className={`text-sm ${newPostContent.length > 280 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    {newPostContent.length}/280
                  </span>
                )}
                {imageFileName && (
                  <div className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-2">
                    <span>Image: {imageFileName}</span>
                    <button type="button" className="text-primary" onClick={clearSelectedImage}>
                      Remove
                    </button>
                  </div>
                )}
                {/* Austin: Enabled post button with onClick handler and loading state */}
                <button 
                  className="min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-9 px-5 bg-primary text-white text-sm font-bold leading-normal disabled:opacity-50 disabled:cursor-not-allowed flex"
                  disabled={!newPostContent.trim() || !profile || postLoading || newPostContent.length > 280}
                  onClick={handleCreatePost}
                >
                  {postLoading ? (
                    <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                  ) : (
                    <span className="truncate">Post</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Austin: Post list - same logic, new styling */}
      {renderContent()}
    </>
  );
};

export default Feed;
