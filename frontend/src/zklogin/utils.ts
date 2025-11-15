/**
 * zkLogin Utilities - Core Functions
 */

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient } from '@mysten/sui/client';
import { generateNonce, generateRandomness, genAddressSeed, getZkLoginSignature } from '@mysten/sui/zklogin';
import { jwtDecode } from 'jwt-decode';
import { ZKLOGIN_CONFIG } from './config';
import type { ZkLoginSession, DecodedJWT, PartialZkLoginSignature } from './types';
import { API_ENDPOINTS } from '../config/api';

/**
 * Initialize Sui Client
 */
export function createSuiClient(): SuiClient {
  return new SuiClient({ url: ZKLOGIN_CONFIG.FULLNODE_URL });
}

/**
 * Step 1: Generate Ephemeral Key Pair and Nonce
 */
export async function generateEphemeralKeyAndNonce(): Promise<{
  ephemeralKeyPair: Ed25519Keypair;
  randomness: string;
  nonce: string;
  maxEpoch: number;
}> {
  const suiClient = createSuiClient();
  const { epoch } = await suiClient.getLatestSuiSystemState();

  // Max epoch should be current epoch + 2 for safety
  const maxEpoch = Number(epoch) + 2;

  // Generate ephemeral key pair
  const ephemeralKeyPair = new Ed25519Keypair();

  // Generate randomness for nonce
  const randomness = generateRandomness();

  // Generate nonce
  const nonce = generateNonce(
    ephemeralKeyPair.getPublicKey(),
    maxEpoch,
    randomness
  );

  return {
    ephemeralKeyPair,
    randomness,
    nonce,
    maxEpoch,
  };
}

/**
 * Step 2: Construct OAuth Login URL (Google)
 */
export function getGoogleLoginURL(nonce: string): string {
  const params = new URLSearchParams({
    client_id: ZKLOGIN_CONFIG.GOOGLE.CLIENT_ID,
    redirect_uri: ZKLOGIN_CONFIG.REDIRECT_URI,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce: nonce,
  });

  return `${ZKLOGIN_CONFIG.GOOGLE.AUTH_URL}?${params.toString()}`;
}

/**
 * Step 3: Extract JWT from URL hash
 */
export function extractJWTFromURL(): string | null {
  const hash = window.location.hash;
  
  if (!hash) {
    return null;
  }

  const params = new URLSearchParams(hash.substring(1)); // Remove leading #
  const idToken = params.get('id_token');

  // Clean up URL
  window.history.replaceState({}, document.title, window.location.pathname);

  return idToken;
}

/**
 * Step 4: Decode JWT
 */
export function decodeJWT(jwt: string): DecodedJWT {
  try {
    const decoded = jwtDecode<DecodedJWT>(jwt);
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    throw new Error('Invalid JWT token');
  }
}

/**
 * Step 5: Get User Salt (from your backend or Mysten's service)
 * In production, implement your own salt service for privacy
 */
export async function getUserSalt(jwt: string): Promise<string> {
  try {
    const response = await fetch(API_ENDPOINTS.zkLogin.getSalt, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jwt }),
    });

    if (!response.ok) {
      throw new Error(`Salt request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.salt;
  } catch (error) {
    console.error('Failed to get salt from backend:', error);
    throw new Error('Failed to obtain user salt');
  }
}


/**
 * Step 6: Get ZK Proof from proving service
 */
export async function getZkProof(
  jwt: string,
  salt: string,
  maxEpoch: number,
  randomness: string,
  ephemeralPublicKey: Uint8Array
): Promise<PartialZkLoginSignature> {
  try {
    const payload = {
      jwt,
      extendedEphemeralPublicKey: Array.from(ephemeralPublicKey),
      maxEpoch: maxEpoch.toString(),
      jwtRandomness: randomness,
      salt,
      keyClaimName: 'sub',
    };

    console.log('Requesting ZK proof with params:', {
      ...payload,
      jwt: jwt.substring(0, 50) + '...',
      extendedEphemeralPublicKey: payload.extendedEphemeralPublicKey.length + ' bytes',
    });

    const response = await fetch(ZKLOGIN_CONFIG.PROVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Prover error response:', errorText);
      throw new Error(`Prover service error: ${errorText}`);
    }

    const zkProof = await response.json();
    console.log('ZK proof obtained successfully');
    return zkProof;
  } catch (error) {
    console.error('Failed to get ZK proof:', error);
    throw new Error('Failed to obtain ZK proof');
  }
}

/**
 * Step 7: Compute zkLogin Address
 */
export function computeZkLoginAddress(
  userSalt: string,
  decodedJWT: DecodedJWT
): string {
  const addressSeed = genAddressSeed(
    BigInt(userSalt),
    'sub',
    decodedJWT.sub,
    typeof decodedJWT.aud === 'string' ? decodedJWT.aud : decodedJWT.aud[0]
  ).toString();

  return addressSeed;
}

/**
 * Step 8: Assemble zkLogin Signature
 */
export function assembleZkLoginSignature(
  partialZkLoginSignature: PartialZkLoginSignature,
  maxEpoch: number,
  addressSeed: string,
  userSignature: string
): string {
  const zkLoginSignature = getZkLoginSignature({
    inputs: {
      ...partialZkLoginSignature,
      addressSeed,
    },
    maxEpoch,
    userSignature,
  });

  return zkLoginSignature;
}

/**
 * Session Management - Save to localStorage
 */
export function saveZkLoginSession(session: Partial<ZkLoginSession>): void {
  const currentSession = getZkLoginSession() || {};
  const updatedSession = { ...currentSession, ...session };
  localStorage.setItem(ZKLOGIN_CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(updatedSession));
}

/**
 * Session Management - Load from localStorage
 */
export function getZkLoginSession(): ZkLoginSession | null {
  const sessionData = localStorage.getItem(ZKLOGIN_CONFIG.STORAGE_KEYS.SESSION);
  if (!sessionData) {
    return null;
  }
  
  try {
    return JSON.parse(sessionData);
  } catch {
    return null;
  }
}

/**
 * Session Management - Clear session
 */
export function clearZkLoginSession(): void {
  localStorage.removeItem(ZKLOGIN_CONFIG.STORAGE_KEYS.SESSION);
}

/**
 * Serialize Ephemeral Key Pair for storage
 */
export function serializeEphemeralKeyPair(keyPair: Ed25519Keypair): string {
  return keyPair.getSecretKey();
}

/**
 * Deserialize Ephemeral Key Pair from storage
 */
export function deserializeEphemeralKeyPair(serialized: string): Ed25519Keypair {
  return Ed25519Keypair.fromSecretKey(serialized);
}
