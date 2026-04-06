import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const I = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const XIcon      = p => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const ZapIcon    = p => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const TrophyIcon = p => <I {...p} d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></>}/>;
const ClockIcon  = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const LockIcon   = p => <I {...p} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}/>;
const CheckIcon  = p => <I {...p} d={<polyline points="20 6 9 17 4 12"/>}/>;
const InfoIcon   = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>}/>;

const LEAGUE_COLOR = {
  'Premier League':'#7c3aed','La Liga':'#dc2626','Bundesliga':'#d97706',
  'Serie A':'#059669','Ligue 1':'#2563eb','Primeira Liga':'#10b981','Champions League':'#f59e0b',
};
const LEAGUE_IMG = {
  'Premier League':'https://media.api-sports.io/football/leagues/39.png',
  'La Liga':'https://media.api-sports.io/football/leagues/140.png',
  'Bundesliga':'https://media.api-sports.io/football/leagues/78.png',
  'Serie A':'https://media.api-sports.io/football/leagues/135.png',
  'Ligue 1':'https://media.api-sports.io/football/leagues/61.png',
  'Primeira Liga':'https://media.api-sports.io/football/leagues/94.png',
  'Champions League':'https://media.api-sports.io/football/leagues/2.png',
};

function formatMatchDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString())
    return `Today · ${d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`;
  if (d.toDateString() === tomorrow.toDateString())
    return `Tomorrow · ${d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`;
  return d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})
    + ' · ' + d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
}

function ScoreInput({ value, onChange, color, disabled }) {
  const parts = (value || '').split('-');
  const h = parts[0] ?? '';
  const a = parts[1] ?? '';
  const update = (side, val) => {
    const num = val.replace(/\D/g,'').slice(0,1);
    onChange(side === 'h' ? `${num}-${a||'0'}` : `${h||'0'}-${num}`);
  };
  return (
    <div className="flex items-center gap-1.5">
      <input type="text" inputMode="numeric" value={h} onChange={e=>update('h',e.target.value)}
        disabled={disabled}
        className="w-9 h-9 rounded-xl text-center text-sm font-black outline-none border transition-all disabled:opacity-40"
        style={{background:'rgba(255,255,255,0.06)',borderColor:`${color}40`,color:'white',fontFamily:'JetBrains Mono'}}
        placeholder="0"/>
      <span className="text-slate-400 font-black text-base">—</span>
      <input type="text" inputMode="numeric" value={a} onChange={e=>update('a',e.target.value)}
        disabled={disabled}
        className="w-9 h-9 rounded-xl text-center text-sm font-black outline-none border transition-all disabled:opacity-40"
        style={{background:'rgba(255,255,255,0.06)',borderColor:`${color}40`,color:'white',fontFamily:'JetBrains Mono'}}
        placeholder="0"/>
    </div>
  );
}

