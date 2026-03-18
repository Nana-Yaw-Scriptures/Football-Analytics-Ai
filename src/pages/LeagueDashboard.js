import React, { useState, useEffect, useMemo } from 'react';
import PlayerProfileCard from '../components/PlayerProfileCard';
import NavBar from '../components/NavBar';
import ExportButton from '../components/ExportButton';
import { exportLeagueStandings } from '../utils/exportPDF';
import MatchAccordion from '../components/MatchAccordion';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/* ═══════════════════════════════════════
   ICONS
═══════════════════════════════════════ */
const I = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const TrophyIcon   = p => <I {...p} d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></>}/>;
const TargetIcon   = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const CalendarIcon = p => <I {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
const ClockIcon    = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const AwardIcon    = p => <I {...p} d={<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>}/>;
const UsersIcon    = p => <I {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const StarIcon     = p => <I {...p} d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>;
const ShieldIcon   = p => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const ZapIcon      = p => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const ActivityIcon = p => <I {...p} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>;
const ChevRightIcon= p => <I {...p} d={<polyline points="9 18 15 12 9 6"/>}/>;
const ChevDownIcon = p => <I {...p} d={<polyline points="6 9 12 15 18 9"/>}/>;

/* ═══════════════════════════════════════
   SHORT NAME MAP — most commonly
   long/confusing team names
═══════════════════════════════════════ */
const SHORT_NAMES = {
  // Premier League
  'Manchester City':           'Man City',
  'Manchester United':         'Man Utd',
  'Nottingham Forest':         'Nott\'m Forest',
  'Newcastle United':          'Newcastle',
  'Wolverhampton Wanderers':   'Wolves',
  'Tottenham Hotspur':         'Spurs',
  'West Ham United':           'West Ham',
  'Brighton & Hove Albion':    'Brighton',
  'Leicester City':            'Leicester',
  'Sheffield United':          'Sheffield Utd',
  'Luton Town':                'Luton',
  // La Liga
  'Real Madrid':               'Real Madrid',
  'Atletico Madrid':           'Atlético',
  'Athletic Club':             'Athletic',
  'Real Sociedad':             'Sociedad',
  'Real Betis':                'Betis',
  'Rayo Vallecano':            'Rayo',
  'Deportivo Alaves':          'Alavés',
  'UD Las Palmas':             'Las Palmas',
  'CD Leganes':                'Leganés',
  // Bundesliga
  'Bayer 04 Leverkusen':       'Leverkusen',
  'Borussia Dortmund':         'Dortmund',
  'Borussia Monchengladbach':  "M'gladbach",
  'RB Leipzig':                'Leipzig',
  'Eintracht Frankfurt':       'Frankfurt',
  'SC Freiburg':               'Freiburg',
  'TSG Hoffenheim':            'Hoffenheim',
  'VfB Stuttgart':             'Stuttgart',
  'VfL Wolfsburg':             'Wolfsburg',
  'FC Augsburg':               'Augsburg',
  'SV Werder Bremen':          'Bremen',
  'FC Heidenheim 1846':        'Heidenheim',
  '1. FC Union Berlin':        'Union Berlin',
  '1. FC Koln':                'Köln',
  'FC St. Pauli':              'St. Pauli',
  // Serie A
  'Internazionale':            'Inter',
  'AC Milan':                  'Milan',
  'AS Roma':                   'Roma',
  'SS Lazio':                  'Lazio',
  'SSC Napoli':                'Napoli',
  'Hellas Verona':             'Verona',
  'Udinese Calcio':            'Udinese',
  'Cagliari Calcio':           'Cagliari',
  'Empoli FC':                 'Empoli',
  // Ligue 1
  'Paris Saint-Germain':       'PSG',
  'Olympique de Marseille':    'Marseille',
  'Olympique Lyonnais':        'Lyon',
  'AS Saint-Etienne':          'St-Étienne',
  'Stade de Reims':            'Reims',
  'RC Lens':                   'Lens',
  'Stade Brestois 29':         'Brest',
  'Le Havre AC':               'Le Havre',
  'Montpellier HSC':           'Montpellier',
  'OGC Nice':                  'Nice',
  // Primeira Liga
  'Sporting CP':               'Sporting',
  'FC Porto':                  'Porto',
  'SL Benfica':                'Benfica',
  'SC Braga':                  'Braga',
  'Vitoria SC':                'Vitória',
  'Rio Ave FC':                'Rio Ave',
  'Gil Vicente FC':            'Gil Vicente',
  'CD Santa Clara':            'Santa Clara',
  'GD Estoril Praia':          'Estoril',
};

const shortName = (name = '') => {
  if (!name) return '';
  // Check exact match first
  if (SHORT_NAMES[name]) return SHORT_NAMES[name];
  // Strip common suffixes
  const stripped = name.replace(/ (FC|AFC|CF|SC|AC|SS|AS|CD|UD|RC|GD|SL|SV|VfB|VfL|TSG|RB)$/, '').trim();
  if (SHORT_NAMES[stripped]) return SHORT_NAMES[stripped];
  // Fall back: truncate at 13 chars
  return stripped.length > 13 ? stripped.slice(0, 12) + '…' : stripped;
};

/* ═══════════════════════════════════════
   LEAGUE CONSTANTS
═══════════════════════════════════════ */
const LEAGUE_IMG = {
  'Premier League':  'https://media.api-sports.io/football/leagues/39.png',
  'La Liga':         'https://media.api-sports.io/football/leagues/140.png',
  'Bundesliga':      'https://media.api-sports.io/football/leagues/78.png',
  'Serie A':         'https://media.api-sports.io/football/leagues/135.png',
  'Ligue 1':         'https://media.api-sports.io/football/leagues/61.png',
  'Primeira Liga':   'https://media.api-sports.io/football/leagues/94.png',
  'Champions League':'https://media.api-sports.io/football/leagues/2.png',
};
const LEAGUE_COLOR = {
  'Premier League':  '#7c3aed',
  'La Liga':         '#dc2626',
  'Bundesliga':      '#d97706',
  'Serie A':         '#059669',
  'Ligue 1':         '#2563eb',
  'Primeira Liga':   '#10b981',
  'Champions League':'#f59e0b',
};
const LEAGUE_INFO = {
  'Premier League':  { country: 'England',  teams: 20 },
  'La Liga':         { country: 'Spain',    teams: 20 },
  'Bundesliga':      { country: 'Germany',  teams: 18 },
  'Serie A':         { country: 'Italy',    teams: 20 },
  'Ligue 1':         { country: 'France',   teams: 18 },
  'Primeira Liga':   { country: 'Portugal', teams: 18 },
  'Champions League':{ country: 'Europe',   teams: 32 },
};
const POS_COLORS = {
  Attacker:   { text: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'   },
  Forward:    { text: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'   },
  Midfielder: { text: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)'  },
  Defender:   { text: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)'  },
  Goalkeeper: { text: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)'  },
};

/* ═══════════════════════════════════════
   FORM GUIDE — last 5 results as dots
═══════════════════════════════════════ */
const FormGuide = ({ form = '' }) => {
  const results = form.slice(-5).split('');
  if (!results.length) return <span className="text-slate-700 text-[10px]">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {results.map((r, i) => {
        const color = r === 'W' ? '#10b981' : r === 'D' ? '#f59e0b' : '#ef4444';
        return (
          <div key={i} className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
            <span className="text-[8px] font-black" style={{ color }}>{r}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════
   MINI RADAR for scorers list
═══════════════════════════════════════ */
const MiniRadar = ({ player, color = '#22d3ee', size = 42 }) => {
  const pos = (player.position || '').toLowerCase();
  const dims = pos.includes('goalkeeper') ? [
    { key: 'rating', scale: 10 }, { key: 'saves', scale: 120 },
    { key: 'passAccuracy', scale: 95 }, { key: 'aerialWon', scale: 60 },
    { key: 'appearances', scale: 38 }, { key: 'penaltiesSaved', scale: 5 },
  ] : pos.includes('defender') ? [
    { key: 'rating', scale: 10 }, { key: 'tacklesTotal', scale: 100 },
    { key: 'interceptions', scale: 60 }, { key: 'aerialWon', scale: 120 },
    { key: 'duelWinPct', scale: 70 }, { key: 'passAccuracy', scale: 95 },
  ] : pos.includes('midfielder') ? [
    { key: 'rating', scale: 10 }, { key: 'keyPasses', scale: 80 },
    { key: 'assists', scale: 15 }, { key: 'goals', scale: 15 },
    { key: 'passAccuracy', scale: 95 }, { key: 'tacklesTotal', scale: 80 },
  ] : [
    { key: 'rating', scale: 10 }, { key: 'goals', scale: 30 },
    { key: 'xG', scale: 25 }, { key: 'assists', scale: 15 },
    { key: 'shotAccuracy', scale: 40 }, { key: 'dribbleSuccessPct', scale: 80 },
  ];
  const n = dims.length, r = size * 0.35, cx = size / 2, cy = size / 2;
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + Math.cos(a) * r * Math.min(v, 1), y: cy + Math.sin(a) * r * Math.min(v, 1) };
  };
  const vals = dims.map(d => Math.min((parseFloat(player[d.key]) || 0) / d.scale, 1));
  const path = vals.map((v, i) => { const p = pt(i, v); return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ') + 'Z';
  const grid = f => dims.map((_, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return `${(cx + Math.cos(a) * r * f).toFixed(1)},${(cy + Math.sin(a) * r * f).toFixed(1)}`; }).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.33, 0.66, 1].map((f, i) => <polygon key={i} points={grid(f)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6"/>)}
      <path d={path} fill={`${color}20`} stroke={color} strokeWidth="1.2"/>
      {vals.map((v, i) => { const p = pt(i, v); return <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color}/>; })}
    </svg>
  );
};

/* ═══════════════════════════════════════
   SPOTLIGHT CARD — top stat leaders
═══════════════════════════════════════ */
const SpotlightCard = ({ player, statKey, statLabel, accentColor, onSelect }) => {
  if (!player) return null;
  const posC = POS_COLORS[player.position] || POS_COLORS.Midfielder;
  const val  = player[statKey] || 0;
  return (
    <div onClick={() => onSelect(player)} className="rounded-2xl overflow-hidden cursor-pointer group transition-all hover:scale-[1.02]"
      style={{ background: 'rgba(8,12,22,0.9)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: `0 0 30px ${accentColor}15` }}>
      <div className="h-0.5" style={{ background: `linear-gradient(90deg,transparent,${accentColor},transparent)` }}/>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-shrink-0">
            {player.photo
              ? <img src={player.photo} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10"
                  style={{ boxShadow: `0 0 15px ${accentColor}25` }}/>
              : <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: posC.bg, border: `1px solid ${posC.border}` }}>
                  <span className="text-xl font-black" style={{ color: posC.text }}>{(player.name || '?')[0]}</span>
                </div>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate group-hover:text-cyan-300 transition-colors">{player.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {player.teamLogo && <img src={player.teamLogo} alt="" className="w-3.5 h-3.5 object-contain flex-shrink-0"/>}
              <span className="text-[11px] text-slate-500 truncate">{shortName(player.team)}</span>
            </div>
          </div>
          <MiniRadar player={player} color={posC.text} size={44}/>
        </div>
        <div className="flex items-end justify-between pt-3 border-t border-white/[0.05]">
          <div>
            <p className="text-3xl font-black" style={{ fontFamily: 'JetBrains Mono', color: accentColor }}>
              {typeof val === 'number' ? (statKey === 'rating' ? val.toFixed(1) : val) : val}
            </p>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">{statLabel}</p>
          </div>
          <div className="text-right">
            {player.rating > 0 && (
              <div className="w-11 h-7 rounded-xl flex items-center justify-center font-black text-white text-xs"
                style={{ fontFamily: 'JetBrains Mono', background: player.rating >= 7.5 ? 'linear-gradient(135deg,#10b981,#059669)' : player.rating >= 7 ? 'linear-gradient(135deg,#22d3ee,#0891b2)' : 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                {player.rating.toFixed(1)}
              </div>
            )}
            <p className="text-[10px] text-slate-600 mt-1">{player.appearances || 0} apps</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
function LeagueDashboard({ league, onNavigate }) {
  const [activeTab,      setActiveTab]      = useState('table');
  const [players,        setPlayers]        = useState([]);
  const [standings,      setStandings]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [fixtures,       setFixtures]       = useState([]);
  const [fixturesLoading,setFixturesLoading]= useState(false);
  const [fixturesView,   setFixturesView]   = useState('upcoming');
  const [predictions,    setPredictions]    = useState({});  // fixtureId → result
  const [loadingPred,    setLoadingPred]    = useState({});

  const leagueColor = LEAGUE_COLOR[league] || '#22d3ee';
  const info        = LEAGUE_INFO[league]  || { country: 'Europe', teams: 20 };

  /* ── fetch standings + players ── */
  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetch(`${API_BASE}/players/search?q=&league=${encodeURIComponent(league)}&limit=9999`).then(r => r.json()),
      fetch(`${API_BASE}/standings/${encodeURIComponent(league)}`).then(r => r.json()),
    ]).then(([pR, sR]) => {
      if (pR.status === 'fulfilled') setPlayers(Array.isArray(pR.value) ? pR.value : []);
      if (sR.status === 'fulfilled') setStandings(Array.isArray(sR.value) ? sR.value : []);
      setLoading(false);
    });
  }, [league]);

  /* ── fetch fixtures when tab opens ── */
  useEffect(() => {
    if (activeTab !== 'fixtures') return;
    setFixturesLoading(true);
    Promise.allSettled([
      fetch(`${API_BASE}/league/results?league=${encodeURIComponent(league)}`).then(r => r.json()),
      fetch(`${API_BASE}/live/upcoming?league=${encodeURIComponent(league)}`).then(r => r.json()),
    ]).then(([rR, uR]) => {
      const results  = rR.status === 'fulfilled' && Array.isArray(rR.value)  ? rR.value  : [];
      const upcoming = uR.status === 'fulfilled' && Array.isArray(uR.value)  ? uR.value  : [];
      const seen = new Set();
      setFixtures([...results, ...upcoming].filter(f => { if (!f.id || seen.has(f.id)) return false; seen.add(f.id); return true; }));
      setFixturesLoading(false);
    });
  }, [activeTab, league]);

  /* ── inline ML prediction ── */
  const predict = async (fix) => {
    const key = fix.id;
    if (predictions[key] || loadingPred[key]) return;
    setLoadingPred(p => ({ ...p, [key]: true }));
    try {
      const r = await fetch(`${API_BASE}/predict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeTeam: fix.homeTeam, awayTeam: fix.awayTeam, league }),
      });
      if (r.ok) { const data = await r.json(); setPredictions(p => ({ ...p, [key]: data })); }
    } catch {}
    setLoadingPred(p => ({ ...p, [key]: false }));
  };

  /* ── derived ── */
  const topScorers = useMemo(() => [...players].sort((a, b) => (b.goals || 0) - (a.goals || 0)).slice(0, 20), [players]);
  const topAssists = useMemo(() => [...players].sort((a, b) => (b.assists || 0) - (a.assists || 0)).slice(0, 20), [players]);
  const topRated   = useMemo(() => [...players].filter(p => (p.appearances||0) >= 5).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 1)[0], [players]);
  const totalGoals = useMemo(() => players.reduce((s, p) => s + (p.goals || 0), 0), [players]);
  const totalAssists=useMemo(() => players.reduce((s, p) => s + (p.assists || 0), 0), [players]);

  const isLive     = s => ['1H','2H','HT','ET','P'].includes(s);
  const isFinished = s => ['FT','AET','PEN'].includes(s);
  const isUpcoming = s => ['NS','TBD'].includes(s) || !s;

  /* ════════════════════════════════════
     LOADING
  ════════════════════════════════════ */
  if (loading) return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center" style={{ fontFamily: "'Outfit',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto relative">
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${leagueColor}25` }}/>
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: leagueColor, borderTopColor: 'transparent' }}/>
          <TrophyIcon className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: leagueColor }}/>
        </div>
        <div>
          <p className="text-white font-black text-xl">{league}</p>
          <p className="text-slate-500 text-sm mt-1">Loading league data…</p>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════
     RENDER
  ════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#050810] text-white" style={{ fontFamily: "'Outfit',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-[700px] h-[700px] rounded-full blur-[160px]" style={{ background: `radial-gradient(circle,${leagueColor}07 0%,transparent 65%)` }}/>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: 'radial-gradient(circle,rgba(168,85,247,0.04) 0%,transparent 65%)' }}/>
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }}/>
      </div>

      <NavBar currentPage="league" onNavigate={onNavigate}/>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-5 md:px-8 py-6 md:py-10">

        {/* ══ HERO HEADER ══ */}
        <div className="rounded-2xl overflow-hidden border border-white/[0.07] mb-6 relative"
          style={{ background: 'rgba(8,12,22,0.9)', animation: 'ldFadeIn 0.4s ease-out', boxShadow: `0 0 60px ${leagueColor}10` }}>
          <div className="h-0.5" style={{ background: `linear-gradient(90deg,transparent,${leagueColor},transparent)` }}/>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px]" style={{ background: `${leagueColor}08` }}/>

          <div className="relative p-5 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Logo + title */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center p-2 border border-white/10 shadow-xl flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {LEAGUE_IMG[league]
                    ? <img src={LEAGUE_IMG[league]} alt="" className="w-full h-full object-contain"/>
                    : <TrophyIcon className="w-8 h-8" style={{ color: leagueColor }}/>}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: leagueColor }}/>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: leagueColor }}>2025/26 Season</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">{league}</h1>
                  <p className="text-slate-500 text-xs mt-0.5">{info.country} · {info.teams} clubs</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:ml-auto">
                {[
                  { label: 'Players',  val: players.length,  color: '#22d3ee', Icon: UsersIcon  },
                  { label: 'Goals',    val: totalGoals,       color: '#f59e0b', Icon: ZapIcon    },
                  { label: 'Assists',  val: totalAssists,     color: '#a855f7', Icon: StarIcon   },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl p-3 text-center border border-white/[0.06]"
                    style={{ background: `${s.color}08` }}>
                    <p className="text-xl sm:text-2xl font-black" style={{ fontFamily: 'JetBrains Mono', color: s.color }}>{s.val}</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ SPOTLIGHT LEADERS ══ */}
        {(topScorers[0] || topAssists[0] || topRated) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {topScorers[0] && <SpotlightCard player={topScorers[0]} statKey="goals"   statLabel="Goals"   accentColor="#22d3ee" onSelect={setSelectedPlayer}/>}
            {topAssists[0] && <SpotlightCard player={topAssists[0]} statKey="assists" statLabel="Assists" accentColor="#f59e0b" onSelect={setSelectedPlayer}/>}
            {topRated      && <SpotlightCard player={topRated}      statKey="rating"  statLabel="Rating"  accentColor="#a855f7" onSelect={setSelectedPlayer}/>}
          </div>
        )}

        {/* ══ TABS ══ */}
        <div className="flex gap-1 mb-5 rounded-2xl p-1.5 border border-white/[0.06] overflow-x-auto" style={{ background: 'rgba(10,14,26,0.7)' }}>
          {[
            { id: 'table',    label: 'Standings',   Icon: TrophyIcon   },
            { id: 'fixtures', label: 'Fixtures',    Icon: CalendarIcon },
            { id: 'scorers',  label: 'Scorers',     Icon: ZapIcon      },
            { id: 'assists',  label: 'Assists',     Icon: AwardIcon    },
          ].map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[12px] font-bold transition-all whitespace-nowrap flex-shrink-0"
                style={{
                  background: active ? `${leagueColor}18` : 'transparent',
                  border: active ? `1px solid ${leagueColor}30` : '1px solid transparent',
                  color: active ? leagueColor : '#475569',
                  minWidth: 72,
                }}>
                {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full" style={{ background: leagueColor }}/>}
                <tab.Icon className="w-3.5 h-3.5 flex-shrink-0"/>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════
            STANDINGS TAB
        ══════════════════════════════ */}
        {activeTab === 'table' && (
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(8,12,22,0.9)', animation: 'ldFadeIn 0.3s ease-out' }}>

            {/* Desktop table header */}
            <div className="hidden sm:grid items-center px-4 py-3 border-b border-white/[0.06] text-[10px] text-slate-600 uppercase tracking-widest font-bold"
              style={{ gridTemplateColumns: '36px 1fr 32px 32px 32px 32px 38px 38px 38px 50px 90px', gap: 4, background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-center">#</div>
              <div>Club</div>
              <div className="text-center">P</div>
              <div className="text-center">W</div>
              <div className="text-center">D</div>
              <div className="text-center">L</div>
              <div className="text-center">GF</div>
              <div className="text-center">GA</div>
              <div className="text-center">GD</div>
              <div className="text-center">Pts</div>
              <div className="text-center">Form</div>
            </div>

            {standings.length === 0 ? (
              <div className="py-16 text-center">
                <TrophyIcon className="w-8 h-8 text-slate-700 mx-auto mb-3"/>
                <p className="text-slate-500 text-sm">No standings data available</p>
              </div>
            ) : standings.map((team, i) => {
              const pos    = team.position || i + 1;
              const total  = standings.length;
              const gd     = team.goal_diff || 0;
              const isCL   = pos <= 4;
              const isEL   = pos === 5;
              const isConf = pos === 6;
              const isRel  = pos > total - 3;
              const isChamp= pos === 1;
              const zoneC  = isCL ? '#3b82f6' : isEL ? '#f97316' : isConf ? '#22d3ee' : isRel ? '#ef4444' : 'transparent';
              const name   = shortName(team.team || '');

              return (
                <div key={i} className="transition-all border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025]"
                  style={{ borderLeft: `3px solid ${zoneC}`, background: isChamp ? 'rgba(245,158,11,0.02)' : undefined, animation: `ldFadeIn 0.15s ease-out ${i * 0.02}s both` }}>

                  {/* ── DESKTOP ROW ── */}
                  <div className="hidden sm:grid items-center px-4 py-3"
                    style={{ gridTemplateColumns: '36px 1fr 32px 32px 32px 32px 38px 38px 38px 50px 90px', gap: 4 }}>

                    {/* Rank */}
                    <div className="flex justify-center">
                      {isChamp
                        ? <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] text-white" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>1</div>
                        : <span className="text-xs font-black" style={{ fontFamily: 'JetBrains Mono', color: isCL ? '#3b82f6' : isEL ? '#f97316' : isRel ? '#ef4444' : '#475569' }}>{pos}</span>}
                    </div>

                    {/* Club */}
                    <div className="flex items-center gap-2 min-w-0">
                      {team.crest
                        ? <img src={team.crest} alt="" className="w-5 h-5 object-contain flex-shrink-0"/>
                        : <div className="w-5 h-5 rounded bg-white/5 flex-shrink-0"/>}
                      <span className="text-xs font-semibold truncate" style={{ color: isChamp ? '#fde68a' : 'white' }}>{name}</span>
                    </div>

                    <div className="text-center text-[11px] text-slate-400" style={{ fontFamily: 'JetBrains Mono' }}>{team.played || 0}</div>
                    <div className="text-center text-[11px] text-emerald-400/80" style={{ fontFamily: 'JetBrains Mono' }}>{team.won || 0}</div>
                    <div className="text-center text-[11px] text-yellow-400/70" style={{ fontFamily: 'JetBrains Mono' }}>{team.draw || 0}</div>
                    <div className="text-center text-[11px] text-red-400/60" style={{ fontFamily: 'JetBrains Mono' }}>{team.lost || 0}</div>
                    <div className="text-center text-[11px] text-slate-400" style={{ fontFamily: 'JetBrains Mono' }}>{team.goals_for || 0}</div>
                    <div className="text-center text-[11px] text-slate-400" style={{ fontFamily: 'JetBrains Mono' }}>{team.goals_against || 0}</div>
                    <div className="text-center text-[11px] font-bold" style={{ fontFamily: 'JetBrains Mono', color: gd > 0 ? '#10b981' : gd < 0 ? '#ef4444' : '#475569' }}>
                      {gd > 0 ? '+' : ''}{gd}
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-black text-white" style={{ fontFamily: 'JetBrains Mono' }}>{team.points || 0}</span>
                    </div>
                    <div className="flex justify-center">
                      <FormGuide form={team.form || ''}/>
                    </div>
                  </div>

                  {/* ── MOBILE ROW ── */}
                  <div className="sm:hidden flex items-center gap-3 px-4 py-3">
                    {/* Rank */}
                    <div className="w-6 flex-shrink-0 text-center">
                      {isChamp
                        ? <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] text-white" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>1</div>
                        : <span className="text-xs font-black" style={{ fontFamily: 'JetBrains Mono', color: isCL ? '#3b82f6' : isRel ? '#ef4444' : '#475569' }}>{pos}</span>}
                    </div>
                    {/* Crest */}
                    {team.crest
                      ? <img src={team.crest} alt="" className="w-6 h-6 object-contain flex-shrink-0"/>
                      : <div className="w-6 h-6 rounded bg-white/5 flex-shrink-0"/>}
                    {/* Name */}
                    <span className="flex-1 text-sm font-semibold truncate min-w-0" style={{ color: isChamp ? '#fde68a' : 'white' }}>{name}</span>
                    {/* Form dots */}
                    <FormGuide form={team.form || ''}/>
                    {/* Points */}
                    <span className="text-base font-black text-white flex-shrink-0 w-8 text-right" style={{ fontFamily: 'JetBrains Mono' }}>{team.points || 0}</span>
                  </div>
                </div>
              );
            })}

            {/* Export + Legend */}
            <div className="border-t border-white/[0.05]" style={{ background: 'rgba(0,0,0,0.2)' }}>
              {standings.length > 0 && (
                <div className="px-4 pt-3">
                  <ExportButton label="Export Standings" onClick={() => exportLeagueStandings(league, standings)}/>
                </div>
              )}
              <div className="px-4 py-3 flex flex-wrap gap-3">
                {[
                  { color: '#3b82f6', label: 'Champions League' },
                  { color: '#f97316', label: 'Europa League'    },
                  { color: '#22d3ee', label: 'Conference League'},
                  { color: '#ef4444', label: 'Relegation'       },
                ].map((z, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: z.color }}/>
                    <span className="text-[11px] text-slate-500">{z.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            FIXTURES TAB
        ══════════════════════════════ */}
        {activeTab === 'fixtures' && (
          <div style={{ animation: 'ldFadeIn 0.3s ease-out' }}>
            {/* Sub-tabs */}
            <div className="flex gap-1.5 mb-5 rounded-xl p-1 border border-white/[0.06]" style={{ background: 'rgba(10,14,26,0.7)' }}>
              {[
                { id: 'upcoming', label: 'Upcoming', Icon: ClockIcon    },
                { id: 'recent',   label: 'Results',  Icon: ActivityIcon },
              ].map(v => (
                <button key={v.id} onClick={() => setFixturesView(v.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: fixturesView === v.id ? `${leagueColor}15` : 'transparent',
                    border: fixturesView === v.id ? `1px solid ${leagueColor}25` : '1px solid transparent',
                    color: fixturesView === v.id ? leagueColor : '#475569',
                  }}>
                  <v.Icon className="w-3.5 h-3.5"/>{v.label}
                </button>
              ))}
            </div>

            {fixturesLoading ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 mx-auto mb-3 relative">
                  <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${leagueColor}25` }}/>
                  <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: leagueColor, borderTopColor: 'transparent' }}/>
                  <CalendarIcon className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: leagueColor }}/>
                </div>
                <p className="text-slate-500 text-sm">Loading fixtures…</p>
              </div>
            ) : (() => {
              const filtered = fixturesView === 'upcoming'
                ? fixtures.filter(f => isUpcoming(f.status))
                : fixtures.filter(f => isFinished(f.status) || isLive(f.status));

              const grouped = {};
              filtered.forEach(f => {
                const k = (f.round || 'Matchday').replace('Regular Season - ', 'Matchday ');
                if (!grouped[k]) grouped[k] = [];
                grouped[k].push(f);
              });

              if (!Object.keys(grouped).length) return (
                <div className="text-center py-16 rounded-2xl border border-white/[0.05]" style={{ background: 'rgba(10,14,26,0.7)' }}>
                  <CalendarIcon className="w-8 h-8 text-slate-700 mx-auto mb-3"/>
                  <p className="text-slate-500 text-sm">No {fixturesView} fixtures found</p>
                </div>
              );

              return (
                <div className="space-y-5">
                  {Object.entries(grouped).map(([round, matches], gi) => (
                    <div key={round} style={{ animation: `ldFadeIn 0.2s ease-out ${gi * 0.05}s both` }}>
                      {/* Round header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-lg flex items-center justify-center border flex-shrink-0"
                          style={{ background: `${leagueColor}15`, borderColor: `${leagueColor}25` }}>
                          <CalendarIcon className="w-2.5 h-2.5" style={{ color: leagueColor }}/>
                        </div>
                        <span className="text-white font-black text-xs">{round}</span>
                        <span className="text-[11px] text-slate-600">{matches.length} matches</span>
                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }}/>
                      </div>

                      <div className="space-y-1.5">
                        {matches.map((fix, idx) => {
                          const live_     = isLive(fix.status);
                          const finished_ = isFinished(fix.status);
                          const upcoming_ = isUpcoming(fix.status);
                          const homeWon   = finished_ && fix.homeGoals > fix.awayGoals;
                          const awayWon   = finished_ && fix.awayGoals > fix.homeGoals;
                          const pred      = predictions[fix.id];
                          const loadingP  = loadingPred[fix.id];
                          const hName     = shortName(fix.homeTeam || '');
                          const aName     = shortName(fix.awayTeam || '');

                          return (
                            <div key={`${fix.id ?? 'x'}-${idx}`}
                              className="rounded-xl border overflow-hidden transition-all"
                              style={{
                                background: 'rgba(10,14,26,0.85)',
                                borderColor: live_ ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)',
                                animation: `ldFadeIn 0.15s ease-out ${idx * 0.03}s both`,
                              }}>
                              {live_ && <div className="h-0.5" style={{ background: 'linear-gradient(90deg,transparent,#ef4444,transparent)' }}/>}

                              {/* Main row */}
                              <div className="flex items-center gap-2 px-3 py-3 cursor-pointer group"
                                onClick={() => !finished_ && fix.id && onNavigate('match', { fixtureId: fix.id })}>

                                {/* Time / status */}
                                <div className="w-12 flex-shrink-0 text-center">
                                  {live_ ? (
                                    <div className="flex items-center gap-1 justify-center">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
                                      <span className="text-[11px] font-black text-red-400" style={{ fontFamily: 'JetBrains Mono' }}>{fix.elapsed}'</span>
                                    </div>
                                  ) : finished_ ? (
                                    <span className="text-[11px] font-bold text-slate-500">FT</span>
                                  ) : fix.date ? (
                                    <div>
                                      <span className="text-[11px] font-bold block" style={{ fontFamily: 'JetBrains Mono', color: leagueColor }}>
                                        {new Date(fix.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                      </span>
                                      <span className="text-[9px] text-slate-600 block">
                                        {new Date(fix.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                      </span>
                                    </div>
                                  ) : <span className="text-[11px] text-slate-600">—</span>}
                                </div>

                                {/* Home team */}
                                <div className="flex-1 flex items-center gap-1.5 justify-end min-w-0">
                                  <span className={`text-xs font-semibold truncate text-right ${homeWon ? 'text-white' : finished_ ? 'text-slate-500' : 'text-slate-300'}`}>{hName}</span>
                                  {fix.homeLogo
                                    ? <img src={fix.homeLogo} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={e => e.target.style.display='none'}/>
                                    : <div className="w-5 h-5 rounded bg-white/5 flex-shrink-0"/>}
                                </div>

                                {/* Score */}
                                <div className="w-14 flex-shrink-0 text-center">
                                  {upcoming_ ? (
                                    <span className="text-[11px] text-slate-600 font-bold">vs</span>
                                  ) : (
                                    <div className="px-2 py-0.5 rounded-lg" style={{ background: live_ ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)', border: live_ ? '1px solid rgba(239,68,68,0.2)' : 'none' }}>
                                      <span className="text-sm font-black text-white" style={{ fontFamily: 'JetBrains Mono' }}>{fix.homeGoals ?? 0} – {fix.awayGoals ?? 0}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Away team */}
                                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                                  {fix.awayLogo
                                    ? <img src={fix.awayLogo} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={e => e.target.style.display='none'}/>
                                    : <div className="w-5 h-5 rounded bg-white/5 flex-shrink-0"/>}
                                  <span className={`text-xs font-semibold truncate ${awayWon ? 'text-white' : finished_ ? 'text-slate-500' : 'text-slate-300'}`}>{aName}</span>
                                </div>

                                {/* HT / predict button */}
                                <div className="flex-shrink-0 w-10 text-right">
                                  {finished_ && fix.htHome != null ? (
                                    <span className="text-[9px] text-slate-700" style={{ fontFamily: 'JetBrains Mono' }}>{fix.htHome}-{fix.htAway}</span>
                                  ) : upcoming_ ? (
                                    <button onClick={e => { e.stopPropagation(); predict(fix); }}
                                      className="text-[9px] font-black px-1.5 py-0.5 rounded-lg transition-all"
                                      style={{
                                        background: pred ? `${leagueColor}15` : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${pred ? leagueColor+'30' : 'rgba(255,255,255,0.08)'}`,
                                        color: pred ? leagueColor : '#64748b',
                                      }}>
                                      {loadingP ? '…' : pred ? '✓' : 'AI'}
                                    </button>
                                  ) : (
                                    <ChevRightIcon className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors ml-auto"/>
                                  )}
                                </div>
                              </div>

                              {/* Prediction result */}
                              {pred && upcoming_ && (
                                <div className="flex items-center gap-2 px-3 pb-2">
                                  <div className="flex-1 h-px" style={{ background: `${leagueColor}20` }}/>
                                  <div className="flex items-center gap-2 text-[10px] font-black" style={{ color: leagueColor }}>
                                    <span>H {Math.round((pred.home_win||0)*100)}%</span>
                                    <span className="text-slate-600">·</span>
                                    <span className="text-slate-400">D {Math.round((pred.draw||0)*100)}%</span>
                                    <span className="text-slate-600">·</span>
                                    <span>A {Math.round((pred.away_win||0)*100)}%</span>
                                    {pred.predicted_score && <span className="ml-1 text-slate-500">({pred.predicted_score})</span>}
                                  </div>
                                  <div className="flex-1 h-px" style={{ background: `${leagueColor}20` }}/>
                                </div>
                              )}

                              {/* MatchAccordion for finished */}
                              {finished_ && (
                                <MatchAccordion
                                  matchId={fix.id}
                                  homeTeam={fix.homeTeam}
                                  awayTeam={fix.awayTeam}
                                  homeGoals={fix.homeGoals}
                                  awayGoals={fix.awayGoals}
                                  homeLogo={fix.homeLogo}
                                  awayLogo={fix.awayLogo}
                                  date={fix.date}
                                  round={fix.round}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Fixtures stats */}
            {!fixturesLoading && fixtures.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
                {[
                  { label: 'Total Fixtures', val: fixtures.length,                                                              color: '#22d3ee', Icon: CalendarIcon },
                  { label: 'Completed',      val: fixtures.filter(f => isFinished(f.status)).length,                           color: '#10b981', Icon: TrophyIcon   },
                  { label: 'Upcoming',       val: fixtures.filter(f => isUpcoming(f.status)).length,                           color: '#a855f7', Icon: ClockIcon    },
                  { label: 'Goals Scored',   val: fixtures.reduce((s, f) => s + (f.homeGoals||0) + (f.awayGoals||0), 0),      color: '#f59e0b', Icon: TargetIcon   },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl p-3 border border-white/[0.06] text-center" style={{ background: 'rgba(10,14,26,0.8)' }}>
                    <s.Icon className="w-3.5 h-3.5 mx-auto mb-1.5" style={{ color: s.color }}/>
                    <p className="text-xl font-black text-white" style={{ fontFamily: 'JetBrains Mono' }}>{s.val}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════
            SCORERS / ASSISTS TABS
        ══════════════════════════════ */}
        {(activeTab === 'scorers' || activeTab === 'assists') && (
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(8,12,22,0.9)', animation: 'ldFadeIn 0.3s ease-out' }}>

            {/* Desktop header */}
            <div className="hidden sm:grid items-center px-5 py-3 border-b border-white/[0.06] text-[10px] text-slate-600 uppercase tracking-widest font-bold"
              style={{ gridTemplateColumns: '36px 1fr 130px 52px 52px 46px 64px', gap: 8, background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-center">#</div>
              <div>Player</div>
              <div>Club</div>
              <div className="text-center">{activeTab === 'scorers' ? 'Goals' : 'Assists'}</div>
              <div className="text-center">{activeTab === 'scorers' ? 'Ast' : 'Goals'}</div>
              <div className="text-center">Apps</div>
              <div className="text-center">Rating</div>
            </div>

            {(activeTab === 'scorers' ? topScorers : topAssists).map((p, i) => {
              const rank    = i + 1;
              const isTop3  = rank <= 3;
              const medals  = ['linear-gradient(135deg,#f59e0b,#d97706)', 'linear-gradient(135deg,#94a3b8,#64748b)', 'linear-gradient(135deg,#cd7c3e,#a05c2a)'];
              const posC    = POS_COLORS[p.position] || POS_COLORS.Midfielder;
              const primary = activeTab === 'scorers' ? (p.goals || 0)   : (p.assists || 0);
              const secondary=activeTab === 'scorers' ? (p.assists || 0) : (p.goals || 0);
              const pColor  = activeTab === 'scorers' ? '#22d3ee' : '#f59e0b';

              return (
                <div key={`${p.id ?? 'p'}-${i}`} onClick={() => setSelectedPlayer(p)}
                  className="transition-all border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] cursor-pointer"
                  style={{ background: isTop3 ? 'rgba(255,255,255,0.01)' : undefined, animation: `ldFadeIn 0.15s ease-out ${i * 0.025}s both` }}>

                  {/* Desktop row */}
                  <div className="hidden sm:grid items-center px-5 py-3"
                    style={{ gridTemplateColumns: '36px 1fr 130px 52px 52px 46px 64px', gap: 8 }}>
                    <div className="flex justify-center">
                      {isTop3
                        ? <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] text-white" style={{ background: medals[i] }}>{rank}</div>
                        : <span className="text-xs text-slate-600 font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{rank}</span>}
                    </div>
                    <div className="flex items-center gap-2.5 min-w-0">
                      {p.photo
                        ? <img src={p.photo} alt="" className="w-9 h-9 rounded-xl object-cover border border-white/[0.08] flex-shrink-0"/>
                        : <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: posC.bg, border: `1px solid ${posC.border}` }}>
                            <span className="text-sm font-black" style={{ color: posC.text }}>{(p.name||'?')[0]}</span>
                          </div>}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate hover:text-cyan-300 transition-colors">{p.name}</p>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md" style={{ color: posC.text, background: posC.bg, border: `1px solid ${posC.border}` }}>
                          {(p.position||'').slice(0,3).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {p.teamLogo && <img src={p.teamLogo} alt="" className="w-4 h-4 object-contain flex-shrink-0"/>}
                      <span className="text-[11px] text-slate-400 truncate">{shortName(p.team || '')}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-black" style={{ fontFamily: 'JetBrains Mono', color: pColor }}>{primary}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-slate-400" style={{ fontFamily: 'JetBrains Mono' }}>{secondary}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-slate-500" style={{ fontFamily: 'JetBrains Mono' }}>{p.appearances || 0}</span>
                    </div>
                    <div className="flex justify-center">
                      {p.rating > 0
                        ? <div className="w-10 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white"
                            style={{ fontFamily: 'JetBrains Mono', background: p.rating >= 7.5 ? 'linear-gradient(135deg,#10b981,#059669)' : p.rating >= 7 ? 'linear-gradient(135deg,#22d3ee,#0891b2)' : 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                            {p.rating.toFixed(1)}
                          </div>
                        : <span className="text-slate-600 text-xs">—</span>}
                    </div>
                  </div>

                  {/* Mobile row */}
                  <div className="sm:hidden flex items-center gap-3 px-4 py-3">
                    <div className="w-6 flex-shrink-0 text-center">
                      {isTop3
                        ? <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] text-white" style={{ background: medals[i] }}>{rank}</div>
                        : <span className="text-xs text-slate-600 font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{rank}</span>}
                    </div>
                    {p.photo
                      ? <img src={p.photo} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/[0.08] flex-shrink-0"/>
                      : <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: posC.bg }}>
                          <span className="text-base font-black" style={{ color: posC.text }}>{(p.name||'?')[0]}</span>
                        </div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.teamLogo && <img src={p.teamLogo} alt="" className="w-3.5 h-3.5 object-contain flex-shrink-0"/>}
                        <span className="text-[11px] text-slate-500 truncate">{shortName(p.team || '')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-base font-black" style={{ fontFamily: 'JetBrains Mono', color: pColor }}>{primary}</p>
                        <p className="text-[9px] text-slate-700">{activeTab === 'scorers' ? 'G' : 'A'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-400" style={{ fontFamily: 'JetBrains Mono' }}>{secondary}</p>
                        <p className="text-[9px] text-slate-700">{activeTab === 'scorers' ? 'A' : 'G'}</p>
                      </div>
                      {p.rating > 0 && (
                        <div className="w-10 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white"
                          style={{ fontFamily: 'JetBrains Mono', background: p.rating >= 7.5 ? 'linear-gradient(135deg,#10b981,#059669)' : p.rating >= 7 ? 'linear-gradient(135deg,#22d3ee,#0891b2)' : 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                          {p.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedPlayer && <PlayerProfileCard player={selectedPlayer} onClose={() => setSelectedPlayer(null)}/>}

      <style>{`
        @keyframes ldFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

export default LeagueDashboard;