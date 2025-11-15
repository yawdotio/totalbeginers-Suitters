import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useZkLogin } from '../zklogin/useZkLogin';
import { ZkLoginButton } from '../zklogin/ZkLoginButton';
import { ConnectButton } from '@mysten/dapp-kit';

/**
 * Austin: Loading screen to show while checking authentication state
 * Prevents flash of landing page if already authenticated
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

export default function Landing() {
  const navigate = useNavigate();

  // Austin: Get authentication states from both methods
  const { isAuthenticated: isZkLoginAuthenticated, isLoading: isZkLoginLoading } = useZkLogin();
  const currentAccount = useCurrentAccount();
  
  // Austin: Wallet is connected if currentAccount exists
  const isWalletConnected = !!currentAccount;
  
  // Austin: Combine both authentication states
  const isAuthenticated = isZkLoginAuthenticated || isWalletConnected;
  
  // Austin: Only check zkLogin loading (wallet connection is synchronous)
  const isLoading = isZkLoginLoading;

  // Austin: Redirect to feed if already authenticated
  useEffect(() => {
    // Wait for loading to complete
    if (isLoading) {
      return;
    }
    
    // Once loading is complete, redirect if authenticated
    if (isAuthenticated) {
      navigate('/feed', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Austin: Show loading screen while checking auth (prevents flash of landing page)
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="landing-page" style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans', sans-serif" }}>
      <style>{`
        .landing-page {
          min-height: 100vh;
          width: 100%;
          background: #f5f7f8;
        }
        
        @media (prefers-color-scheme: dark) {
          .landing-page {
            background: #101b22;
          }
        }

        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        .landing-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
          flex-direction: column;
        }

        @media (min-width: 1024px) {
          .landing-container {
            flex-direction: row;
          }
        }

        /* Left Panel */
        .left-panel {
          display: none;
          width: 100%;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #1ca0f2;
          padding: 2.5rem;
          position: relative;
        }

        @media (min-width: 1024px) {
          .left-panel {
            display: flex;
            width: 50%;
          }
        }

        .left-panel-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBGQd1VkhjXVSkxpEFHagvAUSIkusX64dIUiJTbK7knanNcn10YKcJnDH1fYvCaTF7omBOP1iXcX2EFIq08mDwebqaxyS-Hk4oUHhtFOlFMjTzE09s2Q62bZVWM1SpjKu-cn0CG_uPj-1VasMV7uyVa9KG4QRJBqhcKNYVS-oQ0LLyTAJq3v-aMAmz-nhu9KjQwF4-P8PGxt-xx5B-F5MQgftsMtxZHNMMFcUUSaAo69Yc2Fo64PtrUeaIpCDs_ZD8zL2IeRYI2');
          background-size: cover;
          background-position: center;
          background-blend-mode: overlay;
          opacity: 0.1;
        }

        .left-panel-content {
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          color: white;
        }

        .twitter-icon {
          height: 5rem;
          width: 5rem;
          color: white;
          margin-bottom: 1.5rem;
        }

        .left-panel h1 {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.025em;
        }

        .left-panel p {
          margin-top: 1rem;
          max-width: 28rem;
          font-size: 1.125rem;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.8);
        }

        /* Right Panel */
        .right-panel {
          display: flex;
          width: 100%;
          flex: 1;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: #f5f7f8;
        }

        @media (prefers-color-scheme: dark) {
          .right-panel {
            background: #101b22;
          }
        }

        @media (min-width: 640px) {
          .right-panel {
            padding: 2rem;
          }
        }

        @media (min-width: 1024px) {
          .right-panel {
            width: 50%;
          }
        }

        .form-container {
          width: 100%;
          max-width: 28rem;
        }

        .form-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .heading-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          text-align: center;
        }

        @media (min-width: 1024px) {
          .heading-section {
            text-align: left;
          }
        }

        .heading-section h2 {
          color: #0f172a;
          font-size: 2.25rem;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.033em;
        }

        @media (prefers-color-scheme: dark) {
          .heading-section h2 {
            color: white;
          }
        }

        .heading-section p {
          color: #64748b;
          font-size: 1rem;
          line-height: 1.5;
        }

        @media (prefers-color-scheme: dark) {
          .heading-section p {
            color: #9caeba;
          }
        }

        .auth-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .auth-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: all 0.2s;
          cursor: pointer;
        }

        .auth-button.primary {
          background: #1ca0f2;
          color: white;
          border: none;
          font-size: 1rem;
          padding: 0.875rem 1.25rem;
        }

        .auth-button.primary:hover {
          background: #1890d9;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1rem 0;
        }

        .divider hr {
          width: 100%;
          border: none;
          border-top: 1px solid #e2e8f0;
        }

        @media (prefers-color-scheme: dark) {
          .divider hr {
            border-top-color: #334155;
          }
        }

        .divider span {
          font-size: 0.875rem;
          color: #64748b;
        }

        @media (prefers-color-scheme: dark) {
          .divider span {
            color: #94a3b8;
          }
        }

        .wallet-connect-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .wallet-button-container {
          width: 100%;
        }

        .wallet-button-container > div {
          width: 100%;
        }

        .wallet-button-container button {
          width: 100% !important;
          justify-content: center !important;
          padding: 0.875rem 1.25rem !important;
          font-size: 1rem !important;
          border-radius: 0.5rem !important;
        }

        .info-text {
          text-align: center;
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 1rem;
        }

        @media (prefers-color-scheme: dark) {
          .info-text {
            color: #94a3b8;
          }
        }
      `}</style>

      <div className="landing-container">
        {/* Left Panel */}
        <div className="left-panel">
          <div className="left-panel-bg"></div>
          <div className="left-panel-content">
            <svg className="twitter-icon" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.48 2.96,10.26 2.38,9.95C2.38,9.97 2.38,9.98 2.38,10C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.43,16.03 6.02,17.25 7.89,17.29C6.43,18.45 4.58,19.13 2.56,19.13C2.22,19.13 1.88,19.11 1.54,19.07C3.44,20.29 5.7,21 8.12,21C16,21 20.33,14.46 20.33,8.79C20.33,8.6 20.33,8.42 20.32,8.23C21.16,7.63 21.88,6.87 22.46,6Z"></path>
            </svg>
            <h1>Connect with what's happening.</h1>
            <p>Join the conversation, follow interests, and be in the know.</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <div className="form-container">
            <div className="form-content">
              {/* Heading */}
              <div className="heading-section">
                <h2>Welcome to Suitter</h2>
                <p>Connect your wallet or use zkLogin to get started.</p>
              </div>

              {/* Authentication Methods */}
              <div className="wallet-connect-wrapper">
                {/* zkLogin Button */}
                <div className="wallet-button-container">
                  <ZkLoginButton />
                </div>

                {/* Divider */}
                <div className="divider">
                  <hr />
                  <span>OR</span>
                  <hr />
                </div>

                {/* Wallet Connect Button */}
                <div className="wallet-button-container">
                  <ConnectButton />
                </div>
              </div>

              {/* Info Text */}
              <p className="info-text">
                By connecting, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
