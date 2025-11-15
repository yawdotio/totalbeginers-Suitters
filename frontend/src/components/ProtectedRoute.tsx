import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useZkLogin } from '../zklogin/useZkLogin';

interface Props {
  children: JSX.Element;
}

/**
 * Austin: Loading screen to show while checking authentication state
 * This prevents the blank page on hard refresh
 */
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100%',
      backgroundColor: '#101b22'
    }}>
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: '48px',
          color: '#1ca0f2',
          animation: 'spin 1s linear infinite'
        }}
      >
        progress_activity
      </span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated: isZkLoginAuthenticated, isLoading: isZkLoginLoading } = useZkLogin();
  
  // Austin: useCurrentAccount returns the account object or null
  // If it exists, wallet is connected
  const currentAccount = useCurrentAccount();
  const isWalletConnected = !!currentAccount;
  
  // Austin: Combine both authentication states
  const isAuthenticated = isZkLoginAuthenticated || isWalletConnected;
  
  // Austin: For now, only check zkLogin loading state
  // Wallet connection is synchronous after initial load
  const isLoading = isZkLoginLoading;
  
  const location = useLocation();

  // Austin: Show loading screen while checking authentication, NOT null (prevents blank page)
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Austin: Redirect to landing if not authenticated after loading is complete
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  return children;
};

export default ProtectedRoute;
