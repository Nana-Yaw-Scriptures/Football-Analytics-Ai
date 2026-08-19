import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import NavBar from '../components/NavBar';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const I = ({ d, className = "w-5 h-5" }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>);
const RefreshIcon     = (p) => <I {...p} d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>}/>;
const ClockIcon       = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const CalendarIcon    = (p) => <I {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
const ZapIcon         = (p) => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const ShieldIcon      = (p) => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const ChevronRightIcon= (p) => <I {...p} d={<polyline points="9 18 15 12 9 6"/>}/>;
const ChevronLeftIcon = (p) => <I {...p} d={<polyline points="15 18 9 12 15 6"/>}/>;
const AlertIcon       = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}/>;
const ActivityIcon    = (p) => <I {...p} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>;
const GlobeIcon       = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}/>;
const TargetIcon      = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const CheckIcon       = (p) => <I {...p} d={<><polyline points="20 6 9 17 4 12"/></>}/>;
const SearchIcon      = (p) => <I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const XIcon           = (p) => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const TrendingUpIcon  = (p) => <I {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const UsersIcon       = (p) => <I {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;

const LEAGUES = [
  { name:'All Leagues',      key:'' },
  { name:'Premier League',   key:'Premier League' },
  { name:'La Liga',          key:'La Liga' },
  { name:'Bundesliga',       key:'Bundesliga' },
  { name:'Serie A',          key:'Serie A' },
  { name:'Ligue 1',          key:'Ligue 1' },
  { name:'Primeira Liga',    key:'Primeira Liga' },
  { name:'Champions League', key:'Champions League' },
];
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
  'Premier League':'#7c3aed','La Liga':'#dc2626','Bundesliga':'#d97706',
  'Serie A':'#059669','Ligue 1':'#2563eb','Primeira Liga':'#10b981',
  'Champions League':'#1d4ed8',
};
const INTL_LEAGUES = [
  { name: 'All International',          key: '' },
  {/* name: 'World Cup',                   key: 'World Cup',                    logo: 'https://media.api-sports.io/football/leagues/1.png' */},
  { name: 'UEFA Nations League',         key: 'UEFA Nations League',          logo: 'https://media.api-sports.io/football/leagues/5.png'  },
  { name: 'World Cup Qualifiers - UEFA', key: 'World Cup Qualifiers - UEFA',  logo: 'https://media.api-sports.io/football/leagues/9.png'  },
  { name: 'World Cup Qualifiers - CAF',  key: 'World Cup Qualifiers - CAF',   logo: 'https://media.api-sports.io/football/leagues/29.png' },
  { name: 'World Cup Qualifiers - CONMEBOL', key: 'World Cup Qualifiers - CONMEBOL', logo: 'https://media.api-sports.io/football/leagues/35.png' },
  { name: 'AFCON',                       key: 'AFCON',                        logo: 'https://media.api-sports.io/football/leagues/6.png'  },
  { name: 'Copa America',                key: 'Copa America',                 logo: 'https://media.api-sports.io/football/leagues/9.png'  },
  { name: 'International Friendly',      key: 'International Friendly',       logo: 'https://media.api-sports.io/football/leagues/10.png' },
];
// World Cup fixtures (/wc/fixtures) → live-scores fixture shape, so the
// existing international cards and the 'World Cup' filter render them.
{/*const WC_LOGO = 'https://media.api-sports.io/football/leagues/1.png';
const mapWcToLive = (f) => ({
  id: f.id, date: f.date, venue: f.venue,
  league: 'World Cup', leagueLogo: WC_LOGO, round: f.round,
  status: f.status, elapsed: f.minute, statusLong: '',
  homeTeam: f.homeTeam, homeLogo: f.homeLogo,
  awayTeam: f.awayTeam, awayLogo: f.awayLogo,
  homeGoals: f.homeScore, awayGoals: f.awayScore,
  htHome: null, htAway: null,
});*/}
const STATUS_CONFIG = {
  '1H': {label:'LIVE',    color:'#ef4444',pulse:true, bg:'rgba(239,68,68,0.12)', border:'rgba(239,68,68,0.25)'},
  '2H': {label:'LIVE',    color:'#ef4444',pulse:true, bg:'rgba(239,68,68,0.12)', border:'rgba(239,68,68,0.25)'},
  'HT': {label:'HT',      color:'#f59e0b',pulse:false,bg:'rgba(245,158,11,0.12)',border:'rgba(245,158,11,0.25)'},
  'ET': {label:'EXTRA',   color:'#ef4444',pulse:true, bg:'rgba(239,68,68,0.12)', border:'rgba(239,68,68,0.25)'},
  'P':  {label:'PENS',    color:'#a855f7',pulse:true, bg:'rgba(168,85,247,0.12)',border:'rgba(168,85,247,0.25)'},
  'FT': {label:'FT',      color:'#64748b',pulse:false,bg:'rgba(100,116,139,0.08)',border:'rgba(100,116,139,0.15)'},
  'AET':{label:'AET',     color:'#64748b',pulse:false,bg:'rgba(100,116,139,0.08)',border:'rgba(100,116,139,0.15)'},
  'PEN':{label:'PEN',     color:'#64748b',pulse:false,bg:'rgba(100,116,139,0.08)',border:'rgba(100,116,139,0.15)'},
  'NS': {label:'Upcoming',color:'#22d3ee',pulse:false,bg:'rgba(34,211,238,0.08)', border:'rgba(34,211,238,0.15)'},
  'TBD':{label:'TBD',     color:'#475569',pulse:false,bg:'rgba(71,85,105,0.08)',  border:'rgba(71,85,105,0.15)'},
  'PST':{label:'PST',     color:'#f97316',pulse:false,bg:'rgba(249,115,22,0.08)', border:'rgba(249,115,22,0.15)'},
  'CANC':{label:'CANC',   color:'#7f1d1d',pulse:false,bg:'rgba(127,29,29,0.08)',  border:'rgba(127,29,29,0.15)'},
};
const isLive      = (s) => ['1H','2H','HT','ET','P'].includes(s);
const isFinished  = (s) => ['FT','AET','PEN'].includes(s);
const isUpcomingS = (s) => ['NS','TBD'].includes(s);

/* ── Status Badge ── */
const StatusBadge = ({ status, elapsed }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NS;
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{background:cfg.bg,border:`1px solid ${cfg.border}`}}>
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.pulse?'animate-pulse':''}`} style={{background:cfg.color}}/>
      <span className="text-[11px] font-black uppercase tracking-wider" style={{color:cfg.color,fontFamily:'JetBrains Mono'}}>
        {isLive(status)&&elapsed?`${elapsed}'`:cfg.label}
      </span>
    </div>
  );
};

