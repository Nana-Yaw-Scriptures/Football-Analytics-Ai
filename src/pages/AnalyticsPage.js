import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';
import PerformanceTimeline from '../components/PerformanceTimeline';
import ThemeToggle from '../components/ThemeToggle';
import NavBar from '../components/NavBar';
import ExportButton from '../components/ExportButton';
import { exportPlayerComparison } from '../utils/exportPDF';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */
const I = ({ d, className = "w-5 h-5" }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>);
const ArrowLeftIcon = (p) => <I {...p} d={<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>}/>;
const SearchIcon = (p) => <I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const UsersIcon = (p) => <I {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const TrendingUpIcon = (p) => <I {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const BarChartIcon = (p) => <I {...p} d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}/>;
const AwardIcon = (p) => <I {...p} d={<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>}/>;
const GlobeIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}/>;
const XIcon = (p) => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const FilterIcon = (p) => <I {...p} d={<><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>}/>;
const LoaderIcon = (p) => <I {...p} d={<><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>}/>;
const TargetIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const ZapIcon = (p) => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const ShieldIcon = (p) => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const ChevronDownIcon = (p) => <I {...p} d={<polyline points="6 9 12 15 18 9"/>}/>;
const StarIcon = (p) => <I {...p} d={<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>}/>;
const SparklesIcon = (p) => <I {...p} d={<><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"/><path d="M19 3L19.75 5.25L22 6L19.75 6.75L19 9L18.25 6.75L16 6L18.25 5.25L19 3Z"/><path d="M5 14L5.5 15.5L7 16L5.5 16.5L5 18L4.5 16.5L3 16L4.5 15.5L5 14Z"/></>}/>;
const CpuIcon = (p) => <I {...p} d={<><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>}/>;
const CheckCircleIcon = (p) => <I {...p} d={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}/>;
const ChevronRightIcon = (p) => <I {...p} d={<polyline points="9 18 15 12 9 6"/>}/>;
const SendIcon        = (p) => <I {...p} d={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>}/>;
const SlidersIcon     = (p) => <I {...p} d={<><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>}/>;
const MapPinIcon      = (p) => <I {...p} d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>}/>;
const UserPlusIcon    = (p) => <I {...p} d={<><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></>}/>;
const LockIcon        = (p) => <I {...p} d={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}/>;
const UnlockIcon      = (p) => <I {...p} d={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></>}/>;
const ScatterPlotIcon = (p) => <I {...p} d={<><circle cx="7.5" cy="7.5" r="1.5"/><circle cx="18.5" cy="5.5" r="1.5"/><circle cx="11.5" cy="11.5" r="1.5"/><circle cx="14.5" cy="17.5" r="1.5"/><circle cx="5.5" cy="17.5" r="1.5"/></>}/>;
const FlameIcon       = (p) => <I {...p} d={<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>}/>;
const TrophyIcon      = (p) => <I {...p} d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>}/>;
const ActivityIcon    = (p) => <I {...p} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>;
const EyeIcon         = (p) => <I {...p} d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}/>;

const AppLoader = ({ title = 'Loading', sub = '', color = '#22d3ee' }) => (
  <div className="text-center">
    <div className="w-20 h-20 mx-auto mb-5 relative">
      <div className="absolute inset-0 rounded-full border-2" style={{borderColor:`${color}20`}}/>
      <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:`${color}80`,borderTopColor:'transparent'}}/>
      <div className="absolute inset-2 rounded-full border-2" style={{borderColor:`${color}15`}}/>
      <div className="absolute inset-2 rounded-full border-2 border-b-transparent animate-spin" style={{borderColor:`${color}50`,borderBottomColor:'transparent',animationDirection:'reverse',animationDuration:'1.5s'}}/>
      <BarChartIcon className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{color}}/>
    </div>
    <p className="text-white font-bold text-lg">{title}</p>
    {sub && <p className="text-slate-400 text-base mt-1">{sub}</p>}
  </div>
);

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */
const LEAGUES = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Primeira Liga'];
const LEAGUE_FLAG_IMG = {
  'Premier League': 'https://media.api-sports.io/football/leagues/39.png',
  'La Liga':        'https://media.api-sports.io/football/leagues/140.png',
  'Bundesliga':     'https://media.api-sports.io/football/leagues/78.png',
  'Serie A':        'https://media.api-sports.io/football/leagues/135.png',
  'Ligue 1':        'https://media.api-sports.io/football/leagues/61.png',
  'Primeira Liga':  'https://media.api-sports.io/football/leagues/94.png',
};
const POSITIONS = ['Attacker', 'Midfielder', 'Defender', 'Goalkeeper'];
const RADAR_COLORS = ['#22d3ee', '#a855f7', '#f59e0b'];

const TABS = [
  { id: 'comparison', label: 'Comparison', shortLabel: 'Compare', icon: UsersIcon },
  { id: 'similarity', label: 'Similarity', shortLabel: 'DNA', icon: SparklesIcon },
  { id: 'timeline', label: 'Performance', shortLabel: 'Timeline', icon: TrendingUpIcon },
  { id: 'top', label: 'Top Performers', shortLabel: 'Top', icon: AwardIcon },
  { id: 'leagues', label: 'League Overview', shortLabel: 'Leagues', icon: GlobeIcon },
];

/* ═══════════════════════════════════════════
   SIMILARITY ENGINE — COSINE DISTANCE ON PER-90 VECTORS
   ═══════════════════════════════════════════ */

// These are the dimensions of the feature vector.
// Using per-90 stats to remove playing-time bias.
const SIM_FEATURES = [
  // Attacking output
  { key: 'goalsPerNinety',       weight: 2.5, label: 'Goals/90',      color: '#22d3ee' },
  { key: 'assistsPerNinety',     weight: 2.0, label: 'Assists/90',    color: '#a855f7' },
  { key: 'xGPerNinety',          weight: 2.0, label: 'xG/90',         color: '#10b981' },
  // Creativity
  { key: 'keyPassesPerNinety',   weight: 2.0, label: 'Key Pass/90',   color: '#f59e0b' },
  { key: 'passAccuracy',         weight: 1.5, label: 'Pass Acc %',    color: '#6366f1' },
  { key: 'dribbleSuccessPct',    weight: 1.5, label: 'Dribble %',     color: '#ec4899' },
  // Defensive work
  { key: 'tacklesPerNinety',     weight: 1.5, label: 'Tackles/90',    color: '#84cc16' },
  { key: 'interceptionsPerNinety', weight: 1.5, label: 'Intercept/90', color: '#f97316' },
  // Aerial
  { key: 'aerialWonPct',         weight: 1.0, label: 'Aerial Won %',  color: '#e879f9' },
  // Volume shooting
  { key: 'shotsPerNinety',       weight: 1.0, label: 'Shots/90',      color: '#67e8f9' },
  { key: 'shotAccuracy',         weight: 1.0, label: 'Shot Acc %',    color: '#fde68a' },
];

/**
 * Derive per-90 metrics from a flat player object.
 * Falls back to pre-computed fields when the API already provides them.
 */
function deriveFeatures(p) {
  const mins = Math.max(p.minutes || p.minutesPlayed || 1, 1);
  const per90 = (v) => ((Number(v) || 0) / mins) * 90;

  return {
    goalsPerNinety:           p.goalsPerNinety         ?? per90(p.goals),
    assistsPerNinety:         p.assistsPerNinety        ?? per90(p.assists),
    xGPerNinety:              p.xGPerNinety             ?? per90(p.xG),
    keyPassesPerNinety:       p.keyPassesPerNinety      ?? per90(p.keyPasses),
    passAccuracy:             Number(p.passAccuracy)    || 0,
    dribbleSuccessPct:        Number(p.dribbleSuccessPct) || 0,
    tacklesPerNinety:         p.tacklesPerNinety        ?? per90(p.tacklesTotal ?? p.tackles),
    interceptionsPerNinety:   p.interceptionsPerNinety  ?? per90(p.interceptions),
    aerialWonPct:             p.aerialWonPct            ?? (
                                (p.aerialWon || 0) + (p.aerialLost || 0) > 0
                                  ? ((p.aerialWon || 0) / ((p.aerialWon || 0) + (p.aerialLost || 0))) * 100
                                  : 0
                              ),
    shotsPerNinety:           p.shotsPerNinety          ?? per90(p.shots ?? p.shotsTotal),
    shotAccuracy:             Number(p.shotAccuracy)    || 0,
  };
}

/** Build a weighted feature vector array from derived features */
function buildVector(features) {
  return SIM_FEATURES.map(f => (Number(features[f.key]) || 0) * f.weight);
}

/** Min-max normalise across the full player pool for each dimension */
function normalisePool(vectors) {
  const dims = vectors[0].length;
  const mins = Array(dims).fill(Infinity);
  const maxs = Array(dims).fill(-Infinity);

  vectors.forEach(v => v.forEach((val, i) => {
    if (val < mins[i]) mins[i] = val;
    if (val > maxs[i]) maxs[i] = val;
  }));

  return vectors.map(v =>
    v.map((val, i) => {
      const range = maxs[i] - mins[i];
      return range < 1e-9 ? 0 : (val - mins[i]) / range;
    })
  );
}

/** Cosine similarity between two equal-length arrays. Returns 0–1 */
function cosine(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom < 1e-12 ? 0 : dot / denom;
}

/**
 * Main similarity function.
 * Returns the top-N most similar players (excluding the query player itself).
 * filters: { samePosition: bool, minAge: number, maxAge: number, league: string }
 */
