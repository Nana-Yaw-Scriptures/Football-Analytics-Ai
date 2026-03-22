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
import React, { useState, useEffect } from 'react';  // add useEffect import

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [navParams, setNavParams] = useState({});

  const handleNavigation = (page, params = null) => {
    setCurrentPage(page);
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

  // Keep backend alive
useEffect(() => {
  const ping = () => fetch(`${process.env.REACT_APP_API_URL}/health`).catch(()=>{});
  ping();
  const interval = setInterval(ping, 600000); // every 10 mins
  return () => clearInterval(interval);
}, []);

  return (
    <>
      {currentPage === 'home' && <HomePage onNavigate={handleNavigation} />}
      {currentPage === 'analysis' && <AnalysisPage onNavigate={handleNavigation} navParams={navParams} />}
      {currentPage === 'players' && <PlayersPage onNavigate={handleNavigation} />}
      {currentPage === 'managers' && <ManagersPage onNavigate={handleNavigation} />}
      {currentPage === 'league' && <LeagueDashboard league={selectedLeague} onNavigate={handleNavigation} />}
      {currentPage === 'admin' && <AdminPanel onNavigate={handleNavigation} />}
      {currentPage === 'analytics' && <AnalyticsPage onNavigate={handleNavigation} />}
      {currentPage === 'live' && <LiveScoresPage onNavigate={handleNavigation} />}
      {currentPage === 'match' && <MatchCenterPage fixtureId={navParams.fixtureId} onNavigate={handleNavigation} />}
      {currentPage === 'simulator' && <SeasonSimulatorPage onNavigate={handleNavigation} />}
      {currentPage === 'history' && <PredictionHistoryPage onNavigate={handleNavigation} />}
      {currentPage === 'bestpicks' && <BestPicksPage onNavigate={handleNavigation} />}
    </>
  );
}

export default App;