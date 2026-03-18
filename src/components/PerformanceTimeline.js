/**
 * PerformanceTimeline.js
 * 
 * Drop-in component for the Analytics page timeline tab.
 * Shows: player search, season overview, match-by-match charts,
 *        percentile rankings, cumulative stats, rating trend.
 * 
 * Save as: src/components/PerformanceTimeline.js
 * 
 * Usage in AnalyticsPage:
 *   import PerformanceTimeline from '../components/PerformanceTimeline';
 *   // In the timeline tab:
 *   <PerformanceTimeline players={allPlayersArray} onNavigate={onNavigate} />
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ReferenceLine
} from 'recharts';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

/* ───────── Inline Icons ───────── */
const Icon = ({ d, className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const SearchIcon = (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;
const TrendUpIcon = (p) => <Icon {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>} />;
const TargetIcon = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>} />;
const ClockIcon = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />;
const StarIcon = (p) => <Icon {...p} d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>} />;
const ZapIcon = (p) => <Icon {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>} />;
const ShieldIcon = (p) => <Icon {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>} />;


/* ───────── Stat Card ───────── */
const StatCard = ({ label, value, suffix = '', color = 'cyan', icon: IconComp, subtext }) => (
  <div className="bg-[#111827]/60 backdrop-blur border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
        <IconComp className={`w-5 h-5 text-${color}-400`} />
      </div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
    </div>
    <p className="text-3xl font-black text-white" style={{ fontFamily: 'JetBrains Mono' }}>
      {value}<span className="text-lg text-slate-500">{suffix}</span>
    </p>
    {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
  </div>
);


/* ───────── Percentile Bar ───────── */
const PercentileBar = ({ label, percentile, value, color = '#22d3ee' }) => (
  <div className="group">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-white font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{value}</span>
        <span className={`text-[12px] font-bold px-1.5 py-0.5 rounded ${
          percentile >= 90 ? 'bg-emerald-500/20 text-emerald-400' :
          percentile >= 70 ? 'bg-cyan-500/20 text-cyan-400' :
          percentile >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          Top {Math.max(1, 100 - percentile)}%
        </span>
      </div>
    </div>
    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${percentile}%`,
          background: `linear-gradient(90deg, ${color}44, ${color})`,
        }}
      />
    </div>
  </div>
);


/* ───────── Rating Badge ───────── */
const RatingBadge = ({ rating, size = 'lg' }) => {
  const r = parseFloat(rating) || 0;
  if (r === 0) {
    const sizeClass = size === 'lg' ? 'w-16 h-16 text-sm' : 'w-10 h-10 text-[12px]';
    return (
      <div className={`${sizeClass} rounded-xl bg-gradient-to-br from-slate-600 to-slate-500 flex items-center justify-center font-bold text-white/60 shadow-lg`}>
        N/A
      </div>
    );
  }
  const color = r >= 7.5 ? 'from-emerald-500 to-emerald-400' :
                r >= 7.0 ? 'from-cyan-500 to-cyan-400' :
                r >= 6.5 ? 'from-yellow-500 to-yellow-400' :
                'from-red-500 to-red-400';
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';
  
  return (
    <div className={`${sizeClass} rounded-xl bg-gradient-to-br ${color} flex items-center justify-center font-black text-white shadow-lg`}
         style={{ fontFamily: 'JetBrains Mono' }}>
      {r.toFixed(1)}
    </div>
  );
};


/* ───────── Custom Tooltip ───────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e293b] border border-white/10 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-white font-bold mb-1.5">Matchday {label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="text-white font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};


/* ───────── Main Component ───────── */
export default function PerformanceTimeline({ players = [], onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [matchData, setMatchData] = useState([]);
  const [percentiles, setPercentiles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeChart, setActiveChart] = useState('cumulative');
  const [showSearch, setShowSearch] = useState(false);

  // Normalize player data — handles both Understat and API-Football field names
  const normalizePlayer = (p) => {
    if (!p) return p;
    return {
      ...p,
      appearances: p.appearances || p.games || 0,
      minutes: p.minutes || p.time || 0,
      rating: p.rating || 0,
      minsPerGame: p.minsPerGame || (p.games > 0 ? Math.round((p.time || p.minutes || 0) / p.games) : 0),
      goalsPerNinety: p.goalsPerNinety || (p.minutes || p.time ? ((p.goals || 0) / Math.max(p.minutes || p.time || 1, 1) * 90).toFixed(2) : 0),
      assistsPerNinety: p.assistsPerNinety || (p.minutes || p.time ? ((p.assists || 0) / Math.max(p.minutes || p.time || 1, 1) * 90).toFixed(2) : 0),
      tacklesPerNinety: p.tacklesPerNinety || 0,
      duelsPerNinety: p.duelsPerNinety || 0,
      shotsTotal: p.shotsTotal || p.shots || 0,
      keyPasses: p.keyPasses || p.key_passes || 0,
      shotAccuracy: p.shotAccuracy || (p.shots > 0 ? Math.round((p.goals || 0) / p.shots * 100) : 0),
      passAccuracy: p.passAccuracy || p.passCompletion || 0,
      tacklesTotal: p.tacklesTotal || 0,
      interceptions: p.interceptions || 0,
      blocks: p.blocks || 0,
      duelsTotal: p.duelsTotal || 0,
      duelsWon: p.duelsWon || 0,
      duelWinPct: p.duelWinPct || 0,
      dribblesAttempted: p.dribblesAttempted || 0,
      dribblesSuccessful: p.dribblesSuccessful || 0,
      dribbleSuccessPct: p.dribbleSuccessPct || p.dribbleSuccess || 0,
      yellowCards: p.yellowCards || p.yellow_cards || 0,
      redCards: p.redCards || p.red_cards || 0,
      penaltiesScored: p.penaltiesScored || 0,
      penaltiesMissed: p.penaltiesMissed || 0,
      penaltiesWon: p.penaltiesWon || 0,
    };
  };

  // Search players — use backend API-Football cache directly
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
const resp = await fetch(`${API_BASE}/players/search?q=${encodeURIComponent(searchTerm)}&limit=15`);
        if (resp.ok) {
          const data = await resp.json();
          setSearchResults(data);
        }
      } catch (err) {
        // Fallback to local filter if backend is down
        const term = searchTerm.toLowerCase();
        const results = players
          .filter(p => p.name?.toLowerCase().includes(term) || p.team?.toLowerCase().includes(term))
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 15);
        setSearchResults(results);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, players]);

  // Fetch match data + percentiles when player selected
  const loadPlayerData = useCallback(async (player) => {
    setShowSearch(false);
    setSearchTerm('');
    setLoading(true);

    const normalized = normalizePlayer(player);
    setSelectedPlayer(normalized);

    const pid = normalized.id;

    try {
      // Fetch match-by-match data
      const matchRes = await fetch(`${API_BASE}/player/${pid}/matches`);
      if (matchRes.ok) {
        const data = await matchRes.json();
        if (data.length > 0) {
          setMatchData(data);
        } else {
          generateLocalMatchData(normalized);
        }
      } else {
        generateLocalMatchData(normalized);
      }
    } catch (err) {
      generateLocalMatchData(normalized);
    }

    try {
      // Fetch percentiles
      const percRes = await fetch(`${API_BASE}/player/${pid}/percentiles`);
      if (percRes.ok) {
        const data = await percRes.json();
        setPercentiles(data.percentiles || null);
      } else {
        generateLocalPercentiles(normalized);
      }
    } catch (err) {
      generateLocalPercentiles(normalized);
    }

    setLoading(false);
  }, []);

  // Local fallback: generate match data from season totals
  const generateLocalMatchData = (player) => {
    const apps = player.appearances || player.games || 20;
    const totalG = player.goals || 0;
    const totalA = player.assists || 0;
    const avgRating = player.rating || 6.8;
    const totalMins = player.minutes || player.time || apps * 75;

    const seed = (player.id || 1) * 137;
    const rng = (i) => {
      const x = Math.sin(seed + i * 9301) * 49297;
      return x - Math.floor(x);
    };

    let cumG = 0, cumA = 0;
    const matches = [];

    for (let i = 0; i < apps; i++) {
      const hasGoal = rng(i * 3) < (totalG / apps);
      const hasAssist = rng(i * 3 + 1) < (totalA / apps);
      const goals = hasGoal ? 1 : 0;
      const assists = hasAssist ? 1 : 0;
      
      let rating = avgRating + (rng(i * 3 + 2) - 0.5) * 1.6;
      if (goals) rating += 0.4;
      if (assists) rating += 0.2;
      rating = Math.max(5.5, Math.min(9.5, rating));

      cumG += goals;
      cumA += assists;

      matches.push({
        matchday: i + 1,
        minutes: Math.max(20, Math.min(90, Math.round(totalMins / apps + (rng(i * 7) - 0.5) * 20))),
        rating: Math.round(rating * 10) / 10,
        goals,
        assists,
        cumulativeGoals: cumG,
        cumulativeAssists: cumA,
        cumulativeGA: cumG + cumA,
      });
    }

    setMatchData(matches);
  };

  // Local fallback: percentiles from loaded players
  const generateLocalPercentiles = (player) => {
    const samePos = players.filter(p => p.position === player.position && p.league === player.league);
    if (samePos.length < 3) return;

    const calcPerc = (stat) => {
      const val = player[stat] || 0;
      const below = samePos.filter(p => (p[stat] || 0) < val).length;
      return Math.round(below / samePos.length * 100);
    };

    setPercentiles({
      goals: calcPerc('goals'),
      assists: calcPerc('assists'),
      rating: calcPerc('rating'),
      goalsPerNinety: calcPerc('goalsPerNinety'),
      assistsPerNinety: calcPerc('assistsPerNinety'),
      tacklesPerNinety: calcPerc('tacklesPerNinety'),
      duelsPerNinety: calcPerc('duelsPerNinety'),
      passAccuracy: calcPerc('passAccuracy'),
      shotAccuracy: calcPerc('shotAccuracy'),
      duelWinPct: calcPerc('duelWinPct'),
      keyPasses: calcPerc('keyPasses'),
      interceptions: calcPerc('interceptions'),
    });
  };

  // Rolling average for rating trend
  const rollingAvg = (data, window = 5) => {
    return data.map((d, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = data.slice(start, i + 1);
      const avg = slice.reduce((s, x) => s + x.rating, 0) / slice.length;
      return { ...d, rollingRating: Math.round(avg * 10) / 10 };
    });
  };

  const p = selectedPlayer;
  const matchDataWithRolling = rollingAvg(matchData);

  // Per-90 stats for radar — adapts based on available data
  const hasDefensiveStats = p && (p.tacklesTotal > 0 || p.duelsTotal > 0);
  const radarData = p ? (hasDefensiveStats ? [
    { stat: 'Goals/90', value: Math.min(100, ((p.goalsPerNinety || 0) / 0.8) * 100) },
    { stat: 'Assists/90', value: Math.min(100, ((p.assistsPerNinety || 0) / 0.5) * 100) },
    { stat: 'Tackles/90', value: Math.min(100, ((p.tacklesPerNinety || 0) / 4) * 100) },
    { stat: 'Duels/90', value: Math.min(100, ((p.duelsPerNinety || 0) / 12) * 100) },
    { stat: 'Pass Acc', value: p.passAccuracy || 0 },
    { stat: 'Shot Acc', value: p.shotAccuracy || 0 },
    { stat: 'Duel Win%', value: p.duelWinPct || 0 },
    { stat: 'Dribble%', value: p.dribbleSuccessPct || 0 },
  ] : [
    { stat: 'Goals', value: Math.min(100, ((p.goals || 0) / 30) * 100) },
    { stat: 'Assists', value: Math.min(100, ((p.assists || 0) / 18) * 100) },
    { stat: 'xG', value: Math.min(100, ((p.xG || 0) / 25) * 100) },
    { stat: 'xA', value: Math.min(100, ((p.xA || 0) / 12) * 100) },
    { stat: 'Shots', value: Math.min(100, ((p.shotsTotal || p.shots || 0) / 120) * 100) },
    { stat: 'Key Passes', value: Math.min(100, ((p.keyPasses || 0) / 80) * 100) },
    { stat: 'Goals/90', value: Math.min(100, (parseFloat(p.goalsPerNinety || 0) / 0.8) * 100) },
    { stat: 'Conversion', value: p.shotAccuracy || 0 },
  ]) : [];

  return (
    <div>
      {/* ─── Player Search ─── */}
      <div className="relative mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search for a player to view their performance timeline..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            className="w-full pl-11 pr-4 py-4 bg-[#111827]/80 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40 transition-all"
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearch && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-[#111827] border border-white/10 rounded-2xl shadow-2xl max-h-80 overflow-y-auto">
            {searchResults.map((player, i) => (
              <button
                key={player.id || i}
                onClick={() => loadPlayerData(player)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-all text-left border-b border-white/5 last:border-0"
              >
                {player.photo ? (
                  <img src={player.photo} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/5" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-sm">
                    {player.name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{player.name}</p>
                  <p className="text-slate-500 text-xs">{player.team} · {player.position} · {player.league}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-cyan-400 font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{player.goals}G</span>
                  <span className="text-yellow-400 font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{player.assists}A</span>
                  <RatingBadge rating={player.rating} size="sm" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Loading State ─── */}
      {loading && (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading player data...</p>
        </div>
      )}

      {/* ─── No Player Selected ─── */}
      {!selectedPlayer && !loading && (
        <div className="text-center py-24">
          <TrendUpIcon className="w-16 h-16 text-slate-700 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-slate-400 mb-2">Performance Timeline</h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Search for any player above to see their full season breakdown — match-by-match ratings, cumulative goals, percentile rankings, and more.
          </p>
        </div>
      )}

      {/* ─── Player Dashboard ─── */}
      {selectedPlayer && !loading && (
        <div className="space-y-6 animate-fadeIn">

          {/* Hero Header */}
          <div className="bg-[#111827]/60 backdrop-blur border border-white/5 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {p.photo ? (
                <img src={p.photo} alt={p.name} className="w-24 h-24 rounded-2xl object-cover bg-white/5 shadow-xl" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center">
                  <span className="text-4xl font-black text-cyan-400/40">{p.name?.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl md:text-3xl font-black text-white">{p.name}</h2>
                  <RatingBadge rating={p.rating} />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-cyan-400 font-semibold">{p.team}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{p.position}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{p.league}</span>
                  {p.nationality && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">{p.nationality}</span>
                    </>
                  )}
                  {p.age && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">{p.age} years</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setSelectedPlayer(null); setMatchData([]); setPercentiles(null); }}
                className="text-slate-500 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
              >
                Change Player
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Goals" value={p.goals || 0} color="cyan" icon={TargetIcon} subtext={`${p.goalsPerNinety || 0} per 90`} />
            <StatCard label="Assists" value={p.assists || 0} color="yellow" icon={ZapIcon} subtext={`${p.assistsPerNinety || 0} per 90`} />
            <StatCard label="Appearances" value={p.appearances || 0} color="emerald" icon={ShieldIcon} subtext={`${p.minutes || 0} minutes`} />
            <StatCard label={p.rating > 0 ? "Avg Rating" : "xG"} value={p.rating > 0 ? p.rating.toFixed(1) : (p.xG || 0)} color="purple" icon={StarIcon} subtext={`${p.minsPerGame || 0} mins/game`} />
          </div>

          {/* Chart Tabs */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'cumulative', label: 'Goal Accumulation' },
              { id: 'rating', label: 'Rating Trend' },
              { id: 'contributions', label: 'Match Contributions' },
              { id: 'radar', label: 'Player Profile' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveChart(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeChart === tab.id
                    ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400'
                    : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Charts */}
          <div className="bg-[#111827]/60 backdrop-blur border border-white/5 rounded-2xl p-6">
            
            {/* Cumulative Goals + Assists */}
            {activeChart === 'cumulative' && matchData.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Goal & Assist Accumulation</h3>
                <p className="text-xs text-slate-500 mb-6">Cumulative contributions through the season</p>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={matchData}>
                    <defs>
                      <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#facc15" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="matchday" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="cumulativeGA" name="G+A" stroke="#facc15" fill="url(#gaGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="cumulativeGoals" name="Goals" stroke="#22d3ee" fill="url(#goalGrad)" strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Rating Trend */}
            {activeChart === 'rating' && matchDataWithRolling.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Rating Trend</h3>
                <p className="text-xs text-slate-500 mb-6">Per-match rating with 5-game rolling average</p>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={matchDataWithRolling}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="matchday" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis domain={[5.5, 9.5]} stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={7.0} stroke="rgba(255,255,255,0.1)" strokeDasharray="5 5" label={{ value: '7.0', fill: '#475569', fontSize: 10 }} />
                    <Line type="monotone" dataKey="rating" name="Match Rating" stroke="#22d3ee" strokeWidth={1} dot={{ r: 3, fill: '#22d3ee' }} opacity={0.4} />
                    <Line type="monotone" dataKey="rollingRating" name="Rolling Avg" stroke="#a78bfa" strokeWidth={2.5} dot={false} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Per-Match Contributions */}
            {activeChart === 'contributions' && matchData.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Match Contributions</h3>
                <p className="text-xs text-slate-500 mb-6">Goals and assists per matchday</p>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={matchData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="matchday" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis allowDecimals={false} stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="goals" name="Goals" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="assists" name="Assists" fill="#facc15" radius={[4, 4, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Radar Profile */}
            {activeChart === 'radar' && radarData.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Player Profile</h3>
                <p className="text-xs text-slate-500 mb-6">All-round ability normalized to position benchmarks</p>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="stat" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name={p.name} dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Percentile Rankings */}
          {percentiles && (
            <div className="bg-[#111827]/60 backdrop-blur border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-1">League Percentile Rankings</h3>
              <p className="text-xs text-slate-500 mb-6">
                Compared to all {p.position}s in {p.league}
              </p>
              <div className="grid md:grid-cols-2 gap-x-10 gap-y-4">
                {(p.goals || 0) > 0 && <PercentileBar label="Goals" percentile={percentiles.goals || 0} value={p.goals || 0} color="#22d3ee" />}
                {(p.assists || 0) > 0 && <PercentileBar label="Assists" percentile={percentiles.assists || 0} value={p.assists || 0} color="#facc15" />}
                <PercentileBar label="Goals/90" percentile={percentiles.goalsPerNinety || 0} value={p.goalsPerNinety || 0} color="#22d3ee" />
                <PercentileBar label="Assists/90" percentile={percentiles.assistsPerNinety || 0} value={p.assistsPerNinety || 0} color="#facc15" />
                {(p.keyPasses || 0) > 0 && <PercentileBar label="Key Passes" percentile={percentiles.keyPasses || 0} value={p.keyPasses || 0} color="#f43f5e" />}
                {(p.shotAccuracy || 0) > 0 && <PercentileBar label="Shot Accuracy" percentile={percentiles.shotAccuracy || 0} value={`${p.shotAccuracy}%`} color="#f97316" />}
                {(p.tacklesPerNinety || 0) > 0 && <PercentileBar label="Tackles/90" percentile={percentiles.tacklesPerNinety || 0} value={p.tacklesPerNinety} color="#10b981" />}
                {(p.duelWinPct || 0) > 0 && <PercentileBar label="Duel Win %" percentile={percentiles.duelWinPct || 0} value={`${p.duelWinPct}%`} color="#10b981" />}
                {(p.passAccuracy || 0) > 0 && <PercentileBar label="Pass Accuracy" percentile={percentiles.passAccuracy || 0} value={`${p.passAccuracy}%`} color="#a78bfa" />}
                {(p.interceptions || 0) > 0 && <PercentileBar label="Interceptions" percentile={percentiles.interceptions || 0} value={p.interceptions} color="#10b981" />}
              </div>
            </div>
          )}

          {/* Detailed Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Shots', val: p.shotsTotal || p.shots, sub: `${p.shotAccuracy || 0}% on target` },
              { label: 'Key Passes', val: p.keyPasses, sub: p.passAccuracy > 0 ? `${p.passAccuracy}% accuracy` : `${p.xA || 0} xA` },
              { label: p.tacklesTotal > 0 ? 'Tackles' : 'xG', val: p.tacklesTotal > 0 ? p.tacklesTotal : p.xG, sub: p.tacklesTotal > 0 ? `${p.tacklesPerNinety}/90` : `${p.npxG || 0} non-pen xG` },
              { label: p.duelsTotal > 0 ? 'Duels Won' : 'npxG', val: p.duelsTotal > 0 ? `${p.duelsWon}/${p.duelsTotal}` : (p.npxG || 0), sub: p.duelsTotal > 0 ? `${p.duelWinPct}% success` : `${p.npg || 0} non-pen goals` },
              { label: p.dribblesAttempted > 0 ? 'Dribbles' : 'xG Chain', val: p.dribblesAttempted > 0 ? `${p.dribblesSuccessful}/${p.dribblesAttempted}` : (p.xGChain || 0), sub: p.dribblesAttempted > 0 ? `${p.dribbleSuccessPct}% success` : 'total xG involvement' },
              { label: p.blocks > 0 ? 'Blocks' : 'xG Buildup', val: p.blocks > 0 ? p.blocks : (p.xGBuildup || 0), sub: p.blocks > 0 ? `${p.interceptions} interceptions` : 'buildup play contribution' },
              { label: 'Yellow Cards', val: p.yellowCards, sub: `${p.redCards || 0} red` },
              { label: 'Penalties', val: `${p.penaltiesScored || 0}/${(p.penaltiesScored || 0) + (p.penaltiesMissed || 0)}`, sub: `${p.penaltiesWon || 0} won` },
            ].map((stat, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <p className="text-slate-500 text-[11px] uppercase tracking-wider font-medium mb-1">{stat.label}</p>
                <p className="text-white text-xl font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{stat.val || 0}</p>
                <p className="text-slate-600 text-[11px] mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>

        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
}
