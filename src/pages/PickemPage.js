import React, { useState, useEffect, useCallback } from 'react';
import NavBar from '../components/NavBar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const I = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const CheckIcon   = p => <I {...p} d={<polyline points="20 6 9 17 4 12"/>}/>;
const ZapIcon     = p => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const TrophyIcon  = p => <I {...p} d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></>}/>;
const ClockIcon   = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const LockIcon    = p => <I {...p} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}/>;

const LEAGUE_COLOR = {
  'Premier League': '#7c3aed', 'La Liga': '#dc2626', 'Bundesliga': '#d97706',
  'Serie A': '#059669', 'Ligue 1': '#2563eb', 'Primeira Liga': '#10b981', 'Champions League': '#f59e0b',
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

function formatMatchDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return `Today ${d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`;
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow ${d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`;
  return d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}) + ' ' + d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
}

function ScoreInput({ value, onChange, color }) {
  const [h, a] = (value || '').split('-').map(v => v ?? '');
  const update = (side, val) => {
    const num = val.replace(/\D/g,'').slice(0,1);
    if (side === 'h') onChange(`${num}-${a||'0'}`);
    else onChange(`${h||'0'}-${num}`);
  };
  return (
    <div className="flex items-center gap-1">
      <input type="text" inputMode="numeric" value={h||''} onChange={e=>update('h',e.target.value)}
        className="w-8 h-8 rounded-lg text-center text-sm font-black outline-none border"
        style={{ background:'rgba(255,255,255,0.05)', borderColor:`${color}40`, color:'white' }}
        placeholder="0"/>
      <span className="text-slate-500 font-black text-sm">-</span>
      <input type="text" inputMode="numeric" value={a||''} onChange={e=>update('a',e.target.value)}
        className="w-8 h-8 rounded-lg text-center text-sm font-black outline-none border"
        style={{ background:'rgba(255,255,255,0.05)', borderColor:`${color}40`, color:'white' }}
        placeholder="0"/>
    </div>
  );
}

export default function PickemPage({ onNavigate }) {
  const { user }                      = useAuth();
  const [fixtures,   setFixtures]     = useState([]);
  const [grouped,    setGrouped]      = useState({});
  const [picks,      setPicks]        = useState({});  // { fixtureId: { result:'H'|'D'|'A', score:'2-1' } }
  const [submitted,  setSubmitted]    = useState({});  // already submitted fixture ids
  const [loading,    setLoading]      = useState(true);
  const [saving,     setSaving]       = useState(false);
  const [toast,      setToast]        = useState(null);
  const [filterLeague, setFilterLeague] = useState('All');

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load fixtures
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API_BASE}/live/upcoming?days=14`);
        const data = await r.json();
        const arr = Array.isArray(data) ? data : [];
        setFixtures(arr);

        // Group by league
        const g = {};
        arr.forEach(f => {
          if (!g[f.league]) g[f.league] = [];
          g[f.league].push(f);
        });
        setGrouped(g);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Load existing picks from Supabase
  useEffect(() => {
    if (!user) return;
    const loadPicks = async () => {
      const { data } = await supabase
        .from('predictions')
        .select('fixture_id, predicted_result, predicted_score')
        .eq('user_id', user.id)
        .eq('resolved', false);

      if (data) {
        const existing = {};
        const subbed = {};
        data.forEach(p => {
          if (p.fixture_id) {
            existing[p.fixture_id] = { result: p.predicted_result, score: p.predicted_score };
            subbed[p.fixture_id] = true;
          }
        });
        setPicks(existing);
        setSubmitted(subbed);
      }
    };
    loadPicks();
  }, [user]);

  const setPick = (fixtureId, field, value) => {
    if (submitted[fixtureId]) return; // can't change after submit
    setPicks(prev => ({
      ...prev,
      [fixtureId]: { ...(prev[fixtureId] || {}), [field]: value }
    }));
  };

  const submitAll = async () => {
    if (!user) { onNavigate('login'); return; }
    const toSubmit = fixtures.filter(f => picks[f.id]?.result && !submitted[f.id]);
    if (toSubmit.length === 0) { showToast('No new picks to submit', 'error'); return; }

    setSaving(true);
    try {
      const rows = toSubmit.map(f => ({
        user_id:          user.id,
        home_team:        f.homeTeam,
        away_team:        f.awayTeam,
        league:           f.league,
        fixture_id:       f.id,
        match_date:       f.date,
        predicted_result: picks[f.id].result,
        predicted_score:  picks[f.id].score || null,
        resolved:         false,
        correct:          null,
        timestamp:        new Date().toISOString(),
      }));

      const { error } = await supabase.from('predictions').upsert(rows, { onConflict: 'user_id,fixture_id' });
      if (error) throw error;

      // Mark as submitted
      const newSubbed = { ...submitted };
      toSubmit.forEach(f => { newSubbed[f.id] = true; });
      setSubmitted(newSubbed);
      showToast(`${toSubmit.length} pick${toSubmit.length !== 1 ? 's' : ''} submitted! ✅`);
    } catch(e) {
      console.error(e);
      showToast('Failed to submit picks', 'error');
    } finally { setSaving(false); }
  };

  const leagues = ['All', ...Object.keys(grouped)];
  const totalPicks = Object.values(picks).filter(p => p?.result).length;
  const newPicks = fixtures.filter(f => picks[f.id]?.result && !submitted[f.id]).length;

  const displayFixtures = filterLeague === 'All'
    ? fixtures
    : (grouped[filterLeague] || []);

  // Group displayed fixtures by date
  const byDate = {};
  displayFixtures.forEach(f => {
    const d = f.date ? new Date(f.date).toDateString() : 'Unknown';
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(f);
  });

  return (
    <div className="min-h-screen bg-[#050810] text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-[700px] h-[700px] rounded-full blur-[160px]"
          style={{ background: 'radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 65%)' }}/>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle,rgba(34,211,238,0.04) 0%,transparent 65%)' }}/>
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize:'60px 60px' }}/>
      </div>

      <NavBar currentPage="pickem" onNavigate={onNavigate}/>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ZapIcon className="w-3.5 h-3.5 text-purple-400"/>
            <span className="text-purple-400 text-[11px] font-bold uppercase tracking-[0.2em]">Weekly Picks</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-5xl font-black tracking-tight leading-none mb-2">
                Make Your<br/>
                <span style={{ background:'linear-gradient(90deg,#a855f7,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  Picks
                </span>
              </h1>
              <p className="text-slate-500 text-sm">Predict upcoming matches. Compete on the leaderboard. Prove you know football.</p>
            </div>
            {/* Submit button */}
            <button onClick={submitAll} disabled={saving || newPicks === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all flex-shrink-0 disabled:opacity-40"
              style={{
                background: newPicks > 0 ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : 'rgba(255,255,255,0.05)',
                border: newPicks > 0 ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: newPicks > 0 ? 'white' : '#475569',
                boxShadow: newPicks > 0 ? '0 8px 30px rgba(168,85,247,0.3)' : 'none',
              }}>
              <ZapIcon className="w-4 h-4"/>
              {saving ? 'Submitting…' : `Submit ${newPicks > 0 ? newPicks : ''} Pick${newPicks !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label:'Picks Made', value: totalPicks, color:'#a855f7' },
            { label:'Submitted', value: Object.keys(submitted).length, color:'#10b981' },
            { label:'Pending', value: newPicks, color:'#f59e0b' },
          ].map((s,i) => (
            <div key={i} className="rounded-2xl border border-white/[0.07] p-3 text-center"
              style={{ background:`${s.color}08` }}>
              <p className="text-2xl font-black" style={{ color:s.color, fontFamily:'JetBrains Mono' }}>{s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Not logged in banner */}
        {!user && (
          <div className="rounded-2xl border p-4 mb-6 flex items-center gap-4"
            style={{ background:'rgba(168,85,247,0.06)', borderColor:'rgba(168,85,247,0.2)' }}>
            <LockIcon className="w-5 h-5 text-purple-400 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-white font-black text-sm">Sign in to submit picks</p>
              <p className="text-slate-500 text-xs">You can browse fixtures but need an account to compete.</p>
            </div>
            <button onClick={() => onNavigate('login')}
              className="px-4 py-2 rounded-xl font-bold text-sm border flex-shrink-0"
              style={{ background:'rgba(168,85,247,0.1)', borderColor:'rgba(168,85,247,0.3)', color:'#a855f7' }}>
              Sign In
            </button>
          </div>
        )}

        {/* League filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {leagues.map(lg => {
            const color = lg === 'All' ? '#22d3ee' : (LEAGUE_COLOR[lg] || '#22d3ee');
            const active = filterLeague === lg;
            return (
              <button key={lg} onClick={() => setFilterLeague(lg)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 border"
                style={{
                  background: active ? `${color}15` : 'rgba(255,255,255,0.03)',
                  borderColor: active ? `${color}35` : 'rgba(255,255,255,0.07)',
                  color: active ? color : '#475569',
                }}>
                {LEAGUE_IMG[lg] && <img src={LEAGUE_IMG[lg]} alt="" className="w-4 h-4 object-contain"/>}
                {lg === 'All' ? 'All Leagues' : lg.replace(' League','').replace('Premier','PL')}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 relative">
              <div className="absolute inset-0 rounded-full border-2" style={{ borderColor:'rgba(168,85,247,0.2)' }}/>
              <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor:'#a855f7', borderTopColor:'transparent' }}/>
            </div>
          </div>
        )}

        {/* Fixtures grouped by date */}
        {!loading && Object.entries(byDate).map(([dateStr, dayFixtures]) => {
          const d = new Date(dateStr);
          const today = new Date();
          const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
          const dayLabel = d.toDateString() === today.toDateString() ? 'Today'
            : d.toDateString() === tomorrow.toDateString() ? 'Tomorrow'
            : d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'});

          return (
            <div key={dateStr} className="mb-8">
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-white font-black text-sm">{dayLabel}</span>
                <div className="flex-1 h-px bg-white/[0.06]"/>
                <span className="text-[10px] text-slate-600">{dayFixtures.length} matches</span>
              </div>

              <div className="space-y-2">
                {dayFixtures.map(fix => {
                  const pick = picks[fix.id] || {};
                  const isSubmitted = submitted[fix.id];
                  const leagueColor = LEAGUE_COLOR[fix.league] || '#22d3ee';
                  const isPicked = !!pick.result;

                  return (
                    <div key={fix.id}
                      className="rounded-2xl border transition-all overflow-hidden"
                      style={{
                        background: isPicked ? `${leagueColor}06` : 'rgba(10,14,26,0.85)',
                        borderColor: isPicked ? `${leagueColor}25` : 'rgba(255,255,255,0.07)',
                      }}>

                      {/* League + time bar */}
                      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05]">
                        <div className="flex items-center gap-2">
                          {LEAGUE_IMG[fix.league] && (
                            <img src={LEAGUE_IMG[fix.league]} alt="" className="w-3.5 h-3.5 object-contain"/>
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:leagueColor }}>
                            {fix.league?.replace(' League','').replace('Premier','EPL')}
                          </span>
                          {fix.round && <span className="text-[10px] text-slate-700">· {fix.round.replace('Regular Season - ','GW')}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                          <ClockIcon className="w-3 h-3"/>
                          {formatMatchDate(fix.date)}
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        {/* Teams */}
                        <div className="grid items-center gap-2 mb-3" style={{ gridTemplateColumns:'1fr auto 1fr' }}>
                          {/* Home */}
                          <div className="flex items-center gap-2 min-w-0">
                            {fix.homeLogo
                              ? <img src={fix.homeLogo} alt="" className="w-7 h-7 object-contain flex-shrink-0"/>
                              : <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background:`${leagueColor}20` }}/>}
                            <span className="text-sm font-black text-white truncate">{fix.homeTeam?.replace(' FC','')}</span>
                          </div>
                          {/* VS */}
                          <div className="text-[11px] text-slate-600 font-bold text-center px-2">vs</div>
                          {/* Away */}
                          <div className="flex items-center gap-2 min-w-0 justify-end">
                            <span className="text-sm font-black text-white truncate text-right">{fix.awayTeam?.replace(' FC','')}</span>
                            {fix.awayLogo
                              ? <img src={fix.awayLogo} alt="" className="w-7 h-7 object-contain flex-shrink-0"/>
                              : <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background:`${leagueColor}20` }}/>}
                          </div>
                        </div>

                        {/* Pick buttons */}
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {[
                            { key:'H', label: fix.homeTeam?.split(' ')[0] || 'Home', color:'#22d3ee' },
                            { key:'D', label:'Draw', color:'#f59e0b' },
                            { key:'A', label: fix.awayTeam?.split(' ')[0] || 'Away', color:'#a855f7' },
                          ].map(opt => {
                            const isSelected = pick.result === opt.key;
                            return (
                              <button key={opt.key}
                                onClick={() => setPick(fix.id, 'result', opt.key)}
                                disabled={isSubmitted}
                                className="py-2 rounded-xl text-xs font-black transition-all border relative overflow-hidden disabled:cursor-not-allowed"
                                style={{
                                  background: isSelected ? `${opt.color}20` : 'rgba(255,255,255,0.03)',
                                  borderColor: isSelected ? `${opt.color}50` : 'rgba(255,255,255,0.07)',
                                  color: isSelected ? opt.color : '#475569',
                                  transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                                }}>
                                {isSelected && (
                                  <div className="absolute top-0 left-0 right-0 h-0.5"
                                    style={{ background:`linear-gradient(90deg,transparent,${opt.color},transparent)` }}/>
                                )}
                                {opt.label}
                                {isSelected && <CheckIcon className="w-3 h-3 inline ml-1"/>}
                              </button>
                            );
                          })}
                        </div>

                        {/* Score prediction + status */}
                        {isPicked && (
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-600">Score (optional):</span>
                              {!isSubmitted ? (
                                <ScoreInput
                                  value={pick.score || ''}
                                  onChange={val => setPick(fix.id, 'score', val)}
                                  color={leagueColor}
                                />
                              ) : (
                                <span className="text-xs font-black text-slate-400" style={{ fontFamily:'JetBrains Mono' }}>
                                  {pick.score || '—'}
                                </span>
                              )}
                            </div>
                            {isSubmitted && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black"
                                style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.25)', color:'#10b981' }}>
                                <CheckIcon className="w-3 h-3"/> Submitted
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {!loading && fixtures.length === 0 && (
          <div className="rounded-2xl border border-white/[0.07] p-16 text-center"
            style={{ background:'rgba(10,14,26,0.8)' }}>
            <ClockIcon className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
            <p className="text-white font-black text-lg mb-1">No upcoming fixtures</p>
            <p className="text-slate-500 text-sm">Check back soon — fixtures update daily.</p>
          </div>
        )}

        {/* Bottom submit */}
        {newPicks > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <button onClick={submitAll} disabled={saving}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base shadow-2xl transition-all"
              style={{
                background:'linear-gradient(135deg,#a855f7,#7c3aed)',
                boxShadow:'0 8px 40px rgba(168,85,247,0.5)',
                color:'white',
                border:'1px solid rgba(168,85,247,0.5)',
              }}>
              <ZapIcon className="w-5 h-5"/>
              {saving ? 'Submitting…' : `Lock in ${newPicks} Pick${newPicks !== 1 ? 's' : ''}`}
              <TrophyIcon className="w-5 h-5"/>
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl font-bold text-sm border"
          style={{
            background: toast.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)',
            borderColor: toast.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)',
            backdropFilter:'blur(16px)',
            animation:'toastIn 0.3s ease-out',
            color:'white',
          }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>
    </div>
  );
}
