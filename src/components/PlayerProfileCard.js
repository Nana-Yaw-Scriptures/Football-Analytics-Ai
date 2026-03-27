import React, { useState, useEffect, useRef } from 'react';
const I = ({ d, className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const XIcon        = (p) => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const TargetIcon   = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const ZapIcon      = (p) => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const TrendingIcon = (p) => <I {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const ShieldIcon   = (p) => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const StarIcon     = (p) => <I {...p} d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>;
const UserIcon     = (p) => <I {...p} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>;
const ClockIcon    = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const BarIcon      = (p) => <I {...p} d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}/>;
const MapPinIcon   = (p) => <I {...p} d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>}/>;
const AwardIcon    = (p) => <I {...p} d={<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>}/>;
const ActivityIcon = (p) => <I {...p} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>;
const AlertIcon    = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}/>;
const CheckCircle  = (p) => <I {...p} d={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}/>;

const POS_CONFIG = {
  Forward:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   short: 'FWD' },
  Attacker:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   short: 'ATT' },
  Midfielder: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)',  short: 'MID' },
  Defender:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  short: 'DEF' },
  Goalkeeper: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  short: 'GK'  },
};

// ── Player Status Badge ───────────────────────────────────────────────
const PlayerStatusBadge = ({ status }) => {
  if (!status) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
        <CheckCircle className="w-3 h-3"/>
        Available
      </span>
    );
  }

  const type   = (status.type   || '').toLowerCase();
  const reason = (status.status || '').toLowerCase();
  const isSusp = type.includes('suspen') || reason.includes('suspen');
  const isDbt  = type.includes('doubt')  || reason.includes('doubt') || status.chance >= 50;
  const chance = status.chance;

  if (isSusp) return (
    <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: '#a855f7' }}>
      <ShieldIcon className="w-3 h-3"/>
      Suspended
    </span>
  );

  if (isDbt) return (
    <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
      <AlertIcon className="w-3 h-3"/>
      Doubtful{chance !== null && chance !== undefined ? ` ${chance}%` : ''}
    </span>
  );

  return (
    <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
      <AlertIcon className="w-3 h-3"/>
      {status.type || 'Injured'}
    </span>
  );
};

