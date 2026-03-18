/**
 * MatchAccordion.js — Scripta Premium Rebuild
 * Expandable match details: timeline · lineups · player stats · match stats
 */
import React, { useState } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/* ══════════════════════════════════════
   ICONS
══════════════════════════════════════ */
const I = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const ChevronDownIcon = p => <I {...p} d={<polyline points="6 9 12 15 18 9"/>}/>;
const ChevronUpIcon   = p => <I {...p} d={<polyline points="18 15 12 9 6 15"/>}/>;
const ZapIcon         = p => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const UsersIcon       = p => <I {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const BarChartIcon    = p => <I {...p} d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}/>;
const ActivityIcon    = p => <I {...p} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>;
const RepeatIcon      = p => <I {...p} d={<><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>}/>;
const MapPinIcon      = p => <I {...p} d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>}/>;
const UserIcon        = p => <I {...p} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>;

/* ══════════════════════════════════════
   CARD COMPONENTS
══════════════════════════════════════ */
const YellowCard = () => (
  <svg width="9" height="13" viewBox="0 0 9 13">
    <rect width="9" height="13" rx="1.5" fill="#eab308"/>
  </svg>
);
const RedCard = () => (
  <svg width="9" height="13" viewBox="0 0 9 13">
    <rect width="9" height="13" rx="1.5" fill="#ef4444"/>
  </svg>
);
const YellowRedCard = () => (
  <svg width="15" height="13" viewBox="0 0 15 13">
    <rect x="0" width="9" height="13" rx="1.5" fill="#eab308"/>
    <rect x="6" width="9" height="13" rx="1.5" fill="#ef4444"/>
  </svg>
);

/* ══════════════════════════════════════
   RATING BADGE
══════════════════════════════════════ */
const RatingBadge = ({ rating }) => {
  if (!rating) return <span className="text-slate-700 text-[10px]">—</span>;
  const r  = parseFloat(rating);
  const bg = r >= 8 ? 'linear-gradient(135deg,#10b981,#059669)'
           : r >= 7 ? 'linear-gradient(135deg,#22d3ee,#0891b2)'
           : r >= 6 ? 'linear-gradient(135deg,#f59e0b,#d97706)'
           : 'linear-gradient(135deg,#475569,#334155)';
  return (
    <div className="flex items-center justify-center text-white font-black text-[10px] rounded-md px-1.5 py-0.5"
      style={{ background: bg, fontFamily: 'JetBrains Mono', minWidth: 30 }}>
      {r.toFixed(1)}
    </div>
  );
};

/* ══════════════════════════════════════
   POSITION BADGE
══════════════════════════════════════ */
const PosBadge = ({ pos }) => {
  const map  = { G:'GK', D:'DEF', M:'MID', F:'FWD' };
  const colors = {
    G: { color:'#fbbf24', bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.25)' },
    D: { color:'#34d399', bg:'rgba(52,211,153,0.1)',  border:'rgba(52,211,153,0.25)' },
    M: { color:'#60a5fa', bg:'rgba(96,165,250,0.1)',  border:'rgba(96,165,250,0.25)' },
    F: { color:'#ef4444', bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.25)'  },
  };
  const c = colors[pos] || { color:'#94a3b8', bg:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)' };
  return (
    <span className="text-[8px] font-black px-1 py-0.5 rounded-sm"
      style={{ color:c.color, background:c.bg, border:`1px solid ${c.border}` }}>
      {map[pos] || pos}
    </span>
  );
};

