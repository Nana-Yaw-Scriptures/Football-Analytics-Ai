import React, { useState, useEffect, useCallback } from 'react';
import NavBar from '../components/NavBar';
import { useAuth } from '../context/AuthContext';
import { getFavourites, removeFavourite } from '../services/supabaseService';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const I = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const HeartIcon    = p => <I {...p} d={<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>}/>;
const UserIcon     = p => <I {...p} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>;
const TrashIcon    = p => <I {...p} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>}/>;
const SearchIcon   = p => <I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const ArrowRightIcon = p => <I {...p} d={<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>}/>;

const LEAGUE_COLOR = {
  'Premier League':   '#7c3aed',
  'La Liga':          '#dc2626',
  'Bundesliga':       '#d97706',
  'Serie A':          '#059669',
  'Ligue 1':          '#2563eb',
  'Primeira Liga':    '#10b981',
  'Champions League': '#f59e0b',
};

const LEAGUE_IMG = {
  'Premier League':   'https://media.api-sports.io/football/leagues/39.png',
  'La Liga':          'https://media.api-sports.io/football/leagues/140.png',
  'Bundesliga':       'https://media.api-sports.io/football/leagues/78.png',
  'Serie A':          'https://media.api-sports.io/football/leagues/135.png',
  'Ligue 1':          'https://media.api-sports.io/football/leagues/61.png',
  'Primeira Liga':    'https://media.api-sports.io/football/leagues/94.png',
  'Champions League': 'https://media.api-sports.io/football/leagues/2.png',
};

const POS_COLOR = {
  'Forward':    '#ef4444',
  'Midfielder': '#22d3ee',
  'Defender':   '#10b981',
  'Goalkeeper': '#f59e0b',
};