const getStatSections = (pos) => {
  const p = (pos || '').toLowerCase();
  if (p.includes('goalkeeper')) return {
    hero: [
      { key: 'appearances', label: 'Apps',   color: '#22d3ee' },
      { key: 'saves',        label: 'Saves',  color: '#10b981' },
      { key: 'rating',       label: 'Rating', color: '#fbbf24', decimal: true },
      { key: 'minutes',      label: 'Mins',   color: '#a855f7' },
    ],
    sections: [
      { title: 'Shot Stopping', icon: ShieldIcon, color: '#10b981', rows: [
        { key: 'saves',          label: 'Total Saves',     color: '#10b981' },
        { key: 'goalsConceded',  label: 'Goals Conceded',  color: '#ef4444' },
        { key: 'penaltiesSaved', label: 'Penalties Saved', color: '#22d3ee' },
        { key: 'savePercent',    label: 'Save %',          color: '#f59e0b', suffix: '%' },
      ]},
      { title: 'Distribution', icon: TrendingIcon, color: '#60a5fa', rows: [
        { key: 'passAccuracy', label: 'Pass Accuracy', color: '#60a5fa', suffix: '%' },
        { key: 'aerialWon',    label: 'Aerials Won',   color: '#a855f7' },
        { key: 'keyPasses',    label: 'Key Passes',    color: '#22d3ee' },
        { key: 'yellowCards',  label: 'Yellow Cards',  color: '#eab308' },
      ]},
    ],
    radar: [
      { key: 'rating',         scale: 10,  label: 'Rating'    },
      { key: 'saves',          scale: 120, label: 'Saves'     },
      { key: 'passAccuracy',   scale: 95,  label: 'Pass%'     },
      { key: 'aerialWon',      scale: 60,  label: 'Aerial'    },
      { key: 'appearances',    scale: 38,  label: 'Apps'      },
      { key: 'penaltiesSaved', scale: 5,   label: 'Pens Saved'},
    ],
  };
  if (p.includes('defender')) return {
    hero: [
      { key: 'appearances',  label: 'Apps',    color: '#22d3ee' },
      { key: 'tacklesTotal', label: 'Tackles', color: '#34d399' },
      { key: 'rating',       label: 'Rating',  color: '#a855f7', decimal: true },
      { key: 'minutes',      label: 'Mins',    color: '#64748b' },
    ],
    sections: [
      { title: 'Defensive', icon: ShieldIcon, color: '#34d399', rows: [
        { key: 'tacklesTotal',  label: 'Tackles',       color: '#34d399' },
        { key: 'interceptions', label: 'Interceptions', color: '#22d3ee' },
        { key: 'aerialWon',     label: 'Aerials Won',   color: '#10b981' },
        { key: 'blocks',        label: 'Blocks',        color: '#60a5fa' },
      ]},
      { title: 'Duels & Distribution', icon: ActivityIcon, color: '#60a5fa', rows: [
        { key: 'duelsWon',    label: 'Duels Won',     color: '#a855f7', duelsFmt: true },
        { key: 'duelWinPct',  label: 'Duel Win %',    color: '#f59e0b', suffix: '%' },
        { key: 'passAccuracy',label: 'Pass Accuracy', color: '#60a5fa', suffix: '%' },
        { key: 'yellowCards', label: 'Yellow Cards',  color: '#eab308' },
      ]},
    ],
    radar: [
      { key: 'rating',        scale: 10,  label: 'Rating'     },
      { key: 'tacklesTotal',  scale: 100, label: 'Tackles'    },
      { key: 'interceptions', scale: 60,  label: 'Intercepts' },
      { key: 'aerialWon',     scale: 120, label: 'Aerial'     },
      { key: 'duelWinPct',    scale: 70,  label: 'Duel%'      },
      { key: 'passAccuracy',  scale: 95,  label: 'Pass%'      },
    ],
  };
  if (p.includes('midfielder')) return {
    hero: [
      { key: 'appearances', label: 'Apps',    color: '#22d3ee' },
      { key: 'assists',      label: 'Assists', color: '#f59e0b' },
      { key: 'rating',       label: 'Rating',  color: '#a855f7', decimal: true },
      { key: 'minutes',      label: 'Mins',    color: '#64748b' },
    ],
    sections: [
      { title: 'Creativity', icon: ZapIcon, color: '#60a5fa', rows: [
        { key: 'keyPasses', label: 'Key Passes', color: '#22d3ee' },
        { key: 'assists',   label: 'Assists',    color: '#f59e0b' },
        { key: 'xA',        label: 'xA',         color: '#f97316', decimal: true },
        { key: 'goals',     label: 'Goals',      color: '#ef4444' },
      ]},
      { title: 'Engine', icon: ActivityIcon, color: '#34d399', rows: [
        { key: 'tacklesTotal',  label: 'Tackles',       color: '#34d399' },
        { key: 'interceptions', label: 'Interceptions', color: '#10b981' },
        { key: 'passAccuracy',  label: 'Pass Accuracy', color: '#60a5fa', suffix: '%' },
        { key: 'duelsWon',      label: 'Duels Won',     color: '#a855f7', duelsFmt: true },
      ]},
    ],
    radar: [
      { key: 'rating',       scale: 10, label: 'Rating'  },
      { key: 'keyPasses',    scale: 80, label: 'Key Pass'},
      { key: 'assists',      scale: 15, label: 'Assists' },
      { key: 'goals',        scale: 15, label: 'Goals'   },
      { key: 'passAccuracy', scale: 95, label: 'Pass%'   },
      { key: 'tacklesTotal', scale: 80, label: 'Tackles' },
    ],
  };
  return {
    hero: [
      { key: 'appearances', label: 'Apps',   color: '#22d3ee' },
      { key: 'goals',        label: 'Goals',  color: '#ef4444' },
      { key: 'rating',       label: 'Rating', color: '#a855f7', decimal: true },
      { key: 'minutes',      label: 'Mins',   color: '#64748b' },
    ],
    sections: [
      { title: 'Attacking', icon: ZapIcon, color: '#ef4444', rows: [
        { key: 'goals',        label: 'Goals',       color: '#22d3ee' },
        { key: 'xG',           label: 'xG',          color: '#10b981', decimal: true },
        { key: 'shotsTotal',   label: 'Total Shots', color: '#f59e0b' },
        { key: 'shotAccuracy', label: 'Shot Conv %', color: '#ef4444', suffix: '%' },
      ]},
      { title: 'Creation', icon: TrendingIcon, color: '#f59e0b', rows: [
        { key: 'assists',          label: 'Assists',   color: '#f59e0b' },
        { key: 'xA',               label: 'xA',        color: '#f97316', decimal: true },
        { key: 'keyPasses',        label: 'Key Passes',color: '#60a5fa' },
        { key: 'dribbleSuccessPct',label: 'Dribble %', color: '#a855f7', suffix: '%' },
      ]},
    ],
    radar: [
      { key: 'rating',           scale: 10, label: 'Rating'   },
      { key: 'goals',            scale: 30, label: 'Goals'    },
      { key: 'xG',               scale: 25, label: 'xG'       },
      { key: 'assists',          scale: 15, label: 'Assists'  },
      { key: 'shotAccuracy',     scale: 40, label: 'Conv%'    },
      { key: 'dribbleSuccessPct',scale: 80, label: 'Dribble%' },
    ],
  };
};