/* ══════════════════════════════════════
   STAT BAR
══════════════════════════════════════ */
const StatBar = ({ label, home, away }) => {
  if (home == null && away == null) return null;
  const h = parseFloat(String(home).replace('%','')) || 0;
  const a = parseFloat(String(away).replace('%','')) || 0;
  const total = h + a || 1;
  const hW = h > a, aW = a > h;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-black" style={{ fontFamily:'JetBrains Mono', color: hW?'#22d3ee':'#475569' }}>{home ?? '—'}</span>
        <span className="text-[10px] text-slate-600 uppercase tracking-widest">{label}</span>
        <span className="text-[11px] font-black" style={{ fontFamily:'JetBrains Mono', color: aW?'#a855f7':'#475569' }}>{away ?? '—'}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.04)' }}>
        <div className="h-full rounded-l-full transition-all duration-700"
          style={{ width:`${(h/total)*100}%`, background: hW?'linear-gradient(90deg,#22d3ee80,#22d3ee)':'rgba(71,85,105,0.4)' }}/>
        <div className="h-full rounded-r-full transition-all duration-700"
          style={{ width:`${(a/total)*100}%`, background: aW?'linear-gradient(90deg,#a855f7,#a855f780)':'rgba(71,85,105,0.4)' }}/>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   PLAYER ROW
══════════════════════════════════════ */
const PlayerRow = ({ p, color }) => (
  <div className="flex items-center gap-2 py-2 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-all rounded-lg px-1.5">
    <span className="text-[10px] text-slate-600 w-5 text-center flex-shrink-0" style={{ fontFamily:'JetBrains Mono' }}>{p.number}</span>
    <div className="w-7 h-7 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.06]"
      style={{ background:`${color}10` }}>
      {p.photo
        ? <img src={p.photo} alt="" className="w-full h-full object-cover" onError={e=>{e.target.style.display='none';}}/>
        : <div className="w-full h-full flex items-center justify-center">
            <span className="text-[11px] font-bold" style={{ color }}>{(p.name||'?')[0]}</span>
          </div>}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white text-[11px] font-semibold truncate">
        {p.name}
        {p.captain && <span className="text-yellow-400 ml-1 text-[9px] font-black">©</span>}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <PosBadge pos={p.pos}/>
        {p.minutes && <span className="text-slate-700 text-[9px]">{p.minutes}'</span>}
      </div>
    </div>
    <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px]">
      {p.pos === 'G' ? (
        <>
          {p.saves != null    && <span className="text-cyan-400 font-bold">{p.saves}sv</span>}
          {p.conceded != null && <span className="text-red-400">{p.conceded}ga</span>}
          {p.passAcc != null  && <span className="text-slate-500">{p.passAcc}%</span>}
        </>
      ) : (
        <>
          {p.goals  > 0 && <span className="text-emerald-400">⚽{p.goals}</span>}
          {p.assists> 0 && <span className="text-cyan-400">🅰{p.assists}</span>}
          {p.shots  > 0 && <span className="text-slate-500">{p.shots}sh</span>}
          {(p.pos==='D'||p.pos==='M')&&p.tackles>0 && <span className="text-slate-500">{p.tackles}tk</span>}
          {p.keyPasses > 0 && <span className="text-yellow-400/70">{p.keyPasses}kp</span>}
          {p.passAcc != null  && <span className="text-slate-600">{p.passAcc}%</span>}
        </>
      )}
      <RatingBadge rating={p.rating}/>
    </div>
  </div>
);

