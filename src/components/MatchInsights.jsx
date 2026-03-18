/**
 * MatchInsights.js — v2
 *
 * Bugs fixed:
 * - Emoji momentum labels → SVG icon badges (consistent with app icon system)
 * - teamName?.split(' ')[0] truncated "Manchester United" to "Manchester" → now shows up to 2 words
 * - SVG <path d=...> CSS transition on `d` attribute is not supported in most browsers —
 *   radar animation now uses point-by-point lerp via useState + useEffect timer instead
 * - gradId collision when both home + away DNA rendered simultaneously → now uses unique instance IDs
 * - FormMomentum: date labels were misaligned when fewer than 5 fixtures loaded
 * - TacticalDNA: split xG parsing from key_factors was fragile → fallback chain improved
 *
 * Improvements:
 * - FormMomentum: W/D/L result pills above each node with score
 * - FormMomentum: animated curve draw-on mount
 * - TacticalDNA: "vs" comparison overlay mode — pass both home + away mlData to see overlap
 * - TacticalDNA: badge showing team's tactical archetype ("High Press", "Counter", "Possession" etc)
 * - Consistent card/border tokens matching rest of app (border-white/[0.07], rgba(10,14,26,0.8))
 * - Full team names, not just first word
 */

import React, { useState, useEffect, useRef, useId } from 'react';

