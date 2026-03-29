import React, { useState, useEffect, useCallback } from 'react';
import NavBar from '../components/NavBar';
import { useAuth } from '../context/AuthContext';
import { getPredictions } from '../services/supabaseService';
import { supabase } from '../supabaseClient';

const I = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const TrophyIcon  = p => <I {...p} d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></>}/>;
const TargetIcon  = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const ZapIcon     = p => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const CheckIcon   = p => <I {...p} d={<polyline points="20 6 9 17 4 12"/>}/>;
const XIcon       = p => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const ClockIcon   = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const LogOutIcon  = p => <I {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}/>;
const GlobeIcon   = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}/>;
const HeartIcon   = p => <I {...p} d={<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>}/>;

const LEAGUE_COLOR = {
  'Premier League': '#7c3aed', 'La Liga': '#dc2626', 'Bundesliga': '#d97706',
  'Serie A': '#059669', 'Ligue 1': '#2563eb', 'Primeira Liga': '#10b981', 'Champions League': '#f59e0b',
};

export default function UserProfilePage({ onNavigate }) {
  const { user, signOut }             = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [rank,        setRank]        = useState(null);
  const [favourites,  setFavourites]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [signingOut,  setSigningOut]  = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [preds, favs, rankRow] = await Promise.allSettled([
        getPredictions(user.id),
        supabase.from('player_favourites').select('*').eq('user_id', user.id),
        supabase.from('leaderboard').select('*').eq('user_id', user.id).single(),
      ]);

      if (preds.status === 'fulfilled') setPredictions(preds.value || []);
      if (favs.status === 'fulfilled')  setFavourites(favs.value.data || []);
      if (rankRow.status === 'fulfilled' && rankRow.value.data) {
        // Get rank position
        const { data: allRows } = await supabase.from('leaderboard').select('user_id').order('accuracy', { ascending: false });
        const idx = (allRows || []).findIndex(r => r.user_id === user.id);
        setRank({ position: idx + 1, ...rankRow.value.data });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signOut(); } catch (e) { setSigningOut(false); }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050810] flex flex-col" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <NavBar currentPage="profile" onNavigate={onNavigate}/>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <p className="text-white font-black text-xl mb-2">Not signed in</p>
            <button onClick={() => onNavigate('login')}
              className="px-6 py-3 rounded-xl font-bold text-sm border"
              style={{ background: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.25)', color: '#22d3ee' }}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Compute stats
  const resolved    = predictions.filter(p => p.resolved);
  const correct     = predictions.filter(p => p.correct);
  const pending     = predictions.filter(p => !p.resolved);
  const accuracy    = resolved.length > 0 ? Math.round((correct.length / resolved.length) * 100) : 0;
  const accColor    = accuracy >= 70 ? '#10b981' : accuracy >= 55 ? '#22d3ee' : accuracy >= 40 ? '#f59e0b' : '#ef4444';

  // Streak
  const sortedResolved = [...resolved].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  let currentStreak = 0;
  for (const p of sortedResolved) {
    if (p.correct) currentStreak++;
    else break;
  }
  let bestStreak = 0, streak = 0;
  for (const p of [...resolved].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))) {
    if (p.correct) { streak++; if (streak > bestStreak) bestStreak = streak; }
    else streak = 0;
  }

  // League breakdown
  const leagueStats = {};
  resolved.forEach(p => {
    if (!leagueStats[p.league]) leagueStats[p.league] = { correct: 0, total: 0 };
    leagueStats[p.league].total++;
    if (p.correct) leagueStats[p.league].correct++;
  });
  const leagueList = Object.entries(leagueStats)
    .map(([league, s]) => ({ league, ...s, accuracy: Math.round(s.correct / s.total * 100) }))
    .sort((a, b) => b.total - a.total);

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const avatar      = user.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-[#050810] text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{ background: 'radial-gradient(circle,rgba(34,211,238,0.06) 0%,transparent 65%)' }}/>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 65%)' }}/>
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }}/>
      </div>

      <NavBar currentPage="profile" onNavigate={onNavigate}/>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8">

        {/* Profile hero */}
        <div className="rounded-3xl border border-white/[0.08] overflow-hidden mb-6"
          style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.06),rgba(168,85,247,0.04),transparent)' }}>
          <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#22d3ee,#a855f7)' }}/>
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatar ? (
                <img src={avatar} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20"/>
              ) : (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl border-2 border-white/10"
                  style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              {rank && (
                <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] border-2 border-[#050810]"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000' }}>
                  #{rank.position}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white truncate">{displayName}</h1>
              <p className="text-slate-500 text-sm mt-0.5">{user.email}</p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {rank && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black"
                    style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
                    <TrophyIcon className="w-3 h-3"/> Rank #{rank.position}
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
                  {predictions.length} predictions total
                </div>
              </div>
            </div>

            {/* Sign out */}
            <button onClick={handleSignOut} disabled={signingOut}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border transition-all flex-shrink-0 disabled:opacity-50"
              style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
              <LogOutIcon className="w-4 h-4"/>
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#22d3ee', borderTopColor: 'transparent' }}/>
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Accuracy',       value: `${accuracy}%`,      color: accColor,   Icon: TargetIcon  },
                { label: 'Correct',        value: correct.length,       color: '#10b981',  Icon: CheckIcon   },
                { label: 'Current Streak', value: `${currentStreak}🔥`, color: '#f97316',  Icon: ZapIcon     },
                { label: 'Best Streak',    value: bestStreak,           color: '#a855f7',  Icon: TrophyIcon  },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.07] p-4 relative overflow-hidden"
                  style={{ background: `${s.color}08` }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: `linear-gradient(90deg,transparent,${s.color}60,transparent)` }}/>
                  <s.Icon className="w-4 h-4 mb-2" style={{ color: s.color }}/>
                  <p className="text-2xl font-black text-white" style={{ fontFamily: 'JetBrains Mono' }}>{s.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* League breakdown */}
              {leagueList.length > 0 && (
                <div className="rounded-2xl border border-white/[0.07] overflow-hidden"
                  style={{ background: 'rgba(10,14,26,0.85)' }}>
                  <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <GlobeIcon className="w-4 h-4 text-cyan-400"/>
                    <span className="text-white font-black text-sm">By League</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {leagueList.map((l, i) => {
                      const c = LEAGUE_COLOR[l.league] || '#22d3ee';
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-400 w-24 truncate flex-shrink-0">{l.league.replace(' League','').replace('Premier','EPL')}</span>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div className="h-full rounded-full" style={{ width: `${l.accuracy}%`, background: c }}/>
                          </div>
                          <span className="text-xs font-black w-10 text-right flex-shrink-0" style={{ color: c, fontFamily: 'JetBrains Mono' }}>{l.accuracy}%</span>
                          <span className="text-[10px] text-slate-600 w-12 text-right flex-shrink-0">{l.correct}/{l.total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="space-y-3">
                {[
                  { label: 'Make a Prediction', sub: 'Analysis & match predictions', page: 'analysis', color: '#22d3ee', Icon: TargetIcon },
                  { label: 'View Leaderboard',  sub: `You're ranked #${rank?.position || '—'}`,       page: 'leaderboard', color: '#f59e0b', Icon: TrophyIcon },
                  { label: 'My Favourites',     sub: `${favourites.length} players saved`,              page: 'favourites', color: '#ef4444', Icon: HeartIcon },
                  { label: 'Prediction History',sub: `${pending.length} pending results`,               page: 'history',    color: '#a855f7', Icon: ClockIcon },
                ].map((a, i) => (
                  <button key={i} onClick={() => onNavigate(a.page)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left hover:scale-[1.01]"
                    style={{ background: `${a.color}06`, borderColor: `${a.color}18` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${a.color}15`, border: `1px solid ${a.color}25` }}>
                      <a.Icon className="w-4 h-4" style={{ color: a.color }}/>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">{a.label}</p>
                      <p className="text-[11px] text-slate-500">{a.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent form dots */}
            {sortedResolved.length > 0 && (
              <div className="rounded-2xl border border-white/[0.07] p-5"
                style={{ background: 'rgba(10,14,26,0.85)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ZapIcon className="w-4 h-4 text-cyan-400"/>
                    <span className="text-white font-black text-sm">Recent Form</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Last {Math.min(sortedResolved.length, 20)} results
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {sortedResolved.slice(0, 20).map((p, i) => (
                    <div key={i} className="w-3 h-3 rounded-full flex-shrink-0"
                      title={`${p.homeTeam} vs ${p.awayTeam} — ${p.correct ? 'Correct' : 'Wrong'}`}
                      style={{
                        background: p.correct ? '#10b981' : '#ef4444',
                        boxShadow: p.correct ? '0 0 5px rgba(16,185,129,0.5)' : '0 0 5px rgba(239,68,68,0.35)',
                      }}/>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400"/><span className="text-[10px] text-slate-500">Correct</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400"/><span className="text-[10px] text-slate-500">Wrong</span></div>
                </div>
              </div>
            )}

            {predictions.length === 0 && (
              <div className="rounded-2xl border border-white/[0.07] p-12 text-center"
                style={{ background: 'rgba(10,14,26,0.8)' }}>
                <TargetIcon className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
                <p className="text-white font-black text-lg mb-1">No predictions yet</p>
                <p className="text-slate-500 text-sm mb-5">Start predicting matches to build your profile and rank.</p>
                <button onClick={() => onNavigate('analysis')}
                  className="px-6 py-3 rounded-xl font-bold text-sm border"
                  style={{ background: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.25)', color: '#22d3ee' }}>
                  Make Your First Prediction →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
