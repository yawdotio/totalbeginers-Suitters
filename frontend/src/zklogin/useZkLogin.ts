import { useState, useEffect, useCallback } from 'react';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import {
  generateEphemeralKeyAndNonce,
  getGoogleLoginURL,
  extractJWTFromURL,
  decodeJWT,
  getUserSalt,
  getZkProof,
  computeZkLoginAddress,
  saveZkLoginSession,
  getZkLoginSession,
  clearZkLoginSession,
  serializeEphemeralKeyPair,
  deserializeEphemeralKeyPair,
} from './utils';
import type { DecodedJWT } from './types';

interface UseZkLoginReturn {
  isLoading: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  userAddress: string | null;
  decodedJWT: DecodedJWT | null;
  error: string | null;
  ephemeralKeyPair: string | null;
  login: () => Promise<void>;
  logout: () => void;
}

export function useZkLogin(): UseZkLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [decodedJWT, setDecodedJWT] = useState<DecodedJWT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ephemeralKeyPair, setEphemeralKeyPair] = useState<string | null>(null);

//Check for existing session or OAuth redirect on mount
  useEffect(() => {
    // This is there to check if we're coming back from OAuth redirect
    const jwt = extractJWTFromURL();
    if (jwt) {
      // We have a JWT from OAuth redirect, complete the login
      completeLogin(jwt);
      return;
    }

    // Otherwise, check for existing session
    const session = getZkLoginSession();
    if (session?.userAddress && session?.jwt) {
      setIsAuthenticated(true);
      setUserAddress(session.userAddress);
      setEphemeralKeyPair(session.ephemeralKeyPair || null);
      try {
        const decoded = decodeJWT(session.jwt);
        setDecodedJWT(decoded);
      } catch (err) {
        console.error('Failed to decode stored JWT:', err);
        clearZkLoginSession();
      }
    }
    setIsReady(true);
  }, []);

  /**
   * Step 1: Initiate zkLogin flow
   */
  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate ephemeral key and nonce
      const { ephemeralKeyPair, randomness, nonce, maxEpoch } = 
        await generateEphemeralKeyAndNonce();

      // Save session data
      saveZkLoginSession({
        ephemeralKeyPair: serializeEphemeralKeyPair(ephemeralKeyPair),
        randomness,
        nonce,
        maxEpoch,
      });

      // Redirect to Google OAuth
      const loginURL = getGoogleLoginURL(nonce);
      window.location.href = loginURL;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate login';
      setError(errorMessage);
      console.error('Login error:', err);
      setIsLoading(false);
      setIsReady(true);
    }
  }, []);

  /**
   * Step 2: Complete login after OAuth redirect
   */
  const completeLogin = useCallback(async (jwt: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Decode JWT
      const decoded = decodeJWT(jwt);
      setDecodedJWT(decoded);

      // Get stored session
      const session = getZkLoginSession();
      if (!session || !session.ephemeralKeyPair || !session.randomness) {
        throw new Error('No stored session found. Please try logging in again.');
      }

      // Get user salt
      const salt = await getUserSalt(jwt);

      // Deserialize ephemeral key pair
      const ephemeralKeyPair = deserializeEphemeralKeyPair(session.ephemeralKeyPair);

      // Get ZK proof (stored for future transaction signing)
      const zkProof = await getZkProof(
        jwt,
        salt,
        session.maxEpoch,
        session.randomness,
        ephemeralKeyPair.getPublicKey().toRawBytes()
      );

      // Compute zkLogin address seed
      const addressSeed = computeZkLoginAddress(salt, decoded);
      
      // The zkLogin address is computed using genAddressSeed which returns a BigInt string
      // Convert the address seed to a 32-byte array and then to a Sui address
      const addressSeedBigInt = BigInt(addressSeed);
      const addressBytes = new Uint8Array(32);
      let temp = addressSeedBigInt;
      for (let i = 31; i >= 0; i--) {
        addressBytes[i] = Number(temp & BigInt(0xff));
        temp = temp >> BigInt(8);
      }
      
      // Convert to hex address and normalize
      const derivedAddress = normalizeSuiAddress(
        '0x' + Array.from(addressBytes)
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('')
      );

      // Update session with complete data including ZK proof
      saveZkLoginSession({
        jwt,
        salt,
        sub: decoded.sub,
        aud: typeof decoded.aud === 'string' ? decoded.aud : decoded.aud[0],
        userAddress: derivedAddress,
        zkProof: JSON.stringify(zkProof), // Store ZK proof for transaction signing
        addressSeed, // Store address seed for signature assembly
      });

      setUserAddress(derivedAddress);
      setIsAuthenticated(true);
      setEphemeralKeyPair(session.ephemeralKeyPair);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete login';
      setError(errorMessage);
      console.error('Complete login error:', err);
      setIsLoading(false);
      clearZkLoginSession();
    }
  }, []);

  /**
   * Logout and clear session
   */
  const logout = useCallback(() => {
    clearZkLoginSession();
    setIsAuthenticated(false);
    setUserAddress(null);
    setDecodedJWT(null);
    setEphemeralKeyPair(null);
    setError(null);
    setIsReady(true);
  }, []);

  return {
    isLoading,
    isReady,
    isAuthenticated,
    userAddress,
    decodedJWT,
    error,
    ephemeralKeyPair,
    login,
    logout,
  };
}