const RadarChart = ({ player, dims, color, size = 220 }) => {
  const [anim, setAnim] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnim(true), 120); return () => clearTimeout(t); }, []);
  const n = dims.length, r = size * 0.33, cx = size / 2, cy = size / 2;
  const pt = (i, v) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const d = anim ? r * Math.min(v, 1) : 0;
    return { x: cx + Math.cos(angle) * d, y: cy + Math.sin(angle) * d };
  };
  const vals = dims.map(d => Math.min((parseFloat(player[d.key]) || 0) / d.scale, 1));
  const path = vals.map((v, i) => { const p = pt(i, v); return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ') + 'Z';
  const grid = (f) => dims.map((_, i) => { const angle = (Math.PI * 2 * i) / n - Math.PI / 2; return `${(cx + Math.cos(angle) * r * f).toFixed(1)},${(cy + Math.sin(angle) * r * f).toFixed(1)}`; }).join(' ');
  const labelR = r * 1.28;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((f, i) => <polygon key={i} points={grid(f)} fill={f === 1 ? `${color}06` : 'none'} stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>)}
      {dims.map((_, i) => { const end = { x: cx + Math.cos((Math.PI * 2 * i) / n - Math.PI / 2) * r, y: cy + Math.sin((Math.PI * 2 * i) / n - Math.PI / 2) * r }; return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.7"/>; })}
      <path d={path} fill={`${color}20`} stroke={color} strokeWidth="2" style={{ transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)' }}/>
      {vals.map((v, i) => { const p = pt(i, v); return <g key={i}><circle cx={p.x} cy={p.y} r="4" fill={color} opacity="0.2" style={{ transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)' }}/><circle cx={p.x} cy={p.y} r="2.5" fill={color} style={{ transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)' }}/></g>; })}
      {dims.map((d, i) => { const angle = (Math.PI * 2 * i) / n - Math.PI / 2; const lx = cx + Math.cos(angle) * labelR; const ly = cy + Math.sin(angle) * labelR; return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.45)" fontSize="9.5" fontWeight="600" fontFamily="Outfit">{d.label}</text>; })}
    </svg>
  );
};

const StatRow = ({ label, value, color, suffix = '', decimal = false, duelsFmt = false, player }) => {
  let display = '—';
  if (duelsFmt && player) {
    const won = parseInt(player.duelsWon) || 0;
    const total = parseInt(player.duelsTotal) || 0;
    display = total > 0 ? `${won}/${total}` : `${won}`;
  } else {
    const v = parseFloat(value);
    if (!isNaN(v) && v > 0) display = `${decimal ? v.toFixed(1) : Math.round(v)}${suffix}`;
  }
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-[13px] text-slate-400">{label}</span>
      <span className="text-[13px] font-black" style={{ fontFamily: 'JetBrains Mono', color }}>{display}</span>
    </div>
  );
};

const XGIntel = ({ player }) => {
  const goals = parseFloat(player.goals) || 0;
  const xG    = parseFloat(player.xG)    || 0;
  if (xG < 1) return null;
  const diff = goals - xG;
  if (Math.abs(diff) < 0.5) return null;
  const over  = diff > 0;
  const color = over ? '#10b981' : '#ef4444';
  const label = over ? (Math.abs(diff) > 3 ? 'Elite Finisher' : 'Overperforming xG') : (Math.abs(diff) > 3 ? 'Wasteful' : 'Underperforming xG');
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
      <TargetIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }}/>
      <span className="text-[11px] font-black" style={{ color }}>{label}</span>
      <span className="text-[11px] font-black ml-auto" style={{ fontFamily: 'JetBrains Mono', color }}>{over ? '+' : ''}{diff.toFixed(1)} vs xG</span>
    </div>
  );
};

