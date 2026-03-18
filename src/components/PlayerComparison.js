/**
 * PlayerComparison.js — Scripta Premium Rebuild
 * Position-aware dual radar · smart verdict engine · glassmorphism UI
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/* ══════════════════════════════════════
   ICONS
══════════════════════════════════════ */
const I = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const SearchIcon  = p => <I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const XIcon       = p => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const ZapIcon     = p => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const TrendingIcon= p => <I {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const ShieldIcon  = p => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const TargetIcon  = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const AwardIcon   = p => <I {...p} d={<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>}/>;
const AlertIcon   = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}/>;
const CheckIcon   = p => <I {...p} d={<polyline points="20 6 9 17 4 12"/>}/>;
const ClockIcon   = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const GlobeIcon   = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}/>;
const BarChartIcon= p => <I {...p} d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}/>;
const SwordsIcon  = p => <I {...p} d={<><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19.5 6.5L8 18v3H5L16.5 9.5"/></>}/>;

/* ══════════════════════════════════════
   POSITION CONFIG
══════════════════════════════════════ */
const POS_CONFIG = {
  Forward:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   short: 'FWD' },
  Attacker:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   short: 'ATT' },
  Midfielder: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)',  short: 'MID' },
  Defender:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  short: 'DEF' },
  Goalkeeper: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  short: 'GK'  },
};

/* ══════════════════════════════════════
   POSITION-AWARE RADAR DIMS
══════════════════════════════════════ */
const getRadarDims = (pos) => {
  const p = (pos || '').toLowerCase();
  if (p.includes('goalkeeper')) return [
    { key: 'rating',        scale: 10,  label: 'Rating'     },
    { key: 'saves',         scale: 120, label: 'Saves'      },
    { key: 'passAccuracy',  scale: 95,  label: 'Pass%'      },
    { key: 'aerialWon',     scale: 60,  label: 'Aerial'     },
    { key: 'appearances',   scale: 38,  label: 'Apps'       },
    { key: 'penaltiesSaved',scale: 5,   label: 'Pens Saved' },
  ];
  if (p.includes('defender')) return [
    { key: 'rating',        scale: 10,  label: 'Rating'     },
    { key: 'tacklesTotal',  scale: 100, label: 'Tackles'    },
    { key: 'interceptions', scale: 60,  label: 'Intercepts' },
    { key: 'aerialWon',     scale: 120, label: 'Aerial'     },
    { key: 'duelWinPct',    scale: 70,  label: 'Duel%'      },
    { key: 'passAccuracy',  scale: 95,  label: 'Pass%'      },
  ];
  if (p.includes('midfielder')) return [
    { key: 'rating',        scale: 10,  label: 'Rating'     },
    { key: 'keyPasses',     scale: 80,  label: 'Key Pass'   },
    { key: 'assists',       scale: 15,  label: 'Assists'    },
    { key: 'goals',         scale: 15,  label: 'Goals'      },
    { key: 'passAccuracy',  scale: 95,  label: 'Pass%'      },
    { key: 'tacklesTotal',  scale: 80,  label: 'Tackles'    },
  ];
  // Attacker / Forward / default
  return [
    { key: 'rating',           scale: 10, label: 'Rating'    },
    { key: 'goals',            scale: 30, label: 'Goals'     },
    { key: 'xG',               scale: 25, label: 'xG'        },
    { key: 'assists',          scale: 15, label: 'Assists'   },
    { key: 'shotAccuracy',     scale: 40, label: 'Conv%'     },
    { key: 'dribbleSuccessPct',scale: 80, label: 'Dribble%'  },
  ];
};

