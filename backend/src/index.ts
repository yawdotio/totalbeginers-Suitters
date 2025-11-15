import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import type { SuiObjectChangeCreated } from '@mysten/sui/client';
import crypto from 'crypto';
import { EnokiClient } from '@mysten/enoki';
import multer from 'multer';
import { WalrusClient } from '@mysten/walrus';
import {
  getAllPosts,
  getProfile,
  getObject,
  checkUsernameAvailability,
  getUserLikeObjects,
  getPostComments,
  getCommentReplies,
  PACKAGE_ID,
  REGISTRY_ID,
  SUI_NETWORK,
  suiClient
} from './sui.service';

// Load environment variables
dotenv.config();

// Initialize Enoki client for gas sponsorship
const ENOKI_API_KEY = process.env.ENOKI_API_KEY;
let enokiClient: EnokiClient | null = null;

if (ENOKI_API_KEY) {
  try {
    enokiClient = new EnokiClient({
      apiKey: ENOKI_API_KEY,
    });
    console.log('✅ Enoki client initialized for gas sponsorship');
  } catch (error) {
    console.error('Failed to initialize Enoki client:', error);
  }
} else {
  console.warn('⚠️  ENOKI_API_KEY not found. Gas sponsorship disabled.');
}

// Initialize sponsor keypair for airdrops (same wallet as Enoki sponsor)
const SPONSOR_PRIVATE_KEY = process.env.SPONSOR_PRIVATE_KEY;
let sponsorKeypair: Ed25519Keypair | null = null;

if (SPONSOR_PRIVATE_KEY) {
  try {
    sponsorKeypair = Ed25519Keypair.fromSecretKey(SPONSOR_PRIVATE_KEY);
    const sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();
    console.log('✅ Sponsor wallet initialized:', sponsorAddress);
  } catch (error) {
    console.error('Failed to initialize sponsor keypair:', error);
  }
} else {
  console.warn('⚠️  SPONSOR_PRIVATE_KEY not found. Airdrops disabled.');
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Initialize Walrus client
const walrusClient = new WalrusClient({
  network: 'testnet',
  suiClient: suiClient,
});

// ============================================================================
// READ-ONLY ENDPOINTS
// ============================================================================

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    network: SUI_NETWORK,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/posts
 * Get all posts from the blockchain
 */
app.get('/api/posts', async (req: Request, res: Response) => {
  try {
    const posts = await getAllPosts();

    const profileCache = new Map<string, any>();

    const formattedPosts = await Promise.all(posts.map(async (post: any) => {
      const content = post.content?.fields || {};
      const profileId: string | undefined = content.author_profile_id;

      let profileData: any = null;
      if (profileId) {
        if (profileCache.has(profileId)) {
          profileData = profileCache.get(profileId);
        } else {
          try {
            profileData = await getObject(profileId);
            profileCache.set(profileId, profileData);
          } catch (err) {
            console.error('Failed to fetch author profile:', profileId, err);
          }
        }
      }

      const profileFields = profileData?.content?.fields;

      return {
        objectId: post.objectId,
        content: content.content || '',
        author_address: content.author_address || '',
        author_profile_id: profileId || '',
        author_username: profileFields?.username || null,
        author_image_url: profileFields?.image_url || null,
        author_bio: profileFields?.bio || null,
        created_at_ms: content.created_at_ms || '',
        like_count: Number(content.like_count || 0),
        image_url: content.image_url || null,
      };
    }));

    res.json({
      success: true,
      data: formattedPosts,
    });
  } catch (error) {
    console.error('Failed to get posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get posts'
    });
  }
});

/**
 * GET /api/profile/:id
 * Get a profile by object ID or owner address
 */