export default function PickemPage({ onNavigate }) {
  const { user } = useAuth();
  const [fixtures,     setFixtures]     = useState([]);
  const [grouped,      setGrouped]      = useState({});
  const [picks,        setPicks]        = useState({});
  const [submitted,    setSubmitted]    = useState({});
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);
  const [filterLeague, setFilterLeague] = useState('All');

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetchWithTimeout(`${API_BASE}/live/upcoming?days=14`);
        const data = await r.json();
        const arr = Array.isArray(data) ? data : [];
        setFixtures(arr);
        const g = {};
        arr.forEach(f => { if (!g[f.league]) g[f.league]=[]; g[f.league].push(f); });
        setGrouped(g);
      } catch(e){console.error(e);}
      finally{setLoading(false);}
    };
    load();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadPicks = async () => {
      const { data } = await supabase
        .from('predictions')
        .select('fixture_id,predicted_result,predicted_score')
        .eq('user_id', user.id)
        .eq('source','pickem')
        .eq('resolved',false);
      if (data) {
        const existing={}, subbed={};
        data.forEach(p => {
          if (p.fixture_id) {
            existing[String(p.fixture_id)] = {result:p.predicted_result, score:p.predicted_score};
            subbed[String(p.fixture_id)] = true;
          }
        });
        setPicks(existing);
        setSubmitted(subbed);
      }
    };
    loadPicks();
  }, [user]);

  const setPick = (id, field, value) => {
    if (submitted[id]) return;
    setPicks(prev => ({...prev, [id]:{...(prev[id]||{}),[field]:value}}));
  };

  const cancelPick = (id) => {
    if (submitted[id]) return;
    setPicks(prev => { const n={...prev}; delete n[id]; return n; });
  };

  const submitAll = async () => {
    if (!user) { onNavigate('login'); return; }
    const toSubmit = fixtures.filter(f => picks[String(f.id)]?.result && !submitted[String(f.id)]);
    if (toSubmit.length===0) { showToast('No new picks to submit','error'); return; }
    setSaving(true);
    try {
      const rows = toSubmit.map(f => ({
        user_id:          user.id,
        home_team:        f.homeTeam,
        away_team:        f.awayTeam,
        league:           f.league,
        fixture_id:       String(f.id),
        match_date:       f.date,
        predicted_result: picks[String(f.id)].result,
        predicted_score:  picks[String(f.id)].score || null,
        source:           'pickem',
        resolved:         false,
      }));
      const { error } = await supabase.from('predictions').upsert(rows, {onConflict:'user_id,fixture_id'});
      if (error) throw error;
      const newSubbed = {...submitted};
      toSubmit.forEach(f => { newSubbed[String(f.id)]=true; });
      setSubmitted(newSubbed);
      showToast(`${toSubmit.length} pick${toSubmit.length!==1?'s':''} locked in! 🔒`);
    } catch(e) {
      console.error(e);
      showToast('Failed to submit picks','error');
    } finally { setSaving(false); }
  };

  const leagues = ['All',...Object.keys(grouped)];
  const newPicks = fixtures.filter(f=>picks[String(f.id)]?.result&&!submitted[String(f.id)]).length;
  const totalSubmitted = Object.keys(submitted).length;
  const totalSelected = Object.keys(picks).length;

  const displayFixtures = filterLeague==='All' ? fixtures : (grouped[filterLeague]||[]);
  const byDate = {};
  displayFixtures.forEach(f => {
    const d = f.date ? new Date(f.date).toDateString() : 'Unknown';
    if (!byDate[d]) byDate[d]=[];
    byDate[d].push(f);
  });

  return (
    <div className="min-h-screen bg-[#050810] text-white" style={{fontFamily:"'Outfit',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-[700px] h-[700px] rounded-full blur-[160px]"
          style={{background:'radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 65%)'}}/>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{background:'radial-gradient(circle,rgba(34,211,238,0.04) 0%,transparent 65%)'}}/>
        <div className="absolute inset-0 opacity-[0.018]"
          style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
      </div>

      <NavBar currentPage="pickem" onNavigate={onNavigate}/>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-32">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <TrophyIcon className="w-3.5 h-3.5 text-purple-400"/>
            <span className="text-purple-400 text-[11px] font-bold uppercase tracking-[0.2em]">Fantasy Picks · Weekly Challenge</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight leading-none mb-2">
            Make Your<br/>
            <span style={{background:'linear-gradient(90deg,#a855f7,#22d3ee)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              Picks
            </span>
          </h1>
          <p className="text-slate-500 text-sm max-w-md">
            Predict match results. Add a score for bonus points. Lock in before kick-off — no changes after.
          </p>
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-white/[0.07] p-4 mb-6 flex items-start gap-3"
          style={{background:'rgba(168,85,247,0.04)'}}>
          <InfoIcon className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5"/>
          <p className="text-slate-400 text-xs leading-relaxed">
            Pick <span className="text-white font-bold">Home / Draw / Away</span> for any match. Optionally predict the exact score.
            Hit <span className="text-purple-400 font-bold">Lock In</span> to submit. Results resolved automatically — top predictors rank on the{' '}
            <button onClick={()=>onNavigate('leaderboard')} className="text-purple-400 underline font-bold">Leaderboard</button>.
            Only your own picks (not AI) count toward rankings.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {label:'Selected', value:totalSelected, color:'#a855f7'},
            {label:'Locked In', value:totalSubmitted, color:'#10b981'},
            {label:'Unsaved', value:newPicks, color:'#f59e0b'},
          ].map((s,i) => (
            <div key={i} className="rounded-2xl border border-white/[0.07] p-4 text-center relative overflow-hidden"
              style={{background:`${s.color}06`}}>
              <div className="absolute top-0 left-0 right-0 h-0.5"
                style={{background:`linear-gradient(90deg,transparent,${s.color}50,transparent)`}}/>
              <p className="text-2xl font-black" style={{color:s.color,fontFamily:'JetBrains Mono'}}>{s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Not logged in */}
        {!user && (
          <div className="rounded-2xl border p-5 mb-6 flex items-center gap-4"
            style={{background:'rgba(168,85,247,0.06)',borderColor:'rgba(168,85,247,0.2)'}}>
            <LockIcon className="w-5 h-5 text-purple-400 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-white font-black text-sm">Sign in to submit picks</p>
              <p className="text-slate-500 text-xs mt-0.5">Browse fixtures freely — sign in to compete.</p>
            </div>
            <button onClick={()=>onNavigate('login')}
              className="px-4 py-2 rounded-xl font-bold text-sm border flex-shrink-0"
              style={{background:'rgba(168,85,247,0.1)',borderColor:'rgba(168,85,247,0.3)',color:'#a855f7'}}>
              Sign In
            </button>
          </div>
        )}

        {/* League filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {leagues.map(lg => {
            const color = lg==='All' ? '#22d3ee' : (LEAGUE_COLOR[lg]||'#22d3ee');
            const active = filterLeague===lg;
            return (
              <button key={lg} onClick={()=>setFilterLeague(lg)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 border"
                style={{
                  background:active?`${color}15`:'rgba(255,255,255,0.03)',
                  borderColor:active?`${color}35`:'rgba(255,255,255,0.07)',
                  color:active?color:'#475569',
                }}>
                {LEAGUE_IMG[lg] && <img src={LEAGUE_IMG[lg]} alt="" className="w-4 h-4 object-contain"/>}
                {lg==='All'?'All Leagues':lg.replace(' League','').replace('Premier','PL')}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 relative">
              <div className="absolute inset-0 rounded-full border-2" style={{borderColor:'rgba(168,85,247,0.2)'}}/>
              <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                style={{borderColor:'#a855f7',borderTopColor:'transparent'}}/>
            </div>
          </div>
        )}

        {/* Fixtures by date */}
        {!loading && Object.entries(byDate).map(([dateStr, dayFixtures]) => {
          const d = new Date(dateStr);
          const today = new Date();
          const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
          const dayLabel = d.toDateString()===today.toDateString() ? 'Today'
            : d.toDateString()===tomorrow.toDateString() ? 'Tomorrow'
            : d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});

          return (
            <div key={dateStr} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-white font-black text-sm">{dayLabel}</span>
                <div className="flex-1 h-px" style={{background:'rgba(255,255,255,0.06)'}}/>
                <span className="text-[10px] text-slate-600 font-semibold">{dayFixtures.length} matches</span>
              </div>

              <div className="space-y-3">
                {dayFixtures.map(fix => {
                  const id = String(fix.id);
                  const pick = picks[id]||{};
                  const isSubmitted = submitted[id];
                  const isPicked = !!pick.result;
                  const leagueColor = LEAGUE_COLOR[fix.league]||'#22d3ee';

                  return (
                    <div key={id}
                      className="rounded-2xl border overflow-hidden transition-all"
                      style={{
                        background:'rgba(8,12,22,0.9)',
                        borderColor:isPicked?`${leagueColor}30`:'rgba(255,255,255,0.07)',
                        boxShadow:isPicked?`0 4px 24px ${leagueColor}12`:'none',
                      }}>

                      {isPicked && (
                        <div className="h-0.5" style={{background:`linear-gradient(90deg,transparent,${leagueColor},transparent)`}}/>
                      )}

                      <div className="p-4 sm:p-5">
                        {/* League row */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {LEAGUE_IMG[fix.league] && (
                              <img src={LEAGUE_IMG[fix.league]} alt="" className="w-4 h-4 object-contain opacity-80"/>
                            )}
                            <span className="text-[11px] font-bold" style={{color:leagueColor}}>
                              {fix.league}
                            </span>
                            {fix.round && (
                              <span className="text-[10px] text-slate-700">
                                · {fix.round.replace('Regular Season - ','GW ')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600 flex items-center gap-1">
                              <ClockIcon className="w-3 h-3"/>{formatMatchDate(fix.date)}
                            </span>
                            {isPicked && !isSubmitted && (
                              <button onClick={()=>cancelPick(id)}
                                title="Cancel pick"
                                className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                                style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#ef4444'}}>
                                <XIcon className="w-3 h-3"/>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Teams */}
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {fix.homeLogo
                              ? <img src={fix.homeLogo} alt="" className="w-10 h-10 object-contain flex-shrink-0"/>
                              : <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{background:`${leagueColor}15`}}/>
                            }
                            <div className="min-w-0">
                              <p className="font-black text-white text-sm truncate">{fix.homeTeam?.replace(' FC','')}</p>
                              <p className="text-[10px] text-slate-600">Home</p>
                            </div>
                          </div>

                          {/* Center — VS or score input */}
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            {isPicked ? (
                              <>
                                <ScoreInput
                                  value={pick.score||''}
                                  onChange={val=>setPick(id,'score',val)}
                                  color={leagueColor}
                                  disabled={isSubmitted}
                                />
                                <span className="text-[9px] text-slate-600">Score (optional)</span>
                              </>
                            ) : (
                              <span className="text-slate-700 font-black text-sm px-4">vs</span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                            <div className="min-w-0 text-right">
                              <p className="font-black text-white text-sm truncate">{fix.awayTeam?.replace(' FC','')}</p>
                              <p className="text-[10px] text-slate-600">Away</p>
                            </div>
                            {fix.awayLogo
                              ? <img src={fix.awayLogo} alt="" className="w-10 h-10 object-contain flex-shrink-0"/>
                              : <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{background:`${leagueColor}15`}}/>
                            }
                          </div>
                        </div>

                        {/* Result buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            {key:'H', label:fix.homeTeam?.split(' ')[0]||'Home', color:'#22d3ee'},
                            {key:'D', label:'Draw', color:'#f59e0b'},
                            {key:'A', label:fix.awayTeam?.split(' ')[0]||'Away', color:'#a855f7'},
                          ].map(opt => {
                            const isSelected = pick.result===opt.key;
                            return (
                              <button key={opt.key}
                                onClick={()=>{if(!isSubmitted) setPick(id,'result',isSelected?'':opt.key);}}
                                disabled={isSubmitted}
                                className="relative py-3 rounded-xl text-xs font-black transition-all border overflow-hidden disabled:cursor-not-allowed"
                                style={{
                                  background:isSelected?`${opt.color}15`:'rgba(255,255,255,0.03)',
                                  borderColor:isSelected?`${opt.color}40`:'rgba(255,255,255,0.07)',
                                  color:isSelected?opt.color:'#475569',
                                  transform:isSelected?'translateY(-1px)':'none',
                                  boxShadow:isSelected?`0 4px 14px ${opt.color}18`:'none',
                                }}>
                                {isSelected && (
                                  <div className="absolute top-0 left-0 right-0 h-0.5"
                                    style={{background:`linear-gradient(90deg,transparent,${opt.color},transparent)`}}/>
                                )}
                                <span className="flex items-center justify-center gap-1.5">
                                  {opt.label}
                                  {isSelected && <CheckIcon className="w-3 h-3"/>}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Submitted status */}
                        {isSubmitted && (
                          <div className="mt-3 flex items-center justify-between px-3 py-2.5 rounded-xl"
                            style={{background:'rgba(16,185,129,0.07)',border:'1px solid rgba(16,185,129,0.14)'}}>
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                              <LockIcon className="w-3 h-3"/> Locked in
                            </span>
                            <span className="text-[11px] text-slate-400 font-bold" style={{fontFamily:'JetBrains Mono'}}>
                              {pick.result==='H' ? fix.homeTeam?.split(' ')[0]
                                : pick.result==='A' ? fix.awayTeam?.split(' ')[0]
                                : 'Draw'}
                              {pick.score ? ` · ${pick.score}` : ''}
                            </span>
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

        {!loading && fixtures.length===0 && (
          <div className="rounded-2xl border border-white/[0.07] p-16 text-center"
            style={{background:'rgba(10,14,26,0.8)'}}>
            <ClockIcon className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
            <p className="text-white font-black text-lg mb-1">No upcoming fixtures</p>
            <p className="text-slate-500 text-sm">Check back soon — fixtures update daily.</p>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      {newPicks > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-4"
          style={{background:'linear-gradient(0deg,rgba(5,8,16,0.98) 60%,transparent)',backdropFilter:'blur(20px)'}}>
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="flex-1 rounded-2xl border border-white/[0.07] px-4 py-3"
              style={{background:'rgba(10,14,26,0.9)'}}>
              <p className="text-white font-black text-sm">{newPicks} pick{newPicks!==1?'s':''} ready to lock</p>
              <p className="text-slate-500 text-xs">Can't be changed after submission</p>
            </div>
            <button onClick={submitAll} disabled={saving}
              className="flex items-center gap-2 px-7 py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-50 flex-shrink-0"
              style={{
                background:'linear-gradient(135deg,#a855f7,#7c3aed)',
                boxShadow:'0 8px 30px rgba(168,85,247,0.4)',
                color:'white', border:'1px solid rgba(168,85,247,0.4)',
              }}>
              <LockIcon className="w-4 h-4"/>
              {saving?'Locking…':'Lock In'}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl font-bold text-sm border whitespace-nowrap"
          style={{
            background:toast.type==='error'?'rgba(239,68,68,0.95)':'rgba(16,185,129,0.95)',
            borderColor:toast.type==='error'?'rgba(239,68,68,0.4)':'rgba(16,185,129,0.4)',
            backdropFilter:'blur(16px)', color:'white',
            boxShadow:'0 8px 30px rgba(0,0,0,0.4)',
            animation:'toastIn 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>
      <Footer onNavigate={onNavigate}/>
    </div>
  );
}