/* ══════════════════════════════════════
   FORMATION PITCH SVG
══════════════════════════════════════ */
const FormationPitch = ({ lineup, color, mirror = false }) => {
  if (!lineup?.startXI?.length) return (
    <div className="flex items-center justify-center rounded-2xl border border-white/[0.06]"
      style={{ height:240, background:'rgba(10,14,26,0.8)' }}>
      <p className="text-slate-600 text-xs">No lineup data</p>
    </div>
  );

  // Build row map
  const byRow = {};
  lineup.startXI.forEach(p => {
    const row = (p.grid || '').split(':')[0] || '1';
    if (!byRow[row]) byRow[row] = [];
    byRow[row].push(p);
  });

  let gridRows = Object.keys(byRow).sort((a,b) => parseInt(a)-parseInt(b));

  // Fallback: use formation string
  if (gridRows.length <= 1 || lineup.startXI.every(p => !p.grid)) {
    const formation = lineup.formation || '4-3-3';
    const rows = [1, ...formation.split('-').map(Number)];
    Object.keys(byRow).forEach(k => delete byRow[k]);
    let idx = 0;
    rows.forEach((count, ri) => {
      const key = String(ri + 1);
      byRow[key] = [];
      for (let ci = 0; ci < count && idx < lineup.startXI.length; ci++, idx++) {
        byRow[key].push(lineup.startXI[idx]);
      }
    });
    gridRows = Object.keys(byRow).sort((a,b) => parseInt(a)-parseInt(b));
  }

  const totalRows = gridRows.length;
  const VW = 100, VH = 130;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.06]"
      style={{ background:'linear-gradient(180deg,#0c5230 0%,#0a4a2c 50%,#0c5230 100%)' }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display:'block' }}>
        {/* Pitch markings */}
        <rect x="2" y="2" width={VW-4} height={VH-4} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" rx="1"/>
        <line x1="2" y1={VH/2} x2={VW-2} y2={VH/2} stroke="rgba(255,255,255,0.15)" strokeWidth="0.3"/>
        <circle cx={VW/2} cy={VH/2} r="10" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3"/>
        <circle cx={VW/2} cy={VH/2} r="0.8" fill="rgba(255,255,255,0.4)"/>
        {/* Penalty areas */}
        <rect x="22" y="2" width="56" height="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3"/>
        <rect x="34" y="2" width="32" height="7"  fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3"/>
        <rect x="22" y={VH-18} width="56" height="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3"/>
        <rect x="34" y={VH-9}  width="32" height="7"  fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3"/>
        {/* Goals */}
        <rect x="40" y="0" width="20" height="2.5" fill="rgba(255,255,255,0.2)" rx="0.4"/>
        <rect x="40" y={VH-2.5} width="20" height="2.5" fill="rgba(255,255,255,0.2)" rx="0.4"/>
        {/* Stripe pattern */}
        {[0,1,2,3,4,5].map(i => (
          <rect key={i} x="2" y={2 + i*(VH-4)/6} width={VW-4} height={(VH-4)/12}
            fill="rgba(255,255,255,0.015)" rx="0"/>
        ))}

        {/* Formation label */}
        <text x={VW/2} y={VH-1} textAnchor="middle" fill="rgba(255,255,255,0.35)"
          fontSize="4.5" fontWeight="700" fontFamily="JetBrains Mono">{lineup.formation}</text>

        {/* Players */}
        {gridRows.map((rowKey, ri) => {
          const rowPlayers = byRow[rowKey];
          if (!rowPlayers?.length) return null;
          const yPct = mirror
            ? 8  + (ri / (totalRows - 1 || 1)) * 84
            : 92 - (ri / (totalRows - 1 || 1)) * 84;
          const y = (yPct / 100) * VH;

          return rowPlayers.map((p, ci) => {
            const spread = Math.min(76, rowPlayers.length * 14);
            const startX = 50 - spread / 2;
            const xPct   = rowPlayers.length === 1 ? 50 : startX + (ci / (rowPlayers.length - 1)) * spread;
            const x = xPct;
            const surname = (p.name || '').split(' ').pop().substring(0, 8);

            return (
              <g key={p.id || `${rowKey}-${ci}`}>
                {/* Glow ring */}
                <circle cx={x} cy={y} r="4.5" fill={color} opacity="0.12"/>
                {/* Photo clip or colored circle */}
                <circle cx={x} cy={y} r="3.5" fill={color} opacity="0.85"
                  stroke="rgba(255,255,255,0.6)" strokeWidth="0.5"/>
                <circle cx={x} cy={y} r="1.2" fill="white" opacity="0.9"/>
                {/* Name */}
                <text x={x} y={y + 7.5} textAnchor="middle"
                  fill="rgba(255,255,255,0.85)" fontSize="3.2" fontWeight="600"
                  fontFamily="Outfit" style={{ textShadow:'0 1px 2px rgba(0,0,0,0.9)' }}>
                  {surname}
                </text>
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
};

/* ══════════════════════════════════════
   STAT KEYS
══════════════════════════════════════ */
const STAT_KEYS = [
  ['ball possession','Possession'], ['total shots','Total Shots'], ['shots on goal','On Target'],
  ['blocked shots','Blocked'],      ['corner kicks','Corners'],    ['offsides','Offsides'],
  ['fouls','Fouls'],                ['yellow cards','Yellow Cards'],['red cards','Red Cards'],
  ['goalkeeper saves','Saves'],     ['total passes','Passes'],     ['passes %','Pass Accuracy'],
  ['expected_goals','xG'],
];

const TABS = [
  { id:'timeline', label:'Timeline', Icon:ActivityIcon },
  { id:'lineup',   label:'Lineups',  Icon:UsersIcon    },
  { id:'players',  label:'Players',  Icon:UserIcon     },
  { id:'stats',    label:'Stats',    Icon:BarChartIcon  },
];

/* ══════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════ */
export default function MatchAccordion({ matchId, homeTeam, awayTeam, homeGoals, awayGoals, homeLogo, awayLogo, date }) {
  const [open,      setOpen]      = useState(false);
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (data || !matchId) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(
        `${API_BASE}/match/events/${matchId}?home=${encodeURIComponent(homeTeam||'')}&away=${encodeURIComponent(awayTeam||'')}&date=${date||''}`
      );
      if (!r.ok) throw new Error('Unavailable');
      setData(await r.json());
    } catch { setError('Match details unavailable'); }
    finally { setLoading(false); }
  };

  const timeline = data ? [
    ...data.goals.map(g    => ({ ...g, type:'goal' })),
    ...data.bookings.map(b => ({ ...b, type:'card' })),
    ...data.subs.map(s     => ({ ...s, type:'sub'  })),
  ].sort((a,b) => (a.minute||0)-(b.minute||0)) : [];

  const hScorers = data?.goals.filter(g=>g.isHome&&g.goalType!=='OWN_GOAL').map(g=>`${g.scorer.split(' ').pop()} ${g.minute}'`);
  const aScorers = data?.goals.filter(g=>!g.isHome&&g.goalType!=='OWN_GOAL').map(g=>`${g.scorer.split(' ').pop()} ${g.minute}'`);

  return (
    <div className="border-t border-white/[0.04]">

      {/* ── TOGGLE BUTTON ── */}
      <button onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-all group">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {data ? (
            <>
              <span className="text-[11px] text-slate-500 truncate flex-1 text-left">{hScorers?.join(', ') || '—'}</span>
              <span className="text-[11px] text-slate-500 truncate flex-1 text-right">{aScorers?.join(', ') || '—'}</span>
            </>
          ) : (
            <span className="text-[11px] text-slate-600 group-hover:text-slate-400 transition-colors">
              {matchId ? 'View match details' : 'No detail available'}
            </span>
          )}
        </div>
        <div className="ml-3 flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center border border-white/[0.06] group-hover:border-white/[0.12] transition-all"
          style={{ background:'rgba(255,255,255,0.03)' }}>
          {open
            ? <ChevronUpIcon   className="w-3 h-3 text-slate-500"/>
            : <ChevronDownIcon className="w-3 h-3 text-slate-500"/>}
        </div>
      </button>

      {/* ── EXPANDED PANEL ── */}
      {open && (
        <div className="border-t border-white/[0.04]" style={{ background:'rgba(6,10,20,0.8)', animation:'maFadeIn 0.2s ease-out' }}>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-3 py-10">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor:'#22d3ee', borderTopColor:'transparent' }}/>
              <span className="text-slate-500 text-xs">Loading match data…</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="py-8 text-center">
              <p className="text-slate-600 text-xs">{error}</p>
            </div>
          )}

          {data && (
            <div className="px-4 pt-4 pb-5 space-y-4">

              {/* ── MATCH HEADER ── */}
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background:'rgba(10,14,26,0.9)' }}>
                <div className="h-0.5" style={{ background:'linear-gradient(90deg,transparent,rgba(34,211,238,0.4),transparent)' }}/>
                <div className="p-4">
                  {/* Score row */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      {(homeLogo||data.homeLogo) && <img src={homeLogo||data.homeLogo} alt="" className="w-8 h-8 object-contain flex-shrink-0"/>}
                      <span className="text-white text-sm font-bold truncate">{homeTeam?.replace(/ (FC|AFC|CF|SC)$/,'')}</span>
                    </div>
                    <div className="flex-shrink-0 text-center px-3">
                      <p className="text-2xl font-black text-white" style={{ fontFamily:'JetBrains Mono' }}>
                        {homeGoals} — {awayGoals}
                      </p>
                      {data.htHome != null && (
                        <p className="text-[10px] text-slate-600 mt-0.5" style={{ fontFamily:'JetBrains Mono' }}>
                          HT {data.htHome}-{data.htAway}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
                      <span className="text-white text-sm font-bold truncate">{awayTeam?.replace(/ (FC|AFC|CF|SC)$/,'')}</span>
                      {(awayLogo||data.awayLogo) && <img src={awayLogo||data.awayLogo} alt="" className="w-8 h-8 object-contain flex-shrink-0"/>}
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
                    {data.venue && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-600">
                        <MapPinIcon className="w-3 h-3 flex-shrink-0"/>
                        <span className="truncate max-w-[140px]">{data.venue}</span>
                      </div>
                    )}
                    {data.referees?.[0] && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-600">
                        <UserIcon className="w-3 h-3 flex-shrink-0"/>
                        <span>{data.referees[0]}</span>
                      </div>
                    )}
                    {data.attendance && (
                      <span className="text-[11px] text-slate-600">
                        👥 {parseInt(data.attendance).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Coaches */}
                  {(data.lineups?.home?.coach || data.lineups?.away?.coach) && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60"/>
                        {data.lineups?.home?.coach}
                      </span>
                      <span className="text-[9px] text-slate-700 uppercase tracking-widest">Coach</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        {data.lineups?.away?.coach}
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60"/>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── TABS ── */}
              <div className="flex gap-1 rounded-xl p-1 border border-white/[0.06]" style={{ background:'rgba(10,14,26,0.7)' }}>
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className="relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all"
                      style={{
                        background: isActive ? 'rgba(34,211,238,0.12)' : 'transparent',
                        border: isActive ? '1px solid rgba(34,211,238,0.25)' : '1px solid transparent',
                        color: isActive ? '#22d3ee' : '#475569',
                      }}>
                      {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-cyan-400"/>}
                      <tab.Icon className="w-3 h-3 flex-shrink-0"/>
                      <span className="hidden xs:inline sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ── TIMELINE TAB ── */}
              {activeTab === 'timeline' && (
                <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background:'rgba(10,14,26,0.85)' }}>
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_40px_1fr] gap-1 px-4 py-2.5 border-b border-white/[0.05]"
                    style={{ background:'rgba(255,255,255,0.02)' }}>
                    <span className="text-[9px] text-cyan-400/60 uppercase tracking-widest font-bold truncate">{homeTeam?.split(' ')[0]}</span>
                    <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold text-center">Min</span>
                    <span className="text-[9px] text-purple-400/60 uppercase tracking-widest font-bold text-right truncate">{awayTeam?.split(' ')[0]}</span>
                  </div>

                  {timeline.length === 0 ? (
                    <div className="py-10 text-center">
                      <ActivityIcon className="w-6 h-6 text-slate-700 mx-auto mb-2"/>
                      <p className="text-slate-600 text-xs">No incidents recorded</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.03]">
                      {timeline.map((e, i) => {
                        const isHome = e.isHome;
                        let icon, mainText, subText;

                        if (e.type === 'goal') {
                          const isOG  = e.goalType === 'OWN_GOAL';
                          const isPen = e.goalType === 'PENALTY';
                          icon = <span className={`text-sm ${isOG?'opacity-60':''}`}>⚽</span>;
                          mainText = <span className="text-white text-[11px] font-bold truncate">
                            {e.scorer}{isPen?' (P)':''}{isOG?' (OG)':''}
                          </span>;
                          subText = e.assist && <span className="text-slate-500 text-[10px]">🅰 {e.assist}</span>;
                        } else if (e.type === 'card') {
                          icon = e.card==='YELLOW' ? <YellowCard/> : e.card==='RED' ? <RedCard/> : <YellowRedCard/>;
                          mainText = <span className="text-slate-300 text-[11px] truncate">{e.player}</span>;
                        } else {
                          icon = <RepeatIcon className="w-3 h-3 text-slate-500"/>;
                          mainText = <span className="text-emerald-400 text-[10px] truncate">↑ {e.playerIn}</span>;
                          subText  = <span className="text-red-400/60 text-[10px] truncate">↓ {e.playerOut}</span>;
                        }

                        return (
                          <div key={i} className="grid grid-cols-[1fr_40px_1fr] gap-1 items-center px-4 py-2.5 hover:bg-white/[0.02] transition-all">
                            <div className={`flex items-start gap-1.5 min-w-0 ${isHome ? '' : 'invisible'}`}>
                              <div className="flex-shrink-0 mt-0.5">{icon}</div>
                              <div className="min-w-0">
                                {mainText}
                                {subText && <div>{subText}</div>}
                              </div>
                            </div>
                            <div className="text-center">
                              <span className="text-[10px] font-black text-slate-500 px-1.5 py-0.5 rounded-md"
                                style={{ background:'rgba(255,255,255,0.05)', fontFamily:'JetBrains Mono' }}>
                                {e.minute}'
                              </span>
                            </div>
                            <div className={`flex items-start gap-1.5 justify-end min-w-0 ${!isHome ? '' : 'invisible'}`}>
                              <div className="min-w-0 text-right">
                                {mainText}
                                {subText && <div className="text-right">{subText}</div>}
                              </div>
                              <div className="flex-shrink-0 mt-0.5">{icon}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── LINEUPS TAB ── */}
              {activeTab === 'lineup' && (
                <div className="space-y-3">
                  {/* Pitches side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    {['home', 'away'].map(side => {
                      const color = side === 'home' ? '#22d3ee' : '#a855f7';
                      const name  = side === 'home'
                        ? homeTeam?.replace(/ (FC|AFC|CF|SC)$/, '')
                        : awayTeam?.replace(/ (FC|AFC|CF|SC)$/, '');
                      return (
                        <div key={side}>
                          <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{name}</span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md"
                              style={{ fontFamily:'JetBrains Mono', color, background:`${color}12`, border:`1px solid ${color}25` }}>
                              {data.lineups?.[side]?.formation}
                            </span>
                          </div>
                          <FormationPitch
                            lineup={data.lineups?.[side]}
                            color={color}
                            mirror={side === 'away'}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Benches */}
                  <div className="grid grid-cols-2 gap-3">
                    {['home', 'away'].map(side => {
                      const color = side === 'home' ? '#22d3ee' : '#a855f7';
                      const bench = data.lineups?.[side]?.bench || [];
                      return (
                        <div key={side} className="rounded-2xl border border-white/[0.06] overflow-hidden"
                          style={{ background:'rgba(10,14,26,0.8)' }}>
                          <div className="px-3 py-2 border-b border-white/[0.05]"
                            style={{ background:`${color}06` }}>
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color:`${color}80` }}>Substitutes</span>
                          </div>
                          <div className="p-2 space-y-1">
                            {bench.length === 0
                              ? <p className="text-slate-700 text-[10px] py-1 px-1">No data</p>
                              : bench.map((p, i) => (
                                <div key={i} className="flex items-center gap-2 px-1 py-1">
                                  <span className="text-[9px] text-slate-700 w-4 flex-shrink-0" style={{ fontFamily:'JetBrains Mono' }}>{p.number}</span>
                                  <span className="text-slate-400 text-[10px] truncate flex-1">{p.name}</span>
                                  <PosBadge pos={p.pos}/>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── PLAYERS TAB ── */}
              {activeTab === 'players' && (
                <div className="space-y-3">
                  {['home', 'away'].map(side => {
                    const color   = side === 'home' ? '#22d3ee' : '#a855f7';
                    const name    = side === 'home'
                      ? homeTeam?.replace(/ FC$/, '')
                      : awayTeam?.replace(/ FC$/, '');
                    const players = data.playerStats?.[side] || [];

                    if (!players.length) return (
                      <div key={side} className="rounded-2xl border border-white/[0.06] py-8 text-center"
                        style={{ background:'rgba(10,14,26,0.8)' }}>
                        <p className="text-slate-600 text-xs">No player data for {name}</p>
                      </div>
                    );

                    const gk  = players.filter(p => p.pos === 'G');
                    const def = players.filter(p => p.pos === 'D');
                    const mid = players.filter(p => p.pos === 'M');
                    const fwd = players.filter(p => p.pos === 'F');

                    return (
                      <div key={side} className="rounded-2xl border border-white/[0.07] overflow-hidden"
                        style={{ background:'rgba(10,14,26,0.85)' }}>
                        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between"
                          style={{ background:`${color}06` }}>
                          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color }}>{name}</span>
                          <span className="text-[10px] text-slate-500">{data.lineups?.[side]?.formation}</span>
                        </div>
                        <div className="p-3 space-y-3">
                          {gk.length  > 0 && <div><p className="text-[9px] text-yellow-400/50 uppercase tracking-widest font-bold mb-1.5 px-1">Goalkeeper</p>{gk.map((p,i)=><PlayerRow key={i} p={p} color={color}/>)}</div>}
                          {def.length > 0 && <div><p className="text-[9px] text-emerald-400/50 uppercase tracking-widest font-bold mb-1.5 px-1">Defenders</p>{def.map((p,i)=><PlayerRow key={i} p={p} color={color}/>)}</div>}
                          {mid.length > 0 && <div><p className="text-[9px] text-blue-400/50 uppercase tracking-widest font-bold mb-1.5 px-1">Midfielders</p>{mid.map((p,i)=><PlayerRow key={i} p={p} color={color}/>)}</div>}
                          {fwd.length > 0 && <div><p className="text-[9px] text-red-400/50 uppercase tracking-widest font-bold mb-1.5 px-1">Forwards</p>{fwd.map((p,i)=><PlayerRow key={i} p={p} color={color}/>)}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── STATS TAB ── */}
              {activeTab === 'stats' && (
                <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background:'rgba(10,14,26,0.85)' }}>
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between"
                    style={{ background:'rgba(255,255,255,0.02)' }}>
                    <span className="text-[11px] font-black text-cyan-400/70 uppercase tracking-widest truncate">{homeTeam?.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Match Stats</span>
                    <span className="text-[11px] font-black text-purple-400/70 uppercase tracking-widest truncate">{awayTeam?.split(' ')[0]}</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {STAT_KEYS.map(([key, label]) => {
                      const s = data.stats?.[key];
                      if (!s || (s.home == null && s.away == null)) return null;
                      return <StatBar key={key} label={label} home={s.home} away={s.away}/>;
                    })}
                    {(!data.stats || Object.keys(data.stats).length === 0) && (
                      <div className="py-8 text-center">
                        <BarChartIcon className="w-7 h-7 text-slate-700 mx-auto mb-2"/>
                        <p className="text-slate-600 text-xs">No stats available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes maFadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}