<<<<<<< HEAD
=======
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import NavBar from '../components/NavBar';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const I = ({ d, className="w-5 h-5" }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>);
const ShieldIcon        = (p) => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const ClockIcon         = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const MapPinIcon        = (p) => <I {...p} d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>}/>;
const UserIcon          = (p) => <I {...p} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>;
const ActivityIcon      = (p) => <I {...p} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>;
const BarChartIcon      = (p) => <I {...p} d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}/>;
const UsersIcon         = (p) => <I {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const AlertIcon         = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}/>;
const RefreshIcon       = (p) => <I {...p} d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>}/>;
const ZapIcon           = (p) => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const TargetIcon        = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const XCircleIcon       = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>}/>;
const RepeatIcon        = (p) => <I {...p} d={<><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>}/>;
const MonitorIcon       = (p) => <I {...p} d={<><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>}/>;
const AlertTriangleIcon = (p) => <I {...p} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>;
const ChevronLeftIcon   = (p) => <I {...p} d={<polyline points="15 18 9 12 15 6"/>}/>;
const TrendingUpIcon    = (p) => <I {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const BrainIcon         = (p) => <I {...p} d={<><path d="M9.5 2A5.5 5.5 0 0 0 5 6a5.5 5.5 0 0 0 .4 2A5.5 5.5 0 0 0 4 13.5a5.5 5.5 0 0 0 3.5 5.1V22h5v-3.4a5.5 5.5 0 0 0 3.5-5.1 5.5 5.5 0 0 0-1.4-5.5A5.5 5.5 0 0 0 15 6a5.5 5.5 0 0 0-5.5-4Z"/><path d="M12 2v20"/></>}/>;
const ListIcon          = (p) => <I {...p} d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>}/>;

const YellowCardSVG     = ({ className="w-5 h-7" }) => (<svg className={className} viewBox="0 0 24 32" fill="none"><rect x="2" y="2" width="20" height="28" rx="3" fill="#EAB308" stroke="#CA8A04" strokeWidth="1"/><rect x="2" y="2" width="20" height="8" rx="3" fill="#FACC15" opacity="0.4"/></svg>);
const RedCardSVG        = ({ className="w-5 h-7" }) => (<svg className={className} viewBox="0 0 24 32" fill="none"><rect x="2" y="2" width="20" height="28" rx="3" fill="#EF4444" stroke="#DC2626" strokeWidth="1"/><rect x="2" y="2" width="20" height="8" rx="3" fill="#F87171" opacity="0.4"/></svg>);
const YellowRedCardSVG  = ({ className="w-8 h-7" }) => (<svg className={className} viewBox="0 0 32 32" fill="none"><rect x="2" y="4" width="16" height="24" rx="3" fill="#EAB308" stroke="#CA8A04" strokeWidth="1"/><rect x="12" y="2" width="16" height="24" rx="3" fill="#EF4444" stroke="#DC2626" strokeWidth="1"/></svg>);

