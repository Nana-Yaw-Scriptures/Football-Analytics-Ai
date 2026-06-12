import { fetchWithTimeout } from './utils/fetchWithTimeout';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import SupportBot from './components/SupportBot';

// Route components are code-split: each page is downloaded only the first time
// it is opened, instead of shipping every page in the initial bundle. This
// shrinks the first load (helps slow connections) without changing any
// page behaviour, props, or routing.
const AdminPanel            = lazy(() => import('./pages/AdminPanel'));
const HomePage              = lazy(() => import('./pages/HomePage'));
const AnalysisPage          = lazy(() => import('./pages/AnalysisPage'));
const PlayersPage           = lazy(() => import('./pages/PlayersPage'));
const ManagersPage          = lazy(() => import('./pages/ManagersPage'));
const LeagueDashboard       = lazy(() => import('./pages/LeagueDashboard'));
const AnalyticsPage         = lazy(() => import('./pages/AnalyticsPage'));
const LiveScoresPage        = lazy(() => import('./pages/LiveScoresPage'));
const MatchCenterPage       = lazy(() => import('./pages/MatchCenterPage'));
const SeasonSimulatorPage   = lazy(() => import('./pages/SeasonSimulatorPage'));
const PredictionHistoryPage = lazy(() => import('./pages/PredictionHistoryPage'));
const BestPicksPage         = lazy(() => import('./pages/BestPicksPage'));
const LoginPage             = lazy(() => import('./pages/LoginPage'));
const FavouritesPage        = lazy(() => import('./pages/FavouritesPage'));
const LeaderboardPage       = lazy(() => import('./pages/LeaderboardPage'));
const PickemPage            = lazy(() => import('./pages/PickemPage'));
const UserProfilePage       = lazy(() => import('./pages/UserProfilePage'));
const WorldCupPage          = lazy(() => import('./pages/WorldCupPage'));

// Shown only for the brief moment a page chunk is downloading.
const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050810' }}>
    <div style={{ width: 38, height: 38, border: '3px solid rgba(34,211,238,0.15)', borderTopColor: '#22d3ee', borderRadius: '50%', animation: 'scorinaPageSpin 0.8s linear infinite' }} />
    <style>{`@keyframes scorinaPageSpin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    return hash || 'home';
  });

  // Listen for hash changes (e.g. after OAuth redirect or browser back/forward)
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      setCurrentPage(hash || 'home');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [navParams, setNavParams]           = useState({});

  const handleNavigation = (page, params = null) => {
    setCurrentPage(page);
    window.location.hash = `/${page}`;
    if (typeof params === 'string') {
      setSelectedLeague(params);
      setNavParams({});
    } else if (params && typeof params === 'object') {
      setNavParams(params);
      if (params.league) setSelectedLeague(params.league);
    } else {
      setNavParams({});
    }
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    // Ping every 4 min (was 10 min) to prevent Railway cold starts on slow networks
    const ping = () => fetchWithTimeout(`${process.env.REACT_APP_API_URL}/health`, {}, 8000).catch(() => {});
    ping();
    const interval = setInterval(ping, 240000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        {currentPage === 'home'      && <HomePage              onNavigate={handleNavigation} />}
        {currentPage === 'login'     && <LoginPage             onNavigate={handleNavigation} />}
        {currentPage === 'analysis'  && <AnalysisPage          onNavigate={handleNavigation} navParams={navParams} />}
        {currentPage === 'players'   && <PlayersPage           onNavigate={handleNavigation} />}
        {currentPage === 'managers'  && <ManagersPage          onNavigate={handleNavigation} />}
        {currentPage === 'league'    && <LeagueDashboard       league={selectedLeague} onNavigate={handleNavigation} />}
        {currentPage === 'admin'     && <AdminPanel            onNavigate={handleNavigation} />}
        {currentPage === 'analytics' && <AnalyticsPage         onNavigate={handleNavigation} />}
        {currentPage === 'live'      && <LiveScoresPage        onNavigate={handleNavigation} />}
        {currentPage === 'match'     && <MatchCenterPage       fixtureId={navParams.fixtureId} onNavigate={handleNavigation} />}
        {currentPage === 'simulator' && <SeasonSimulatorPage   onNavigate={handleNavigation} />}
        {currentPage === 'history'   && <PredictionHistoryPage onNavigate={handleNavigation} />}
        {currentPage === 'bestpicks' && <BestPicksPage         onNavigate={handleNavigation} />}
        {currentPage === 'favourites'   && <FavouritesPage       onNavigate={handleNavigation} />}
        {currentPage === 'leaderboard'  && <LeaderboardPage      onNavigate={handleNavigation} />}
        {currentPage === 'pickem'       && <PickemPage           onNavigate={handleNavigation} />}
        {currentPage === 'profile'      && <UserProfilePage      onNavigate={handleNavigation} />}
        {currentPage === 'worldcup'     && <WorldCupPage         onNavigate={handleNavigation} />}
      </Suspense>
      <SupportBot/>
    </AuthProvider>
  );
}

export default App;