// ── SVG icon helper ────────────────────────────────────────────────
const Ic = ({ d, className = 'w-4 h-4', sw = 1.8 }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const TrendUpIcon   = p => <Ic {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const TrendDownIcon = p => <Ic {...p} d={<><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>}/>;
const Minus_Icon    = p => <Ic {...p} d={<line x1="5" y1="12" x2="19" y2="12"/>}/>;
const FlameIcon     = p => <Ic {...p} d={<path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/>}/>;

// ── Utility ────────────────────────────────────────────────────────
const shortName = (name) => {
  if (!name) return '';
  const words = name.replace(/ FC$/, '').replace(/ CF$/, '').replace(/ SC$/, '').split(' ');
  return words.slice(0, 2).join(' ');
};

// ═══════════════════════════════════════════════════════════════════
// FORM MOMENTUM
// ═══════════════════════════════════════════════════════════════════
export const FormMomentum = ({ form, fixtures, teamName, color = '#22d3ee' }) => {
  const [hovered, setHovered]   = useState(null);
  const [drawPct, setDrawPct]   = useState(0);     // 0→1 mount animation
  const uid = useRef(`fm-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let raf; let start = null;
    const dur = 600;
    const run = (ts) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / dur, 1);
      setDrawPct(t < 0.5 ? 2*t*t : -1+(4-2*t)*t); // ease-in-out
      if (t < 1) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, []);

  const points = (() => {
    const src = fixtures?.fixtures?.slice(0, 5).reverse() || [];
    if (src.length >= 3) {
      return src.map(m => ({
        result:   m.result,
        gf:       m.venue === 'Home' ? (m.homeGoals ?? 0) : (m.awayGoals ?? 0),
        ga:       m.venue === 'Home' ? (m.awayGoals ?? 0) : (m.homeGoals ?? 0),
        opponent: m.opponent?.replace(/ FC$/, '').replace(/ CF$/, '') || '?',
        venue:    m.venue,
        date:     m.date,
      }));
    }
    return (form || []).slice(-5).map(r => ({
      result: r, gf: null, ga: null, opponent: null, venue: null, date: null,
    }));
  })();

  if (!points.length) return null;

  const W = 260, H = 80, PAD = 20;
  const n = points.length;

  const yFor = (p) => {
    const base = p.result === 'W' ? 0.15 : p.result === 'D' ? 0.5 : 0.85;
    const gd   = p.gf != null ? Math.max(-2, Math.min(2, p.gf - p.ga)) : 0;
    return Math.max(0.05, Math.min(0.95, base - gd * 0.08));
  };

  const xs = points.map((_, i) => PAD + (i / (n-1||1)) * (W - PAD*2));
  const ys = points.map(p => PAD*0.5 + yFor(p) * (H - PAD));

  // Build cubic bezier path
  const fullPath = xs.reduce((d, x, i) => {
    if (i === 0) return `M ${x} ${ys[i]}`;
    const cpX = (xs[i-1] + x) / 2;
    return d + ` C ${cpX} ${ys[i-1]}, ${cpX} ${ys[i]}, ${x} ${ys[i]}`;
  }, '');
  const areaD = fullPath + ` L ${xs[n-1]} ${H} L ${xs[0]} ${H} Z`;

  const gradId = uid.current + '-g';
  const areaId = uid.current + '-a';
  const clipId = uid.current + '-c';

  const gradStops = points.map((p, i) => ({
    offset: `${(i / (n-1||1)) * 100}%`,
    color:  p.result==='W' ? '#10b981' : p.result==='D' ? '#facc15' : '#ef4444',
  }));

  const last3 = points.slice(-3);
  const pts3  = last3.reduce((s, p) => s + (p.result==='W'?3:p.result==='D'?1:0), 0);
  const momentum = pts3>=7?{label:'Hot',   color:'#10b981', Icon:FlameIcon}
                  :pts3>=5?{label:'Good',  color:'#22d3ee', Icon:TrendUpIcon}
                  :pts3>=3?{label:'Steady',color:'#94a3b8', Icon:Minus_Icon}
                          :{label:'Poor',  color:'#ef4444', Icon:TrendDownIcon};

  // Approximate path length for stroke-dasharray animation
  // We use a clip rect approach instead — simpler and works cross-browser
  const clipW = drawPct * W;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] text-slate-400 font-bold truncate">
          {shortName(teamName)}
        </span>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
          style={{ background:`${momentum.color}12`, border:`1px solid ${momentum.color}30` }}>
          <momentum.Icon className="w-2.5 h-2.5" style={{ color:momentum.color }}/>
          <span className="text-[10px] font-black" style={{ color:momentum.color }}>{momentum.label}</span>
        </div>
      </div>

      {/* Result pills */}
      <div className="flex justify-between px-[18px] mb-1">
        {points.map((p, i) => {
          const c = p.result==='W'?'#10b981':p.result==='D'?'#facc15':'#ef4444';
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black"
                style={{ background:`${c}18`, border:`1px solid ${c}40`, color:c, fontFamily:'JetBrains Mono' }}>
                {p.result}
              </div>
              {p.gf != null && (
                <span className="text-[7px] text-slate-700" style={{ fontFamily:'JetBrains Mono' }}>
                  {p.gf}-{p.ga}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="relative">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              {gradStops.map((s, i) => <stop key={i} offset={s.offset} stopColor={s.color}/>)}
            </linearGradient>
            <linearGradient id={areaId} x1="0" y1="0" x2="1" y2="0">
              {gradStops.map((s, i) => <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity="0.1"/>)}
            </linearGradient>
            {/* Clip rect for draw-on animation */}
            <clipPath id={clipId}>
              <rect x="0" y="0" width={clipW} height={H+10}/>
            </clipPath>
          </defs>

          {/* Baseline */}
          <line x1={PAD} y1={H*0.5+PAD*0.25} x2={W-PAD} y2={H*0.5+PAD*0.25}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 3"/>

          {/* Area (clipped) */}
          <path d={areaD} fill={`url(#${areaId})`} clipPath={`url(#${clipId})`}/>
          {/* Curve (clipped) */}
          <path d={fullPath} fill="none" stroke={`url(#${gradId})`}
            strokeWidth="2" strokeLinecap="round" clipPath={`url(#${clipId})`}/>

          {/* Nodes */}
          {points.map((p, i) => {
            const nc  = p.result==='W'?'#10b981':p.result==='D'?'#facc15':'#ef4444';
            const isH = hovered === i;
            return (
              <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                style={{ cursor:'pointer' }}>
                {isH && <circle cx={xs[i]} cy={ys[i]} r="10" fill={nc} opacity="0.12"/>}
                <circle cx={xs[i]} cy={ys[i]} r={isH?5:3.5}
                  fill="#0a0e1a" stroke={nc} strokeWidth="2"/>
                <circle cx={xs[i]} cy={ys[i]} r={isH?2.5:1.5} fill={nc}/>
              </g>
            );
          })}

          {/* Tooltip */}
          {hovered !== null && (() => {
            const p    = points[hovered];
            const tx   = xs[hovered];
            const ty   = ys[hovered];
            const nc   = p.result==='W'?'#10b981':p.result==='D'?'#facc15':'#ef4444';
            const tipW = p.opponent ? 72 : 40;
            const tipH = p.opponent ? 30 : 18;
            const tipX = Math.max(2, Math.min(W-tipW-2, tx-tipW/2));
            const tipY = ty > H/2 ? ty-tipH-6 : ty+8;
            return (
              <g>
                <rect x={tipX} y={tipY} width={tipW} height={tipH}
                  rx="4" fill="#0c1222" stroke={nc} strokeOpacity="0.5" strokeWidth="0.8"/>
                {p.opponent && (
                  <text x={tipX+tipW/2} y={tipY+9} textAnchor="middle"
                    fill="rgba(255,255,255,0.45)" fontSize="6" fontFamily="Outfit">
                    {p.venue==='Home'?'vs':'@'} {p.opponent.slice(0,12)}
                  </text>
                )}
                <text x={tipX+tipW/2} y={tipY+(p.opponent?22:12)} textAnchor="middle"
                  fill="white" fontSize="8" fontWeight="bold" fontFamily="JetBrains Mono">
                  {p.gf != null ? `${p.gf}–${p.ga}` : p.result}
                </text>
              </g>
            );
          })()}
        </svg>

        {/* Date labels */}
        {points[0]?.date && (
          <div className="flex justify-between mt-0.5" style={{ paddingLeft: PAD-2, paddingRight: PAD-2 }}>
            {points.map((p, i) => (
              <span key={i} className="text-[7px] text-slate-700" style={{ fontFamily:'JetBrains Mono' }}>
                {p.date ? new Date(p.date).toLocaleDateString('en-GB', {day:'numeric',month:'numeric'}) : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// TACTICAL DNA
// ═══════════════════════════════════════════════════════════════════

// Tactical archetype deriver
const deriveArchetype = (metrics) => {
  const { atk, prs, def, dom } = metrics;
  if (prs >= 70 && atk >= 60)      return { label:'High Press',   color:'#f97316' };
  if (atk >= 75 && dom >= 65)      return { label:'Possession',   color:'#22d3ee' };
  if (def >= 70 && dom < 50)       return { label:'Counter',      color:'#a855f7' };
  if (atk >= 65 && prs < 50)       return { label:'Direct Play',  color:'#facc15' };
  if (def >= 65 && prs < 45)       return { label:'Low Block',    color:'#ef4444' };
  return                                    { label:'Balanced',    color:'#10b981' };
};

// Point-by-point animated radar (avoids broken SVG path d-attr transition)
const useAnimatedValues = (targetValues, delay = 200) => {
  const [vals, setVals] = useState(targetValues.map(() => 0));
  const rafRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      let start = null;
      const dur = 800;
      const run = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const eased = p < 0.5 ? 2*p*p : -1+(4-2*p)*p;
        setVals(targetValues.map(v => v * eased));
        if (p < 1) rafRef.current = requestAnimationFrame(run);
      };
      rafRef.current = requestAnimationFrame(run);
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [JSON.stringify(targetValues)]); // eslint-disable-line
  return vals;
};

export const TacticalDNA = ({
  mlData,
  side       = 'home',
  compareMode = false,   // if true, overlay both teams on same radar
}) => {
  const [hovered, setHovered] = useState(null);
  const uid = useRef(`dna-${Math.random().toString(36).slice(2)}`);

  const isHome   = side === 'home';
  const teamName = isHome ? mlData?.home_team_name : mlData?.away_team_name;
  const color    = isHome ? '#22d3ee' : '#a855f7';

  // ── ALL hooks must be called before any early return ──────────
  const targetVals   = [0,0,0,0,0,0]; // placeholder; real values computed below after guard
  const animatedVals = useAnimatedValues(
    (!mlData || !teamName) ? targetVals : (() => {
      const _xg      = isHome ? (mlData.home_expected_goals||0) : (mlData.away_expected_goals||0);
      const _oppXg   = isHome ? (mlData.away_expected_goals||0) : (mlData.home_expected_goals||0);
      const _winProb = isHome ? (mlData.home_win||0.33)         : (mlData.away_win||0.33);
      const _formSeq = isHome ? (mlData.home_form_sequence||[]) : (mlData.away_form_sequence||[]);
      const _formPts = _formSeq.reduce((s,r,i) => s+(r==='W'?3:r==='D'?1:0)*Math.pow(0.85,_formSeq.length-1-i),0);
      const _formMax = _formSeq.reduce((s,_,i) => s+3*Math.pow(0.85,_formSeq.length-1-i),0)||1;
      let _splitXg=_xg, _splitXgA=_oppXg;
      try {
        const kf=mlData.key_factors||[];
        const prefix=isHome?'home xg:':'away xg:';
        const sf=kf.find(f=>f.toLowerCase().includes(prefix));
        if(sf){const nums=sf.match(/[\d.]+/g);if(nums?.length>=2){_splitXg=parseFloat(nums[0])||_xg;_splitXgA=parseFloat(nums[1])||_oppXg;}}
      } catch(_){}
      return [
        Math.min(100,Math.round(_xg*38)),
        Math.min(100,Math.round(Math.max(0,(3.0-_oppXg)/3.0*100))),
        Math.min(100,Math.round((_formPts/_formMax)*100)),
        Math.min(100,Math.round(Math.max(0,(1.8-_splitXgA)/1.8*100))),
        Math.min(100,Math.round(Math.max(20,_splitXg*35))),
        Math.min(100,Math.round(_winProb*130)),
      ];
    })()
  );

  if (!mlData || !teamName) return null;

  const xg      = isHome ? (mlData.home_expected_goals || 0) : (mlData.away_expected_goals || 0);
  const oppXg   = isHome ? (mlData.away_expected_goals || 0) : (mlData.home_expected_goals || 0);
  const winProb = isHome ? (mlData.home_win || 0.33)         : (mlData.away_win || 0.33);
  const formSeq = isHome ? (mlData.home_form_sequence || []) : (mlData.away_form_sequence || []);

  // Weighted form score
  const formPts = formSeq.reduce((s, r, i) => {
    const w = Math.pow(0.85, formSeq.length - 1 - i);
    return s + (r==='W'?3:r==='D'?1:0) * w;
  }, 0);
  const formMax   = formSeq.reduce((s,_,i) => s + 3*Math.pow(0.85,formSeq.length-1-i), 0) || 1;
  const formScore = (formPts / formMax) * 100;

  // xG split from key_factors — with fallback
  let splitXg = xg, splitXgA = oppXg;
  try {
    const kf          = mlData.key_factors || [];
    const prefix      = isHome ? 'home xG:' : 'away xG:';
    const splitFactor = kf.find(f => f.toLowerCase().includes(prefix));
    if (splitFactor) {
      const nums = splitFactor.match(/[\d.]+/g);
      if (nums?.length >= 2) {
        splitXg  = parseFloat(nums[0]) || xg;
        splitXgA = parseFloat(nums[1]) || oppXg;
      }
    }
  } catch (_) {}

  const rawMetrics = {
    atk: Math.min(100, Math.round(xg * 38)),
    prs: Math.min(100, Math.round(Math.max(0, (3.0 - oppXg) / 3.0 * 100))),
    tmp: Math.min(100, Math.round(formScore)),
    def: Math.min(100, Math.round(Math.max(0, (1.8 - splitXgA) / 1.8 * 100))),
    vrt: Math.min(100, Math.round(Math.max(20, splitXg * 35))),
    dom: Math.min(100, Math.round(winProb * 130)),
  };

  const metrics = [
    { label:'Attack',    abbr:'ATK', value:rawMetrics.atk, color:'#ef4444' },
    { label:'Press',     abbr:'PRS', value:rawMetrics.prs, color:'#f97316' },
    { label:'Tempo',     abbr:'TMP', value:rawMetrics.tmp, color:'#facc15' },
    { label:'Defend',    abbr:'DEF', value:rawMetrics.def, color:'#10b981' },
    { label:'Vertical',  abbr:'VRT', value:rawMetrics.vrt, color:'#22d3ee' },
    { label:'Dominance', abbr:'DOM', value:rawMetrics.dom, color:'#a855f7' },
  ];

  // Opponent metrics for compare mode
  const oppTeamName = isHome ? mlData?.away_team_name : mlData?.home_team_name;
  const oppXgRaw    = isHome ? (mlData.away_expected_goals||0) : (mlData.home_expected_goals||0);
  const ownXgRaw    = isHome ? (mlData.home_expected_goals||0) : (mlData.away_expected_goals||0);
  const oppWinProb  = isHome ? (mlData.away_win||0.33) : (mlData.home_win||0.33);
  const oppFormSeq  = isHome ? (mlData.away_form_sequence||[]) : (mlData.home_form_sequence||[]);
  const oppFormPts  = oppFormSeq.reduce((s,r,i) => {
    const w = Math.pow(0.85, oppFormSeq.length-1-i);
    return s + (r==='W'?3:r==='D'?1:0)*w;
  }, 0);
  const oppFormMax  = oppFormSeq.reduce((s,_,i) => s + 3*Math.pow(0.85,oppFormSeq.length-1-i), 0) || 1;
  const oppMetricVals = compareMode ? [
    Math.min(100, Math.round(oppXgRaw*38)),
    Math.min(100, Math.round(Math.max(0,(3.0-ownXgRaw)/3.0*100))),
    Math.min(100, Math.round((oppFormPts/oppFormMax)*100)),
    Math.min(100, Math.round(Math.max(0,(1.8-oppXgRaw)/1.8*100))),
    Math.min(100, Math.round(Math.max(20,oppXgRaw*35))),
    Math.min(100, Math.round(oppWinProb*130)),
  ] : null;

  const archetype    = deriveArchetype(rawMetrics);

  const SIZE=186, CX=93, CY=93, R=62, N=6;
  const gradId    = uid.current + '-g';
  const oppGradId = uid.current + '-og';

  const pt = (i, val) => {
    const angle = (Math.PI*2*i)/N - Math.PI/2;
    const dist  = (val/100) * R;
    return { x: CX+dist*Math.cos(angle), y: CY+dist*Math.sin(angle) };
  };
  const labelPt = (i) => {
    const angle = (Math.PI*2*i)/N - Math.PI/2;
    return { x: CX+(R+20)*Math.cos(angle), y: CY+(R+20)*Math.sin(angle) };
  };

  const dataPath = animatedVals.map((v,i) => { const p=pt(i,v); return `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ')+'Z';
  const oppPath  = oppMetricVals ? oppMetricVals.map((v,i) => { const p=pt(i,v); return `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ')+'Z' : null;

  const oppColor = isHome ? '#a855f7' : '#22d3ee';

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-black uppercase tracking-widest truncate" style={{ color }}>
            {shortName(teamName)}
          </span>
          {/* Archetype badge */}
          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold flex-shrink-0"
            style={{ background:`${archetype.color}12`, border:`1px solid ${archetype.color}30`, color:archetype.color }}>
            {archetype.label}
          </span>
        </div>
        {compareMode && oppTeamName && (
          <span className="text-[9px] text-slate-600 flex-shrink-0">
            vs <span style={{ color:oppColor }}>{shortName(oppTeamName)}</span>
          </span>
        )}
        <span className="text-[8px] text-slate-700 font-mono ml-2 hidden sm:block flex-shrink-0">
          {metrics.map(m => m.value).join('-')}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Radar */}
        <svg width={SIZE} height={SIZE} className="flex-shrink-0 overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.5"/>
              <stop offset="100%" stopColor={color} stopOpacity="0.08"/>
            </linearGradient>
            {compareMode && (
              <linearGradient id={oppGradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"   stopColor={oppColor} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={oppColor} stopOpacity="0.05"/>
              </linearGradient>
            )}
          </defs>

          {/* Grid rings */}
          {[25,50,75,100].map(lv => (
            <polygon key={lv}
              points={metrics.map((_,i) => { const p=pt(i,lv); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ')}
              fill="none"
              stroke={lv===100?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.04)'}
              strokeWidth={lv===100?0.8:0.5}/>
          ))}

          {/* Axis spokes */}
          {metrics.map((_,i) => {
            const p = pt(i,100);
            return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>;
          })}

          {/* Opp polygon */}
          {compareMode && oppPath && (
            <path d={oppPath} fill={`url(#${oppGradId})`} stroke={oppColor} strokeWidth="1" strokeDasharray="3 2" strokeLinejoin="round"/>
          )}

          {/* Main data polygon */}
          <path d={dataPath} fill={`url(#${gradId})`} stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>

          {/* Data nodes */}
          {animatedVals.map((v,i) => {
            const p   = pt(i,v);
            const isH = hovered === i;
            const m   = metrics[i];
            return (
              <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor:'pointer' }}>
                {isH && <circle cx={p.x} cy={p.y} r="8" fill={m.color} opacity="0.15"/>}
                <circle cx={p.x} cy={p.y} r={isH?5:3}
                  fill={isH?m.color:'#0a0e1a'} stroke={m.color} strokeWidth="1.5"/>
              </g>
            );
          })}

          {/* Axis labels */}
          {metrics.map((m,i) => {
            const lp  = labelPt(i);
            const isH = hovered === i;
            return (
              <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
                fill={isH?m.color:'rgba(255,255,255,0.3)'}
                fontSize={isH?'8.5':'7.5'} fontWeight="bold" fontFamily="JetBrains Mono">
                {m.abbr}
              </text>
            );
          })}

          {/* Centre hover value */}
          {hovered !== null && (
            <>
              <text x={CX} y={CY-5} textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize="13" fontWeight="900" fontFamily="JetBrains Mono">
                {metrics[hovered].value}
              </text>
              <text x={CX} y={CY+8} textAnchor="middle" dominantBaseline="middle"
                fill="rgba(255,255,255,0.35)" fontSize="6.5" fontFamily="Outfit">
                {metrics[hovered].label}
              </text>
            </>
          )}
        </svg>

        {/* Metric bars */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {metrics.map((m,i) => (
            <div key={i}
              className="flex items-center gap-1.5 cursor-pointer transition-opacity duration-150"
              style={{ opacity: hovered===null||hovered===i ? 1 : 0.4 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor:m.color }}/>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px] text-slate-500 font-medium">{m.label}</span>
                  <span className="text-[10px] font-black" style={{ color:m.color, fontFamily:'JetBrains Mono' }}>
                    {m.value}
                  </span>
                </div>
                <div className="w-full rounded-full h-1 overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
                  <div className="h-1 rounded-full"
                    style={{
                      width:           `${animatedVals[i]}%`,
                      backgroundColor: m.color,
                      transition:      'none',
                    }}/>
                </div>
              </div>
              {/* Compare delta */}
              {compareMode && oppMetricVals && (() => {
                const delta = m.value - oppMetricVals[i];
                if (Math.abs(delta) < 3) return null;
                return (
                  <span className="text-[8px] font-bold flex-shrink-0"
                    style={{ color: delta>0?'#10b981':'#ef4444', fontFamily:'JetBrains Mono' }}>
                    {delta>0?'+':''}{delta}
                  </span>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Convenience wrapper: side-by-side DNA comparison ───────────────
export const TacticalDNAComparison = ({ mlData }) => {
  if (!mlData) return null;
  return (
    <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background:'rgba(10,14,26,0.8)' }}>
      <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2"
        style={{ background:'rgba(255,255,255,0.015)' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"/>
        <span className="text-white font-black text-[11px] uppercase tracking-widest">Tactical DNA</span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-white/[0.05] p-4 gap-4">
        <TacticalDNA mlData={mlData} side="home" compareMode/>
        <TacticalDNA mlData={mlData} side="away" compareMode/>
      </div>
    </div>
  );
};