/* ── Goal Toast ── */
const GoalToast = ({ toasts, onDismiss }) => (
  <div className="fixed top-20 right-4 z-[200] space-y-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl"
        style={{background:'rgba(8,12,24,0.97)',borderColor:'rgba(245,158,11,0.4)',boxShadow:'0 0 30px rgba(245,158,11,0.18)',animation:'toastSlide 0.35s cubic-bezier(0.16,1,0.3,1)'}}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'rgba(245,158,11,0.15)',border:'1px solid rgba(245,158,11,0.3)'}}>
          <TargetIcon className="w-4 h-4 text-yellow-400"/>
        </div>
        <div className="min-w-0">
          <p className="text-yellow-400 font-black text-sm">⚽ Goal Scored!</p>
          <p className="text-white text-xs font-semibold truncate">{t.home} <span className="text-yellow-300 font-black" style={{fontFamily:'JetBrains Mono'}}>{t.score}</span> {t.away}</p>
        </div>
        <button onClick={() => onDismiss(t.id)} className="text-slate-500 hover:text-white transition-colors flex-shrink-0 ml-1">
          <XIcon className="w-3.5 h-3.5"/>
        </button>
      </div>
    ))}
  </div>
);

/* ── Prediction Badge ── */
const PredBadge = ({ pred }) => {
  if (!pred) return null;
  const winner = pred.home_win > pred.away_win ? 'H' : pred.away_win > pred.home_win ? 'A' : 'D';
  const pct    = Math.round(Math.max(pred.home_win, pred.away_win, pred.draw) * 100);
  const color  = winner==='H'?'#22d3ee':winner==='A'?'#a855f7':'#f59e0b';
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0" style={{background:`${color}10`,border:`1px solid ${color}22`}}>
      <TrendingUpIcon className="w-3 h-3 flex-shrink-0" style={{color}}/>
      <span className="text-[11px] font-black whitespace-nowrap" style={{color,fontFamily:'JetBrains Mono'}}>{winner} {pct}%</span>
    </div>
  );
};

