import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import AdminPanel from './pages/AdminPanel';
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import PlayersPage from './pages/PlayersPage';
import ManagersPage from './pages/ManagersPage';
import LeagueDashboard from './pages/LeagueDashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import LiveScoresPage from './pages/LiveScoresPage';
import MatchCenterPage from './pages/MatchCenterPage';
import SeasonSimulatorPage from './pages/SeasonSimulatorPage';
import PredictionHistoryPage from './pages/PredictionHistoryPage';
import BestPicksPage from './pages/BestPicksPage';
import LoginPage from './pages/LoginPage';
import FavouritesPage from './pages/FavouritesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import PickemPage from './pages/PickemPage';
import UserProfilePage from './pages/UserProfilePage';

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
    const ping = () => fetch(`${process.env.REACT_APP_API_URL}/health`).catch(() => {});
    ping();
    const interval = setInterval(ping, 600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;