const isLiveStatus    = (s) => ['1H','2H','HT','ET','P'].includes(s);
const isFinishedStatus= (s) => ['FT','AET','PEN'].includes(s);
const STATUS_LABELS   = {
  '1H':'First Half','2H':'Second Half','HT':'Half Time','ET':'Extra Time',
  'P':'Penalties','FT':'Full Time','AET':'After Extra Time','PEN':'After Penalties',
  'NS':'Not Started','TBD':'To Be Decided','PST':'Postponed','CANC':'Cancelled',
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

/* ── Momentum: count events per 15-min window ──────────────────────────── */
const buildMomentum = (events, homeTeam) => {
  const windows = [15,30,45,60,75,90,105].map(end => ({end, home:0, away:0}));
  (events||[]).forEach(e => {
    const t = parseInt(e.time)||0;
    const isHome = e.team === homeTeam;
    const w = windows.find(w => t <= w.end) || windows[windows.length-1];
    if (['Goal','Card','subst','Var'].includes(e.type)) {
      if (isHome) w.home++; else w.away++;
    }
  });
  return windows;
};

/* ── xG helper: derive from events if not provided ─────────────────────── */
const deriveXG = (events, team) => {
  const goals    = (events||[]).filter(e => e.team===team && e.type==='Goal' && e.detail!=='Missed Penalty' && e.detail!=='Own Goal').length;
  const shots    = (events||[]).filter(e => e.team===team && e.type==='Goal').length;
  const missed   = (events||[]).filter(e => e.team===team && e.detail==='Missed Penalty').length;
  return Math.max((goals * 0.8) + (missed * 0.75), 0).toFixed(2);
};

function MatchCenterPage({ fixtureId, onNavigate }) {
  const [match,          setMatch]          = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [activeTab,      setActiveTab]      = useState('live');
  const [lastUpdated,    setLastUpdated]    = useState(null);
  const [isRefreshing,   setIsRefreshing]   = useState(false);
  const [scoreFlash,     setScoreFlash]     = useState(false);
  const [prediction,     setPrediction]     = useState(null);
  const [predictors,     setPredictors]     = useState(null); // predicted scorers
  const [aiSummary,      setAiSummary]      = useState('');
  const [loadingAI,      setLoadingAI]      = useState(false);
  const [timelineView,   setTimelineView]   = useState(false); // toggle events list ↔ timeline
  const prevScoreRef = useRef(null);
  const intervalRef  = useRef(null);

  /* ── Fetch match ── */
  const smartFetch = useCallback(async (showLoader = false, force = false) => {
    if (!fixtureId) return;
    if (showLoader) setLoading(true);
    setIsRefreshing(true);
    try {
      const url = force
        ? `${API_BASE}/live/fixture/${fixtureId}?fresh=1`
        : `${API_BASE}/live/fixture/${fixtureId}`;
<<<<<<< HEAD
      const resp = await fetch(url);
=======
      const resp = await fetchWithTimeout(url);
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
      if (!resp.ok) throw new Error('Fixture not found');
      const data = await resp.json();
      const newScore = `${data.homeGoals}-${data.awayGoals}`;
      if (prevScoreRef.current && prevScoreRef.current !== newScore && prevScoreRef.current !== 'null-null') {
        setScoreFlash(true); setTimeout(() => setScoreFlash(false), 2500);
      }
      prevScoreRef.current = newScore;
      setMatch(data); setLastUpdated(new Date()); setError('');
    } catch (e) { if (!match) setError(e.message||'Failed to load match data'); }
    finally { setLoading(false); setIsRefreshing(false); }
  }, [fixtureId]);

  useEffect(() => {
    if (!fixtureId) { setError('No fixture ID provided'); setLoading(false); return; }
    smartFetch(true);
    // Poll every 15s - backend no longer caches live fixtures
    intervalRef.current = setInterval(() => smartFetch(false), 15000);
    return () => clearInterval(intervalRef.current);
  }, [fixtureId]);

  // Debug: log what data we receive
  useEffect(() => {
    if (!match) return;
    console.log('[MatchCenter] Data:', {
      status: match.status,
      events: match.events?.length,
      lineups: match.lineups?.length,
      stats: Object.keys(match.statistics||{}).length,
    });
  }, [match]);

  /* ── Fetch ML prediction once match loads ── */
  useEffect(() => {
    if (!match?.homeTeam || !match?.awayTeam || prediction) return;
    // Only call for supported European leagues — avoids 404 noise for international matches
    const SUPPORTED = ['Premier League','La Liga','Bundesliga','Serie A','Ligue 1','Primeira Liga','Champions League'];
    if (match.league && !SUPPORTED.includes(match.league)) return;
    (async () => {
      try {
<<<<<<< HEAD
        const r = await fetch(`${API_BASE}/predict/match`, {
=======
        const r = await fetchWithTimeout(`${API_BASE}/predict/match`, {
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({home_team:match.homeTeam, away_team:match.awayTeam, league:match.league||'Premier League'}),
        });
        if (r.ok) setPrediction(await r.json());
      } catch {}
    })();
  }, [match?.homeTeam, match?.awayTeam]);

  /* ── Fetch predicted scorers + re-rank with real season stats ── */
  useEffect(() => {
    if (!match?.home_Team || !match?.away_Team || predictors) return;
    (async () => {
      try {
        const ht = encodeURIComponent(match.homeTeam.replace(/ FC$| AFC$/,''));
        const at = encodeURIComponent(match.awayTeam.replace(/ FC$| AFC$/,''));

        // Fetch backend predictions + real player stats for both teams in parallel
        const [predResp, statsResp] = await Promise.allSettled([
<<<<<<< HEAD
          fetch(`${API_BASE}/predicted-scorers/${ht}/${at}?league=${encodeURIComponent(match.league||'Premier League')}`),
          fetch(`${API_BASE}/players/search?q=&league=${encodeURIComponent(match.league||'Premier League')}&limit=9999`),
=======
          fetchWithTimeout(`${API_BASE}/predicted-scorers/${ht}/${at}?league=${encodeURIComponent(match.league||'Premier League')}`),
          fetchWithTimeout(`${API_BASE}/players/search?q=&league=${encodeURIComponent(match.league||'Premier League')}&limit=9999`),
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
        ]);

        if (predResp.status !== 'fulfilled' || !predResp.value.ok) return;
        const raw = await predResp.value.json();

        // Build a lookup of real player stats keyed by lowercase last name + team
        const statsMap = {};
        if (statsResp.status === 'fulfilled' && statsResp.value.ok) {
          const allPlayers = await statsResp.value.json();
          if (Array.isArray(allPlayers)) {
            allPlayers.forEach(p => {
              const lastName = (p.name || '').split(' ').pop().toLowerCase();
              const teamKey  = (p.team || '').toLowerCase().replace(/ fc$| afc$/,'');
              statsMap[`${lastName}__${teamKey}`] = p;
              // also index by full name lowercase for better matching
              statsMap[(p.name||'').toLowerCase()] = p;
            });
          }
        }

        /* ── Re-scoring formula ──────────────────────────────────
           Goals this season  → 55% weight  (most predictive)
           xG this season     → 20% weight  (chance quality)
           Backend probability→ 15% weight  (model signal)
           Rating             → 10% weight  (form)
           ─────────────────────────────────────────────────────── */
        const enrichAndSort = (players, teamName) => {
          if (!players?.length) return [];

          // Find max values in this team for normalisation
          const teamKey = teamName.toLowerCase().replace(/ fc$| afc$/,'');

          const enriched = players.map(p => {
            const lastName = (p.name || '').split(' ').pop().toLowerCase();
            // Try multiple lookups
            const stats = statsMap[`${lastName}__${teamKey}`]
                       || statsMap[(p.name||'').toLowerCase()]
                       || null;

            const goals    = parseFloat(stats?.goals)   || 0;
            const xG       = parseFloat(stats?.xG)      || 0;
            const rating   = parseFloat(stats?.rating)  || 0;
            const backendP = parseFloat(p.scoreProbability) || 0;

            return { ...p, _goals: goals, _xG: xG, _rating: rating, _backendP: backendP, _stats: stats };
          });

          // Normalise each dimension across this team's player list
          const maxGoals  = Math.max(...enriched.map(p => p._goals),  1);
          const maxXG     = Math.max(...enriched.map(p => p._xG),     1);
          const maxRating = Math.max(...enriched.map(p => p._rating), 1);
          const maxProb   = Math.max(...enriched.map(p => p._backendP),1);

          return enriched
            .map(p => {
              const normGoals  = p._goals    / maxGoals;
              const normXG     = p._xG       / maxXG;
              const normRating = p._rating   / maxRating;
              const normProb   = p._backendP / maxProb;

              const combined = (normGoals * 0.55) + (normXG * 0.20) + (normProb * 0.15) + (normRating * 0.10);

              // Scale to 0-99% display probability
              return { ...p, _score: combined, scoreProbability: Math.round(combined * 99) };
            })
            .sort((a, b) => b._score - a._score)
            .slice(0, 5); // top 5 per team
        };

        setPredictors({
          home: enrichAndSort(raw.home, match.homeTeam),
          away: enrichAndSort(raw.away, match.awayTeam),
        });
      } catch {}
    })();
  }, [match?.homeTeam, match?.awayTeam]);

  /* ── Fetch AI summary at HT or FT ── */
  const fetchAISummary = async () => {
    if (!match || loadingAI) return;
    setLoadingAI(true);
    try {
      const goals = (match.events||[]).filter(e=>e.type==='Goal'&&e.detail!=='Missed Penalty');
      const goalStr = goals.map(g=>`${g.player} (${g.time}')`).join(', ') || 'No goals yet';
      const prompt = `You are a professional football commentator. Write a punchy 3-paragraph match summary for ${match.homeTeam} ${match.homeGoals??0}-${match.awayGoals??0} ${match.awayTeam} (${STATUS_LABELS[match.status]||match.status}). Goals: ${goalStr}. Be specific, use player names, reference the scoreline. Max 150 words.`;
<<<<<<< HEAD
      const r = await fetch(`${API_BASE}/api/analyze`, {
=======
      const r = await fetchWithTimeout(`${API_BASE}/api/analyze`, {
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({messages:[{role:'user',content:prompt}]}),
      });
      const d = await r.json();
      const txt = (d?.content||[]).filter(i=>i?.type==='text').map(i=>i.text).join('\n');
      setAiSummary(txt);
    } catch {}
    setLoadingAI(false);
  };

  /* ── Derived values ── */
  const live       = match && isLiveStatus(match.status);
  const finished   = match && isFinishedStatus(match.status);
  const homeWon    = finished && match?.homeGoals > match?.awayGoals;
  const awayWon    = finished && match?.awayGoals > match?.homeGoals;
  const accentColor= live ? '#ef4444' : '#22d3ee';
  const momentum   = match ? buildMomentum(match.events, match.homeTeam) : [];
  const homeXG     = match?.home_expected_goals ?? (match ? deriveXG(match.events, match.homeTeam) : '0.00');
  const awayXG     = match?.away_expected_goals ?? (match ? deriveXG(match.events, match.awayTeam) : '0.00');
  const totalXG    = (parseFloat(homeXG)||0) + (parseFloat(awayXG)||0) || 1;

  /* ── Stat Row ── */
  const StatRow = ({ label, home, away }) => {
    const hVal = parseFloat(home)||0, aVal = parseFloat(away)||0, total = hVal+aVal||1;
    const hPct = (hVal/total)*100, hWins = hVal>aVal, aWins = aVal>hVal;
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className={`text-sm font-black ${hWins?'text-cyan-400':'text-slate-500'}`} style={{fontFamily:'JetBrains Mono'}}>{home??'-'}</span>
          <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-widest">{label}</span>
          <span className={`text-sm font-black ${aWins?'text-purple-400':'text-slate-500'}`} style={{fontFamily:'JetBrains Mono'}}>{away??'-'}</span>
        </div>
        <div className="flex gap-1 h-2">
          <div className="flex-1 rounded-full overflow-hidden flex justify-end" style={{background:'rgba(255,255,255,0.05)'}}>
            <div className="h-full rounded-full transition-all duration-1000" style={{width:`${hPct}%`,background:hWins?'linear-gradient(90deg,#22d3ee80,#22d3ee)':'rgba(100,116,139,0.4)'}}/>
          </div>
          <div className="flex-1 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
            <div className="h-full rounded-full transition-all duration-1000" style={{width:`${100-hPct}%`,background:aWins?'linear-gradient(90deg,#a855f7,#a855f780)':'rgba(100,116,139,0.4)'}}/>
          </div>
        </div>
      </div>
    );
  };

  /* ── Timeline view ── */
  const renderTimeline = () => {
    const events = (match?.events||[]).filter(e => ['Goal','Card','subst'].includes(e.type));
    if (!events.length) return (
      <div className="py-16 text-center rounded-2xl border border-white/[0.05]" style={{background:'rgba(10,14,26,0.7)'}}>
        <ListIcon className="w-8 h-8 text-slate-700 mx-auto mb-2"/>
        <p className="text-slate-500 text-sm">No events to show yet</p>
      </div>
    );
    // true absolute minute = base minute + stoppage extra (e.g. 90'+8 → 98)
    const trueMin = (e) => (parseInt(e.time)||0) + (parseInt(e.extra)||0);
    const maxTime = Math.max(...events.map(trueMin), 90);
    const hasStoppage = maxTime > 90;
    return (
      <div className="relative rounded-2xl border border-white/[0.06] overflow-hidden" style={{background:'rgba(10,14,26,0.8)'}}>
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between" style={{background:'rgba(34,211,238,0.04)'}}>
          <div className="flex items-center gap-2"><ListIcon className="w-4 h-4 text-cyan-400"/><span className="text-white font-black text-sm">Match Timeline</span></div>
          <div className="flex items-center gap-4 text-[12px] font-black">
            <span className="text-cyan-400">{match?.homeTeam?.split(' ')[0]}</span>
            <span className="text-slate-600">vs</span>
            <span className="text-purple-400">{match?.awayTeam?.split(' ')[0]}</span>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="px-5 py-2.5 border-b border-white/[0.04] flex items-center gap-4 flex-wrap" style={{background:'rgba(0,0,0,0.15)'}}>
          {[
            {color:'#f59e0b', label:'Goal',        shape:'circle'},
            {color:'#eab308', label:'Yellow Card',  shape:'square'},
            {color:'#ef4444', label:'Red Card',     shape:'square'},
            {color:'#64748b', label:'Substitution', shape:'circle'},
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              {item.shape === 'circle'
                ? <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:item.color,boxShadow:`0 0 5px ${item.color}60`}}/>
                : <div className="w-2.5 h-3 rounded-sm flex-shrink-0" style={{background:item.color}}/>}
              <span className="text-[11px] text-slate-500">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:'rgba(255,255,255,0.15)'}}/>
            <span className="text-[11px] text-slate-600">Above line = Home · Below = Away</span>
          </div>
        </div>

        {/* Time axis */}
        <div className="px-5 pt-6 pb-4 border-b border-white/[0.04]" style={{background:'rgba(0,0,0,0.2)'}}>
          <div className="relative h-3 rounded-full" style={{background:'rgba(255,255,255,0.04)'}}>
            {/* Progress fill */}
            {/* Progress fill — scaled to true maxTime */}
            <div className="absolute left-0 top-0 h-full rounded-l-full transition-all duration-1000" style={{width:`${Math.min(((parseInt(match?.elapsed)||0)/maxTime)*100,100)}%`,background:'linear-gradient(90deg,rgba(239,68,68,0.5),rgba(239,68,68,0.2))'}}/>
            {/* Stoppage time tint zone */}
            {hasStoppage && (
              <div className="absolute top-0 h-full"
                style={{left:`${(90/maxTime)*100}%`,width:`${((maxTime-90)/maxTime)*100}%`,background:'rgba(245,158,11,0.07)',borderLeft:'1px dashed rgba(245,158,11,0.35)'}}/>
            )}
            {/* HT line */}
            <div className="absolute top-0 bottom-0 w-px" style={{left:`${(45/maxTime)*100}%`,background:'rgba(255,255,255,0.2)'}}/>
            {/* 90' divider when there is stoppage time */}
            {hasStoppage && (
              <div className="absolute top-0 bottom-0 w-px" style={{left:`${(90/maxTime)*100}%`,background:'rgba(245,158,11,0.4)'}}/>
            )}
            {/* Time axis labels */}
            {[0,15,30,45,60,75,90].map(t => (
              <div key={t} className="absolute -top-5 text-[10px] -translate-x-1/2"
                style={{left:`${(t/maxTime)*100}%`, color:'#475569'}}>{t}'</div>
            ))}
            {/* Stoppage end label */}
            {hasStoppage && (
              <div className="absolute -top-5 text-[10px] font-black -translate-x-1/2"
                style={{left:'99%', color:'#f59e0b'}}>+{maxTime-90}'</div>
            )}
            {/* Event dots */}
            {events.map((e,i) => {
              const t      = trueMin(e);  // true absolute minute including extra time
              const pct    = Math.min((t/maxTime)*100, 99);
              const isHome = e.team === match?.homeTeam;
              const isGoal = e.type==='Goal'&&e.detail!=='Missed Penalty';
              const isCard = e.type==='Card';
              const isSub  = e.type==='subst';
              const color  = isGoal ? '#f59e0b'
                : isCard ? (e.detail?.includes('Red')||e.detail?.includes('Second Yellow') ? '#ef4444' : '#eab308')
                : '#64748b';
              const timeLabel = e.extra ? `${e.time}'+${e.extra}` : `${e.time}'`;
              return (
                <div key={i} className="absolute -translate-x-1/2 cursor-pointer group" style={{left:`${pct}%`,top: isHome ? '-18px' : '12px', zIndex:10}}>
                  {/* Tick to bar */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-px" style={{
                    height: 8, background: color,
                    top: isHome ? '100%' : undefined,
                    bottom: isHome ? undefined : '100%',
                  }}/>
                  {/* Dot or square */}
                  <div className={`w-3 h-3 border-2 border-[#050810] shadow-lg ${isCard&&!e.detail?.includes('Red')&&!e.detail?.includes('Second')?'rounded-sm':'rounded-full'}`}
                    style={{background:color,boxShadow:`0 0 8px ${color}80`}}/>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 -translate-x-1/2 left-1/2 bg-[#0a0e1a] border border-white/10 rounded-xl px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20" style={{boxShadow:'0 8px 24px rgba(0,0,0,0.6)'}}>
                    <p className="text-white text-[11px] font-bold">{e.player}</p>
                    <p className="text-[10px] mt-0.5" style={{color}}>{isGoal?'⚽ Goal':isCard?'🟨 Card':isSub?'🔄 Sub':'Event'} · {timeLabel}</p>
                    <p className="text-slate-500 text-[10px]">{e.team?.split(' ')[0]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score progression */}
        <div className="p-5">
          <p className="text-[11px] text-slate-600 uppercase tracking-[0.15em] font-bold mb-3">Score Progression</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-black text-slate-500 px-2 py-1 rounded-lg border border-white/[0.05]" style={{fontFamily:'JetBrains Mono'}}>0-0</span>
            {(match?.events||[]).filter(e=>e.type==='Goal'&&e.detail!=='Missed Penalty').reduce((acc, e, i, arr) => {
              // Correctly count home/away goals including OGs
              const goalsUpToNow = arr.slice(0, i+1);
              const hGoals = goalsUpToNow.filter(g =>
                (g.team===match?.homeTeam && g.detail!=='Own Goal') ||
                (g.team===match?.awayTeam && g.detail==='Own Goal')
              ).length;
              const aGoals = goalsUpToNow.filter(g =>
                (g.team===match?.awayTeam && g.detail!=='Own Goal') ||
                (g.team===match?.homeTeam && g.detail==='Own Goal')
              ).length;
              const scoredForHome = (e.team===match?.homeTeam&&e.detail!=='Own Goal')||(e.team===match?.awayTeam&&e.detail==='Own Goal');
              const color = scoredForHome ? '#22d3ee' : '#a855f7';
              acc.push(
                <React.Fragment key={i}>
                  <div className="w-3 h-px rounded-full" style={{background:'rgba(255,255,255,0.1)'}}/>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-slate-500">{e.player?.split(' ').pop()} {e.extra?`${e.time}'+${e.extra}`:`${e.time}'`}</span>
                    <span className="text-[12px] font-black px-2 py-0.5 rounded-lg" style={{fontFamily:'JetBrains Mono',background:`${color}15`,color,border:`1px solid ${color}25`}}>{hGoals}-{aGoals}</span>
                  </div>
                </React.Fragment>
              );
              return acc;
            }, [])}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050810] text-white overflow-x-hidden" style={{fontFamily:"'Outfit', sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/3 w-[600px] h-[600px] rounded-full blur-[140px]" style={{background:`radial-gradient(circle,${accentColor}08 0%,transparent 70%)`}}/>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]" style={{background:'radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 70%)'}}/>
        <div className="absolute inset-0 opacity-[0.018]" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
      </div>

      <NavBar currentPage="live" onNavigate={onNavigate}>
        {live && <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border" style={{background:'rgba(239,68,68,0.1)',borderColor:'rgba(239,68,68,0.25)',color:'#ef4444'}}><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/>LIVE</span>}
        <button onClick={() => smartFetch(false, true)} disabled={isRefreshing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all" style={isRefreshing?{background:'rgba(34,211,238,0.1)',borderColor:'rgba(34,211,238,0.2)',color:'#22d3ee'}:{background:'rgba(255,255,255,0.04)',borderColor:'rgba(255,255,255,0.08)',color:'#64748b'}}>
          <RefreshIcon className={`w-3.5 h-3.5 ${isRefreshing?'animate-spin':''}`}/>
          <span className="hidden sm:inline">{isRefreshing?'Updating…':'Refresh'}</span>
        </button>
        <button onClick={() => onNavigate('live')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all" style={{background:'rgba(255,255,255,0.04)',borderColor:'rgba(255,255,255,0.08)',color:'#64748b'}}>
          <ChevronLeftIcon className="w-3.5 h-3.5"/><span className="hidden sm:inline">Back</span>
        </button>
      </NavBar>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-5 md:px-6 py-6">

        {/* Refresh bar */}
        {lastUpdated && (
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[12px] text-slate-600 flex items-center gap-1.5"><ClockIcon className="w-3 h-3"/>{lastUpdated.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
            {live && <span className="flex items-center gap-1.5 text-[12px] text-red-400 font-semibold"><span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"/><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"/></span>Auto-updating every 15s</span>}
            {finished && <span className="text-[12px] text-slate-600">Final result</span>}
          </div>
        )}

        {/* Loading */}
        {loading && !match && (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto mb-5 relative">
              <div className="absolute inset-0 rounded-full border-2" style={{borderColor:'rgba(34,211,238,0.2)'}}/>
              <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:'rgba(34,211,238,0.7)',borderTopColor:'transparent'}}/>
              <div className="absolute inset-2 rounded-full border-2 border-b-transparent animate-spin" style={{borderColor:'rgba(168,85,247,0.5)',borderBottomColor:'transparent',animationDirection:'reverse',animationDuration:'1.5s'}}/>
              <ActivityIcon className="w-5 h-5 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
            </div>
            <p className="text-white font-black text-lg mb-1">Loading Match Center</p>
            <p className="text-slate-500 text-sm">Fetching live data...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && !match && (
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center border" style={{background:'rgba(239,68,68,0.08)',borderColor:'rgba(239,68,68,0.2)'}}><AlertIcon className="w-9 h-9 text-red-400"/></div>
            <p className="text-white font-black text-xl mb-2">Match Not Found</p>
            <p className="text-slate-500 text-sm mb-6">{error}</p>
            <button onClick={() => onNavigate('live')} className="px-6 py-3 rounded-xl text-sm font-bold border" style={{background:'rgba(34,211,238,0.08)',borderColor:'rgba(34,211,238,0.2)',color:'#22d3ee'}}>Back to Live Scores</button>
          </div>
        )}

        {match && (
          <>
            {/* ══ HERO CARD ══ */}
            <div className="relative rounded-3xl overflow-hidden border mb-4" style={{borderColor:live?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.08)',background:live?'linear-gradient(135deg,rgba(239,68,68,0.08),rgba(5,8,16,0.95),rgba(168,85,247,0.04))':'linear-gradient(135deg,rgba(34,211,238,0.05),rgba(5,8,16,0.95),rgba(168,85,247,0.04))',animation:'mcFadeIn 0.4s ease-out'}}>
              <div className="h-0.5" style={{background:`linear-gradient(90deg,transparent,${accentColor}70,transparent)`}}/>
              <div className="px-5 py-3 border-b flex items-center justify-between" style={{borderColor:'rgba(255,255,255,0.06)',background:'rgba(0,0,0,0.2)'}}>
                <div className="flex items-center gap-2.5">
                  {live && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"/></span>}
                  <span className="text-[13px] font-black uppercase tracking-[0.15em]" style={{color:live?'#ef4444':finished?'#64748b':'#22d3ee'}}>{STATUS_LABELS[match.status]||match.status}{live&&match.elapsed?` — ${match.elapsed}'`:''}</span>
                </div>
                <div className="flex items-center gap-2">
                  {match.league && LEAGUE_IMG[match.league] && <img src={LEAGUE_IMG[match.league]} alt="" className="w-5 h-5 object-contain opacity-70"/>}
                  <span className="text-[12px] text-slate-500 hidden sm:block">{match.league}</span>
                  {match.round && <span className="text-[12px] text-slate-600 hidden sm:block">{match.round}</span>}
                </div>
              </div>

              <div className="p-3 sm:p-6 md:p-8">
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  {/* Home */}
                  <div className="flex-1 text-center min-w-0">
                    <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto rounded-xl sm:rounded-2xl flex items-center justify-center p-1.5 sm:p-3 mb-2 sm:mb-3 border shadow-xl"
                      style={{background:'rgba(255,255,255,0.04)',borderColor:homeWon?'rgba(34,211,238,0.3)':'rgba(255,255,255,0.06)',boxShadow:homeWon?'0 0 30px rgba(34,211,238,0.15)':'none'}}>
                      {match.homeLogo?<img src={match.homeLogo} alt="" className="w-full h-full object-contain"/>:<ShieldIcon className="w-6 h-6 sm:w-10 sm:h-10 text-cyan-400/20"/>}
                    </div>
                    <h2 className={`text-xs sm:text-sm md:text-base font-black leading-tight truncate px-1 ${homeWon?'text-white':finished?'text-slate-500':'text-white'}`}>{(match.homeTeam||'').replace(/ FC$| AFC$| CF$/,'')}</h2>
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em]" style={{color:'rgba(34,211,238,0.5)'}}>Home</span>
                  </div>

                  {/* Score */}
                  <div className="text-center flex flex-col items-center gap-1 sm:gap-2 flex-shrink-0">
                    <div className="px-3 py-2 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-500"
                      style={{background:scoreFlash?'rgba(234,179,8,0.2)':live?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.04)',border:scoreFlash?'1px solid rgba(234,179,8,0.4)':live?'1px solid rgba(239,68,68,0.2)':'1px solid rgba(255,255,255,0.08)',transform:scoreFlash?'scale(1.08)':'scale(1)'}}>
                      {match.homeGoals!=null
                        ? <span className="text-2xl sm:text-4xl md:text-5xl font-black text-white" style={{fontFamily:'JetBrains Mono'}}>{match.homeGoals} - {match.awayGoals}</span>
                        : <span className="text-lg sm:text-2xl text-slate-600 font-black">vs</span>}
                    </div>
                    {match.htHome!=null && <span className="text-[10px] sm:text-[12px] text-slate-600" style={{fontFamily:'JetBrains Mono'}}>HT: {match.htHome}-{match.htAway}</span>}
                    {match.date && <span className="text-[10px] sm:text-[12px] text-slate-700">{new Date(match.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>}
                  </div>

                  {/* Away */}
                  <div className="flex-1 text-center min-w-0">
                    <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto rounded-xl sm:rounded-2xl flex items-center justify-center p-1.5 sm:p-3 mb-2 sm:mb-3 border shadow-xl"
                      style={{background:'rgba(255,255,255,0.04)',borderColor:awayWon?'rgba(168,85,247,0.3)':'rgba(255,255,255,0.06)',boxShadow:awayWon?'0 0 30px rgba(168,85,247,0.15)':'none'}}>
                      {match.awayLogo?<img src={match.awayLogo} alt="" className="w-full h-full object-contain"/>:<ShieldIcon className="w-6 h-6 sm:w-10 sm:h-10 text-purple-400/20"/>}
                    </div>
                    <h2 className={`text-xs sm:text-sm md:text-base font-black leading-tight truncate px-1 ${awayWon?'text-white':finished?'text-slate-500':'text-white'}`}>{(match.awayTeam||'').replace(/ FC$| AFC$| CF$/,'')}</h2>
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em]" style={{color:'rgba(168,85,247,0.5)'}}>Away</span>
                  </div>
                </div>

                {/* Info row — hidden on smallest screens, shown sm+ */}
                <div className="hidden sm:flex items-center justify-center gap-4 mt-4 flex-wrap">
                  {match.venue&&<span className="flex items-center gap-1.5 text-[12px] text-slate-500"><MapPinIcon className="w-3 h-3 text-slate-600 flex-shrink-0"/>{match.venue}</span>}
                  {match.referee&&<span className="flex items-center gap-1.5 text-[12px] text-slate-500"><UserIcon className="w-3 h-3 text-slate-600 flex-shrink-0"/>{match.referee}</span>}
                  {match.date&&<span className="flex items-center gap-1.5 text-[12px] text-slate-500"><ClockIcon className="w-3 h-3 text-slate-600 flex-shrink-0"/>{new Date(match.date).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}</span>}
                </div>
                {/* Mobile-only compact info */}
                <div className="flex sm:hidden items-center justify-center gap-3 mt-2 flex-wrap">
                  {match.venue&&<span className="text-[10px] text-slate-600 truncate max-w-[140px]">{match.venue}</span>}
                  {match.date&&<span className="text-[10px] text-slate-600">{new Date(match.date).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}</span>}
                </div>
              </div>
            </div>

            {/* ══ LIVE xG TRACKER ══ */}
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden mb-4" style={{background:'rgba(10,14,26,0.8)'}}>
              <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between" style={{background:'rgba(245,158,11,0.04)'}}>
                <div className="flex items-center gap-2"><TargetIcon className="w-4 h-4 text-amber-400"/><span className="text-white font-black text-sm">Live xG Tracker</span></div>
                <span className="text-[12px] text-slate-500">Expected goals based on chance quality</span>
              </div>
              <div className="p-5 space-y-4">
                {/* xG split bar */}
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-black text-cyan-400" style={{fontFamily:'JetBrains Mono'}}>{homeXG}</p>
                    <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-0.5">{match.homeTeam?.replace(/ FC$/,'')?.split(' ')[0]}</p>
                  </div>
                  <div className="flex-1 relative h-4 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
                    <div className="absolute left-0 top-0 h-full rounded-l-full transition-all duration-1000" style={{width:`${(parseFloat(homeXG)/totalXG)*100}%`,background:'linear-gradient(90deg,#22d3ee60,#22d3ee)'}}/>
                    <div className="absolute right-0 top-0 h-full rounded-r-full transition-all duration-1000" style={{width:`${(parseFloat(awayXG)/totalXG)*100}%`,background:'linear-gradient(90deg,#a855f7,#a855f760)'}}/>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-purple-400" style={{fontFamily:'JetBrains Mono'}}>{awayXG}</p>
                    <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-0.5">{match.awayTeam?.replace(/ FC$/,'')?.split(' ')[0]}</p>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>{Math.round((parseFloat(homeXG)/totalXG)*100)}% xG share</span>
                  <span>{Math.round((parseFloat(awayXG)/totalXG)*100)}% xG share</span>
                </div>

                {/* Goals vs xG differential cards */}
                {(match.homeGoals != null || match.awayGoals != null) && (() => {
                  const hGoals = match.homeGoals ?? 0;
                  const aGoals = match.awayGoals ?? 0;
                  const hXGf   = parseFloat(homeXG) || 0;
                  const aXGf   = parseFloat(awayXG) || 0;
                  const hDiff  = hGoals - hXGf;
                  const aDiff  = aGoals - aXGf;
                  return (
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/[0.05]">
                      {[
                        {team:match.homeTeam?.replace(/ FC$/,''), goals:hGoals, xg:hXGf, diff:hDiff, color:'#22d3ee'},
                        {team:match.awayTeam?.replace(/ FC$/,''), goals:aGoals, xg:aXGf, diff:aDiff, color:'#a855f7'},
                      ].map((side,i) => (
                        <div key={i} className="rounded-xl p-3 border" style={{background:`${side.color}08`,borderColor:`${side.color}20`}}>
                          <p className="text-[11px] font-bold text-slate-400 mb-2 truncate">{side.team}</p>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-2xl font-black text-white" style={{fontFamily:'JetBrains Mono'}}>{side.goals}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Goals</p>
                            </div>
                            <div className="text-center">
                              <p className="text-base font-black" style={{fontFamily:'JetBrains Mono',color:side.diff > 0 ? '#10b981' : side.diff < 0 ? '#ef4444' : '#64748b'}}>
                                {side.diff > 0 ? '+' : ''}{side.diff.toFixed(2)}
                              </p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">vs xG</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black" style={{fontFamily:'JetBrains Mono',color:side.color}}>{side.xg.toFixed(2)}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">xG</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* ══ MOMENTUM CHART ══ */}
            {(match.events||[]).length > 0 && (() => {
              const maxVal = Math.max(...momentum.map(w => Math.max(w.home, w.away)), 1);
              const CHART_H = 72; // px height of chart area
              return (
                <div className="rounded-2xl border border-white/[0.06] overflow-hidden mb-4" style={{background:'rgba(10,14,26,0.8)'}}>
                  <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2" style={{background:'rgba(34,211,238,0.04)'}}>
                    <ActivityIcon className="w-4 h-4 text-cyan-400"/>
                    <span className="text-white font-black text-sm">Momentum Chart</span>
                    <span className="ml-auto text-[12px] text-slate-500">Events per 15-min window</span>
                  </div>
                  <div className="px-5 pt-5 pb-3">
                    {/* Bar chart */}
                    <div className="flex items-end gap-2" style={{height: CHART_H + 20}}>
                      {momentum.map((w, i) => {
                        const homeH = Math.round((w.home / maxVal) * CHART_H);
                        const awayH = Math.round((w.away / maxVal) * CHART_H);
                        const isActive = match.elapsed && parseInt(match.elapsed) > (i>0?momentum[i-1].end:0) && parseInt(match.elapsed) <= w.end;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-0" style={{height: CHART_H + 20}}>
                            {/* Bars container — aligned to bottom */}
                            <div className="flex-1 w-full flex items-end justify-center gap-0.5">
                              {/* Home bar */}
                              <div className="flex-1 rounded-t-md transition-all duration-700 relative overflow-hidden"
                                style={{height: homeH || 2, maxWidth:20,
                                  background: homeH > awayH
                                    ? 'linear-gradient(180deg,#22d3ee,rgba(34,211,238,0.5))'
                                    : 'rgba(34,211,238,0.25)',
                                  minHeight: 2,
                                  boxShadow: homeH > awayH ? '0 0 8px rgba(34,211,238,0.3)' : 'none',
                                }}/>
                              {/* Away bar */}
                              <div className="flex-1 rounded-t-md transition-all duration-700"
                                style={{height: awayH || 2, maxWidth:20,
                                  background: awayH > homeH
                                    ? 'linear-gradient(180deg,#a855f7,rgba(168,85,247,0.5))'
                                    : 'rgba(168,85,247,0.25)',
                                  minHeight: 2,
                                  boxShadow: awayH > homeH ? '0 0 8px rgba(168,85,247,0.3)' : 'none',
                                }}/>
                            </div>
                            {/* Time label */}
                            <span className="text-[10px] mt-1.5 flex-shrink-0" style={{color: isActive ? '#22d3ee' : '#475569'}}>{w.end}'</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-5 mt-1 pt-3 border-t border-white/[0.05]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-2.5 rounded-sm" style={{background:'linear-gradient(90deg,#22d3ee,rgba(34,211,238,0.5))'}}/>
                        <span className="text-[12px] text-slate-400">{match.homeTeam?.replace(/ FC$/,'')?.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-2.5 rounded-sm" style={{background:'linear-gradient(90deg,#a855f7,rgba(168,85,247,0.5))'}}/>
                        <span className="text-[12px] text-slate-400">{match.awayTeam?.replace(/ FC$/,'')?.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ══ ML PREDICTION + QUICK PREDICT ══ */}
            {prediction && (
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden mb-4" style={{background:'rgba(10,14,26,0.8)'}}>
                <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2" style={{background:'rgba(34,211,238,0.04)'}}>
                  <TrendingUpIcon className="w-4 h-4 text-cyan-400"/>
                  <span className="text-white font-black text-sm">ML Prediction</span>
                  <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{background:'rgba(34,211,238,0.1)',color:'#22d3ee',border:'1px solid rgba(34,211,238,0.2)'}}>Poisson v2.1</span>
                  <button onClick={() => onNavigate('analysis')} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all" style={{background:'rgba(34,211,238,0.08)',borderColor:'rgba(34,211,238,0.2)',color:'#22d3ee'}}>
                    <TrendingUpIcon className="w-3.5 h-3.5"/>Full Analysis
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    {label:match.homeTeam?.replace(/ FC$/,''), v:prediction.home_win, color:'#22d3ee'},
                    {label:'Draw',                            v:prediction.draw,     color:'#f59e0b'},
                    {label:match.awayTeam?.replace(/ FC$/,''),v:prediction.away_win, color:'#a855f7'},
                  ].map(p => (
                    <div key={p.label} className="rounded-xl p-3 border border-white/[0.05]" style={{background:`linear-gradient(90deg,${p.color}08,rgba(5,8,16,0.95))`}}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white text-sm font-semibold">{p.label}</span>
                        <span className="text-lg font-black" style={{fontFamily:'JetBrains Mono',color:p.color}}>{(p.v*100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{width:`${p.v*100}%`,background:p.color}}/>
                      </div>
                    </div>
                  ))}
                  {prediction.predicted_score && (
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <span className="text-slate-400 text-sm">Predicted:</span>
                      <span className="text-white font-black text-xl" style={{fontFamily:'JetBrains Mono'}}>{prediction.predicted_score}</span>
                      {prediction.confidence && <span className="text-[12px] text-slate-500">({(prediction.confidence*100).toFixed(0)}% confidence)</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ FORM + H2H VISUAL ══ */}
            {prediction && (prediction.home_form_sequence?.length > 0 || prediction.h2h_summary) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">

                {/* Team Form Strips */}
                {(prediction.home_form_sequence?.length > 0 || prediction.away_form_sequence?.length > 0) && (
                  <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{background:'rgba(10,14,26,0.8)'}}>
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2" style={{background:'rgba(255,255,255,0.02)'}}>
                      <ActivityIcon className="w-4 h-4 text-slate-400"/>
                      <span className="text-white font-black text-sm">Recent Form</span>
                      <span className="text-[10px] text-slate-600 ml-auto">Last 5 matches</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {[
                        {name: match.homeTeam?.replace(/ FC$/,''), seq: prediction.home_form_sequence, color:'#22d3ee'},
                        {name: match.awayTeam?.replace(/ FC$/,''), seq: prediction.away_form_sequence, color:'#a855f7'},
                      ].map(({name, seq, color}) => {
                        const results = (seq || []).slice(-5);
                        const wins = results.filter(r=>r==='W').length;
                        const form = wins >= 4 ? 'Excellent' : wins >= 3 ? 'Good' : wins >= 2 ? 'Average' : 'Poor';
                        return (
                          <div key={name}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-white">{name}</span>
                              <span className="text-[10px] font-semibold" style={{color}}>{form}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {results.map((r, i) => {
                                const bg = r==='W' ? '#10b981' : r==='D' ? '#64748b' : '#ef4444';
                                return (
                                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="w-full h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white"
                                      style={{background:bg, boxShadow:`0 2px 6px ${bg}40`}}>
                                      {r}
                                    </div>
                                  </div>
                                );
                              })}
                              {results.length < 5 && Array(5-results.length).fill(0).map((_,i) => (
                                <div key={`e${i}`} className="flex-1 h-6 rounded-lg border border-dashed border-white/10"/>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* H2H Visual Timeline */}
                {prediction.h2h_summary && prediction.h2h_summary.total_matches >= 2 && (
                  <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{background:'rgba(10,14,26,0.8)'}}>
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2" style={{background:'rgba(255,255,255,0.02)'}}>
                      <RepeatIcon className="w-4 h-4 text-slate-400"/>
                      <span className="text-white font-black text-sm">Head to Head</span>
                      <span className="text-[10px] text-slate-600 ml-auto">{prediction.h2h_summary.total_matches} meetings</span>
                    </div>
                    <div className="p-4">
                      {/* H2H summary bar */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-black w-6 text-center" style={{color:'#22d3ee'}}>{prediction.h2h_summary.home_wins}</span>
                        <div className="flex-1 h-3 rounded-full overflow-hidden flex gap-px">
                          <div className="h-full rounded-l-full" style={{width:`${(prediction.h2h_summary.home_wins/prediction.h2h_summary.total_matches)*100}%`, background:'#22d3ee'}}/>
                          <div className="h-full" style={{width:`${(prediction.h2h_summary.draws/prediction.h2h_summary.total_matches)*100}%`, background:'#475569'}}/>
                          <div className="h-full rounded-r-full" style={{width:`${(prediction.h2h_summary.away_wins/prediction.h2h_summary.total_matches)*100}%`, background:'#a855f7'}}/>
                        </div>
                        <span className="text-xs font-black w-6 text-center" style={{color:'#a855f7'}}>{prediction.h2h_summary.away_wins}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-600 mb-3 px-1">
                        <span className="text-cyan-400 font-semibold">{match.homeTeam?.split(' ')[0]} wins</span>
                        <span>{prediction.h2h_summary.draws} draws</span>
                        <span className="text-purple-400 font-semibold">{match.awayTeam?.split(' ')[0]} wins</span>
                      </div>
                      {/* Goals per game */}
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.05]">
                        {[
                          {label:'Avg Goals/Game', val: prediction.h2h_summary.total_matches > 0 ? ((prediction.h2h_summary.home_goals_avg||0) + (prediction.h2h_summary.away_goals_avg||0)).toFixed(1) : '—', color:'#f59e0b'},
                          {label:'Home Avg', val: (prediction.h2h_summary.home_goals_avg||0).toFixed(1), color:'#22d3ee'},
                        ].map((s,i) => (
                          <div key={i} className="rounded-xl p-2.5 text-center border border-white/[0.05]" style={{background:`${s.color}08`}}>
                            <p className="text-sm font-black" style={{color:s.color, fontFamily:'JetBrains Mono'}}>{s.val}</p>
                            <p className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ PREDICTED SCORERS ══ */}
            {predictors && (predictors.home?.length > 0 || predictors.away?.length > 0) && (
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden mb-4" style={{background:'rgba(10,14,26,0.8)'}}>
                <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between" style={{background:'rgba(16,185,129,0.04)'}}>
                  <div className="flex items-center gap-2">
                    <TargetIcon className="w-4 h-4 text-emerald-400"/>
                    <span className="text-white font-black text-sm">Predicted Goalscorers</span>
                  </div>
                  <span className="text-[10px] text-slate-600 uppercase tracking-widest">Goals · xG weighted</span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-white/[0.05]">
                  {[
                    {players:predictors.home, label:(match.homeTeam||'').replace(/ FC$| AFC$/,''), color:'#22d3ee'},
                    {players:predictors.away, label:(match.awayTeam||'').replace(/ FC$| AFC$/,''), color:'#a855f7'},
                  ].map(({players, label, color}, si) => (
                    <div key={si} className="p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.15em] mb-3" style={{color}}>{label}</p>
                      <div className="space-y-3">
                        {(players||[]).map((p, i) => {
                          const goals  = p._goals  || 0;
                          const xG     = p._xG     || 0;
                          const isTop  = i === 0;
                          return (
                            <div key={i} className="flex items-center gap-2.5">
                              {/* Photo */}
                              {p.photo
                                ? <img src={p.photo} alt="" className="w-8 h-8 rounded-xl object-cover flex-shrink-0 border border-white/[0.06]"
                                    style={{boxShadow: isTop ? `0 0 10px ${color}30` : 'none'}}
                                    onError={e=>e.target.style.display='none'}/>
                                : <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/[0.06]"
                                    style={{background:`${color}12`}}>
                                    <span className="text-sm font-bold" style={{color}}>{(p.name||'?')[0]}</span>
                                  </div>}
                              {/* Name + bar */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <p className="text-white text-xs font-bold truncate" style={{color: isTop ? 'white' : '#94a3b8'}}>
                                    {p.name?.split(' ').pop()}
                                  </p>
                                  {/* Real goals badge */}
                                  {goals > 0 && (
                                    <span className="text-[9px] font-black px-1 py-0.5 rounded flex-shrink-0"
                                      style={{background:`${color}15`,color,border:`1px solid ${color}25`,fontFamily:'JetBrains Mono'}}>
                                      {goals}G
                                    </span>
                                  )}
                                  {xG > 0 && (
                                    <span className="text-[9px] font-black px-1 py-0.5 rounded flex-shrink-0 text-slate-500"
                                      style={{background:'rgba(255,255,255,0.04)',fontFamily:'JetBrains Mono'}}>
                                      {xG.toFixed(1)}xG
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex-1 rounded-full overflow-hidden" style={{height:4,background:'rgba(255,255,255,0.06)'}}>
                                    <div className="h-full rounded-full transition-all duration-1000"
                                      style={{width:`${p.scoreProbability}%`, background: isTop ? color : `${color}70`}}/>
                                  </div>
                                  <span className="text-[10px] font-black flex-shrink-0" style={{fontFamily:'JetBrains Mono',color: isTop ? color : '#64748b'}}>
                                    {p.scoreProbability}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ TABS ══ */}
            <div className="flex gap-1 mb-4 rounded-2xl p-1.5 border border-white/[0.06] overflow-x-auto" style={{background:'rgba(10,14,26,0.6)'}}>
              {[
                {id:'live',   label:'Match View', icon:ActivityIcon, accent:'#ef4444'},
                {id:'events', label:'Events',     icon:ZapIcon,      accent:'#22d3ee'},
                {id:'stats',  label:'Stats',      icon:BarChartIcon, accent:'#22d3ee'},
                {id:'lineups',label:'Lineups',    icon:UsersIcon,    accent:'#22d3ee'},
              ].map(tab => {
                const isActive = activeTab === tab.id;
                const ac = tab.accent;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className="relative flex-shrink-0 flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[12px] font-bold transition-all whitespace-nowrap"
                    style={{background:isActive?`${ac}18`:'transparent',border:isActive?`1px solid ${ac}30`:'1px solid transparent',color:isActive?ac:'#64748b',minWidth:72}}>
                    {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full" style={{background:ac}}/>}
                    {tab.id==='live'&&live&&<span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0"/>}
                    <tab.icon className="w-3.5 h-3.5 flex-shrink-0"/>
                    <span className="hidden xs:inline sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ══ LIVE VIEW TAB — REBUILT ══ */}
            {activeTab === 'live' && (() => {
              const events         = match.events || [];
              const lastEvent      = [...events].reverse().find(e => e.type !== 'Var');
              const goals          = events.filter(e => e.type==='Goal' && e.detail!=='Missed Penalty');
              const cards          = events.filter(e => e.type==='Card');
              const subs           = events.filter(e => e.type==='subst');
              const elapsed        = parseInt(match.elapsed) || 0;
              const homeLineup     = match.lineups?.[0];
              const awayLineup     = match.lineups?.[1];
              const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

              /* ══ PHASE OF PLAY ══ */
              const getPhase = () => {
                if (!lastEvent) return { label:'Kick Off', color:'#64748b', icon:'⚽' };
                const type = lastEvent.type, detail = lastEvent.detail || '';
                const isHome = lastEvent.team === match.homeTeam;
                const winIdx = clamp(Math.floor(elapsed/15), 0, momentum.length-1);
                const mom = momentum[winIdx] || { home:0, away:0 };
                if (type === 'Goal')  return { label:'GOAL!', color:'#f59e0b', icon:'🎯' };
                if (detail === 'Missed Penalty') return { label:'Pen Missed', color:'#ef4444', icon:'❌' };
                if (detail === 'Penalty')        return { label:'Penalty', color:'#ef4444', icon:'⚠️' };
                if (type === 'Card' && (detail.includes('Red')||detail.includes('Second'))) return { label:'Red Card', color:'#ef4444', icon:'🟥' };
                if (type === 'Card') return { label:'Yellow Card', color:'#eab308', icon:'🟨' };
                if (type === 'subst') return { label:'Substitution', color:'#a855f7', icon:'🔄' };
                if (mom.home > mom.away + 1) return { label:'Home Pressing', color:'#22d3ee', icon:'⚡' };
                if (mom.away > mom.home + 1) return { label:'Away Pressing', color:'#a855f7', icon:'⚡' };
                if (match.status === 'HT') return { label:'Half Time', color:'#f59e0b', icon:'🔔' };
                if (elapsed > 80) return { label:'Final Push', color:'#ef4444', icon:'🔥' };
                if (elapsed > 45) return { label:'Second Half', color:'#10b981', icon:'▶' };
                return { label:'In Play', color:'#10b981', icon:'▶' };
              };

              /* ══ BALL HISTORY (trail) ══
                 Build last-N positions from event history for trail effect */
              const buildBallTrail = () => {
                const recent = [...events].reverse().slice(0, 5);
                return recent.map((e, i) => {
                  const t = parseInt(e.time) || 0;
                  const isH = e.team === match.homeTeam;
                  const type = e.type;
                  let x, y;
                  if (type === 'Goal')  { x = isH ? 50 : 50; y = isH ? 8 : 92; }
                  else if (type === 'subst') { x = isH ? 10 : 90; y = 50; }
                  else {
                    const wIdx = clamp(Math.floor(t/15), 0, momentum.length-1);
                    const wm = momentum[wIdx] || { home:0, away:0 };
                    const diff = wm.home - wm.away;
                    if (isH) {
                      x = clamp(52 + diff*3 + Math.sin(t*0.4)*6, 35, 75);
                      y = clamp(50 + Math.cos(t*0.3)*20, 15, 85);
                    } else {
                      x = clamp(48 - diff*3 + Math.cos(t*0.4)*6, 25, 65);
                      y = clamp(50 + Math.sin(t*0.3)*20, 15, 85);
                    }
                  }
                  return { x, y, opacity: 1 - i*0.18 };
                });
              };

              /* ══ BALL CURRENT POSITION (portrait: x=0-100 horiz, y=0-100 vert, top=home goal) ══ */
              const getBall = () => {
                if (!lastEvent) return { x:50, y:50, zone:'mid' };
                const t     = parseInt(lastEvent.time) || elapsed;
                const isHome= lastEvent.team === match.homeTeam;
                const type  = lastEvent.type;
                if (type === 'Goal')  return { x:50, y: isHome ? 8 : 92, zone:'goal' };
                if (type === 'Card')  return { x: isHome ? 45+Math.sin(t)*12 : 55+Math.cos(t)*12, y: isHome ? 30+Math.sin(t*0.5)*15 : 70+Math.cos(t*0.5)*15, zone:'foul' };
                if (type === 'subst') return { x:50, y: isHome ? 52 : 48, zone:'touch' };
                const wIdx = clamp(Math.floor(t/15), 0, momentum.length-1);
                const wm   = momentum[wIdx] || { home:0, away:0 };
                const diff = wm.home - wm.away;
                if (diff > 0) return { x: clamp(50+Math.sin(t*0.6)*14, 30, 70), y: clamp(32+diff*3+Math.cos(t*0.4)*10, 10, 48), zone:'home-attack' };
                if (diff < 0) return { x: clamp(50+Math.cos(t*0.6)*14, 30, 70), y: clamp(68-diff*3+Math.sin(t*0.4)*10, 52, 90), zone:'away-attack' };
                return { x: clamp(50+Math.sin(t*0.4)*10, 30, 70), y: clamp(50+Math.cos(t*0.3)*12, 38, 62), zone:'mid' };
              };

              /* ══ FORMATION POSITIONS (portrait pitch, 100×130 viewBox)
                 Home attacks upward (GK at bottom y≈118, strikers y≈20)
                 Away attacks downward (GK at top y≈12, strikers y≈110)  ══ */
              const parseRows = (fStr) => {
                if (!fStr) return null;
                const r = fStr.split('-').map(Number).filter(n => !isNaN(n) && n > 0);
                return r.length >= 2 ? [1, ...r] : null;
              };

              const buildFormation = (rows, isHome) => {
                if (!rows) return [];
                const totalRows = rows.length;
                return rows.flatMap((count, ri) => {
                  const depth = ri / (totalRows - 1); // 0=GK, 1=most forward
                  // Home: GK y=118, attack y=22 → depth goes low-to-high (up pitch)
                  // Away: GK y=12,  attack y=108 → depth goes high-to-low (down pitch)
                  const py = isHome
                    ? 118 - depth * 96
                    :  12 + depth * 96;
                  return Array.from({ length: count }, (_, ci) => ({
                    x: count === 1 ? 50 : 8 + (ci / (count - 1)) * 84,
                    y: py,
                  }));
                });
              };

              /* ══ PLAYER DRIFT toward ball zone ══
                 Players shift 8–12 units toward ball when their team has possession */
              const driftPlayer = (pos, ball, isMyTeam, hasTheBall) => {
                if (!hasTheBall) return pos;
                const dx = ball.x - pos.x, dy = ball.y * 1.3 - pos.y; // scale y to 130 space
                const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                const drift = 10 / dist; // closer players drift more
                return {
                  x: pos.x + dx * drift * 0.08,
                  y: pos.y + dy * drift * 0.08,
                };
              };

              /* ══ PRESSURE ZONES (radial blobs from event density) ══ */
              const buildPressure = () => {
                const zones = [];
                const recentN = events.slice(-20);
                recentN.forEach(e => {
                  const t = parseInt(e.time) || 0;
                  const isH = e.team === match.homeTeam;
                  const wIdx = clamp(Math.floor(t/15), 0, momentum.length-1);
                  const wm = momentum[wIdx] || { home:0, away:0 };
                  const diff = wm.home - wm.away;
                  // Approximate zone from event type + team + momentum
                  let cx = 50, cy = 50, r = 14, intensity = 0.12;
                  if (e.type === 'Goal') { cx = 50; cy = isH ? 10 : 90; r = 8; intensity = 0.35; }
                  else if (isH) { cx = clamp(50+diff*2+Math.sin(t)*8, 25, 75); cy = clamp(50-diff*4, 20, 55); r = 16; intensity = 0.08; }
                  else          { cx = clamp(50-diff*2+Math.cos(t)*8, 25, 75); cy = clamp(50+diff*4, 45, 80); r = 16; intensity = 0.08; }
                  zones.push({ cx, cy, r, intensity, isHome: isH });
                });
                return zones;
              };

              /* ══ POSSESSION from stats ══ */
              const getPoss = () => {
                if (!match.statistics || Object.keys(match.statistics).length < 2) return null;
                const teams = Object.keys(match.statistics);
                const h = parseInt(match.statistics[teams[0]]?.['Ball Possession']) || 0;
                const a = parseInt(match.statistics[teams[1]]?.['Ball Possession']) || 0;
                return h + a > 0 ? { home: h, away: a } : null;
              };

              const ball        = getBall();
              const ballTrail   = buildBallTrail();
              const phase       = getPhase();
              const poss        = getPoss();
              const pressure    = buildPressure();
              const hRows       = parseRows(homeLineup?.formation);
              const aRows       = parseRows(awayLineup?.formation);
              const hPlayers    = homeLineup?.startXI || [];
              const aPlayers    = awayLineup?.startXI || [];
              const homePoss    = lastEvent?.team === match.homeTeam;

              // Raw positions then drifted
              const hRawPos = buildFormation(hRows, true);
              const aRawPos = buildFormation(aRows, false);
              const hPos = hRawPos.map(p => driftPlayer(p, ball, true,  homePoss));
              const aPos = aRawPos.map(p => driftPlayer(p, ball, false, !homePoss));

              const zoneColor = phase.color;
              const recent5   = [...events].reverse().slice(0, 5);

              /* ── Shot/saves summary ── */
              const statsTeams = match.statistics ? Object.keys(match.statistics) : [];
              const hStats = statsTeams[0] ? match.statistics[statsTeams[0]] : {};
              const aStats = statsTeams[1] ? match.statistics[statsTeams[1]] : {};

              return (
                <div className="space-y-3" style={{animation:'mcFadeIn 0.35s ease-out'}}>

                  {/* ══ BROADCAST SCORE BUG ══ */}
                  <div className="rounded-2xl overflow-hidden border" style={{
                    background:'rgba(6,10,20,0.97)',
                    borderColor: live ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)',
                    boxShadow: live ? '0 0 30px rgba(239,68,68,0.12)' : 'none',
                  }}>
                    {/* Top accent line */}
                    <div className="h-0.5" style={{background:`linear-gradient(90deg,transparent,${zoneColor}80,transparent)`}}/>

                    {/* Broadcast bar */}
                    <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.05]" style={{background:'rgba(0,0,0,0.5)'}}>
                      <div className="flex items-center gap-2">
                        {live
                          ? <><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"/></span>
                              <span className="text-red-400 text-[11px] font-black uppercase tracking-[0.15em]">Live Match View</span></>
                          : <span className="text-slate-500 text-[11px] font-black uppercase tracking-[0.15em]">{isFinishedStatus(match.status)?'Full Time':'Pre-Match'}</span>}
                      </div>
                      {/* Phase badge */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{background:`${zoneColor}15`,border:`1px solid ${zoneColor}25`}}>
                        <span className="text-base">{phase.icon}</span>
                        <span className="text-[11px] font-black uppercase tracking-wider" style={{color:zoneColor}}>{phase.label}</span>
                      </div>
                      <span className="ml-auto text-[12px] font-black px-2 py-0.5 rounded-lg" style={{background:'rgba(255,255,255,0.07)',color:'#94a3b8',fontFamily:'JetBrains Mono'}}>
                        {live ? `${elapsed}'` : STATUS_LABELS[match.status]||match.status}
                      </span>
                    </div>

                    {/* Score strip */}
                    <div className="flex items-center px-4 py-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {match.homeLogo && <img src={match.homeLogo} alt="" className="w-7 h-7 object-contain flex-shrink-0"/>}
                        <span className="text-white font-black text-sm truncate">{(match.homeTeam||'').replace(/ FC$| AFC$/,'')}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 mx-4">
                        <span className="text-3xl font-black text-white" style={{fontFamily:'JetBrains Mono'}}>{match.homeGoals??0}</span>
                        <span className="text-slate-600 font-bold text-lg">–</span>
                        <span className="text-3xl font-black text-white" style={{fontFamily:'JetBrains Mono'}}>{match.awayGoals??0}</span>
                      </div>
                      <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                        <span className="text-white font-black text-sm truncate">{(match.awayTeam||'').replace(/ FC$| AFC$/,'')}</span>
                        {match.awayLogo && <img src={match.awayLogo} alt="" className="w-7 h-7 object-contain flex-shrink-0"/>}
                      </div>
                    </div>

                    {/* Possession bar */}
                    {poss && (
                      <div className="border-t border-white/[0.05]">
                        <div className="flex h-1.5">
                          <div className="transition-all duration-1000" style={{width:`${poss.home}%`,background:'linear-gradient(90deg,#22d3ee,rgba(34,211,238,0.5))'}}/>
                          <div className="flex-1" style={{background:'rgba(255,255,255,0.04)'}}/>
                          <div className="transition-all duration-1000" style={{width:`${poss.away}%`,background:'linear-gradient(90deg,rgba(168,85,247,0.5),#a855f7)'}}/>
                        </div>
                        <div className="flex justify-between px-4 py-1.5">
                          <span className="text-[11px] font-black text-cyan-400" style={{fontFamily:'JetBrains Mono'}}>{poss.home}%</span>
                          <span className="text-[10px] text-slate-600 uppercase tracking-widest">Possession</span>
                          <span className="text-[11px] font-black text-purple-400" style={{fontFamily:'JetBrains Mono'}}>{poss.away}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ══ WIN PROBABILITY SHIFT ══ */}
                  {(() => {
                    if (!prediction) return null;
                    const goals = events.filter(e => e.type==='Goal' && e.detail!=='Missed Penalty');
                    // Build probability timeline: start from ML prediction, shift after each goal
                    const timeline = [];
                    let hw = prediction.home_win, dr = prediction.draw, aw = prediction.away_win;
                    timeline.push({ min: 0, hw, dr, aw, label: 'KO' });
                    let hScore = 0, aScore = 0;
                    goals.forEach(g => {
                      const isHome = (g.team === match.homeTeam && g.detail !== 'Own Goal') ||
                                     (g.team === match.awayTeam && g.detail === 'Own Goal');
                      if (isHome) hScore++; else aScore++;
                      const diff = hScore - aScore;
                      const elapsed = parseInt(g.time) || 45;
                      const timeLeft = Math.max(0, 90 - elapsed) / 90;
                      // Shift probabilities based on scoreline
                      if (diff > 0) {
                        const boost = Math.min(0.35, diff * 0.18 + (1 - timeLeft) * 0.12);
                        hw = Math.min(0.96, (prediction.home_win + boost));
                        dr = Math.max(0.02, prediction.draw * (1 - boost));
                        aw = Math.max(0.02, 1 - hw - dr);
                      } else if (diff < 0) {
                        const boost = Math.min(0.35, Math.abs(diff) * 0.18 + (1 - timeLeft) * 0.12);
                        aw = Math.min(0.96, (prediction.away_win + boost));
                        dr = Math.max(0.02, prediction.draw * (1 - boost));
                        hw = Math.max(0.02, 1 - aw - dr);
                      } else {
                        hw = prediction.home_win * 0.85 + 0.08;
                        aw = prediction.away_win * 0.85 + 0.08;
                        dr = Math.min(0.35, prediction.draw * 1.2);
                        const t2 = hw + dr + aw; hw /= t2; dr /= t2; aw /= t2;
                      }
                      timeline.push({ min: elapsed, hw, dr, aw, label: `${hScore}-${aScore}` });
                    });
                    if (live && elapsed > 0 && goals.length === 0) {
                      timeline.push({ min: elapsed, hw: prediction.home_win, dr: prediction.draw, aw: prediction.away_win, label: `${elapsed}'` });
                    }
                    if (timeline.length < 2) return null;
                    const W = 300, H = 80, PAD = 8;
                    const maxMin = Math.max(...timeline.map(t => t.min), 90);
                    const xScale = (min) => PAD + (min / maxMin) * (W - PAD * 2);
                    const yScale = (v)   => H - PAD - v * (H - PAD * 2);
                    const hPath = timeline.map((t,i) => `${i===0?'M':'L'}${xScale(t.min).toFixed(1)},${yScale(t.hw).toFixed(1)}`).join(' ');
                    const aPath = timeline.map((t,i) => `${i===0?'M':'L'}${xScale(t.min).toFixed(1)},${yScale(t.aw).toFixed(1)}`).join(' ');
                    const dPath = timeline.map((t,i) => `${i===0?'M':'L'}${xScale(t.min).toFixed(1)},${yScale(t.dr).toFixed(1)}`).join(' ');
                    const last  = timeline[timeline.length - 1];
                    return (
                      <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{background:'rgba(10,14,26,0.85)'}}>
                        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2" style={{background:'rgba(34,211,238,0.03)'}}>
                          <TrendingUpIcon className="w-4 h-4 text-cyan-400"/>
                          <span className="text-white font-black text-sm">Win Probability Shift</span>
                          <span className="ml-auto text-[10px] text-slate-600">Updates after each goal</span>
                        </div>
                        <div className="p-4">
                          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block',overflow:'visible'}}>
                            {/* Grid lines */}
                            {[0.25,0.5,0.75].map(v => (
                              <line key={v} x1={PAD} y1={yScale(v)} x2={W-PAD} y2={yScale(v)}
                                stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="3,3"/>
                            ))}
                            {/* 50% label */}
                            <text x={PAD-2} y={yScale(0.5)+1} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="5">50%</text>
                            {/* Goal markers */}
                            {goals.map((g,i) => (
                              <line key={i} x1={xScale(parseInt(g.time)||0)} y1={PAD}
                                x2={xScale(parseInt(g.time)||0)} y2={H-PAD}
                                stroke="rgba(245,158,11,0.4)" strokeWidth="0.8" strokeDasharray="2,2"/>
                            ))}
                            {/* Draw line */}
                            <path d={dPath} fill="none" stroke="rgba(100,116,139,0.5)" strokeWidth="1" strokeDasharray="3,2"/>
                            {/* Away line */}
                            <path d={aPath} fill="none" stroke="#a855f7" strokeWidth="1.5"/>
                            {/* Home line */}
                            <path d={hPath} fill="none" stroke="#22d3ee" strokeWidth="1.5"/>
                            {/* Current value dots */}
                            <circle cx={xScale(last.min)} cy={yScale(last.hw)} r="3" fill="#22d3ee"/>
                            <circle cx={xScale(last.min)} cy={yScale(last.aw)} r="3" fill="#a855f7"/>
                          </svg>
                          {/* Current probabilities */}
                          <div className="flex items-center justify-between mt-2 text-[11px]">
                            <div className="text-center">
                              <p className="font-black text-cyan-400" style={{fontFamily:'JetBrains Mono'}}>{(last.hw*100).toFixed(0)}%</p>
                              <p className="text-slate-600 text-[10px]">{(match.homeTeam||'').replace(/ FC$/,'').split(' ')[0]}</p>
                            </div>
                            <div className="text-center">
                              <p className="font-black text-slate-500" style={{fontFamily:'JetBrains Mono'}}>{(last.dr*100).toFixed(0)}%</p>
                              <p className="text-slate-600 text-[10px]">Draw</p>
                            </div>
                            <div className="text-center">
                              <p className="font-black text-purple-400" style={{fontFamily:'JetBrains Mono'}}>{(last.aw*100).toFixed(0)}%</p>
                              <p className="text-slate-600 text-[10px]">{(match.awayTeam||'').replace(/ FC$/,'').split(' ')[0]}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-600">
                            <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-cyan-400"/>{(match.homeTeam||'').replace(/ FC$/,'')}</div>
                            <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-purple-400"/>{ (match.awayTeam||'').replace(/ FC$/,'')}</div>
                            <div className="flex items-center gap-1"><div className="w-4 h-0.5 rounded" style={{background:'rgba(100,116,139,0.5)'}}/>Draw</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══ ATTACK ZONES MAP ══ */}
                  {events.length > 0 && (() => {
                    // Classify each event into a zone: 3 cols × 2 halves = 6 zones
                    // Zone columns: Left (x<33), Centre (33-66), Right (x>66)
                    // Zone rows: Home attacking half, Away attacking half
                    // Approximate from event type + team + time
                    const homeZones = { tl:0, tc:0, tr:0, bl:0, bc:0, br:0 };
                    const awayZones = { tl:0, tc:0, tr:0, bl:0, bc:0, br:0 };
                    // Use ALL events — goals weighted higher, cards/subs lighter
                    events.forEach((e, ei) => {
                      const t = parseInt(e.time) || 0;
                      const isHome = e.team === match.homeTeam;
                      const zones = isHome ? homeZones : awayZones;
                      // Weight by event type
                      const weight = e.type==='Goal' ? 3 : e.type==='Card' ? 1 : e.type==='subst' ? 1 : 2;
                      // Column: spread events across left/centre/right using event index + time
                      // Goals/shots → centre-weighted, others spread wider
                      let col;
                      if (e.type === 'Goal') {
                        // Goals can come from any zone — use time-based spread
                        col = t % 3;
                      } else {
                        // Use event index for natural distribution
                        col = (ei + Math.floor(t / 20)) % 3;
                      }
                      // Home team attacks into away half (top of grid = tl/tc/tr)
                      // Away team attacks into home half (bottom of grid = bl/bc/br)
                      if (isHome) {
                        if (col === 0) zones.tl += weight;
                        else if (col === 1) zones.tc += weight;
                        else zones.tr += weight;
                      } else {
                        if (col === 0) zones.bl += weight;
                        else if (col === 1) zones.bc += weight;
                        else zones.br += weight;
                      }
                    });
                    // Fallback: if still all zero (no events at all), show equal base
                    const totalH = Object.values(homeZones).reduce((a,b)=>a+b,0);
                    const totalA = Object.values(awayZones).reduce((a,b)=>a+b,0);
                    if (totalH === 0) { homeZones.tl=1; homeZones.tc=1; homeZones.tr=1; }
                    if (totalA === 0) { awayZones.bl=1; awayZones.bc=1; awayZones.br=1; }
                    const hMax = Math.max(...Object.values(homeZones), 1);
                    const aMax = Math.max(...Object.values(awayZones), 1);
                    const cell = (val, max, color, label) => {
                      const pct = val / max;
                      return (
                        <div className="relative flex items-center justify-center rounded-lg border border-white/[0.05]"
                          style={{
                            background: `rgba(${color === 'cyan' ? '34,211,238' : '168,85,247'},${Math.max(0.05, pct * 0.45)})`,
                            aspectRatio: '1.2',
                            minHeight: 36,
                          }}>
                          {val > 0 && <span className="text-[11px] font-black" style={{color: color==='cyan'?'#22d3ee':'#a855f7', fontFamily:'JetBrains Mono'}}>{val}</span>}
                        </div>
                      );
                    };
                    return (
                      <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{background:'rgba(10,14,26,0.85)'}}>
                        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2" style={{background:'rgba(168,85,247,0.03)'}}>
                          <BarChartIcon className="w-4 h-4 text-purple-400"/>
                          <span className="text-white font-black text-sm">Attack Zones</span>
                          <span className="ml-auto text-[10px] text-slate-600">Event density by pitch zone</span>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-3 gap-1.5 mb-1">
                            {/* Away attacking zones (top) */}
                            {cell(awayZones.tl, aMax, 'purple', 'TL')}
                            {cell(awayZones.tc, aMax, 'purple', 'TC')}
                            {cell(awayZones.tr, aMax, 'purple', 'TR')}
                          </div>
                          {/* Halfway divider */}
                          <div className="flex items-center gap-2 my-1.5">
                            <div className="flex-1 h-px" style={{background:'rgba(255,255,255,0.08)'}}/>
                            <span className="text-[9px] text-slate-700 uppercase tracking-widest">Halfway</span>
                            <div className="flex-1 h-px" style={{background:'rgba(255,255,255,0.08)'}}/>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 mt-1">
                            {/* Home attacking zones (bottom) */}
                            {cell(homeZones.bl, hMax, 'cyan', 'BL')}
                            {cell(homeZones.bc, hMax, 'cyan', 'BC')}
                            {cell(homeZones.br, hMax, 'cyan', 'BR')}
                          </div>
                          <div className="flex items-center justify-between mt-3 text-[10px] text-slate-600">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm" style={{background:'rgba(34,211,238,0.4)'}}/>{(match.homeTeam||'').replace(/ FC$/,'').split(' ')[0]}</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm" style={{background:'rgba(168,85,247,0.4)'}}/>{(match.awayTeam||'').replace(/ FC$/,'').split(' ')[0]}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══ LIVE STATS ROW ══ */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {label:'Shots',   h:hStats['Total Shots']??'–',   a:aStats['Total Shots']??'–',   icon:'🎯'},
                      {label:'On Tgt',  h:hStats['Shots on Goal']??'–', a:aStats['Shots on Goal']??'–', icon:'🥅'},
                      {label:'Corners', h:hStats['Corner Kicks']??'–',  a:aStats['Corner Kicks']??'–',  icon:'⚑'},
                      {label:'Fouls',   h:hStats['Fouls']??'–',         a:aStats['Fouls']??'–',         icon:'🚩'},
                    ].map((s,i) => (
                      <div key={i} className="rounded-xl p-2.5 border text-center" style={{background:'rgba(10,14,26,0.85)',borderColor:'rgba(255,255,255,0.07)'}}>
                        <div className="text-base mb-1">{s.icon}</div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[13px] font-black text-cyan-400" style={{fontFamily:'JetBrains Mono'}}>{s.h}</span>
                          <span className="text-[13px] font-black text-purple-400" style={{fontFamily:'JetBrains Mono'}}>{s.a}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* ══ LIVE COMMENTARY ══ */}
                  <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{background:'rgba(6,10,20,0.9)'}}>
                    <div className="px-4 py-3 border-b border-white/[0.05] flex items-center gap-2" style={{background:'rgba(239,68,68,0.04)'}}>
                      <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"/><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"/></span>
                      <span className="text-white font-black text-sm">Commentary</span>
                      <span className="ml-auto text-[11px] text-slate-600">{events.length} events</span>
                    </div>
                    {recent5.length > 0 ? (
                      <div className="divide-y divide-white/[0.04]">
                        {recent5.map((evt, i) => {
                          const isHome = evt.team === match.homeTeam;
                          const isGoal = evt.type==='Goal' && evt.detail!=='Missed Penalty';
                          const isCard = evt.type==='Card';
                          const isSub  = evt.type==='subst';
                          const color  = isGoal?'#f59e0b':isCard?(evt.detail?.includes('Red')?'#ef4444':'#eab308'):isHome?'#22d3ee':'#a855f7';
                          const icon   = isGoal?'⚽':isCard?(evt.detail?.includes('Red')?'🟥':'🟨'):isSub?'🔄':'•';
                          const text   = isGoal
                            ? `GOAL! ${evt.player}${evt.detail==='Penalty'?' (P)':evt.detail==='Own Goal'?' (OG)':''}${evt.assist?` ← ${evt.assist}`:''}`
                            : isSub  ? `Sub ▲${evt.assist} ▼${evt.player}`
                            : isCard ? `${evt.player} · ${evt.detail}`
                            : evt.player||evt.detail||'';
                          return (
                            <div key={i} className="flex items-start gap-3 px-4 py-3"
                              style={{background: i===0?`${color}06`:'transparent', animation: i===0?'mcSlideIn 0.4s ease-out':'none'}}>
                              <span className="text-[11px] font-black w-8 pt-0.5 flex-shrink-0" style={{color:'#475569',fontFamily:'JetBrains Mono'}}>{evt.time}'</span>
                              <span className="text-base flex-shrink-0">{icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${isGoal?'font-black text-white':i===0?'font-semibold text-slate-200':'text-slate-400'}`}>{text}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {evt.teamLogo && <img src={evt.teamLogo} alt="" className="w-3 h-3 flex-shrink-0"/>}
                                  <span className="text-[10px] font-semibold" style={{color:isHome?'rgba(34,211,238,0.6)':'rgba(168,85,247,0.6)'}}>{evt.team?.replace(/ FC$/,'')}</span>
                                </div>
                              </div>
                              {i===0 && <span className="flex-shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-md" style={{background:`${color}18`,color,border:`1px solid ${color}30`}}>Now</span>}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center">
                        <p className="text-slate-500 text-sm">Waiting for match events…</p>
                      </div>
                    )}
                  </div>

                  {/* ══ GOALS TIMELINE ══ */}
                  {goals.length > 0 && (
                    <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{background:'rgba(6,10,20,0.9)'}}>
                      <div className="px-4 py-3 border-b border-white/[0.05]" style={{background:'rgba(245,158,11,0.04)'}}>
                        <span className="text-white font-black text-sm">⚽ Goals</span>
                      </div>
                      <div className="divide-y divide-white/[0.04]">
                        {goals.map((g,i) => {
                          const isHome = (g.team===match.homeTeam&&g.detail!=='Own Goal')||(g.team===match.awayTeam&&g.detail==='Own Goal');
                          const c = isHome ? '#22d3ee' : '#a855f7';
                          return (
                            <div key={i} className="flex items-center gap-3 px-4 py-3" style={{background:`${c}05`}}>
                              <span className="text-[11px] font-black flex-shrink-0 w-8" style={{fontFamily:'JetBrains Mono',color:'#64748b'}}>{g.time}'</span>
                              <span className="text-base flex-shrink-0">⚽</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-black text-sm">{g.player}{g.detail==='Penalty'?' (P)':g.detail==='Own Goal'?' (OG)':''}</p>
                                {g.assist && g.assist!==g.player && <p className="text-[11px] text-slate-500">↳ {g.assist}</p>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {g.teamLogo && <img src={g.teamLogo} alt="" className="w-4 h-4 flex-shrink-0"/>}
                                <span className="text-[11px] font-bold" style={{color:c}}>{g.team?.replace(/ FC$/,'')}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ══ PRE-MATCH NOTE ══ */}
                  {!live && !isFinishedStatus(match.status) && events.length === 0 && (
                    <div className="rounded-2xl border border-cyan-500/15 p-5 text-center" style={{background:'rgba(34,211,238,0.04)'}}>
                      <p className="text-cyan-400 text-sm font-bold mb-1">Match hasn't started yet</p>
                      <p className="text-slate-500 text-[12px]">The live simulation activates at kickoff. Formations are pre-match lineups.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ══ EVENTS TAB ══ */}
            {activeTab === 'events' && (
              <div style={{animation:'mcFadeIn 0.3s ease-out'}}>
                {/* Timeline toggle */}
                <div className="flex items-center justify-end gap-2 mb-3">
                  <button onClick={() => setTimelineView(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all" style={{background:!timelineView?'rgba(34,211,238,0.1)':'rgba(255,255,255,0.03)',borderColor:!timelineView?'rgba(34,211,238,0.25)':'rgba(255,255,255,0.07)',color:!timelineView?'#22d3ee':'#64748b'}}>
                    <ZapIcon className="w-3 h-3"/>List
                  </button>
                  <button onClick={() => setTimelineView(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all" style={{background:timelineView?'rgba(34,211,238,0.1)':'rgba(255,255,255,0.03)',borderColor:timelineView?'rgba(34,211,238,0.25)':'rgba(255,255,255,0.07)',color:timelineView?'#22d3ee':'#64748b'}}>
                    <ListIcon className="w-3 h-3"/>Timeline
                  </button>
                </div>

                {timelineView ? renderTimeline() : (
                  <div className="space-y-2">
                    {match.events && match.events.length > 0 ? match.events.map((evt, i) => {
                      const isHome     = evt.team === match.homeTeam;
                      const isGoal     = evt.type==='Goal'&&evt.detail!=='Missed Penalty';
                      const isMissedPen= evt.detail==='Missed Penalty';
                      const isCard     = evt.type==='Card';
                      const isRed      = evt.detail==='Red Card'||evt.detail==='Second Yellow card';
                      const isSub      = evt.type==='subst';
                      const isVar      = evt.type==='Var';
                      const teamColor  = isHome?'#22d3ee':'#a855f7';
                      const timeStr    = `${evt.time}'${evt.extra?`+${evt.extra}`:''}`;

                      if (isGoal) {
                        const isPenalty = evt.detail==='Penalty', isOwnGoal = evt.detail==='Own Goal';
                        const cH = match.events.filter((e,ei)=>ei<=i&&e.type==='Goal'&&e.detail!=='Missed Penalty'&&((e.team===match.homeTeam&&e.detail!=='Own Goal')||(e.team===match.awayTeam&&e.detail==='Own Goal'))).length;
                        const cA = match.events.filter((e,ei)=>ei<=i&&e.type==='Goal'&&e.detail!=='Missed Penalty'&&((e.team===match.awayTeam&&e.detail!=='Own Goal')||(e.team===match.homeTeam&&e.detail==='Own Goal'))).length;
                        return (
                          <div key={i} className="rounded-2xl overflow-hidden border" style={{borderColor:`${teamColor}30`,animation:`mcSlideIn 0.3s ease-out ${i*0.04}s both`}}>
                            <div className="py-4 text-center relative overflow-hidden" style={{background:`linear-gradient(135deg,${teamColor}18,${teamColor}06)`}}>
                              <div className="absolute top-0 left-0 right-0 h-0.5" style={{background:`linear-gradient(90deg,transparent,${teamColor}70,transparent)`}}/>
                              <TargetIcon className="w-5 h-5 mx-auto mb-1.5" style={{color:teamColor}}/>
                              <p className="text-white font-black text-base tracking-widest uppercase">Goal!</p>
                              <p className="text-[12px] font-black mt-0.5" style={{color:`${teamColor}90`,fontFamily:'JetBrains Mono'}}>{timeStr}</p>
                            </div>
                            <div className="py-2.5 text-center border-b" style={{background:'rgba(0,0,0,0.3)',borderColor:'rgba(255,255,255,0.06)'}}>
                              <span className={`text-sm ${isHome&&!isOwnGoal?'text-white font-bold':'text-slate-500'}`}>{(match.homeTeam||'').replace(/ FC$/,'')}</span>
                              <span className="text-white font-black mx-3 text-xl" style={{fontFamily:'JetBrains Mono'}}>{cH} - {cA}</span>
                              <span className={`text-sm ${!isHome&&!isOwnGoal?'text-white font-bold':'text-slate-500'}`}>{(match.awayTeam||'').replace(/ FC$/,'')}</span>
                            </div>
                            <div className="px-5 py-4" style={{background:'rgba(10,14,26,0.8)'}}>
                              <p className="text-white font-black text-base">{evt.player}{isOwnGoal?' (OG)':''}{isPenalty?' (Pen)':''}</p>
                              <div className="flex items-center gap-2 mt-1">{evt.teamLogo&&<img src={evt.teamLogo} alt="" className="w-4 h-4"/>}<span className="text-slate-400 text-[12px]">{evt.team}</span></div>
                              {evt.assist&&evt.assist!==evt.player&&!isPenalty&&<p className="text-slate-500 text-[12px] mt-1">Assist: <span className="text-slate-300 font-semibold">{evt.assist}</span></p>}
                            </div>
                          </div>
                        );
                      }
                      if (isMissedPen) return (
                        <div key={i} className="rounded-2xl overflow-hidden border border-red-500/15" style={{animation:`mcSlideIn 0.3s ease-out ${i*0.04}s both`}}>
                          <div className="py-3 text-center" style={{background:'rgba(239,68,68,0.06)'}}><XCircleIcon className="w-5 h-5 text-red-400 mx-auto mb-1"/><p className="text-red-400 font-black text-sm tracking-widest uppercase">Penalty Missed</p><p className="text-[12px] text-red-400/60 mt-0.5" style={{fontFamily:'JetBrains Mono'}}>{timeStr}</p></div>
                          <div className="px-5 py-3" style={{background:'rgba(10,14,26,0.8)'}}><p className="text-white font-bold text-sm">{evt.player}</p><div className="flex items-center gap-1.5 mt-0.5">{evt.teamLogo&&<img src={evt.teamLogo} alt="" className="w-3.5 h-3.5"/>}<span className="text-slate-500 text-[12px]">{evt.team}</span></div></div>
                        </div>
                      );
                      if (isCard) return (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all" style={{background:'rgba(10,14,26,0.7)',borderColor:isRed?'rgba(239,68,68,0.15)':'rgba(234,179,8,0.12)',animation:`mcSlideIn 0.3s ease-out ${i*0.04}s both`}}>
                          <span className="text-[12px] font-black text-slate-500 w-10 text-center flex-shrink-0" style={{fontFamily:'JetBrains Mono'}}>{timeStr}</span>
                          {isRed&&evt.detail!=='Second Yellow card'?<RedCardSVG/>:evt.detail==='Second Yellow card'?<YellowRedCardSVG/>:<YellowCardSVG/>}
                          <div className="flex-1"><p className={`text-sm font-bold ${isRed?'text-red-400':'text-yellow-400'}`}>{evt.player}</p><div className="flex items-center gap-1.5 mt-0.5">{evt.teamLogo&&<img src={evt.teamLogo} alt="" className="w-3 h-3"/>}<span className="text-[12px] text-slate-600">{evt.team}</span>{evt.detail&&<span className="text-[12px] text-slate-700">· {evt.detail}</span>}</div></div>
                        </div>
                      );
                      if (isSub) return (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.05]" style={{background:'rgba(10,14,26,0.7)',animation:`mcSlideIn 0.3s ease-out ${i*0.04}s both`}}>
                          <span className="text-[12px] font-black text-slate-500 w-10 text-center flex-shrink-0" style={{fontFamily:'JetBrains Mono'}}>{timeStr}</span>
                          <RepeatIcon className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                          <div className="flex-1"><div className="flex items-center gap-2"><span className="text-emerald-400 text-xs">▲</span><span className="text-sm text-emerald-400 font-semibold">{evt.assist}</span></div><div className="flex items-center gap-2 mt-0.5"><span className="text-red-400 text-xs">▼</span><span className="text-sm font-semibold text-red-400">{evt.player}</span></div><div className="flex items-center gap-1.5 mt-1">{evt.teamLogo&&<img src={evt.teamLogo} alt="" className="w-3 h-3"/>}<span className="text-[12px] text-slate-600">{evt.team}</span></div></div>
                        </div>
                      );
                      return (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.05]" style={{background:'rgba(10,14,26,0.7)',animation:`mcSlideIn 0.3s ease-out ${i*0.04}s both`}}>
                          <span className="text-[12px] font-black text-slate-500 w-10 text-center flex-shrink-0" style={{fontFamily:'JetBrains Mono'}}>{timeStr}</span>
                          {isVar?<MonitorIcon className="w-4 h-4 text-blue-400 flex-shrink-0"/>:<AlertTriangleIcon className="w-4 h-4 text-slate-500 flex-shrink-0"/>}
                          <div className="flex-1"><p className="text-sm font-semibold text-slate-300">{evt.player}</p><div className="flex items-center gap-1.5 mt-0.5">{evt.teamLogo&&<img src={evt.teamLogo} alt="" className="w-3 h-3"/>}<span className="text-[12px] text-slate-600">{evt.team}</span>{evt.detail&&<span className="text-[12px] text-slate-500">· {evt.detail}</span>}</div></div>
                        </div>
                      );
                    }) : (
                      <div className="rounded-2xl border border-white/[0.05] py-16 text-center" style={{background:'rgba(10,14,26,0.7)'}}>
                        <ZapIcon className="w-8 h-8 text-slate-700 mx-auto mb-3"/>
                        <p className="text-slate-500 text-sm font-semibold">No events recorded yet</p>
                        <p className="text-slate-700 text-[12px] mt-1">Events appear as the match progresses</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══ STATS TAB ══ */}
            {activeTab === 'stats' && (
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{background:'rgba(10,14,26,0.8)',animation:'mcFadeIn 0.3s ease-out'}}>
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between" style={{background:'rgba(34,211,238,0.04)'}}>
                  <div className="flex items-center gap-2"><BarChartIcon className="w-4 h-4 text-cyan-400"/><h3 className="text-white font-black text-base">Match Statistics</h3></div>
                  <div className="flex items-center gap-3 text-[12px] font-black"><span className="text-cyan-400">{(match.homeTeam||'').replace(/ FC$/,'')}</span><span className="text-slate-600">vs</span><span className="text-purple-400">{(match.awayTeam||'').replace(/ FC$/,'')}</span></div>
                </div>
                <div className="p-5">
                  {match.statistics && Object.keys(match.statistics).length >= 2 ? (
                    <div className="space-y-4">
                      {(() => {
                        const teams=Object.keys(match.statistics), hS=match.statistics[teams[0]]||{}, aS=match.statistics[teams[1]]||{};
                        return ['Ball Possession','Total Shots','Shots on Goal','Shots off Goal','Corner Kicks','Fouls','Offsides','Yellow Cards','Red Cards','Goalkeeper Saves','Total passes','Passes accurate','Pass %','expected_goals'].map(k=>{
                          const h=hS[k],a=aS[k]; if(h==null&&a==null) return null;
                          return <StatRow key={k} label={k} home={h} away={a}/>;
                        }).filter(Boolean);
                      })()}
                    </div>
                  ) : (
                    <div className="py-16 text-center"><BarChartIcon className="w-8 h-8 text-slate-700 mx-auto mb-3"/><p className="text-slate-500 text-sm">Statistics not available yet</p><p className="text-slate-700 text-[12px] mt-1">Stats appear after kickoff</p></div>
                  )}

                  {/* Goals timing chart */}
                  {match.events && match.events.filter(e=>e.type==='Goal'&&e.detail!=='Missed Penalty').length > 0 && (
                    <div className="mt-5 pt-5 border-t border-white/[0.06]">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em] mb-3">Goals by time period</p>
                      <div className="space-y-2">
                        {[
                          {label:"0-15",  min:0,  max:15},
                          {label:"16-30", min:16, max:30},
                          {label:"31-45", min:31, max:45},
                          {label:"46-60", min:46, max:60},
                          {label:"61-75", min:61, max:75},
                          {label:"76-90", min:76, max:120},
                        ].map(({label, min, max}) => {
                          const goals = match.events.filter(e => e.type==='Goal' && e.detail!=='Missed Penalty' && parseInt(e.time)>=min && parseInt(e.time)<=max);
                          const homeG = goals.filter(e => e.team===match.homeTeam).length;
                          const awayG = goals.filter(e => e.team===match.awayTeam).length;
                          const total = homeG + awayG;
                          if (total === 0) return (
                            <div key={label} className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-700 w-12 flex-shrink-0">{label}</span>
                              <div className="flex-1 h-4 rounded-lg" style={{background:'rgba(255,255,255,0.03)'}}/>
                            </div>
                          );
                          return (
                            <div key={label} className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-500 w-12 flex-shrink-0">{label}</span>
                              <div className="flex-1 flex gap-1 items-center">
                                {homeG > 0 && Array(homeG).fill(0).map((_,i) => (
                                  <div key={`h${i}`} className="h-5 flex-shrink-0 rounded-md flex items-center justify-center text-[9px] font-black px-2"
                                    style={{background:'rgba(34,211,238,0.2)',border:'1px solid rgba(34,211,238,0.3)',color:'#22d3ee',minWidth:28}}>⚽</div>
                                ))}
                                {awayG > 0 && Array(awayG).fill(0).map((_,i) => (
                                  <div key={`a${i}`} className="h-5 flex-shrink-0 rounded-md flex items-center justify-center text-[9px] font-black px-2"
                                    style={{background:'rgba(168,85,247,0.2)',border:'1px solid rgba(168,85,247,0.3)',color:'#a855f7',minWidth:28}}>⚽</div>
                                ))}
                              </div>
                              <span className="text-[10px] font-black text-slate-400 w-4 text-right">{total}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-600">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{background:'rgba(34,211,238,0.3)'}}/>{(match.homeTeam||'').replace(/ FC$/,'')}</div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{background:'rgba(168,85,247,0.3)'}}/>{(match.awayTeam||'').replace(/ FC$/,'')}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ LINEUPS TAB — PITCH VIEW ══ */}
            {activeTab === 'lineups' && (() => {
              /* ── Parse formation string → row counts ── */
              const parseFormation = (fStr) => {
                if (!fStr) return null;
                const rows = fStr.split('-').map(Number).filter(n => !isNaN(n) && n > 0);
                return rows.length >= 2 ? rows : null;
              };

              /* ── Position a player on the pitch (0–100 coordinate space) ── */
              const getPositions = (formationRows, mirror = false) => {
                // mirror=false → home team, bottom half of portrait pitch (y: 76–132)
                // mirror=true  → away team, top half of portrait pitch  (y: 8–64)
                const allRows = [1, ...formationRows]; // GK + outfield rows
                const positions = [];
                const totalRows = allRows.length;
                allRows.forEach((count, rowIdx) => {
                  const t = rowIdx / (totalRows - 1); // 0=GK end, 1=attack end
                  // Home: GK at y=132, attack edge at y=76 (bottom half, attacks upward)
                  // Away: GK at y=8,   attack edge at y=64 (top half, attacks downward)
                  const y = mirror
                    ? 8  + t * 56   // away:  8  → 64
                    : 132 - t * 56; // home: 132 → 76
                  for (let col = 0; col < count; col++) {
                    const x = count === 1 ? 50 : 10 + (col / (count - 1)) * 80;
                    positions.push({ x, y });
                  }
                });
                return positions;
              };

              /* ── Single pitch SVG with both teams ── */
              const BothTeamsPitch = ({ homeLineup, awayLineup }) => {
                const [showLines,   setShowLines]   = React.useState(false);
                const [showHeatmap, setShowHeatmap] = React.useState(false);

                const homeRows   = parseFormation(homeLineup?.formation);
                const awayRows   = parseFormation(awayLineup?.formation);
                const homePlayers = homeLineup?.startXI || [];
                const awayPlayers = awayLineup?.startXI || [];
                const homePos    = homeRows ? getPositions(homeRows, false) : [];
                const awayPos    = awayRows ? getPositions(awayRows, true)  : [];
                const events     = match.events || [];

                // Derive per-player event state from match events
                const scorers    = new Set(events.filter(e=>e.type==='Goal'&&e.detail!=='Missed Penalty').map(e=>e.player));
                const yellowCards= new Set(events.filter(e=>e.type==='Card'&&e.detail==='Yellow Card').map(e=>e.player));
                const redCards   = new Set(events.filter(e=>e.type==='Card'&&(e.detail==='Red Card'||e.detail==='Second Yellow card')).map(e=>e.player));
                const subbedOff  = new Set(events.filter(e=>e.type==='subst').map(e=>e.player));

                const renderPlayer = (pos, p, baseColor, key) => {
                  if (!p) return null;
                  const surname  = (p.name||'').split(' ').pop();
                  const display  = surname.length > 9 ? surname.slice(0,8)+'.' : surname;
                  const isScorer = scorers.has(p.name);
                  const isYellow = yellowCards.has(p.name);
                  const isRed    = redCards.has(p.name);
                  const isSub    = subbedOff.has(p.name);
                  const isCapt   = p.captain === true;
                  const dotColor = isRed ? '#ef4444' : baseColor;
                  const dotOp    = isSub ? 0.5 : 0.97;
                  const ringCol  = isCapt ? '#fbbf24' : 'white';
                  const ringW    = isCapt ? 0.9 : 0.5;
                  const glowR    = isScorer ? 6.5 : 4.5;
                  const glowOp   = isScorer ? 0.4 : 0.15;
                  return (
                    <g key={key}>
                      <circle cx={pos.x} cy={pos.y} r={glowR}  fill={baseColor} opacity={glowOp}/>
                      <circle cx={pos.x} cy={pos.y} r="3.2" fill={dotColor} opacity={dotOp}/>
                      <circle cx={pos.x} cy={pos.y} r="3.2" fill="none" stroke={ringCol} strokeWidth={ringW} opacity="0.85"
                        strokeDasharray={isSub ? '1.5,1' : undefined}/>
                      <text x={pos.x} y={pos.y+0.9} textAnchor="middle" dominantBaseline="middle"
                        fill="white" fontSize="2.1" fontWeight="900" fontFamily="JetBrains Mono">{p.number}</text>
                      <text x={pos.x} y={pos.y+6} textAnchor="middle"
                        fill={isSub ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)'}
                        fontSize="2.3" fontFamily="system-ui">{display}</text>
                      {isYellow && !isRed && <rect x={pos.x+2.4} y={pos.y-5.4} width="1.8" height="2.5" rx="0.3" fill="#eab308"/>}
                      {isRed    &&           <rect x={pos.x+2.4} y={pos.y-5.4} width="1.8" height="2.5" rx="0.3" fill="#ef4444"/>}
                      {isScorer && <text x={pos.x+4}   y={pos.y-2.8} fontSize="3"   textAnchor="middle">⚽</text>}
                      {isSub    && <text x={pos.x}     y={pos.y-5.2} fontSize="3.2" textAnchor="middle" fill="#f97316" fontWeight="900">↕</text>}
                    </g>
                  );
                };

                const renderLines = (positions, color) => {
                  const byRow = {};
                  positions.forEach(p => { const k = Math.round(p.y*2)/2; byRow[k] = [...(byRow[k]||[]), p]; });
                  return Object.values(byRow).flatMap((row,ri) =>
                    row.slice(0,-1).map((p,i) => (
                      <line key={`ln-${ri}-${i}`}
                        x1={p.x} y1={p.y} x2={row[i+1].x} y2={row[i+1].y}
                        stroke={color} strokeWidth="0.35" opacity="0.35"/>
                    ))
                  );
                };

                return (
                  <div className="rounded-2xl overflow-hidden border border-white/[0.06]" style={{background:'rgba(10,14,26,0.8)'}}>
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between gap-2" style={{background:'rgba(255,255,255,0.02)'}}>
                      <div className="flex items-center gap-2 min-w-0">
                        {homeLineup?.teamLogo && <img src={homeLineup.teamLogo} alt="" className="w-4 h-4 flex-shrink-0"/>}
                        <span className="text-cyan-400 font-black text-sm truncate">{homeLineup?.team?.replace(/ FC$| AFC$/,'')}</span>
                        {homeLineup?.formation && <span className="text-[10px] font-black px-2 py-0.5 rounded-lg flex-shrink-0" style={{background:'rgba(34,211,238,0.1)',color:'#22d3ee',border:'1px solid rgba(34,211,238,0.2)',fontFamily:'JetBrains Mono'}}>{homeLineup.formation}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={()=>setShowHeatmap(v=>!v)}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap"
                          style={{background:showHeatmap?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.04)',borderColor:showHeatmap?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.08)',color:showHeatmap?'#ef4444':'#64748b'}}>
                          Heatmap
                        </button>
                        <button onClick={()=>setShowLines(v=>!v)}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap"
                          style={{background:showLines?'rgba(34,211,238,0.15)':'rgba(255,255,255,0.04)',borderColor:showLines?'rgba(34,211,238,0.3)':'rgba(255,255,255,0.08)',color:showLines?'#22d3ee':'#64748b'}}>
                          Lines
                        </button>
                      </div>
                      <div className="flex items-center gap-2 min-w-0 justify-end">
                        {awayLineup?.formation && <span className="text-[10px] font-black px-2 py-0.5 rounded-lg flex-shrink-0" style={{background:'rgba(168,85,247,0.1)',color:'#a855f7',border:'1px solid rgba(168,85,247,0.2)',fontFamily:'JetBrains Mono'}}>{awayLineup.formation}</span>}
                        <span className="text-purple-400 font-black text-sm truncate">{awayLineup?.team?.replace(/ FC$| AFC$/,'')}</span>
                        {awayLineup?.teamLogo && <img src={awayLineup.teamLogo} alt="" className="w-4 h-4 flex-shrink-0"/>}
                      </div>
                    </div>

                    {/* Pitch */}
                    <div className="p-2">
                      <svg viewBox="0 0 100 140" width="100%" style={{maxHeight:500,display:'block'}}>
                        <defs>
                          <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#0d5a36" stopOpacity="0.95"/>
                            <stop offset="50%"  stopColor="#083d22" stopOpacity="1"/>
                            <stop offset="100%" stopColor="#0d5a36" stopOpacity="0.95"/>
                          </linearGradient>
                          <pattern id="pitchStripes" patternUnits="userSpaceOnUse" width="100" height="10">
                            <rect width="100" height="5" fill="rgba(255,255,255,0.018)"/>
                            <rect y="5" width="100" height="5" fill="rgba(0,0,0,0)"/>
                          </pattern>
                          <radialGradient id="heatH" cx="50%" cy="22%" r="40%">
                            <stop offset="0%"   stopColor="#22d3ee" stopOpacity="0.5"/>
                            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0"/>
                          </radialGradient>
                          <radialGradient id="heatA" cx="50%" cy="78%" r="40%">
                            <stop offset="0%"   stopColor="#a855f7" stopOpacity="0.5"/>
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
                          </radialGradient>
                        </defs>

                        {/* Grass */}
                        <rect x="0" y="0" width="100" height="140" fill="url(#pitchGrad)"/>
                        <rect x="0" y="0" width="100" height="140" fill="url(#pitchStripes)"/>

                        {/* Pitch markings */}
                        <rect x="1" y="1" width="98" height="138" rx="2" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4"/>
                        <line x1="1" y1="70" x2="99" y2="70" stroke="rgba(255,255,255,0.2)" strokeWidth="0.35"/>
                        <circle cx="50" cy="70" r="9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.35"/>
                        <circle cx="50" cy="70" r="0.8" fill="rgba(255,255,255,0.5)"/>
                        <rect x="20" y="1"   width="60" height="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.35"/>
                        <rect x="32" y="1"   width="36" height="9"  fill="none" stroke="rgba(255,255,255,0.1)"  strokeWidth="0.3"/>
                        <circle cx="50" cy="11"  r="0.6" fill="rgba(255,255,255,0.4)"/>
                        <rect x="20" y="121" width="60" height="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.35"/>
                        <rect x="32" y="130" width="36" height="9"  fill="none" stroke="rgba(255,255,255,0.1)"  strokeWidth="0.3"/>
                        <circle cx="50" cy="129" r="0.6" fill="rgba(255,255,255,0.4)"/>
                        <path d="M1,6 A5,5 0 0,0 6,1"     fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3"/>
                        <path d="M94,1 A5,5 0 0,0 99,6"   fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3"/>
                        <path d="M1,134 A5,5 0 0,1 6,139" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3"/>
                        <path d="M94,139 A5,5 0 0,1 99,134" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3"/>
                        <rect x="40" y="0"     width="20" height="1.5" fill="rgba(255,255,255,0.3)" rx="0.3"/>
                        <rect x="40" y="138.5" width="20" height="1.5" fill="rgba(255,255,255,0.3)" rx="0.3"/>

                        {/* Heatmap overlay */}
                        {showHeatmap && <rect x="0" y="0" width="100" height="140" fill="url(#heatH)"/>}
                        {showHeatmap && <rect x="0" y="0" width="100" height="140" fill="url(#heatA)"/>}

                        {/* Formation lines */}
                        {showLines && renderLines(homePos, '#22d3ee')}
                        {showLines && renderLines(awayPos, '#a855f7')}

                        {/* Players */}
                        {homePos.map((pos,i) => renderPlayer(pos, homePlayers[i], '#22d3ee', `h${i}`))}
                        {awayPos.map((pos,i) => renderPlayer(pos, awayPlayers[i], '#a855f7', `a${i}`))}

                        {/* Attack direction */}
                        <text x="50" y="5.5"   textAnchor="middle" fill="rgba(34,211,238,0.5)"  fontSize="2.8" fontFamily="system-ui">ATTACK ↑</text>
                        <text x="50" y="136.5" textAnchor="middle" fill="rgba(168,85,247,0.5)" fontSize="2.8" fontFamily="system-ui">↓ ATTACK</text>
                      </svg>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.05] flex-wrap" style={{background:'rgba(0,0,0,0.2)'}}>
                      {[
                        {label:'Captain', el:<><svg width="10" height="10" viewBox="0 0 10 10" style={{display:'inline',verticalAlign:'middle'}}><circle cx="5" cy="5" r="4" fill="#22d3ee"/><circle cx="5" cy="5" r="4" fill="none" stroke="#fbbf24" strokeWidth="1.5"/></svg></>},
                        {label:'Goal',    el:<span style={{fontSize:10}}>⚽</span>},
                        {label:'Yellow',  el:<div style={{width:6,height:8,background:'#eab308',borderRadius:1,display:'inline-block'}}/>},
                        {label:'Red',     el:<div style={{width:6,height:8,background:'#ef4444',borderRadius:1,display:'inline-block'}}/>},
                        {label:'Subbed',  el:<span style={{fontSize:11,color:'#f97316',fontWeight:900}}>↕</span>},
                      ].map((item,i)=>(
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          {item.el}{item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              };

              /* ── Player list for subs / missing pitch data ── */
              const PlayerList = ({ lineup, color }) => (
                <div className="rounded-2xl border overflow-hidden" style={{background:'rgba(10,14,26,0.8)',borderColor:`${color}12`}}>
                  <div className="px-4 py-3 border-b flex items-center justify-between" style={{borderColor:`${color}10`,background:`${color}06`}}>
                    <div className="flex items-center gap-2">
                      {lineup.teamLogo && <img src={lineup.teamLogo} alt="" className="w-4 h-4"/>}
                      <span className="font-black text-sm text-white">{lineup.team?.replace(/ FC$| AFC$/,'')}</span>
                    </div>
                    {lineup.coach && <span className="text-[11px] text-slate-500 flex items-center gap-1"><UserIcon className="w-3 h-3"/>{lineup.coach}</span>}
                  </div>
                  {lineup.substitutes?.length > 0 && (
                    <div className="p-4">
                      <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] font-bold mb-2">Substitutes</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {lineup.substitutes.map((player, pi) => (
                          <div key={pi} className="flex items-center gap-2 rounded-xl px-2.5 py-2 border" style={{background:'rgba(255,255,255,0.02)',borderColor:'rgba(255,255,255,0.04)'}}>
                            <span className="text-[11px] font-black w-4 text-center flex-shrink-0 text-slate-600" style={{fontFamily:'JetBrains Mono'}}>{player.number}</span>
                            <span className="text-xs text-slate-400 truncate flex-1">{player.name}</span>
                            <span className="text-[9px] text-slate-600 flex-shrink-0">{player.pos}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );

              const lineups = match.lineups || [];
              const hasLineups = lineups.length > 0 && lineups[0]?.startXI?.length > 0;

              return (
                <div className="space-y-4" style={{animation:'mcFadeIn 0.3s ease-out'}}>
                  {hasLineups ? (
                    <>
                      <BothTeamsPitch homeLineup={lineups[0]} awayLineup={lineups[1]}/>
                      {lineups.map((lineup, li) => (
                        <PlayerList key={li} lineup={lineup} color={li===0?'#22d3ee':'#a855f7'}/>
                      ))}
                    </>
                  ) : (
                    <div className="rounded-2xl border border-white/[0.05] py-16 text-center" style={{background:'rgba(10,14,26,0.7)'}}>
                      <UsersIcon className="w-8 h-8 text-slate-700 mx-auto mb-3"/>
                      <p className="text-slate-500 text-sm">Lineups not available yet</p>
                      <p className="text-slate-700 text-[12px] mt-1">Usually published ~1 hour before kickoff</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ══ AI MATCH SUMMARY ══ */}
            <div className="mt-4 rounded-2xl border overflow-hidden" style={{background:'rgba(8,6,28,0.88)',borderColor:'rgba(139,92,246,0.2)',boxShadow:'0 0 40px rgba(139,92,246,0.06)'}}>
              <div className="h-0.5" style={{background:'linear-gradient(90deg,transparent,rgba(139,92,246,0.8),transparent)'}}/>
              <div className="px-5 py-4 border-b flex items-center gap-3" style={{borderColor:'rgba(139,92,246,0.12)',background:'rgba(139,92,246,0.06)'}}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'rgba(139,92,246,0.15)',border:'1px solid rgba(139,92,246,0.3)'}}><BrainIcon className="w-4 h-4 text-purple-400"/></div>
                <div><p className="text-white font-black text-sm">AI Match Summary</p><p className="text-slate-400 text-[12px]">Gemini AI · {STATUS_LABELS[match.status]||match.status}</p></div>
                <button onClick={fetchAISummary} disabled={loadingAI} className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold border transition-all" style={{background:loadingAI?'rgba(139,92,246,0.1)':'rgba(139,92,246,0.08)',borderColor:'rgba(139,92,246,0.25)',color:'#a855f7'}}>
                  {loadingAI?<><ActivityIcon className="w-3.5 h-3.5 animate-spin"/>Generating…</>:<><BrainIcon className="w-3.5 h-3.5"/>{aiSummary?'Refresh':'Generate'}</>}
                </button>
              </div>
              {aiSummary ? (
                <div className="p-5">
                  {aiSummary.split('\n').filter(Boolean).map((line,i) => (
                    <p key={i} className="text-slate-300 text-sm leading-relaxed mb-2 last:mb-0">{line}</p>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center"><BrainIcon className="w-7 h-7 text-slate-700 mx-auto mb-2"/><p className="text-slate-500 text-sm">Click Generate to get an AI summary</p><p className="text-slate-700 text-[12px] mt-1">Works best at half-time or full-time</p></div>
              )}
            </div>

            {/* Info footer */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                {Icon:MapPinIcon,  label:'Venue',   value:match.venue||'TBD',   color:'#22d3ee'},
                {Icon:UserIcon,    label:'Referee', value:match.referee||'TBD', color:'#a855f7'},
                {Icon:ClockIcon,   label:'Kickoff', value:match.date?new Date(match.date).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}):'TBD', color:'#f59e0b'},
                {Icon:ActivityIcon,label:'Status',  value:STATUS_LABELS[match.status]||match.status, color:live?'#ef4444':'#10b981'},
              ].map((info,i) => (
                <div key={i} className="rounded-2xl p-3.5 border relative overflow-hidden" style={{background:`linear-gradient(135deg,${info.color}08,rgba(5,8,16,0.95))`,borderColor:`${info.color}15`}}>
                  <div className="absolute top-0 left-0 right-0 h-px" style={{background:`linear-gradient(90deg,transparent,${info.color}40,transparent)`}}/>
                  <div className="flex items-center gap-1.5 mb-1.5"><info.Icon className="w-3.5 h-3.5 flex-shrink-0" style={{color:info.color}}/><span className="text-[11px] text-slate-600 uppercase tracking-[0.12em] font-bold">{info.label}</span></div>
                  <p className="text-white text-xs font-bold truncate">{info.value}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes mcFadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes mcSlideIn   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ballBounce  { from{transform:translateY(0)} to{transform:translateY(-1px)} }
        @keyframes playerPulse { 0%,100%{opacity:0.15;r:4} 50%{opacity:0.3;r:5.5} }
        @keyframes fadeIn      { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .xs\\:inline { display:inline }
        @media(max-width:400px){ .xs\\:inline{ display:none } }
      `}</style>
    </div>
  );
}

export default MatchCenterPage;