const Per90Section = ({ player, posGroup }) => {
  const mins = Math.max(parseInt(player.minutes) || 1, 1);
  const p90  = (key) => ((parseFloat(player[key]) || 0) / mins * 90).toFixed(2);
  const pos  = posGroup.toLowerCase();
  const rows = pos.includes('goalkeeper') ? [
    { label: 'Saves/90',          value: p90('saves'),         color: '#10b981' },
    { label: 'Goals Conceded/90', value: p90('goalsConceded'), color: '#ef4444' },
    { label: 'Passes/90',         value: p90('passesTotal'),   color: '#60a5fa' },
  ] : pos.includes('defender') ? [
    { label: 'Tackles/90',       value: p90('tacklesTotal'),  color: '#34d399' },
    { label: 'Interceptions/90', value: p90('interceptions'), color: '#22d3ee' },
    { label: 'Aerials Won/90',   value: p90('aerialWon'),     color: '#10b981' },
    { label: 'Duels/90',         value: p90('duelsTotal'),    color: '#a855f7' },
  ] : pos.includes('midfielder') ? [
    { label: 'Key Passes/90', value: p90('keyPasses'),   color: '#22d3ee' },
    { label: 'Goals/90',      value: p90('goals'),        color: '#ef4444' },
    { label: 'Assists/90',    value: p90('assists'),      color: '#f59e0b' },
    { label: 'Tackles/90',    value: p90('tacklesTotal'), color: '#34d399' },
  ] : [
    { label: 'Goals/90',   value: p90('goals'),     color: '#22d3ee' },
    { label: 'Assists/90', value: p90('assists'),    color: '#f59e0b' },
    { label: 'Shots/90',   value: p90('shotsTotal'), color: '#ef4444' },
    { label: 'xG/90',      value: p90('xG'),         color: '#10b981' },
  ];
  return (
    <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(10,14,26,0.8)' }}>
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <ActivityIcon className="w-3.5 h-3.5 text-cyan-400"/>
        <span className="text-[11px] font-black text-white uppercase tracking-widest">Per 90 Minutes</span>
      </div>
      <div className="px-4 pb-1">
        {rows.map((r, i) => <StatRow key={i} label={r.label} value={r.value} color={r.color}/>)}
      </div>
    </div>
  );
};

