import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { BrowserRouter, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import { ZkLoginButton } from './zklogin/ZkLoginButton';
import { useZkLogin } from './zklogin/useZkLogin';
import Landing from "./pages/Landing";
import Feed from './pages/Feed';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

// Austin: Import the new pages
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';

/**
 * LeftSidebar Component - Austin: Updated with new navigation links
 */
function LeftSidebar() {
  const { userAddress: zkUser } = useZkLogin();
  const currentAccount = useCurrentAccount();
  const location = useLocation();

  // Austin: Helper to determine active link styling
  const getLinkClass = (_path: string) => {
    return `flex items-center gap-4 px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors`;
  };

  const getIconStyle = (path: string) => {
    const isActive = location.pathname === path;
    return {
      fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0"
    };
  };

  const getTextClass = (path: string) => {
    const isActive = location.pathname === path;
    return `text-black dark:text-white text-lg leading-normal ${isActive ? 'font-bold' : 'font-normal'}`;
  };

  return (
    <header className="w-[275px] min-h-screen flex flex-col justify-between p-2 sticky top-0">
      <div className="flex flex-col gap-2">
        <div className="p-3">
          <span className="material-symbols-outlined text-black dark:text-white text-3xl">
            forum
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          <Link className={getLinkClass('/feed')} to="/feed">
            <span className="material-symbols-outlined text-black dark:text-white text-2xl" style={getIconStyle('/feed')}>
              home
            </span>
            <p className={getTextClass('/feed')}>Home</p>
          </Link>
          <Link className={getLinkClass('/explore')} to="/explore">
            <span className="material-symbols-outlined text-black dark:text-white text-2xl" style={getIconStyle('/explore')}>
              tag
            </span>
            <p className={getTextClass('/explore')}>Explore</p>
          </Link>
          <Link className={getLinkClass('/notifications')} to="/notifications">
            <span className="material-symbols-outlined text-black dark:text-white text-2xl" style={getIconStyle('/notifications')}>
              notifications
            </span>
            <p className={getTextClass('/notifications')}>Notifications</p>
          </Link>
          <Link className={getLinkClass('/messages')} to="/messages">
            <span className="material-symbols-outlined text-black dark:text-white text-2xl" style={getIconStyle('/messages')}>
              mail
            </span>
            <p className={getTextClass('/messages')}>Messages</p>
          </Link>
          <Link className={getLinkClass(`/profile/${currentAccount?.address || zkUser || ''}`)} to={`/profile/${currentAccount?.address || zkUser || ''}`}>
            <span className="material-symbols-outlined text-black dark:text-white text-2xl" style={getIconStyle(`/profile/${currentAccount?.address || zkUser || ''}`)}>
              person
            </span>
            <p className={getTextClass(`/profile/${currentAccount?.address || zkUser || ''}`)}>Profile</p>
          </Link>
        </nav>
        <div className="mt-4 px-2">
          <Link to="/create" className="w-full flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-4 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em]">
            <span className="truncate">Post</span>
          </Link>
        </div>
      </div>

      {/* Austin: User/Wallet Info Box - Shows zkLogin or wallet connect button */}
      <div className="flex flex-col gap-2 p-3">
        {zkUser ? (
          <ZkLoginButton />
        ) : (
          <ConnectButton />
        )}
      </div>
    </header>
  );
}

/**
 * RightSidebar Component - Austin: Trends and suggestions sidebar
 */
function RightSidebar() {
  return (
    <aside className="w-[350px] ml-8 hidden lg:block h-screen overflow-y-auto">
      <div className="sticky top-0 py-4 flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            search
          </span>
          <input className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full h-11 pl-12 pr-4 text-black dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary" placeholder="Search" type="text" />
        </div>
        
        {/* Trends for you */}
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl">
          <h2 className="text-xl font-extrabold text-black dark:text-white p-4">Trends for you</h2>
          <div className="flex flex-col">
            <a className="px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" href="#">
              <p className="text-slate-500 dark:text-slate-400 text-xs">Trending in Tech</p>
              <p className="text-black dark:text-white font-bold">#UIUXDesign</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">15.2k posts</p>
            </a>
            <a className="px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" href="#">
              <p className="text-slate-500 dark:text-slate-400 text-xs">Trending in Design</p>
              <p className="text-black dark:text-white font-bold">#WebDesign</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">8.5k posts</p>
            </a>
            <a className="text-primary p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-b-xl text-sm" href="#">
              Show more
            </a>
          </div>
        </div>
        
        {/* Who to follow */}
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl">
          <h2 className="text-xl font-extrabold text-black dark:text-white p-4">Who to follow</h2>
          <div className="flex flex-col">
            <a className="px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-3" href="#">
              <div className="flex items-center gap-3">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=Emily+Carter&background=random')" }}></div>
                <div>
                  <p className="font-bold text-black dark:text-white">Emily Carter</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">@emilycarter</p>
                </div>
              </div>
              <button className="bg-black dark:bg-white text-white dark:text-black font-bold text-sm px-4 h-8 rounded-full">Follow</button>
            </a>
            <a className="text-primary p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-b-xl text-sm" href="#">
              Show more
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * MainLayout Component - Austin: 3-column layout wrapper for authenticated pages
 * Uses <Outlet /> to render child routes in the center column
 * Adjusts layout for Messages page (full width, no right sidebar)
 */
function MainLayout() {
  const location = useLocation();
  const isMessagesPage = location.pathname === '/messages';

  return (
    <div className="flex justify-center min-h-screen bg-background-light dark:bg-background-dark font-display">
      <div className="w-full max-w-7xl flex h-screen overflow-hidden">
        <LeftSidebar />
        
        {/* Austin: Main content area - scrollable with fixed height */}
        <main className={
          isMessagesPage 
            ? "w-full border-l border-r border-slate-200 dark:border-slate-700 overflow-y-auto" 
            : "w-full max-w-[600px] border-l border-r border-slate-200 dark:border-slate-700 overflow-y-auto"
        }>
          <Outlet />
        </main>

        {/* Austin: Hide right sidebar on messages page */}
        {!isMessagesPage && <RightSidebar />}
      </div>
    </div>
  );
}

/**
 * AppContent Component - Austin: Main router configuration
 */
function AppContent() {
  return (
    <Routes>
      {/* Landing Page (no layout) */}
      <Route path="/" element={<Landing />} />
      
      {/* Austin: Protected routes with 3-column layout */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/feed" element={<Feed />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile/:id" element={<Profile />} />
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
