import { useState, useEffect } from 'react';
import { Box, Container, Flex, Heading, Button, Text, Card, Avatar, TextField, TextArea } from '@radix-ui/themes';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useZkLogin } from '../zklogin/useZkLogin';
import { API_ENDPOINTS } from '../config/api';

// Types
interface Post {
  id: string;
  content: string;
  author: string;
  authorName?: string;
  authorAvatar?: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  likeId?: string | null;
}

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
}

export function Home() {
  const { isAuthenticated: isZkLoginAuthenticated, userAddress: zkLoginAddress, decodedJWT } = useZkLogin();
  const currentAccount = useCurrentAccount();
  
  // Determine which authentication method is active
  const isAuthenticated = isZkLoginAuthenticated || !!currentAccount;
  const userAddress = isZkLoginAuthenticated ? zkLoginAddress : currentAccount?.address || null;
  const isUsingZkLogin = isZkLoginAuthenticated;
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    displayName: '',
    bio: '',
    imageUrl: '',
  });

  // Check if user has a profile and load posts
  useEffect(() => {
    if (isAuthenticated && userAddress) {
      checkUserProfile();
    }
  }, [isAuthenticated, userAddress]);

  // Load posts when profile changes (to get liked posts)
  useEffect(() => {
    if (isAuthenticated && userAddress) {
      loadPosts();
    }
  }, [isAuthenticated, userAddress, userProfile?.id]);

  const checkUserProfile = async () => {
    if (!userAddress) return;
    
    console.log('Checking profile for:', userAddress);
    try {
      const response = await fetch(API_ENDPOINTS.profile(userAddress));
      
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          console.log('✅ User has profile:', data.profile);
          setUserProfile({
            id: data.profile.objectId,
            username: data.profile.username,
            displayName: data.profile.username, // Can add displayName to contract later
            bio: data.profile.bio || '',
          });
        } else {
          console.log('ℹ️ User has no profile yet');
          setUserProfile(null);
        }
      } else {
        console.log('ℹ️ User has no profile yet (404)');
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Failed to check profile:', error);
      setUserProfile(null);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.posts);
      
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('📥 Loaded posts from backend:', data);
      
      const postsData = data.data || [];
      
      // Fetch user's liked posts with like IDs if they have a profile
      const likeMap = new Map<string, string>(); // postId -> likeId
      if (userProfile?.id) {
        try {
          console.log('🔍 Fetching likes for profile:', userProfile.id);
          const likesResponse = await fetch(API_ENDPOINTS.userLikes(userProfile.id));
          console.log('📡 Likes response status:', likesResponse.status);
          
          if (likesResponse.ok) {
            const likesData = await likesResponse.json();
            const likes = likesData.likes || [];
            likes.forEach((like: { postId: string; likeId: string }) => {
              likeMap.set(like.postId, like.likeId);
            });
            console.log('👍 User has liked posts:', likes);
            console.log('📊 Like map:', Array.from(likeMap.entries()));
          } else {
            console.error('❌ Failed to fetch likes, status:', likesResponse.status);
          }
        } catch (error) {
          console.error('Failed to fetch user likes:', error);
        }
      } else {
        console.log('ℹ️ No user profile, skipping likes fetch');
      }
      
      const transformedPosts: Post[] = postsData.map((post: any) => ({
        id: post.objectId,
        content: post.content,
        author: post.author_address,
        authorName: post.author_username || post.author_address,
        authorAvatar: post.author_image_url || undefined,
        timestamp: new Date(Number(post.created_at_ms)).toISOString(),
        likes: post.like_count || 0,
        isLiked: likeMap.has(post.objectId),
        likeId: likeMap.get(post.objectId) || null,
      }));
      
      console.log('✅ Transformed posts:', transformedPosts.length, 'posts');
      setPosts(transformedPosts);
    } catch (error) {
      console.error('Failed to load posts:', error);
      // Don't fail silently - show empty state but don't crash
      setPosts([]);
    }
  };

  const handleCreateProfile = async () => {
    if (!userAddress) return;
    
    setIsCreatingProfile(true);
    try {
      console.log('Creating profile:', profileForm);
      
      // Use Google profile image directly (Walrus upload causes 429 rate limiting from Google)
      let imageUrl = profileForm.imageUrl;
      if (!imageUrl && decodedJWT?.picture) {
        imageUrl = decodedJWT.picture;
        console.log('Using Google profile image:', imageUrl);
      }
      
      // Fallback to placeholder if no image
      if (!imageUrl) {
        imageUrl = 'https://via.placeholder.com/150';
      }
      
      // Backend sponsors and executes the transaction
      console.log('🚀 Creating profile via backend sponsor...');
      const response = await fetch(API_ENDPOINTS.createProfile, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          username: profileForm.username,
          bio: profileForm.bio,
          imageUrl,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create profile');
      }
      
      const result = await response.json();
      console.log('Profile created successfully:', result);
      
      // Extract the created profile object ID from objectChanges
      const profileObject = result.objectChanges?.find((obj: any) => 
        obj.type === 'created' && obj.objectType?.includes('::Profile')
      );
      
      if (profileObject) {
        setUserProfile({
          id: profileObject.objectId,
          username: profileForm.username,
          displayName: profileForm.displayName,
          bio: profileForm.bio,
        });
        alert('Profile created successfully on-chain!');
      } else {
        throw new Error('Profile object not found in transaction result');
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      alert(`Failed to create profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !userProfile || !userAddress) return;
    
    setIsCreatingPost(true);
    try {
      console.log('Creating post:', newPostContent);
      
      // Backend sponsors and executes the transaction
      const response = await fetch('https://totalbeginers-suitters.onrender.com/api/create-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: userProfile.id,
          userAddress,
          content: newPostContent,
          imageUrl: '',
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create post');
      }
      
      const result = await response.json();
      console.log('Post created successfully:', result);
      
      // Extract the created post object ID
      const postObject = result.objectChanges?.find((obj: any) => 
        obj.type === 'created' && obj.objectType?.includes('::Post')
      );
      
      const newPost: Post = {
        id: postObject?.objectId || `temp-${Date.now()}`,
        content: newPostContent,
        author: userAddress,
        authorName: decodedJWT?.name || userProfile.username,
        authorAvatar: decodedJWT?.picture,
        timestamp: new Date().toISOString(),
        likes: 0,
        isLiked: false,
      };
      
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      
      // Reload posts from backend after a short delay
      setTimeout(loadPosts, 2000);
    } catch (error) {
      console.error('Failed to create post:', error);
      alert(`Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!userProfile || !userAddress) return;
    
    // Check if already liked - prevent duplicate likes
    const post = posts.find(p => p.id === postId);
    if (post?.isLiked) {
      console.log('Post already liked, ignoring');
      return;
    }
    
    // Store original state for rollback
    const originalPost = post;
    
    // Optimistic UI update - update immediately
    setPosts(prevPosts => prevPosts.map(p =>
      p.id === postId
        ? {
            ...p,
            likes: p.likes + 1,
            isLiked: true,
          }
        : p
    ));
    
    try {
      console.log('Liking post:', postId);
      const response = await fetch('https://totalbeginers-suitters.onrender.com/api/like-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: userProfile.id,
          postId,
          userAddress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        // Revert optimistic update on error
        setPosts(prevPosts => prevPosts.map(p =>
          p.id === postId
            ? {
                ...p,
                likes: originalPost?.likes || Math.max(0, p.likes - 1),
                isLiked: false,
                likeId: null,
              }
            : p
        ));
        throw new Error(error.error || 'Failed to like post');
      }

      const result = await response.json();
      // Update with actual like ID from backend
      setPosts(prevPosts => prevPosts.map(p =>
        p.id === postId
          ? {
              ...p,
              likeId: result.likeObjectId,
            }
          : p
      ));
    } catch (error) {
      console.error('Failed to like post:', error);
      alert(`Failed to like post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUnlikePost = async (postId: string, likeId?: string | null) => {
    if (!userProfile || !userAddress || !likeId) {
      alert('Missing like ID. Please refresh the feed and try again.');
      return;
    }
    
    // Check if not already liked - prevent issues
    const post = posts.find(p => p.id === postId);
    if (!post?.isLiked) {
      console.log('Post not liked, ignoring');
      return;
    }
    
    // Store original state for rollback
    const originalPost = post;
    
    // Optimistic UI update - update immediately
    setPosts(prevPosts => prevPosts.map(p =>
      p.id === postId
        ? {
            ...p,
            likes: Math.max(0, p.likes - 1),
            isLiked: false,
            likeId: null,
          }
        : p
    ));
    
    try {
      console.log('Unliking post:', postId);
      const response = await fetch('https://totalbeginers-suitters.onrender.com/api/unlike-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: userProfile.id,
          postId,
          likeId,
          userAddress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        // Revert optimistic update on error
        setPosts(prevPosts => prevPosts.map(p =>
          p.id === postId
            ? {
                ...p,
                likes: originalPost?.likes || p.likes + 1,
                isLiked: true,
                likeId: originalPost?.likeId || likeId,
              }
            : p
        ));
        throw new Error(error.error || 'Failed to unlike post');
      }

      await response.json();
    } catch (error) {
      console.error('Failed to unlike post:', error);
      alert(`Failed to unlike post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <Container size="3" style={{ marginTop: '100px' }}>
        <Flex direction="column" align="center" gap="4">
          <Heading size="8">Welcome to Suitter</Heading>
          <Text size="4" color="gray">A decentralized social network built on Sui blockchain</Text>
          <Text size="3" color="gray">Choose your authentication method to get started</Text>
          <Text size="2" color="gray">(Both authentication buttons are in the header)</Text>
        </Flex>
      </Container>
    );
  }

  // No profile - show profile creation
  if (!userProfile) {
    return (
      <Container size="2" style={{ marginTop: '50px' }}>
        <Card>
          <Flex direction="column" gap="4">
            <Heading size="6">Create Your Profile</Heading>
            <Text size="2" color="gray">Welcome! Let's set up your Suitter profile.</Text>
            
            <Box>
              <Text size="2" weight="bold" mb="1">Username</Text>
              <TextField.Root
                placeholder="johndoe"
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: (e.target as HTMLInputElement).value })}
              />
            </Box>
            
            <Box>
              <Text size="2" weight="bold" mb="1">Display Name</Text>
              <TextField.Root
                placeholder="John Doe"
                value={profileForm.displayName}
                onChange={(e) => setProfileForm({ ...profileForm, displayName: (e.target as HTMLInputElement).value })}
              />
            </Box>
            
            <Box>
              <Text size="2" weight="bold" mb="1">Bio (optional)</Text>
              <TextArea
                placeholder="Tell us about yourself..."
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: (e.target as HTMLTextAreaElement).value })}
                rows={3}
              />
            </Box>
            
            <Button onClick={handleCreateProfile} disabled={isCreatingProfile || !profileForm.username || !profileForm.displayName} size="3">
              {isCreatingProfile ? 'Creating...' : 'Create Profile'}
            </Button>
          </Flex>
        </Card>
      </Container>
    );
  }

  // Main feed
  return (
    <Container size="3" style={{ marginTop: '20px' }}>
      <Flex direction="column" gap="4">
        {/* User Info */}
        <Flex justify="between" align="center">
          <Flex gap="3" align="center">
            <Avatar src={decodedJWT?.picture} fallback={userProfile?.displayName?.charAt(0) || '?'} size="3" />
            <Box>
              <Text weight="bold" size="3">{userProfile?.displayName || 'User'}</Text>
              <Text size="2" style={{ display: 'block', color: 'var(--gray-11)' }}>@{userProfile?.username || 'username'}</Text>
              <Text size="1" style={{ display: 'block', color: 'var(--gray-10)' }}>
                {isUsingZkLogin ? '🔐 zkLogin' : '👛 Wallet'}
              </Text>
            </Box>
          </Flex>
        </Flex>

        {/* Create Post */}
        <Card>
          <Flex direction="column" gap="3">
            <Flex gap="3" align="start">
              <Avatar src={decodedJWT?.picture} fallback={userProfile.displayName.charAt(0)} size="3" />
              <Box style={{ flex: 1 }}>
                <TextArea placeholder="What's happening?" value={newPostContent} onChange={(e) => setNewPostContent((e.target as HTMLTextAreaElement).value)} rows={3} style={{ width: '100%' }} />
              </Box>
            </Flex>
            <Flex justify="end">
              <Button onClick={handleCreatePost} disabled={isCreatingPost || !newPostContent.trim()} size="2">
                {isCreatingPost ? 'Posting...' : 'Post'}
              </Button>
            </Flex>
          </Flex>
        </Card>

        {/* Posts Feed */}
        <Flex direction="column" gap="3">
          {posts.length === 0 ? (
            <Card>
              <Text size="3" color="gray" align="center">No posts yet. Be the first to post!</Text>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <Flex direction="column" gap="3">
                  {/* Post Header */}
                  <Flex gap="3" align="start">
                    <Avatar src={post.authorAvatar} fallback={post.authorName?.charAt(0) || 'U'} size="3" />
                    <Flex direction="column" gap="1" style={{ flex: 1 }}>
                      <Flex gap="2" align="center">
                        <Text size="3" weight="bold">{post.authorName || 'Anonymous'}</Text>
                        <Text size="2" color="gray">@{post.author.slice(0, 6)}...{post.author.slice(-4)}</Text>
                        <Text size="2" color="gray">· {new Date(post.timestamp).toLocaleDateString()}</Text>
                      </Flex>
                      <Text size="3">{post.content}</Text>
                    </Flex>
                  </Flex>

                  {/* Post Actions */}
                  <Flex gap="4">
                    <Button variant={post.isLiked ? 'solid' : 'soft'} color={post.isLiked ? 'red' : 'gray'} size="2" onClick={() => post.isLiked ? handleUnlikePost(post.id, post.likeId) : handleLikePost(post.id)}>
                      {post.isLiked ? '❤️' : '🤍'} {post.likes}
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            ))
          )}
        </Flex>
      </Flex>
    </Container>
  );
}

export default Home;
