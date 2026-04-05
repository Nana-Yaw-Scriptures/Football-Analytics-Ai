import React, { useState, useEffect, useRef, useCallback } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { getPredictions } from '../services/supabaseService';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/* ══════════════════════════════════════
   ICONS
══════════════════════════════════════ */
const I = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const ActivityIcon   = p => <I {...p} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>;
const ArrowRightIcon = p => <I {...p} d={<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>}/>;
const BarChartIcon   = p => <I {...p} d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}/>;
const BrainIcon      = p => <I {...p} d={<><path d="M9.5 2A5.5 5.5 0 0 0 5 6a5.5 5.5 0 0 0 .4 2A5.5 5.5 0 0 0 4 13.5a5.5 5.5 0 0 0 3.5 5.1V22h5v-3.4a5.5 5.5 0 0 0 3.5-5.1 5.5 5.5 0 0 0-1.4-5.5A5.5 5.5 0 0 0 15 6a5.5 5.5 0 0 0-5.5-4Z"/><path d="M12 2v20"/></>}/>;
const CheckIcon      = p => <I {...p} d={<polyline points="20 6 9 17 4 12"/>}/>;
const ClockIcon      = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const GlobeIcon      = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}/>;
const LayersIcon     = p => <I {...p} d={<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>}/>;
const PlayIcon       = p => <I {...p} d={<polygon points="5 3 19 12 5 21 5 3"/>}/>;
const SearchIcon     = p => <I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const ShieldIcon     = p => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const TargetIcon     = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const TrendingUpIcon = p => <I {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const UsersIcon      = p => <I {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const XCircleIcon    = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>}/>;
const ZapIcon        = p => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;

/* ══════════════════════════════════════
   LEAGUE DATA
══════════════════════════════════════ */
const LEAGUES = [
  { name:'Premier League',  code:'Premier League',  img:'https://media.api-sports.io/football/leagues/39.png',  country:'England',  color:'#7c3aed', teams:20 },
  { name:'La Liga',         code:'La Liga',         img:'https://media.api-sports.io/football/leagues/140.png', country:'Spain',    color:'#dc2626', teams:20 },
  { name:'Bundesliga',      code:'Bundesliga',      img:'https://media.api-sports.io/football/leagues/78.png',  country:'Germany',  color:'#d97706', teams:18 },
  { name:'Serie A',         code:'Serie A',         img:'https://media.api-sports.io/football/leagues/135.png',country:'Italy',    color:'#059669', teams:20 },
  { name:'Ligue 1',         code:'Ligue 1',         img:'https://media.api-sports.io/football/leagues/61.png', country:'France',   color:'#2563eb', teams:18 },
  { name:'Primeira Liga',   code:'Primeira Liga',   img:'https://media.api-sports.io/football/leagues/94.png', country:'Portugal', color:'#10b981', teams:18 },
  { name:'Champions League',code:'Champions League',img:'https://media.api-sports.io/football/leagues/2.png',  country:'Europe',   color:'#f59e0b', teams:32 },
];

const FEATURES = [
  { icon:TrendingUpIcon, title:'Match Predictions',  desc:'Poisson + xG model. Win probabilities, predicted scorelines, confidence levels.',  color:'#22d3ee', page:'analysis',  tag:'AI-Powered'  },
  { icon:TargetIcon,     title:'xG Intelligence',    desc:'Expected goals, shot efficiency, over/underperformers across every league.',         color:'#a855f7', page:'analysis',  tag:'xG Lab'      },
  { icon:BrainIcon,      title:'Tactical Analysis',  desc:'Formation DNA, press intensity, phase-of-play breakdowns, scenario planning.',       color:'#f59e0b', page:'analysis',  tag:'Unique'      },
  { icon:UsersIcon,      title:'Player Database',    desc:'3,000+ players. Goals, xG, xA, tackles, pass accuracy — sortable and comparable.',   color:'#34d399', page:'players',   tag:'3,000+'      },
  { icon:ShieldIcon,     title:'Manager Profiles',   desc:'Tactical philosophy, preferred formations, trophy counts for 96 coaches.',           color:'#f87171', page:'managers',  tag:'96 Coaches'  },
  { icon:PlayIcon,       title:'Season Simulator',   desc:'Simulate the rest of the season for any team using Monte Carlo projections.',        color:'#fb923c', page:'simulator', tag:'Simulator'   },
  { icon:BarChartIcon,   title:'League Dashboards',  desc:'Standings, top scorers, recent form, fixtures — every league in one place.',         color:'#60a5fa', page:'league',    tag:'7 Leagues'   },
  { icon:ActivityIcon,   title:'Live Scores',        desc:'Real-time scores across all 7 leagues with live match events.',                       color:'#ef4444', page:'live',      tag:'Live'        },
];

/* ══════════════════════════════════════
   ANIMATED COUNTER
══════════════════════════════════════ */
const Counter = ({ to, suffix = '', duration = 2000 }) => {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const steps = duration / 16;
      const inc   = to / steps;
      const t = setInterval(() => {
        start += inc;
        if (start >= to) { setVal(to); clearInterval(t); }
        else setVal(Math.floor(start));
      }, 16);
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
};

/* ══════════════════════════════════════
   SPARKLINE
══════════════════════════════════════ */
const Spark = ({ data, color, h = 40 }) => {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const w = 100;
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h-((v-min)/range)*(h-6)}`).join(' ');
  const id  = `sg${color.replace('#','')}`;
  return (
    <svg width={w} height={h} className="overflow-visible flex-shrink-0">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      {data.map((v,i) => i === data.length-1 && (
        <circle key={i} cx={(i/(data.length-1))*w} cy={h-((v-min)/range)*(h-6)} r="3"
          fill={color} stroke="rgba(5,8,16,0.8)" strokeWidth="1.5"/>
      ))}
    </svg>
  );
};

/* ══════════════════════════════════════
   PROB BAR
══════════════════════════════════════ */
const ProbBar = ({ home, draw, away, homeTeam = 'Home', awayTeam = 'Away' }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[11px] font-bold">
      <span className="text-cyan-400 truncate max-w-[80px]">{homeTeam}</span>
      <span className="text-slate-500">Draw</span>
      <span className="text-purple-400 truncate max-w-[80px] text-right">{awayTeam}</span>
    </div>
    <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-white/5">
      <div className="bg-cyan-500 rounded-l-full transition-all duration-1000" style={{ width:`${home}%` }}/>
      <div className="bg-slate-600 transition-all duration-1000" style={{ width:`${draw}%` }}/>
      <div className="bg-purple-500 rounded-r-full transition-all duration-1000" style={{ width:`${away}%` }}/>
    </div>
    <div className="flex justify-between text-[11px] font-black" style={{ fontFamily:'JetBrains Mono' }}>
      <span className="text-cyan-400">{home}%</span>
      <span className="text-slate-600">{draw}%</span>
      <span className="text-purple-400">{away}%</span>
    </div>
  </div>
);

/* ══════════════════════════════════════
   LIVE SCORE PILL
══════════════════════════════════════ */
const LivePill = ({ match }) => {
  const isLive = match.status === 'live' || match.minute;
  return (
    <div className="hp-live-pill group" onClick={() => {}}>
      <div className="hp-live-pill-inner">
        {/* Home */}
        <div className="flex items-center gap-2 min-w-0">
          {match.homeLogo && <img src={match.homeLogo} alt="" className="w-5 h-5 object-contain flex-shrink-0"/>}
          <span className="text-sm font-bold text-white truncate">{match.homeTeam?.replace(' FC','')}</span>
        </div>
        {/* Score */}
        <div className="flex items-center gap-2 flex-shrink-0 px-3">
          {isLive ? (
            <div className="text-center">
              <p className="text-base font-black text-white" style={{ fontFamily:'JetBrains Mono', letterSpacing:'-0.02em' }}>
                {match.homeGoals ?? '—'} – {match.awayGoals ?? '—'}
              </p>
              <p className="text-[10px] font-bold text-red-400">{match.minute ? `${match.minute}'` : 'LIVE'}</p>
            </div>
          ) : (
            <p className="text-base font-black text-slate-400" style={{ fontFamily:'JetBrains Mono' }}>
              {match.time || 'vs'}
            </p>
          )}
        </div>
        {/* Away */}
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <span className="text-sm font-bold text-white truncate">{match.awayTeam?.replace(' FC','')}</span>
          {match.awayLogo && <img src={match.awayLogo} alt="" className="w-5 h-5 object-contain flex-shrink-0"/>}
        </div>
      </div>
      {isLive && <div className="hp-live-pill-glow"/>}
    </div>
  );
};

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function HomePage({ onNavigate }) {
  const { user }                          = useAuth();
  const [liveMatches,   setLiveMatches]   = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [recentPreds,   setRecentPreds]   = useState([]);
  const [matchInput,    setMatchInput]    = useState('');
  const [teamSuggestions, setTeamSuggestions] = useState([]);
  const [loadingLive,   setLoadingLive]   = useState(true);
  const [visible,       setVisible]       = useState(false);
  const searchTimer = useRef(null);
  const heroRef     = useRef(null);

  /* Entrance animation */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* Live scores */
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API_BASE}/live/now`);
        if (r.ok) {
          const d = await r.json();
          setLiveMatches(Array.isArray(d) ? d.slice(0,6) : []);
        }
      } catch { /* silent */ }
      finally { setLoadingLive(false); }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  /* Recent predictions — from Supabase if logged in */
  useEffect(() => {
    if (!user) { setRecentPreds([]); return; }
    getPredictions(user.id).then(d => {
      setRecentPreds(Array.isArray(d) ? d.slice(0, 3) : []);
    }).catch(() => {});
  }, [user]);

  /* Upcoming matches for empty live state */
  useEffect(() => {
    fetch(`${API_BASE}/live/upcoming`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setUpcomingMatches(Array.isArray(d) ? d.slice(0, 6) : []))
      .catch(() => {});
  }, []);

  /* Team search autocomplete */
  const handleMatchInput = useCallback((val) => {
    setMatchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.length < 2) { setTeamSuggestions([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`${API_BASE}/teams/search?q=${encodeURIComponent(val)}&limit=6`);
        if (r.ok) setTeamSuggestions(await r.json());
      } catch { setTeamSuggestions([]); }
    }, 250);
  }, []);

  const handleAnalyse = () => {
  if (matchInput.trim()) {
    onNavigate('analysis', { prefillQuery: matchInput.trim() });
  }
};

  return (
    <div className="min-h-screen bg-[#050810] text-white overflow-x-hidden" style={{ fontFamily:"'Outfit',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>

      {/* ── AMBIENT BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Radial glows */}
        <div className="absolute -top-40 left-1/4 w-[800px] h-[800px] rounded-full blur-[180px]"
          style={{ background:'radial-gradient(circle,rgba(34,211,238,0.055) 0%,transparent 65%)' }}/>
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{ background:'radial-gradient(circle,rgba(168,85,247,0.04) 0%,transparent 65%)' }}/>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background:'radial-gradient(circle,rgba(16,185,129,0.035) 0%,transparent 65%)' }}/>
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.022]"
          style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize:'64px 64px' }}/>
        {/* Pitch overlay */}
        <div className="absolute inset-0 flex items-start justify-center pointer-events-none opacity-[0.025] pt-12">
          <svg width="900" height="580" viewBox="0 0 900 580">
            <rect x="60" y="40" width="780" height="500" fill="none" stroke="white" strokeWidth="1.5"/>
            <line x1="450" y1="40" x2="450" y2="540" stroke="white" strokeWidth="1"/>
            <circle cx="450" cy="290" r="75" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="450" cy="290" r="3" fill="white"/>
            <rect x="60" y="195" width="120" height="190" fill="none" stroke="white" strokeWidth="1"/>
            <rect x="780" y="195" width="120" height="190" fill="none" stroke="white" strokeWidth="1"/>
            <rect x="60" y="240" width="50" height="100" fill="none" stroke="white" strokeWidth="0.8"/>
            <rect x="790" y="240" width="50" height="100" fill="none" stroke="white" strokeWidth="0.8"/>
          </svg>
        </div>
      </div>

      <NavBar currentPage="home" onNavigate={onNavigate}/>

      {/* ══════════════════════════════
          HERO
      ══════════════════════════════ */}
      <section ref={heroRef} className="relative pt-16 pb-14 md:pt-24 md:pb-20 px-4 sm:px-6 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_460px] gap-12 xl:gap-20 items-center">

            {/* ── LEFT: Wordmark + CTA ── */}
            <div className={`hp-fadeup ${visible ? 'hp-fadeup-in' : ''}`}>

              {/* Status badge */}
              <div className="inline-flex items-center gap-2.5 mb-7 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03]"
                style={{ animation: visible ? 'hpFadeUp 0.5s ease-out both' : 'none' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-60"/>
                  <span className="relative flex rounded-full h-2 w-2 bg-emerald-400"/>
                </span>
                <span className="text-slate-300 text-xs font-semibold tracking-wide">7 leagues · Live data · Updated daily</span>
              </div>

              {/* Wordmark */}
              <div className="mb-6" style={{ animation: visible ? 'hpFadeUp 0.5s 0.1s ease-out both' : 'none' }}>
                <div className="flex items-baseline gap-1 mb-1">
                  <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-tight leading-none text-white">
                    Scorina
                  </h1>
                  {/* IQ styled as a score badge */}
                  <div className="hp-iq-badge">
                    <span>Ai</span>
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-semibold mt-3 leading-tight"
                  style={{ background:'linear-gradient(90deg,#22d3ee 0%,#a855f7 50%,#f59e0b 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  Football Analytics Intelligence
                </p>
              </div>

              {/* Description */}
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-lg mb-8 font-light"
                style={{ animation: visible ? 'hpFadeUp 0.5s 0.2s ease-out both' : 'none' }}>
                AI-powered predictions, live scores, player analytics, tactical intelligence and league simulation — all in one place.
              </p>

              {/* Quick analysis input */}
              <div className="relative mb-8 max-w-lg"
                style={{ animation: visible ? 'hpFadeUp 0.5s 0.3s ease-out both' : 'none' }}>
                <div className="hp-search-wrap">
                  <SearchIcon className="w-4 h-4 text-slate-500 flex-shrink-0"/>
                  <input
                    type="text"
                    value={matchInput}
                    onChange={e => handleMatchInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAnalyse()}
                    placeholder="Arsenal vs Chelsea — analyse any match…"
                    className="hp-search-input"
                  />
                  {matchInput && (
                    <button onClick={() => { setMatchInput(''); setTeamSuggestions([]); }} className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0">
                      <XCircleIcon className="w-4 h-4"/>
                    </button>
                  )}
                  <button onClick={handleAnalyse}
                    className="hp-search-btn flex-shrink-0">
                    <ZapIcon className="w-3.5 h-3.5"/>
                    <span>Analyse</span>
                  </button>
                </div>
                {/* Suggestions */}
                {teamSuggestions.length > 0 && (
                  <div className="hp-suggestions">
                    {teamSuggestions.map((t, i) => (
                      <button key={i} onClick={() => {
                        const name = t.name || t;
                        setMatchInput(name);
                        setTeamSuggestions([]);
                        onNavigate('analysis', { prefillQuery: name });
                          }}
                        className="hp-suggestion-row">
                        {t.logo && <img src={t.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0"/>}
                        <span className="text-sm text-slate-300">{t.name || t}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick nav buttons */}
              <div className="flex flex-wrap gap-2.5"
                style={{ animation: visible ? 'hpFadeUp 0.5s 0.4s ease-out both' : 'none' }}>
                {[
                  { label:'Live Scores',  page:'live',      color:'#ef4444', Icon:ActivityIcon, live:true },
                  { label:'Players',      page:'players',   color:'#34d399', Icon:UsersIcon     },
                  { label:'Tactics',      page:'analysis',  color:'#f59e0b', Icon:LayersIcon    },
                  { label:'Simulator',    page:'simulator', color:'#a855f7', Icon:PlayIcon      },
                ].map((b, i) => (
                  <button key={i} onClick={() => onNavigate(b.page)}
                    className="hp-quick-btn"
                    style={{ '--qc': b.color }}>
                    <b.Icon className="w-3.5 h-3.5" style={{ color: b.color }}/>
                    <span>{b.label}</span>
                    {b.live && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-red-500 opacity-75"/>
                        <span className="relative flex rounded-full h-1.5 w-1.5 bg-red-500"/>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Hero Card ── */}
            <div className="hidden lg:block relative" style={{ animation: visible ? 'hpFadeRight 0.7s 0.2s ease-out both' : 'none' }}>

              {/* Main prediction card */}
              <div className="hp-hero-card" style={{ animation:'hpFloat 6s ease-in-out infinite' }}>
                <div className="hp-hero-card-header">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-bold">AI Prediction</p>
                    <p className="text-base font-black mt-0.5">Arsenal vs Chelsea</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-500/20 bg-red-500/10">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"/>
                    <span className="text-red-400 text-[10px] font-bold">LIVE</span>
                  </div>
                </div>
                <ProbBar home={52} draw={24} away={24} homeTeam="Arsenal" awayTeam="Chelsea"/>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-4">
                  {[
                    { l:'xG Home', v:'1.87', c:'#22d3ee' },
                    { l:'Difficulty', v:'8/10', c:'#f59e0b' },
                    { l:'Confidence', v:'High', c:'#10b981' },
                  ].map((s,i) => (
                    <div key={i} className="hp-stat-cell">
                      <p className="text-sm font-black" style={{ color:s.c, fontFamily:'JetBrains Mono' }}>{s.v}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3 font-bold">xG Trend · Last 8</p>
                  <div className="flex gap-3 items-end">
                    <Spark data={[1.2,1.8,2.1,1.5,2.3,1.9,2.4,1.87]} color="#22d3ee" h={48}/>
                    <Spark data={[0.9,1.2,0.8,1.5,1.1,1.7,1.3,1.4]}  color="#a855f7" h={48}/>
                  </div>
                  <div className="flex gap-5 mt-2">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-cyan-400"/><span className="text-[10px] text-slate-500">Arsenal</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-400"/><span className="text-[10px] text-slate-500">Chelsea</span></div>
                  </div>
                </div>
              </div>

              {/* Floating top-right card */}
              <div className="hp-float-card hp-float-card--tr" style={{ animation:'hpFloat2 7s ease-in-out infinite' }}>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-2.5">Top Scorer · EPL</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 text-base font-black">S</div>
                  <div>
                    <p className="text-sm font-bold">M. Salah</p>
                    <p className="text-[10px] text-slate-500">Liverpool · FWD</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-3">
                  <div className="hp-stat-cell"><p className="text-base font-black text-cyan-400" style={{ fontFamily:'JetBrains Mono' }}>29</p><p className="text-[9px] text-slate-600">Goals</p></div>
                  <div className="hp-stat-cell"><p className="text-base font-black text-yellow-400" style={{ fontFamily:'JetBrains Mono' }}>12</p><p className="text-[9px] text-slate-600">Assists</p></div>
                </div>
              </div>

              {/* Floating bottom-left card */}
              <div className="hp-float-card hp-float-card--bl" style={{ animation:'hpFloat3 5s ease-in-out infinite' }}>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-2">Formation</p>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-2xl font-black" style={{ fontFamily:'JetBrains Mono', color:'#22d3ee' }}>4-3-3</p>
                    <p className="text-[10px] text-emerald-400 mt-0.5 font-bold">High Press</p>
                  </div>
                  <svg width="44" height="52">
                    {[[1,[.5]],[4,[.15,.38,.62,.85]],[3,[.22,.5,.78]],[3,[.22,.5,.78]]].map(([n, xs],ri) =>
                      xs.map((x,ci) => <circle key={`${ri}-${ci}`} cx={x*44} cy={52-(ri+1)*11} r={3.5}
                        fill={ri===0?'#fbbf24':'#22d3ee'} opacity={0.9}/>)
                    )}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          STATS BAR
      ══════════════════════════════ */}
      <section className="py-8 border-y border-white/[0.05] bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
            {[
              { val:3000, suffix:'+', label:'Players tracked',  sub:'Across 7 leagues',      color:'#22d3ee' },
              { val:98,   suffix:'',  label:'Teams covered',    sub:"Men's top flights",      color:'#a855f7' },
              { val:50,   suffix:'+', label:'Stats per player', sub:'Updated daily',          color:'#f59e0b' },
              { val:7,    suffix:'',  label:'Leagues covered',  sub:'Top European football',  color:'#34d399' },
            ].map((s,i) => (
              <div key={i} className="text-center hp-stat-item" style={{ animationDelay:`${i*0.08}s` }}>
                <p className="text-4xl sm:text-5xl font-black" style={{ fontFamily:'JetBrains Mono', color:s.color }}>
                  <Counter to={s.val} suffix={s.suffix}/>
                </p>
                <p className="text-sm font-bold text-white mt-1">{s.label}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          LIVE SCORES
      ══════════════════════════════ */}
      <section className="py-14 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ boxShadow:'0 0 8px rgba(239,68,68,0.6)' }}/>
              <h2 className="text-xl font-black uppercase tracking-[0.1em]">Live Now</h2>
            </div>
            <button onClick={() => onNavigate('live')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm font-semibold transition-colors group">
              All matches <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
            </button>
          </div>

          {loadingLive ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="hp-live-skeleton"/>
              ))}
            </div>
          ) : liveMatches.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveMatches.map((m,i) => (
                <div key={i} onClick={() => onNavigate('match', m.id)} className="cursor-pointer">
                  <LivePill match={m}/>
                </div>
              ))}
            </div>
          ) : upcomingMatches.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <ClockIcon className="w-3.5 h-3.5 text-slate-500"/>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">No live now · Upcoming</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcomingMatches.map((m,i) => (
                  <div key={i} onClick={() => onNavigate('live')} className="cursor-pointer">
                    <LivePill match={{ ...m, time: m.date ? new Date(m.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : 'TBC' }}/>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="hp-empty-state">
              <ActivityIcon className="w-8 h-8 text-slate-700 mx-auto mb-2"/>
              <p className="text-slate-500 text-sm font-semibold">No matches scheduled today</p>
              <button onClick={() => onNavigate('live')}
                className="mt-3 text-cyan-500 text-xs font-bold hover:text-cyan-400 transition-colors">
                View all fixtures →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════
          LEAGUE GRID
      ══════════════════════════════ */}
      <section className="py-14 px-4 sm:px-6 md:px-8 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] text-cyan-400 font-bold uppercase tracking-[0.18em] mb-2">Coverage</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Europe's{' '}
                <span style={{ background:'linear-gradient(90deg,#22d3ee,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  Top Leagues
                </span>
              </h2>
            </div>
            <GlobeIcon className="w-8 h-8 text-slate-700"/>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {LEAGUES.map((lg,i) => (
              <button key={i} onClick={() => onNavigate('league', lg.code)}
                className="hp-league-card group"
                style={{ '--lc': lg.color, animationDelay:`${i*0.05}s` }}>
                <div className="hp-league-glow"/>
                <img src={lg.img} alt={lg.name} className="hp-league-img"/>
                <p className="text-sm font-bold text-white leading-tight text-center">{lg.name}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{lg.country}</p>
                <div className="hp-league-bar"/>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          FEATURES
      ══════════════════════════════ */}
      <section className="py-14 px-4 sm:px-6 md:px-8 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] text-purple-400 font-bold uppercase tracking-[0.18em] mb-2">Platform</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Everything in one place</h2>
            <p className="text-slate-500 text-base max-w-md mx-auto font-light">Professional-grade analysis built for people who take football seriously.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURES.map((f,i) => (
              <button key={i} onClick={() => onNavigate(f.page)}
                className="hp-feature-card group text-left"
                style={{ '--fc': f.color, animationDelay:`${i*0.04}s` }}>
                <div className="hp-feature-glow"/>
                <div className="hp-feature-icon-wrap">
                  <f.icon className="w-4 h-4" style={{ color:f.color }}/>
                </div>
                <span className="hp-feature-tag" style={{ color:f.color, background:`${f.color}15`, border:`1px solid ${f.color}25` }}>
                  {f.tag}
                </span>
                <h3 className="text-base font-black mt-3 mb-2 group-hover:text-white transition-colors">{f.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-4">{f.desc}</p>
                <div className="flex items-center gap-1.5 text-xs font-bold mt-auto" style={{ color:f.color }}>
                  Open <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"/>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          RECENT PREDICTIONS
      ══════════════════════════════ */}
      <section className="py-14 px-4 sm:px-6 md:px-8 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-7">
              <div>
                <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-[0.18em] mb-2">Track Record</p>
                <h2 className="text-2xl font-black tracking-tight">Recent Predictions</h2>
              </div>
              {user && recentPreds.length > 0 && (
                <button onClick={() => onNavigate('history')}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm font-semibold transition-colors group">
                  View all <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                </button>
              )}
            </div>

            {!user ? (
              /* Not logged in — sign in prompt */
              <div className="rounded-2xl border border-white/[0.07] p-8 text-center"
                style={{ background: 'rgba(16,185,129,0.04)' }}>
                <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <CheckIcon className="w-5 h-5 text-emerald-400"/>
                </div>
                <p className="text-white font-black text-base mb-1">Track your predictions</p>
                <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">
                  Sign in to save every prediction, track your accuracy and see your hit rate over time.
                </p>
                <button onClick={() => onNavigate('login')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border transition-all"
                  style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)', color: '#10b981' }}>
                  Sign In to Track →
                </button>
              </div>
            ) : recentPreds.length === 0 ? (
              /* Logged in but no predictions yet */
              <div className="rounded-2xl border border-white/[0.07] p-8 text-center"
                style={{ background: 'rgba(10,14,26,0.8)' }}>
                <p className="text-white font-black text-base mb-1">No predictions yet</p>
                <p className="text-slate-500 text-sm mb-5">Make your first prediction on the Analysis page.</p>
                <button onClick={() => onNavigate('analysis')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border transition-all"
                  style={{ background: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.25)', color: '#22d3ee' }}>
                  Start Predicting →
                </button>
              </div>
            ) : (
              /* Show recent predictions */
              <div className="grid sm:grid-cols-3 gap-3">
                {recentPreds.map((p,i) => {
                  const isCorrect = p.resolved && p.correct;
                  const isWrong   = p.resolved && !p.correct;
                  const sc = isCorrect ? '#10b981' : isWrong ? '#ef4444' : '#64748b';
                  return (
                    <div key={i} className="hp-pred-card" style={{ '--pc': sc }}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{p.homeTeam} vs {p.awayTeam}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{p.league}</p>
                        </div>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background:`${sc}15`, border:`1px solid ${sc}25` }}>
                          {isCorrect ? <CheckIcon className="w-3.5 h-3.5" style={{ color:sc }}/>
                            : isWrong ? <XCircleIcon className="w-3.5 h-3.5" style={{ color:sc }}/>
                            : <ClockIcon className="w-3.5 h-3.5" style={{ color:sc }}/>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-black text-slate-400" style={{ fontFamily:'JetBrains Mono' }}>
                          {p.predictedScore || '—'}
                        </span>
                        <span className="font-bold px-2 py-0.5 rounded-md"
                          style={{ color:sc, background:`${sc}12` }}>
                          {isCorrect ? 'Correct' : isWrong ? 'Wrong' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      {/* ══════════════════════════════
          CTA
      ══════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 md:px-8 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/08 mb-7">
            <ZapIcon className="w-3.5 h-3.5 text-cyan-400"/>
            <span className="text-cyan-400 text-xs font-bold tracking-wide">Intelligence · Predictions · Live Data</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-black tracking-tight mb-4 leading-none">
            <span className="text-white">Analyse</span>{' '}
            <span style={{ background:'linear-gradient(135deg,#22d3ee,#a855f7,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Smarter.
            </span>
          </h2>
          <p className="text-slate-500 text-lg mb-10 font-light">Real data. Real predictions. Real intelligence.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button onClick={() => onNavigate('analysis')}
              className="hp-cta-btn-primary group">
              <ZapIcon className="w-4 h-4"/>
              Launch Scorina
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
            </button>
            <button onClick={() => onNavigate('live')}
              className="hp-cta-btn-secondary group">
              <ActivityIcon className="w-4 h-4 text-red-400"/>
              Live Scores
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute h-full w-full rounded-full bg-red-500 opacity-75"/>
                <span className="relative flex rounded-full h-1.5 w-1.5 bg-red-500"/>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          SEO TEXT SECTION
      ══════════════════════════════ */}
      <section style={{ background:'rgba(5,8,16,0.95)', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-black text-white mb-4">AI-Powered Football Predictions & Analytics</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-3xl">
            Scorina AI uses machine learning and real-time data to deliver accurate football match predictions,
            live scores, and deep player analytics across Europe's top leagues including the Premier League,
            La Liga, Bundesliga, Serie A, Ligue 1, and Primeira Liga.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Football Match Predictions',
                text: 'Our AI model analyses team form, xG data, head-to-head records and Elo ratings to predict match outcomes with win probabilities and predicted scores for every fixture.'
              },
              {
                title: 'Live Scores & xG Tracking',
                text: 'Follow matches in real time with live scores, expected goals (xG), team stats and event timelines. Get instant updates across all major European leagues.'
              },
              {
                title: 'Player Intelligence',
                text: 'Browse 2,000+ players with detailed stats, radar charts, position ratings, xG analytics and performance trends across the Premier League, La Liga and more.'
              },
              {
                title: 'Season Simulator',
                text: 'Run 1,000 Monte Carlo simulations to predict final league standings, Champions League qualification chances and relegation probabilities for every team.'
              },
              {
                title: 'Free Football Analytics',
                text: 'Scorina AI is free to use. Create an account to unlock AI Picks, track your prediction accuracy and compete on the leaderboard against other football fans.'
              },
              {
                title: 'Premier League Predictions',
                text: 'Get AI-generated predictions for every Premier League match including win probabilities, predicted scores, xG forecasts and confidence ratings updated daily.'
              },
            ].map((item, i) => (
              <div key={i}>
                <h3 className="text-white font-bold text-sm mb-2">{item.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          FOOTER
      ══════════════════════════════ */}
      <Footer onNavigate={onNavigate}/>

      {/* ══════════════════════════════
          STYLES
      ══════════════════════════════ */}
      <style>{`
        /* ── IQ Badge ── */
        .hp-iq-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg,#22d3ee,#a855f7);
          border-radius: 10px;
          padding: 4px 10px;
          margin-left: 4px;
          box-shadow: 0 0 24px rgba(34,211,238,0.35);
          position: relative;
          top: -4px;
        }
        .hp-iq-badge span {
          font-size: 28px;
          font-weight: 900;
          color: white;
          letter-spacing: -0.04em;
          line-height: 1;
          font-family: 'JetBrains Mono', monospace;
        }
        .hp-iq-badge--sm {
          padding: 2px 7px;
          border-radius: 7px;
          top: -2px;
          box-shadow: 0 0 14px rgba(34,211,238,0.25);
        }
        .hp-iq-badge--sm span { font-size: 18px; }

        /* ── Entrance animations ── */
        @keyframes hpFadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes hpFadeRight {
          from { opacity:0; transform:translateX(24px); }
          to   { opacity:1; transform:translateX(0);    }
        }
        @keyframes hpFloat  { 0%,100%{transform:translateY(0)}    50%{transform:translateY(-10px)} }
        @keyframes hpFloat2 { 0%,100%{transform:translateY(0)}    50%{transform:translateY(-14px)} }
        @keyframes hpFloat3 { 0%,100%{transform:translateY(-6px)} 50%{transform:translateY(6px)}  }

        /* ── Search bar ── */
        .hp-search-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px 10px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .hp-search-wrap:focus-within {
          border-color: rgba(34,211,238,0.3);
          box-shadow: 0 0 0 3px rgba(34,211,238,0.06);
        }
        .hp-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          color: white;
          font-family: 'Outfit', sans-serif;
          min-width: 0;
        }
        .hp-search-input::placeholder { color: #475569; }
        .hp-search-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 9px;
          background: linear-gradient(135deg,#22d3ee,#0891b2);
          color: white;
          font-size: 12px;
          font-weight: 700;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .hp-search-btn:hover { opacity: 0.88; }

        .hp-suggestions {
          position: absolute;
          top: calc(100% + 6px);
          left: 0; right: 0;
          background: rgba(8,12,24,0.98);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
          z-index: 50;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        }
        .hp-suggestion-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          width: 100%;
          transition: background 0.1s;
          text-align: left;
        }
        .hp-suggestion-row:hover { background: rgba(255,255,255,0.05); }

        /* ── Quick nav buttons ── */
        .hp-quick-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.15s;
        }
        .hp-quick-btn:hover {
          color: white;
          background: rgba(255,255,255,0.07);
          border-color: var(--qc, rgba(255,255,255,0.12));
          transform: translateY(-1px);
        }

        /* ── Hero card ── */
        .hp-hero-card {
          position: relative;
          background: rgba(10,14,26,0.88);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          padding: 22px;
          backdrop-filter: blur(30px);
          box-shadow: 0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
        }
        .hp-hero-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .hp-float-card {
          position: absolute;
          background: rgba(8,12,24,0.96);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 16px;
          padding: 14px;
          backdrop-filter: blur(30px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          min-width: 180px;
        }
        .hp-float-card--tr { top: -28px; right: -28px; }
        .hp-float-card--bl { bottom: -28px; left: -20px; }

        .hp-stat-cell {
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          padding: 10px;
          text-align: center;
        }

        /* ── Live pill ── */
        .hp-live-pill {
          position: relative;
          background: rgba(10,14,26,0.85);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 14px 16px;
          transition: all 0.15s;
          overflow: hidden;
        }
        .hp-live-pill:hover {
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }
        .hp-live-pill-inner {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 8px;
        }
        .hp-live-pill-glow {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg,transparent,rgba(239,68,68,0.5),transparent);
        }
        .hp-live-skeleton {
          height: 60px;
          border-radius: 14px;
          background: linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: hpSkeleton 1.5s ease-in-out infinite;
        }
        @keyframes hpSkeleton {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .hp-empty-state {
          padding: 40px 20px;
          text-align: center;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
        }

        /* ── League cards ── */
        .hp-league-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 18px 12px 16px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(10,14,26,0.6);
          overflow: hidden;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .hp-league-card:hover {
          border-color: var(--lc, rgba(255,255,255,0.15));
          transform: translateY(-3px);
          box-shadow: 0 16px 40px -8px color-mix(in srgb, var(--lc,#22d3ee) 30%, transparent);
        }
        @supports not (color: color-mix(in srgb, red 30%, transparent)) {
          .hp-league-card:hover { box-shadow: 0 16px 40px rgba(0,0,0,0.4); }
        }
        .hp-league-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, var(--lc,#22d3ee) 0%, transparent 65%);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .hp-league-card:hover .hp-league-glow { opacity: 0.08; }
        .hp-league-img {
          width: 44px;
          height: 44px;
          object-fit: contain;
          margin-bottom: 10px;
          transition: transform 0.2s;
        }
        .hp-league-card:hover .hp-league-img { transform: scale(1.1); }
        .hp-league-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--lc, #22d3ee);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .hp-league-card:hover .hp-league-bar { opacity: 1; }

        /* ── Feature cards ── */
        .hp-feature-card {
          position: relative;
          padding: 20px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(10,14,26,0.7);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.2s ease;
          cursor: pointer;
          min-height: 200px;
        }
        .hp-feature-card:hover {
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }
        .hp-feature-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 30%, var(--fc,#22d3ee) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .hp-feature-card:hover .hp-feature-glow { opacity: 0.06; }
        .hp-feature-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-bottom: 10px;
        }
        .hp-feature-tag {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          letter-spacing: 0.05em;
          width: fit-content;
        }

        /* ── Prediction cards ── */
        .hp-pred-card {
          padding: 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(10,14,26,0.8);
          border-top: 2px solid var(--pc, #475569);
          transition: all 0.15s;
        }
        .hp-pred-card:hover {
          border-color: var(--pc, #475569);
          transform: translateY(-1px);
        }

        /* ── CTA buttons ── */
        .hp-cta-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 14px;
          background: linear-gradient(135deg,#22d3ee,#0891b2);
          color: white;
          font-size: 15px;
          font-weight: 700;
          box-shadow: 0 8px 32px rgba(34,211,238,0.25);
          transition: all 0.2s;
        }
        .hp-cta-btn-primary:hover {
          box-shadow: 0 12px 40px rgba(34,211,238,0.4);
          transform: translateY(-1px);
        }
        .hp-cta-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: white;
          font-size: 15px;
          font-weight: 700;
          transition: all 0.2s;
        }
        .hp-cta-btn-secondary:hover {
          background: rgba(255,255,255,0.09);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}