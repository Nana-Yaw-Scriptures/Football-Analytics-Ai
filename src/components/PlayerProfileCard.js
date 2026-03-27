javascript
import React, { useState, useEffect, useRef, useMemo } from 'react';

/* ───────────────── ICON BASE ───────────────── */
const I = ({ d, className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const XIcon = (p) => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;

/* ───────────────── POSITION CONFIG ───────────────── */
const POS_CONFIG = {
  Forward:    { color: '#ef4444' },
  Midfielder: { color: '#60a5fa' },
  Defender:   { color: '#34d399' },
  Goalkeeper: { color: '#fbbf24' },
};

/* ───────────────── STAT ROW (FIXED) ───────────────── */
const StatRow = ({ label, value, color, suffix='' }) => {
  const v = parseFloat(value);
  const display = isNaN(v) ? '—' : `${Math.round(v)}${suffix}`;
  return (
    <div className="flex justify-between py-2 border-b border-white/5">
      <span className="text-slate-400">{label}</span>
      <span style={{ color, fontWeight: 700 }}>{display}</span>
    </div>
  );
};

/* ───────────────── XG INTEL ───────────────── */
const XGIntel = ({ player }) => {
  const goals = +player.goals || 0;
  const xG = +player.xG || 0;
  if (xG < 1) return null;

  const diff = goals - xG;
  if (Math.abs(diff) < 0.3) return null;

  const over = diff > 0;
  const color = over ? '#10b981' : '#ef4444';

  const label =
    over
      ? diff > 2.5 ? 'Clinical Finisher' : 'Above xG'
      : diff < -2.5 ? 'Poor Finishing' : 'Below xG';

  return (
    <div className="p-2 rounded-xl text-xs font-bold mt-2 text-center"
      style={{ background: `${color}15`, color }}>
      {label} ({diff.toFixed(1)})
    </div>
  );
};

/* ───────────────── RADAR CHART ───────────────── */
const RadarChart = ({ player, color }) => {
  const dims = [
    { key: 'goals', max: 30 },
    { key: 'assists', max: 15 },
    { key: 'xG', max: 25 },
    { key: 'shotsTotal', max: 120 },
    { key: 'keyPasses', max: 80 }
  ];

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;

  const points = dims.map((d, i) => {
    const val = Math.min((player[d.key] || 0) / d.max, 1);
    const angle = (Math.PI * 2 * i) / dims.length - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * r * val,
      y: cy + Math.sin(angle) * r * val
    };
  });

  const path = points.map((p,i)=>`${i===0?'M':'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <svg width={size} height={size}>
      <path d={path}
        fill={`${color}20`}
        stroke={color}
        strokeWidth="2"
        style={{ filter:`drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
};

/* ───────────────── PER90 ───────────────── */
const Per90 = ({ player }) => {
  const mins = Math.max(+player.minutes || 1,1);
  const p90 = (k)=>((+player[k]||0)/mins*90).toFixed(2);

  return (
    <div className="mt-4">
      <StatRow label="Goals /90" value={p90('goals')} color="#22d3ee"/>
      <StatRow label="Assists /90" value={p90('assists')} color="#f59e0b"/>
      <StatRow label="Shots /90" value={p90('shotsTotal')} color="#ef4444"/>
      <StatRow label="xG /90" value={p90('xG')} color="#10b981"/>
    </div>
  );
};

/* ───────────────── MAIN ───────────────── */
export default function PlayerProfileCard({ player, onClose }) {
  const ref = useRef(null);
  const [tab,setTab] = useState('overview');

  const pos = player?.position || 'Forward';
  const stats = useMemo(()=>POS_CONFIG[pos]||POS_CONFIG.Forward,[pos]);
  const rating = useMemo(()=>+player?.rating||0,[player]);

  const form = rating>=7.5?'↑':rating>=7?'→':'↓';

  /* ───────── DOWNLOAD FIX ───────── */
  const downloadCard = async () => {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(ref.current,{backgroundColor:'#060a14',scale:2});

    const ctx = canvas.getContext('2d');
    const w=canvas.width,h=canvas.height;

    ctx.save();
    ctx.fillStyle='#fff';
    ctx.globalAlpha=0.08;
    ctx.font=`900 ${Math.round(w*0.07)}px Arial`;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.translate(w/2,h/2);
    ctx.rotate(-Math.PI/10);
    ctx.fillText(`${player.name} • Scorina AI`,0,0);
    ctx.restore();

    const a=document.createElement('a');
    a.download=`${player.name}.png`;
    a.href=canvas.toDataURL();
    a.click();
  };

  if(!player) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
      <div ref={ref}
        className="w-96 p-4 rounded-2xl"
        style={{
          background:'#060a14',
          animation:'profileIn .35s',
          overflowY:'auto',
          overscrollBehavior:'contain'
        }}>

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-white text-xl font-bold">{player.name}</h2>
          <button onClick={onClose}><XIcon/></button>
        </div>

        <div className="text-sm mt-1" style={{color:stats.color}}>
          {pos}
        </div>

        {/* RATING */}
        <div className="mt-2 text-lg font-bold text-white">
          {rating.toFixed(1)} {form}
        </div>

        <XGIntel player={player}/>

        {/* TABS */}
        <div className="flex mt-4 border-b border-white/10">
          {['overview','radar','per90'].map(t=>(
            <button key={t}
              onClick={()=>setTab(t)}
              className="flex-1 py-2 text-sm font-bold"
              style={{color:tab===t?stats.color:'#64748b'}}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {tab==='overview' && (
          <div className="mt-4">
            <StatRow label="Goals" value={player.goals} color="#ef4444"/>
            <StatRow label="xG" value={player.xG} color="#10b981"/>
            <StatRow label="Shots" value={player.shotsTotal} color="#22d3ee"/>
            <StatRow label="Shot Acc" value={player.shotAccuracy} color="#f59e0b" suffix="%"/>
          </div>
        )}

        {tab==='radar' && (
          <div className="flex justify-center mt-4">
            <RadarChart player={player} color={stats.color}/>
          </div>
        )}

        {tab==='per90' && <Per90 player={player}/>}

        {/* DOWNLOAD */}
        <button
          onClick={downloadCard}
          className="mt-5 w-full bg-white text-black py-2 rounded-xl font-bold">
          Download Card
        </button>

        <div className="h-6"/>

      </div>

      {/* ANIMATIONS */}
      <style>{`
        @keyframes profileIn {
          from {opacity:0; transform:translateY(24px) scale(.97)}
          to {opacity:1; transform:translateY(0) scale(1)}
        }
      `}</style>
    </div>
  );
}