/* ── H2H Popover ── */
const H2HPopover = ({ data }) => {
  if (!data || !data.length) return null;
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-72 z-50 rounded-2xl border shadow-2xl overflow-hidden"
      style={{background:'rgba(6,10,22,0.99)',borderColor:'rgba(255,255,255,0.1)',animation:'popIn 0.18s ease-out'}}>
      <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2" style={{background:'rgba(255,255,255,0.03)'}}>
        <UsersIcon className="w-3.5 h-3.5 text-purple-400"/>
        <span className="text-white font-black text-[11px] uppercase tracking-[0.15em]">Last 5 H2H</span>
      </div>
      {data.slice(0,5).map((m,i) => {
        const d    = new Date(m.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'});
        const isDraw = m.homeGoals === m.awayGoals;
        const hw   = m.homeGoals > m.awayGoals;
        return (
          <div key={i} className="flex items-center gap-2 px-4 py-2.5 border-b last:border-0" style={{borderColor:'rgba(255,255,255,0.04)'}}>
            <span className="text-[10px] text-slate-600 w-14 flex-shrink-0">{d}</span>
            <span className={`text-[11px] truncate flex-1 text-right ${hw?'text-white font-semibold':'text-slate-500'}`}>{m.homeTeam?.replace(/ FC$/,'')}</span>
            <span className="text-[11px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0" style={{fontFamily:'JetBrains Mono',background:isDraw?'rgba(245,158,11,0.15)':hw?'rgba(34,211,238,0.12)':'rgba(168,85,247,0.12)',color:isDraw?'#f59e0b':hw?'#22d3ee':'#a855f7'}}>{m.homeGoals}-{m.awayGoals}</span>
            <span className={`text-[11px] truncate flex-1 ${!hw&&!isDraw?'text-white font-semibold':'text-slate-500'}`}>{m.awayTeam?.replace(/ FC$/,'')}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */
function LiveScoresPage({ onNavigate }) {
  const [activeView,       setActiveView]       = useState('today');
  const [filterLeague,     setFilterLeague]     = useState('');
  const [searchQuery,      setSearchQuery]      = useState('');
  const [dateOffset,       setDateOffset]       = useState(0);
  const [todayFixtures,    setTodayFixtures]    = useState([]);
  const [liveFixtures,     setLiveFixtures]     = useState([]);
  const [upcomingFixtures, setUpcomingFixtures] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [lastUpdated,      setLastUpdated]      = useState(null);
  const [error,            setError]            = useState('');
  const [goalsToday,       setGoalsToday]       = useState([]);
  const [toasts,           setToasts]           = useState([]);
  const [predictions,      setPredictions]      = useState({});
  const [h2hCache,         setH2hCache]         = useState({});
  const [hoveredFixture,   setHoveredFixture]   = useState(null);
  const prevScoresRef  = useRef({});
  const refreshTimerRef= useRef(null);
  const [mainTab,          setMainTab]          = useState('leagues');    // 'leagues' | 'international'
  const [intlFixtures,     setIntlFixtures]     = useState([]);
  const [intlLoading,      setIntlLoading]      = useState(false);
  const [filterIntl,       setFilterIntl]       = useState('');

  const getDateStr = (offset = 0) => {
    const d = new Date(); d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };
  const dateLabel = dateOffset === 0 ? 'Today' : dateOffset === -1 ? 'Yesterday' : dateOffset === 1 ? 'Tomorrow' : getDateStr(dateOffset);

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const leagueQ  = filterLeague ? `league=${encodeURIComponent(filterLeague)}` : '';
      const leagueSep= leagueQ ? '&' : '';
      if (activeView === 'live') {
        const resp = await fetchWithTimeout(`${API_BASE}/live/now`).then(r => r.json());
        setLiveFixtures(Array.isArray(resp) ? resp : []);
      } else if (activeView === 'upcoming') {
        const resp = await fetchWithTimeout(`${API_BASE}/live/upcoming${leagueQ?'?'+leagueQ:''}`).then(r => r.json());
        setUpcomingFixtures(Array.isArray(resp) ? resp : []);
      } else {
        const base = dateOffset !== 0
          ? `${API_BASE}/live/date?date=${getDateStr(dateOffset)}${leagueSep}${leagueQ}`
          : `${API_BASE}/live/today${leagueQ?'?'+leagueQ:''}`;
        const resp = await fetchWithTimeout(base).then(r => r.json());
        const arr  = Array.isArray(resp) ? resp : [];
        // Goal change detection → toasts
        arr.forEach(f => {
          const key      = String(f.id);
          const curScore = `${f.homeGoals}-${f.awayGoals}`;
          const prev     = prevScoresRef.current[key];
          if (prev && prev !== curScore && isLive(f.status)) {
            const tid = Date.now() + Math.random();
            setToasts(ts => [...ts.slice(-3), {id:tid, home:f.homeTeam?.split(' ')[0]||'Home', away:f.awayTeam?.split(' ')[0]||'Away', score:curScore}]);
            setTimeout(() => setToasts(ts => ts.filter(t => t.id !== tid)), 5000);
          }
          prevScoresRef.current[key] = curScore;
        });
        setTodayFixtures(arr);
        setLiveFixtures(arr.filter(f => isLive(f.status)));
        // Build goals ticker from event data
        const goals = [];
        arr.forEach(f => (f.events||[]).filter(e=>e.type==='Goal'&&e.detail!=='Missed Penalty').forEach(e => {
          goals.push({player:e.player, team:e.team, time:`${e.time}'`, score:`${f.homeTeam?.split(' ')[0]} ${f.homeGoals}-${f.awayGoals} ${f.awayTeam?.split(' ')[0]}`});
        }));
        setGoalsToday(goals);
      }
      setLastUpdated(new Date());
    } catch { setError('Failed to fetch fixtures. Is the backend running?'); }
    finally  { setLoading(false); }
  }, [filterLeague, activeView, dateOffset]);

  useEffect(() => {
    fetchData(true);
    refreshTimerRef.current = setInterval(() => fetchData(false), 300000); // 5min — reduces layout jumps
    return () => clearInterval(refreshTimerRef.current);
  }, [fetchData]);

  const fetchInternational = useCallback(async () => {
    setIntlLoading(true);
    try {
      const dateStr = getDateStr(dateOffset);
      const url = activeView === 'upcoming'
        ? `${API_BASE}/live/international/upcoming`
        : `${API_BASE}/live/international?date=${dateStr}`;
     const resp = await fetchWithTimeout(url).then(r => r.ok ? r.json() : []).catch(() => []);
      const intl = Array.isArray(resp) ? resp : [];
      setIntlFixtures(intl);
    } catch {
      setIntlFixtures([]);
    }
    setIntlLoading(false);
  }, [dateOffset, activeView]);
 
  useEffect(() => {
    if (mainTab === 'international') fetchInternational();
  }, [mainTab, fetchInternational]);

  // Fetch ML predictions for visible fixtures (up to 8 at a time)
  useEffect(() => {
    const toPredict = todayFixtures.filter(f => f.homeTeam && f.awayTeam && !predictions[f.id]).slice(0, 8);
    if (!toPredict.length) return;
    toPredict.forEach(async (f) => {
      try {
        const r = await fetchWithTimeout(`${API_BASE}/predict/match`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({homeTeam:f.homeTeam, awayTeam:f.awayTeam, league:f.league||'Premier League'}),
        });
        if (r.ok) { const d = await r.json(); setPredictions(prev => ({...prev, [f.id]:d})); }
      } catch {}
    });
  }, [todayFixtures.length]);

  // H2H on hover
  const fetchH2H = async (fix) => {
    const key = `${fix.homeTeam}__${fix.awayTeam}`;
    if (h2hCache[key] !== undefined) return;
    setH2hCache(prev => ({...prev, [key]:null})); // mark loading
    try {
      const r = await fetchWithTimeout(`${API_BASE}/h2h/${encodeURIComponent(fix.homeTeam)}/${encodeURIComponent(fix.awayTeam)}`);
      if (r.ok) { const d = await r.json(); setH2hCache(prev => ({...prev, [key]:d.matches||[]})); }
    } catch {}
  };

  const getVisibleFixtures = () => {
    let fx = activeView==='today'?todayFixtures:activeView==='live'?liveFixtures:upcomingFixtures;
    if (filterLeague) fx = fx.filter(f => f.league === filterLeague);
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); fx = fx.filter(f => f.homeTeam?.toLowerCase().includes(q)||f.awayTeam?.toLowerCase().includes(q)); }
    return fx;
  };

  const fixtures  = getVisibleFixtures();
  const liveCount = todayFixtures.filter(f => isLive(f.status)).length;

  const groupedFixtures = {};
  fixtures.forEach(f => { const k=f.league||'Other'; if(!groupedFixtures[k]) groupedFixtures[k]=[]; groupedFixtures[k].push(f); });

  const formatKickoff = (d) => d ? new Date(d).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}) : '';

  return (
    <div className="min-h-screen bg-[#050810] text-white overflow-x-hidden" style={{fontFamily:"'Outfit', sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[700px] h-[700px] rounded-full blur-[140px]" style={{background:'radial-gradient(circle,rgba(239,68,68,0.07) 0%,transparent 70%)'}}/>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px]" style={{background:'radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 70%)'}}/>
        <div className="absolute inset-0 opacity-[0.018]" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
      </div>

      <GoalToast toasts={toasts} onDismiss={id => setToasts(ts => ts.filter(t => t.id !== id))}/>

      <NavBar currentPage="live" onNavigate={onNavigate}>
        {liveCount > 0 && (
          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border" style={{background:'rgba(239,68,68,0.1)',borderColor:'rgba(239,68,68,0.25)',color:'#ef4444'}}>
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/>{liveCount} LIVE
          </span>
        )}
        <button onClick={() => fetchData(false)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all border" style={{background:'rgba(255,255,255,0.04)',borderColor:'rgba(255,255,255,0.08)',color:'#64748b'}}>
          <RefreshIcon className="w-4 h-4"/>
        </button>
        
      </NavBar>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-5 md:px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"/></span>
            <span className="text-red-400 text-xs font-bold uppercase tracking-[0.2em]">Real-Time · Auto-Refresh</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-3">
            Live <span style={{background:'linear-gradient(135deg,#ef4444,#f97316)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Scores</span>
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-slate-400 text-sm">Europe's top leagues · Updated every 2 minutes</p>
            {lastUpdated && <span className="flex items-center gap-1.5 text-[12px] text-slate-600"><ClockIcon className="w-3 h-3"/>{lastUpdated.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</span>}
          </div>
        </div>

          {/* ── MAIN TAB SWITCHER ── */}
        <div className="flex gap-2 mb-5 rounded-2xl p-1.5 border border-white/[0.06]" style={{background:'rgba(10,14,26,0.6)'}}>
          {[
            { id: 'leagues',       label: '🏆 Leagues',       color: '#22d3ee' },
            { id: 'international', label: '🌍 International',  color: '#10b981' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setMainTab(tab.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border"
              style={{
                background:   mainTab === tab.id ? `${tab.color}15` : 'transparent',
                borderColor:  mainTab === tab.id ? `${tab.color}35` : 'transparent',
                color:        mainTab === tab.id ? tab.color : '#64748b',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
          {mainTab === 'leagues' && <>
          
        {/* ── GOALS TICKER ── */}
        {goalsToday.length > 0 && (
          <div className="mb-5 rounded-2xl border overflow-hidden" style={{background:'rgba(245,158,11,0.06)',borderColor:'rgba(245,158,11,0.2)'}}>
            <div className="flex items-center h-10">
              <div className="flex items-center gap-2 px-3 h-full flex-shrink-0 border-r" style={{borderColor:'rgba(245,158,11,0.2)',background:'rgba(245,158,11,0.12)'}}>
                <TargetIcon className="w-3.5 h-3.5 text-yellow-400"/>
                <span className="text-yellow-400 text-[11px] font-black uppercase tracking-widest whitespace-nowrap">Goals</span>
              </div>
              <div className="flex-1 overflow-hidden px-4">
                <div style={{display:'flex',gap:'2.5rem',animation:`ticker ${Math.max(goalsToday.length*5,14)}s linear infinite`,whiteSpace:'nowrap',willChange:'transform',contain:'layout'}}>
                  {[...goalsToday,...goalsToday].map((g,i) => (
                    <span key={i} className="text-[12px] inline-flex items-center gap-2 flex-shrink-0">
                      <span className="text-yellow-400 font-black">{g.player}</span>
                      <span className="text-slate-500">{g.time}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-300">{g.score}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STATS BAR ── */}
        {todayFixtures.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              {label:'Matches', value:todayFixtures.length,                                                        color:'#22d3ee',Icon:CalendarIcon},
              {label:'Live',    value:liveCount,                                                                   color:'#ef4444',Icon:ActivityIcon},
              {label:'Done',    value:todayFixtures.filter(f=>isFinished(f.status)).length,                       color:'#10b981',Icon:CheckIcon   },
              {label:'Goals',   value:todayFixtures.reduce((s,f)=>s+(f.homeGoals||0)+(f.awayGoals||0),0),        color:'#f59e0b',Icon:TargetIcon  },
            ].map((s,i) => (
              <div key={i} className="rounded-2xl p-3 text-center border relative overflow-hidden" style={{background:`linear-gradient(135deg,${s.color}10,rgba(5,8,16,0.95))`,borderColor:`${s.color}20`}}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{background:`linear-gradient(90deg,transparent,${s.color}50,transparent)`}}/>
                <s.Icon className="w-4 h-4 mx-auto mb-1" style={{color:s.color}}/>
                <p className="text-xl font-black" style={{fontFamily:'JetBrains Mono',color:s.color}}>{s.value}</p>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── DATE NAVIGATION ── */}
        <div className="flex items-center gap-2 mb-4 rounded-2xl p-2 border border-white/[0.06]" style={{background:'rgba(10,14,26,0.5)'}}>
          <button onClick={() => { setDateOffset(d => d-1); }} className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all" style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)',color:'#64748b'}}>
            <ChevronLeftIcon className="w-4 h-4"/>
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <span className="text-white font-black text-sm">{dateLabel}</span>
            <span className="text-slate-600 text-[12px]">{getDateStr(dateOffset)}</span>
          </div>
          <button onClick={() => { if(dateOffset < 1) setDateOffset(d => d+1); }} disabled={dateOffset >= 1} className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all disabled:opacity-30" style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)',color:'#64748b'}}>
            <ChevronRightIcon className="w-4 h-4"/>
          </button>
          {dateOffset !== 0 && (
            <button onClick={() => setDateOffset(0)} className="px-3 py-1.5 rounded-xl text-[12px] font-black border transition-all" style={{background:'rgba(34,211,238,0.08)',borderColor:'rgba(34,211,238,0.2)',color:'#22d3ee'}}>Today</button>
          )}
        </div>

        {/* ── SEARCH ── */}
        <div className="relative mb-4">
          <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search any team name…"
            className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white border outline-none"
            style={{background:'rgba(255,255,255,0.04)',borderColor:searchQuery?'rgba(34,211,238,0.3)':'rgba(255,255,255,0.08)',fontFamily:'Outfit'}}/>
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"><XIcon className="w-4 h-4"/></button>}
        </div>

        {/* ── VIEW TABS ── */}
        <div className="flex gap-1.5 mb-4 rounded-2xl p-1.5 border border-white/[0.06]" style={{background:'rgba(10,14,26,0.6)'}}>
          {[
            {id:'today',    label:"Today",   icon:CalendarIcon, count:todayFixtures.length   },
            {id:'live',     label:'Live',    icon:ZapIcon,      count:liveFixtures.length    },
            {id:'upcoming', label:'Upcoming',icon:ClockIcon,    count:upcomingFixtures.length},
          ].map(tab => {
            const isActive = activeView === tab.id;
            const ac = tab.id==='live'?'#ef4444':'#22d3ee';
            return (
              <button key={tab.id} onClick={() => setActiveView(tab.id)}
                className="relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all overflow-hidden"
                style={{background:isActive?`${ac}18`:'transparent',border:isActive?`1px solid ${ac}35`:'1px solid transparent',color:isActive?ac:'#64748b',boxShadow:isActive?`0 4px 20px ${ac}15`:'none'}}>
                {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{background:`linear-gradient(90deg,transparent,${ac},transparent)`}}/>}
                <tab.icon className="w-4 h-4 flex-shrink-0"/>
                {tab.label}
                {tab.count > 0 && <span className="px-1.5 py-0.5 rounded-md text-[11px] font-black" style={{fontFamily:'JetBrains Mono',background:`${ac}15`,color:ac}}>{tab.count}</span>}
              </button>
            );
          })}
        </div>

        {/* ── LEAGUE FILTER ── */}
        <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
          {LEAGUES.map(l => {
            const isActive = filterLeague === l.key;
            const c = LEAGUE_COLOR[l.key] || '#22d3ee';
            return (
              <button key={l.key} onClick={() => setFilterLeague(l.key)}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all flex-shrink-0"
                style={{background:isActive?`${c}18`:'rgba(255,255,255,0.03)',border:isActive?`1px solid ${c}35`:'1px solid rgba(255,255,255,0.06)',color:isActive?'white':'#64748b'}}>
                {l.key && LEAGUE_IMG[l.key]
                  ? <img src={LEAGUE_IMG[l.key]} alt="" className="w-4 h-4 object-contain flex-shrink-0" style={{opacity:isActive?1:0.5}}/>
                  : <GlobeIcon className="w-3.5 h-3.5 flex-shrink-0"/>}
                {l.key?l.key.replace(' League','').replace('Premier','EPL').replace('Champions','UCL'):'All'}
                {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{background:c}}/>}
              </button>
            );
          })}
        </div>

        {/* Error / Loading */}
        {error && (
          <div className="rounded-2xl p-4 mb-5 border border-red-500/20 flex items-start gap-3" style={{background:'rgba(239,68,68,0.06)'}}>
            <AlertIcon className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"/>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        {loading && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-5 relative">
              <div className="absolute inset-0 rounded-full border-2" style={{borderColor:'rgba(239,68,68,0.2)'}}/>
              <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:'rgba(239,68,68,0.7)',borderTopColor:'transparent'}}/>
              <div className="absolute inset-2 rounded-full border-2 border-b-transparent animate-spin" style={{borderColor:'rgba(168,85,247,0.5)',borderBottomColor:'transparent',animationDirection:'reverse',animationDuration:'1.5s'}}/>
              <ActivityIcon className="w-5 h-5 text-red-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
            </div>
            <p className="text-white font-bold">Loading Fixtures</p>
            <p className="text-slate-500 text-sm mt-1">Fetching from API-Football...</p>
          </div>
        )}

        {/* ── FIXTURE GROUPS ── */}
        {!loading && Object.keys(groupedFixtures).length > 0 && (
          <div className="space-y-6">
            {Object.entries(groupedFixtures).map(([league, leagueFixtures]) => {
              const lc = LEAGUE_COLOR[league] || '#22d3ee';
              return (
                <div key={league}>
                  {/* League header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {LEAGUE_IMG[league] ? <img src={LEAGUE_IMG[league]} alt="" className="w-6 h-6 object-contain"/> : <ShieldIcon className="w-5 h-5 text-slate-500"/>}
                      <h2 className="text-white font-black text-sm">{league}</h2>
                    </div>
                    {leagueFixtures[0]?.round && <span className="text-[11px] text-slate-500 px-2 py-0.5 rounded-md border border-white/[0.06]" style={{background:'rgba(255,255,255,0.03)'}}>{leagueFixtures[0].round}</span>}
                    <div className="flex-1 h-px" style={{background:`linear-gradient(90deg,${lc}30,transparent)`}}/>
                    <span className="text-[11px] font-black" style={{color:lc}}>{leagueFixtures.length}</span>
                  </div>

                  <div className="space-y-1.5">
                    {leagueFixtures.map((fix, idx) => {
                      const live     = isLive(fix.status);
                      const finished = isFinished(fix.status);
                      const upcoming = isUpcomingS(fix.status)||(!fix.status&&fix.homeGoals==null);
                      const homeWon  = finished && fix.homeGoals > fix.awayGoals;
                      const awayWon  = finished && fix.awayGoals > fix.homeGoals;
                      const h2hKey   = `${fix.homeTeam}__${fix.awayTeam}`;
                      const pred     = predictions[fix.id];
                      const isHovered= hoveredFixture === fix.id;

                      return (
                        <div key={fix.id||idx} className="relative">
                          <div
                            onClick={() => fix.id && onNavigate('match',{fixtureId:fix.id})}
                            onMouseEnter={() => { setHoveredFixture(fix.id); fetchH2H(fix); }}
                            onMouseLeave={() => setHoveredFixture(null)}
                            className="relative rounded-2xl border transition-all cursor-pointer overflow-hidden"
                            style={{background:live?'linear-gradient(135deg,rgba(239,68,68,0.06),rgba(5,8,16,0.9))':'rgba(10,14,26,0.7)',borderColor:live?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.06)',backdropFilter:'blur(12px)'}}>
                            {live && <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl" style={{background:'linear-gradient(180deg,#ef4444,#f97316)'}}/>}

                            <div className="flex items-center gap-3 px-4 py-3.5">
                              {/* Status / Time */}
                              <div className="w-20 flex-shrink-0">
                                {upcoming ? (
                                  <div className="text-center">
                                    <span className="text-[13px] font-black text-cyan-400 block" style={{fontFamily:'JetBrains Mono'}}>{formatKickoff(fix.date)}</span>
                                    <span className="text-[11px] text-slate-600 block">{fix.date?new Date(fix.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):''}</span>
                                  </div>
                                ) : (
                                  <div className="flex justify-center"><StatusBadge status={fix.status} elapsed={fix.elapsed}/></div>
                                )}
                              </div>

                              {/* Home */}
                              <div className="flex-1 flex items-center gap-2.5 justify-end min-w-0">
                                <span className={`text-sm font-bold text-right truncate ${homeWon?'text-white':finished?'text-slate-500':'text-white'}`}>{fix.homeTeam}</span>
                                {fix.homeLogo
                                  ? <img src={fix.homeLogo} alt="" className="w-8 h-8 object-contain flex-shrink-0 rounded-lg p-0.5" style={{background:'rgba(255,255,255,0.04)'}} onError={e=>e.target.style.display='none'}/>
                                  : <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(255,255,255,0.04)'}}><ShieldIcon className="w-4 h-4 text-slate-600"/></div>}
                              </div>

                              {/* Score */}
                              <div className="w-24 flex-shrink-0 text-center">
                                {upcoming ? (
                                  <span className="text-base font-black text-slate-600">vs</span>
                                ) : (
                                  <div className="px-3 py-1.5 rounded-xl" style={{background:live?'rgba(239,68,68,0.12)':'rgba(255,255,255,0.04)',border:live?'1px solid rgba(239,68,68,0.2)':'1px solid rgba(255,255,255,0.06)'}}>
                                    <span className="text-lg font-black text-white" style={{fontFamily:'JetBrains Mono'}}>{fix.homeGoals??0} - {fix.awayGoals??0}</span>
                                  </div>
                                )}
                              </div>

                              {/* Away */}
                              <div className="flex-1 flex items-center gap-2.5 min-w-0">
                                {fix.awayLogo
                                  ? <img src={fix.awayLogo} alt="" className="w-8 h-8 object-contain flex-shrink-0 rounded-lg p-0.5" style={{background:'rgba(255,255,255,0.04)'}} onError={e=>e.target.style.display='none'}/>
                                  : <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(255,255,255,0.04)'}}><ShieldIcon className="w-4 h-4 text-slate-600"/></div>}
                                <span className={`text-sm font-bold truncate ${awayWon?'text-white':finished?'text-slate-500':'text-white'}`}>{fix.awayTeam}</span>
                              </div>

                              {/* ML Prediction badge */}
                              {pred && <PredBadge pred={pred}/>}

                              {/* HT / Venue */}
                              <div className="hidden md:block w-20 flex-shrink-0 text-right">
                                {finished&&fix.htHome!=null
                                  ? <span className="text-[11px] text-slate-600" style={{fontFamily:'JetBrains Mono'}}>HT {fix.htHome}-{fix.htAway}</span>
                                  : upcoming&&fix.venue
                                  ? <span className="text-[11px] text-slate-600 truncate block">{fix.venue}</span>
                                  : null}
                              </div>

                              <ChevronRightIcon className="w-4 h-4 flex-shrink-0" style={{color:'rgba(100,116,139,0.4)'}}/>
                            </div>

                            {/* Win probability bar */}
                            {pred && (
                              <div className="flex h-0.5">
                                <div style={{width:`${pred.home_win*100}%`,background:'#22d3ee',transition:'width 1s ease'}}/>
                                <div style={{width:`${pred.draw*100}%`,background:'#f59e0b'}}/>
                                <div style={{width:`${pred.away_win*100}%`,background:'#a855f7'}}/>
                              </div>
                            )}
                          </div>

                          {/* H2H Popover */}
                          {isHovered && h2hCache[h2hKey] && h2hCache[h2hKey].length > 0 && (
                            <H2HPopover data={h2hCache[h2hKey]}/>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty */}
        {!loading && fixtures.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center border" style={{background:'rgba(239,68,68,0.06)',borderColor:'rgba(239,68,68,0.15)'}}>
              {searchQuery?<SearchIcon className="w-8 h-8 text-slate-700"/>:activeView==='live'?<ZapIcon className="w-8 h-8 text-slate-700"/>:<CalendarIcon className="w-8 h-8 text-slate-700"/>}
            </div>
            <p className="text-white font-black text-lg mb-2">
              {searchQuery?`No matches for "${searchQuery}"`:activeView==='live'?'No Live Matches':activeView==='today'?'No Matches Today':'No Upcoming Fixtures'}
            </p>
            <p className="text-slate-500 text-sm mb-5">
              {searchQuery?'Try a different team name.':filterLeague?`No fixtures for ${filterLeague}.`:'No fixtures found.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {searchQuery && <button onClick={()=>setSearchQuery('')} className="px-5 py-2.5 rounded-xl text-sm font-bold border" style={{background:'rgba(34,211,238,0.08)',borderColor:'rgba(34,211,238,0.2)',color:'#22d3ee'}}>Clear Search</button>}
              {activeView==='live'&&todayFixtures.length>0 && <button onClick={()=>setActiveView('today')} className="px-5 py-2.5 rounded-xl text-sm font-bold border" style={{background:'rgba(34,211,238,0.08)',borderColor:'rgba(34,211,238,0.2)',color:'#22d3ee'}}>Today ({todayFixtures.length})</button>}
            </div>
          </div>
        )}
          </>}
        
        {/* ── INTERNATIONAL TAB ── */}
        {mainTab === 'international' && (
          <div>
            {/* International league filter */}
            <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
              {INTL_LEAGUES.map(l => (
                <button key={l.key} onClick={() => setFilterIntl(l.key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all flex-shrink-0 border"
                  style={{
                    background:  filterIntl === l.key ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                    borderColor: filterIntl === l.key ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.06)',
                    color:       filterIntl === l.key ? '#10b981' : '#64748b',
                  }}>
                  {l.logo && <img src={l.logo} alt="" className="w-4 h-4 object-contain flex-shrink-0" onError={e=>e.target.style.display='none'}/>}
                  {l.name === 'All International' ? 'All' : l.name.replace('World Cup Qualifiers - ', 'WCQ ')}
                </button>
              ))}
            </div>
 
            {intlLoading && (
              <div className="text-center py-20">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"/>
                <p className="text-slate-400">Loading international fixtures…</p>
              </div>
            )}
 
            {!intlLoading && (() => {
              const filtered = intlFixtures.filter(f => !filterIntl || f.league === filterIntl);
              const grouped = {};
              filtered.forEach(f => { const k = f.league || 'Other'; if (!grouped[k]) grouped[k] = []; grouped[k].push(f); });
 
              if (Object.keys(grouped).length === 0) return (
                <div className="text-center py-20 rounded-2xl border border-white/8" style={{background:'rgba(17,24,39,0.5)'}}>
                  <div className="text-4xl mb-4">🌍</div>
                  <p className="text-white font-bold text-lg mb-2">No International Fixtures</p>
                  <p className="text-slate-500 text-sm">No international games scheduled for this date.</p>
                </div>
              );
 
              return (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([league, leagueFixtures]) => (
                    <div key={league}>
                      <div className="flex items-center gap-3 mb-3">
                        {leagueFixtures[0]?.leagueLogo && <img src={leagueFixtures[0].leagueLogo} alt="" className="w-6 h-6 object-contain"/>}
                        <h2 className="text-white font-black text-sm">{league}</h2>
                        <div className="flex-1 h-px" style={{background:'linear-gradient(90deg,rgba(16,185,129,0.3),transparent)'}}/>
                        <span className="text-[11px] font-black text-emerald-400">{leagueFixtures.length}</span>
                      </div>
                      <div className="space-y-1.5">
                        {leagueFixtures.map((fix, idx) => {
                          const live     = isLive(fix.status);
                          const finished = isFinished(fix.status);
                          const upcoming = isUpcomingS(fix.status);
                          const homeWon  = finished && fix.homeGoals > fix.awayGoals;
                          const awayWon  = finished && fix.awayGoals > fix.homeGoals;
                          return (
                            <div key={fix.id||idx}
                              onClick={() => fix.id && onNavigate('match', {fixtureId: fix.id})}
                              className="relative rounded-2xl border transition-all cursor-pointer overflow-hidden"
                              style={{background: live ? 'linear-gradient(135deg,rgba(239,68,68,0.06),rgba(5,8,16,0.9))' : 'rgba(10,14,26,0.7)', borderColor: live ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}}>
                              {live && <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl" style={{background:'linear-gradient(180deg,#ef4444,#f97316)'}}/>}
                              <div className="flex items-center gap-3 px-4 py-3.5">
                                <div className="w-20 flex-shrink-0">
                                  {upcoming ? (
                                    <div className="text-center">
                                      <span className="text-[13px] font-black text-cyan-400 block" style={{fontFamily:'JetBrains Mono'}}>{fix.date ? new Date(fix.date).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}) : ''}</span>
                                      <span className="text-[11px] text-slate-600 block">{fix.date ? new Date(fix.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : ''}</span>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center"><StatusBadge status={fix.status} elapsed={fix.elapsed}/></div>
                                  )}
                                </div>
                                <div className="flex-1 flex items-center gap-2.5 justify-end min-w-0">
                                  <span className={`text-sm font-bold text-right truncate ${homeWon ? 'text-white' : finished ? 'text-slate-500' : 'text-white'}`}>{fix.homeTeam}</span>
                                  {fix.homeLogo && <img src={fix.homeLogo} alt="" className="w-8 h-8 object-contain flex-shrink-0 rounded-lg p-0.5" style={{background:'rgba(255,255,255,0.04)'}} onError={e=>e.target.style.display='none'}/>}
                                </div>
                                <div className="w-24 flex-shrink-0 text-center">
                                  {upcoming ? (
                                    <span className="text-base font-black text-slate-600">vs</span>
                                  ) : (
                                    <div className="px-3 py-1.5 rounded-xl" style={{background: live ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)', border: live ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.06)'}}>
                                      <span className="text-lg font-black text-white" style={{fontFamily:'JetBrains Mono'}}>{fix.homeGoals??0} - {fix.awayGoals??0}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 flex items-center gap-2.5 min-w-0">
                                  {fix.awayLogo && <img src={fix.awayLogo} alt="" className="w-8 h-8 object-contain flex-shrink-0 rounded-lg p-0.5" style={{background:'rgba(255,255,255,0.04)'}} onError={e=>e.target.style.display='none'}/>}
                                  <span className={`text-sm font-bold truncate ${awayWon ? 'text-white' : finished ? 'text-slate-500' : 'text-white'}`}>{fix.awayTeam}</span>
                                </div>
                                <ChevronRightIcon className="w-4 h-4 flex-shrink-0" style={{color:'rgba(100,116,139,0.4)'}}/>
                              </div>
                              {live && <div className="flex h-0.5"><div style={{width:'50%',background:'#ef4444'}}/><div style={{width:'50%',background:'#f97316'}}/></div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <style>{`
        @keyframes ticker   { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes toastSlide{ from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes popIn    { from{opacity:0;transform:translateY(-6px) translateX(-50%)} to{opacity:1;transform:translateY(0) translateX(-50%)} }
      `}</style>
    </div>
  );
}

export default LiveScoresPage;