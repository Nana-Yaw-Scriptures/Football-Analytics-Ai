import React, { useState, useEffect, useCallback } from 'react';
import NavBar from '../components/NavBar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const I = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const TrophyIcon   = p => <I {...p} d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></>}/>;
const ZapIcon      = p => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const TargetIcon   = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const AwardIcon    = p => <I {...p} d={<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>}/>;
const RefreshIcon  = p => <I {...p} d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>}/>;
const UserIcon     = p => <I {...p} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>;

const MEDAL = [
  { grad: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.4)', label: '🥇' },
  { grad: 'linear-gradient(135deg,#94a3b8,#64748b)', glow: 'rgba(148,163,184,0.3)', label: '🥈' },
  { grad: 'linear-gradient(135deg,#cd7c3e,#a05c2a)', glow: 'rgba(205,124,62,0.3)', label: '🥉' },
];

export default function LeaderboardPage({ onNavigate }) {
  const { user }                    = useAuth();
  const [board,    setBoard]        = useState([]);
  const [myRank,   setMyRank]       = useState(null);
  const [loading,  setLoading]      = useState(true);
  const [period,   setPeriod]       = useState('all'); // all | month | week
  const [tab,      setTab]          = useState('accuracy'); // accuracy | predictions | streak

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order(tab === 'predictions' ? 'total_predictions' : 'accuracy', { ascending: false })
        .limit(50);

      if (error) throw error;
      const rows = data || [];
      setBoard(rows);

      // Find current user's rank
      if (user) {
        const idx = rows.findIndex(r => r.user_id === user.id);
        setMyRank(idx >= 0 ? { rank: idx + 1, ...rows[idx] } : null);
      }
    } catch (e) {
      console.error('[Leaderboard]', e);
    } finally {
      setLoading(false);
    }
  }, [tab, user]);

  useEffect(() => { load(); }, [load]);

  const getAccuracyColor = (acc) => {
    if (acc >= 70) return '#10b981';
    if (acc >= 55) return '#22d3ee';
    if (acc >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const formatName = (row) => {
    if (row.display_name) return row.display_name;
    if (row.email) return row.email.split('@')[0];
    return 'Anonymous';
  };

  return (
    <div className="min-h-screen bg-[#050810] text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-[700px] h-[700px] rounded-full blur-[160px]"
          style={{ background: 'radial-gradient(circle,rgba(245,158,11,0.07) 0%,transparent 65%)' }}/>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle,rgba(34,211,238,0.04) 0%,transparent 65%)' }}/>
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }}/>
      </div>

      <NavBar currentPage="leaderboard" onNavigate={onNavigate}/>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <TrophyIcon className="w-3.5 h-3.5 text-yellow-400"/>
            <span className="text-yellow-400 text-[11px] font-bold uppercase tracking-[0.2em]">Global Rankings</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-5xl font-black tracking-tight leading-none mb-2">
                Prediction<br/>
                <span style={{ background: 'linear-gradient(90deg,#f59e0b,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Leaderboard
                </span>
              </h1>
              <p className="text-slate-500 text-sm">Who's calling it right? Ranked by accuracy across all leagues.</p>
            </div>
            <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border transition-all flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#64748b' }}>
              <RefreshIcon className="w-3.5 h-3.5"/>Refresh
            </button>
          </div>
        </div>

        {/* My rank banner */}
        {user && myRank && (
          <div className="rounded-2xl border p-4 mb-6 flex items-center gap-4"
            style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)', animation: 'lbFadeIn 0.3s ease-out' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontFamily: 'JetBrains Mono' }}>
              #{myRank.rank}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm">Your ranking</p>
              <p className="text-slate-500 text-xs">{myRank.total_resolved} predictions resolved · {myRank.accuracy}% accuracy</p>
            </div>
            <button onClick={() => onNavigate('profile')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)', color: '#f59e0b' }}>
              View Profile
            </button>
          </div>
        )}

        {user && !myRank && !loading && (
          <div className="rounded-2xl border p-4 mb-6 flex items-center gap-4"
            style={{ background: 'rgba(34,211,238,0.04)', borderColor: 'rgba(34,211,238,0.15)' }}>
            <TargetIcon className="w-5 h-5 text-cyan-400 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">You're not ranked yet</p>
              <p className="text-slate-500 text-xs">Make at least 3 resolved predictions to appear on the leaderboard.</p>
            </div>
            <button onClick={() => onNavigate('analysis')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border flex-shrink-0"
              style={{ background: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.25)', color: '#22d3ee' }}>
              Start Predicting
            </button>
          </div>
        )}

        {/* Sort tabs */}
        <div className="flex gap-1 mb-6 rounded-2xl p-1.5 border border-white/[0.06]"
          style={{ background: 'rgba(10,14,26,0.7)' }}>
          {[
            { id: 'accuracy',    label: '🎯 Accuracy',    },
            { id: 'predictions', label: '📊 Most Active', },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: tab === t.id ? 'rgba(245,158,11,0.12)' : 'transparent',
                border: tab === t.id ? '1px solid rgba(245,158,11,0.25)' : '1px solid transparent',
                color: tab === t.id ? '#f59e0b' : '#475569',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 relative">
              <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'rgba(245,158,11,0.2)' }}/>
              <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#f59e0b', borderTopColor: 'transparent' }}/>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && board.length === 0 && (
          <div className="rounded-2xl border border-white/[0.07] p-16 text-center"
            style={{ background: 'rgba(10,14,26,0.8)' }}>
            <TrophyIcon className="w-12 h-12 text-slate-700 mx-auto mb-4"/>
            <p className="text-white font-black text-xl mb-2">No rankings yet</p>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              Be the first on the board. Make predictions and check results to earn your rank.
            </p>
            <button onClick={() => onNavigate('analysis')}
              className="px-6 py-3 rounded-xl font-bold text-sm border transition-all"
              style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)', color: '#f59e0b' }}>
              Make a Prediction →
            </button>
          </div>
        )}

        {/* Top 3 podium */}
        {!loading && board.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[board[1], board[0], board[2]].map((row, podiumIdx) => {
              const actualRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
              const medal = MEDAL[actualRank - 1];
              const acc = parseFloat(row.accuracy || 0);
              const accColor = getAccuracyColor(acc);
              const isMe = user && row.user_id === user.id;

              return (
                <div key={row.user_id}
                  className="relative rounded-2xl border overflow-hidden text-center"
                  style={{
                    background: `linear-gradient(135deg,rgba(10,14,26,0.95),rgba(5,8,16,0.98))`,
                    borderColor: isMe ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.07)',
                    boxShadow: actualRank === 1 ? `0 0 40px ${medal.glow}` : 'none',
                    transform: actualRank === 1 ? 'scale(1.04)' : 'scale(1)',
                    zIndex: actualRank === 1 ? 1 : 0,
                  }}>
                  <div className="h-1" style={{ background: medal.grad }}/>
                  <div className="p-4">
                    <div className="text-2xl mb-2">{medal.label}</div>
                    {row.avatar_url ? (
                      <img src={row.avatar_url} alt="" className="w-12 h-12 rounded-full mx-auto mb-2 border-2"
                        style={{ borderColor: actualRank === 1 ? '#f59e0b' : 'rgba(255,255,255,0.1)' }}/>
                    ) : (
                      <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center font-black text-lg border-2"
                        style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                        {formatName(row)[0]?.toUpperCase()}
                      </div>
                    )}
                    <p className="text-white font-black text-sm truncate">{formatName(row)}</p>
                    {isMe && <p className="text-yellow-400 text-[10px] font-bold">You</p>}
                    <p className="text-2xl font-black mt-2" style={{ color: accColor, fontFamily: 'JetBrains Mono' }}>
                      {acc}%
                    </p>
                    <p className="text-[10px] text-slate-600">{row.total_resolved} resolved</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full table */}
        {!loading && board.length > 0 && (
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden"
            style={{ background: 'rgba(8,12,22,0.9)' }}>
            {/* Header */}
            <div className="grid items-center px-5 py-3 border-b border-white/[0.06] text-[10px] text-slate-600 uppercase tracking-widest font-bold"
              style={{ gridTemplateColumns: '48px 1fr 90px 90px 80px', background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-center">#</div>
              <div>Predictor</div>
              <div className="text-center">Accuracy</div>
              <div className="text-center">Correct</div>
              <div className="text-center">Resolved</div>
            </div>

            {board.map((row, idx) => {
              const rank = idx + 1;
              const acc = parseFloat(row.accuracy || 0);
              const accColor = getAccuracyColor(acc);
              const isMe = user && row.user_id === user.id;
              const medal = rank <= 3 ? MEDAL[rank - 1] : null;

              return (
                <div key={row.user_id}
                  className="grid items-center px-5 py-3 border-b border-white/[0.04] last:border-0 transition-all hover:bg-white/[0.02]"
                  style={{
                    gridTemplateColumns: '48px 1fr 90px 90px 80px',
                    background: isMe ? 'rgba(245,158,11,0.05)' : 'transparent',
                    animation: `lbFadeIn 0.3s ease-out ${idx * 0.03}s both`,
                  }}>

                  {/* Rank */}
                  <div className="flex justify-center">
                    {medal ? (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white"
                        style={{ background: medal.grad }}>
                        {rank}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-600 font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{rank}</span>
                    )}
                  </div>

                  {/* User */}
                  <div className="flex items-center gap-3 min-w-0">
                    {row.avatar_url ? (
                      <img src={row.avatar_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0 border border-white/10"/>
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-white/10 font-bold text-xs"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                        {formatName(row)[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {formatName(row)}
                        {isMe && <span className="ml-2 text-[10px] text-yellow-400 font-black">YOU</span>}
                      </p>
                    </div>
                  </div>

                  {/* Accuracy */}
                  <div className="text-center">
                    <span className="text-sm font-black" style={{ color: accColor, fontFamily: 'JetBrains Mono' }}>
                      {acc}%
                    </span>
                    <div className="h-1 rounded-full overflow-hidden mt-1 mx-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: `${acc}%`, background: accColor }}/>
                    </div>
                  </div>

                  {/* Correct */}
                  <div className="text-center">
                    <span className="text-sm font-black text-emerald-400" style={{ fontFamily: 'JetBrains Mono' }}>
                      {row.total_correct}
                    </span>
                  </div>

                  {/* Resolved */}
                  <div className="text-center">
                    <span className="text-sm text-slate-400" style={{ fontFamily: 'JetBrains Mono' }}>
                      {row.total_resolved}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes lbFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