export default function FavouritesPage({ onNavigate }) {
  const { user }                    = useAuth();
  const [favourites, setFavourites] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [removing,   setRemoving]   = useState(null);
  const [toast,      setToast]      = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const loadFavourites = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getFavourites(user.id);
      setFavourites(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadFavourites(); }, [loadFavourites]);

  const handleRemove = async (fav) => {
    setRemoving(fav.player_id);
    try {
      await removeFavourite(user.id, fav.player_id);
      setFavourites(prev => prev.filter(f => f.player_id !== fav.player_id));
      showToast(`${fav.player_name} removed from favourites`);
    } catch (e) {
      console.error(e);
    } finally {
      setRemoving(null);
    }
  };

  const filtered = favourites.filter(f => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (f.player_name || '').toLowerCase().includes(q) ||
           (f.team || '').toLowerCase().includes(q) ||
           (f.league || '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#050810] text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{ background: 'radial-gradient(circle,rgba(239,68,68,0.06) 0%,transparent 65%)' }}/>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle,rgba(34,211,238,0.04) 0%,transparent 65%)' }}/>
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }}/>
      </div>

      <NavBar currentPage="favourites" onNavigate={onNavigate}/>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"/>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-400">My Favourites</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-2">
                Saved<br/>
                <span style={{ background: 'linear-gradient(90deg,#ef4444,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Players
                </span>
              </h1>
              <p className="text-slate-500 text-sm">
                {favourites.length > 0
                  ? <><span className="text-white font-bold">{favourites.length}</span> player{favourites.length !== 1 ? 's' : ''} bookmarked</>
                  : 'Bookmark players to track them here'}
              </p>
            </div>
          </div>
        </div>

        {/* Not logged in */}
        {!user && !loading && (
          <div className="rounded-2xl border border-white/[0.07] p-12 text-center"
            style={{ background: 'rgba(10,14,26,0.8)' }}>
            <HeartIcon className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
            <p className="text-white font-black text-lg mb-1">Sign in to see your favourites</p>
            <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">
              Create an account to bookmark players and track them across sessions.
            </p>
            <button onClick={() => onNavigate('login')}
              className="px-6 py-3 rounded-xl font-bold text-sm border transition-all"
              style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)', color: '#ef4444' }}>
              Sign In →
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 relative">
              <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'rgba(239,68,68,0.2)' }}/>
              <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#ef4444', borderTopColor: 'transparent' }}/>
            </div>
          </div>
        )}

        {/* Content */}
        {user && !loading && (
          <>
            {favourites.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.07] p-12 text-center"
                style={{ background: 'rgba(10,14,26,0.8)' }}>
                <HeartIcon className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
                <p className="text-white font-black text-lg mb-1">No favourites yet</p>
                <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">
                  Go to the Players page and click the heart icon on any player to save them here.
                </p>
                <button onClick={() => onNavigate('players')}
                  className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-bold text-sm border transition-all"
                  style={{ background: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.25)', color: '#22d3ee' }}>
                  <UserIcon className="w-4 h-4"/> Browse Players
                </button>
              </div>
            ) : (
              <>
                {/* Search */}
                {favourites.length > 4 && (
                  <div className="relative mb-5">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"/>
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search by name, team or league…"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-white placeholder-slate-600 outline-none border transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', borderColor: search ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)' }}/>
                  </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((fav, idx) => {
                    const leagueColor = LEAGUE_COLOR[fav.league] || '#22d3ee';
                    const posColor    = POS_COLOR[fav.position]  || '#94a3b8';
                    const initials    = (fav.player_name || '?').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();

                    return (
                      <div key={fav.id || idx}
                        className="relative rounded-2xl border overflow-hidden transition-all group"
                        style={{
                          background: 'rgba(10,14,26,0.9)',
                          borderColor: 'rgba(255,255,255,0.07)',
                          animation: `favIn 0.3s ease-out ${idx * 0.05}s both`,
                        }}>

                        {/* Accent line */}
                        <div className="h-[2px]" style={{ background: `linear-gradient(90deg,${leagueColor},${leagueColor}40)` }}/>

                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Photo */}
                            <div className="relative flex-shrink-0">
                              {fav.photo ? (
                                <img src={fav.photo} alt={fav.player_name}
                                  className="w-14 h-14 rounded-xl object-cover border border-white/10"
                                  onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}/>
                              ) : null}
                              <div className="w-14 h-14 rounded-xl border border-white/10 items-center justify-center font-black text-lg"
                                style={{ background: `${leagueColor}12`, color: leagueColor, display: fav.photo ? 'none' : 'flex' }}>
                                {initials}
                              </div>
                              {/* League badge */}
                              {LEAGUE_IMG[fav.league] && (
                                <img src={LEAGUE_IMG[fav.league]} alt=""
                                  className="absolute -bottom-1.5 -right-1.5 w-5 h-5 object-contain rounded-full border border-[#0a0e1a] bg-[#0a0e1a]"/>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-black text-base truncate leading-tight">{fav.player_name || '—'}</p>
                              <p className="text-sm truncate mt-0.5 font-semibold" style={{ color: leagueColor }}>{fav.team || '—'}</p>
                              {fav.position && (
                                <span className="inline-block mt-1.5 text-[10px] font-black px-2 py-0.5 rounded-md"
                                  style={{ background: `${posColor}15`, color: posColor, border: `1px solid ${posColor}25` }}>
                                  {fav.position}
                                </span>
                              )}
                            </div>

                            {/* Remove button */}
                            <button
                              onClick={() => handleRemove(fav)}
                              disabled={removing === fav.player_id}
                              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 opacity-0 group-hover:opacity-100 disabled:opacity-30"
                              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                              <TrashIcon className="w-3.5 h-3.5"/>
                            </button>
                          </div>

                          {/* Go to analysis with player prefilled */}
                          <button
                            onClick={() => onNavigate('analysis', { prefillQuery: fav.player_name, activeTab: 'scout' })}
                            className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border border-white/[0.05] hover:border-white/[0.12]"
                            style={{ background: 'rgba(255,255,255,0.02)', color: '#475569' }}>
                            <span>Analyse {(fav.player_name || '').split(' ').pop()}</span>
                            <ArrowRightIcon className="w-3 h-3"/>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filtered.length === 0 && search && (
                  <div className="text-center py-16">
                    <p className="text-slate-500 text-sm">No players match "{search}"</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-white text-sm font-bold border"
          style={{ background: 'rgba(239,68,68,0.95)', borderColor: 'rgba(239,68,68,0.4)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(239,68,68,0.25)', animation: 'favIn 0.3s ease-out' }}>
          ❤️ {toast}
        </div>
      )}

      <style>{`
        @keyframes favIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}