/* ══════════════════════════════════════
   DUAL RADAR — position-aware, animated
══════════════════════════════════════ */
const DualRadar = ({ p1, p2, size = 260 }) => {
  const [anim, setAnim] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnim(true), 150); return () => clearTimeout(t); }, [p1?.id, p2?.id]);

  // Use the position of whichever player has more specific data
  const pos1 = p1?.position || 'Attacker';
  const pos2 = p2?.position || 'Attacker';
  const dims = getRadarDims(pos1.includes('Goalkeeper') || pos2.includes('Goalkeeper')
    ? 'Goalkeeper'
    : pos1.includes('Defender') && pos2.includes('Defender')
    ? 'Defender'
    : pos1.includes('Midfielder') && pos2.includes('Midfielder')
    ? 'Midfielder'
    : pos1);

  const n = dims.length, r = size * 0.33, cx = size / 2, cy = size / 2;
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const d = anim ? r * Math.min(v, 1) : 0;
    return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d };
  };
  const vals1 = dims.map(d => Math.min((parseFloat(p1?.[d.key]) || 0) / d.scale, 1));
  const vals2 = dims.map(d => Math.min((parseFloat(p2?.[d.key]) || 0) / d.scale, 1));
  const path1 = vals1.map((v, i) => { const p = pt(i, v); return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ') + 'Z';
  const path2 = vals2.map((v, i) => { const p = pt(i, v); return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ') + 'Z';
  const grid  = f => dims.map((_, i) => { const a = (Math.PI*2*i)/n-Math.PI/2; return `${(cx+Math.cos(a)*r*f).toFixed(1)},${(cy+Math.sin(a)*r*f).toFixed(1)}`; }).join(' ');
  const labelR = r * 1.3;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {[0.25,0.5,0.75,1].map((f,i) => (
        <polygon key={i} points={grid(f)} fill={f===1?'rgba(255,255,255,0.02)':'none'} stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>
      ))}
      {dims.map((_,i) => {
        const a = (Math.PI*2*i)/n-Math.PI/2;
        return <line key={i} x1={cx} y1={cy} x2={cx+Math.cos(a)*r} y2={cy+Math.sin(a)*r} stroke="rgba(255,255,255,0.05)" strokeWidth="0.7"/>;
      })}

      {/* Player 2 (behind) */}
      <path d={path2} fill="rgba(168,85,247,0.12)" stroke="#a855f7" strokeWidth="2"
        style={{transition:'all 0.9s cubic-bezier(0.16,1,0.3,1)'}}/>
      {/* Player 1 (front) */}
      <path d={path1} fill="rgba(34,211,238,0.12)" stroke="#22d3ee" strokeWidth="2"
        style={{transition:'all 0.9s cubic-bezier(0.16,1,0.3,1)'}}/>

      {/* Dots P1 */}
      {vals1.map((v,i) => { const p = pt(i,v); return (
        <circle key={`d1${i}`} cx={p.x} cy={p.y} r="3.5" fill="#22d3ee" stroke="rgba(5,8,16,0.8)" strokeWidth="1.2"
          style={{transition:'all 0.9s cubic-bezier(0.16,1,0.3,1)'}}/>
      );})}
      {/* Dots P2 */}
      {vals2.map((v,i) => { const p = pt(i,v); return (
        <circle key={`d2${i}`} cx={p.x} cy={p.y} r="3" fill="#a855f7" stroke="rgba(5,8,16,0.8)" strokeWidth="1.2"
          style={{transition:'all 0.9s cubic-bezier(0.16,1,0.3,1)'}}/>
      );})}

      {/* Labels */}
      {dims.map((d,i) => {
        const a = (Math.PI*2*i)/n-Math.PI/2;
        const lx = cx+Math.cos(a)*labelR, ly = cy+Math.sin(a)*labelR;
        const v1 = vals1[i], v2 = vals2[i];
        const leader = v1 > v2 ? '#22d3ee' : v2 > v1 ? '#a855f7' : 'rgba(255,255,255,0.4)';
        return (
          <g key={`lbl${i}`}>
            <text x={lx} y={ly-4} textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.5)" fontSize="9" fontWeight="600" fontFamily="Outfit">{d.label}</text>
            <text x={lx} y={ly+5} textAnchor="middle" dominantBaseline="middle"
              fill={leader} fontSize="7.5" fontFamily="monospace" fontWeight="700">
              {(parseFloat(p1?.[d.key])||0).toFixed(d.key==='rating'||d.key==='xG'||d.key==='duelWinPct'||d.key==='shotAccuracy'||d.key==='dribbleSuccessPct'?1:0)}·{(parseFloat(p2?.[d.key])||0).toFixed(d.key==='rating'||d.key==='xG'||d.key==='duelWinPct'||d.key==='shotAccuracy'||d.key==='dribbleSuccessPct'?1:0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ══════════════════════════════════════
   STAT BAR — dual sided
══════════════════════════════════════ */
const StatBar = ({ label, v1, v2, max, suffix = '', decimal = false, color1 = '#22d3ee', color2 = '#a855f7' }) => {
  const fmt   = v => decimal ? (parseFloat(v)||0).toFixed(1) : Math.round(parseFloat(v)||0);
  const w1    = Math.min(((parseFloat(v1)||0) / (max || 1)) * 100, 100);
  const w2    = Math.min(((parseFloat(v2)||0) / (max || 1)) * 100, 100);
  const aW    = (parseFloat(v1)||0) > (parseFloat(v2)||0);
  const bW    = (parseFloat(v2)||0) > (parseFloat(v1)||0);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-black ${aW ? '' : 'text-slate-600'}`}
          style={{ fontFamily: 'JetBrains Mono', color: aW ? color1 : undefined }}>{fmt(v1)}{suffix}</span>
        <span className="text-[11px] text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`text-sm font-black ${bW ? '' : 'text-slate-600'}`}
          style={{ fontFamily: 'JetBrains Mono', color: bW ? color2 : undefined }}>{fmt(v2)}{suffix}</span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 rounded-full overflow-hidden flex justify-end" style={{background:'rgba(255,255,255,0.05)'}}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${w1}%`, background: aW ? ('linear-gradient(90deg,' + color1 + '60,' + color1 + ')') : 'rgba(100,116,139,0.25)' }}/>
        </div>
        <div className="flex-1 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${w2}%`, background: bW ? ('linear-gradient(90deg,' + color2 + ',' + color2 + '60)') : 'rgba(100,116,139,0.25)' }}/>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   PLAYER SEARCH INPUT
══════════════════════════════════════ */
const PlayerSearch = React.memo(({ value, onChange, num, accentColor, onSelect, onClear }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [show,        setShow]        = useState(false);
  const timerRef = useRef(null);
  const wrapRef  = useRef(null);

  useEffect(() => {
    if (value.length < 2) { setSuggestions([]); setShow(false); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`${API_BASE}/players/search?q=${encodeURIComponent(value)}&limit=7`);
        if (r.ok) { const d = await r.json(); setSuggestions(d); setShow(d.length > 0); }
      } catch { setSuggestions([]); }
    }, 200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value]);

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShow(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={wrapRef} className="relative flex-1">
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all"
        style={{
          background: 'rgba(10,14,26,0.9)',
          borderColor: value ? `${accentColor}35` : 'rgba(255,255,255,0.08)',
          boxShadow: value ? `0 0 0 1px ${accentColor}15` : 'none',
        }}>
        <SearchIcon className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }}/>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShow(true)}
          placeholder={num === 1 ? 'Search player one…' : 'Search player two…'}
          className="flex-1 bg-transparent text-white text-sm placeholder-slate-600 outline-none"
        />
        {value && (
          <button onClick={onClear} className="text-slate-600 hover:text-white transition-colors flex-shrink-0">
            <XIcon className="w-3.5 h-3.5"/>
          </button>
        )}
      </div>

      {show && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl z-50 overflow-hidden"
          style={{ background: 'rgba(8,12,24,0.98)', borderColor: `${accentColor}20`, animation: 'pcSlideDown 0.15s ease-out' }}>
          {suggestions.map((p, i) => (
            <button key={p.id || i}
              onClick={() => { setShow(false); onSelect(p, num); onChange(p.name); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-all text-left border-b border-white/[0.04] last:border-0">
              {p.photo
                ? <img src={p.photo} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0"/>
                : <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accentColor}15` }}>
                    <span className="text-sm font-bold" style={{ color: accentColor }}>{(p.name||'?')[0]}</span>
                  </div>}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{p.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {p.teamLogo && <img src={p.teamLogo} alt="" className="w-3.5 h-3.5 object-contain"/>}
                  <span className="text-xs text-slate-500 truncate">{p.team}</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-xs text-slate-600">{p.position}</span>
                </div>
              </div>
              {p.rating > 0 && (
                <span className="text-xs font-black flex-shrink-0 px-2 py-0.5 rounded-lg"
                  style={{ fontFamily: 'JetBrains Mono', background: `${accentColor}12`, color: accentColor, border: `1px solid ${accentColor}25` }}>
                  {p.rating.toFixed(1)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

/* ══════════════════════════════════════
   VERDICT ENGINE
══════════════════════════════════════ */
const buildVerdict = (p1, p2) => {
  if (!p1 || !p2) return null;
  const n1 = p1.player_name || 'Player 1', n2 = p2.player_name || 'Player 2';
  const s1 = n1.split(' ').pop(),          s2 = n2.split(' ').pop();

  const cats = {
    attacking: [
      { key:'goals',          weight:3 }, { key:'goalsPerNinety',  weight:2 },
      { key:'xG',             weight:2 }, { key:'shotsTotal',       weight:1 },
      { key:'shotAccuracy',   weight:1 },
    ],
    creative: [
      { key:'assists',           weight:3 }, { key:'keyPasses',         weight:2 },
      { key:'xA',                weight:2 }, { key:'passAccuracy',       weight:1 },
      { key:'dribbleSuccessPct', weight:1 },
    ],
    defensive: [
      { key:'tacklesTotal',  weight:2 }, { key:'interceptions', weight:2 },
      { key:'duelWinPct',    weight:2 }, { key:'aerialWon',      weight:1 },
    ],
    overall: [
      { key:'overall_rating', weight:3 }, { key:'appearances', weight:1 },
    ],
  };

  const catScores = {};
  let total1 = 0, total2 = 0;
  Object.entries(cats).forEach(([cat, metrics]) => {
    let w1 = 0, w2 = 0;
    metrics.forEach(({ key, weight }) => {
      const v1 = parseFloat(p1[key])||0, v2 = parseFloat(p2[key])||0;
      if (v1 > v2) w1 += weight; else if (v2 > v1) w2 += weight;
    });
    catScores[cat] = { w1, w2 };
    total1 += w1; total2 += w2;
  });

  // Biggest edge
  const allM = Object.values(cats).flat();
  let bigEdge = null, bigDiff = 0;
  allM.forEach(({ key }) => {
    const v1 = parseFloat(p1[key])||0, v2 = parseFloat(p2[key])||0;
    const mx = Math.max(v1,v2,0.01);
    const diff = Math.abs(v1-v2)/mx;
    if (diff > bigDiff) { bigDiff = diff; bigEdge = { key, w: v1>v2?s1:s2, v1, v2, pct:Math.round(diff*100) }; }
  });

  // Insights
  const xgDiff1 = (parseFloat(p1.goals)||0)-(parseFloat(p1.xG)||0);
  const xgDiff2 = (parseFloat(p2.goals)||0)-(parseFloat(p2.xG)||0);
  const xgInsight = xgDiff1 > 2 ? `${s1} is outperforming xG by +${xgDiff1.toFixed(1)} — clinical finisher.`
    : xgDiff1 < -2 ? `${s1} is underperforming xG by ${xgDiff1.toFixed(1)} — due a goal run.`
    : xgDiff2 > 2  ? `${s2} is outperforming xG by +${xgDiff2.toFixed(1)} — clinical finisher.`
    : xgDiff2 < -2 ? `${s2} is underperforming xG by ${xgDiff2.toFixed(1)} — due a goal run.`
    : null;

  const apps1 = parseFloat(p1.appearances)||0, apps2 = parseFloat(p2.appearances)||0;
  const g901  = parseFloat(p1.goalsPerNinety)||0, g902 = parseFloat(p2.goalsPerNinety)||0;
  const formInsight = apps1>30&&apps2<20 ? `${s1} has played significantly more — ${apps1} vs ${apps2} apps.`
    : apps2>30&&apps1<20 ? `${s2} has played significantly more — ${apps2} vs ${apps1} apps.`
    : g901>g902+0.3 ? `${s1} is more dangerous per 90 (${g901.toFixed(2)} vs ${g902.toFixed(2)}).`
    : g902>g901+0.3 ? `${s2} is more dangerous per 90 (${g902.toFixed(2)} vs ${g901.toFixed(2)}).`
    : null;

  const y1 = parseFloat(p1.yellowCards)||0, y2 = parseFloat(p2.yellowCards)||0;
  const disciplineInsight = y1>=7&&y1>y2+3 ? `${s1} is a disciplinary risk — ${y1} yellows vs ${y2}.`
    : y2>=7&&y2>y1+3 ? `${s2} is a disciplinary risk — ${y2} yellows vs ${y1}.` : null;

  const a1 = parseFloat(p1.age)||0, a2 = parseFloat(p2.age)||0;
  const ageInsight = !a1||!a2 ? null
    : a1<23&&a2>28&&total2>total1 ? `${s1} is ${a1} — these numbers will keep improving.`
    : a2<23&&a1>28&&total1>total2 ? `${s2} is ${a2} — these numbers will keep improving.`
    : a1>32&&total1>total2 ? `${s1} is producing elite numbers at ${a1}.`
    : a2>32&&total2>total1 ? `${s2} is producing elite numbers at ${a2}.` : null;

  const l1 = p1.league||'', l2 = p2.league||'';
  const leagueInsight = l1&&l2&&l1!==l2 ? `${s1} (${l1}) vs ${s2} (${l2}) — league difficulty context applies.` : null;

  const getStyle = p => {
    if ((parseFloat(p.goalsPerNinety)||0)>0.5) return 'Clinical Finisher';
    if ((parseFloat(p.keyPasses)||0)>50) return 'Creative Playmaker';
    if ((parseFloat(p.duelWinPct)||0)>55) return 'Physical Presence';
    if ((parseFloat(p.assistsPerNinety)||0)>0.3) return 'Creative Provider';
    return 'Consistent Performer';
  };

  const winner = total1>total2 ? s1 : total2>total1 ? s2 : null;
  const winnerFull = total1>total2 ? n1 : total2>total1 ? n2 : null;
  const margin = Math.abs(total1-total2);
  const summary = !winner ? `${s1} and ${s2} are evenly matched — context decides.`
    : margin>=6 ? `${winner} is comprehensively better across all key metrics.`
    : margin>=3 ? `${winner} holds a clear advantage.`
    : `${winner} edges it in a close comparison.`;

  return { winner, winnerFull, total1, total2, catScores, bigEdge,
    xgInsight, formInsight, disciplineInsight, ageInsight, leagueInsight,
    style1: getStyle(p1), style2: getStyle(p2), s1, s2, summary, isTie: !winner };
};

/* ══════════════════════════════════════
   PLAYER HERO CARD
══════════════════════════════════════ */
const PlayerHeroCard = ({ player, accentColor, side }) => {
  const posC = POS_CONFIG[player.position] || POS_CONFIG.Midfielder;
  const rating = parseFloat(player.overall_rating || player.rating) || 0;
  const isLeft = side === 1;
  return (
    <div className="flex-1 min-w-0 relative overflow-hidden rounded-2xl border p-4"
      style={{
        background: `linear-gradient(${isLeft?'135':'225'}deg,${accentColor}10,rgba(5,8,16,0.95))`,
        borderColor: `${accentColor}25`,
        boxShadow: `0 0 30px ${accentColor}12`,
      }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{background: isLeft ? `linear-gradient(90deg,${accentColor},transparent)` : `linear-gradient(90deg,transparent,${accentColor})`}}/>

      <div className="flex items-start gap-3">
        {/* Photo */}
        <div className="relative flex-shrink-0">
          {player.photo
            ? <img src={player.photo} alt="" className="w-14 h-14 rounded-xl object-cover border-2"
                style={{ borderColor: `${accentColor}40`, boxShadow: `0 0 20px ${accentColor}25` }}/>
            : <div className="w-14 h-14 rounded-xl flex items-center justify-center border-2"
                style={{ background: posC.bg, borderColor: `${accentColor}40` }}>
                <span className="text-2xl font-black" style={{ color: accentColor }}>{(player.player_name||'?')[0]}</span>
              </div>}
          {rating > 0 && (
            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs border-2"
              style={{
                background: rating>=7.5?'linear-gradient(135deg,#10b981,#059669)':rating>=7?`linear-gradient(135deg,${accentColor},${accentColor}cc)`:'linear-gradient(135deg,#f59e0b,#d97706)',
                borderColor: 'rgba(5,8,16,0.9)',
                fontFamily: 'JetBrains Mono',
              }}>
              {rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm leading-tight truncate">{player.player_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {player.teamLogo && <img src={player.teamLogo} alt="" className="w-3.5 h-3.5 object-contain flex-shrink-0"/>}
            <span className="text-xs text-slate-400 truncate">{player.team}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md"
              style={{ color: posC.color, background: posC.bg, border: `1px solid ${posC.border}` }}>
              {player.position?.slice(0,3).toUpperCase() || 'N/A'}
            </span>
            {player.age > 0 && <span className="text-[10px] text-slate-500">{player.age}y</span>}
            {player.nationality && <span className="text-[10px] text-slate-600">{player.nationality}</span>}
          </div>
        </div>
      </div>

      {/* Key stats strip */}
      <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t" style={{ borderColor: `${accentColor}15` }}>
        {[
          { l:'Goals',   v: parseFloat(player.goals)||0,   c: accentColor },
          { l:'Assists', v: parseFloat(player.assists)||0, c: accentColor },
          { l:'Apps',    v: parseFloat(player.appearances)||0, c: '#64748b' },
        ].map(s => (
          <div key={s.l} className="text-center">
            <p className="text-base font-black leading-tight" style={{ fontFamily:'JetBrains Mono', color:s.c }}>{s.v}</p>
            <p className="text-[9px] text-slate-600 uppercase tracking-wider">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   VERDICT PANEL
══════════════════════════════════════ */
const VerdictPanel = ({ verdict }) => {
  if (!verdict) return null;
  const { total1, total2, catScores, bigEdge, xgInsight, formInsight,
    disciplineInsight, ageInsight, leagueInsight, style1, style2, s1, s2, summary, isTie, winnerFull } = verdict;

  const catMeta = {
    attacking: { label:'Attacking', color:'#ef4444', Icon:ZapIcon    },
    creative:  { label:'Creative',  color:'#22d3ee', Icon:TrendingIcon},
    defensive: { label:'Defensive', color:'#34d399', Icon:ShieldIcon  },
    overall:   { label:'Overall',   color:'#a855f7', Icon:AwardIcon   },
  };

  const insights = [
    xgInsight        && { text: xgInsight,         color:'#10b981', Icon:TargetIcon  },
    formInsight      && { text: formInsight,        color:'#22d3ee', Icon:TrendingIcon},
    disciplineInsight&& { text: disciplineInsight,  color:'#eab308', Icon:AlertIcon   },
    ageInsight       && { text: ageInsight,         color:'#a855f7', Icon:ClockIcon   },
    leagueInsight    && { text: leagueInsight,      color:'#64748b', Icon:GlobeIcon   },
  ].filter(Boolean);

  const winColor = total1>total2 ? '#22d3ee' : total2>total1 ? '#a855f7' : '#f59e0b';
  const edgePct  = Math.round((Math.max(total1,total2)/(total1+total2+0.01))*100);

  return (
    <div className="space-y-3" style={{ animation:'pcFadeIn 0.4s ease-out' }}>

      {/* Winner banner */}
      <div className="rounded-2xl overflow-hidden border" style={{
        background: isTie
          ? 'rgba(10,14,26,0.85)'
          : `linear-gradient(135deg,${winColor}10,rgba(5,8,16,0.95))`,
        borderColor: `${winColor}25`,
        boxShadow: `0 0 30px ${winColor}10`,
      }}>
        <div className="h-0.5" style={{ background: `linear-gradient(90deg,transparent,${winColor},transparent)` }}/>
        <div className="px-5 py-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            {isTie
              ? <SwordsIcon className="w-5 h-5 text-yellow-400"/>
              : <AwardIcon  className="w-5 h-5" style={{ color: winColor }}/>}
            <p className="text-xl font-black" style={{ color: winColor }}>
              {isTie ? 'Even Match' : `${winnerFull} wins`}
            </p>
          </div>
          <p className="text-slate-400 text-sm">{summary}</p>

          {/* Score bar */}
          {!isTie && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm font-black text-cyan-400" style={{ fontFamily:'JetBrains Mono', minWidth:20 }}>{total1}</span>
              <div className="flex-1 flex h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
                <div className="h-full transition-all duration-1000" style={{ width:`${(total1/(total1+total2+0.01))*100}%`, background:'linear-gradient(90deg,#22d3ee60,#22d3ee)' }}/>
                <div className="h-full transition-all duration-1000" style={{ width:`${(total2/(total1+total2+0.01))*100}%`, background:'linear-gradient(90deg,#a855f7,#a855f760)' }}/>
              </div>
              <span className="text-sm font-black text-purple-400" style={{ fontFamily:'JetBrains Mono', minWidth:20, textAlign:'right' }}>{total2}</span>
            </div>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background:'rgba(10,14,26,0.85)' }}>
        <div className="px-4 py-3 border-b border-white/[0.06]" style={{ background:'rgba(255,255,255,0.02)' }}>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Category Breakdown</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-2">
          {Object.entries(catScores).map(([cat, { w1, w2 }]) => {
            const m = catMeta[cat];
            const catW = w1>w2?1:w2>w1?2:0;
            const total = w1+w2+0.01;
            return (
              <div key={cat} className="rounded-xl p-3 border border-white/[0.06]" style={{ background:'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <m.Icon className="w-3 h-3 flex-shrink-0" style={{ color:m.color }}/>
                    <span className="text-[11px] font-black uppercase tracking-wider" style={{ color:m.color }}>{m.label}</span>
                  </div>
                  <span className={`text-[11px] font-black ${catW===1?'text-cyan-400':catW===2?'text-purple-400':'text-slate-600'}`}>
                    {catW===0?'Tied':catW===1?`${s1} ↑`:`${s2} ↑`}
                  </span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
                  <div className="h-full transition-all duration-1000" style={{ width:`${(w1/total)*100}%`, background: catW===1?'#22d3ee':'rgba(34,211,238,0.25)' }}/>
                  <div className="h-full transition-all duration-1000" style={{ width:`${(w2/total)*100}%`, background: catW===2?'#a855f7':'rgba(168,85,247,0.25)' }}/>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-600" style={{ fontFamily:'JetBrains Mono' }}>{w1}</span>
                  <span className="text-[10px] text-slate-600" style={{ fontFamily:'JetBrains Mono' }}>{w2}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Biggest edge */}
      {bigEdge && bigEdge.pct > 15 && (
        <div className="rounded-2xl border border-white/[0.07] overflow-hidden px-4 py-3.5"
          style={{ background:'rgba(10,14,26,0.85)' }}>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Biggest Advantage</p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-white">
              <span style={{ color: bigEdge.w===s1?'#22d3ee':'#a855f7' }}>{bigEdge.w}</span>
              {' '}leads in{' '}
              <span className="font-bold capitalize">{bigEdge.key.replace(/([A-Z])/g,' $1').trim()}</span>
            </p>
            <span className="text-xl font-black" style={{ fontFamily:'JetBrains Mono', color: bigEdge.w===s1?'#22d3ee':'#a855f7' }}>
              +{bigEdge.pct}%
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">{bigEdge.v1} vs {bigEdge.v2}</p>
        </div>
      )}

      {/* Style profiles */}
      <div className="grid grid-cols-2 gap-2">
        {[{s:s1,style:style1,c:'#22d3ee'},{s:s2,style:style2,c:'#a855f7'}].map(({s,style,c},i)=>(
          <div key={i} className="rounded-2xl p-3.5 border text-center"
            style={{ background:`${c}08`, borderColor:`${c}20` }}>
            <p className="text-[10px] text-slate-500 mb-1">{s}</p>
            <p className="text-sm font-black" style={{ color:c }}>{style}</p>
          </div>
        ))}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((ins, i) => (
            <div key={i} className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl border"
              style={{ background:`${ins.color}08`, borderColor:`${ins.color}20` }}>
              <ins.Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color:ins.color }}/>
              <p className="text-sm leading-relaxed" style={{ color:`${ins.color}cc` }}>{ins.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════ */
export default function PlayerComparison() {
  const [q1,      setQ1]      = useState('');
  const [q2,      setQ2]      = useState('');
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [loading1,setLoading1]= useState(false);
  const [loading2,setLoading2]= useState(false);

  const fetchPlayer = async (p, num) => {
    const setLoading = num===1 ? setLoading1 : setLoading2;
    const setPlayer  = num===1 ? setPlayer1  : setPlayer2;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/analyze/player`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ player_name:p.name, league:p.league||'Premier League' }),
      });
      if (r.ok) setPlayer(await r.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const verdict = buildVerdict(player1, player2);
  const bothLoaded = player1 && player2 && !loading1 && !loading2;

  // Position-aware stat sections
  const getStatSections = (p1, p2) => {
    const pos1 = (p1?.position||'').toLowerCase();
    const pos2 = (p2?.position||'').toLowerCase();
    const isGK  = pos1.includes('goalkeeper') || pos2.includes('goalkeeper');
    const isDef = !isGK && (pos1.includes('defender') && pos2.includes('defender'));
    const isMid = !isGK && !isDef && (pos1.includes('midfielder') && pos2.includes('midfielder'));

    if (isGK) return [
      { label:'Rating',       v1:p1?.overall_rating, v2:p2?.overall_rating, max:10, decimal:true },
      { label:'Saves',        v1:p1?.saves,           v2:p2?.saves,          max:120 },
      { label:'Pass Acc%',    v1:p1?.passAccuracy,    v2:p2?.passAccuracy,   max:95, suffix:'%' },
      { label:'Aerials Won',  v1:p1?.aerialWon,       v2:p2?.aerialWon,      max:60 },
      { label:'Appearances',  v1:p1?.appearances,     v2:p2?.appearances,    max:38 },
      { label:'Yellow Cards', v1:p1?.yellowCards,     v2:p2?.yellowCards,    max:10 },
    ];
    if (isDef) return [
      { label:'Rating',        v1:p1?.overall_rating,  v2:p2?.overall_rating,  max:10, decimal:true },
      { label:'Tackles',       v1:p1?.tacklesTotal,    v2:p2?.tacklesTotal,    max:100 },
      { label:'Interceptions', v1:p1?.interceptions,  v2:p2?.interceptions,   max:60 },
      { label:'Aerials Won',   v1:p1?.aerialWon,       v2:p2?.aerialWon,       max:120 },
      { label:'Duel Win%',     v1:p1?.duelWinPct,      v2:p2?.duelWinPct,      max:70, suffix:'%' },
      { label:'Pass Acc%',     v1:p1?.passAccuracy,    v2:p2?.passAccuracy,    max:95, suffix:'%' },
      { label:'Appearances',   v1:p1?.appearances,     v2:p2?.appearances,     max:38 },
      { label:'Yellow Cards',  v1:p1?.yellowCards,     v2:p2?.yellowCards,     max:10 },
    ];
    if (isMid) return [
      { label:'Rating',        v1:p1?.overall_rating,  v2:p2?.overall_rating,  max:10, decimal:true },
      { label:'Key Passes',    v1:p1?.keyPasses,       v2:p2?.keyPasses,       max:80 },
      { label:'Assists',       v1:p1?.assists,         v2:p2?.assists,         max:15 },
      { label:'Goals',         v1:p1?.goals,           v2:p2?.goals,           max:15 },
      { label:'xA',            v1:p1?.xA,              v2:p2?.xA,              max:12, decimal:true },
      { label:'Pass Acc%',     v1:p1?.passAccuracy,    v2:p2?.passAccuracy,    max:95, suffix:'%' },
      { label:'Tackles',       v1:p1?.tacklesTotal,    v2:p2?.tacklesTotal,    max:80 },
      { label:'Appearances',   v1:p1?.appearances,     v2:p2?.appearances,     max:38 },
    ];
    // Attacker / mixed
    return [
      { label:'Rating',     v1:p1?.overall_rating,      v2:p2?.overall_rating,      max:10, decimal:true },
      { label:'Goals',      v1:p1?.goals,               v2:p2?.goals,               max:30 },
      { label:'xG',         v1:p1?.xG,                  v2:p2?.xG,                  max:25, decimal:true },
      { label:'Assists',    v1:p1?.assists,              v2:p2?.assists,             max:15 },
      { label:'xA',         v1:p1?.xA,                  v2:p2?.xA,                  max:12, decimal:true },
      { label:'Shot Conv%', v1:p1?.shotAccuracy,        v2:p2?.shotAccuracy,        max:40, suffix:'%' },
      { label:'Key Passes', v1:p1?.keyPasses,           v2:p2?.keyPasses,           max:80 },
      { label:'Dribble%',   v1:p1?.dribbleSuccessPct,   v2:p2?.dribbleSuccessPct,   max:80, suffix:'%' },
      { label:'Appearances',v1:p1?.appearances,         v2:p2?.appearances,         max:38 },
      { label:'Goals/90',   v1:p1?.goalsPerNinety,      v2:p2?.goalsPerNinety,      max:1.5, decimal:true },
    ];
  };

  return (
    <div className="space-y-4" style={{ fontFamily:"'Outfit',sans-serif" }}>

      {/* ── SEARCH INPUTS ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <PlayerSearch
          value={q1} onChange={setQ1} num={1} accentColor="#22d3ee"
          onSelect={(p,n) => fetchPlayer(p,n)}
          onClear={() => { setQ1(''); setPlayer1(null); }}/>
        <div className="flex items-center justify-center flex-shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center border border-white/[0.1]"
            style={{ background:'rgba(255,255,255,0.04)' }}>
            <SwordsIcon className="w-3.5 h-3.5 text-slate-500"/>
          </div>
        </div>
        <PlayerSearch
          value={q2} onChange={setQ2} num={2} accentColor="#a855f7"
          onSelect={(p,n) => fetchPlayer(p,n)}
          onClear={() => { setQ2(''); setPlayer2(null); }}/>
      </div>

      {/* ── LOADING ── */}
      {(loading1 || loading2) && (
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor:'#22d3ee', borderTopColor:'transparent' }}/>
          <span className="text-slate-400 text-sm">Loading player data…</span>
        </div>
      )}

      {/* ── PLACEHOLDER when only one loaded ── */}
      {!loading1 && !loading2 && (player1 || player2) && !(player1 && player2) && (
        <div className="rounded-2xl border border-white/[0.06] py-8 text-center" style={{ background:'rgba(10,14,26,0.7)' }}>
          <SwordsIcon className="w-8 h-8 text-slate-700 mx-auto mb-2"/>
          <p className="text-slate-500 text-sm">Search {player1 ? 'a second' : 'a first'} player to compare</p>
        </div>
      )}

      {/* ── FULL COMPARISON ── */}
      {bothLoaded && (
        <div className="space-y-4" style={{ animation:'pcFadeIn 0.4s ease-out' }}>

          {/* Player hero cards */}
          <div className="flex gap-3">
            <PlayerHeroCard player={player1} accentColor="#22d3ee" side={1}/>
            <PlayerHeroCard player={player2} accentColor="#a855f7" side={2}/>
          </div>

          {/* Dual radar */}
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background:'rgba(8,12,22,0.9)' }}>
            <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between" style={{ background:'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-2">
                <TargetIcon className="w-4 h-4 text-cyan-400"/>
                <span className="text-white font-black text-sm">Attribute Radar</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"/>
                  <span className="text-[11px] text-slate-400">{player1.player_name?.split(' ').pop()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400"/>
                  <span className="text-[11px] text-slate-400">{player2.player_name?.split(' ').pop()}</span>
                </div>
              </div>
            </div>
            <div className="py-4">
              <DualRadar p1={player1} p2={player2} size={260}/>
            </div>
          </div>

          {/* Stat bars — position aware */}
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background:'rgba(8,12,22,0.9)' }}>
            <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center gap-2" style={{ background:'rgba(255,255,255,0.02)' }}>
              <BarChartIcon className="w-4 h-4 text-cyan-400"/>
              <span className="text-white font-black text-sm">Head-to-Head Stats</span>
              <span className="ml-auto text-[11px] text-slate-600 uppercase tracking-widest">
                {player1.position || 'Player'} context
              </span>
            </div>
            <div className="p-4 space-y-3">
              {getStatSections(player1, player2).map((s,i) => (
                <StatBar key={i} label={s.label} v1={s.v1} v2={s.v2}
                  max={s.max} suffix={s.suffix||''} decimal={!!s.decimal}/>
              ))}
            </div>
          </div>

          {/* Verdict */}
          <VerdictPanel verdict={verdict}/>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!player1 && !player2 && !loading1 && !loading2 && (
        <div className="rounded-2xl border border-white/[0.06] py-10 text-center relative overflow-hidden"
          style={{ background:'rgba(10,14,26,0.7)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-32 h-32 rounded-full blur-[60px] opacity-20" style={{ background:'#22d3ee' }}/>
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-32 h-32 rounded-full blur-[60px] opacity-15" style={{ background:'#a855f7' }}/>
          </div>
          <div className="relative">
            <SwordsIcon className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
            <p className="text-white font-black text-base mb-1">Compare any two players</p>
            <p className="text-slate-500 text-sm mb-5">Position-aware radar · stat battle · verdict engine</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[['Erling Haaland','Mohamed Salah'],['Virgil van Dijk','Rúben Dias'],['Kevin De Bruyne','Pedri']].map(([a,b],i)=>(
                <button key={i}
                  onClick={() => { setQ1(a); setQ2(b); fetchPlayer({name:a,league:'Premier League'},1); fetchPlayer({name:b,league:'La Liga'},2); }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all hover:text-white hover:border-cyan-500/30"
                  style={{ background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.08)', color:'#64748b' }}>
                  {a} <span className="text-slate-700">vs</span> {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pcFadeIn    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pcSlideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}