export default function PlayerProfileCard({ player, onClose, injuryStatus }) {
  const [tab, setTab] = useState('overview');
  const cardRef = useRef(null);

const downloadCard = async () => {
  if (!cardRef.current) return;

  // Hide buttons before capture
  const btns = cardRef.current.querySelectorAll('[data-hide-download]');
  btns.forEach(b => b.style.display = 'none');

  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(cardRef.current, {
    backgroundColor: '#060a14',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
  });

  // Restore buttons
  btns.forEach(b => b.style.display = '');

  // Draw watermark directly onto canvas
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Diagonal center watermark
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.font = `900 ${w * 0.11}px Outfit, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Scorina AI', 0, 0);
  ctx.restore();

  // Bottom branding
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = `700 ${w * 0.035}px Outfit, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.letterSpacing = '0.15em';
  ctx.fillText('SCORINA AI', w / 2, h - 16);

  const link = document.createElement('a');
  link.download = `${(player.name || 'player').replace(/ /g, '_')}_Scorina AI.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
  if (!player) return null;

  const pos   = player.position || 'Attacker';
  const posC  = POS_CONFIG[pos] || POS_CONFIG.Attacker;
  const stats = getStatSections(pos);
  const rating = parseFloat(player.rating) || 0;
  const isHot  = (player.goals || 0) >= 8 && rating >= 7.2;

  const ratingFrom = rating >= 7.5 ? '#10b981' : rating >= 7 ? '#22d3ee' : rating >= 6.5 ? '#f59e0b' : '#475569';
  const ratingTo   = rating >= 7.5 ? '#059669' : rating >= 7 ? '#0891b2' : rating >= 6.5 ? '#d97706' : '#374151';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div ref={cardRef} className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"        style={{
          background: 'rgba(6,10,20,0.98)',
          border: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '92vh', overflowY: 'auto',
          scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent',
          animation: 'profileIn 0.35s cubic-bezier(0.16,1,0.3,1)',
        }}>

        {/* ── HERO ── */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(160deg,${posC.color}18 0%,rgba(6,10,20,0.95) 55%)` }}/>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px]" style={{ background: `${posC.color}15` }}/>

          {/* Top bar */}
          <div className="relative flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center justify-center gap-2 flex-wrap flex-1 text-center">
              {player.league && (
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">{player.league}</span>
              )}
              {isHot && (
                <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                  <ZapIcon className="w-3 h-3"/>
                  Hot Form
                </span>
              )}
              {/* ── PLAYER STATUS BADGE ── */}
              <PlayerStatusBadge status={injuryStatus}/>
            </div>
           <div className="flex items-center gap-2" data-hide-download>
              <button onClick={downloadCard}
                className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10 text-slate-400 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.06)' }}
                title="Download card">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10 text-slate-400 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <XIcon className="w-4 h-4"/>
              </button>
            </div>
          </div>

          {/* Player identity */}
          <div className="relative px-5 pb-5">
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                {player.photo
                  ? <img src={player.photo} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 shadow-2xl"
                      style={{ borderColor: `${posC.color}50`, boxShadow: `0 0 30px ${posC.color}30` }}/>
                  : <div className="w-20 h-20 rounded-2xl flex items-center justify-center border-2"
                      style={{ background: posC.bg, borderColor: posC.border }}>
                      <span className="text-3xl font-black" style={{ color: posC.color }}>{(player.name || '?')[0]}</span>
                    </div>}
                {rating > 0 && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg border-2 border-[#060a14]"
                    style={{ background: `linear-gradient(135deg,${ratingFrom},${ratingTo})`, fontFamily: 'JetBrains Mono' }}>
                    {rating.toFixed(1)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-2xl font-black text-white leading-tight mb-1">{player.name}</h2>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {player.teamLogo && <img src={player.teamLogo} alt="" className="w-5 h-5 object-contain"/>}
                  <span className="text-base font-bold" style={{ color: posC.color }}>{player.team}</span>
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap flex-1">
                  <span className="text-[12px] font-black px-2.5 py-1 rounded-xl"
                    style={{ color: posC.color, background: posC.bg, border: `1px solid ${posC.border}` }}>{pos}</span>
                  {player.nationality && <span className="text-[12px] text-slate-300 font-semibold">{player.nationality}</span>}
                  {player.age > 0 && <span className="text-[12px] text-slate-500">{player.age}y</span>}
                </div>
                {/* Injury news snippet */}
                {injuryStatus?.news && (
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed line-clamp-2">{injuryStatus.news}</p>
                )}
                {(player.height || player.weight) && (
                  <div className="flex items-center gap-3 mt-2">
                    {player.height && <span className="text-[11px] text-slate-600">{player.height}</span>}
                    {player.weight && <span className="text-[11px] text-slate-600">{player.weight}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hero stat strip */}
          <div className="relative grid grid-cols-4 border-t border-white/[0.06]" style={{ background: 'rgba(0,0,0,0.3)' }}>
            {stats.hero.map((s, i) => {
              const v = parseFloat(player[s.key]);
              const display = s.decimal ? (isNaN(v) ? '—' : v.toFixed(1)) : (isNaN(v) || v === 0 ? '—' : Math.round(v).toLocaleString());
              return (
                <div key={i} className={`py-3 text-center ${i < 3 ? 'border-r border-white/[0.06]' : ''}`}>
                  <p className="text-xl font-black" style={{ fontFamily: 'JetBrains Mono', color: s.color }}>{display}</p>
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex border-b border-white/[0.07]" style={{ background: 'rgba(0,0,0,0.2)' }}>
          {[
            { id: 'overview', label: 'Overview',  Icon: BarIcon      },
            { id: 'radar',    label: 'Radar',     Icon: TargetIcon   },
            { id: 'per90',    label: 'Per 90',    Icon: ActivityIcon },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="relative flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-bold transition-all"
              style={{ color: tab === t.id ? posC.color : '#475569' }}>
              {tab === t.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full" style={{ background: posC.color }}/>}
              <t.Icon className="w-3.5 h-3.5"/>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="p-4 space-y-3" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {tab === 'overview' && (
            <>
              <XGIntel player={player}/>
              {stats.sections.map((section, si) => (
                <div key={si} className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(10,14,26,0.8)' }}>
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2" style={{ background: `${section.color}07` }}>
                    <section.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: section.color }}/>
                    <span className="text-[11px] font-black text-white uppercase tracking-widest">{section.title}</span>
                  </div>
                  <div className="px-4 pb-1">
                    {section.rows.map((row, ri) => (
                      <StatRow key={ri} label={row.label} value={player[row.key]} color={row.color}
                        suffix={row.suffix||''} decimal={!!row.decimal} duelsFmt={!!row.duelsFmt} player={player}/>
                    ))}
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(10,14,26,0.8)' }}>
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2" style={{ background: 'rgba(234,179,8,0.05)' }}>
                  <AwardIcon className="w-3.5 h-3.5 text-yellow-400"/>
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">Discipline</span>
                </div>
                <div className="px-4 pb-1">
                  <StatRow label="Yellow Cards"   value={player.yellowCards}    color="#eab308"/>
                  <StatRow label="Red Cards"       value={player.redCards}       color="#ef4444"/>
                  <StatRow label="Fouls Drawn"     value={player.foulsDrawn}     color="#22d3ee"/>
                  <StatRow label="Fouls Committed" value={player.foulsCommitted} color="#64748b"/>
                </div>
              </div>
            </>
          )}
          {tab === 'radar' && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(10,14,26,0.8)' }}>
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between" style={{ background: `${posC.color}07` }}>
                  <div className="flex items-center gap-2">
                    <TargetIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: posC.color }}/>
                    <span className="text-[11px] font-black text-white uppercase tracking-widest">Attribute Radar</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                    style={{ color: posC.color, background: posC.bg, border: `1px solid ${posC.border}` }}>{pos}</span>
                </div>
                <div className="flex justify-center py-2">
                  <RadarChart player={player} dims={stats.radar} color={posC.color} size={240}/>
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(10,14,26,0.8)' }}>
                <div className="px-4 py-3 border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">Attribute Breakdown</span>
                </div>
                <div className="p-4 space-y-3">
                  {stats.radar.map((dim, i) => {
                    const v     = Math.min((parseFloat(player[dim.key]) || 0) / dim.scale, 1);
                    const pct   = Math.round(v * 100);
                    const grade = pct >= 80 ? 'Elite' : pct >= 65 ? 'Good' : pct >= 45 ? 'Average' : 'Low';
                    const gc    = pct >= 80 ? '#10b981' : pct >= 65 ? '#22d3ee' : pct >= 45 ? '#f59e0b' : '#64748b';
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] text-slate-300 font-semibold">{dim.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md"
                              style={{ color: gc, background: `${gc}15`, border: `1px solid ${gc}25` }}>{grade}</span>
                            <span className="text-[12px] font-black" style={{ fontFamily: 'JetBrains Mono', color: gc }}>
                              {(parseFloat(player[dim.key]) || 0).toFixed(['rating','xG','xA','duelWinPct','shotAccuracy','dribbleSuccessPct'].includes(dim.key) ? 1 : 0)}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg,${gc}70,${gc})` }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {tab === 'per90' && <Per90Section player={player} posGroup={pos}/>}
        </div>
        <div className="h-4"/>
      </div>

      <style>{`
        @keyframes profileIn { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fadeIn    { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}