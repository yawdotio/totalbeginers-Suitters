import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useZkLogin } from '../zklogin/useZkLogin';

export const NotFound: React.FC = () => {
  const { isAuthenticated: isZkLoginAuthenticated } = useZkLogin();
  const currentAccount = useCurrentAccount();
  const isAuthenticated = isZkLoginAuthenticated || !!currentAccount;

  // Austin: Redirect to home if not authenticated, otherwise show 404
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-black dark:text-white mb-4">404</h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 mb-8">Page not found.</p>
        <a 
          href="/feed" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined">home</span>
          Go to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
