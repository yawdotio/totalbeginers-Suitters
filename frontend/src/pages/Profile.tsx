// Austin: Updated Profile page with real user data - no dummy text
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useZkLogin } from '../zklogin/useZkLogin';
import { API_ENDPOINTS } from '../config/api';

// Austin: Interface for user profile data
interface UserProfile {
  objectId: string;
  username: string;
  bio?: string;
  imageUrl?: string;
  walletAddress: string;
  createdAt?: string;
}

// Austin: Interface for user posts
interface UserPost {
  id: string;
  content: string;
  author: string;
  authorName?: string;
  authorAvatar?: string;
  timestamp: string;
  likes: number;
}

export const Profile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { userAddress: zkLoginAddress, decodedJWT } = useZkLogin();
  
  // Austin: State for profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Austin: Determine if viewing own profile
  const currentUserAddress = currentAccount?.address || zkLoginAddress;
  const isOwnProfile = id === currentUserAddress;

  // Austin: Fetch user profile and posts
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch profile
        const profileResponse = await fetch(API_ENDPOINTS.profile(id));
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.profile) {
            setProfile({
              objectId: profileData.profile.objectId,
              username: profileData.profile.username,
              bio: profileData.profile.bio,
              imageUrl: profileData.profile.image_url,
              walletAddress: id,
              createdAt: profileData.profile.created_at_ms,
            });
          }
        }
        
        // Fetch user's posts
        const postsResponse = await fetch(API_ENDPOINTS.posts);
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          const userPosts = (postsData.data || [])
            .filter((post: any) => post.author_address === id)
            .map((post: any) => ({
              id: post.objectId,
              content: post.content,
              author: post.author_address,
              authorName: post.author_username || post.author_address,
              authorAvatar: post.author_image_url,
              timestamp: new Date(Number(post.created_at_ms)).toISOString(),
              likes: post.like_count || 0,
            }));
          setPosts(userPosts);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  // Austin: Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Austin: Format date
  const formatJoinDate = (timestamp?: string) => {
    if (!timestamp) return 'Recently';
    const date = new Date(Number(timestamp));
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Austin: Get display name (priority: username > zkLogin name > formatted address)
  const getDisplayName = () => {
    if (profile?.username) return profile.username;
    if (isOwnProfile && decodedJWT?.name) return decodedJWT.name;
    return formatAddress(id || '');
  };

  // Austin: Get profile image (priority: profile image > zkLogin image > avatar)
  const getProfileImage = () => {
    if (profile?.imageUrl) return profile.imageUrl;
    if (isOwnProfile && decodedJWT?.picture) return decodedJWT.picture;
    return `https://ui-avatars.com/api/?name=${getDisplayName()}&background=random&size=128`;
  };
  
  return (
    <>
      {/* Profile Header */}
      <div className="sticky top-0 z-10 flex items-center gap-5 px-4 py-2 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="text-gray-800 dark:text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{getDisplayName()}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{posts.length} Posts</p>
        </div>
      </div>
      
      {/* Header Image */}
      <div className="w-full h-[200px] bg-center bg-no-repeat bg-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800')" }}></div>
      
      <div className="px-4 pb-4">
        {/* Profile Header Details */}
        <div className="relative flex justify-between">
          <div className="absolute -top-16 bg-center bg-no-repeat aspect-square bg-cover rounded-full w-32 h-32 border-4 border-background-light dark:border-background-dark" style={{ backgroundImage: `url('${getProfileImage()}')` }}></div>
          <div className="w-full pt-4">
            <div className="flex justify-end">
              {isOwnProfile && (
                <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-9 px-4 bg-transparent text-gray-900 dark:text-white text-sm font-bold leading-normal tracking-[0.015em] border border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800/50">
                  <span className="truncate">Edit profile</span>
                </button>
              )}
              {!isOwnProfile && (
                <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-9 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90">
                  <span className="truncate">Follow</span>
                </button>
              )}
            </div>
            <div className="pt-12">
              <p className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">{getDisplayName()}</p>
              <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">@{formatAddress(id || '')}</p>
            </div>
          </div>
        </div>
        
        {/* Austin: Display bio if available */}
        {profile?.bio && (
          <p className="mt-3 text-base font-normal leading-normal text-gray-900 dark:text-white">{profile.bio}</p>
        )}
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-gray-500 dark:text-gray-400 text-base">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            <p className="text-sm">Joined {formatJoinDate(profile?.createdAt)}</p>
          </div>
          {isOwnProfile && decodedJWT?.email && (
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">mail</span>
              <p className="text-sm">{decodedJWT.email}</p>
            </div>
          )}
        </div>
        
        {/* Profile Stats */}
        <div className="flex flex-wrap gap-5 mt-3">
          <div className="flex items-center gap-1">
            <p className="text-gray-900 dark:text-white font-bold">0</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Following</p>
          </div>
          <div className="flex items-center gap-1">
            <p className="text-gray-900 dark:text-white font-bold">0</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Followers</p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex -mb-px">
          <a className="flex-1 px-4 py-3 text-center text-primary border-b-2 border-primary text-base font-bold" href="#">Posts</a>
          <a className="flex-1 px-4 py-3 text-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 text-base font-medium" href="#">Replies</a>
          <a className="flex-1 px-4 py-3 text-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 text-base font-medium" href="#">Media</a>
          <a className="flex-1 px-4 py-3 text-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 text-base font-medium" href="#">Likes</a>
        </nav>
      </div>
      
      {/* Austin: Content Feed - Loading/Error/Posts states */}
      {loading ? (
        <div className="p-8 flex justify-center">
          <span className="material-symbols-outlined text-primary text-3xl animate-spin">
            progress_activity
          </span>
        </div>
      ) : error ? (
        <div className="p-4 text-red-500">Failed to load profile: {error}</div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          No posts yet
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <div key={post.id} className="flex gap-4 p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="shrink-0">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12" style={{ backgroundImage: `url('${post.authorAvatar || getProfileImage()}')` }}></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 dark:text-white">{post.authorName || getDisplayName()}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">@{formatAddress(post.author)} · {new Date(post.timestamp).toLocaleDateString()}</p>
                </div>
                <p className="mt-1 text-gray-900 dark:text-white">{post.content}</p>
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
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Profile;
