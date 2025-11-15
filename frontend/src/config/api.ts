// Austin: Centralized API configuration for production deployments
// This ensures the app never defaults to localhost in production

/**
 * Get the backend API URL from environment variables
 * In production, VITE_BACKEND_URL MUST be set, otherwise throws an error
 */
export const getBackendUrl = (): string => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  // Austin: In production mode, require VITE_BACKEND_URL to be set
  if (import.meta.env.PROD && !backendUrl) {
    throw new Error(
      'VITE_BACKEND_URL environment variable is required in production. ' +
      'Please set it to your deployed backend URL.'
    );
  }
  
  // Austin: In development, default to localhost
  return backendUrl || 'http://localhost:3000';
};

/**
 * Backend API base URL
 */
export const BACKEND_URL = getBackendUrl();

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  profile: (address: string) => `${BACKEND_URL}/api/profile/${address}`,
  posts: `${BACKEND_URL}/api/posts`,
  createPost: `${BACKEND_URL}/api/create-post`,
  createProfile: `${BACKEND_URL}/api/create-profile`,
  likePost: `${BACKEND_URL}/api/like-post`,
  unlikePost: `${BACKEND_URL}/api/unlike-post`,
  userLikes: (profileId: string) => `${BACKEND_URL}/api/user-likes/${profileId}`,
  zkLogin: {
    login: `${BACKEND_URL}/api/zklogin/login`,
    getSalt: `${BACKEND_URL}/api/zklogin/salt`,
  },
} as const;