app.get('/api/profile/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    // If ID is an address (0x...), search by owner field
    // Otherwise treat as object ID
    if (id.startsWith('0x') && id.length === 66) {
      // Search for profile by owner address (profiles are shared but have owner field)
      console.log('🔍 Searching for profile with owner:', id);
      
      // Query all Profile objects and filter by owner field
      const { data } = await suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::suitter::ProfileCreated`,
        },
      });
      
      // Find the ProfileCreated event for this user
      const userProfileEvent = data.find((event: any) => {
        const parsedJson = event.parsedJson as any;
        return parsedJson?.owner === id;
      });
      
      if (userProfileEvent) {
        const parsedJson = userProfileEvent.parsedJson as any;
        const profileId = parsedJson.profile_id;
        
        // Get the full profile object
        const profileObj = await suiClient.getObject({
          id: profileId,
          options: {
            showContent: true,
            showType: true,
          },
        });
        
        const content = profileObj.data?.content as any;
        
        res.json({
          success: true,
          profile: {
            objectId: profileId,
            owner: content?.fields?.owner,
            username: content?.fields?.username,
            bio: content?.fields?.bio,
            imageUrl: content?.fields?.image_url,
          }
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
      }
    } else {
      // Look up by object ID
      const profile = await getProfile(id);
      res.json({
        success: true,
        data: profile
      });
    }
  } catch (error) {
    console.error('Failed to get profile:', error);
    res.status(404).json({
      success: false,
      error: 'Profile not found'
    });
  }
});

/**
 * GET /api/object/:id
 * Get any object by its ID
 */
app.get('/api/object/:id', async (req: Request, res: Response) => {
  try {
    const objectId = req.params.id;
    const obj = await getObject(objectId);
    res.json({
      success: true,
      data: obj
    });
  } catch (error) {
    console.error('Failed to get object:', error);
    res.status(404).json({
      success: false,
      error: 'Object not found'
    });
  }
});

/**
 * GET /api/check-username/:username
 * Check if a username is available
 */
app.get('/api/check-username/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const available = await checkUsernameAvailability(username);
    res.json({
      available
    });
  } catch (error) {
    console.error('Failed to check username:', error);
    res.status(500).json({
      available: false,
      error: 'Failed to check username'
    });
  }
});

/**
 * GET /api/user-likes/:profileId
 * Get all post IDs that a user has liked
 */
app.get('/api/user-likes/:profileId', async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    const likeObjects = await getUserLikeObjects(profileId);
    
    res.json({
      success: true,
      likes: likeObjects, // Returns array of { postId, likeId }
    });
  } catch (error) {
    console.error('Failed to get user likes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user likes',
      likes: [],
    });
  }
});

/**
 * POST /api/zklogin/salt
 * Proxy for zkLogin salt service (avoids CORS issues)
 * 
 * NOTE: This implementation generates a deterministic salt locally.
 * For production, you should implement a proper salt service with a database.
 */
app.post('/api/zklogin/salt', async (req: Request, res: Response) => {
  try {
    const { jwt } = req.body;
    
    if (!jwt) {
      return res.status(400).json({
        error: 'JWT token is required'
      });
    }

    // Decode JWT to get the 'sub' (subject) claim
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
    const sub = payload.sub;
    
    if (!sub) {
      return res.status(400).json({
        error: 'Invalid JWT: missing sub claim'
      });
    }

    // Generate deterministic salt from sub claim
    // In production, you should store this in a database and generate it only once per user
    const salt = generateSalt(sub);
    
    console.log('Generated salt for sub:', sub);
    
    res.json({ salt });
  } catch (error) {
    console.error('Failed to get salt:', error);
    res.status(500).json({
      error: 'Failed to obtain salt'
    });
  }
});

/**
 * Generate a deterministic salt for a given user sub
 * This is a simple implementation for development/testing.
 * 
 * IMPORTANT: In production, generate a random salt once per user and store it in a database.
 * The salt MUST be a 16-byte value (less than 2^128).
 */
function generateSalt(sub: string): string {
  // Use a secret key from environment (or generate one)
  const SECRET_KEY = process.env.SALT_SECRET || 'suitter-dev-salt-secret-change-in-production';
  
  // Generate a deterministic salt using HMAC-SHA256
  const hash = crypto.createHmac('sha256', SECRET_KEY)
    .update(sub)
    .digest('hex');
  
  // Take first 16 bytes (32 hex characters) and convert to BigInt string
  // zkLogin requires salt to be less than 2^128 (16 bytes)
  const saltBigInt = BigInt('0x' + hash.substring(0, 32));
  
  // Verify salt is less than 2^128
  const MAX_SALT = BigInt(2) ** BigInt(128);
  if (saltBigInt >= MAX_SALT) {
    throw new Error('Generated salt is too large');
  }
  
  return saltBigInt.toString();
}

// ============================================================================
// COMMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/comments/:postId
 * Get all comments for a specific post
 */
app.get('/api/comments/:postId', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    
    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    const comments = await getPostComments(postId);
    
    // Fetch profile data for each comment
    const profileCache = new Map<string, any>();
    const formattedComments = await Promise.all(comments.map(async (comment: any) => {
      const content = comment.content?.fields || {};
      const profileId: string | undefined = content.author_profile_id;

      let profileData: any = null;
      if (profileId) {
        if (profileCache.has(profileId)) {
          profileData = profileCache.get(profileId);
        } else {
          try {
            const profile = await getProfile(profileId);
            const fields = (profile.content as any)?.fields || {};
            profileData = {
              id: profileId,
              username: fields.username,
              image_url: fields.image_url,
              bio: fields.bio,
            };
            profileCache.set(profileId, profileData);
          } catch (error) {
            console.error(`Failed to fetch profile ${profileId}:`, error);
          }
        }
      }

      return {
        id: comment.objectId,
        post_id: content.post_id,
        content: content.content,
        created_at_ms: content.created_at_ms,
        like_count: content.like_count || '0',
        reply_count: content.reply_count || '0',
        author_profile_id: profileId,
        author_address: content.author_address,
        profile: profileData,
      };
    }));

    res.json(formattedComments);
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch comments' });
  }
});

/**
 * GET /api/replies/:commentId
 * Get all replies for a specific comment
 */
app.get('/api/replies/:commentId', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    
    if (!commentId) {
      return res.status(400).json({ error: 'Comment ID is required' });
    }

    const replies = await getCommentReplies(commentId);
    
    // Fetch profile data for each reply
    const profileCache = new Map<string, any>();
    const formattedReplies = await Promise.all(replies.map(async (reply: any) => {
      const content = reply.content?.fields || {};
      const profileId: string | undefined = content.author_profile_id;

      let profileData: any = null;
      if (profileId) {
        if (profileCache.has(profileId)) {
          profileData = profileCache.get(profileId);
        } else {
          try {
            const profile = await getProfile(profileId);
            const fields = (profile.content as any)?.fields || {};
            profileData = {
              id: profileId,
              username: fields.username,
              image_url: fields.image_url,
              bio: fields.bio,
            };
            profileCache.set(profileId, profileData);
          } catch (error) {
            console.error(`Failed to fetch profile ${profileId}:`, error);
          }
        }
      }

      return {
        id: reply.objectId,
        parent_id: content.parent_id,
        content: content.content,
        created_at_ms: content.created_at_ms,
        like_count: content.like_count || '0',
        author_profile_id: profileId,
        author_address: content.author_address,
        profile: profileData,
      };
    }));

    res.json(formattedReplies);
  } catch (error: any) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch replies' });
  }
});

// ============================================================================
// ENOKI GAS SPONSORSHIP ENDPOINTS
// ============================================================================

/**
 * POST /api/sponsor
 * Sponsor a transaction with Enoki (gas-free for users)
 */
app.post('/api/sponsor', async (req: Request, res: Response) => {
  try {
    if (!enokiClient) {
      return res.status(503).json({
        error: 'Gas sponsorship not available. Enoki client not initialized.'
      });
    }

    const { transactionKindBytes, sender } = req.body;

    if (!transactionKindBytes || !sender) {
      return res.status(400).json({
        error: 'Missing required fields: transactionKindBytes and sender'
      });
    }

    console.log('📝 Sponsoring transaction for:', sender);
    console.log('📦 Transaction bytes (base64 length):', transactionKindBytes.length);

    // Create a sponsored transaction using Enoki
    // Note: allowedAddresses and allowedMoveCallTargets should be configured
    // in the Enoki Portal, not in the API call
    const sponsoredTx = await enokiClient.createSponsoredTransaction({
      network: SUI_NETWORK as 'testnet' | 'mainnet',
      transactionKindBytes: transactionKindBytes,
      sender,
    });

    console.log('✅ Transaction sponsored with digest:', sponsoredTx.digest);
    console.log('📊 Sponsored tx bytes type:', typeof sponsoredTx.bytes);
    console.log('📊 Sponsored tx bytes length:', sponsoredTx.bytes.length);

    // Enoki returns full TransactionData as base64 string (already encoded!)
    // Just pass it through without re-encoding
    res.json({
      bytes: sponsoredTx.bytes, // Already base64 string from Enoki
      digest: sponsoredTx.digest,
    });
  } catch (error) {
    console.error('Failed to sponsor transaction:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to sponsor transaction'
    });
  }
});

/**
 * POST /api/create-profile
 * Backend sponsors and executes profile creation (user just provides identity)
 */
app.post('/api/create-profile', async (req: Request, res: Response) => {
  try {
    if (!sponsorKeypair) {
      return res.status(503).json({
        error: 'Sponsor wallet not initialized.'
      });
    }

    const { userAddress, username, bio, imageUrl } = req.body;

    if (!userAddress || !username) {
      return res.status(400).json({
        error: 'Missing required fields: userAddress, username'
      });
    }

    console.log('📝 Creating profile for user:', userAddress);
    console.log('  - Username:', username);

    // Build the transaction
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::suitter::create_profile`,
      arguments: [
        tx.object(REGISTRY_ID),
        tx.pure.address(userAddress), // User's zkLogin address
        tx.pure.string(username),
        tx.pure.string(bio || ''),
        tx.pure.string(imageUrl || ''),
        tx.object('0x6'), // Clock object
      ],
    });

    // Sponsor signs and executes
    console.log('💰 Sponsor wallet paying gas...');
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: sponsorKeypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log('✅ Profile created:', result.digest);

    res.json({
      success: true,
      digest: result.digest,
      effects: result.effects,
      objectChanges: result.objectChanges,
    });
  } catch (error) {
    console.error('❌ Failed to create profile:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create profile'
    });
  }
});

