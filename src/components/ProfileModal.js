import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPredictions } from '../services/supabaseService';
import { supabase } from '../supabaseClient';

const I = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const XIcon      = p => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const TrophyIcon = p => <I {...p} d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></>}/>;
const TargetIcon = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const ZapIcon    = p => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const LogOutIcon = p => <I {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}/>;
const HeartIcon  = p => <I {...p} d={<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>}/>;
const ClockIcon  = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const UserIcon   = p => <I {...p} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>;

const LEAGUE_COLOR = {
  'Premier League':'#7c3aed','La Liga':'#dc2626','Bundesliga':'#d97706',
  'Serie A':'#059669','Ligue 1':'#2563eb','Primeira Liga':'#10b981','Champions League':'#f59e0b',
};

export default function ProfileModal({ onClose, onNavigate }) {
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
      const [preds, favs, rankData, allRanks] = await Promise.allSettled([
        getPredictions(user.id),
        supabase.from('player_favourites').select('id').eq('user_id', user.id),
        supabase.from('leaderboard').select('accuracy,total_resolved,total_correct').eq('user_id', user.id).single(),
        supabase.from('leaderboard').select('user_id').order('accuracy', { ascending: false }),
      ]);
      if (preds.status === 'fulfilled') setPredictions(preds.value || []);
      if (favs.status === 'fulfilled')  setFavourites(favs.value.data || []);
      if (rankData.status === 'fulfilled' && rankData.value.data) {
        const allRows = allRanks.status === 'fulfilled' ? (allRanks.value.data || []) : [];
        const idx = allRows.findIndex(r => r.user_id === user.id);
        setRank({ position: idx + 1, ...rankData.value.data });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Close on Escape key
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signOut(); onClose(); } catch { setSigningOut(false); }
  };

  const navigate = (page) => { onClose(); onNavigate(page); };

  if (!user) return null;

  // Stats
  const resolved   = predictions.filter(p => p.resolved);
  const correct    = predictions.filter(p => p.correct);
  const accuracy   = resolved.length > 0 ? Math.round((correct.length / resolved.length) * 100) : 0;
  const accColor   = accuracy >= 70 ? '#10b981' : accuracy >= 55 ? '#22d3ee' : accuracy >= 40 ? '#f59e0b' : '#ef4444';

  // Current streak
  const sorted = [...resolved].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  let streak = 0;
  for (const p of sorted) { if (p.correct) streak++; else break; }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const avatar      = user.user_metadata?.avatar_url;
  const initials    = displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}/>

      {/* Card */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col"
        style={{ background: 'rgba(6,9,18,0.99)', borderLeft: '1px solid rgba(255,255,255,0.08)', animation: 'slideIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-slate-500"/>
            <span className="text-white font-black text-sm">My Profile</span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
            style={{ color: '#64748b' }}>
            <XIcon className="w-4 h-4"/>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Avatar + name */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.07]"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="relative flex-shrink-0">
              {avatar ? (
                <img src={avatar} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10"/>
              ) : (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-2 border-white/10"
                  style={{ background: 'rgba(34,211,238,0.12)', color: '#22d3ee' }}>
                  {initials}
                </div>
              )}
              {rank && (
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] border-2 border-[#060912]"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000' }}>
                  #{rank.position}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-black text-base truncate">{displayName}</p>
              <p className="text-slate-500 text-xs truncate">{user.email}</p>
              {rank && (
                <p className="text-yellow-400 text-xs font-bold mt-1">
                  #{rank.position} on Leaderboard
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="rounded-xl h-16 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }}/>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Accuracy',  value: `${accuracy}%`, color: accColor },
                { label: 'Correct',   value: correct.length,  color: '#10b981' },
                { label: 'Streak 🔥', value: streak,          color: '#f97316' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-3 text-center border border-white/[0.06] relative overflow-hidden"
                  style={{ background: `${s.color}08` }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: `linear-gradient(90deg,transparent,${s.color}60,transparent)` }}/>
                  <p className="text-lg font-black" style={{ color: s.color, fontFamily: 'JetBrains Mono' }}>{s.value}</p>
                  <p className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recent form */}
          {sorted.length > 0 && (
            <div className="rounded-2xl border border-white/[0.07] p-4"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3">Recent Form</p>
              <div className="flex gap-1.5 flex-wrap">
                {sorted.slice(0, 15).map((p, i) => (
                  <div key={i} className="w-3 h-3 rounded-full"
                    title={`${p.homeTeam} vs ${p.awayTeam}`}
                    style={{
                      background: p.correct ? '#10b981' : '#ef4444',
                      boxShadow: p.correct ? '0 0 5px rgba(16,185,129,0.5)' : '0 0 4px rgba(239,68,68,0.35)',
                    }}/>
                ))}
              </div>
            </div>
          )}

          {/* Quick nav links */}
          <div className="space-y-2">
            {[
              { icon: TargetIcon, label: 'Make Picks',       sub: 'Weekly prediction challenge', page: 'pickem',      color: '#a855f7' },
              { icon: TrophyIcon, label: 'Leaderboard',      sub: rank ? `You're ranked #${rank.position}` : 'See top predictors', page: 'leaderboard', color: '#f59e0b' },
              { icon: HeartIcon,  label: 'Favourites',       sub: `${favourites.length} players saved`,  page: 'favourites',  color: '#ef4444' },
              { icon: ClockIcon,  label: 'Prediction History', sub: `${predictions.length} predictions`,  page: 'history',     color: '#c084fc' },
              { icon: ZapIcon,    label: 'AI Analysis',      sub: 'Match predictions & scout reports', page: 'analysis',  color: '#22d3ee' },
            ].map((a, i) => (
              <button key={i} onClick={() => navigate(a.page)}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left hover:scale-[1.01]"
                style={{ background: `${a.color}06`, borderColor: `${a.color}18` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${a.color}15`, border: `1px solid ${a.color}25` }}>
                  <a.icon className="w-4 h-4" style={{ color: a.color }}/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-white leading-tight">{a.label}</p>
                  <p className="text-[11px] text-slate-500 truncate">{a.sub}</p>
                </div>
                <svg className="w-4 h-4 text-slate-700 flex-shrink-0" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ))}
          </div>
        </div>

        {/* Sign out footer */}
        <div className="p-4 border-t border-white/[0.07]">
          <button onClick={handleSignOut} disabled={signingOut}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.18)', color: '#ef4444' }}>
            <LogOutIcon className="w-4 h-4"/>
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
      `}</style>
    </>
  );
}