function findSimilarPlayers(queryPlayer, allPlayers, topN = 5, filters = {}) {
  const { samePosition = false, minAge = 0, maxAge = 99, league = '' } = filters;

  // Apply scouting filters before computing (keeps vectors fast)
  const pool = allPlayers.filter(p => {
    if (p.id === queryPlayer.id || p.name === queryPlayer.name) return false;
    if (samePosition && p.position !== queryPlayer.position) return false;
    if (league && p.league !== league) return false;
    const age = Number(p.age) || 0;
    if (age > 0 && (age < minAge || age > maxAge)) return false;
    return true;
  });

  if (pool.length === 0) return [];

  // Include query player in normalisation pool so vectors are comparable
  const fullPool    = [queryPlayer, ...pool];
  const allFeatures = fullPool.map(deriveFeatures);
  const allVectors  = fullPool.map((_, i) => buildVector(allFeatures[i]));
  const normalised  = normalisePool(allVectors);
  const queryVec    = normalised[0]; // query is always index 0

  const scored = pool
    .map((p, i) => ({ player: p, score: cosine(queryVec, normalised[i + 1]), features: allFeatures[i + 1] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored;
}

/* ═══════════════════════════════════════════
   SIMILARITY TAB MINI COMPONENTS
   ═══════════════════════════════════════════ */

/** Thin horizontal bar comparing two values */
function DualBar({ labelLeft, valLeft, labelRight, valRight, colorLeft = '#22d3ee', colorRight = '#a855f7' }) {
  const maxV = Math.max(valLeft, valRight, 0.001);
  const pctL = Math.round((valLeft  / maxV) * 100);
  const pctR = Math.round((valRight / maxV) * 100);

  return (
    <div className="flex items-center gap-2 w-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Left value */}
      <span className="w-12 text-right text-base font-bold flex-shrink-0" style={{ color: colorLeft }}>
        {valLeft < 1 ? valLeft.toFixed(2) : Number.isInteger(valLeft) ? valLeft : valLeft.toFixed(1)}
      </span>
      {/* Bar */}
      <div className="flex-1 flex items-center gap-0.5 h-3">
        <div className="flex-1 flex justify-end">
          <div className="h-3 rounded-l-full transition-all duration-700" style={{ width: `${pctL}%`, backgroundColor: colorLeft + 'cc' }} />
        </div>
        <div className="w-px h-4 bg-white/15 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-3 rounded-r-full transition-all duration-700" style={{ width: `${pctR}%`, backgroundColor: colorRight + 'cc' }} />
        </div>
      </div>
      {/* Right value */}
      <span className="w-12 text-left text-base font-bold flex-shrink-0" style={{ color: colorRight }}>
        {valRight < 1 ? valRight.toFixed(2) : Number.isInteger(valRight) ? valRight : valRight.toFixed(1)}
      </span>
    </div>
  );
}

/** Circular similarity score badge */
function SimilarityRing({ score, size = 80 }) {
  const pct    = score * 100;
  const r      = (size - 8) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - score);

  const color = score >= 0.92 ? '#22d3ee'
              : score >= 0.85 ? '#a855f7'
              : score >= 0.78 ? '#10b981'
              : '#f59e0b';

  return (
    <div style={{ width: size, height: size }} className="relative flex-shrink-0">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-white leading-none" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: size * 0.19 }}>
          {Math.round(pct)}
        </span>
        <span style={{ fontSize: size * 0.12, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>%</span>
      </div>
    </div>
  );
}

/** Player avatar used in similarity results */
function PlayerAvatar({ player, size = 44 }) {
  const [imgErr, setImgErr] = React.useState(false);
  if (player.photo && !imgErr) {
    return (
      <img
        src={player.photo}
        alt=""
        style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}
        onError={() => setImgErr(true)}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 8, flexShrink: 0 }}
      className="bg-gradient-to-br from-cyan-500/20 to-purple-500/10 flex items-center justify-center">
      <span className="font-black text-cyan-400" style={{ fontSize: size * 0.38 }}>{(player.name || '?')[0]}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   WORLD-CLASS CLUSTER SCATTER
   Percentile-rank positioning guarantees full
   canvas coverage regardless of distribution skew.
   ═══════════════════════════════════════════ */
function ClusterScatter({ allPlayers, queryPlayer, results }) {
  const [tooltip, setTooltip]     = useState(null);
  const [hoverId, setHoverId]     = useState(null);
  const containerRef              = useRef(null);
  const [dims, setDims]           = useState({ w: 800, h: 420 });

  // Responsive width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      setDims({ w: Math.max(w, 400), h: Math.round(Math.max(w, 400) * 0.48) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w: W, h: H } = dims;
  const PAD = { top: 28, right: 24, bottom: 44, left: 48 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top  - PAD.bottom;

  const posColor = (pos) =>
    pos === 'Attacker' || pos === 'Forward' ? '#fb7185'
    : pos === 'Midfielder'                   ? '#38bdf8'
    : pos === 'Defender'                     ? '#34d399'
    : pos === 'Goalkeeper'                   ? '#fbbf24'
    :                                          '#94a3b8';

  const rankColors = ['#f59e0b', '#e2e8f0', '#cd7f32', '#22d3ee', '#c084fc'];

  /* ── Percentile-rank coordinates ──
     Sort all players by atk score → assign rank 0..N-1 → normalise to 0..1
     Same for def. This fills 100% of the canvas regardless of distribution. */
  const coords = useMemo(() => {
    if (!allPlayers.length) return [];

    const scored = allPlayers.map(p => {
      const f   = deriveFeatures(p);
      const atk = f.goalsPerNinety * 2.5 + f.assistsPerNinety * 2.0 +
                  f.xGPerNinety    * 2.0 + f.shotsPerNinety   * 0.8 +
                  f.keyPassesPerNinety * 1.2;
      const def = f.tacklesPerNinety * 2.0 + f.interceptionsPerNinety * 2.0 +
                  f.aerialWonPct    * 0.04 + f.passAccuracy * 0.02;
      return { player: p, atk, def };
    });

    // Rank by atk
    const byAtk = [...scored].sort((a, b) => a.atk - b.atk);
    byAtk.forEach((s, i) => { s.atkPct = i / (byAtk.length - 1); });

    // Rank by def
    const byDef = [...scored].sort((a, b) => a.def - b.def);
    byDef.forEach((s, i) => { s.defPct = i / (byDef.length - 1); });

    return scored.map(s => ({
      ...s,
      x: PAD.left + s.atkPct * plotW,
      y: PAD.top  + (1 - s.defPct) * plotH,
    }));
  // eslint-disable-next-line
  }, [allPlayers, W, H]);

  const resultIds  = useMemo(() => new Set(results.map(r => r.player.id || r.player.name)), [results]);
  const queryId    = queryPlayer?.id || queryPlayer?.name;

  const background = useMemo(() => {
    const bg   = coords.filter(c => {
      const id = c.player.id || c.player.name;
      return id !== queryId && !resultIds.has(id);
    });
    const step = Math.max(1, Math.floor(bg.length / 500));
    return bg.filter((_, i) => i % step === 0);
  }, [coords, queryId, resultIds]);

  const queryCoord   = coords.find(c => (c.player.id || c.player.name) === queryId);
  const resultCoords = results.map(r =>
    coords.find(c => (c.player.id || c.player.name) === (r.player.id || r.player.name))
  ).filter(Boolean);

  // Tick values (percentile labels)
  const ticks = [0, 25, 50, 75, 100];

  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/20"
      style={{ background: 'linear-gradient(160deg, #070e1c 0%, #0b1528 60%, #0d1a30 100%)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
            <ScatterPlotIcon className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">Player Cluster Map</p>
            <p className="text-[15px] text-slate-400 leading-tight">Percentile rank · {allPlayers.length.toLocaleString()} players</p>
          </div>
        </div>
        <div className="flex items-center gap-5 text-[15px] font-semibold" style={{ fontFamily: 'JetBrains Mono' }}>
          <span className="text-slate-400">X → Attacking Output percentile</span>
          <span className="text-slate-400">Y ↑ Defensive Work percentile</span>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div ref={containerRef} className="relative w-full select-none">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: 'block', overflow: 'visible' }}
          onMouseLeave={() => { setTooltip(null); setHoverId(null); }}>

          <defs>
            {/* Radial glow for query player */}
            <radialGradient id="queryGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
            {/* Subtle background grid gradient */}
            <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="#0d1f3c" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#050810" stopOpacity="0.6" />
            </linearGradient>
            {/* Result player glows */}
            {rankColors.map((c, i) => (
              <radialGradient key={i} id={`rg${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={c} stopOpacity="0.5" />
                <stop offset="100%" stopColor={c} stopOpacity="0" />
              </radialGradient>
            ))}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Plot area background */}
          <rect
            x={PAD.left} y={PAD.top} width={plotW} height={plotH}
            fill="url(#bgGrad)" rx="4"
          />

          {/* Quadrant tinted backgrounds */}
          {[
            { x: PAD.left + plotW * 0.5, y: PAD.top,              w: plotW * 0.5, h: plotH * 0.5, color: '#22d3ee', label: 'HIGH ATK · HIGH DEF', lx: 0.75, ly: 0.12 },
            { x: PAD.left,               y: PAD.top,              w: plotW * 0.5, h: plotH * 0.5, color: '#34d399', label: 'LOW ATK · HIGH DEF',  lx: 0.25, ly: 0.12 },
            { x: PAD.left + plotW * 0.5, y: PAD.top + plotH * 0.5, w: plotW * 0.5, h: plotH * 0.5, color: '#fb7185', label: 'HIGH ATK · LOW DEF', lx: 0.75, ly: 0.88 },
            { x: PAD.left,               y: PAD.top + plotH * 0.5, w: plotW * 0.5, h: plotH * 0.5, color: '#94a3b8', label: 'LOW ATK · LOW DEF',  lx: 0.25, ly: 0.88 },
          ].map((q, i) => (
            <g key={i}>
              <rect x={q.x} y={q.y} width={q.w} height={q.h} fill={q.color} opacity={0.022} />
              <text
                x={PAD.left + q.lx * plotW}
                y={PAD.top  + q.ly * plotH}
                fill={q.color} opacity={0.18} fontSize={W > 600 ? 9 : 7}
                fontFamily="JetBrains Mono" fontWeight="700" textAnchor="middle">
                {q.label}
              </text>
            </g>
          ))}

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(g => (
            <g key={g}>
              <line
                x1={PAD.left + g * plotW} y1={PAD.top}
                x2={PAD.left + g * plotW} y2={PAD.top + plotH}
                stroke={g === 0.5 ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)'}
                strokeWidth={g === 0.5 ? 1.5 : 1} strokeDasharray={g === 0.5 ? '0' : '3,4'} />
              <line
                x1={PAD.left} y1={PAD.top + g * plotH}
                x2={PAD.left + plotW} y2={PAD.top + g * plotH}
                stroke={g === 0.5 ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)'}
                strokeWidth={g === 0.5 ? 1.5 : 1} strokeDasharray={g === 0.5 ? '0' : '3,4'} />
            </g>
          ))}

          {/* Axis borders */}
          <rect x={PAD.left} y={PAD.top} width={plotW} height={plotH}
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" rx="4" />

          {/* Tick labels */}
          {ticks.map(t => (
            <g key={t}>
              <text
                x={PAD.left + (t / 100) * plotW}
                y={PAD.top + plotH + 14}
                fill="rgba(255,255,255,0.2)" fontSize="8"
                fontFamily="JetBrains Mono" textAnchor="middle">{t}th</text>
              <text
                x={PAD.left - 8}
                y={PAD.top + (1 - t / 100) * plotH + 3}
                fill="rgba(255,255,255,0.2)" fontSize="8"
                fontFamily="JetBrains Mono" textAnchor="end">{t}</text>
            </g>
          ))}

          {/* Axis labels */}
          <text x={PAD.left + plotW / 2} y={H - 6}
            fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="JetBrains Mono"
            fontWeight="700" textAnchor="middle" letterSpacing="2">ATTACKING PERCENTILE →</text>
          <text x={12} y={PAD.top + plotH / 2}
            fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="JetBrains Mono"
            fontWeight="700" textAnchor="middle" letterSpacing="2"
            transform={`rotate(-90, 12, ${PAD.top + plotH / 2})`}>DEFENSIVE ↑</text>

          {/* ── Background player dots ── */}
          {background.map((c, i) => {
            const id   = c.player.id || c.player.name;
            const isHover = hoverId === id;
            const col  = posColor(c.player.position);
            return (
              <circle key={i} cx={c.x} cy={c.y}
                r={isHover ? 4 : 2.5}
                fill={col}
                opacity={isHover ? 0.9 : 0.22}
                style={{ cursor: 'pointer', transition: 'r 0.15s, opacity 0.15s' }}
                onMouseEnter={(e) => {
                  setHoverId(id);
                  const rect = e.currentTarget.closest('svg').getBoundingClientRect();
                  const svgScale = W / rect.width;
                  setTooltip({
                    player: c.player,
                    atkPct: Math.round(c.atkPct * 100),
                    defPct: Math.round(c.defPct * 100),
                    svgX: c.x / svgScale,
                    svgY: c.y / svgScale,
                    rect,
                  });
                }}
                onMouseLeave={() => { setHoverId(null); setTooltip(null); }}
              />
            );
          })}

          {/* ── Soft highlight region around query ── */}
          {queryCoord && (
            <circle cx={queryCoord.x} cy={queryCoord.y} r={38}
              fill="url(#queryGlow)" opacity={0.35} />
          )}

          {/* ── Connection lines: query → results ── */}
          {queryCoord && resultCoords.map((rc, i) => (
            <line key={i}
              x1={queryCoord.x} y1={queryCoord.y}
              x2={rc.x}         y2={rc.y}
              stroke={rankColors[i]} strokeWidth="1.5"
              strokeDasharray="4,3" opacity={0.45}
              style={{ filter: `drop-shadow(0 0 3px ${rankColors[i]}88)` }}
            />
          ))}

          {/* ── Result dots ── */}
          {resultCoords.map((rc, i) => {
            const id = results[i].player.id || results[i].player.name;
            const isHover = hoverId === id;
            return (
              <g key={i}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  setHoverId(id);
                  const rect = e.currentTarget.closest('svg').getBoundingClientRect();
                  const svgScale = W / rect.width;
                  setTooltip({
                    player: results[i].player,
                    score: results[i].score,
                    atkPct: Math.round(rc.atkPct * 100),
                    defPct: Math.round(rc.defPct * 100),
                    svgX: rc.x / svgScale,
                    svgY: rc.y / svgScale,
                    rect,
                  });
                }}
                onMouseLeave={() => { setHoverId(null); setTooltip(null); }}>
                {/* Glow halo */}
                <circle cx={rc.x} cy={rc.y} r={isHover ? 20 : 14}
                  fill={`url(#rg${i})`} opacity={isHover ? 0.9 : 0.6}
                  style={{ transition: 'r 0.2s' }} />
                {/* Outer ring */}
                <circle cx={rc.x} cy={rc.y} r={isHover ? 11 : 9}
                  fill="none" stroke={rankColors[i]} strokeWidth="1.5" opacity={0.5} />
                {/* Core */}
                <circle cx={rc.x} cy={rc.y} r={isHover ? 8 : 6.5}
                  fill={rankColors[i]} opacity={0.95}
                  filter="url(#glow)"
                  style={{ transition: 'r 0.2s' }} />
                <text x={rc.x} y={rc.y + 0.5} textAnchor="middle"
                  dominantBaseline="middle" fill="#050810"
                  fontSize={isHover ? "8" : "7"} fontFamily="JetBrains Mono" fontWeight="900">
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* ── Query player ── */}
          {queryCoord && (() => {
            const id      = queryPlayer?.id || queryPlayer?.name;
            const isHover = hoverId === id;
            return (
              <g style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  setHoverId(id);
                  const rect = e.currentTarget.closest('svg').getBoundingClientRect();
                  const svgScale = W / rect.width;
                  setTooltip({
                    player: queryPlayer,
                    isQuery: true,
                    atkPct: Math.round(queryCoord.atkPct * 100),
                    defPct: Math.round(queryCoord.defPct * 100),
                    svgX: queryCoord.x / svgScale,
                    svgY: queryCoord.y / svgScale,
                    rect,
                  });
                }}
                onMouseLeave={() => { setHoverId(null); setTooltip(null); }}>
                {/* Animated pulse rings */}
                <circle cx={queryCoord.x} cy={queryCoord.y} r="18"
                  fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.25">
                  <animate attributeName="r" values="12;22;12" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle cx={queryCoord.x} cy={queryCoord.y} r="13"
                  fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.4">
                  <animate attributeName="r" values="9;15;9" dur="2.4s" begin="0.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" begin="0.4s" repeatCount="indefinite" />
                </circle>
                {/* Core dot */}
                <circle cx={queryCoord.x} cy={queryCoord.y}
                  r={isHover ? 10 : 8}
                  fill="#22d3ee" filter="url(#glow)"
                  style={{ transition: 'r 0.2s' }} />
                <text x={queryCoord.x} y={queryCoord.y + 0.5}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="#050810" fontSize="9" fontFamily="JetBrains Mono" fontWeight="900">★</text>
              </g>
            );
          })()}
        </svg>

        {/* ── Floating tooltip ── */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left:  Math.min((tooltip.svgX || 0) + 14, (containerRef.current?.clientWidth || 600) - 180),
              top:   Math.max((tooltip.svgY || 0) - 72, 8),
            }}>
            <div className="px-3.5 py-2.5 rounded-xl shadow-2xl"
              style={{
                background: 'rgba(8,16,36,0.97)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(16px)',
                minWidth: 165,
              }}>
              {/* Player photo + name */}
              <div className="flex items-center gap-2 mb-2">
                <PlayerAvatar player={tooltip.player} size={28} />
                <div className="min-w-0">
                  <p className="text-white font-bold text-base truncate leading-tight">{tooltip.player.name}</p>
                  <p className="text-slate-300 text-[15px] truncate leading-tight">{tooltip.player.team}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <PositionBadge position={tooltip.player.position} />
                {tooltip.isQuery && (
                  <span className="text-[15px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-md">Query</span>
                )}
                {tooltip.score !== undefined && (
                  <span className="text-[15px] font-black text-emerald-400" style={{ fontFamily: 'JetBrains Mono' }}>
                    {Math.round(tooltip.score * 100)}% match
                  </span>
                )}
              </div>
              {/* Percentile bars */}
              <div className="space-y-1.5">
                {[
                  { label: 'ATK', pct: tooltip.atkPct, color: '#22d3ee' },
                  { label: 'DEF', pct: tooltip.defPct, color: '#34d399' },
                ].map(bar => (
                  <div key={bar.label}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-base text-slate-400 font-bold uppercase tracking-widest">{bar.label} Percentile</span>
                      <span className="text-base font-black" style={{ fontFamily: 'JetBrains Mono', color: bar.color }}>{bar.pct}th</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/6 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${bar.pct}%`, backgroundColor: bar.color, opacity: 0.8 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Legend footer ── */}
      <div className="flex items-center gap-5 px-5 py-3 flex-wrap"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          { label: 'Attacker',   color: '#fb7185' },
          { label: 'Midfielder', color: '#38bdf8' },
          { label: 'Defender',   color: '#34d399' },
          { label: 'Goalkeeper', color: '#fbbf24' },
        ].map(pos => (
          <div key={pos.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pos.color, opacity: 0.65 }} />
            <span className="text-base text-slate-400 font-medium">{pos.label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0.5 rounded-full bg-cyan-400/50" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #22d3ee 0, #22d3ee 4px, transparent 4px, transparent 7px)' }} />
            <span className="text-base text-slate-400">similarity link</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-cyan-400 flex items-center justify-center">
              <span style={{ fontSize: 7, color: '#050810', fontWeight: 900 }}>★</span>
            </div>
            <span className="text-base text-slate-300 font-semibold">Query player</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PLAYER SIMILARITY ENGINE TAB — ENHANCED
   ═══════════════════════════════════════════ */
function SimilarityTab({ allPlayers, onSendToComparison }) {
  const [query, setQuery]               = useState('');
  const [selectedPlayer, setSelected]   = useState(null);
  const [results, setResults]           = useState([]);
  const [computing, setComputing]       = useState(false);
  const [expandedIdx, setExpandedIdx]   = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCluster, setShowCluster]   = useState(false);

  // ── Filters ──
  const [samePosition, setSamePosition] = useState(true);
  const [ageMin, setAgeMin]             = useState(16);
  const [ageMax, setAgeMax]             = useState(40);
  const [simLeague, setSimLeague]       = useState('');
  const [showFilters, setShowFilters]   = useState(false);
  const [sentIds, setSentIds]           = useState(new Set());

  const dropRef = useRef(null);

  // Does the pool actually have age data?
  const hasAgeData = useMemo(() => allPlayers.some(p => Number(p.age) > 0), [allPlayers]);

  // Typeahead suggestions
  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return allPlayers
      .filter(p => {
        const n = (p.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const t = (p.team || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return n.includes(q) || t.includes(q);
      })
      .slice(0, 8);
  }, [query, allPlayers]);

  // Click outside → close dropdown
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectPlayer = useCallback((player) => {
    setSelected(player);
    setQuery(player.name);
    setShowDropdown(false);
    setResults([]);
    setExpandedIdx(null);
    setSentIds(new Set());
  }, []);

  const handleCompute = useCallback(() => {
    if (!selectedPlayer) return;
    setComputing(true);
    setTimeout(() => {
      const found = findSimilarPlayers(
        selectedPlayer, allPlayers, 5,
        { samePosition, minAge: ageMin, maxAge: ageMax, league: simLeague }
      );
      setResults(found);
      setComputing(false);
    }, 50);
  }, [selectedPlayer, allPlayers, samePosition, ageMin, ageMax, simLeague]);

  // Auto-compute when player selected or filters change
  useEffect(() => {
    if (selectedPlayer) handleCompute();
  }, [selectedPlayer, samePosition, ageMin, ageMax, simLeague]); // eslint-disable-line

  const queryFeatures = useMemo(() => selectedPlayer ? deriveFeatures(selectedPlayer) : null, [selectedPlayer]);

  const handleSendToComparison = useCallback((player) => {
    onSendToComparison(player);
    setSentIds(prev => new Set([...prev, player.id || player.name]));
  }, [onSendToComparison]);

  // Active filter count badge
  const activeFilterCount = (samePosition ? 1 : 0) + (ageMin > 16 || ageMax < 40 ? 1 : 0) + (simLeague ? 1 : 0);

  /* ── Render ── */
  return (
    <div>
      {/* ── Header strip ── */}
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CpuIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-base font-bold uppercase tracking-widest">ML-Powered · Cosine Similarity</span>
          </div>
          <h2 className="text-2xl font-black text-white leading-tight">Player Similarity Engine</h2>
          <p className="text-slate-300 text-base mt-0.5">
            11-dimensional per-90 vector · {allPlayers.length.toLocaleString()} player pool
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {/* Cluster toggle */}
          {results.length > 0 && (
            <button
              onClick={() => setShowCluster(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-base font-semibold transition-all ${
                showCluster
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                  : 'bg-white/5 border-white/20 text-slate-300 hover:text-white'
              }`}>
              <ScatterPlotIcon className="w-3.5 h-3.5" />
              Cluster Map
            </button>
          )}
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-base font-semibold transition-all relative ${
              showFilters || activeFilterCount > 0
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                : 'bg-white/5 border-white/20 text-slate-300 hover:text-white'
            }`}>
            <SlidersIcon className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cyan-500 text-white text-base font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/8">
            <SparklesIcon className="w-3 h-3 text-purple-400" />
            <span className="text-purple-300 text-base font-semibold">min-max norm · weighted</span>
          </div>
        </div>
      </div>

      {/* ── Filters panel ── */}
      {showFilters && (
        <div className="mb-5 p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 space-y-4">
          <p className="text-base text-cyan-400 font-bold uppercase tracking-widest">Scouting Filters</p>

          {/* Position lock */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {samePosition ? <LockIcon className="w-3.5 h-3.5 text-cyan-400" /> : <UnlockIcon className="w-3.5 h-3.5 text-slate-300" />}
              <div>
                <p className="text-base font-semibold text-white">Same Position Only</p>
                <p className="text-base text-slate-400">
                  {selectedPlayer ? `Searching within ${selectedPlayer.position}s` : 'On by default — compares like-for-like'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSamePosition(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 ${samePosition ? 'bg-cyan-500' : 'bg-white/10'}`}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
                style={{ left: samePosition ? '22px' : '2px' }} />
            </button>
          </div>

          {/* League filter */}
          <div>
            <p className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <GlobeIcon className="w-3.5 h-3.5 text-cyan-400" />
              League
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSimLeague('')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-base font-semibold border transition-all ${
                  !simLeague
                    ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                    : 'bg-white/5 border-white/12 text-slate-300 hover:text-slate-300'
                }`}>
                All Leagues
              </button>
              {LEAGUES.map(l => (
                <button
                  key={l}
                  onClick={() => setSimLeague(simLeague === l ? '' : l)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-base font-semibold border transition-all ${
                    simLeague === l
                      ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                      : 'bg-white/5 border-white/12 text-slate-300 hover:text-slate-300'
                  }`}>
                  {LEAGUE_FLAG_IMG[l] && <img src={LEAGUE_FLAG_IMG[l]} alt="" className="w-3.5 h-3.5 object-contain" />}
                  {l.replace(' League', '').replace('Premier', 'EPL')}
                </button>
              ))}
            </div>
          </div>

          {/* Age range */}
          {hasAgeData && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-base font-semibold text-white">Age Range</p>
                <span className="text-base font-bold text-cyan-400" style={{ fontFamily: 'JetBrains Mono' }}>
                  {ageMin} – {ageMax} yrs
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base text-slate-400 w-8">16</span>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range" min={16} max={40} value={ageMin}
                    onChange={e => setAgeMin(Math.min(Number(e.target.value), ageMax - 1))}
                    className="flex-1 accent-cyan-500 cursor-pointer"
                    style={{ height: 4 }}
                  />
                  <input
                    type="range" min={16} max={40} value={ageMax}
                    onChange={e => setAgeMax(Math.max(Number(e.target.value), ageMin + 1))}
                    className="flex-1 accent-cyan-500 cursor-pointer"
                    style={{ height: 4 }}
                  />
                </div>
                <span className="text-base text-slate-400 w-8 text-right">40</span>
              </div>
              {/* Quick age presets */}
              <div className="flex gap-1.5 mt-2">
                {[
                  { label: 'U21', min: 16, max: 21 },
                  { label: 'U25', min: 16, max: 25 },
                  { label: 'Prime (24–30)', min: 24, max: 30 },
                  { label: 'Veterans (30+)', min: 30, max: 40 },
                  { label: 'All ages', min: 16, max: 40 },
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => { setAgeMin(preset.min); setAgeMax(preset.max); }}
                    className={`px-2 py-1 rounded-lg text-[15px] font-semibold transition-all border ${
                      ageMin === preset.min && ageMax === preset.max
                        ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                        : 'bg-white/5 border-white/12 text-slate-400 hover:text-slate-400'
                    }`}>
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!hasAgeData && (
            <p className="text-base text-slate-400 italic">Age filter unavailable — API response doesn't include age data.</p>
          )}
        </div>
      )}

      {/* ── Search box ── */}
      <div ref={dropRef} className="relative mb-5 max-w-xl">
        <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${
          showDropdown && suggestions.length
            ? 'border-cyan-500/50 bg-[#111827]/90 shadow-xl shadow-cyan-500/10'
            : 'border-white/20 bg-[#111827]/60 hover:border-white/20'
        }`}>
          <SearchIcon className="w-4 h-4 text-slate-300 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDropdown(true); if (!e.target.value) { setSelected(null); setResults([]); setSentIds(new Set()); } }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search any player from 5 leagues…"
            className="flex-1 bg-transparent text-white text-base placeholder:text-slate-400 focus:outline-none"
          />
          {selectedPlayer && (
            <button
              onClick={() => { setQuery(''); setSelected(null); setResults([]); setShowDropdown(false); setSentIds(new Set()); }}
              className="p-0.5 rounded-full hover:bg-white/10 transition-colors">
              <XIcon className="w-3.5 h-3.5 text-slate-300" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl border border-white/20 bg-[#0d1526]/98 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
            {suggestions.map((p, i) => (
              <button
                key={p.id || i}
                onMouseDown={() => handleSelectPlayer(p)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-all text-left">
                <PlayerAvatar player={p} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-white truncate">{p.name}</p>
                  <p className="text-base text-slate-300 truncate">{p.team} · {p.league}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <PositionBadge position={p.position} />
                  {p.age && <span className="text-base text-slate-400" style={{ fontFamily: 'JetBrains Mono' }}>Age {p.age}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Selected player card (query) ── */}
      {selectedPlayer && (
        <div className="mb-5 p-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex items-center gap-4 flex-wrap">
            <PlayerAvatar player={selectedPlayer} size={56} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 className="text-lg font-black text-white">{selectedPlayer.name}</h3>
                <PositionBadge position={selectedPlayer.position} />
                {selectedPlayer.rating > 0 && <RatingBadge value={selectedPlayer.rating} size="sm" />}
                {selectedPlayer.age && (
                  <span className="text-base text-slate-300 bg-white/5 px-2 py-0.5 rounded-md" style={{ fontFamily: 'JetBrains Mono' }}>
                    Age {selectedPlayer.age}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-base text-slate-300">
                {selectedPlayer.teamLogo && <img src={selectedPlayer.teamLogo} alt="" className="w-4 h-4" />}
                <span>{selectedPlayer.team}</span>
                <span className="text-slate-300">·</span>
                {LEAGUE_FLAG_IMG[selectedPlayer.league] && <img src={LEAGUE_FLAG_IMG[selectedPlayer.league]} alt="" className="w-4 h-4 object-contain" />}
                <span>{selectedPlayer.league}</span>
              </div>
              {/* Role-aware key stats */}
              {(() => {
                const aug  = augmentPlayer(selectedPlayer);
                const role = detectRole(aug);
                const STATS_MAP = {
                  striker:       [
                    { label:'Goals',    val: selectedPlayer.goals||0,                    color:'#22d3ee' },
                    { label:'xG',       val: (selectedPlayer.xG||0).toFixed(1),          color:'#10b981' },
                    { label:'G/90',     val: (aug.goalsPerNinety||0).toFixed(2),          color:'#f59e0b' },
                    { label:'Shot%',    val: `${selectedPlayer.shotAccuracy||0}%`,        color:'#a855f7' },
                    { label:'Minutes',  val: (selectedPlayer.minutes||0).toLocaleString(),color:'#475569' },
                  ],
                  winger:        [
                    { label:'Goals',    val: selectedPlayer.goals||0,                    color:'#f43f5e' },
                    { label:'Assists',  val: selectedPlayer.assists||0,                  color:'#a855f7' },
                    { label:'Drib%',    val: `${selectedPlayer.dribbleSuccessPct||0}%`,  color:'#f59e0b' },
                    { label:'KP/90',    val: (aug.keyPassesPerNinety||0).toFixed(2),      color:'#10b981' },
                    { label:'Minutes',  val: (selectedPlayer.minutes||0).toLocaleString(),color:'#475569' },
                  ],
                  attacking_mid: [
                    { label:'Assists',  val: selectedPlayer.assists||0,                  color:'#8b5cf6' },
                    { label:'xA',       val: (selectedPlayer.xA||0).toFixed(1),          color:'#a855f7' },
                    { label:'KP/90',    val: (aug.keyPassesPerNinety||0).toFixed(2),      color:'#10b981' },
                    { label:'Goals',    val: selectedPlayer.goals||0,                    color:'#22d3ee' },
                    { label:'Minutes',  val: (selectedPlayer.minutes||0).toLocaleString(),color:'#475569' },
                  ],
                  central_mid:   [
                    { label:'KP/90',    val: (aug.keyPassesPerNinety||0).toFixed(2),      color:'#3b82f6' },
                    { label:'Tack/90',  val: (aug._tack90||0).toFixed(2),                 color:'#10b981' },
                    { label:'Pass%',    val: `${selectedPlayer.passAccuracy||0}%`,        color:'#f59e0b' },
                    { label:'G+A',      val: (selectedPlayer.goals||0)+(selectedPlayer.assists||0), color:'#a855f7' },
                    { label:'Minutes',  val: (selectedPlayer.minutes||0).toLocaleString(),color:'#475569' },
                  ],
                  defensive_mid: [
                    { label:'Tack/90',  val: (aug._tack90||0).toFixed(2),                 color:'#10b981' },
                    { label:'Int/90',   val: (aug._inter90||0).toFixed(2),                 color:'#34d399' },
                    { label:'Duels/90', val: (aug._duels90||0).toFixed(2),                 color:'#f59e0b' },
                    { label:'Pass%',    val: `${selectedPlayer.passAccuracy||0}%`,        color:'#38bdf8' },
                    { label:'Minutes',  val: (selectedPlayer.minutes||0).toLocaleString(),color:'#475569' },
                  ],
                  centreback:    [
                    { label:'Tack/90',  val: (aug._tack90||0).toFixed(2),                 color:'#10b981' },
                    { label:'Int/90',   val: (aug._inter90||0).toFixed(2),                 color:'#34d399' },
                    { label:'Aer%',     val: `${aug._aerialPct||0}%`,                     color:'#f59e0b' },
                    { label:'Pass%',    val: `${selectedPlayer.passAccuracy||0}%`,        color:'#38bdf8' },
                    { label:'Minutes',  val: (selectedPlayer.minutes||0).toLocaleString(),color:'#475569' },
                  ],
                  fullback:      [
                    { label:'Assists',  val: selectedPlayer.assists||0,                  color:'#38bdf8' },
                    { label:'Tack/90',  val: (aug._tack90||0).toFixed(2),                 color:'#10b981' },
                    { label:'KP/90',    val: (aug.keyPassesPerNinety||0).toFixed(2),      color:'#f59e0b' },
                    { label:'Drib%',    val: `${selectedPlayer.dribbleSuccessPct||0}%`,  color:'#a855f7' },
                    { label:'Minutes',  val: (selectedPlayer.minutes||0).toLocaleString(),color:'#475569' },
                  ],
                  goalkeeper:    [
                    { label:'Rating',   val: (selectedPlayer.rating||0).toFixed(1),       color:'#fbbf24' },
                    { label:'Pass%',    val: `${selectedPlayer.passAccuracy||0}%`,        color:'#38bdf8' },
                    { label:'Aer/90',   val: (aug._aerial90||0).toFixed(2),               color:'#10b981' },
                    { label:'Aer%',     val: `${aug._aerialPct||0}%`,                     color:'#f59e0b' },
                    { label:'Minutes',  val: (selectedPlayer.minutes||0).toLocaleString(),color:'#475569' },
                  ],
                };
                const stats = STATS_MAP[role] || [
                  { label:'Goals',    val: selectedPlayer.goals||0,                      color:'#22d3ee' },
                  { label:'Assists',  val: selectedPlayer.assists||0,                    color:'#a855f7' },
                  { label:'xG',       val: (selectedPlayer.xG||0).toFixed(1),            color:'#10b981' },
                  { label:'G/90',     val: (aug.goalsPerNinety||0).toFixed(2),            color:'#f59e0b' },
                  { label:'Minutes',  val: (selectedPlayer.minutes||0).toLocaleString(), color:'#475569' },
                ];
                return (
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {stats.map(s => (
                      <div key={s.label} className="text-center">
                        <div className="text-[15px] font-black" style={{ fontFamily:"'JetBrains Mono',monospace", color:s.color }}>{s.val}</div>
                        <div className="text-[15px] text-slate-400 uppercase tracking-wide">{s.label}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            {computing && (
              <div className="flex items-center gap-2 text-cyan-400 text-base">
                <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-base font-medium">Computing…</span>
              </div>
            )}
          </div>

          {/* Active filter summary */}
          {activeFilterCount > 0 && (
            <div className="mt-3 pt-3 border-t border-white/12 flex items-center gap-2 flex-wrap">
              <span className="text-base text-slate-400 uppercase tracking-widest font-semibold">Active filters:</span>
              {samePosition && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-base font-semibold">
                  <LockIcon className="w-3 h-3" /> {selectedPlayer.position}s only
                </span>
              )}
              {simLeague && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-base font-semibold">
                  {LEAGUE_FLAG_IMG[simLeague] && <img src={LEAGUE_FLAG_IMG[simLeague]} alt="" className="w-3 h-3 object-contain" />}
                  {simLeague.replace(' League','').replace('Premier','EPL')}
                </span>
              )}
              {(ageMin > 16 || ageMax < 40) && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-base font-semibold">
                  Age {ageMin}–{ageMax}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Results section ── */}
      {results.length > 0 && (
        <div>
          {/* Section label */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-bold text-base">
                {samePosition && selectedPlayer
                  ? `5 Most Similar ${selectedPlayer.position}s`
                  : '5 Most Similar Players'}
                {simLeague ? ` · ${simLeague.replace(' League','').replace('Premier','EPL')}` : ''}
              </span>
            </div>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-base text-slate-400 font-medium">
              vs {allPlayers.length.toLocaleString()} pool
              {activeFilterCount > 0 && <span className="text-cyan-500/70"> (filtered)</span>}
            </span>
          </div>

          {/* ── Cluster map ── */}
          {showCluster && (
            <div className="mb-5">
              <ClusterScatter allPlayers={allPlayers} queryPlayer={selectedPlayer} results={results} />
            </div>
          )}

          {/* ── Result cards ── */}
          <div className="space-y-3">
            {results.map(({ player, score, features }, idx) => {
              const isExpanded  = expandedIdx === idx;
              const rankColors  = ['#f59e0b', '#94a3b8', '#cd7f32', '#22d3ee', '#a855f7'];
              const rankLabel   = ['Best Match', '2nd Match', '3rd Match', '4th Match', '5th Match'];
              const playerId    = player.id || player.name;
              const alreadySent = sentIds.has(playerId);

              // Tier label
              const tier = score >= 0.92 ? { label: 'Elite Twin',    color: '#22d3ee' }
                         : score >= 0.85 ? { label: 'Strong Match',  color: '#a855f7' }
                         : score >= 0.78 ? { label: 'Good Match',    color: '#10b981' }
                         :                 { label: 'Similar Style', color: '#f59e0b' };

              return (
                <div
                  key={playerId}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isExpanded
                      ? 'border-white/15 bg-[#0f1a2e]/80'
                      : 'border-white/12 bg-[#111827]/50 hover:border-white/12 hover:bg-[#111827]/70'
                  }`}
                  style={isExpanded ? { boxShadow: `0 0 30px ${rankColors[idx]}15` } : {}}>

                  {/* ── Card header row ── */}
                  <div className="flex items-center gap-3 p-4">
                    {/* Rank */}
                    <div className="w-7 flex-shrink-0 text-center">
                      <span className="text-[15px] font-black" style={{ fontFamily: "'JetBrains Mono', monospace", color: rankColors[idx] }}>
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Clickable area for expand */}
                    <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => setExpandedIdx(isExpanded ? null : idx)}>
                      <PlayerAvatar player={player} size={46} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-base">{player.name}</span>
                          <PositionBadge position={player.position} />
                          {player.age && (
                            <span className="text-[15px] text-slate-400 font-semibold" style={{ fontFamily: 'JetBrains Mono' }}>
                              Age {player.age}
                            </span>
                          )}
                          {/* Tier badge */}
                          <span className="text-[15px] font-bold hidden sm:block px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: tier.color + '18', color: tier.color, border: `1px solid ${tier.color}30` }}>
                            {tier.label}
                          </span>
                          {/* Rank badge */}
                          <span className="text-[15px] font-bold hidden sm:block px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: rankColors[idx] + '18', color: rankColors[idx] }}>
                            {rankLabel[idx]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {player.teamLogo && <img src={player.teamLogo} alt="" className="w-3.5 h-3.5" />}
                          <span className="text-base text-slate-300">{player.team}</span>
                          {LEAGUE_FLAG_IMG[player.league] && <img src={LEAGUE_FLAG_IMG[player.league]} alt="" className="w-3 h-3 object-contain" />}
                          <span className="text-base text-slate-400">{player.league}</span>
                        </div>
                      </div>
                    </button>

                    {/* Quick stats */}
                    <div className="hidden md:flex items-center gap-4 flex-shrink-0">
                      {[
                        { l: 'G',    v: player.goals    || 0,                        c: '#22d3ee' },
                        { l: 'A',    v: player.assists   || 0,                        c: '#a855f7' },
                        { l: 'xG',   v: (player.xG      || 0).toFixed(1),             c: '#10b981' },
                        { l: 'G/90', v: (player.goalsPerNinety || 0).toFixed(2),      c: '#f59e0b' },
                      ].map(s => (
                        <div key={s.l} className="text-center w-9">
                          <div className="text-[15px] font-black leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace", color: s.c }}>{s.v}</div>
                          <div className="text-base text-slate-400 uppercase tracking-wide">{s.l}</div>
                        </div>
                      ))}
                    </div>

                    {/* Score ring */}
                    <SimilarityRing score={score} size={66} />

                    {/* Send to Comparison button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSendToComparison(player); }}
                      title="Send to Comparison tab"
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-base font-semibold transition-all ${
                        alreadySent
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-default'
                          : 'border-white/20 bg-white/5 text-slate-300 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400'
                      }`}>
                      {alreadySent
                        ? <><CheckCircleIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sent</span></>
                        : <><SendIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Compare</span></>
                      }
                    </button>

                    {/* Expand chevron */}
                    <button onClick={() => setExpandedIdx(isExpanded ? null : idx)}>
                      <ChevronRightIcon className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  {/* ── Expanded comparison panel ── */}
                  {isExpanded && queryFeatures && (
                    <div className="px-5 pb-5 border-t border-white/12">
                      <div className="pt-4">
                        {/* Player name header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                            <span className="text-base font-bold text-cyan-400 truncate max-w-[120px]">{selectedPlayer.name}</span>
                          </div>
                          <span className="text-base text-slate-400 font-semibold uppercase tracking-widest">Per-90 Comparison</span>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-purple-400 truncate max-w-[120px]">{player.name}</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                          </div>
                        </div>

                        {/* Dual bars */}
                        <div className="space-y-3">
                          {SIM_FEATURES.map((feat) => {
                            const qVal = Number(queryFeatures[feat.key])  || 0;
                            const rVal = Number(features[feat.key])       || 0;
                            return (
                              <div key={feat.key}>
                                <div className="text-[15px] text-slate-400 uppercase tracking-widest font-semibold text-center mb-1">{feat.label}</div>
                                <DualBar valLeft={qVal} valRight={rVal} colorLeft="#22d3ee" colorRight="#a855f7" />
                              </div>
                            );
                          })}
                        </div>

                        {/* Dimensional breakdown grid */}
                        <div className="mt-5 pt-4 border-t border-white/12">
                          <p className="text-base text-slate-400 uppercase tracking-widest font-semibold mb-3">Similarity Breakdown</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {SIM_FEATURES.map((feat) => {
                              const qv = Number(queryFeatures[feat.key]) || 0;
                              const rv = Number(features[feat.key])      || 0;
                              const mx = Math.max(qv, rv, 0.001);
                              const dimScore = 1 - Math.abs(qv - rv) / mx;
                              return (
                                <div key={feat.key} className="bg-white/[0.03] rounded-xl p-2.5 border border-white/12">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[15px] text-slate-300 font-semibold">{feat.label}</span>
                                    <span className="text-[15px] font-black" style={{ fontFamily: "'JetBrains Mono', monospace", color: feat.color }}>
                                      {Math.round(dimScore * 100)}%
                                    </span>
                                  </div>
                                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.round(dimScore * 100)}%`, backgroundColor: feat.color }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Send to comparison CTA inside expanded */}
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => handleSendToComparison(player)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-base font-semibold transition-all ${
                              sentIds.has(player.id || player.name)
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                            }`}>
                            {sentIds.has(player.id || player.name)
                              ? <><CheckCircleIcon className="w-4 h-4" /> Added to Comparison</>
                              : <><UserPlusIcon className="w-4 h-4" /> Send to Comparison Tab</>
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Feature vector legend ── */}
          <div className="mt-6 p-4 rounded-2xl border border-white/12 bg-[#111827]/40">
            <p className="text-base text-slate-400 uppercase tracking-widest font-semibold mb-3">Feature Dimensions Used</p>
            <div className="flex flex-wrap gap-2">
              {SIM_FEATURES.map(f => (
                <div key={f.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/12">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                  <span className="text-base text-slate-300 font-medium">{f.label}</span>
                  <span className="text-[15px] text-slate-300 font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>×{f.weight}</span>
                </div>
              ))}
            </div>
            <p className="text-base text-slate-300 mt-3">
              Vectors are min-max normalised across the active pool before cosine distance is computed. Weight multipliers emphasise attacking output. Cluster map projects to 2D Attack/Defence axes.
            </p>
          </div>
        </div>
      )}

      {/* ── Empty / idle states ── */}
      {!selectedPlayer && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/15 flex items-center justify-center">
            <SparklesIcon className="w-7 h-7 text-cyan-400/50" />
          </div>
          <p className="text-white font-bold text-base mb-1">Find Your Player's DNA Twin</p>
          <p className="text-slate-400 text-base max-w-sm mx-auto">
            Search any player, apply scouting filters, and the engine will surface the 5 closest statistical matches from {allPlayers.length.toLocaleString()} players.
          </p>
          {/* Feature pills */}
          <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
            {[
              { icon: LockIcon,        label: 'Position Lock' },
              { icon: SlidersIcon,     label: 'Age Filters'   },
              { icon: SendIcon,        label: 'Send to Comparison' },
              { icon: ScatterPlotIcon, label: 'Cluster Map'   },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/15">
                <f.icon className="w-3 h-3 text-slate-300" />
                <span className="text-base text-slate-400">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPlayer && !computing && results.length === 0 && (
        <div className="text-center py-12">
          <div className="w-10 h-10 mx-auto mb-3 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-slate-300 text-base">Running similarity search…</p>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════
   SMALL UTILITY COMPONENTS (unchanged)
   ═══════════════════════════════════════════ */
const RatingBadge = ({ value, size = 'md' }) => {
  const v = parseFloat(value) || 0;
  if (v === 0) return null;
  const cls = v >= 7.5 ? 'from-emerald-500 to-emerald-400' : v >= 7.0 ? 'from-cyan-500 to-cyan-400' : v >= 6.5 ? 'from-yellow-500 to-yellow-400' : 'from-slate-500 to-slate-400';
  const sz = size === 'sm' ? 'w-8 h-8 text-base' : 'w-10 h-10 text-base';
  return (
    <div className={`${sz} rounded-lg bg-gradient-to-br ${cls} flex items-center justify-center font-black text-white shadow-lg`} style={{ fontFamily: 'JetBrains Mono' }}>
      {v.toFixed(1)}
    </div>
  );
};

const PositionBadge = ({ position }) => {
  const styles = {
    Forward: 'text-red-400 bg-red-500/10 border-red-500/20',
    Attacker: 'text-red-400 bg-red-500/10 border-red-500/20',
    Midfielder: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    Defender: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Goalkeeper: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-base font-bold border ${styles[position] || 'text-slate-400 bg-white/5 border-white/20'}`}>
      {position}
    </span>
  );
};

const LeaderBar = ({ value, max, color = '#22d3ee' }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
};

/* ═══════════════════════════════════════════
   PROFILE / RADAR CONSTANTS (unchanged)
   ═══════════════════════════════════════════ */
const PROFILE_METRICS = {
  attacker: [
    { key: 'goals', label: 'Goals', scale: 30 },
    { key: 'xG', label: 'xG', scale: 25 },
    { key: 'shotsTotal', label: 'shotsTotal', scale: 120 },
    { key: 'shotAccuracy', label: 'Conversion %', scale: 40 },
    { key: 'assists', label: 'Assists', scale: 15 },
    { key: 'xA', label: 'xA', scale: 12 },
    { key: 'keyPasses', label: 'Key Passes', scale: 80 },
    { key: 'goalsPerNinety', label: 'Goals/90', scale: 1.2 },
    { key: 'npxG', label: 'Non-Pen xG', scale: 20 },
    { key: 'dribbleSuccessPct', label: 'Dribbling', scale: 90 },
  ],
  midfielder: [
    { key: 'assists', label: 'Assists', scale: 15 },
    { key: 'xA', label: 'xA', scale: 12 },
    { key: 'keyPasses', label: 'Key Passes', scale: 90 },
    { key: 'passAccuracy', label: 'Pass Accuracy', scale: 95 },
    { key: 'goals', label: 'Goals', scale: 15 },
    { key: 'xG', label: 'xG', scale: 12 },
    { key: 'assistsPerNinety', label: 'Assists/90', scale: 0.8 },
    { key: 'appearances', label: 'Availability', scale: 38 },
    { key: 'minsPerGame', label: 'Mins/Game', scale: 90 },
    { key: 'dribbleSuccessPct', label: 'Dribbling', scale: 90 },
  ],
  defender: [
    { key: 'appearances', label: 'Games', scale: 38 },
    { key: 'minsPerGame', label: 'Mins/Game', scale: 90 },
    { key: 'duelsWon', label: 'Duels Won', scale: 150 },
    { key: 'tacklesTotal', label: 'Tackles', scale: 80 },
    { key: 'interceptions', label: 'Interceptions', scale: 50 },
    { key: 'blocks', label: 'Blocks', scale: 30 },
    { key: 'passAccuracy', label: 'Pass Accuracy', scale: 95 },
    { key: 'goals', label: 'Goals', scale: 8 },
    { key: 'xG', label: 'xG', scale: 5 },
    { key: 'yellowCards', label: 'Discipline', scale: 12, invert: true },
  ],
  general: [
    { key: 'goals', label: 'Goals', scale: 25 },
    { key: 'assists', label: 'Assists', scale: 15 },
    { key: 'xG', label: 'xG', scale: 20 },
    { key: 'xA', label: 'xA', scale: 10 },
    { key: 'games', label: 'Availability', scale: 38 },
    { key: 'minsPerGame', label: 'Mins/Game', scale: 90 },
    { key: 'keyPasses', label: 'Creativity', scale: 80 },
    { key: 'shots', label: 'Shots', scale: 100 },
    { key: 'goalsPerNinety', label: 'Goals/90', scale: 1.0 },
    { key: 'yellowCards', label: 'Discipline', scale: 12, invert: true },
  ],
};

const PROFILE_LABELS = {
  attacker:   { label: 'Attacking Profile',   color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  midfielder: { label: 'Midfield Profile',    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  defender:   { label: 'Defensive Profile',   color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  goalkeeper: { label: 'Goalkeeper Profile',  color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  general:    { label: 'General Profile',     color: 'text-slate-300 bg-white/5 border-white/20' },
};


/* ═══════════════════════════════════════════
   HEAD-TO-HEAD STAT ROW
   ═══════════════════════════════════════════ */
function H2HRow({ label, values, colors, format = v => v, higherIsBetter = true, animDelay = 0, pcts }) {
  const nums   = values.map(v => Number(v) || 0);
  const maxVal = Math.max(...nums, 0.001);
  const winIdx = higherIsBetter ? nums.indexOf(Math.max(...nums)) : nums.indexOf(Math.min(...nums));
  const isDraw = nums.every(v => v === nums[0]);

  const pctColor = (pct) =>
    pct >= 90 ? '#22d3ee' : pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : pct >= 25 ? '#94a3b8' : '#ef4444';

  const PlayerSide = ({ idx, align }) => (
    <div className={`flex-1 flex flex-col ${align === 'right' ? 'items-end' : 'items-start'} gap-0.5`}>
      <div className={`flex items-center gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {!isDraw && winIdx === idx && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx] }} />}
        <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
          <span className="text-base font-black leading-tight"
            style={{ fontFamily: 'JetBrains Mono', color: !isDraw && winIdx === idx ? colors[idx] : 'rgba(255,255,255,0.45)' }}>
            {format(nums[idx])}
          </span>
          {pcts?.[idx] != null && (
            <span className="text-base font-bold leading-tight" style={{ fontFamily: 'JetBrains Mono', color: pctColor(pcts[idx]), opacity: 0.75 }}>
              {pcts[idx]}th
            </span>
          )}
        </div>
      </div>
      <div className={`w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden ${align === 'right' ? 'flex justify-end' : ''}`}>
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${(nums[idx] / maxVal) * 100}%`, backgroundColor: colors[idx], opacity: !isDraw && winIdx === idx ? 0.9 : 0.3 }} />
      </div>
    </div>
  );

  return (
    <div className="group relative py-2 px-4 rounded-xl hover:bg-white/[0.015] transition-all">
      {!isDraw && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ backgroundColor: colors[winIdx], opacity: 0.5 }} />}
      <div className="flex items-center gap-3">
        <PlayerSide idx={0} align="right" />
        <div className="w-24 flex-shrink-0 text-center">
          <span className="text-base font-bold uppercase tracking-widest" style={{ color: isDraw ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)' }}>
            {label}
          </span>
          {isDraw && <div className="text-base text-slate-300 font-bold">EQUAL</div>}
        </div>
        <PlayerSide idx={1} align="left" />
        {values.length > 2 && <PlayerSide idx={2} align="left" />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PLAYER AUGMENTATION — adds computed per-90
   fields to any player object
   ═══════════════════════════════════════════ */
function augmentPlayer(p) {
  const mins = Math.max(Number(p.minutes || p.minutesPlayed) || 1, 1);

  // per-90 helper — prefers API pre-computed field, falls back to raw / mins * 90
  const p90 = (raw, apiField) => {
    const pre = apiField != null ? Number(p[apiField]) : NaN;
    if (!isNaN(pre) && pre > 0) return Math.round(pre * 1000) / 1000;
    return Math.round(((Number(raw) || 0) / mins * 90) * 1000) / 1000;
  };

  // ── Key passes — API-Football flattens passes.key into many names ──
  const rawKeyPasses =
    Number(p.keyPasses)    ||
    Number(p.key_passes)   ||
    Number(p.passesKey)    ||
    Number(p.passes_key)   ||
    Number(p.passKey)      ||
    Number(p.keypasses)    ||
    0;

  // ── Tackles — multi-name ──
  const rawTackles =
    Number(p.tacklesTotal)  ||
    Number(p.tackles_total) ||
    Number(p.totalTackles)  ||
    Number(p.tackles)       ||
    0;

  // ── Aerial — API-Football duels.aerial.won flattens many ways ──
  const rawAerialWon =
    Number(p.aerialWon)          ||
    Number(p.aerial_won)         ||
    Number(p.duelsAerialWon)     ||
    Number(p.duels_aerial_won)   ||
    Number(p.aerialDuelsWon)     ||
    Number(p.aerialduels_won)    ||
    0;

  const rawAerialLost =
    Number(p.aerialLost)         ||
    Number(p.aerial_lost)        ||
    Number(p.duelsAerialLost)    ||
    Number(p.duels_aerial_lost)  ||
    Number(p.aerialDuelsLost)    ||
    0;

  const aerialTotal = rawAerialWon + rawAerialLost;

  // ── Dribble success % — compute fresh with min-attempts guard ──
  // API-Football: dribbles.success / dribbles.attempts
  const rawDribAttempts =
    Number(p.dribblesAttempts)   ||
    Number(p.dribbles_attempts)  ||
    Number(p.dribbleAttempts)    ||
    Number(p.dribblesAttempted)  ||
    0;

  const rawDribSuccess =
    Number(p.dribblesSuccessful) ||
    Number(p.dribblesSuccess)    ||
    Number(p.dribbles_success)   ||
    Number(p.dribbleSuccess)     ||
    Number(p.dribblesSucceeded)  ||
    0;

  // Compute fresh pct if we have enough attempts; otherwise keep the API value.
  // dribblesAttempted confirmed as real field name from API debug log.
  const dribbleSuccessPct =
    rawDribAttempts >= 20
      ? Math.round((rawDribSuccess / rawDribAttempts) * 100)
      : rawDribAttempts > 0
        ? null   // too few attempts → exclude from Best Dribblers leaderboard
        : (Number(p.dribbleSuccessPct) || null);

  const goalsPerNinety         = p90(p.goals,        'goalsPerNinety');
  const assistsPerNinety       = p90(p.assists,       'assistsPerNinety');
  const xGPerNinety            = p90(p.xG,            'xGPerNinety');
  const xAPerNinety            = p90(p.xA,            'xAPerNinety');
  const keyPassesPerNinety     = p90(rawKeyPasses,    'keyPassesPerNinety');
  const shotsPerNinety         = p90(p.shots ?? p.shotsTotal, 'shotsPerNinety');
  const tacklesPerNinety       = p90(rawTackles,      'tacklesPerNinety');
  const interceptionsPerNinety = p90(p.interceptions, 'interceptionsPerNinety');

  return {
    ...p,
    // Normalised per-90s
    goalsPerNinety,
    assistsPerNinety,
    xGPerNinety,
    xAPerNinety,
    keyPassesPerNinety,
    shotsPerNinety,
    tacklesPerNinety,
    interceptionsPerNinety,
    // Normalised totals
    keyPasses:         rawKeyPasses || 0,
    aerialWon:         rawAerialWon,
    aerialLost:        rawAerialLost,
    dribbleSuccessPct: dribbleSuccessPct,
    // Underscore helpers for role configs
    _tack90:           tacklesPerNinety,
    _inter90:          interceptionsPerNinety,
    _block90:          p90(p.blocks, null),
    _aerial90:         p90(rawAerialWon, null),
    _aerialPct:        aerialTotal > 0 ? Math.round((rawAerialWon / aerialTotal) * 100) : 0,
    _duels90:          p90(p.duelsWon, null),
    _shots90:          shotsPerNinety,
    _gxgDiff:          +((Number(p.goals) || 0) - (Number(p.xG) || 0)).toFixed(1),
    _ga:               (Number(p.goals) || 0) + (Number(p.assists) || 0),
    _xga:              +((Number(p.xG) || 0) + (Number(p.xA) || 0)).toFixed(1),
    _defActions90:     +(tacklesPerNinety + interceptionsPerNinety).toFixed(2),
    _progActions90:    +(keyPassesPerNinety + assistsPerNinety).toFixed(2),
  };
}

/* ═══════════════════════════════════════════
   ROLE DETECTION
   ═══════════════════════════════════════════ */
function detectRole(p) {
  const pos    = (p.position || '').toLowerCase();
  const mins   = Math.max(Number(p.minutes || p.minutesPlayed) || 1, 1);
  const p90    = v => (Number(v) || 0) / mins * 90;
  const g90    = p90(p.goals);
  const a90    = p90(p.assists);
  const kp90   = Number(p.keyPassesPerNinety) || p90(p.keyPasses);
  const tack90 = p90(p.tacklesTotal ?? p.tackles);
  const int90  = p90(p.interceptions);
  const drb    = Number(p.dribbleSuccessPct) || 0;

  if (pos.includes('goalkeeper'))  return 'goalkeeper';
  if (pos.includes('defender'))    return (a90 > 0.12 || kp90 > 0.7) ? 'fullback' : 'centreback';
  if (pos.includes('midfielder')) {
    if (tack90 + int90 > 4.2)  return 'defensive_mid';
    if (kp90 > 1.3 || g90 > 0.22) return 'attacking_mid';
    return 'central_mid';
  }
  if (pos.includes('attacker') || pos.includes('forward'))
    return (drb > 40 || (a90 > 0.22 && kp90 > 0.7)) ? 'winger' : 'striker';
  // fingerprint fallback
  if (tack90 + int90 > 5.0) return 'defensive_mid';
  if (g90 > 0.38)            return 'striker';
  if (kp90 > 1.5)            return 'attacking_mid';
  return 'general';
}

function resolveComparisonRole(roles) {
  if (!roles.length) return 'general';
  const u = [...new Set(roles)];
  if (u.length === 1) return u[0];
  const ATK = new Set(['striker','winger','attacking_mid']);
  const MID = new Set(['central_mid','defensive_mid','attacking_mid']);
  const DEF = new Set(['centreback','fullback']);
  if (roles.every(r => ATK.has(r))) return 'forward_mix';
  if (roles.every(r => MID.has(r))) return 'mid_mix';
  if (roles.every(r => DEF.has(r))) return 'def_mix';
  return 'general';
}

/* ═══════════════════════════════════════════
   ROLE CONFIG — position-appropriate sections
   ═══════════════════════════════════════════ */
function getRoleConfig(role) {
  const f = {
    int:  v => String(+v || 0),
    dec1: v => (+v || 0).toFixed(1),
    dec2: v => (+v || 0).toFixed(2),
    pct:  v => `${+v || 0}%`,
    diff: v => { const n = +v || 0; return (n >= 0 ? '+' : '') + n.toFixed(1); },
    rtg:  v => (+v || 0).toFixed(1),
  };

  const C = {
    striker: {
      label:'Striker / Centre-Forward', badge:'text-red-400 bg-red-500/10 border-red-500/20',
      sections:[
        { title:'Goal Machine',    icon:FlameIcon,    color:'#22d3ee', rows:[
          { key:'goals',           label:'Goals',         format:f.int },
          { key:'xG',              label:'xG',            format:f.dec1 },
          { key:'npxG',            label:'Non-Pen xG',    format:f.dec1 },
          { key:'goalsPerNinety',  label:'Goals / 90',    format:f.dec2 },
          { key:'xGPerNinety',     label:'xG / 90',       format:f.dec2 },
          { key:'_gxgDiff',        label:'G − xG',        format:f.diff },
        ]},
        { title:'Shooting Arsenal', icon:TargetIcon,   color:'#f59e0b', rows:[
          { key:'shots',           label:'Total Shots',   format:f.int },
          { key:'_shots90',        label:'Shots / 90',    format:f.dec2 },
          { key:'shotAccuracy',    label:'Conversion %',  format:f.pct },
        ]},
        { title:'All-Round Threat', icon:SparklesIcon, color:'#a855f7', rows:[
          { key:'assists',         label:'Assists',       format:f.int },
          { key:'xA',              label:'xA',            format:f.dec1 },
          { key:'_ga',             label:'G + A',         format:f.int },
          { key:'keyPasses',       label:'Key Passes',    format:f.int },
          { key:'aerialWon',       label:'Aerials Won',   format:f.int },
        ]},
      ],
      per90:[
        { key:'goalsPerNinety',    label:'Goals/90',   color:'#22d3ee' },
        { key:'xGPerNinety',       label:'xG/90',      color:'#10b981' },
        { key:'_shots90',          label:'Shots/90',   color:'#f59e0b' },
        { key:'assistsPerNinety',  label:'Assists/90', color:'#a855f7' },
        { key:'keyPassesPerNinety',label:'KP/90',      color:'#6366f1' },
      ],
    },

    winger: {
      label:'Wide Forward / Winger', badge:'text-pink-400 bg-pink-500/10 border-pink-500/20',
      sections:[
        { title:'Direct Output',    icon:FlameIcon,    color:'#f43f5e', rows:[
          { key:'goals',            label:'Goals',         format:f.int },
          { key:'assists',          label:'Assists',       format:f.int },
          { key:'xG',               label:'xG',            format:f.dec1 },
          { key:'xA',               label:'xA',            format:f.dec1 },
          { key:'_ga',              label:'G + A',         format:f.int },
          { key:'goalsPerNinety',   label:'Goals / 90',    format:f.dec2 },
          { key:'assistsPerNinety', label:'Assists / 90',  format:f.dec2 },
        ]},
        { title:'Ball Carrying',    icon:ZapIcon,      color:'#8b5cf6', rows:[
          { key:'dribbleSuccessPct',label:'Dribble %',     format:f.pct },
          { key:'shots',            label:'Shots',         format:f.int },
          { key:'_shots90',         label:'Shots / 90',    format:f.dec2 },
          { key:'shotAccuracy',     label:'Conversion %',  format:f.pct },
          { key:'_gxgDiff',         label:'G − xG',        format:f.diff },
        ]},
        { title:'Creative & Pressing', icon:ActivityIcon, color:'#06b6d4', rows:[
          { key:'keyPasses',           label:'Key Passes',    format:f.int },
          { key:'keyPassesPerNinety',  label:'KP / 90',       format:f.dec2 },
          { key:'passAccuracy',        label:'Pass Acc %',    format:f.pct },
          { key:'_inter90',            label:'Intercepts/90', format:f.dec2 },
          { key:'yellowCards',         label:'Yellow Cards',  format:f.int, lower:true },
        ]},
      ],
      per90:[
        { key:'goalsPerNinety',    label:'Goals/90',  color:'#f43f5e' },
        { key:'assistsPerNinety',  label:'Assists/90',color:'#a855f7' },
        { key:'keyPassesPerNinety',label:'KP/90',     color:'#06b6d4' },
        { key:'_shots90',          label:'Shots/90',  color:'#f59e0b' },
        { key:'dribbleSuccessPct', label:'Dribble %', color:'#8b5cf6' },
      ],
    },

    attacking_mid: {
      label:'Attacking Midfielder / CAM', badge:'text-violet-400 bg-violet-500/10 border-violet-500/20',
      sections:[
        { title:'Chance Creation',  icon:SparklesIcon, color:'#8b5cf6', rows:[
          { key:'assists',             label:'Assists',       format:f.int },
          { key:'xA',                  label:'xA',            format:f.dec1 },
          { key:'keyPasses',           label:'Key Passes',    format:f.int },
          { key:'keyPassesPerNinety',  label:'KP / 90',       format:f.dec2 },
          { key:'assistsPerNinety',    label:'Assists / 90',  format:f.dec2 },
          { key:'dribbleSuccessPct',   label:'Dribble %',     format:f.pct },
        ]},
        { title:'Goal Threat',      icon:FlameIcon,    color:'#22d3ee', rows:[
          { key:'goals',               label:'Goals',         format:f.int },
          { key:'xG',                  label:'xG',            format:f.dec1 },
          { key:'npxG',                label:'Non-Pen xG',    format:f.dec1 },
          { key:'goalsPerNinety',      label:'Goals / 90',    format:f.dec2 },
          { key:'shots',               label:'Shots',         format:f.int },
          { key:'_gxgDiff',            label:'G − xG',        format:f.diff },
        ]},
        { title:'Technical & Press', icon:ActivityIcon, color:'#10b981', rows:[
          { key:'passAccuracy',        label:'Pass Acc %',    format:f.pct },
          { key:'_tack90',             label:'Tackles / 90',  format:f.dec2 },
          { key:'_inter90',            label:'Intercepts/90', format:f.dec2 },
          { key:'_defActions90',       label:'Def Actions/90',format:f.dec2 },
          { key:'yellowCards',         label:'Yellow Cards',  format:f.int, lower:true },
        ]},
      ],
      per90:[
        { key:'keyPassesPerNinety', label:'KP/90',      color:'#8b5cf6' },
        { key:'assistsPerNinety',   label:'Assists/90', color:'#a855f7' },
        { key:'goalsPerNinety',     label:'Goals/90',   color:'#22d3ee' },
        { key:'xGPerNinety',        label:'xG/90',      color:'#10b981' },
        { key:'dribbleSuccessPct',  label:'Dribble %',  color:'#f59e0b' },
      ],
    },

    central_mid: {
      label:'Central Midfielder / CM', badge:'text-blue-400 bg-blue-500/10 border-blue-500/20',
      sections:[
        { title:'Box-to-Box Output', icon:ActivityIcon, color:'#3b82f6', rows:[
          { key:'goals',               label:'Goals',         format:f.int },
          { key:'assists',             label:'Assists',       format:f.int },
          { key:'_ga',                 label:'G + A',         format:f.int },
          { key:'keyPasses',           label:'Key Passes',    format:f.int },
          { key:'keyPassesPerNinety',  label:'KP / 90',       format:f.dec2 },
          { key:'dribbleSuccessPct',   label:'Dribble %',     format:f.pct },
        ]},
        { title:'Defensive Engine',   icon:ShieldIcon,   color:'#10b981', rows:[
          { key:'_tack90',             label:'Tackles / 90',  format:f.dec2 },
          { key:'_inter90',            label:'Intercepts/90', format:f.dec2 },
          { key:'_defActions90',       label:'Def Actions/90',format:f.dec2 },
          { key:'_duels90',            label:'Duels Won/90',  format:f.dec2 },
          { key:'aerialWon',           label:'Aerials Won',   format:f.int },
        ]},
        { title:'Distribution',       icon:SparklesIcon, color:'#f59e0b', rows:[
          { key:'passAccuracy',        label:'Pass Acc %',    format:f.pct },
          { key:'xA',                  label:'xA',            format:f.dec1 },
          { key:'xG',                  label:'xG',            format:f.dec1 },
          { key:'_xga',                label:'xG + xA',       format:f.dec1 },
          { key:'yellowCards',         label:'Yellow Cards',  format:f.int, lower:true },
        ]},
      ],
      per90:[
        { key:'keyPassesPerNinety', label:'KP/90',       color:'#3b82f6' },
        { key:'_tack90',            label:'Tackles/90',  color:'#10b981' },
        { key:'_inter90',           label:'Intercept/90',color:'#34d399' },
        { key:'goalsPerNinety',     label:'Goals/90',    color:'#22d3ee' },
        { key:'assistsPerNinety',   label:'Assists/90',  color:'#a855f7' },
      ],
    },

    defensive_mid: {
      label:'Defensive Midfielder / CDM', badge:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      sections:[
        { title:'Defensive Shield',   icon:ShieldIcon,   color:'#10b981', rows:[
          { key:'_tack90',             label:'Tackles / 90',  format:f.dec2 },
          { key:'_inter90',            label:'Intercepts/90', format:f.dec2 },
          { key:'_defActions90',       label:'Def Actions/90',format:f.dec2 },
          { key:'_block90',            label:'Blocks / 90',   format:f.dec2 },
          { key:'interceptions',       label:'Total Intercepts',format:f.int },
          { key:'_duels90',            label:'Duels Won/90',  format:f.dec2 },
        ]},
        { title:'Aerial & Physical',  icon:TrophyIcon,   color:'#f59e0b', rows:[
          { key:'aerialWon',           label:'Aerials Won',   format:f.int },
          { key:'_aerialPct',          label:'Aerial Win %',  format:f.pct },
          { key:'_aerial90',           label:'Aerials / 90',  format:f.dec2 },
          { key:'duelsWon',            label:'Total Duels',   format:f.int },
        ]},
        { title:'Ball Retention',     icon:ActivityIcon, color:'#6366f1', rows:[
          { key:'passAccuracy',        label:'Pass Acc %',    format:f.pct },
          { key:'keyPasses',           label:'Key Passes',    format:f.int },
          { key:'assists',             label:'Assists',       format:f.int },
          { key:'goals',               label:'Goals',         format:f.int },
          { key:'yellowCards',         label:'Yellow Cards',  format:f.int, lower:true },
        ]},
      ],
      per90:[
        { key:'_tack90',      label:'Tackles/90',  color:'#10b981' },
        { key:'_inter90',     label:'Intercept/90',color:'#34d399' },
        { key:'_aerial90',    label:'Aerials/90',  color:'#f59e0b' },
        { key:'passAccuracy', label:'Pass Acc %',  color:'#6366f1' },
        { key:'_block90',     label:'Blocks/90',   color:'#94a3b8' },
      ],
    },

    centreback: {
      label:'Centre-Back / CB', badge:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      sections:[
        { title:'Defensive Solidity', icon:ShieldIcon,   color:'#10b981', rows:[
          { key:'_tack90',             label:'Tackles / 90',  format:f.dec2 },
          { key:'_inter90',            label:'Intercepts/90', format:f.dec2 },
          { key:'_defActions90',       label:'Def Actions/90',format:f.dec2 },
          { key:'_block90',            label:'Blocks / 90',   format:f.dec2 },
          { key:'interceptions',       label:'Total Intercepts',format:f.int },
          { key:'yellowCards',         label:'Yellow Cards',  format:f.int, lower:true },
        ]},
        { title:'Aerial Dominance',   icon:TrophyIcon,   color:'#f59e0b', rows:[
          { key:'aerialWon',           label:'Aerials Won',   format:f.int },
          { key:'_aerialPct',          label:'Aerial Win %',  format:f.pct },
          { key:'_aerial90',           label:'Aerials / 90',  format:f.dec2 },
          { key:'duelsWon',            label:'Duels Won',     format:f.int },
          { key:'_duels90',            label:'Duels Won/90',  format:f.dec2 },
        ]},
        { title:'Ball-Playing',       icon:ActivityIcon, color:'#38bdf8', rows:[
          { key:'passAccuracy',        label:'Pass Acc %',    format:f.pct },
          { key:'keyPasses',           label:'Key Passes',    format:f.int },
          { key:'assists',             label:'Assists',       format:f.int },
          { key:'goals',               label:'Goals (Set Piece)',format:f.int },
          { key:'xG',                  label:'xG',            format:f.dec1 },
        ]},
      ],
      per90:[
        { key:'_tack90',      label:'Tackles/90',  color:'#10b981' },
        { key:'_inter90',     label:'Intercept/90',color:'#34d399' },
        { key:'_aerial90',    label:'Aerials/90',  color:'#f59e0b' },
        { key:'passAccuracy', label:'Pass Acc %',  color:'#38bdf8' },
        { key:'_block90',     label:'Blocks/90',   color:'#94a3b8' },
      ],
    },

    fullback: {
      label:'Full-Back / Wing-Back', badge:'text-sky-400 bg-sky-500/10 border-sky-500/20',
      sections:[
        { title:'Attacking Contribution', icon:ZapIcon,     color:'#38bdf8', rows:[
          { key:'assists',              label:'Assists',       format:f.int },
          { key:'xA',                   label:'xA',            format:f.dec1 },
          { key:'keyPasses',            label:'Key Passes',    format:f.int },
          { key:'assistsPerNinety',     label:'Assists / 90',  format:f.dec2 },
          { key:'goals',                label:'Goals',         format:f.int },
          { key:'dribbleSuccessPct',    label:'Dribble %',     format:f.pct },
        ]},
        { title:'Defensive Duty',     icon:ShieldIcon,   color:'#10b981', rows:[
          { key:'_tack90',              label:'Tackles / 90',  format:f.dec2 },
          { key:'_inter90',             label:'Intercepts/90', format:f.dec2 },
          { key:'_defActions90',        label:'Def Actions/90',format:f.dec2 },
          { key:'_block90',             label:'Blocks / 90',   format:f.dec2 },
          { key:'aerialWon',            label:'Aerials Won',   format:f.int },
        ]},
        { title:'Athleticism & Discipline', icon:ActivityIcon, color:'#f59e0b', rows:[
          { key:'passAccuracy',         label:'Pass Acc %',    format:f.pct },
          { key:'_duels90',             label:'Duels Won/90',  format:f.dec2 },
          { key:'_xga',                 label:'xG + xA',       format:f.dec1 },
          { key:'yellowCards',          label:'Yellow Cards',  format:f.int, lower:true },
          { key:'redCards',             label:'Red Cards',     format:f.int, lower:true },
        ]},
      ],
      per90:[
        { key:'assistsPerNinety',    label:'Assists/90', color:'#38bdf8' },
        { key:'keyPassesPerNinety',  label:'KP/90',      color:'#a855f7' },
        { key:'_tack90',             label:'Tackles/90', color:'#10b981' },
        { key:'_inter90',            label:'Intercept/90',color:'#34d399' },
        { key:'dribbleSuccessPct',   label:'Dribble %',  color:'#f59e0b' },
      ],
    },

    goalkeeper: {
      label:'Goalkeeper', badge:'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      sections:[
        { title:'Performance',        icon:TrophyIcon,   color:'#fbbf24', rows:[
          { key:'rating',              label:'Season Rating', format:f.rtg },
          { key:'appearances',         label:'Appearances',   format:f.int },
        ]},
        { title:'Distribution',       icon:ActivityIcon, color:'#38bdf8', rows:[
          { key:'passAccuracy',        label:'Pass Acc %',    format:f.pct },
          { key:'keyPasses',           label:'Key Passes',    format:f.int },
          { key:'assists',             label:'Assists',       format:f.int },
        ]},
        { title:'Aerial Command',     icon:ShieldIcon,   color:'#10b981', rows:[
          { key:'aerialWon',           label:'Aerials Won',   format:f.int },
          { key:'_aerialPct',          label:'Aerial Win %',  format:f.pct },
          { key:'_aerial90',           label:'Aerials / 90',  format:f.dec2 },
          { key:'yellowCards',         label:'Yellow Cards',  format:f.int, lower:true },
        ]},
      ],
      per90:[
        { key:'rating',       label:'Rating',    color:'#fbbf24' },
        { key:'passAccuracy', label:'Pass Acc %',color:'#38bdf8' },
        { key:'_aerial90',    label:'Aerials/90',color:'#10b981' },
        { key:'_aerialPct',   label:'Aerial %',  color:'#f59e0b' },
        { key:'keyPasses',    label:'Key Passes',color:'#6366f1' },
      ],
    },

    forward_mix: {
      label:'Forward Profile', badge:'text-red-400 bg-red-500/10 border-red-500/20',
      sections:[
        { title:'Goal Output',        icon:FlameIcon,    color:'#f43f5e', rows:[
          { key:'goals',               label:'Goals',         format:f.int },
          { key:'xG',                  label:'xG',            format:f.dec1 },
          { key:'goalsPerNinety',      label:'Goals / 90',    format:f.dec2 },
          { key:'xGPerNinety',         label:'xG / 90',       format:f.dec2 },
          { key:'_gxgDiff',            label:'G − xG',        format:f.diff },
          { key:'shotAccuracy',        label:'Conversion %',  format:f.pct },
        ]},
        { title:'Chance Creation',    icon:SparklesIcon, color:'#a855f7', rows:[
          { key:'assists',             label:'Assists',       format:f.int },
          { key:'xA',                  label:'xA',            format:f.dec1 },
          { key:'keyPasses',           label:'Key Passes',    format:f.int },
          { key:'_ga',                 label:'G + A',         format:f.int },
          { key:'dribbleSuccessPct',   label:'Dribble %',     format:f.pct },
        ]},
        { title:'Volume & Pressing',  icon:TargetIcon,   color:'#f59e0b', rows:[
          { key:'shots',               label:'Total Shots',   format:f.int },
          { key:'_shots90',            label:'Shots / 90',    format:f.dec2 },
          { key:'npxG',                label:'Non-Pen xG',    format:f.dec1 },
          { key:'_inter90',            label:'Intercepts/90', format:f.dec2 },
        ]},
      ],
      per90:[
        { key:'goalsPerNinety',     label:'Goals/90',   color:'#f43f5e' },
        { key:'xGPerNinety',        label:'xG/90',      color:'#10b981' },
        { key:'assistsPerNinety',   label:'Assists/90', color:'#a855f7' },
        { key:'_shots90',           label:'Shots/90',   color:'#f59e0b' },
        { key:'keyPassesPerNinety', label:'KP/90',      color:'#6366f1' },
      ],
    },

    mid_mix: {
      label:'Midfield Profile', badge:'text-blue-400 bg-blue-500/10 border-blue-500/20',
      sections:[
        { title:'Offensive Contribution', icon:ZapIcon,     color:'#3b82f6', rows:[
          { key:'goals',               label:'Goals',         format:f.int },
          { key:'assists',             label:'Assists',       format:f.int },
          { key:'_ga',                 label:'G + A',         format:f.int },
          { key:'keyPasses',           label:'Key Passes',    format:f.int },
          { key:'xG',                  label:'xG',            format:f.dec1 },
          { key:'xA',                  label:'xA',            format:f.dec1 },
        ]},
        { title:'Defensive Contribution', icon:ShieldIcon,  color:'#10b981', rows:[
          { key:'_tack90',             label:'Tackles / 90',  format:f.dec2 },
          { key:'_inter90',            label:'Intercepts/90', format:f.dec2 },
          { key:'_defActions90',       label:'Def Actions/90',format:f.dec2 },
          { key:'aerialWon',           label:'Aerials Won',   format:f.int },
          { key:'_duels90',            label:'Duels Won/90',  format:f.dec2 },
        ]},
        { title:'Technical',          icon:SparklesIcon, color:'#8b5cf6', rows:[
          { key:'passAccuracy',        label:'Pass Acc %',    format:f.pct },
          { key:'dribbleSuccessPct',   label:'Dribble %',     format:f.pct },
          { key:'keyPassesPerNinety',  label:'KP / 90',       format:f.dec2 },
          { key:'yellowCards',         label:'Yellow Cards',  format:f.int, lower:true },
        ]},
      ],
      per90:[
        { key:'keyPassesPerNinety', label:'KP/90',       color:'#3b82f6' },
        { key:'_tack90',            label:'Tackles/90',  color:'#10b981' },
        { key:'goalsPerNinety',     label:'Goals/90',    color:'#22d3ee' },
        { key:'assistsPerNinety',   label:'Assists/90',  color:'#a855f7' },
        { key:'_inter90',           label:'Intercept/90',color:'#34d399' },
      ],
    },

    def_mix: {
      label:'Defensive Profile', badge:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      sections:[
        { title:'Defensive Actions',  icon:ShieldIcon,   color:'#10b981', rows:[
          { key:'_tack90',             label:'Tackles / 90',  format:f.dec2 },
          { key:'_inter90',            label:'Intercepts/90', format:f.dec2 },
          { key:'_defActions90',       label:'Def Actions/90',format:f.dec2 },
          { key:'_block90',            label:'Blocks / 90',   format:f.dec2 },
          { key:'interceptions',       label:'Total Intercepts',format:f.int },
        ]},
        { title:'Aerial & Duels',     icon:TrophyIcon,   color:'#f59e0b', rows:[
          { key:'aerialWon',           label:'Aerials Won',   format:f.int },
          { key:'_aerialPct',          label:'Aerial Win %',  format:f.pct },
          { key:'_aerial90',           label:'Aerials / 90',  format:f.dec2 },
          { key:'_duels90',            label:'Duels Won/90',  format:f.dec2 },
          { key:'duelsWon',            label:'Total Duels',   format:f.int },
        ]},
        { title:'With the Ball',      icon:ActivityIcon, color:'#38bdf8', rows:[
          { key:'passAccuracy',        label:'Pass Acc %',    format:f.pct },
          { key:'keyPasses',           label:'Key Passes',    format:f.int },
          { key:'assists',             label:'Assists',       format:f.int },
          { key:'goals',               label:'Goals',         format:f.int },
          { key:'yellowCards',         label:'Yellow Cards',  format:f.int, lower:true },
        ]},
      ],
      per90:[
        { key:'_tack90',          label:'Tackles/90',  color:'#10b981' },
        { key:'_inter90',         label:'Intercept/90',color:'#34d399' },
        { key:'_aerial90',        label:'Aerials/90',  color:'#f59e0b' },
        { key:'passAccuracy',     label:'Pass Acc %',  color:'#38bdf8' },
        { key:'assistsPerNinety', label:'Assists/90',  color:'#a855f7' },
      ],
    },

    general: {
      label:'General Profile', badge:'text-slate-400 bg-white/5 border-white/20',
      sections:[
        { title:'Goal Contribution',  icon:FlameIcon,    color:'#22d3ee', rows:[
          { key:'goals',               label:'Goals',         format:f.int },
          { key:'assists',             label:'Assists',       format:f.int },
          { key:'_ga',                 label:'G + A',         format:f.int },
          { key:'xG',                  label:'xG',            format:f.dec1 },
          { key:'xA',                  label:'xA',            format:f.dec1 },
          { key:'_xga',                label:'xG + xA',       format:f.dec1 },
        ]},
        { title:'Defensive Output',   icon:ShieldIcon,   color:'#10b981', rows:[
          { key:'_tack90',             label:'Tackles / 90',  format:f.dec2 },
          { key:'_inter90',            label:'Intercepts/90', format:f.dec2 },
          { key:'_defActions90',       label:'Def Actions/90',format:f.dec2 },
          { key:'aerialWon',           label:'Aerials Won',   format:f.int },
          { key:'_aerialPct',          label:'Aerial Win %',  format:f.pct },
        ]},
        { title:'Technical',          icon:ActivityIcon, color:'#a855f7', rows:[
          { key:'passAccuracy',        label:'Pass Acc %',    format:f.pct },
          { key:'keyPasses',           label:'Key Passes',    format:f.int },
          { key:'dribbleSuccessPct',   label:'Dribble %',     format:f.pct },
          { key:'shotAccuracy',        label:'Shot Conv %',   format:f.pct },
          { key:'yellowCards',         label:'Yellow Cards',  format:f.int, lower:true },
        ]},
      ],
      per90:[
        { key:'goalsPerNinety',     label:'Goals/90',    color:'#22d3ee' },
        { key:'assistsPerNinety',   label:'Assists/90',  color:'#a855f7' },
        { key:'keyPassesPerNinety', label:'KP/90',       color:'#6366f1' },
        { key:'_tack90',            label:'Tackles/90',  color:'#10b981' },
        { key:'_inter90',           label:'Intercept/90',color:'#34d399' },
      ],
    },
  };
  return C[role] || C.general;
}

/* ═══════════════════════════════════════════
   ROLE-AWARE COMPOSITE SCORE
   ═══════════════════════════════════════════ */
function calcComposite(p) {
  const aug  = augmentPlayer(p);
  const role = detectRole(p);
  const WEIGHTS = {
    striker:       { goals:30, xG:20, goalsPerNinety:20, shotAccuracy:15, assists:15 },
    winger:        { goals:20, assists:25, xA:15, dribbleSuccessPct:15, keyPasses:25 },
    attacking_mid: { assists:25, keyPasses:20, xA:20, goals:20, passAccuracy:15 },
    central_mid:   { keyPasses:22, passAccuracy:18, _tack90:20, assists:20, goals:20 },
    defensive_mid: { _tack90:28, _inter90:28, _aerialPct:15, passAccuracy:15, assists:14 },
    centreback:    { _tack90:25, _inter90:25, _aerialPct:20, passAccuracy:20, goals:10 },
    fullback:      { assists:25, _tack90:20, _inter90:15, keyPasses:20, passAccuracy:20 },
    goalkeeper:    { rating:80, appearances:20 },
    forward_mix:   { goals:28, assists:20, xG:20, goalsPerNinety:20, keyPasses:12 },
    mid_mix:       { keyPasses:20, passAccuracy:20, goals:20, assists:20, _tack90:20 },
    def_mix:       { _tack90:25, _inter90:25, _aerialPct:20, passAccuracy:20, assists:10 },
    general:       { goals:25, assists:20, xG:20, goalsPerNinety:20, keyPasses:15 },
  };
  const SCALES = {
    goals:30, xG:25, assists:15, goalsPerNinety:1.2, shotAccuracy:40,
    keyPasses:80, passAccuracy:95, xA:12, dribbleSuccessPct:75,
    _tack90:4, _inter90:3.5, _aerialPct:80, aerialWon:100, appearances:38, rating:10,
  };
  const w = WEIGHTS[role] || WEIGHTS.general;
  let score = 0;
  for (const [key, wt] of Object.entries(w)) {
    const sc  = SCALES[key] || 1;
    const val = Math.abs(Number(aug[key]) || 0);
    score += Math.min(val / sc, 1) * wt;
  }
  return Math.round(Math.min(score, 100));
}

/* ═══════════════════════════════════════════
   PLAYER HERO CARD (comparison header)
   ═══════════════════════════════════════════ */
function PlayerHeroCard({ player, color, composite, rank, augPlayer, role }) {
  const [imgErr, setImgErr] = useState(false);

  // Role-appropriate key stats shown in the card
  const ROLE_STATS = {
    striker:       [
      { l:'Goals',  v: player.goals||0,                                       c: color },
      { l:'xG',     v: (player.xG||0).toFixed(1),                             c: '#10b981' },
      { l:'G/90',   v: (augPlayer?.goalsPerNinety||0).toFixed(2),              c: '#f59e0b' },
      { l:'Shot%',  v: `${player.shotAccuracy||0}%`,                           c: '#a855f7' },
    ],
    winger:        [
      { l:'Goals',  v: player.goals||0,                                       c: color },
      { l:'Assists',v: player.assists||0,                                     c: '#a855f7' },
      { l:'Drib%',  v: `${player.dribbleSuccessPct||0}%`,                     c: '#f59e0b' },
      { l:'KP/90',  v: (augPlayer?.keyPassesPerNinety||0).toFixed(2),          c: '#10b981' },
    ],
    attacking_mid: [
      { l:'Assists',v: player.assists||0,                                     c: color },
      { l:'xA',     v: (player.xA||0).toFixed(1),                             c: '#a855f7' },
      { l:'KP/90',  v: (augPlayer?.keyPassesPerNinety||0).toFixed(2),          c: '#10b981' },
      { l:'Pass%',  v: `${player.passAccuracy||0}%`,                           c: '#f59e0b' },
    ],
    central_mid:   [
      { l:'KP/90',  v: (augPlayer?.keyPassesPerNinety||0).toFixed(2),          c: color },
      { l:'Tack/90',v: (augPlayer?._tack90||0).toFixed(2),                     c: '#10b981' },
      { l:'Pass%',  v: `${player.passAccuracy||0}%`,                           c: '#f59e0b' },
      { l:'G+A',    v: (player.goals||0)+(player.assists||0),                  c: '#a855f7' },
    ],
    defensive_mid: [
      { l:'Tack/90',v: (augPlayer?._tack90||0).toFixed(2),                     c: color },
      { l:'Int/90', v: (augPlayer?._inter90||0).toFixed(2),                    c: '#10b981' },
      { l:'Duels/90',v:(augPlayer?._duels90||0).toFixed(2),                    c: '#f59e0b' },
      { l:'Pass%',  v: `${player.passAccuracy||0}%`,                           c: '#a855f7' },
    ],
    centreback:    [
      { l:'Tack/90',v: (augPlayer?._tack90||0).toFixed(2),                     c: color },
      { l:'Int/90', v: (augPlayer?._inter90||0).toFixed(2),                    c: '#10b981' },
      { l:'Aer%',   v: `${augPlayer?._aerialPct||0}%`,                         c: '#f59e0b' },
      { l:'Pass%',  v: `${player.passAccuracy||0}%`,                           c: '#a855f7' },
    ],
    fullback:      [
      { l:'Assists',v: player.assists||0,                                     c: color },
      { l:'Tack/90',v: (augPlayer?._tack90||0).toFixed(2),                     c: '#10b981' },
      { l:'KP/90',  v: (augPlayer?.keyPassesPerNinety||0).toFixed(2),          c: '#f59e0b' },
      { l:'Drib%',  v: `${player.dribbleSuccessPct||0}%`,                     c: '#a855f7' },
    ],
    goalkeeper:    [
      { l:'Rating', v: (player.rating||0).toFixed(1),                          c: color },
      { l:'Pass%',  v: `${player.passAccuracy||0}%`,                           c: '#38bdf8' },
      { l:'Aer/90', v: (augPlayer?._aerial90||0).toFixed(2),                   c: '#10b981' },
      { l:'Aer%',   v: `${augPlayer?._aerialPct||0}%`,                         c: '#f59e0b' },
    ],
    general:       [
      { l:'Goals',  v: player.goals||0,                                       c: color },
      { l:'Assists',v: player.assists||0,                                     c: '#a855f7' },
      { l:'xG',     v: (player.xG||0).toFixed(1),                             c: '#10b981' },
      { l:'G/90',   v: (augPlayer?.goalsPerNinety||0).toFixed(2),              c: '#f59e0b' },
    ],
  };

  const stats = ROLE_STATS[role] || ROLE_STATS.general;

  // Role display label
  const ROLE_LABELS = {
    striker:'CF / Striker', winger:'Winger / Wide FW', attacking_mid:'CAM / AM',
    central_mid:'CM / Box-to-Box', defensive_mid:'CDM / Holding',
    centreback:'Centre-Back', fullback:'Full-Back', goalkeeper:'Goalkeeper', general:'General',
  };

  return (
    <div className="relative flex-shrink-0 w-[260px] sm:flex-1 sm:w-auto rounded-2xl overflow-hidden border"
      style={{ borderColor: color + '30', background: `linear-gradient(135deg, ${color}08 0%, rgba(5,8,16,0.97) 55%)` }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      {/* Rank */}
      <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-base font-black"
        style={{ backgroundColor: color + '20', color, border: `1px solid ${color}35` }}>
        {rank + 1}
      </div>

      <div className="p-4">
        {/* Photo + identity */}
        <div className="flex items-center gap-3 mb-3">
          {player.photo && !imgErr ? (
            <img src={player.photo} alt="" onError={() => setImgErr(true)}
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              style={{ boxShadow: `0 0 18px ${color}40` }} />
          ) : (
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${color}22, ${color}08)`, border: `1px solid ${color}28` }}>
              <span className="font-black text-xl" style={{ color }}>{(player.name||'?')[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-base leading-tight truncate">{player.name}</p>
            <div className="flex items-center gap-1 mt-1">
              {player.teamLogo && <img src={player.teamLogo} alt="" className="w-3.5 h-3.5 flex-shrink-0" />}
              <span className="text-slate-400 text-base truncate">{player.team}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {LEAGUE_FLAG_IMG[player.league] && <img src={LEAGUE_FLAG_IMG[player.league]} alt="" className="w-3 h-3 object-contain" />}
              {/* Detected role badge */}
              <span className="text-base font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: color + '15', color, border: `1px solid ${color}25` }}>
                {ROLE_LABELS[role] || player.position}
              </span>
            </div>
          </div>
        </div>

        {/* OVR ring + role-appropriate stats */}
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4.5" />
              <circle cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - composite / 100)}`}
                style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-black text-white text-[15px] leading-none" style={{ fontFamily: 'JetBrains Mono' }}>{composite}</span>
              <span className="text-[7px] text-slate-400 uppercase tracking-wide">OVR</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {stats.map(s => (
              <div key={s.l}>
                <div className="text-[15px] font-black leading-tight" style={{ fontFamily: 'JetBrains Mono', color: s.c }}>{s.v}</div>
                <div className="text-base text-slate-400 uppercase tracking-wide leading-tight">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {player.rating > 0 && role !== 'goalkeeper' && (
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/12">
            <span className="text-[15px] text-slate-400 font-semibold">Season Rating</span>
            <RatingBadge value={player.rating} size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   H2H CATEGORY SECTION
   ═══════════════════════════════════════════ */
function H2HSection({ title, icon: Icon, color, rows, players, colors, getPct }) {
  const wins = players.map((_, pi) => {
    return rows.filter(r => {
      const nums = players.map(p => Number(p[r.key]) || 0);
      const maxIdx = r.lower ? nums.indexOf(Math.min(...nums)) : nums.indexOf(Math.max(...nums));
      return maxIdx === pi && !nums.every(v => v === nums[0]);
    }).length;
  });

  return (
    <div className="rounded-2xl border border-white/12 overflow-hidden" style={{ background: 'rgba(10,16,30,0.7)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/12"
        style={{ background: `linear-gradient(90deg, ${color}10, transparent)` }}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5" style={{ color }} />}
          <span className="text-white font-black text-base uppercase tracking-widest">{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {players.map((p, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-base font-black"
              style={{ backgroundColor: colors[i] + '18', color: colors[i], border: `1px solid ${colors[i]}28` }}>
              {wins[i]}W
            </div>
          ))}
        </div>
      </div>
      {/* Column name headers */}
      <div className="flex items-center gap-3 px-4 pt-2">
        <div className="flex-1 flex justify-end">
          <span className="text-base font-black uppercase tracking-widest truncate max-w-[72px]" style={{ color: colors[0] }}>
            {players[0]?.name?.split(' ').pop()}
          </span>
        </div>
        <div className="w-24 flex-shrink-0" />
        {players.slice(1).map((p, i) => (
          <div key={i} className="flex-1">
            <span className="text-base font-black uppercase tracking-widest truncate max-w-[72px]" style={{ color: colors[i+1] }}>
              {p?.name?.split(' ').pop()}
            </span>
          </div>
        ))}
      </div>
      <div className="pb-2">
        {rows.map((row, i) => (
          <H2HRow
            key={row.key}
            label={row.label}
            values={players.map(p => p[row.key] || 0)}
            colors={colors}
            format={row.format || (v => v)}
            higherIsBetter={!row.lower}
            pcts={getPct ? players.map((_, pi) => getPct(pi, row.key)) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN ANALYTICS PAGE
   ═══════════════════════════════════════════ */
function AnalyticsPage({ onNavigate }) {
  const [activeTab, setActiveTab]           = useState('comparison');
  const [allPlayers, setAllPlayers]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [searchTerm, setSearchTerm]         = useState('');
  const [filterLeague, setFilterLeague]     = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [radarProfile, setRadarProfile]     = useState('auto');
  const [topCategory, setTopCategory]       = useState('goals');

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const resp = await fetch(`${API_BASE}/players-stats/all`);
        const data = await resp.json();
        setAllPlayers(data);
      } catch (err) {
        console.error('Failed to fetch players:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  const normalize = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredPlayers = useMemo(() => allPlayers.filter(p => {
    const matchSearch   = !searchTerm    || normalize(p.name).includes(normalize(searchTerm))  || normalize(p.team).includes(normalize(searchTerm));
    const matchLeague   = !filterLeague   || p.league   === filterLeague;
    const matchPosition = !filterPosition || p.position === filterPosition;
    return matchSearch && matchLeague && matchPosition;
  }), [allPlayers, searchTerm, filterLeague, filterPosition]);

  const togglePlayerSelection = (player) => {
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else if (selectedPlayers.length < 3) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
    setRadarProfile('auto');
  };

  const getActiveProfile = () => {
    if (radarProfile !== 'auto') return radarProfile;
    const positions = selectedPlayers.map(p => p.position);
    if (positions.every(p => p === 'Forward' || p === 'Attacker')) return 'attacker';
    if (positions.every(p => p === 'Midfielder'))                   return 'midfielder';
    if (positions.every(p => p === 'Defender'))                     return 'defender';
    if (positions.every(p => p === 'Goalkeeper'))                   return 'goalkeeper';
    return 'general';
  };

  const generateRadarData = () => {
    if (selectedPlayers.length < 2) return [];
    const metrics = PROFILE_METRICS[getActiveProfile()] || PROFILE_METRICS.general;
    return metrics.map(m => {
      const row = { metric: m.label };
      selectedPlayers.forEach((p, i) => {
        let val = p[m.key] || 0;
        if (m.invert) val = m.scale - val;
        row[`player${i + 1}`] = Math.min(100, Math.max(0, Math.round((val / m.scale) * 100)));
      });
      return row;
    });
  };

  const generateLeagueData = () => {
    const LEAGUE_COLORS = {
      'Premier League': '#22d3ee', 'La Liga': '#f59e0b',
      'Bundesliga': '#ef4444', 'Serie A': '#a855f7', 'Ligue 1': '#10b981',
      'Primeira Liga': '#f97316',
    };

    // First pass — raw values per league
    const raw = LEAGUES.map(league => {
      const lp   = allPlayers.filter(p => p.league === league);
      const qual = lp.filter(p => (p.minutes || 0) >= 450);
      const n    = qual.length || 1;
      const sum  = key => qual.reduce((s, p) => s + (Number(p[key]) || 0), 0);
      const avg  = key => sum(key) / n;
      const best = (key, lower = false) => [...qual].filter(p => (p[key]||0) > 0).sort((a, b) =>
        lower ? (a[key]||999) - (b[key]||999) : (b[key]||0) - (a[key]||0))[0];
      return {
        league,
        color:       LEAGUE_COLORS[league] || '#94a3b8',
        shortName:   league.replace(' League', '').replace('Premier', 'EPL'),
        players:     lp.length,
        goals:       sum('goals'),
        assists:     sum('assists'),
        xG:          Math.round(sum('xG') * 10) / 10,
        avgGoals:    Math.round(avg('goals') * 100) / 100,
        avgAssists:  Math.round(avg('assists') * 100) / 100,
        avgXG:       Math.round(avg('xG') * 100) / 100,
        avgPasses:   Math.round(avg('passAccuracy') * 10) / 10,
        avgRating:   Math.round(avg('rating') * 100) / 100,
        avgKeyPasses:Math.round(avg('keyPasses') * 100) / 100,
        avgTackles:  Math.round(avg('tacklesTotal') * 100) / 100,
        _dnaRaw: {
          attacking:   avg('goalsPerNinety') + avg('assistsPerNinety'),
          creativity:  avg('keyPasses'),
          passing:     avg('passAccuracy'),
          defending:   avg('tacklesTotal') + (avg('interceptions') || 0),
          physicality: avg('aerialWon'),
          efficiency:  avg('xG'),
        },
        bestScorer: best('goals'),
        bestRated:  best('rating'),
        bestAssist: best('assists'),
        bestPasser: best('passAccuracy'),
      };
    });

    // Second pass — normalise each DNA dimension 40–100 relative to min/max across leagues.
    // Floor at 40 so no league collapses to zero — the shape shows relative identity.
    const DNA_KEYS = ['attacking','creativity','passing','defending','physicality','efficiency'];
    const maxD = {}, minD = {};
    DNA_KEYS.forEach(k => {
      const vals = raw.map(l => l._dnaRaw[k]);
      maxD[k] = Math.max(...vals, 0.001);
      minD[k] = Math.min(...vals);
    });

    return raw.map(l => ({
      ...l,
      dna: Object.fromEntries(
        DNA_KEYS.map(k => {
          const range = maxD[k] - minD[k];
          const norm  = range < 0.0001 ? 70
            : 40 + Math.round(((l._dnaRaw[k] - minD[k]) / range) * 60);
          return [k, norm];
        })
      ),
    }));
  };

  const topPerformers = useMemo(() => {
    const cats = {
      goals:            { label: 'Top Scorers',      key: 'goals',             iconType: 'zap',      color: '#22d3ee', suffix: '',    position: null,                      minMins: 900  },
      assists:          { label: 'Top Assists',       key: 'assists',           iconType: 'star',     color: '#a855f7', suffix: '',    position: null,                      minMins: 900  },
      xG:               { label: 'Top xG',            key: 'xG',                iconType: 'bar',      color: '#10b981', suffix: '',    position: null,                      minMins: 900  },
      goalsPerNinety:   { label: 'Goals per 90',      key: 'goalsPerNinety',    iconType: 'target',   color: '#f59e0b', suffix: '/90', position: null,                      minMins: 900  },
      xA:               { label: 'Top xA',            key: 'xA',                iconType: 'trending', color: '#ec4899', suffix: '',    position: null,                      minMins: 900  },
      keyPasses:        { label: 'Key Passes',        key: 'keyPasses',         iconType: 'shield',   color: '#6366f1', suffix: '',    position: null,                      minMins: 900  },
      rating:           { label: 'Best Rated',        key: 'rating',            iconType: 'trophy',   color: '#fbbf24', suffix: '',    position: null,                      minMins: 450  },
      passAccuracy:     { label: 'Pass Masters',      key: 'passAccuracy',      iconType: 'activity', color: '#38bdf8', suffix: '%',   position: null,                      minMins: 900  },
      tacklesTotal:     { label: 'Tackle Leaders',    key: 'tacklesTotal',      iconType: 'shield',   color: '#34d399', suffix: '',    position: ['Defender','Midfielder'], minMins: 450, useAug: true },
      aerialWon:        { label: 'Duel Kings',       key: 'duelsWon',          iconType: 'zap',      color: '#fb923c', suffix: '',    position: null,                      minMins: 450, useAug: false, noZeroFilter: false },
      dribbleSuccessPct:{ label: 'Best Dribblers',    key: 'dribbleSuccessPct', iconType: 'trending', color: '#e879f9', suffix: '%',   position: ['Attacker','Midfielder'], minMins: 450, useAug: true },
      discipline:       { label: 'Cleanest Players', key: 'yellowCards',       iconType: 'star',     color: '#a3e635', suffix: '',    position: null, lowerIsBetter: true, minMins: 900, noZeroFilter: true },
    };
    const result = {};
    for (const [catId, cat] of Object.entries(cats)) {
      // Use augmented players for categories that need field-name resolution
      let pool = (cat.useAug ? allPlayers.map(augmentPlayer) : allPlayers)
        .filter(p => (p.minutes || p.minutesPlayed || 0) >= cat.minMins)
        .filter(p => filterLeague ? p.league === filterLeague : true);

      if (cat.position) pool = pool.filter(p => cat.position.some(pos => (p.position||'').includes(pos)));

      // For dribble%: exclude null values (insufficient attempts) and zeros
      if (catId === 'dribbleSuccessPct') {
        pool = pool.filter(p => p.dribbleSuccessPct != null && p.dribbleSuccessPct > 0);
      } else if (!cat.noZeroFilter) {
        pool = pool.filter(p => (p[cat.key] || 0) > 0);
      }

      result[catId] = {
        ...cat,
        players: pool.sort((a, b) => cat.lowerIsBetter
          ? (a[cat.key] ?? 999) - (b[cat.key] ?? 999)
          : (b[cat.key] || 0) - (a[cat.key] || 0)
        ).slice(0, 20),
      };
    }
    return result;
  }, [allPlayers, filterLeague]);

  /* Percentile lookup maps — sorted arrays per role per metric */
  const PCT_KEYS = [
    'goals','assists','xG','xA','npxG','goalsPerNinety','assistsPerNinety','xGPerNinety',
    'keyPasses','keyPassesPerNinety','passAccuracy','dribbleSuccessPct','shots','shotAccuracy',
    'tacklesTotal','interceptions','blocks','duelsWon','aerialWon','rating','appearances',
    '_tack90','_inter90','_block90','_aerial90','_aerialPct','_duels90',
    '_gxgDiff','_ga','_xga','_shots90','_defActions90','_progActions90',
  ];
  const rolePercentileCache = useMemo(() => {
    const groups = {};
    allPlayers.forEach(p => {
      const role = detectRole(p);
      if (!groups[role]) groups[role] = [];
      groups[role].push(augmentPlayer(p));
    });
    const cache = {};
    for (const [role, players] of Object.entries(groups)) {
      cache[role] = {};
      PCT_KEYS.forEach(key => {
        cache[role][key] = players.map(p => Number(p[key]) || 0).sort((a, b) => a - b);
      });
    }
    return cache;
  }, [allPlayers]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="theme-page min-h-screen bg-[#0a0e1a] flex items-center justify-center" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <AppLoader title="Loading Player Data" sub="Fetching stats across 7 leagues…" color="#22d3ee"/>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div className="theme-page min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/3 w-[600px] h-[600px] rounded-full blur-[120px]" style={{background:'rgba(34,211,238,0.05)'}}/>
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px]" style={{background:'rgba(168,85,247,0.04)'}}/>
      </div>

      {/* NAV */}
      <NavBar currentPage="analytics" onNavigate={onNavigate}>
        <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-base font-semibold">
          <span style={{ fontFamily: 'JetBrains Mono' }}>{allPlayers.length}</span> players
        </span>
        <ThemeToggle />
      </NavBar>

      <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* HEADER — two-line gradient like Analysis/Simulator */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"/>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">Real-Time Stats · 7 Leagues</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-4">
            Player<br/>
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">Analytics</span>
          </h1>
          <p className="text-slate-300 text-base max-w-lg leading-relaxed">Compare players, track performance, and discover top performers across 7 leagues.</p>
        </div>

        {/* TABS — flex style matching Analysis page */}
        <div className="flex gap-1.5 mb-8 rounded-2xl p-1.5 border border-white/12" style={{background:'rgba(10,14,26,0.6)'}}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 overflow-hidden"
                style={{
                  background: isActive ? 'rgba(34,211,238,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(34,211,238,0.3)' : '1px solid transparent',
                  boxShadow: isActive ? '0 4px 20px rgba(34,211,238,0.1)' : 'none',
                }}>
                {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{background:'linear-gradient(90deg,transparent,#22d3ee,transparent)'}}/>}
                <tab.icon className="w-4 h-4 flex-shrink-0" style={{color: isActive ? '#22d3ee' : '#64748b'}}/>
                <span className="font-bold text-sm hidden md:inline" style={{color: isActive ? '#22d3ee' : '#64748b'}}>{tab.label}</span>
                <span className="font-bold text-sm md:hidden" style={{color: isActive ? '#22d3ee' : '#64748b'}}>{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* ══ TAB: COMPARISON ══ */}
        {activeTab === 'comparison' && (
          <div>
            {/* ── League card selector ── */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <button onClick={() => setFilterLeague('')}
                className="relative p-3 rounded-2xl border transition-all text-center"
                style={{
                  background: !filterLeague ? 'linear-gradient(135deg,rgba(34,211,238,0.12),rgba(168,85,247,0.05))' : 'rgba(255,255,255,0.02)',
                  borderColor: !filterLeague ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)',
                  boxShadow: !filterLeague ? '0 4px 20px rgba(34,211,238,0.1)' : 'none',
                }}>
                <div className="w-8 h-8 mx-auto mb-1.5 rounded-full flex items-center justify-center" style={{background:'rgba(255,255,255,0.06)'}}>
                  <span className="text-xs font-black" style={{color: !filterLeague ? '#22d3ee' : '#64748b'}}>ALL</span>
                </div>
                <p className="text-xs font-semibold" style={{color: !filterLeague ? 'white' : '#64748b'}}>All</p>
                {!filterLeague && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{background:'linear-gradient(90deg,#22d3ee,#a855f7)'}}/>}
              </button>
              {LEAGUES.map(l => {
                const isActive = filterLeague === l;
                return (
                  <button key={l} onClick={() => setFilterLeague(isActive ? '' : l)}
                    className="relative p-3 rounded-2xl border transition-all text-center"
                    style={{
                      background: isActive ? 'linear-gradient(135deg,rgba(34,211,238,0.12),rgba(168,85,247,0.05))' : 'rgba(255,255,255,0.02)',
                      borderColor: isActive ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)',
                      boxShadow: isActive ? '0 4px 20px rgba(34,211,238,0.1)' : 'none',
                    }}>
                    <img src={LEAGUE_FLAG_IMG[l]} alt={l} className="w-8 h-8 mx-auto mb-1.5 object-contain transition-all"
                      style={{opacity: isActive ? 1 : 0.4, transform: isActive ? 'scale(1.1)' : 'scale(1)'}}/>
                    <p className="text-xs font-semibold truncate" style={{color: isActive ? 'white' : '#64748b'}}>
                      {l.replace(' League','').replace('Premier','EPL')}
                    </p>
                    {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{background:'linear-gradient(90deg,#22d3ee,#a855f7)'}}/>}
                  </button>
                );
              })}
            </div>

            {/* ── Search & position filter ── */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search player or team…"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-white text-base border focus:outline-none"
                  style={{background:'rgba(255,255,255,0.04)',borderColor:'rgba(255,255,255,0.1)'}}/>
              </div>
              <div className="relative">
                <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}
                  className="px-4 py-3.5 rounded-2xl text-white text-base border focus:outline-none appearance-none pr-9 cursor-pointer"
                  style={{background:'rgba(255,255,255,0.04)',borderColor:'rgba(255,255,255,0.1)'}}>
                  <option value="" className="bg-[#0a0e1a]">All Positions</option>
                  {POSITIONS.map(p => <option key={p} value={p} className="bg-[#0a0e1a]">{p}</option>)}
                </select>
                <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4 flex items-center gap-1.5">
              <span style={{fontFamily:'JetBrains Mono'}} className="text-white font-bold">{filteredPlayers.length}</span>
              players · click up to 3 to compare
              {selectedPlayers.length > 0 && <span className="text-cyan-400">· {selectedPlayers.length} selected</span>}
            </p>

            {/* ── Player grid (list-style, richer) ── */}
            <div className="rounded-2xl border border-white/12 mb-4 overflow-hidden" style={{ background: 'rgba(10,16,30,0.8)' }}>
              <div className="max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
                {filteredPlayers.slice(0, 200).map((player, i) => {
                  const isSelected = selectedPlayers.find(p => p.id === player.id);
                  const selIdx     = selectedPlayers.findIndex(p => p.id === player.id);
                  const color      = RADAR_COLORS[selIdx] || '#22d3ee';
                  return (
                    <button key={player.id || i} onClick={() => togglePlayerSelection(player)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all border-b border-white/10 last:border-0"
                      style={{ background: isSelected ? `${color}08` : 'transparent' }}
                      onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}>

                      {/* Selection indicator */}
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border transition-all"
                        style={isSelected
                          ? { backgroundColor: color, borderColor: color }
                          : { borderColor: 'rgba(255,255,255,0.1)' }}>
                        {isSelected && <span className="text-[15px] font-black text-white">{selIdx + 1}</span>}
                      </div>

                      {/* Photo */}
                      {player.photo ? (
                        <img src={player.photo} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 bg-white/5" onError={e => e.target.style.display='none'} />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/5">
                          <span className="text-base font-bold text-slate-300">{(player.name||'?')[0]}</span>
                        </div>
                      )}

                      {/* Name + team */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-base truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{player.name}</span>
                          <PositionBadge position={player.position} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {player.teamLogo && <img src={player.teamLogo} alt="" className="w-3 h-3 flex-shrink-0" />}
                          <span className="text-base text-slate-400 truncate">{player.team}</span>
                          {LEAGUE_FLAG_IMG[player.league] && <img src={LEAGUE_FLAG_IMG[player.league]} alt="" className="w-3 h-3 object-contain flex-shrink-0" />}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                        {[
                          { l:'G',   v: player.goals   ||0, c:'#22d3ee' },
                          { l:'A',   v: player.assists  ||0, c:'#a855f7' },
                          { l:'xG',  v:(player.xG||0).toFixed(1), c:'#10b981' },
                        ].map(s => (
                          <div key={s.l} className="text-center w-8">
                            <div className="text-base font-black leading-tight" style={{ fontFamily:'JetBrains Mono', color: s.c }}>{s.v}</div>
                            <div className="text-base text-slate-300 uppercase">{s.l}</div>
                          </div>
                        ))}
                        {player.rating > 0 && <RatingBadge value={player.rating} size="sm" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Selected strip ── */}
            {selectedPlayers.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-5 px-1">
                {selectedPlayers.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                    style={{ borderColor: RADAR_COLORS[i]+'35', backgroundColor: RADAR_COLORS[i]+'10' }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: RADAR_COLORS[i] }} />
                    <span className="text-white font-bold text-base">{p.name}</span>
                    <span className="text-slate-400 text-base">{p.team}</span>
                    <button onClick={() => togglePlayerSelection(p)} className="ml-1 p-0.5 rounded-full hover:bg-white/10">
                      <XIcon className="w-3 h-3 text-slate-300" />
                    </button>
                  </div>
                ))}
                <span className="text-base text-slate-300">{selectedPlayers.length < 3 ? `+ ${3-selectedPlayers.length} more` : 'max 3'}</span>
                {selectedPlayers.length >= 2 && (
                  <div className="ml-auto">
                    <ExportButton label="Export PDF" size="sm" onClick={() => exportPlayerComparison(selectedPlayers)} />
                  </div>
                )}
              </div>
            )}

            {/* ══ COMPARISON CONTENT (2+ players) ══ */}
            {selectedPlayers.length >= 2 && (() => {
              // ── Step 1: augment all players with computed per-90 fields ──
              const augPlayers = selectedPlayers.map(augmentPlayer);

              // ── Step 2: detect granular role per player ──
              const roles      = augPlayers.map(detectRole);
              const compRole   = resolveComparisonRole(roles);
              const roleConfig = getRoleConfig(compRole);

              // ── Step 3: role-aware composite scores ──
              const composites = augPlayers.map(p => calcComposite(p));
              const winnerIdx  = composites.indexOf(Math.max(...composites));

              // ── Step 4: percentile lookup wired to the cache ──
              const getPct = (playerIdx, key) => {
                const role   = roles[playerIdx];
                const sorted = rolePercentileCache[role]?.[key];
                if (!sorted || sorted.length < 5) return null;
                const val  = Number(augPlayers[playerIdx][key]) || 0;
                const rank = sorted.filter(v => v <= val).length;
                return Math.round((rank / sorted.length) * 100);
              };

              // ── Step 5: role-aware radar data ──
              const profile = getActiveProfile();

              return (
                <div>
                  {/* ── Hero cards row ── */}
                  <div className="flex gap-3 mb-4 sm:mb-5 overflow-x-auto pb-2" style={{ gridTemplateColumns: `repeat(${selectedPlayers.length}, 1fr)` }}>
                    {selectedPlayers.map((p, i) => (
                      <PlayerHeroCard
                        key={i}
                        player={p}
                        color={RADAR_COLORS[i]}
                        composite={composites[i]}
                        rank={i}
                        augPlayer={augPlayers[i]}
                        role={roles[i]}
                      />
                    ))}
                  </div>

                  {/* ── Overall verdict banner ── */}
                  <div className="mb-4 sm:mb-5 rounded-2xl p-3 sm:p-4 border border-white/15 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
                    style={{ background: `linear-gradient(135deg, ${RADAR_COLORS[winnerIdx]}08, rgba(5,8,16,0.92))` }}>
                    <TrophyIcon className="w-5 h-5 flex-shrink-0" style={{ color: RADAR_COLORS[winnerIdx] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-base">
                        <span style={{ color: RADAR_COLORS[winnerIdx] }}>{selectedPlayers[winnerIdx].name}</span>
                        {' '}leads overall
                      </p>
                      <p className="text-base text-slate-300 mt-0.5">
                        Composite: {selectedPlayers.map((p, i) => (
                          <span key={i}>
                            <span className="font-black" style={{ color: RADAR_COLORS[i] }}>{composites[i]}</span>
                            {i < selectedPlayers.length - 1 ? <span className="text-slate-300"> vs </span> : ''}
                          </span>
                        ))}
                        <span className="ml-2 px-2 py-0.5 rounded-md text-[15px] font-bold border"
                          style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                          {roleConfig.label}
                        </span>
                      </p>
                    </div>
                    {/* Profile selector for radar */}
                    <div className="flex items-center gap-1 flex-wrap w-full sm:w-auto">
                      <span className="text-base text-slate-300 uppercase tracking-widest font-bold mr-1">Radar:</span>
                      {['auto','attacker','midfielder','defender','goalkeeper','general'].map(pid => (
                        <button key={pid} onClick={() => setRadarProfile(pid)}
                          className={`px-2 py-1 rounded-lg text-base font-black transition-all border uppercase tracking-wide ${
                            radarProfile === pid
                              ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                              : 'bg-white/3 border-white/12 text-slate-300 hover:text-slate-400'
                          }`}>
                          {pid === 'auto' ? 'Auto' : pid === 'goalkeeper' ? 'GK' : pid.slice(0,3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Radar + H2H sections layout ── */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
                    {/* Radar */}
                    <div className="lg:col-span-2 rounded-2xl border border-white/12 overflow-hidden"
                      style={{ background: 'rgba(10,16,30,0.8)' }}>
                      <div className="px-4 py-3 border-b border-white/12 flex items-center gap-2">
                        <TargetIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-white font-bold text-base">Radar</span>
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-base font-bold border ${PROFILE_LABELS[profile]?.color || 'text-slate-400 bg-white/5 border-white/20'}`}>
                          {PROFILE_LABELS[profile]?.label || 'General'}
                        </span>
                      </div>
                      <div className="p-2">
                        <ResponsiveContainer width="100%" height={300}>
                          <RadarChart data={generateRadarData()} margin={{ top: 8, right: 18, bottom: 8, left: 18 }}>
                            <PolarGrid stroke="rgba(255,255,255,0.05)" />
                            <PolarAngleAxis dataKey="metric" tick={{ fill: '#4b5563', fontSize: 9.5, fontWeight: 700 }} />
                            <PolarRadiusAxis stroke="rgba(255,255,255,0.03)" domain={[0,100]} tick={false} />
                            {selectedPlayers.map((p, i) => (
                              <Radar key={i} name={p.name} dataKey={`player${i+1}`}
                                stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]}
                                fillOpacity={0.12} strokeWidth={2}
                                dot={{ r: 2.5, fill: RADAR_COLORS[i], strokeWidth: 0 }} />
                            ))}
                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700, paddingTop: 6 }}
                              formatter={val => <span style={{ color: '#94a3b8' }}>{val}</span>} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* H2H sections — from roleConfig, using augmented players */}
                    <div className="lg:col-span-3 space-y-3">
                      {roleConfig.sections.map((section, si) => (
                        <H2HSection
                          key={si}
                          title={section.title}
                          icon={section.icon}
                          color={section.color}
                          rows={section.rows}
                          players={augPlayers}
                          colors={RADAR_COLORS}
                          getPct={(playerIdx, key) => getPct(playerIdx, key)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* ── Per-90 bar chart — from roleConfig.per90 ── */}
                  <div className="rounded-2xl border border-white/12 overflow-hidden"
                    style={{ background: 'rgba(10,16,30,0.8)' }}>
                    <div className="px-4 py-3 border-b border-white/12 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ActivityIcon className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-white font-bold text-base">Per-90 Breakdown</span>
                      </div>
                      <span className="text-[15px] text-slate-400 px-2 py-0.5 rounded-md bg-white/3 border border-white/12">
                        {roleConfig.label}
                      </span>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={roleConfig.per90.map(metric => {
                            const row = { metric: metric.label };
                            augPlayers.forEach((p, i) => { row[`p${i}`] = Math.round((Number(p[metric.key]) || 0) * 100) / 100; });
                            return row;
                          })}
                          barGap={2} barCategoryGap="28%">
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="metric" stroke="#1e293b" tick={{ fill: '#4b5563', fontSize: 9.5 }} />
                          <YAxis stroke="#1e293b" tick={{ fill: '#4b5563', fontSize: 9 }} />
                          <Tooltip
                            contentStyle={{ background: '#080f1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 11 }}
                            labelStyle={{ color: '#fff', fontWeight: 700 }} />
                          {selectedPlayers.map((p, i) => (
                            <Bar key={i} dataKey={`p${i}`} name={p.name} fill={RADAR_COLORS[i]}
                              radius={[3,3,0,0]} fillOpacity={0.88} />
                          ))}
                          <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }}
                            formatter={val => <span style={{ color: '#94a3b8' }}>{val}</span>} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Empty state ── */}
            {selectedPlayers.length < 2 && (
              <div className="rounded-2xl p-12 border border-white/12 text-center" style={{ background: 'rgba(10,16,30,0.5)' }}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/15 flex items-center justify-center">
                  <UsersIcon className="w-7 h-7 text-cyan-400/40" />
                </div>
                <p className="text-white font-bold text-base mb-1">Select 2–3 Players to Compare</p>
                <p className="text-slate-400 text-base">Head-to-head stats, radar chart, per-90 breakdown and overall verdict will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: SIMILARITY ENGINE ══ */}
        {activeTab === 'similarity' && (
          <SimilarityTab
            allPlayers={allPlayers}
            onSendToComparison={(player) => {
              setSelectedPlayers(prev => {
                if (prev.find(p => p.id === player.id || p.name === player.name)) return prev;
                if (prev.length >= 3) return [...prev.slice(1), player]; // bump oldest if full
                return [...prev, player];
              });
              setActiveTab('comparison');
            }}
          />
        )}

        {/* ══ TAB: TOP PERFORMERS ══ */}
        {activeTab === 'top' && (
          <div>
            {/* ── League filter strip ── */}
            <div className="flex items-center gap-1 sm:gap-1.5 mb-4 sm:mb-5 flex-wrap">
              <button onClick={() => setFilterLeague('')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-base font-bold border transition-all whitespace-nowrap ${
                  !filterLeague ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-white/3 border-white/12 text-slate-400 hover:text-white'
                }`}>
                <GlobeIcon className="w-3 h-3" /> All Leagues
              </button>
              {LEAGUES.map(l => (
                <button key={l} onClick={() => setFilterLeague(filterLeague === l ? '' : l)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-base font-bold border transition-all whitespace-nowrap ${
                    filterLeague === l ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-white/3 border-white/12 text-slate-400 hover:text-white'
                  }`}>
                  <img src={LEAGUE_FLAG_IMG[l]} alt="" className="w-3.5 h-3.5 object-contain" />
                  {l.replace(' League','').replace('Premier','EPL')}
                </button>
              ))}
            </div>

            {/* ── Category tabs ── */}
            <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
              {Object.entries(topPerformers).map(([catId, cat]) => {
                const icons = { zap: ZapIcon, star: StarIcon, bar: BarChartIcon, target: TargetIcon,
                  trending: TrendingUpIcon, shield: ShieldIcon, trophy: TrophyIcon, activity: ActivityIcon };
                const Icon = icons[cat.iconType] || ZapIcon;
                return (
                  <button key={catId} onClick={() => setTopCategory(catId)}
                    className={`px-3.5 py-2 rounded-xl text-base font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                      topCategory === catId ? 'shadow-lg' : 'bg-white/[0.03] text-slate-400 hover:text-white border-transparent'
                    }`}
                    style={topCategory === catId ? { backgroundColor: cat.color+'18', borderColor: cat.color+'40', color: cat.color } : {}}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* ── Spotlight stat cards ── */}
            {(() => {
              const q = allPlayers.filter(p => (p.minutes||0) >= 900 && (!filterLeague || p.league === filterLeague));
              const top = (key, lower=false) => [...q]
                .filter(p => lower ? true : (p[key]||0) > 0)
                .sort((a,b) => lower ? (a[key]??999)-(b[key]??999) : (b[key]||0)-(a[key]||0))[0];
              const cards = [
                { label:'Golden Boot',     player: top('goals'),           stat: `${top('goals')?.goals||0}`,              suffix:'G',    color:'#22d3ee' },
                { label:'Assist King',     player: top('assists'),         stat: `${top('assists')?.assists||0}`,          suffix:'A',    color:'#a855f7' },
                { label:'xG Leader',       player: top('xG'),              stat: `${(top('xG')?.xG||0).toFixed(1)}`,       suffix:'xG',   color:'#10b981' },
                { label:'Best Rating',     player: top('rating'),          stat: `${(top('rating')?.rating||0).toFixed(1)}`,suffix:'★',   color:'#fbbf24' },
                { label:'Goals / 90',      player: top('goalsPerNinety'),  stat: `${(top('goalsPerNinety')?.goalsPerNinety||0).toFixed(2)}`, suffix:'/90', color:'#f59e0b' },
                { label:'Cleanest',        player: top('yellowCards', true),stat:`${top('yellowCards',true)?.yellowCards||0}`, suffix:'YC', color:'#a3e635' },
              ];
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
                  {cards.map((c, i) => (
                    <div key={i} className="rounded-2xl p-3.5 border relative overflow-hidden group cursor-default"
                      style={{ borderColor: c.color+'20', background: `linear-gradient(135deg, ${c.color}08, rgba(5,8,16,0.95))` }}>
                      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c.color}60, transparent)` }} />
                      <p className="text-base text-slate-400 uppercase tracking-widest font-bold mb-2">{c.label}</p>
                      <p className="font-black leading-none mb-2" style={{ fontFamily:'JetBrains Mono', color: c.color, fontSize: 22 }}>
                        {c.stat}<span className="text-base ml-0.5 opacity-60">{c.suffix}</span>
                      </p>
                      {c.player && (
                        <div className="flex items-center gap-1.5">
                          {c.player.photo && <img src={c.player.photo} alt="" className="w-5 h-5 rounded-md object-cover flex-shrink-0" onError={e=>e.target.style.display='none'} />}
                          <div className="min-w-0">
                            <p className="text-base text-white font-bold truncate leading-tight">{c.player.name}</p>
                            <p className="text-base text-slate-400 truncate leading-tight">{c.player.team}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ── Main leaderboard ── */}
            {topPerformers[topCategory] && (
              <div className="rounded-2xl border border-white/12 overflow-hidden" style={{ background:'rgba(8,14,26,0.9)' }}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/12 flex items-center justify-between"
                  style={{ background:`linear-gradient(90deg, ${topPerformers[topCategory].color}08, transparent)` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: topPerformers[topCategory].color+'18', border:`1px solid ${topPerformers[topCategory].color}30` }}>
                      {(() => { const icons={zap:ZapIcon,star:StarIcon,bar:BarChartIcon,target:TargetIcon,trending:TrendingUpIcon,shield:ShieldIcon,trophy:TrophyIcon,activity:ActivityIcon}; const I=icons[topPerformers[topCategory].iconType]||ZapIcon; return <I className="w-4 h-4" style={{color:topPerformers[topCategory].color}} />; })()}
                    </div>
                    <div>
                      <h3 className="text-white font-black text-base">{topPerformers[topCategory].label}</h3>
                      <p className="text-[15px] text-slate-400">
                        {filterLeague ? filterLeague : 'All 5 Leagues'} · Min. {topPerformers[topCategory].minMins} mins
                        {topPerformers[topCategory].position && ` · ${topPerformers[topCategory].position.join(' & ')}`}
                        {topPerformers[topCategory].lowerIsBetter && ' · Lower is better'}
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-bold px-2.5 py-1 rounded-xl border"
                    style={{ color: topPerformers[topCategory].color, backgroundColor: topPerformers[topCategory].color+'10', borderColor: topPerformers[topCategory].color+'25' }}>
                    {topPerformers[topCategory].players.length} players
                  </span>
                </div>

                <div className="divide-y divide-white/[0.025]">
                  {topPerformers[topCategory].players.slice(0,20).map((player, idx) => {
                    const val  = player[topPerformers[topCategory].key] ?? 0;
                    const cat  = topPerformers[topCategory];
                    // For lowerIsBetter: rank 1 has lowest val → show smallest bar (discipline = fewer cards = shorter bar)
                    // Use worst player (last) as the scale reference so #1 bar is proportionally smallest
                    const worstVal = cat.lowerIsBetter
                      ? Math.max(...cat.players.map(p => p[cat.key] ?? 0), 1)
                      : 1;
                    const bestVal = cat.lowerIsBetter ? 0 : (cat.players[0]?.[cat.key] || 1);
                    const barPct  = cat.lowerIsBetter
                      ? (worstVal > 0 ? Math.max(4, Math.round((val / worstVal) * 100)) : 4)
                      : Math.min(Math.round(((val || 0) / (cat.players[0]?.[cat.key] || 1)) * 100), 100);
                    const isTop3 = idx < 3;
                    const medalGrad = ['from-yellow-400 to-amber-500','from-slate-200 to-slate-400','from-amber-500 to-amber-700'];

                    return (
                      <div key={player.id||idx}
                        className={`flex items-center gap-3 px-5 py-3 transition-all group ${isTop3 ? '' : 'hover:bg-white/[0.015]'}`}
                        style={isTop3 ? { background:`linear-gradient(90deg, ${cat.color}06, transparent)` } : {}}>

                        {/* Rank */}
                        <div className="w-8 flex-shrink-0 flex justify-center">
                          {isTop3 ? (
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${medalGrad[idx]} flex items-center justify-center shadow-lg`}>
                              <span className="text-base font-black text-white">{idx+1}</span>
                            </div>
                          ) : (
                            <span className="text-base text-slate-300 font-black" style={{fontFamily:'JetBrains Mono'}}>{idx+1}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        {player.photo ? (
                          <img src={player.photo} alt="" className="w-9 h-9 rounded-xl object-cover bg-white/5 flex-shrink-0" onError={e=>e.target.style.display='none'} />
                        ) : (
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background:`${cat.color}15` }}>
                            <span className="font-black text-base" style={{color:cat.color}}>{(player.name||'?')[0]}</span>
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-bold text-base truncate ${isTop3 ? 'text-white' : 'text-slate-300'}`}>{player.name}</p>
                            <PositionBadge position={player.position} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {player.teamLogo && <img src={player.teamLogo} alt="" className="w-3 h-3 flex-shrink-0" />}
                            <span className="text-base text-slate-400 truncate">{player.team}</span>
                            {!filterLeague && LEAGUE_FLAG_IMG[player.league] && (
                              <img src={LEAGUE_FLAG_IMG[player.league]} alt="" className="w-3 h-3 object-contain flex-shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Stat + bar */}
                        <div className="w-28 flex-shrink-0">
                          <div className="flex items-center justify-end gap-1.5 mb-1">
                            <span className="font-black text-base" style={{ fontFamily:'JetBrains Mono', color: isTop3 ? cat.color : 'rgba(255,255,255,0.5)' }}>
                              {typeof val === 'number' && val%1!==0 ? val.toFixed(2) : val}
                            </span>
                            {cat.suffix && <span className="text-base text-slate-300 font-bold">{cat.suffix}</span>}
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width:`${barPct}%`, backgroundColor: cat.color, opacity: isTop3 ? 0.9 : 0.4 }} />
                          </div>
                        </div>

                        {/* Send to Comparison */}
                        <button
                          onClick={() => {
                            setSelectedPlayers(prev => {
                              if (prev.find(p => p.id===player.id||p.name===player.name)) return prev;
                              if (prev.length>=3) return [...prev.slice(1),player];
                              return [...prev,player];
                            });
                            setActiveTab('comparison');
                          }}
                          className="flex-shrink-0 p-2 rounded-xl border border-white/12 bg-white/[0.03] text-slate-400 hover:border-cyan-500/30 hover:bg-cyan-500/8 hover:text-cyan-400 transition-all opacity-0 group-hover:opacity-100"
                          title="Send to Comparison">
                          <SendIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {topPerformers[topCategory].players.length === 0 && (
                  <div className="py-14 text-center">
                    <p className="text-slate-300 text-base">No players match this filter.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: TIMELINE ══ */}
        {activeTab === 'timeline' && (
          <PerformanceTimeline players={allPlayers} onNavigate={onNavigate} />
        )}

        {/* ══ TAB: LEAGUES ══ */}
        {activeTab === 'leagues' && (() => {
          const leagueData = generateLeagueData();
          const DNA_DIMS   = ['attacking','creativity','passing','defending','physicality','efficiency'];
          const DNA_LABELS = ['Attacking','Creativity','Passing','Defending','Physical','Efficiency'];
          const DNA_COLORS = { attacking:'#f43f5e', creativity:'#a855f7', passing:'#38bdf8', defending:'#10b981', physicality:'#f59e0b', efficiency:'#22d3ee' };

          return (
            <div>
              {/* ── League DNA Radar + Spotlight cards ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

                {/* DNA Radar */}
                <div className="lg:col-span-1 rounded-2xl border border-white/12 overflow-hidden" style={{ background:'rgba(8,14,26,0.9)' }}>
                  <div className="px-4 py-3.5 border-b border-white/12 flex items-center gap-2">
                    <TargetIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-white font-black text-base">League DNA</span>
                    <span className="ml-auto text-[15px] text-slate-400">avg per qualified player</span>
                  </div>
                  <div className="p-3">
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={DNA_DIMS.map((dim, di) => {
                        const row = { dim: DNA_LABELS[di] };
                        leagueData.forEach(l => { row[l.shortName] = l.dna[dim] || 0; });
                        return row;
                      })}>
                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                        <PolarAngleAxis dataKey="dim" tick={{ fill:'#4b5563', fontSize:9.5, fontWeight:700 }} />
                        <PolarRadiusAxis domain={[0,100]} tick={false} stroke="rgba(255,255,255,0.03)" />
                        {leagueData.map((l, i) => (
                          <Radar key={i} name={l.shortName} dataKey={l.shortName}
                            stroke={l.color} fill={l.color} fillOpacity={0.1} strokeWidth={2}
                            dot={{ r:2.5, fill:l.color, strokeWidth:0 }} />
                        ))}
                        <Legend wrapperStyle={{ fontSize:'10px', fontWeight:700, paddingTop:6 }}
                          formatter={val => <span style={{ color:'#94a3b8' }}>{val}</span>} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Best player spotlight cards */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {leagueData.map((l, i) => {
                    const star = l.bestRated || l.bestScorer;
                    if (!star) return null;
                    const [imgErr, setImgErr] = [false, () => {}]; // placeholder
                    return (
                      <div key={i} className="rounded-2xl border overflow-hidden relative group cursor-default"
                        style={{ borderColor: l.color+'25', background:`linear-gradient(135deg, ${l.color}08, rgba(5,8,16,0.97))` }}>
                        <div className="absolute top-0 left-0 right-0 h-px" style={{ background:`linear-gradient(90deg, transparent, ${l.color}50, transparent)` }} />
                        <div className="p-4">
                          {/* League header */}
                          <div className="flex items-center gap-2 mb-3">
                            <img src={LEAGUE_FLAG_IMG[l.league]} alt="" className="w-5 h-5 object-contain" />
                            <span className="text-base font-black uppercase tracking-widest" style={{ color:l.color }}>{l.shortName}</span>
                            <span className="text-[15px] text-slate-300 ml-auto">{l.players} players</span>
                          </div>
                          {/* Star player */}
                          <div className="flex items-center gap-3 mb-3">
                            {star.photo ? (
                              <img src={star.photo} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                                style={{ boxShadow:`0 0 16px ${l.color}30` }}
                                onError={e => e.target.style.display='none'} />
                            ) : (
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background:`${l.color}15`, border:`1px solid ${l.color}25` }}>
                                <span className="font-black text-lg" style={{ color:l.color }}>{(star.name||'?')[0]}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-white text-base leading-tight truncate">{star.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {star.teamLogo && <img src={star.teamLogo} alt="" className="w-3.5 h-3.5" />}
                                <span className="text-base text-slate-300 truncate">{star.team}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <PositionBadge position={star.position} />
                                {star.rating > 0 && <RatingBadge value={star.rating} size="sm" />}
                              </div>
                            </div>
                          </div>
                          {/* League avg stats */}
                          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/12">
                            {[
                              { l:'Avg Goals', v: l.avgGoals.toFixed(1),  c: l.color },
                              { l:'Avg Assists',v: l.avgAssists.toFixed(1),c:'#a855f7' },
                              { l:'Avg Pass%', v: `${Math.round(l.avgPasses)}%`, c:'#38bdf8' },
                            ].map(s => (
                              <div key={s.l} className="text-center">
                                <div className="font-black text-[15px] leading-tight" style={{ fontFamily:'JetBrains Mono', color:s.c }}>{s.v}</div>
                                <div className="text-base text-slate-300 uppercase tracking-wide">{s.l}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Head-to-head league comparison table ── */}
              <div className="rounded-2xl border border-white/12 overflow-hidden mb-5" style={{ background:'rgba(8,14,26,0.9)' }}>
                <div className="px-5 py-4 border-b border-white/12 flex items-center gap-2">
                  <BarChartIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-white font-black text-base">League Intelligence Report</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                        <th className="text-left px-5 py-3 text-[15px] font-black text-slate-400 uppercase tracking-widest w-32">Metric</th>
                        {leagueData.map(l => (
                          <th key={l.league} className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <img src={LEAGUE_FLAG_IMG[l.league]} alt="" className="w-5 h-5 object-contain" />
                              <span className="text-[15px] font-black uppercase tracking-wide" style={{ color:l.color }}>{l.shortName}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label:'Total Goals',    key:'goals',       fmt: v=>v,           color:'#22d3ee', higher:true },
                        { label:'Total Assists',  key:'assists',     fmt: v=>v,           color:'#a855f7', higher:true },
                        { label:'Total xG',       key:'xG',          fmt: v=>v.toFixed(1),color:'#10b981', higher:true },
                        { label:'Avg Goals/Player',key:'avgGoals',   fmt: v=>v.toFixed(2),color:'#f59e0b', higher:true },
                        { label:'Avg Pass %',     key:'avgPasses',   fmt: v=>`${Math.round(v)}%`, color:'#38bdf8', higher:true },
                        { label:'Avg Rating',     key:'avgRating',   fmt: v=>v.toFixed(2),color:'#fbbf24', higher:true },
                      ].map((row, ri) => {
                        const vals   = leagueData.map(l => l[row.key] || 0);
                        const best   = Math.max(...vals);
                        const worst  = Math.min(...vals);
                        return (
                          <tr key={row.label} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', background: ri%2===0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                            <td className="px-5 py-3 text-base font-semibold text-slate-300 whitespace-nowrap">{row.label}</td>
                            {leagueData.map((l, li) => {
                              const val    = l[row.key] || 0;
                              const isBest = val === best;
                              const isWorst= val === worst && worst !== best;
                              return (
                                <td key={l.league} className="px-4 py-3 text-center">
                                  <span className="font-black text-base"
                                    style={{ fontFamily:'JetBrains Mono',
                                      color: isBest ? row.color : isWorst ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)' }}>
                                    {row.fmt(val)}
                                  </span>
                                  {isBest && <div className="w-1 h-1 rounded-full mx-auto mt-0.5" style={{ backgroundColor:row.color }} />}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Per-league top scorers ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leagueData.map((l, i) => {
                  const topInLeague = allPlayers
                    .filter(p => p.league === l.league && (p.goals||0) > 0)
                    .sort((a,b) => (b.goals||0)-(a.goals||0))
                    .slice(0, 5);
                  return (
                    <div key={i} className="rounded-2xl border overflow-hidden" style={{ borderColor:l.color+'20', background:'rgba(8,14,26,0.9)' }}>
                      <div className="px-4 py-3 border-b flex items-center gap-2.5"
                        style={{ borderColor: l.color+'15', background:`${l.color}06` }}>
                        <img src={LEAGUE_FLAG_IMG[l.league]} alt="" className="w-5 h-5 object-contain" />
                        <span className="text-white font-black text-base">{l.league}</span>
                        <span className="ml-auto text-[15px] font-bold" style={{ color:l.color }}>Top Scorers</span>
                      </div>
                      <div className="divide-y divide-white/[0.025]">
                        {topInLeague.map((p, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/[0.02] transition-all group">
                            <span className="w-5 text-center text-base font-black flex-shrink-0"
                              style={{ fontFamily:'JetBrains Mono', color: idx===0 ? l.color : 'rgba(255,255,255,0.25)' }}>{idx+1}</span>
                            {p.photo ? (
                              <img src={p.photo} alt="" className="w-8 h-8 rounded-lg object-cover bg-white/5 flex-shrink-0" onError={e=>e.target.style.display='none'} />
                            ) : (
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:`${l.color}12` }}>
                                <span className="text-base font-black" style={{ color:l.color }}>{(p.name||'?')[0]}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-base text-white font-bold truncate leading-tight">{p.name}</p>
                              <p className="text-[15px] text-slate-400 truncate leading-tight">{p.team}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-black text-base" style={{ fontFamily:'JetBrains Mono', color:l.color }}>{p.goals}</span>
                              <button
                                onClick={() => { setSelectedPlayers(prev => { if(prev.find(x=>x.id===p.id||x.name===p.name)) return prev; if(prev.length>=3) return [...prev.slice(1),p]; return [...prev,p]; }); setActiveTab('comparison'); }}
                                className="p-1.5 rounded-lg border border-white/12 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all opacity-0 group-hover:opacity-100">
                                <SendIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {topInLeague.length === 0 && <div className="py-5 text-center text-slate-300 text-base">No data</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default AnalyticsPage;