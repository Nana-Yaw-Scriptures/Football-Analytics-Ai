import { useAuth } from '../context/AuthContext';
import { addFavourite, removeFavourite, getFavourites } from '../services/supabaseService';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import PlayerProfileCard from '../components/PlayerProfileCard';
import NavBar from '../components/NavBar';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

/* ══════════════════════════════════════════
   ICONS
══════════════════════════════════════════ */
const I = ({ d, className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const SearchIcon    = (p) => <I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const FilterIcon    = (p) => <I {...p} d={<><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>}/>;
const XIcon         = (p) => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const UsersIcon     = (p) => <I {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const TargetIcon    = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const ZapIcon       = (p) => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const StarIcon      = (p) => <I {...p} d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>;
const TrendingIcon  = (p) => <I {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const ShieldIcon    = (p) => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const ArrowUpIcon   = (p) => <I {...p} d={<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>}/>;
const ArrowDnIcon   = (p) => <I {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>}/>;
const GridIcon      = (p) => <I {...p} d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>}/>;
const ListIcon      = (p) => <I {...p} d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>}/>;
const ScalesIcon    = (p) => <I {...p} d={<><line x1="12" y1="3" x2="12" y2="21"/><path d="M3 9l9-7 9 7"/><path d="M3 15l9 7 9-7"/></>}/>;
const FireIcon      = (p) => <I {...p} d={<path d="M12 22c5.523 0 10-4.477 10-10 0-4.136-2.535-7.678-6.16-9.186C16.784 4.69 17 6.32 17 8c0 2.761-2.239 5-5 5s-5-2.239-5-5c0-.466.064-.917.184-1.347C4.278 8.038 2 11.254 2 15c0 3.866 3.134 7 7 7h3z"/>}/>;
const CheckIcon     = (p) => <I {...p} d={<polyline points="20 6 9 17 4 12"/>}/>;
const CalendarIcon  = (p) => <I {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const LEAGUE_IMG = {
  'Premier League': 'https://media.api-sports.io/football/leagues/39.png',
  'La Liga':        'https://media.api-sports.io/football/leagues/140.png',
  'Bundesliga':     'https://media.api-sports.io/football/leagues/78.png',
  'Serie A':        'https://media.api-sports.io/football/leagues/135.png',
  'Ligue 1':        'https://media.api-sports.io/football/leagues/61.png',
  'Primeira Liga':  'https://media.api-sports.io/football/leagues/94.png',
};
const LEAGUE_COLOR = {
  'Premier League': '#7c3aed',
  'La Liga':        '#dc2626',
  'Bundesliga':     '#d97706',
  'Serie A':        '#059669',
  'Ligue 1':        '#2563eb',
  'Primeira Liga':  '#10b981',
};
const LEAGUES   = ['All', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Primeira Liga'];
const POSITIONS = ['All', 'Attacker', 'Midfielder', 'Defender', 'Goalkeeper'];
const SORT_OPTS = [
  { col:'goals',       label:'Goals',   Icon:ZapIcon,      color:'#22d3ee' },
  { col:'assists',     label:'Assists', Icon:TrendingIcon, color:'#f59e0b' },
  { col:'rating',      label:'Rating',  Icon:StarIcon,     color:'#a855f7' },
  { col:'xG',          label:'xG',      Icon:TargetIcon,   color:'#10b981' },
  { col:'appearances', label:'Apps',    Icon:CalendarIcon, color:'#64748b' },
  { col:'tacklesTotal',label:'Tackles', Icon:ShieldIcon,   color:'#34d399' },
];
const POS_CONFIG = {
  Forward:    { color:'#ef4444', bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.3)',   short:'FWD' },
  Attacker:   { color:'#ef4444', bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.3)',   short:'ATT' },
  Midfielder: { color:'#60a5fa', bg:'rgba(96,165,250,0.12)',  border:'rgba(96,165,250,0.3)',  short:'MID' },
  Defender:   { color:'#34d399', bg:'rgba(52,211,153,0.12)',  border:'rgba(52,211,153,0.3)',  short:'DEF' },
  Goalkeeper: { color:'#fbbf24', bg:'rgba(251,191,36,0.12)',  border:'rgba(251,191,36,0.3)',  short:'GK'  },
};
const PER = 50;

/* ══════════════════════════════════════════
   MINI RADAR SVG
══════════════════════════════════════════ */
const MiniRadar = ({ player, color = '#22d3ee', size = 80 }) => {
  const pos = (player.position||'').toLowerCase();
  // Pick dims based on position
  const dims = pos.includes('goalkeeper') ? [
    { key:'rating',        scale:10  },
    { key:'saves',         scale:120 },
    { key:'passAccuracy',  scale:95  },
    { key:'aerialWon',     scale:60  },
    { key:'appearances',   scale:38  },
    { key:'penaltiesSaved',scale:5   },
  ] : pos.includes('defender') ? [
    { key:'rating',        scale:10  },
    { key:'tacklesTotal',  scale:100 },
    { key:'interceptions', scale:60  },
    { key:'aerialWon',     scale:120 },
    { key:'duelWinPct',    scale:70  },
    { key:'passAccuracy',  scale:95  },
  ] : pos.includes('midfielder') ? [
    { key:'rating',       scale:10 },
    { key:'keyPasses',    scale:80 },
    { key:'assists',      scale:15 },
    { key:'goals',        scale:15 },
    { key:'passAccuracy', scale:95 },
    { key:'tacklesTotal', scale:80 },
  ] : [
    { key:'rating',           scale:10 },
    { key:'goals',            scale:30 },
    { key:'xG',               scale:25 },
    { key:'assists',          scale:15 },
    { key:'shotAccuracy',     scale:40 },
    { key:'dribbleSuccessPct',scale:80 },
  ];
  const n  = dims.length;
  const r  = size * 0.35;
  const cx = size / 2;
  const cy = size / 2;
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + Math.cos(a) * r * Math.min(v, 1), y: cy + Math.sin(a) * r * Math.min(v, 1) };
  };
  const vals = dims.map(d => Math.min((Number(player[d.key]) || 0) / d.scale, 1));
  const path = vals.map((v, i) => { const p = pt(i, v); return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ') + 'Z';
  const grid = (f) => dims.map((_, i) => { const a = (Math.PI*2*i)/n - Math.PI/2; return `${(cx+Math.cos(a)*r*f).toFixed(1)},${(cy+Math.sin(a)*r*f).toFixed(1)}`; }).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.33, 0.66, 1].map((f, i) => <polygon key={i} points={grid(f)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6"/>)}
      {dims.map((_, i) => { const p = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>; })}
      <path d={path} fill={`${color}20`} stroke={color} strokeWidth="1.2"/>
      {vals.map((v, i) => { const p = pt(i, v); return <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color}/>; })}
    </svg>
  );
};

/* ══════════════════════════════════════════
   RATING BADGE
══════════════════════════════════════════ */
const RatingBadge = ({ r, size = 'md' }) => {
  const v = parseFloat(r) || 0;
  if (!v) return <span className="text-slate-700 font-bold">—</span>;
  const [from, to] = v >= 7.5 ? ['#10b981','#059669'] : v >= 7 ? ['#22d3ee','#0891b2'] : v >= 6.5 ? ['#f59e0b','#d97706'] : ['#6b7280','#4b5563'];
  const cls = size === 'sm' ? 'w-10 h-7 text-xs rounded-lg' : 'w-12 h-8 text-sm rounded-xl';
  return (
    <div className={`${cls} flex items-center justify-center font-black text-white shadow-lg`}
      style={{ background: `linear-gradient(135deg,${from},${to})`, fontFamily: 'JetBrains Mono' }}>
      {v.toFixed(1)}
    </div>
  );
};

/* ══════════════════════════════════════════
   POSITION BADGE
══════════════════════════════════════════ */
const PosBadge = ({ pos }) => {
  const c = POS_CONFIG[pos] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', short: (pos||'—').slice(0,3).toUpperCase() };
  return (
    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none"
      style={{ color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
      {c.short}
    </span>
  );
};

/* ══════════════════════════════════════════
   ON FIRE / xG BADGES
══════════════════════════════════════════ */
const OnFireBadge = () => (
  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black"
    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
    🔥 Hot
  </div>
);
const XGBadge = ({ diff }) => {
  const over = diff > 0;
  const color = over ? '#10b981' : '#ef4444';
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black"
      style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
      {over ? '▲' : '▼'} xG
    </div>
  );
};

/* ══════════════════════════════════════════
   SPOTLIGHT CARD — top 3
══════════════════════════════════════════ */
const SpotlightCard = ({ player, rank, sortCol, onClick, isFav, onFav }) => {
  const medals = [
    { grad: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.3)', label: 'Gold' },
    { grad: 'linear-gradient(135deg,#94a3b8,#64748b)', glow: 'rgba(148,163,184,0.2)', label: 'Silver' },
    { grad: 'linear-gradient(135deg,#cd7c3e,#a05c2a)', glow: 'rgba(205,124,62,0.2)', label: 'Bronze' },
  ];
  const m     = medals[rank - 1];
  const val   = player[sortCol] || 0;
  const posC  = POS_CONFIG[player.position] || POS_CONFIG.Midfielder;
  const isHot = (player.goals || 0) >= 8 && (player.rating || 0) >= 7.2;
  const xgDiff= (player.goals || 0) - (player.xG || 0);

  return (
    <div onClick={() => onClick(player)}
      className="relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: `linear-gradient(135deg,rgba(10,14,26,0.95),rgba(5,8,16,0.98))`,
        border: `1px solid rgba(255,255,255,0.08)`,
        boxShadow: `0 0 40px ${m.glow}`,
        animation: `cardIn 0.4s ease-out ${(rank-1)*0.1}s both`,
      }}>

      {/* Rank medal strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: m.grad }}/>
      <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center font-black text-white text-xs shadow-lg"
        style={{ background: m.grad }}>
        {rank}
      </div>
      {/* Heart / Favourite button */}
      {onFav && (
        <button onClick={e => onFav(e, player)}
          className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10"
          style={{ background: isFav ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)', border: isFav ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.1)' }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={isFav ? '#ef4444' : 'none'} stroke={isFav ? '#ef4444' : '#64748b'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      )}

      <div className="p-4">
        {/* Photo + radar */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative flex-shrink-0">
            {player.photo
              ? <img src={player.photo} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10"
                  style={{ boxShadow: `0 0 20px ${m.glow}` }}/>
              : <div className="w-16 h-16 rounded-xl flex items-center justify-center border border-white/10"
                  style={{ background: posC.bg }}>
                  <span className="text-2xl font-black" style={{ color: posC.color }}>{(player.name||'?')[0]}</span>
                </div>}
            {/* League badge */}
            {player.league && LEAGUE_IMG[player.league] && (
              <img src={LEAGUE_IMG[player.league]} alt="" className="absolute -bottom-1.5 -right-1.5 w-5 h-5 object-contain rounded-full border border-[#0a0e1a] bg-[#0a0e1a]"/>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1.5 flex-wrap mb-1">
              {isHot && <OnFireBadge/>}
              {Math.abs(xgDiff) > 1.5 && <XGBadge diff={xgDiff}/>}
            </div>
            <p className="text-white font-black text-base leading-tight truncate group-hover:text-cyan-300 transition-colors">{player.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {player.teamLogo && <img src={player.teamLogo} alt="" className="w-4 h-4 object-contain flex-shrink-0"/>}
              <span className="text-xs text-slate-500 truncate">{(player.team||'').replace(/ (FC|AFC|CF)$/, '')}</span>
            </div>
            <div className="mt-1.5"><PosBadge pos={player.position}/></div>
          </div>
          <div className="flex-shrink-0">
            <MiniRadar player={player} color={posC.color} size={72}/>
          </div>
        </div>

        {/* Big stat */}
        <div className="flex items-end justify-between pt-3 border-t border-white/[0.06]">
          <div>
            <p className="text-3xl font-black" style={{ fontFamily: 'JetBrains Mono', color: SORT_OPTS.find(s=>s.col===sortCol)?.color || '#22d3ee' }}>
              {typeof val === 'number' ? val.toFixed(sortCol==='rating'||sortCol==='xG'?1:0) : val || '—'}
            </p>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">{SORT_OPTS.find(s=>s.col===sortCol)?.label}</p>
          </div>
          <div className="text-right">
            <RatingBadge r={player.rating}/>
            <p className="text-[10px] text-slate-600 mt-1">{player.appearances||0} apps</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   PLAYER CARD (grid view)
══════════════════════════════════════════ */
const PlayerCard = ({ player, rank, sortCol, onSelect, compareMode, isCompared, onCompare, isFav, onFav }) => {
  const posC    = POS_CONFIG[player.position] || POS_CONFIG.Midfielder;
  const isHot   = (player.goals || 0) >= 8 && (player.rating || 0) >= 7.2;
  const xgDiff  = ((player.goals || 0) - (player.xG || 0)).toFixed(1);
  const isOver  = parseFloat(xgDiff) > 0;
  const pos     = (player.position || '').toLowerCase();

  // Position-specific performance bars
  const bars = pos.includes('goalkeeper') ? [
    { label:'Saves',    val:player.saves||0,        max:120, color:'#22d3ee' },
    { label:'Pass%',    val:player.passAccuracy||0, max:100, color:'#60a5fa' },
    { label:'Rating',   val:(player.rating||0)*10,  max:100, color:'#a855f7' },
  ] : pos.includes('defender') ? [
    { label:'Tackles',  val:player.tacklesTotal||0,  max:100, color:'#34d399' },
    { label:'Aerial',   val:player.aerialWon||0,     max:120, color:'#22d3ee' },
    { label:'Pass%',    val:player.passAccuracy||0,  max:100, color:'#60a5fa' },
  ] : pos.includes('midfielder') ? [
    { label:'Key Pass', val:player.keyPasses||0,     max:80,  color:'#f59e0b' },
    { label:'Pass%',    val:player.passAccuracy||0,  max:100, color:'#60a5fa' },
    { label:'Goals',    val:player.goals||0,         max:20,  color:'#22d3ee' },
  ] : [
    { label:'Goals',    val:player.goals||0,         max:30,  color:'#22d3ee' },
    { label:'Shot acc', val:player.shotAccuracy||0,  max:100, color:'#10b981' },
    { label:'G/90',     val:(player.goalsPerNinety||0)*100, max:100, color:'#f59e0b' },
  ];

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 group cursor-pointer"
      style={{
        background: isCompared ? 'linear-gradient(135deg,rgba(34,211,238,0.08),rgba(5,8,16,0.98))' : 'rgba(8,12,22,0.9)',
        border: isCompared ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isCompared ? '0 0 20px rgba(34,211,238,0.12)' : 'none',
      }}>

      {/* Position accent top line */}
      <div className="h-0.5" style={{background:`linear-gradient(90deg,${posC.color},${posC.color}40,transparent)`}}/>

      {/* Header */}
      <div className="p-4 pb-2" onClick={() => onSelect(player)}>
        <div className="flex items-start gap-3">
          {/* Avatar with position ring */}
          <div className="relative flex-shrink-0">
            <div className="relative w-12 h-12">
              <svg className="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="21" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5"/>
                <circle cx="24" cy="24" r="21" fill="none" stroke={posC.color} strokeWidth="2.5"
                  strokeDasharray={`${Math.min(100,(player.rating||0)*10) * 1.32} 132`}
                  strokeLinecap="round"/>
              </svg>
              {player.photo
                ? <img src={player.photo} alt="" className="absolute inset-1.5 w-9 h-9 rounded-lg object-cover"/>
                : <div className="absolute inset-1.5 w-9 h-9 rounded-lg flex items-center justify-center font-black text-base"
                    style={{background:posC.bg, color:posC.color}}>{(player.name||'?')[0]}</div>
              }
            </div>
            {player.league && LEAGUE_IMG[player.league] && (
              <img src={LEAGUE_IMG[player.league]} alt="" className="absolute -bottom-0.5 -right-0.5 w-4 h-4 object-contain rounded-full border border-[#080c16] bg-[#080c16]"/>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white leading-tight truncate group-hover:text-cyan-300 transition-colors">{player.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {player.teamLogo && <img src={player.teamLogo} alt="" className="w-3 h-3 object-contain flex-shrink-0"/>}
              <span className="text-[10px] text-slate-500 truncate">{(player.team||'').replace(/ (FC|AFC|CF)$/,'')}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{background:posC.bg, color:posC.color}}>{posC.short}</span>
              {isHot && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{background:'rgba(245,158,11,0.15)',color:'#f59e0b'}}>🔥 Hot</span>}
              {Math.abs(parseFloat(xgDiff)) > 1.5 && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
                  style={{background:isOver?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)', color:isOver?'#10b981':'#ef4444'}}>
                  {isOver?'+':''}{xgDiff} xG
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {compareMode ? (
              <button onClick={e=>{e.stopPropagation();onCompare(player);}}
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                style={{background:isCompared?'#22d3ee':'rgba(255,255,255,0.08)',border:isCompared?'1px solid #22d3ee':'1px solid rgba(255,255,255,0.12)'}}>
                {isCompared && <CheckIcon className="w-3.5 h-3.5 text-[#050810]"/>}
              </button>
            ) : onFav && (
              <button onClick={e=>onFav(e,player)}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                style={{background:isFav?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.06)',border:isFav?'1px solid rgba(239,68,68,0.4)':'1px solid rgba(255,255,255,0.1)'}}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill={isFav?'#ef4444':'none'} stroke={isFav?'#ef4444':'#94a3b8'} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            )}
            <div className="text-right">
              <p className="text-base font-black" style={{color:posC.color,fontFamily:'JetBrains Mono'}}>{(player.rating||0).toFixed(1)}</p>
              <p className="text-[8px] text-slate-700 uppercase">Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key stats row */}
      <div className="grid grid-cols-4 gap-0 border-t border-white/[0.05] mx-4" onClick={() => onSelect(player)}>
        {[
          {val:player.goals||0,     lbl:'Goals',   color:'#22d3ee'},
          {val:player.assists||0,   lbl:'Assists',  color:'#f59e0b'},
          {val:(player.xG||0).toFixed(1), lbl:'xG', color:'#10b981'},
          {val:player.appearances||0, lbl:'Apps',  color:'#64748b'},
        ].map((s,i) => (
          <div key={i} className="py-2.5 text-center">
            <p className="text-sm font-black" style={{color:s.color,fontFamily:'JetBrains Mono'}}>{s.val}</p>
            <p className="text-[8px] text-slate-700 uppercase tracking-wider">{s.lbl}</p>
          </div>
        ))}
      </div>

      {/* Performance bars */}
      <div className="px-4 pt-2 pb-2 space-y-1.5 border-t border-white/[0.04]" onClick={() => onSelect(player)}>
        {bars.map((b,i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[9px] text-slate-600 uppercase w-12 flex-shrink-0">{b.label}</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
              <div className="h-full rounded-full transition-all" style={{width:`${Math.min(100,(b.val/b.max)*100)}%`,background:b.color}}/>
            </div>
            <span className="text-[9px] font-black w-7 text-right" style={{color:b.color,fontFamily:'JetBrains Mono'}}>{typeof b.val === 'number' && b.val < 100 && b.label.includes('%') ? b.val+'%' : b.val}</span>
          </div>
        ))}
      </div>

      {/* Discipline footer */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-white/[0.04]"
        style={{background:'rgba(255,255,255,0.015)'}} onClick={() => onSelect(player)}>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-600">
          <div className="w-2 h-2.5 rounded-sm flex-shrink-0" style={{background:'#eab308'}}/>
          {player.yellowCards||0}
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-600">
          <div className="w-2 h-2.5 rounded-sm flex-shrink-0" style={{background:'#ef4444'}}/>
          {player.redCards||0}
        </div>
        <div className="w-px h-3 bg-white/10"/>
        <span className="text-[9px] text-slate-600">{(player.minutes||0).toLocaleString()} min</span>
        {player.nationality && (
          <>
            <div className="w-px h-3 bg-white/10"/>
            <span className="text-[9px] text-slate-600 truncate">{player.nationality}</span>
          </>
        )}
        <div className="ml-auto">
          <MiniRadar player={player} color={posC.color} size={28}/>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   POSITION-AWARE METRICS
   Each position group gets its own set of
   meaningful stats for comparison + radar
══════════════════════════════════════════ */
const getPositionMetrics = (pos) => {
  const p = (pos||'').toLowerCase();
  if (p.includes('goalkeeper')) return {
    label: 'Goalkeeper',
    color: '#fbbf24',
    metrics: [
      { key:'rating',         label:'Rating',         scale:10,   dp:1, color:'#fbbf24' },
      { key:'saves',          label:'Saves',           scale:120,  dp:0, color:'#22d3ee' },
      { key:'goalsConceded',  label:'Goals Conceded',  scale:50,   dp:0, color:'#ef4444', lowerBetter:true },
      { key:'passAccuracy',   label:'Pass Accuracy %', scale:95,   dp:1, color:'#60a5fa' },
      { key:'aerialWon',      label:'Aerials Won',     scale:60,   dp:0, color:'#a855f7' },
      { key:'appearances',    label:'Appearances',     scale:38,   dp:0, color:'#64748b' },
      { key:'penaltiesSaved', label:'Pens Saved',      scale:5,    dp:0, color:'#10b981' },
      { key:'yellowCards',    label:'Yellow Cards',    scale:10,   dp:0, color:'#eab308', lowerBetter:true },
    ],
    radarDims: [
      {k:'rating',       scale:10,  label:'Rating'},
      {k:'saves',        scale:120, label:'Saves'},
      {k:'passAccuracy', scale:95,  label:'Pass%'},
      {k:'aerialWon',    scale:60,  label:'Aerial'},
      {k:'appearances',  scale:38,  label:'Apps'},
      {k:'penaltiesSaved',scale:5,  label:'Pens Saved'},
    ],
  };
  if (p.includes('defender')) return {
    label: 'Defender',
    color: '#34d399',
    metrics: [
      { key:'rating',        label:'Rating',          scale:10,  dp:1, color:'#a855f7' },
      { key:'tacklesTotal',  label:'Tackles',         scale:100, dp:0, color:'#34d399' },
      { key:'interceptions', label:'Interceptions',   scale:60,  dp:0, color:'#22d3ee' },
      { key:'aerialWon',     label:'Aerials Won',     scale:120, dp:0, color:'#10b981' },
      { key:'duelWinPct',    label:'Duel Win %',      scale:70,  dp:1, color:'#f59e0b' },
      { key:'passAccuracy',  label:'Pass Accuracy %', scale:95,  dp:1, color:'#60a5fa' },
      { key:'blocks',        label:'Blocks',          scale:40,  dp:0, color:'#f97316' },
      { key:'yellowCards',   label:'Yellow Cards',    scale:10,  dp:0, color:'#eab308', lowerBetter:true },
    ],
    radarDims: [
      {k:'rating',        scale:10,  label:'Rating'},
      {k:'tacklesTotal',  scale:100, label:'Tackles'},
      {k:'interceptions', scale:60,  label:'Intercepts'},
      {k:'aerialWon',     scale:120, label:'Aerial'},
      {k:'duelWinPct',    scale:70,  label:'Duel%'},
      {k:'passAccuracy',  scale:95,  label:'Pass%'},
    ],
  };
  if (p.includes('midfielder')) return {
    label: 'Midfielder',
    color: '#60a5fa',
    metrics: [
      { key:'rating',       label:'Rating',          scale:10,  dp:1, color:'#a855f7' },
      { key:'keyPasses',    label:'Key Passes',      scale:80,  dp:0, color:'#22d3ee' },
      { key:'assists',      label:'Assists',         scale:15,  dp:0, color:'#f59e0b' },
      { key:'goals',        label:'Goals',           scale:15,  dp:0, color:'#ef4444' },
      { key:'xA',           label:'xA',              scale:12,  dp:1, color:'#f97316' },
      { key:'passAccuracy', label:'Pass Accuracy %', scale:95,  dp:1, color:'#60a5fa' },
      { key:'tacklesTotal', label:'Tackles',         scale:80,  dp:0, color:'#34d399' },
      { key:'duelsWon',     label:'Duels Won',       scale:150, dp:0, color:'#10b981' },
    ],
    radarDims: [
      {k:'rating',       scale:10, label:'Rating'},
      {k:'keyPasses',    scale:80, label:'Key Pass'},
      {k:'assists',      scale:15, label:'Assists'},
      {k:'goals',        scale:15, label:'Goals'},
      {k:'passAccuracy', scale:95, label:'Pass%'},
      {k:'tacklesTotal', scale:80, label:'Tackles'},
    ],
  };
  // Forward / Attacker / Winger (default)
  return {
    label: 'Attacker',
    color: '#ef4444',
    metrics: [
      { key:'rating',           label:'Rating',         scale:10,  dp:1, color:'#a855f7' },
      { key:'goals',            label:'Goals',          scale:30,  dp:0, color:'#22d3ee' },
      { key:'xG',               label:'xG',             scale:25,  dp:1, color:'#10b981' },
      { key:'assists',          label:'Assists',        scale:15,  dp:0, color:'#f59e0b' },
      { key:'xA',               label:'xA',             scale:12,  dp:1, color:'#f97316' },
      { key:'shotAccuracy',     label:'Shot Conv %',    scale:40,  dp:1, color:'#ef4444' },
      { key:'dribbleSuccessPct',label:'Dribble %',      scale:80,  dp:1, color:'#60a5fa' },
      { key:'keyPasses',        label:'Key Passes',     scale:60,  dp:0, color:'#34d399' },
    ],
    radarDims: [
      {k:'rating',           scale:10, label:'Rating'},
      {k:'goals',            scale:30, label:'Goals'},
      {k:'xG',               scale:25, label:'xG'},
      {k:'assists',          scale:15, label:'Assists'},
      {k:'shotAccuracy',     scale:40, label:'Conv%'},
      {k:'dribbleSuccessPct',scale:80, label:'Dribble%'},
    ],
  };
};

/* ══════════════════════════════════════════
   COMPARISON MODAL
══════════════════════════════════════════ */
const CompareModal = ({ players, onClose }) => {
  if (players.length < 2) return null;
  const [a, b] = players;

  // Determine the dominant position — prefer whichever pos appears,
  // fall back to player A's position, then generic
  const resolvePos = (pa, pb) => {
    const pa_ = (pa.position||'').toLowerCase();
    const pb_ = (pb.position||'').toLowerCase();
    // If both the same group, use that
    if (pa_.includes('goalkeeper') && pb_.includes('goalkeeper')) return pa.position;
    if (pa_.includes('defender')   && pb_.includes('defender'))   return pa.position;
    if (pa_.includes('midfielder') && pb_.includes('midfielder'))  return pa.position;
    // Mixed positions — use player A's position
    return pa.position;
  };

  const posGroup  = resolvePos(a, b);
  const posConfig = getPositionMetrics(posGroup);
  const { metrics: METRICS, radarDims } = posConfig;

  // For "lower is better" metrics (e.g. Goals Conceded), flip the winner logic
  const StatBar = ({ metric }) => {
    const av  = parseFloat(a[metric.key]) || 0;
    const bv  = parseFloat(b[metric.key]) || 0;
    const mx  = Math.max(av, bv) || 1;
    // Lower-better: fewer = better
    const aW  = metric.lowerBetter ? av < bv : av > bv;
    const bW  = metric.lowerBetter ? bv < av : bv > av;
    const fmt = (v) => v.toFixed(metric.dp ?? 0);
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-black ${aW?'text-cyan-400':'text-slate-500'}`}
            style={{fontFamily:'JetBrains Mono'}}>{fmt(av)}{metric.key==='passAccuracy'||metric.key==='duelWinPct'||metric.key==='shotAccuracy'||metric.key==='dribbleSuccessPct'?'%':''}</span>
          <div className="text-center">
            <span className="text-[11px] text-slate-400 uppercase tracking-widest">{metric.label}</span>
            {metric.lowerBetter && <span className="block text-[9px] text-slate-600">lower is better</span>}
          </div>
          <span className={`text-sm font-black ${bW?'text-purple-400':'text-slate-500'}`}
            style={{fontFamily:'JetBrains Mono'}}>{fmt(bv)}{metric.key==='passAccuracy'||metric.key==='duelWinPct'||metric.key==='shotAccuracy'||metric.key==='dribbleSuccessPct'?'%':''}</span>
        </div>
        <div className="flex gap-1 h-2">
          <div className="flex-1 rounded-full overflow-hidden flex justify-end" style={{background:'rgba(255,255,255,0.05)'}}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{width:`${(av/mx)*100}%`, background: aW ? `linear-gradient(90deg,${metric.color}60,${metric.color})` : 'rgba(100,116,139,0.3)'}}/>
          </div>
          <div className="flex-1 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{width:`${(bv/mx)*100}%`, background: bW ? `linear-gradient(90deg,${metric.color},${metric.color}60)` : 'rgba(100,116,139,0.3)'}}/>
          </div>
        </div>
      </div>
    );
  };

  // Radar using the position-specific dims
  const Radar = ({ player, color }) => {
    const n=radarDims.length, r=80, cx=100, cy=100;
    const pt=(i,v)=>{const angle=(Math.PI*2*i)/n-Math.PI/2;return{x:cx+Math.cos(angle)*r*Math.min(v,1),y:cy+Math.sin(angle)*r*Math.min(v,1)};};
    const vals=radarDims.map(d=>Math.min((parseFloat(player[d.k])||0)/d.scale,1));
    const path=vals.map((v,i)=>{const p2=pt(i,v);return`${i===0?'M':'L'}${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;}).join(' ')+'Z';
    const grid=(f)=>radarDims.map((_,i)=>{const angle=(Math.PI*2*i)/n-Math.PI/2;return`${(cx+Math.cos(angle)*r*f).toFixed(1)},${(cy+Math.sin(angle)*r*f).toFixed(1)}`;}).join(' ');
    return (
      <svg width={200} height={200} viewBox="0 0 200 200">
        {[0.33,0.66,1].map((f,i)=><polygon key={i} points={grid(f)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8"/>)}
        {radarDims.map((_,i)=>{const p2=pt(i,1);return<line key={i} x1={cx} y1={cy} x2={p2.x} y2={p2.y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.7"/>;})}
        <path d={path} fill={`${color}18`} stroke={color} strokeWidth="1.5"/>
        {vals.map((v,i)=>{const p2=pt(i,v);return<circle key={i} cx={p2.x} cy={p2.y} r="3" fill={color}/>;} )}
        {radarDims.map((d,i)=>{const p2=pt(i,1.24);return<text key={i} x={p2.x} y={p2.y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.4)" fontSize="8.5" fontFamily="Outfit">{d.label}</text>;})}
      </svg>
    );
  };

  // Count wins (respecting lowerBetter)
  const aWins = METRICS.filter(m => {
    const av = parseFloat(a[m.key])||0, bv = parseFloat(b[m.key])||0;
    return m.lowerBetter ? av < bv : av > bv;
  }).length;
  const bWins = METRICS.length - aWins;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)'}}>
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
        style={{background:'rgba(8,12,24,0.98)',maxHeight:'90vh',overflowY:'auto',animation:'modalIn 0.3s cubic-bezier(0.16,1,0.3,1)'}}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.07] flex items-center justify-between sticky top-0 z-10"
          style={{background:'rgba(8,12,24,0.98)'}}>
          <div className="flex items-center gap-3">
            <ScalesIcon className="w-5 h-5 text-cyan-400"/>
            <div>
              <span className="text-white font-black text-lg">Head-to-Head</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-black px-2 py-0.5 rounded-md"
                  style={{background:`${posConfig.color}15`,color:posConfig.color,border:`1px solid ${posConfig.color}25`}}>
                  {posConfig.label} metrics
                </span>
                {a.position !== b.position && (
                  <span className="text-[10px] text-slate-600">
                    {a.position} vs {b.position}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10 text-slate-400 hover:text-white transition-all"
            style={{background:'rgba(255,255,255,0.04)'}}>
            <XIcon className="w-4 h-4"/>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Player headers */}
          <div className="grid grid-cols-2 gap-4">
            {[{player:a,color:'#22d3ee'},{player:b,color:'#a855f7'}].map(({player:p,color:c},si)=>(
              <div key={si} className="rounded-2xl p-4 text-center border" style={{background:`${c}08`,borderColor:`${c}20`}}>
                {p.photo
                  ? <img src={p.photo} alt="" className="w-16 h-16 rounded-2xl mx-auto mb-2 object-cover border-2" style={{borderColor:c}}/>
                  : <div className="w-16 h-16 rounded-2xl mx-auto mb-2 flex items-center justify-center" style={{background:`${c}20`}}>
                      <span className="text-2xl font-black" style={{color:c}}>{(p.name||'?')[0]}</span>
                    </div>}
                <p className="text-white font-black text-sm">{p.name}</p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  {p.teamLogo && <img src={p.teamLogo} alt="" className="w-4 h-4 object-contain"/>}
                  <span className="text-xs text-slate-500">{(p.team||'').replace(/ FC$/,'')}</span>
                </div>
                <div className="mt-1.5 flex justify-center"><PosBadge pos={p.position}/></div>
              </div>
            ))}
          </div>

          {/* Verdict */}
          <div className="rounded-2xl p-4 border border-white/[0.06] text-center" style={{background:'rgba(255,255,255,0.02)'}}>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-2">
              {posConfig.label} comparison · {METRICS.length} metrics
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-black text-cyan-400" style={{fontFamily:'JetBrains Mono'}}>{aWins}</p>
                <p className="text-[11px] text-slate-500">{a.name?.split(' ').pop()}</p>
              </div>
              <div className="text-slate-600 font-bold text-xl">vs</div>
              <div className="text-center">
                <p className="text-3xl font-black text-purple-400" style={{fontFamily:'JetBrains Mono'}}>{bWins}</p>
                <p className="text-[11px] text-slate-500">{b.name?.split(' ').pop()}</p>
              </div>
            </div>
          </div>

          {/* Radars — position-specific axes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center">
              <Radar player={a} color="#22d3ee"/>
            </div>
            <div className="flex flex-col items-center">
              <Radar player={b} color="#a855f7"/>
            </div>
          </div>

          {/* Stat bars — position-specific */}
          <div className="space-y-3">
            {METRICS.map(m => <StatBar key={m.key} metric={m}/>)}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function PlayersPage({ onNavigate }) {
  const { user }                      = useAuth();
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [players,     setPlayers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [league,      setLeague]      = useState('All');
  const [position,    setPosition]    = useState('All');
  const [sortCol,     setSortCol]     = useState('goals');
  const [sortDir,     setSortDir]     = useState('desc');
  const [page,        setPage]        = useState(1);
  const [selected,    setSelected]    = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode,    setViewMode]    = useState('table'); // 'table' | 'grid'
  const [compareMode, setCompareMode] = useState(false);
  const [compared,    setCompared]    = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [minMins,     setMinMins]     = useState(0);
  const [statusFilter, setStatusFilter] = useState([]); // 'Injured','Doubtful','Suspended'
  const [injuryMap, setInjuryMap] = useState({}); // { playerNameLower: { type, status, news, chance } }
  const searchRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/players/search?q=&limit=9999`)
      .then(r => r.json())
      .then(d => { setPlayers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Load user favourites
  useEffect(() => {
    if (!user) return;
    getFavourites(user.id).then(favs => {
      setFavouriteIds(new Set(favs.map(f => f.player_id)));
    }).catch(() => {});
  }, [user]);

  const toggleFavourite = async (e, player) => {
    e.stopPropagation();
    if (!user) { onNavigate('login'); return; }
    const pid = String(player.id || player.player_id || player.name);
    if (favouriteIds.has(pid)) {
      setFavouriteIds(prev => { const n = new Set(prev); n.delete(pid); return n; });
      await removeFavourite(user.id, pid);
    } else {
      setFavouriteIds(prev => new Set([...prev, pid]));
      await addFavourite(user.id, player);
    }
  };

   // Pre-load injuries for all leagues in background
  useEffect(() => {
    const LEAGUES_LIST = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Primeira Liga'];
    const map = {};
    Promise.allSettled(
      LEAGUES_LIST.map(lg =>
        fetch(`${API_BASE}/injuries/${encodeURIComponent(lg)}`)
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data)) {
              data.forEach(inj => {
                if (inj.player) {
                  const key = inj.player.toLowerCase().trim();
                  map[key] = {
                    type:   inj.type   || 'Injury',
                    status: inj.reason || 'Injured',
                    news:   inj.news   || '',
                    chance: inj.chanceOfPlaying,
                  };
             // Also index by last name for fuzzy matching
                  const parts = inj.player.split(' ');
                  if (parts.length > 1) {
                    const lastName = parts[parts.length - 1].toLowerCase();
                    if (!map[lastName]) map[lastName] = map[key];
                  }
                }
              });
            }
          })
          .catch(() => {})
      )
    ).then(() => setInjuryMap({ ...map }));
  }, []);

   // Helper: get player status from injury map
  const getPlayerStatus = (player) => {
    if (!player) return null;
    const name     = (player.name || '').toLowerCase().trim();
        // Only use last name fallback if it's longer than 4 chars to avoid false matches
      const lastName = name.split(' ').pop();
      const lastNameMatch = lastName.length > 4 ? injuryMap[lastName] : null;
      return injuryMap[name] || lastNameMatch || null;
  };

  const filtered = players
    .filter(p => {
      const q = search.toLowerCase();
      const inj = getPlayerStatus(p);
      const injType = inj ? (inj.type||'').toLowerCase() : '';
      const injReason = inj ? (inj.status||'').toLowerCase() : '';
      const matchesStatus = statusFilter.length === 0 || statusFilter.some(f => {
        if (f === 'Injured')   return inj && !injType.includes('doubt') && !injType.includes('suspen') && !injReason.includes('suspen');
        if (f === 'Doubtful')  return inj && (injType.includes('doubt') || injReason.includes('doubt') || (inj.chance !== null && inj.chance !== undefined && inj.chance < 75));
        if (f === 'Suspended') return inj && (injType.includes('suspen') || injReason.includes('suspen'));
        return false;
      });
      return (
        (!q || (p.name||'').toLowerCase().includes(q) || (p.team||'').toLowerCase().includes(q) || (p.nationality||'').toLowerCase().includes(q)) &&
        (league   === 'All' || p.league   === league) &&
        (position === 'All' || p.position === position) &&
        (Number(p.minutes) || 0) >= minMins &&
        matchesStatus
      );
    })
    .sort((a, b) => {
      const av = parseFloat(a[sortCol]) || 0, bv = parseFloat(b[sortCol]) || 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  const pages  = Math.ceil(filtered.length / PER);
  const paged  = filtered.slice((page - 1) * PER, page * PER);
  const top3   = filtered.slice(0, 3);

  const sort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(1);
  };

  const toggleCompare = (player) => {
    setCompared(prev => {
      if (prev.find(p => p.id === player.id)) return prev.filter(p => p.id !== player.id);
      if (prev.length >= 2) return [prev[1], player];
      return [...prev, player];
    });
  };

const hasFilters = league !== 'All' || position !== 'All' || minMins > 0 || statusFilter.length > 0;
  /* Loading screen */
  if (loading) return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center" style={{fontFamily:"'Outfit',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
      <div className="text-center space-y-5">
        <div className="w-20 h-20 mx-auto relative">
          <div className="absolute inset-0 rounded-full border-2" style={{borderColor:'rgba(34,211,238,0.2)'}}/>
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:'rgba(34,211,238,0.7)',borderTopColor:'transparent'}}/>
          <div className="absolute inset-2 rounded-full border-2 border-b-transparent animate-spin" style={{borderColor:'rgba(168,85,247,0.5)',borderBottomColor:'transparent',animationDirection:'reverse',animationDuration:'1.5s'}}/>
          <UsersIcon className="w-7 h-7 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
        </div>
        <div>
          <p className="text-2xl font-black text-white">Loading Players</p>
          <p className="text-slate-600 mt-1 text-sm">Fetching all leagues...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050810] text-white" style={{fontFamily:"'Outfit',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[800px] h-[800px] rounded-full blur-[160px]" style={{background:'radial-gradient(circle,rgba(34,211,238,0.05) 0%,transparent 65%)'}}/>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[140px]" style={{background:'radial-gradient(circle,rgba(168,85,247,0.04) 0%,transparent 65%)'}}/>
        <div className="absolute inset-0 opacity-[0.018]" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
      </div>

         <NavBar currentPage="players" onNavigate={onNavigate}/>
 
      <div className="relative max-w-7xl mx-auto px-4 sm:px-5 md:px-8 py-8">
 
              
        {/* ══ PAGE HEADER ══ */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"/>
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-[0.2em]">2025–26 Season</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-2">
                Player<br/>
                <span style={{background:'linear-gradient(90deg,#22d3ee,#a855f7)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                  Intelligence
                </span>
              </h1>
              <p className="text-slate-500 text-base">
                <span className="text-white font-bold">{players.length.toLocaleString()}</span> players across Europe's top leagues
              </p>
            </div>
            {/* Quick stats — hidden on mobile */}
            <div className="hidden md:flex items-center gap-3">
              {[
                { label:'Total', val:players.length.toLocaleString(), color:'#22d3ee', Icon:UsersIcon },
                { label:'Filtered', val:filtered.length.toLocaleString(), color:'#a855f7', Icon:FilterIcon },
                { label:'On Fire 🔥', val:players.filter(p=>(p.goals||0)>=8&&(p.rating||0)>=7.2).length, color:'#ef4444', Icon:FireIcon },
              ].map((s,i)=>(
                <div key={i} className="rounded-2xl p-4 text-center border min-w-[90px]"
                  style={{background:`${s.color}08`,borderColor:`${s.color}15`}}>
                  <p className="text-2xl font-black" style={{color:s.color,fontFamily:'JetBrains Mono'}}>{s.val}</p>
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ ANALYTICS DASHBOARD ══ */}
        {!search && players.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"/>
              <span className="text-purple-400 text-xs font-bold uppercase tracking-[0.2em]">League Analytics</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* League distribution */}
              <div className="md:col-span-2 rounded-2xl border border-white/[0.07] p-5 overflow-hidden"
                style={{background:'rgba(8,12,22,0.9)'}}>
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.18em] mb-4">Player distribution by league</p>
                <div className="space-y-3">
                  {['Premier League','La Liga','Bundesliga','Serie A','Ligue 1','Primeira Liga'].map(lg => {
                    const count = players.filter(p => p.league === lg).length;
                    const pct = players.length ? (count / players.length) * 100 : 0;
                    const color = LEAGUE_COLOR[lg] || '#22d3ee';
                    const goals = players.filter(p => p.league === lg).reduce((s,p) => s + (p.goals||0), 0);
                    return (
                      <div key={lg} className="flex items-center gap-3 group cursor-pointer"
                        onClick={() => { setLeague(lg); setPage(1); }}>
                        <img src={LEAGUE_IMG[lg]} alt="" className="w-5 h-5 object-contain flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"/>
                        <span className="text-xs text-slate-400 w-28 flex-shrink-0 truncate group-hover:text-white transition-colors">{lg.replace(' League','')}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}88)`}}/>
                        </div>
                        <span className="text-xs font-black w-8 text-right flex-shrink-0" style={{color, fontFamily:'JetBrains Mono'}}>{count}</span>
                        <span className="text-[10px] text-slate-600 w-12 text-right flex-shrink-0">{goals}⚽</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Position breakdown */}
              <div className="rounded-2xl border border-white/[0.07] p-5"
                style={{background:'rgba(8,12,22,0.9)'}}>
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.18em] mb-4">Position breakdown</p>
                <div className="space-y-2.5">
                  {[
                    {pos:'Forward',    color:'#ef4444', label:'FWD'},
                    {pos:'Midfielder', color:'#60a5fa', label:'MID'},
                    {pos:'Defender',   color:'#34d399', label:'DEF'},
                    {pos:'Goalkeeper', color:'#fbbf24', label:'GK'},
                  ].map(({pos, color, label}) => {
                    const count = (league === 'All' ? players : players.filter(p=>p.league===league))
                      .filter(p => p.position === pos).length;
                    const total = league === 'All' ? players.length : players.filter(p=>p.league===league).length;
                    const pct = total ? Math.round((count/total)*100) : 0;
                    return (
                      <div key={pos} className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => { setPosition(pos); setPage(1); }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-all group-hover:scale-110"
                          style={{background:`${color}15`, border:`1px solid ${color}30`, color}}>
                          {label}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{pos}</span>
                            <span className="text-xs font-black" style={{color, fontFamily:'JetBrains Mono'}}>{count}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{width:`${pct}%`, background:color}}/>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-600 w-8 text-right" style={{fontFamily:'JetBrains Mono'}}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>

                {/* Quick stat */}
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {label:'Avg Rating', val: (players.reduce((s,p)=>s+(p.rating||0),0)/players.length).toFixed(1), color:'#a855f7'},
                      {label:'Total Goals', val: players.reduce((s,p)=>s+(p.goals||0),0).toLocaleString(), color:'#22d3ee'},
                    ].map((s,i) => (
                      <div key={i} className="rounded-xl p-3 text-center border border-white/[0.06]"
                        style={{background:`${s.color}08`}}>
                        <p className="text-base font-black" style={{color:s.color, fontFamily:'JetBrains Mono'}}>{s.val}</p>
                        <p className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* xG Leaders strip */}
            <div className="mt-4 rounded-2xl border border-white/[0.07] p-5"
              style={{background:'rgba(8,12,22,0.9)'}}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.18em]">Top xG performers</p>
                <span className="text-[10px] text-slate-600">Goals vs expected goals</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[...players]
                  .filter(p => (p.xG||0) > 0 && (p.goals||0) > 0)
                  .sort((a,b) => ((b.goals||0)-(b.xG||0)) - ((a.goals||0)-(a.xG||0)))
                  .slice(0,5)
                  .map((p, i) => {
                    const diff = ((p.goals||0) - (p.xG||0)).toFixed(1);
                    const isOver = diff > 0;
                    const posC = POS_CONFIG[p.position] || POS_CONFIG.Midfielder;
                    return (
                      <div key={i} onClick={() => setSelected(p)}
                        className="rounded-xl p-3 border border-white/[0.06] cursor-pointer transition-all hover:border-white/20 hover:-translate-y-0.5"
                        style={{background:'rgba(255,255,255,0.02)'}}>
                        <div className="flex items-center gap-2 mb-2">
                          {p.photo
                            ? <img src={p.photo} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0"/>
                            : <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
                                style={{background:posC.bg, color:posC.color}}>{(p.name||'?')[0]}</div>
                          }
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white truncate">{p.name?.split(' ').pop()}</p>
                            <p className="text-[9px] text-slate-600 truncate">{(p.team||'').replace(/ (FC|AFC|CF)$/,'')}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-black text-white" style={{fontFamily:'JetBrains Mono'}}>{p.goals||0}</p>
                            <p className="text-[9px] text-slate-600">Goals</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-black" style={{color: isOver ? '#10b981' : '#ef4444', fontFamily:'JetBrains Mono'}}>
                              {isOver ? '+' : ''}{diff}
                            </p>
                            <p className="text-[9px] text-slate-600">vs xG</p>
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-400" style={{fontFamily:'JetBrains Mono'}}>{(p.xG||0).toFixed(1)}</p>
                            <p className="text-[9px] text-slate-600">xG</p>
                          </div>
                        </div>
                        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min(100, ((p.goals||0)/30)*100)}%`,
                            background: isOver ? '#10b981' : '#ef4444'
                          }}/>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ══ SPOTLIGHT TOP 3 ══ */}
        {page === 1 && !search && filtered.length >= 3 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <StarIcon className="w-4 h-4 text-yellow-400"/>
              <span className="text-white font-black text-sm uppercase tracking-widest">
                Top 3 — {SORT_OPTS.find(s=>s.col===sortCol)?.label}
              </span>
              {league !== 'All' && (
                <div className="flex items-center gap-1.5 ml-2">
                  {LEAGUE_IMG[league] && <img src={LEAGUE_IMG[league]} alt="" className="w-4 h-4 object-contain"/>}
                  <span className="text-[12px] text-slate-400">{league}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {top3.map((p, i) => (
                <SpotlightCard key={p.id||i} player={p} rank={i+1} sortCol={sortCol} onClick={setSelected} isFav={favouriteIds.has(String(p.id||p.player_id||p.name))} onFav={toggleFavourite}/>
              ))}
            </div>
          </div>
        )}

        {/* ══ SEARCH + CONTROLS ══ */}
        <div className="space-y-3 mb-4">
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"/>
              <input
                ref={searchRef}
                type="text" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search player, team, nationality..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm text-white placeholder-slate-600 border focus:outline-none transition-all"
                style={{
                  background:'rgba(255,255,255,0.05)',
                  borderColor: search ? 'rgba(34,211,238,0.35)' : 'rgba(255,255,255,0.08)',
                  fontSize:14,
                }}/>
              {search && (
                <button onClick={() => { setSearch(''); setPage(1); searchRef.current?.focus(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  <XIcon className="w-4 h-4"/>
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button onClick={() => setShowFilters(v=>!v)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-bold transition-all flex-shrink-0"
              style={{
                background: showFilters ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.04)',
                borderColor: showFilters ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)',
                color: showFilters ? '#22d3ee' : '#64748b',
              }}>
              <FilterIcon className="w-4 h-4"/>
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && <span className="w-2 h-2 rounded-full bg-cyan-400"/>}
            </button>

            {/* View mode toggle */}
            <div className="hidden sm:flex rounded-2xl border border-white/[0.08] overflow-hidden flex-shrink-0" style={{background:'rgba(255,255,255,0.04)'}}>
              {[{id:'table',Icon:ListIcon},{id:'grid',Icon:GridIcon}].map(v=>(
                <button key={v.id} onClick={() => setViewMode(v.id)}
                  className="px-4 py-3 transition-all"
                  style={{background:viewMode===v.id?'rgba(34,211,238,0.15)':'transparent',color:viewMode===v.id?'#22d3ee':'#64748b'}}>
                  <v.Icon className="w-4 h-4"/>
                </button>
              ))}
            </div>

            {/* Compare button */}
            <button
              onClick={() => { setCompareMode(v=>!v); if(compareMode) setCompared([]); }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-bold transition-all flex-shrink-0"
              style={{
                background: compareMode ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.04)',
                borderColor: compareMode ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.08)',
                color: compareMode ? '#a855f7' : '#64748b',
              }}>
              <ScalesIcon className="w-4 h-4"/>
              <span className="hidden sm:inline">Compare</span>
              {compareMode && compared.length > 0 && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{background:'#a855f7'}}>{compared.length}</span>
              )}
            </button>
          </div>

          {/* Compare action bar */}
          {compareMode && compared.length === 2 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-purple-500/25 flex-wrap"
              style={{background:'rgba(168,85,247,0.08)',animation:'slideDown 0.2s ease-out'}}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {compared.map((p,i)=>(
                  <div key={i} className="flex items-center gap-2">
                    {i>0&&<span className="text-slate-600 font-bold">vs</span>}
                    {p.photo&&<img src={p.photo} alt="" className="w-7 h-7 rounded-lg object-cover"/>}
                    <span className="text-sm font-bold text-white truncate">{p.name}</span>
                    <button onClick={()=>toggleCompare(p)} className="text-slate-500 hover:text-white transition-colors"><XIcon className="w-3.5 h-3.5"/></button>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowCompare(true)}
                className="px-5 py-2 rounded-xl font-black text-sm text-white flex-shrink-0"
                style={{background:'linear-gradient(135deg,#a855f7,#7c3aed)'}}>
                Compare Now →
              </button>
            </div>
          )}
          {compareMode && compared.length < 2 && (
            <p className="text-sm text-purple-400 px-1" style={{animation:'slideDown 0.2s ease-out'}}>
              Select {2-compared.length} more player{2-compared.length!==1?'s':''} to compare
            </p>
          )}
        </div>

        {/* ══ FILTER PANEL ══ */}
        {showFilters && (
          <div className="rounded-2xl border border-white/[0.08] p-5 mb-4 space-y-5"
            style={{background:'rgba(10,14,26,0.9)',animation:'slideDown 0.2s ease-out'}}>

            {/* League */}
            <div>
              <p className="text-[11px] text-slate-600 uppercase tracking-[0.15em] font-bold mb-3 flex items-center gap-2">
                <ShieldIcon className="w-3 h-3"/> League
              </p>
              <div className="flex flex-wrap gap-2">
                {LEAGUES.map(l => {
                  const isActive = league === l;
                  const c = LEAGUE_COLOR[l] || '#22d3ee';
                  return (
                    <button key={l} onClick={() => { setLeague(l); setPage(1); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all border"
                      style={{
                        background: isActive ? `${c}15` : 'rgba(255,255,255,0.03)',
                        borderColor: isActive ? `${c}35` : 'rgba(255,255,255,0.07)',
                        color: isActive ? 'white' : '#64748b',
                      }}>
                      {l !== 'All' && LEAGUE_IMG[l] && <img src={LEAGUE_IMG[l]} alt="" className="w-5 h-5 object-contain rounded flex-shrink-0" style={{opacity:isActive?1:0.5}}/>}
                      {l === 'All' ? 'All Leagues' : l.replace(' League','').replace('Primera Liga','PL')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Position */}
            <div>
              <p className="text-[11px] text-slate-600 uppercase tracking-[0.15em] font-bold mb-3 flex items-center gap-2">
                <TargetIcon className="w-3 h-3"/> Position
              </p>
              <div className="flex flex-wrap gap-2">
                {POSITIONS.map(pos => {
                  const c = POS_CONFIG[pos];
                  const isActive = position === pos;
                  return (
                    <button key={pos} onClick={() => { setPosition(pos); setPage(1); }}
                      className="px-4 py-2 rounded-xl text-sm font-bold transition-all border"
                      style={{
                        background: isActive ? (c?.bg || 'rgba(34,211,238,0.1)') : 'rgba(255,255,255,0.03)',
                        borderColor: isActive ? (c?.border || 'rgba(34,211,238,0.3)') : 'rgba(255,255,255,0.07)',
                        color: isActive ? (c?.color || '#22d3ee') : '#64748b',
                      }}>
                      {pos === 'All' ? 'All Positions' : pos}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Min Minutes */}
            <div>
              <p className="text-[11px] text-slate-600 uppercase tracking-[0.15em] font-bold mb-3 flex items-center gap-2">
                <CalendarIcon className="w-3 h-3"/> Min. Minutes Played
              </p>
              <div className="flex items-center gap-4">
                <input type="range" min={0} max={2000} step={90} value={minMins}
                  onChange={e => { setMinMins(Number(e.target.value)); setPage(1); }}
                  className="flex-1 accent-cyan-400"/>
                <span className="text-sm font-black text-cyan-400 w-16 text-right" style={{fontFamily:'JetBrains Mono'}}>
                  {minMins > 0 ? `${minMins}+` : 'Any'}
                </span>
              </div>
            </div>

            {hasFilters && (
              <button onClick={() => { setLeague('All'); setPosition('All'); setMinMins(0); setStatusFilter([]); setPage(1); }}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-white transition-all">
                <XIcon className="w-3 h-3"/> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* ══ SORT CHIPS ══ */}
       <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <span className="text-[11px] text-slate-600 font-bold uppercase tracking-widest flex-shrink-0">Sort:</span>
          {SORT_OPTS.map(s => (
            <button key={s.col} onClick={() => sort(s.col)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex-shrink-0"
              style={{
                background: sortCol===s.col ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                borderColor: sortCol===s.col ? `${s.color}30` : 'rgba(255,255,255,0.07)',
                color: sortCol===s.col ? s.color : '#64748b',
              }}>
              <s.Icon className="w-3 h-3"/>
              {s.label}
              {sortCol===s.col && (sortDir==='desc' ? <ArrowDnIcon className="w-3 h-3"/> : <ArrowUpIcon className="w-3 h-3"/>)}
            </button>
          ))}
        </div>

          {/* ══ STATUS FILTER CHIPS ══ */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <span className="text-[11px] text-slate-600 font-bold uppercase tracking-widest flex-shrink-0">Status:</span>
          {[
            { key: 'Injured',   color: '#ef4444', icon: '⬤' },
            { key: 'Doubtful',  color: '#f59e0b', icon: '⬤' },
            { key: 'Suspended', color: '#a855f7', icon: '⬤' },
          ].map(s => {
            const active = statusFilter.includes(s.key);
            return (
              <button key={s.key}
                onClick={() => {
                  setStatusFilter(prev =>
                    prev.includes(s.key) ? prev.filter(f => f !== s.key) : [...prev, s.key]
                  );
                  setPage(1);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex-shrink-0"
                style={{
                  background:  active ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                  borderColor: active ? `${s.color}30` : 'rgba(255,255,255,0.07)',
                  color:       active ? s.color : '#64748b',
                }}>
                <svg className="w-2 h-2" viewBox="0 0 8 8" fill={active ? s.color : '#64748b'}>
                  <circle cx="4" cy="4" r="4"/>
                </svg>
                {s.key}
                {active && (
                  <span className="ml-1 text-[10px] opacity-60">✕</span>
                )}
              </button>
            );
          })}
          {statusFilter.length > 0 && (
            <button onClick={() => { setStatusFilter([]); setPage(1); }}
              className="text-[11px] text-slate-600 hover:text-white transition-colors flex-shrink-0">
              Clear
            </button>
          )}
        </div>

        {/* Count row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-500 text-sm">
            <span className="text-white font-bold">{filtered.length.toLocaleString()}</span> players
            {league!=='All' && <span> · <span style={{color:LEAGUE_COLOR[league]||'#22d3ee'}} className="font-semibold">{league}</span></span>}
            {position!=='All' && <span> · <span className="font-semibold" style={{color:POS_CONFIG[position]?.color||'white'}}>{position}</span></span>}
            {minMins > 0 && <span> · <span className="text-cyan-400 font-semibold">{minMins}+ mins</span></span>}
          </p>
          {pages>1 && <p className="text-slate-600 text-sm">Page {page}/{pages}</p>}
        </div>

        {/* ══ TABLE VIEW ══ */}
        {viewMode === 'table' && (
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{background:'rgba(8,12,22,0.9)'}}>
            {/* Header */}
            <div className="hidden md:grid items-center px-5 py-4 border-b border-white/[0.06]"
              style={{gridTemplateColumns:'48px 1fr 160px 80px 68px 68px 68px 68px 72px 80px',background:'rgba(255,255,255,0.02)'}}>
              <div className="text-[11px] font-bold text-slate-600 text-center">#</div>
              <button onClick={()=>sort('name')} className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-white transition-colors">
                Player {sortCol==='name'&&(sortDir==='desc'?<ArrowDnIcon className="w-3 h-3"/>:<ArrowUpIcon className="w-3 h-3"/>)}
              </button>
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Team</div>
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider text-center">Pos</div>
              {[
                {col:'goals',label:'G'},{col:'assists',label:'A'},
                {col:'xG',label:'xG'},{col:'appearances',label:'Apps'},{col:'tacklesTotal',label:'Tkl'}
              ].map(h=>(
                <button key={h.col} onClick={()=>sort(h.col)}
                  className={`flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-white ${sortCol===h.col?'text-cyan-400':'text-slate-600'}`}>
                  {h.label}{sortCol===h.col&&(sortDir==='desc'?<ArrowDnIcon className="w-3 h-3"/>:<ArrowUpIcon className="w-3 h-3"/>)}
                </button>
              ))}
              <button onClick={()=>sort('rating')} className={`flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-white ${sortCol==='rating'?'text-cyan-400':'text-slate-600'}`}>
                Rating{sortCol==='rating'&&(sortDir==='desc'?<ArrowDnIcon className="w-3 h-3"/>:<ArrowUpIcon className="w-3 h-3"/>)}
              </button>
            </div>

            {paged.length === 0 ? (
              <div className="py-20 text-center">
                <UsersIcon className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
                <p className="text-slate-600">No players found matching your filters</p>
              </div>
            ) : paged.map((p, i) => {
              const rank    = (page-1)*PER+i+1;
              const isTop3  = rank <= 3 && page === 1 && !search;
              const medals  = ['#f59e0b','#94a3b8','#cd7c3e'];
              const isHot   = (p.goals||0) >= 8 && (p.rating||0) >= 7.2;
              const xgDiff  = (p.goals||0) - (p.xG||0);
              const isComp  = compared.find(cp => cp.id === p.id);

              return (
                <div key={p.id||i}
                  onClick={() => compareMode ? toggleCompare(p) : setSelected(p)}
                  className="group transition-all cursor-pointer border-b border-white/[0.04] last:border-0"
                  style={{background: isComp ? 'rgba(168,85,247,0.06)' : isTop3 ? 'rgba(255,255,255,0.015)' : 'transparent'}}>

                  {/* Desktop row */}
                  <div className="hidden md:grid items-center px-5 py-3"
                    style={{gridTemplateColumns:'48px 1fr 160px 80px 68px 68px 68px 68px 72px 80px 40px'}}
                    onMouseEnter={e=>e.currentTarget.closest('.group').style.background='rgba(255,255,255,0.025)'}
                    onMouseLeave={e=>e.currentTarget.closest('.group').style.background=isComp?'rgba(168,85,247,0.06)':isTop3?'rgba(255,255,255,0.015)':'transparent'}>

                    <div className="flex justify-center">
                      {compareMode
                        ? <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:isComp?'#a855f7':'rgba(255,255,255,0.06)',border:`1px solid ${isComp?'#a855f7':'rgba(255,255,255,0.1)'}`}}>
                            {isComp && <CheckIcon className="w-3.5 h-3.5 text-white"/>}
                          </div>
                        : isTop3
                          ? <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] text-white shadow" style={{background:`linear-gradient(135deg,${medals[rank-1]},${medals[rank-1]}aa)`}}>{rank}</div>
                          : <span className="text-sm text-slate-700 font-bold" style={{fontFamily:'JetBrains Mono'}}>{rank}</span>}
                    </div>

                    {/* Player identity */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        {p.photo
                          ? <img src={p.photo} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/[0.08] group-hover:border-white/20 transition-all"/>
                          : <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.06]"
                              style={{background:(POS_CONFIG[p.position]||{}).bg||'rgba(148,163,184,0.1)'}}>
                              <span className="text-sm font-black" style={{color:(POS_CONFIG[p.position]||{}).color||'#94a3b8'}}>{(p.name||'?')[0]}</span>
                            </div>}
                        {p.league && LEAGUE_IMG[p.league] && (
                          <img src={LEAGUE_IMG[p.league]} alt="" className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 object-contain rounded-full bg-[#080c16] border border-[#080c16]"/>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold truncate group-hover:text-cyan-300 transition-colors">{p.name}</p>
                          {isHot && <span className="text-[10px]">🔥</span>}
                          {Math.abs(xgDiff) > 2 && <span className="text-[10px]">{xgDiff>0?'⬆️':'⬇️'}</span>}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 truncate">{p.nationality}{p.age?` · ${p.age}y`:''}</p>
                      </div>
                    </div>

                    {/* Team */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      {p.teamLogo && <img src={p.teamLogo} alt="" className="w-4 h-4 object-contain flex-shrink-0"/>}
                      <span className="text-[12px] text-slate-400 truncate">{(p.team||'').replace(/ (FC|AFC|CF)$/, '')}</span>
                    </div>

                    <div className="flex justify-center"><PosBadge pos={p.position}/></div>
                    <div className="text-center"><span className="text-sm font-black text-cyan-400" style={{fontFamily:'JetBrains Mono'}}>{p.goals||0}</span></div>
                    <div className="text-center"><span className="text-sm font-black text-yellow-400" style={{fontFamily:'JetBrains Mono'}}>{p.assists||0}</span></div>
                    <div className="text-center"><span className="text-sm text-emerald-400" style={{fontFamily:'JetBrains Mono'}}>{(parseFloat(p.xG)||0).toFixed(1)}</span></div>
                    <div className="text-center"><span className="text-sm text-slate-400" style={{fontFamily:'JetBrains Mono'}}>{p.appearances||0}</span></div>
                    <div className="text-center"><span className="text-sm text-green-400" style={{fontFamily:'JetBrains Mono'}}>{p.tacklesTotal||0}</span></div>
                    <div className="flex justify-center"><RatingBadge r={p.rating} size="sm"/></div>
                    <div className="flex justify-center">
                      <button onClick={e => { e.stopPropagation(); toggleFavourite(e, p); }}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                        style={{
                          background: favouriteIds.has(String(p.id||p.player_id||p.name)) ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                          border: favouriteIds.has(String(p.id||p.player_id||p.name)) ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.1)',
                        }}>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"
                          fill={favouriteIds.has(String(p.id||p.player_id||p.name)) ? '#ef4444' : 'none'}
                          stroke={favouriteIds.has(String(p.id||p.player_id||p.name)) ? '#ef4444' : '#64748b'}
                          strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Mobile row */}
                  <div className="md:hidden flex items-center gap-3 px-4 py-3">
                    <div className="flex-shrink-0">
                      {isTop3
                        ? <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] text-white" style={{background:`linear-gradient(135deg,${medals[rank-1]},${medals[rank-1]}aa)`}}>{rank}</div>
                        : <span className="text-xs text-slate-700 font-bold w-7 text-center block" style={{fontFamily:'JetBrains Mono'}}>{rank}</span>}
                    </div>
                    <div className="relative flex-shrink-0">
                      {p.photo
                        ? <img src={p.photo} alt="" className="w-11 h-11 rounded-xl object-cover border border-white/[0.08]"/>
                        : <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{background:(POS_CONFIG[p.position]||{}).bg||'rgba(148,163,184,0.1)'}}>
                            <span className="text-base font-black" style={{color:(POS_CONFIG[p.position]||{}).color||'#94a3b8'}}>{(p.name||'?')[0]}</span>
                          </div>}
                      {p.league && LEAGUE_IMG[p.league] && (
                        <img src={LEAGUE_IMG[p.league]} alt="" className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 object-contain rounded-full bg-[#080c16] border border-[#080c16]"/>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold truncate">{p.name}</p>
                        {isHot && <span className="text-[11px]">🔥</span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.teamLogo && <img src={p.teamLogo} alt="" className="w-3.5 h-3.5 object-contain flex-shrink-0"/>}
                        <span className="text-[11px] text-slate-500 truncate">{(p.team||'').replace(/ FC$/,'')}</span>
                        <PosBadge pos={p.position}/>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-base font-black text-cyan-400" style={{fontFamily:'JetBrains Mono'}}>{p.goals||0}</p>
                        <p className="text-[9px] text-slate-700">G</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-black text-yellow-400" style={{fontFamily:'JetBrains Mono'}}>{p.assists||0}</p>
                        <p className="text-[9px] text-slate-700">A</p>
                      </div>
                      <RatingBadge r={p.rating} size="sm"/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ GRID VIEW ══ */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {paged.length === 0
              ? <div className="col-span-full py-20 text-center"><p className="text-slate-600">No players found</p></div>
              : paged.map((p, i) => (
                  <PlayerCard
                    key={p.id||i}
                    player={p}
                    rank={(page-1)*PER+i+1}
                    sortCol={sortCol}
                    onSelect={setSelected}
                    compareMode={compareMode}
                    isCompared={!!compared.find(cp => cp.id === p.id)}
                    onCompare={toggleCompare}
                    isFav={favouriteIds.has(String(p.id||p.player_id||p.name))}
                    onFav={toggleFavourite}
                  />
                ))}
          </div>
        )}

        {/* ══ PAGINATION ══ */}
        {pages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/[0.05]">
            <p className="text-slate-500 text-sm">
              Showing <span className="text-white font-bold">{(page-1)*PER+1}–{Math.min(page*PER,filtered.length)}</span> of <span className="text-white font-bold">{filtered.length.toLocaleString()}</span>
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                className="px-4 py-2 rounded-xl text-sm font-bold border transition-all disabled:opacity-30"
                style={{background:'rgba(255,255,255,0.04)',borderColor:'rgba(255,255,255,0.08)',color:'#64748b'}}>
                ← Prev
              </button>
              {Array.from({length:Math.min(5,pages)}, (_,i) => {
                let n;
                if (pages<=5) n=i+1;
                else if (page<=3) n=i+1;
                else if (page>=pages-2) n=pages-4+i;
                else n=page-2+i;
                return (
                  <button key={n} onClick={() => setPage(n)}
                    className="w-9 h-9 rounded-xl text-sm font-bold transition-all border"
                    style={{
                      background: page===n ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.03)',
                      borderColor: page===n ? 'rgba(34,211,238,0.35)' : 'rgba(255,255,255,0.07)',
                      color: page===n ? '#22d3ee' : '#64748b',
                    }}>
                    {n}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages}
                className="px-4 py-2 rounded-xl text-sm font-bold border transition-all disabled:opacity-30"
                style={{background:'rgba(255,255,255,0.04)',borderColor:'rgba(255,255,255,0.08)',color:'#64748b'}}>
                Next →
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ══ PLAYER PROFILE MODAL ══ */}

   {selected && <PlayerProfileCard player={selected} onClose={() => setSelected(null)} injuryStatus={getPlayerStatus(selected)}/>}
      {/* ══ COMPARISON MODAL ══ */}
      {showCompare && compared.length===2 && (
        <CompareModal players={compared} onClose={() => setShowCompare(false)}/>
      )}

      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn   { from{opacity:0;transform:scale(0.95) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>
    </div>
  );
}