/**
 * POST /api/create-post
 * Backend sponsors and executes post creation
 */
app.post('/api/create-post', async (req: Request, res: Response) => {
  try {
    if (!sponsorKeypair) {
      return res.status(503).json({
        error: 'Sponsor wallet not initialized.'
      });
    }

    const { profileId, userAddress, content, imageUrl } = req.body;

    if (!profileId || !userAddress || !content) {
      return res.status(400).json({
        error: 'Missing required fields: profileId, userAddress, content'
      });
    }

    console.log('📝 Creating post for user:', userAddress);
    console.log('  - Profile:', profileId);
    console.log('  - Content:', content.substring(0, 50) + '...');

    // Build the transaction
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::suitter::create_post`,
      arguments: [
        tx.object(profileId), // Shared profile object
        tx.pure.address(userAddress), // User's zkLogin address
        tx.pure.string(content),
        tx.pure.string(imageUrl || ''),
        tx.object('0x6'), // Clock object
      ],
    });

    // Sponsor signs and executes
    console.log('💰 Sponsor wallet paying gas...');
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: sponsorKeypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log('✅ Post created:', result.digest);

    res.json({
      success: true,
      digest: result.digest,
      effects: result.effects,
      objectChanges: result.objectChanges,
    });
  } catch (error) {
    console.error('❌ Failed to create post:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create post'
    });
  }
});

/**
 * POST /api/like-post
 * Backend sponsors like transactions
 */
app.post('/api/like-post', async (req: Request, res: Response) => {
  try {
    if (!sponsorKeypair) {
      return res.status(503).json({
        error: 'Sponsor wallet not initialized.'
      });
    }

    const { profileId, postId, userAddress } = req.body;

    if (!profileId || !postId || !userAddress) {
      return res.status(400).json({
        error: 'Missing required fields: profileId, postId, userAddress'
      });
    }

    console.log('👍 Liking post', { userAddress, profileId, postId });

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::suitter::like_post`,
      arguments: [
        tx.object(profileId),
        tx.object(postId),
        tx.pure.address(userAddress),
        tx.object('0x6'),
      ],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: sponsorKeypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    const likeObject = result.objectChanges?.find(
      (change: any) => change.type === 'created' && change.objectType?.includes('::Like')
    ) as any;

    if (!likeObject) {
      console.warn('Like transaction executed but no Like object found');
    }

    res.json({
      success: true,
      digest: result.digest,
      likeObjectId: likeObject?.objectId || null,
    });
  } catch (error) {
    console.error('❌ Failed to like post:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to like post'
    });
  }
});

/**
 * POST /api/unlike-post
 * Backend sponsors unlike transactions
 */
app.post('/api/unlike-post', async (req: Request, res: Response) => {
  try {
    if (!sponsorKeypair) {
      return res.status(503).json({
        error: 'Sponsor wallet not initialized.'
      });
    }

    const { profileId, postId, likeId, userAddress } = req.body;

    if (!profileId || !postId || !likeId || !userAddress) {
      return res.status(400).json({
        error: 'Missing required fields: profileId, postId, likeId, userAddress'
      });
    }

    console.log('👎 Unliking post', { userAddress, profileId, postId, likeId });

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::suitter::unlike_post`,
      arguments: [
        tx.object(likeId),
        tx.object(profileId),
        tx.object(postId),
        tx.pure.address(userAddress),
        tx.object('0x6'),
      ],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: sponsorKeypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    res.json({
      success: true,
      digest: result.digest,
    });
  } catch (error) {
    console.error('❌ Failed to unlike post:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to unlike post'
    });
  }
});

/**
 * POST /api/airdrop
 * Airdrop SUI to a new zkLogin wallet (DEPRECATED - using sponsor execution now)
 */
app.post('/api/airdrop', async (req: Request, res: Response) => {
  try {
    if (!sponsorKeypair) {
      return res.status(503).json({
        error: 'Airdrop not available. Sponsor wallet not initialized.'
      });
    }

    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        error: 'Missing required field: address'
      });
    }

    console.log('💰 Airdrop request for address:', address);

    // Check if address already has SUI
    const balance = await suiClient.getBalance({
      owner: address,
    });

    const currentBalance = BigInt(balance.totalBalance);
    const minimumBalance = BigInt(100_000_000); // 0.1 SUI

    if (currentBalance >= minimumBalance) {
      console.log('✅ Address already has sufficient balance:', balance.totalBalance);
      return res.json({
        success: true,
        message: 'Address already funded',
        balance: balance.totalBalance,
      });
    }

    // Send 0.1 SUI from sponsor wallet
    console.log('💸 Sending 0.1 SUI from sponsor wallet...');
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [100_000_000]); // 0.1 SUI
    tx.transferObjects([coin], address);

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: sponsorKeypair,
      options: {
        showEffects: true,
      },
    });

    console.log('✅ Airdrop successful:', result.digest);

    res.json({
      success: true,
      message: 'Airdrop successful',
      digest: result.digest,
      balance: '100000000', // 0.1 SUI in MIST
    });
  } catch (error) {
    console.error('❌ Failed to airdrop:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to airdrop SUI'
    });
  }
});

/**
 * POST /api/execute
 * Execute a sponsored transaction (DEPRECATED - using direct zkLogin execution now)
 */
app.post('/api/execute', async (req: Request, res: Response) => {
  try {
    if (!enokiClient) {
      return res.status(503).json({
        error: 'Gas sponsorship not available. Enoki client not initialized.'
      });
    }

    const { digest, signature } = req.body;

    if (!digest || !signature) {
      return res.status(400).json({
        error: 'Missing required fields: digest and signature'
      });
    }

    console.log('🚀 Executing sponsored transaction:', digest);
    console.log('📝 Signature length:', signature.length);
    console.log('📝 Signature (first 100 chars):', signature.substring(0, 100));
    console.log('📝 Signature (last 50 chars):', signature.substring(signature.length - 50));

    // Execute the sponsored transaction
    const result = await enokiClient.executeSponsoredTransaction({
      digest,
      signature,
    });

    console.log('✅ Transaction executed successfully');
    console.log('📊 Result:', result);

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('❌ Failed to execute transaction:', error);
    
    // Log ALL error details
    if (error && typeof error === 'object') {
      console.error('Full error object:', JSON.stringify(error, null, 2));
      if (error.errors && Array.isArray(error.errors)) {
        console.error('Enoki errors:', error.errors);
        error.errors.forEach((err: any, i: number) => {
          console.error(`Error ${i}:`, err);
          if (err.data) {
            console.error(`Error ${i} data:`, err.data);
            if (err.data.text) {
              console.error(`Error ${i} text:`, err.data.text);
            }
          }
        });
      }
    }
    
    // Return more detailed error to frontend
    const errorMessage = error?.errors?.[0]?.data?.text || error?.message || 'Failed to execute transaction';
    res.status(500).json({
      error: errorMessage,
      details: error?.errors || []
    });
  }
});

// ============================================================================
// IMAGE UPLOAD ENDPOINT
// ============================================================================

/**
 * POST /api/upload-image
 * Upload image to Walrus decentralized storage using HTTP API
 * For now, we'll convert to data URL as a temporary solution until Walrus testnet is stable
 */
app.post('/api/upload-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('Processing image upload:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // TEMPORARY SOLUTION: Convert to data URL
    // TODO: Once Walrus testnet is stable, switch back to decentralized storage
    const base64Image = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    console.log('Image converted to data URL (length:', dataUrl.length, ')');

    res.json({
      imageUrl: dataUrl,
      blobId: 'temp-data-url',
      note: 'Using data URL temporarily until Walrus testnet is available',
    });

  } catch (error: any) {
    console.error('Error processing image:', error);
    res.status(500).json({
      error: error?.message || 'Failed to process image',
      details: error,
    });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ Suitter Backend with Enoki Gas Sponsorship');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🌐 Network: ${SUI_NETWORK}`);
  console.log(`📦 Package: ${PACKAGE_ID}`);
  console.log(`📋 Registry: ${REGISTRY_ID}`);
  console.log(`🔌 Server running on port ${PORT}`);
  console.log(`💰 Enoki: ${enokiClient ? 'Enabled ✅' : 'Disabled ⚠️'}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('📝 Read Endpoints:');
  console.log('  - GET  /health');
  console.log('  - GET  /api/posts');
  console.log('  - GET  /api/profile/:id');
  console.log('  - GET  /api/object/:id');
  console.log('  - GET  /api/check-username/:username');
  console.log('');
  console.log('🔐 zkLogin Endpoints:');
  console.log('  - POST /api/zklogin/salt');
  console.log('');
  console.log('� Enoki Gas Sponsorship Endpoints:');
  console.log('  - POST /api/sponsor');
  console.log('  - POST /api/execute');
  console.log('');
  if (!enokiClient) {
    console.log('⚠️  Warning: Set ENOKI_API_KEY in .env to enable gas sponsorship');
    console.log('');
  }
});
