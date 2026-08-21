import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { useAuth } from '../context/AuthContext';
import { savePrediction as saveToSupabase } from '../services/supabaseService';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { predictMatch, analyzePlayer, checkBackend, getTeams } from '../services/api';
import PlayerComparison from '../components/PlayerComparison';
import NavBar from '../components/NavBar';
import ExportButton from '../components/ExportButton';
import { exportMatchPrediction } from '../utils/exportPDF';
import { FormMomentum, TacticalDNA } from '../components/MatchInsights';
import TacticalSimulation from '../components/TacticalSimulation';
import { exportShareCard } from '../utils/exportPDF';

const I = ({ d, className = "w-5 h-5" }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>);
const SearchIcon = (p) => <I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const TrendingUpIcon = (p) => <I {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const TargetIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const UsersIcon = (p) => <I {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const LoaderIcon = (p) => <I {...p} d={<><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>}/>;
const ZapIcon = (p) => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const CheckIcon = (p) => <I {...p} d={<><polyline points="20 6 9 17 4 12"/></>}/>;
const AlertIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}/>;
const ShieldIcon = (p) => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const ChevronIcon = (p) => <I {...p} d={<polyline points="9 18 15 12 9 6"/>}/>;
const LayersIcon = (p) => <I {...p} d={<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>}/>;
const AwardIcon = (p) => <I {...p} d={<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>}/>;
const BarChartIcon = (p) => <I {...p} d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}/>;
const FlagIcon = (p) => <I {...p} d={<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>}/>;
const CrosshairIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></>}/>;
const BrainIcon = (p) => <I {...p} d={<><path d="M9.5 2A5.5 5.5 0 0 0 5 6a5.5 5.5 0 0 0 .4 2A5.5 5.5 0 0 0 4 13.5a5.5 5.5 0 0 0 3.5 5.1V22h5v-3.4a5.5 5.5 0 0 0 3.5-5.1 5.5 5.5 0 0 0-1.4-5.5A5.5 5.5 0 0 0 15 6a5.5 5.5 0 0 0-5.5-4Z"/><path d="M12 2v20"/></>}/>;
const UserCheckIcon = (p) => <I {...p} d={<><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></>}/>;
const MicIcon = (p) => <I {...p} d={<><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>}/>;
const SaveIcon = (p) => <I {...p} d={<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>}/>;
const TrashIcon = (p) => <I {...p} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>}/>;
const HistoryIcon = (p) => <I {...p} d={<><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></>}/>;
const GlobeIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}/>;
const XIcon = (p) => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const CompareIcon = (p) => <I {...p} d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>}/>;
const ShareIcon = (p) => <I {...p} d={<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>}/>;
const SwordsIcon = (p) => <I {...p} d={<><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19.5 6.5L8 18v3H5L16.5 9.5"/></>}/>;
const MapIcon = (p) => <I {...p} d={<><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>}/>;
const ArrowRightIcon = (p) => <I {...p} d={<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>}/>;
const EyeIcon = (p) => <I {...p} d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}/>;
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000"; //V2
const AppLoader = ({ title = 'Running Analysis', sub = 'ML model + Gemini AI — this takes a few seconds', color = '#22d3ee' }) => (
  <div className="rounded-2xl border border-white/12 text-center py-14" style={{background:'rgba(10,14,26,0.8)'}}>
    <div className="w-20 h-20 mx-auto mb-5 relative">
      <div className="absolute inset-0 rounded-full border-2" style={{borderColor:`${color}20`}}/>
      <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:`${color}80`,borderTopColor:'transparent'}}/>
      <div className="absolute inset-2 rounded-full border-2" style={{borderColor:`${color}15`}}/>
      <div className="absolute inset-2 rounded-full border-2 border-b-transparent animate-spin" style={{borderColor:`${color}50`,borderBottomColor:'transparent',animationDirection:'reverse',animationDuration:'1.5s'}}/>
      <TargetIcon className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{color}}/>
    </div>
    <p className="text-white font-bold text-base mb-1">{title}</p>
    <p className="text-slate-400 text-sm">{sub}</p>
  </div>
);
const LEAGUE_FLAG_IMG = {
  'Premier League':  'https://media.api-sports.io/football/leagues/39.png',
  'La Liga':         'https://media.api-sports.io/football/leagues/140.png',
  'Bundesliga':      'https://media.api-sports.io/football/leagues/78.png',
  'Serie A':         'https://media.api-sports.io/football/leagues/135.png',
  'Ligue 1':         'https://media.api-sports.io/football/leagues/61.png',
  'Primeira Liga':   'https://media.api-sports.io/football/leagues/94.png',
  'Champions League':'https://media.api-sports.io/football/leagues/2.png',
};

/* ═══ SVG Components (UNCHANGED) ═══ */
const DonutChart = ({ homeWin, draw, awayWin, size = 160, homeName = 'Home', awayName = 'Away' }) => {
  const [anim, setAnim] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnim(true), 100); return () => clearTimeout(t); }, []);
  const r = 60, cx = size/2, cy = size/2, circ = 2*Math.PI*r;
  const total = homeWin+draw+awayWin;
  const segs = [{v:homeWin/total,c:'#22d3ee',l:homeName},{v:draw/total,c:'#facc15',l:'Draw'},{v:awayWin/total,c:'#ef4444',l:awayName}];
  let off = 0; const winner = segs.reduce((a,b)=>a.v>b.v?a:b);
  return (<div className="relative" style={{width:size,height:size}}><svg width={size} height={size} className="transform -rotate-90"><circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18"/>{segs.map((s,i)=>{const d=anim?circ*s.v:0;const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.c} strokeWidth="18" strokeDasharray={`${d} ${circ-d}`} strokeDashoffset={-off*circ} strokeLinecap="round" className="transition-all duration-1000 ease-out" style={{transitionDelay:`${i*200}ms`}}/>;off+=s.v;return el;})}</svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-black text-white" style={{fontFamily:'JetBrains Mono'}}>{(winner.v*100).toFixed(0)}%</span><span className="text-base font-medium" style={{color:winner.c}}>{winner.l}</span></div></div>);
};

const ConfidenceGauge = ({ confidence, size = 120 }) => {
  const [anim, setAnim] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnim(true), 300); return () => clearTimeout(t); }, []);
  const pct=confidence*100, r=45, cx=size/2, cy=size/2+10, half=Math.PI*r;
  const dash=anim?half*confidence:0;
  const color=pct>=70?'#10b981':pct>=50?'#facc15':'#ef4444';
  return (<div className="relative" style={{width:size,height:size*0.7}}><svg width={size} height={size*0.7} overflow="visible"><path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round"/><path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${dash} ${half}`} className="transition-all duration-1000 ease-out"/></svg><div className="absolute inset-0 flex flex-col items-center justify-end pb-1"><span className="text-lg font-black text-white" style={{fontFamily:'JetBrains Mono'}}>{pct.toFixed(0)}%</span><span className="text-base text-slate-300">confidence</span></div></div>);
};

const Sparkline = ({ form, width=100, height=30 }) => {
  if (!form?.length) return null;
  const pts=form.map((r,i)=>{const x=(i/(form.length-1||1))*width;const y=r==='W'?5:r==='D'?height/2:height-5;return `${x},${y}`;}).join(' ');
  return (<svg width={width} height={height} className="overflow-visible"><polyline points={pts} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinejoin="round"/>{form.map((r,i)=>{const x=(i/(form.length-1||1))*width;const y=r==='W'?5:r==='D'?height/2:height-5;const c=r==='W'?'#10b981':r==='D'?'#facc15':'#ef4444';return <circle key={i} cx={x} cy={y} r="3" fill={c}/>;})}</svg>);
};

const PitchFormation = ({ formation='4-3-3', color='#22d3ee', width=140, height=180 }) => {
  const rows=formation.split('-').map(Number); rows.unshift(1);
  const pw=width-20,ph=height-20;
  return (<svg width={width} height={height}><rect x="5" y="5" width={pw} height={ph} rx="4" fill="none" stroke="rgb(17, 110, 87)" strokeWidth="1"/><line x1="5" y1={5+ph/2} x2={5+pw} y2={5+ph/2} stroke="rgba(255,255,255,0.05)"/><circle cx={width/2} cy={5+ph/2} r="15" fill="none" stroke="rgba(7, 73, 54, 0.05)"/>{rows.map((count,ri)=>{const y=5+ph-(ri/(rows.length-1||1))*(ph-20)-10;return Array.from({length:count},(_,ci)=>{const x=5+(ci+1)*(pw/(count+1));return(<g key={`${ri}-${ci}`}><circle cx={x} cy={y} r="5" fill={color} opacity="0.8"/><circle cx={x} cy={y} r="7" fill="none" stroke={color} opacity="0.3"/></g>);});})}<text x={width/2} y={height-2} textAnchor="middle" className="fill-slate-500 text-base font-bold">{formation}</text></svg>);
};

const ConfidenceLevelBadge = ({ level }) => {
  if (!level) return null;
  const styles = {
    High:   { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    Medium: { bg: 'bg-yellow-500/15',  border: 'border-yellow-500/30',  text: 'text-yellow-400',  dot: 'bg-yellow-500' },
    Low:    { bg: 'bg-red-500/15',     border: 'border-red-500/30',     text: 'text-red-400',     dot: 'bg-red-500' },
  };
  const s = styles[level] || styles.Medium;
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${s.bg} ${s.border}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>
      <span className={`text-base font-bold uppercase tracking-wider ${s.text}`}>{level} Confidence</span>
    </div>
  );
};

const FormBadge = ({result}) => {
  const c={W:'bg-emerald-500 shadow-emerald-500/30',D:'bg-yellow-500 shadow-yellow-500/30',L:'bg-red-500 shadow-red-500/30'};
  return <span className={`${c[result]} text-white text-base font-black w-7 h-7 rounded-lg flex items-center justify-center shadow-md`}>{result}</span>;
};

/* ═══ Formation data (UNCHANGED) ═══ */
const FORMATION_POSITIONS = {
  '4-3-3':   { def:[[20,20],[20,40],[20,60],[20,80]], mid:[[45,25],[45,50],[45,75]], fwd:[[75,20],[75,50],[75,80]] },
  '4-4-2':   { def:[[20,20],[20,40],[20,60],[20,80]], mid:[[45,15],[45,38],[45,62],[45,85]], fwd:[[72,35],[72,65]] },
  '4-2-3-1': { def:[[20,20],[20,40],[20,60],[20,80]], mid:[[35,35],[35,65],[55,20],[55,50],[55,80]], fwd:[[75,50]] },
  '3-5-2':   { def:[[20,25],[20,50],[20,75]], mid:[[40,8],[40,30],[40,50],[40,70],[40,92]], fwd:[[72,35],[72,65]] },
  '3-4-3':   { def:[[20,25],[20,50],[20,75]], mid:[[42,20],[42,40],[42,60],[42,80]], fwd:[[72,20],[72,50],[72,80]] },
  '4-1-4-1': { def:[[20,20],[20,40],[20,60],[20,80]], mid:[[35,50],[50,15],[50,38],[50,62],[50,85]], fwd:[[75,50]] },
  '5-3-2':   { def:[[20,10],[20,30],[20,50],[20,70],[20,90]], mid:[[45,25],[45,50],[45,75]], fwd:[[72,35],[72,65]] },
  '5-4-1':   { def:[[20,10],[20,30],[20,50],[20,70],[20,90]], mid:[[45,20],[45,40],[45,60],[45,80]], fwd:[[72,50]] },
  '4-3-1-2': { def:[[20,20],[20,40],[20,60],[20,80]], mid:[[38,25],[38,50],[38,75],[55,50]], fwd:[[72,35],[72,65]] },
};
const FORMATIONS_LIST = Object.keys(FORMATION_POSITIONS);
const FORMATION_META = {
  '4-3-3':   { style:'Balanced Attack', strengths:['Width through wingers','Midfield triangle control','Strong pressing from front 3','Natural counter-attack channels'], weaknesses:['Gaps between midfield & defense','Wingers must track back','Lone striker can be isolated'] },
  '4-4-2':   { style:'Classic Compact', strengths:['Compact defensive shape','Two-striker partnership','Wide midfield coverage','Simple & organized'], weaknesses:['Midfield outnumbered (2v3)','No natural #10','Wide players huge workload'] },
  '4-2-3-1': { style:'Creative Control', strengths:['Creative #10 between lines','Double pivot shields defense','Flexible wide attackers'], weaknesses:['Lone striker isolated','#10 must press and create','Transitions can be slow'] },
  '3-5-2':   { style:'Midfield Overload', strengths:['Numerical midfield advantage','Wing-backs provide width','Two strikers centrally'], weaknesses:['Flanks exposed if wing-backs caught','Three CBs vs quick counters','Requires extreme fitness'] },
  '3-4-3':   { style:'Aggressive Width', strengths:['Three forwards overload defense','Wing-backs cover full flanks','Aggressive pressing shape'], weaknesses:['Huge spaces behind wing-backs','Only 4 midfielders','Defensively fragile on flanks'] },
  '4-1-4-1': { style:'Defensive Anchor', strengths:['Single pivot protects backline','Four attacking midfielders','Lone striker drops to link'], weaknesses:['Pivot can be bypassed','Attackers must track back','Gaps if pivot drawn out'] },
  '5-3-2':   { style:'Deep Solidity', strengths:['Five-back defensive wall','Wing-backs pick moments','Two-striker counter threat'], weaknesses:['Very defensive limited width','Wing-backs cover huge ground','Only 3 midfielders'] },
  '5-4-1':   { style:'Ultra Defensive', strengths:['Maximum defensive security','Compact denies space','Absorbs pressure well'], weaknesses:['Lone striker massively isolated','Concedes territory','Counter-attack dependent'] },
  '4-3-1-2': { style:'Diamond Dominance', strengths:['Diamond midfield controls center','Two strikers stretch defense','Strong central overloads'], weaknesses:['No natural width','Fullbacks must provide all width','Trequartista can be man-marked'] },
};
const FORMATION_RATINGS = {
  '4-3-3':   { press: 72, transition: 78, setPiece: 55, defensiveBlock: 60 },
  '4-4-2':   { press: 65, transition: 70, setPiece: 68, defensiveBlock: 75 },
  '4-2-3-1': { press: 68, transition: 62, setPiece: 60, defensiveBlock: 72 },
  '3-5-2':   { press: 60, transition: 82, setPiece: 75, defensiveBlock: 65 },
  '3-4-3':   { press: 78, transition: 75, setPiece: 58, defensiveBlock: 55 },
  '4-1-4-1': { press: 55, transition: 58, setPiece: 60, defensiveBlock: 82 },
  '5-3-2':   { press: 48, transition: 72, setPiece: 82, defensiveBlock: 85 },
  '5-4-1':   { press: 42, transition: 65, setPiece: 80, defensiveBlock: 92 },
  '4-3-1-2': { press: 70, transition: 65, setPiece: 65, defensiveBlock: 68 },
};
const FORMATION_DUELS = {
  '4-3-3_vs_4-4-2':   ['Wingers vs Full-backs', 'CM triangle vs Box midfield', 'Lone striker vs 2 CBs'],
  '4-3-3_vs_5-3-2':   ['Wingers vs Wing-backs', 'CM vs 3-man mid', '3 forwards vs back 5'],
  '4-3-3_vs_4-2-3-1': ['Wingers vs Full-backs', 'CM triangle vs Double pivot', 'Striker vs #10'],
  '4-2-3-1_vs_4-3-3': ['Double pivot vs CM triangle', '#10 in the hole vs DM', 'Striker vs backline'],
  '3-5-2_vs_4-3-3':   ['Wing-backs vs Wingers', '5-man mid vs 3-man mid', '2 strikers vs back 4'],
  '4-4-2_vs_4-3-3':   ['Wide mids vs Wingers', 'Box mid vs CM triangle', '2 strikers vs backline'],
};
const TACTICAL_RECOMMENDATIONS = {
  '4-3-3':   'Switch to 4-2-3-1 if midfield is being overrun — the double pivot adds stability.',
  '4-4-2':   'Shift to 4-3-3 if losing — inject a third midfielder to dominate possession.',
  '4-2-3-1': 'Move to 4-3-3 if the #10 is being man-marked — spread the creative burden.',
  '3-5-2':   'Shift to 4-4-2 if wing-backs are tiring — transition to a flat back four for safety.',
  '3-4-3':   'Drop to 4-4-2 if defensive exposure is being exploited — adds a defensive shield.',
  '4-1-4-1': 'Move to 4-3-3 if the lone striker is too isolated — bring in a second forward.',
  '5-3-2':   'Shift to 3-5-2 if needing a goal — push one CB into midfield to add a runner.',
  '5-4-1':   'Switch to 5-3-2 if chasing the game — add a second striker for more threat.',
  '4-3-1-2': 'Move to 4-2-3-1 if width is being exploited — replace trequartista with wide support.',
};

// ── Role labels per player position in each formation ──
const FORMATION_ROLE_LABELS = {
  '4-3-3':   ['GK','RB','RCB','LCB','LB','RCM','CM','LCM','RW','ST','LW'],
  '4-4-2':   ['GK','RB','RCB','LCB','LB','RM','RCM','LCM','LM','ST','ST'],
  '4-2-3-1': ['GK','RB','RCB','LCB','LB','RDM','LDM','RAM','CAM','LAM','ST'],
  '3-5-2':   ['GK','RCB','CB','LCB','RWB','RCM','CM','LCM','LWB','RST','LST'],
  '3-4-3':   ['GK','RCB','CB','LCB','RWB','RCM','LCM','LWB','RW','ST','LW'],
  '4-1-4-1': ['GK','RB','RCB','LCB','LB','DM','RM','RCM','LCM','LM','ST'],
  '5-3-2':   ['GK','RWB','RCB','CB','LCB','LWB','RCM','CM','LCM','RST','LST'],
  '5-4-1':   ['GK','RWB','RCB','CB','LCB','LWB','RM','RCM','LCM','LM','ST'],
  '4-3-1-2': ['GK','RB','RCB','LCB','LB','RCM','CM','LCM','CAM','RST','LST'],
};

// ── Phase of play ratings ──
const FORMATION_PHASES = {
  '4-3-3':   { inPoss:76, outPoss:68, pressing:78, transition:74, width:82, buildUp:72 },
  '4-4-2':   { inPoss:62, outPoss:80, pressing:65, transition:70, width:72, buildUp:60 },
  '4-2-3-1': { inPoss:80, outPoss:72, pressing:68, transition:62, width:66, buildUp:82 },
  '3-5-2':   { inPoss:70, outPoss:68, pressing:58, transition:84, width:90, buildUp:65 },
  '3-4-3':   { inPoss:74, outPoss:56, pressing:80, transition:76, width:92, buildUp:64 },
  '4-1-4-1': { inPoss:60, outPoss:84, pressing:52, transition:58, width:70, buildUp:62 },
  '5-3-2':   { inPoss:52, outPoss:88, pressing:46, transition:74, width:76, buildUp:54 },
  '5-4-1':   { inPoss:46, outPoss:94, pressing:40, transition:66, width:68, buildUp:48 },
  '4-3-1-2': { inPoss:82, outPoss:64, pressing:72, transition:64, width:52, buildUp:80 },
};

// ── Space created vs conceded per formation ──
const FORMATION_SPACE = {
  '4-3-3':   { creates:['Wide channels via wingers','Midfield triangles','High defensive line pressure'],    concedes:['Half-spaces behind wide CMs','Space behind pressing wingers','Exposed vs overload in CM'] },
  '4-4-2':   { creates:['Compact central block','Two-striker combinations','Wide midfield coverage'],        concedes:['Between the lines (no #10)','Midfield overloads (3v2)','Isolated wide mids'] },
  '4-2-3-1': { creates:['#10 in pockets between lines','Double pivot shields backline','Flexible wide runs'], concedes:['Lone striker too isolated','#10 can be man-marked','Slow to transition'] },
  '3-5-2':   { creates:['Wing-back overlaps dominate flanks','5-man midfield overloads','Two-striker threat'], concedes:['Flanks open if WBs caught high','Three CBs vs pacey counter','Huge physical demand'] },
  '3-4-3':   { creates:['Three-forward overload vs back 4','Width from WBs and wingers','Aggressive high press'], concedes:['Massive spaces behind WBs','Defensive fragility on flanks','Concedes on counter-attack'] },
  '4-1-4-1': { creates:['DM as deep playmaker shield','Four midfielders flood central zones','Striker drops as link'], concedes:['Pivot can be bypassed','Lone striker exposed','Flanks open if DM dragged wide'] },
  '5-3-2':   { creates:['Back five absorbs pressure','WB combination play in pockets','Transition on counter'], concedes:['Limited width in possession','Wing-backs cover too much ground','Only 3 midfielders outnumbered'] },
  '5-4-1':   { creates:['Maximum defensive compactness','Denies all central space','Absorbs high-intensity press'],  concedes:['Striker completely isolated','Concedes territory willingly','Counter-dependent and reactive'] },
  '4-3-1-2': { creates:['Diamond central overload','Two strikers stretch CB pairs','Trequartista between lines'], concedes:['No natural width at all','Fullbacks overloaded providing width','Trequartista can be zoned out'] },
};

// ── Historical advantage data (which formation tends to dominate the matchup) ──
const FORMATION_MATCHUP_EDGE = {
  '4-3-3_vs_4-4-2':   { winner:'4-3-3', reason:'Midfield triangle vs box — the #8 and #10 space hurts the box mid',       margin:'Moderate' },
  '4-3-3_vs_4-2-3-1': { winner:'Even',  reason:'Both control central zones — the #10 vs pivot battle decides it',           margin:'Slight' },
  '4-3-3_vs_3-5-2':   { winner:'3-5-2', reason:'Wing-backs nullify wingers and the 5-man mid suffocates the CM triangle',   margin:'Moderate' },
  '4-2-3-1_vs_4-3-3': { winner:'Even',  reason:'Double pivot stability vs wide freedom — depends on pressing intensity',    margin:'Slight' },
  '4-2-3-1_vs_4-4-2': { winner:'4-2-3-1', reason:'#10 exploits the space between midfield and defense of the flat 4-4-2',  margin:'Moderate' },
  '3-5-2_vs_4-3-3':   { winner:'3-5-2', reason:'Wing-back overloads neutralise wingers; midfield numerical advantage',      margin:'Clear' },
  '3-4-3_vs_4-4-2':   { winner:'3-4-3', reason:'Three forwards overload the back four; high press disrupts flat 4-4-2',   margin:'Moderate' },
  '4-4-2_vs_4-3-3':   { winner:'4-3-3', reason:'The CM triangle is one more than the CM box and creates more pockets',     margin:'Slight' },
  '5-4-1_vs_4-3-3':   { winner:'4-3-3', reason:'5-4-1 concedes territory; 4-3-3 high press exposes 5-4-1 build-up',       margin:'Clear' },
};

// ── In-game scenario plans ──────────────────────────────────────────────────────
const SCENARIO_DATA = {
  neutral: {
    label:'Kick-off', sub:'Starting XI shape', color:'#22d3ee',
    plans: {
      '4-3-3':   ['Press from minute one — establish territorial dominance','Wingers pin back their fullbacks before they find rhythm','CM triangle rotates to win the midfield battle','Striker leads press to force long balls and errors'],
      '4-4-2':   ['Set compact mid-block from the first whistle','Win second balls with your two-striker press-and-flick','Wide mids force play inside where you are strongest','Be patient — absorb their pressure then hit on the counter'],
      '4-2-3-1': ['Double pivot screens — let your #10 roam freely early','Use width to stretch their block before going central','Build from GK with pivot involvement to draw them out','Look for #10 between their lines in the first 20 minutes'],
      '3-5-2':   ['Wing-backs push immediately to pin their fullbacks high','Three CBs circulate to draw out their press','5-man midfield controls every second ball centrally','Two strikers combine to occupy both CBs — never let them rest'],
      '3-4-3':   ['Three forwards press their back line from kick-off','Wing-backs provide instant width to stretch the shape','CMs link play centrally between the lines','Exploit wide spaces before they can recover defensively'],
      '4-1-4-1': ['DM anchors deep — let 4 midfielders go box-to-box','Wide midfielders press their fullbacks high early','Striker drops as a link to pull CBs out of position','Control tempo with your 4-mid wall across the pitch'],
      '5-3-2':   ['Wing-backs push early for width in build-up','Three CMs win the central battle immediately','Two strikers work as a pressing unit from the front','Absorb then exploit — your shape is built for counter-attacks'],
      '5-4-1':   ['Sit deep and absorb — let them come to you','Hit fast on turnover with your most direct ball','Wide midfielders track their fullbacks everywhere','Stay organised — your compactness is your greatest weapon'],
      '4-3-1-2': ['Diamond controls the centre immediately','Two strikers stretch their CB pairing wide apart','Trequartista finds pockets between their lines','Fullbacks provide the only width — they must push hard'],
      default:   ['Establish your shape in the first 15 minutes','Win the midfield battle to control tempo','Test their line with early aggressive runs','Force them to play in areas where you are strongest'],
    },
    avoid: { default:['Giving a fast start with a sloppy early turnover','Overcommitting forward before shape is properly set'] },
  },
  winning: {
    label:'Winning 1-0', sub:'Protect the lead', color:'#10b981',
    plans: {
      '4-3-3':   ['Drop one CM into DM — protect the lead with a double pivot','Keep one winger tracking back as a de facto second fullback','Play keep-ball from the back — waste time with purpose','Stay off your heels — do not drop too deep and invite pressure'],
      '4-4-2':   ['Tighten the defensive block — concede possession willingly','Quick vertical balls on the counter to relieve pressure','Hold shape — do not chase a second goal and open up, GK takes 10 full seconds on every goal kick from now on'],
      '4-2-3-1': ['Double pivot sits deep — protect the backline at all costs','Wide attackers become a second line of defense permanently','Win fouls in the final third to kill time effectively','Striker presses alone — never commit more than one man high'],
      default:   ['Protect the lead with shape and collective discipline','Use ball possession to run down the clock methodically','Force fouls in safe positions — away from danger areas','Maintain defensive compactness — no individual heroics'],
    },
    avoid: { default:['Leaving both attackers forward — opens you to fast counters','High-risk passes near your own box under any pressure'] },
  },
  drawing: {
    label:'Draw · 65 mins, sub: Push for the winner', color:'#f59e0b',
    plans: {
      '4-3-3':   ['Push fullbacks higher to create 3v2 overloads on both wings','CM breaks late into the box to exploit space behind their line','Shift to 4-2-3-1 if they sit in a deep stubborn block','Introduce a second striker at 70 mins if creating nothing'],
      '4-4-2':   ['Push wide mids higher — become a de facto 4-2-4 in attack','Second striker drops to play as a #10 link player','Introduce a pacey winger for a tired wide mid now','Force more crosses — exhaust their CB pairing in the box'],
      '4-2-3-1': ['#10 must be on the ball every 30 seconds — no hiding','Push one DM into an 8 role — become more aggressive centrally','Wide attackers pin fullbacks to open the central highway','Introduce fresh legs in wide areas before 70 minutes'],
      default:   ['Push tempo — force the issue before 75 minutes are gone','Consider a tactical substitution to shift your shape','Exploit any tired defenders with late aggressive runs','Get set pieces in dangerous areas — this is your best weapon'],
    },
    avoid: { default:['Overcrowding the box and losing all attacking width','Frustration leading to poor decisions and yellow cards'] },
  },
  losing: {
    label:'Losing 0-1 · 70 mins, sub: Chase the game', color:'#ef4444',
    plans: {
      '4-3-3':   ['Switch to 3-4-3 — add winger as third CB cover immediately','Both fullbacks become attack-minded wing-backs fully','All three forwards press to force errors in their backline','GK joins build-up — 11 vs 10 territory in possession'],
      '4-4-2':   ['Push to 4-3-3 — wide mids become forwards right now','One striker becomes a #10 to create central overloads','Introduce your most creative player without hesitation','Accept the counter-attack risk entirely — you must score'],
      '4-2-3-1': ['Remove one DM — become aggressive 4-1-4-1 shape','#10 + two wide attackers = potent three-front threat','Full-backs bomb forward constantly on every attack','Accept all counter-attack risk — a goal is the only priority'],
      default:   ['Commit to attack completely — accept all defensive risk','Use every set piece aggressively — each is a goal chance','Add height to the box — win every single second ball','Crowd the box in the final 10 minutes — all hands on deck'],
    },
    avoid: { default:['Staying in the same shape hoping something magically changes','Individual heroics over collective organised movement'] },
  },
};


const TacticalPitchSVG = ({ formation, color = '#22d3ee', mirror = false, width = 220, height = 280 }) => {
  const pos = FORMATION_POSITIONS[formation];
  if (!pos) return <div className="text-slate-400 text-base text-center py-8">Formation unavailable</div>;
  const allPos = [{ x:8,y:50 },...(pos.def||[]).map(p=>({x:p[0],y:p[1]})),...(pos.mid||[]).map(p=>({x:p[0],y:p[1]})),...(pos.fwd||[]).map(p=>({x:p[0],y:p[1]}))];
  const gradId = `pg${mirror?'m':''}`;
  const filterId = `gl${mirror?'m':''}`;
  return (
    <svg viewBox="0 0 100 100" width={width} height={height} preserveAspectRatio="xMidYMid meet" style={{transform:mirror?'scaleX(-1)':'none'}}>
      <defs><linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#0d4a2e" stopOpacity="0.5"/><stop offset="100%" stopColor="#0a3520" stopOpacity="0.7"/></linearGradient><filter id={filterId}><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <rect x="1" y="1" width="98" height="98" rx="3" fill={`url(#${gradId})`} stroke="rgba(255,255,255,0.12)" strokeWidth="0.4"/>
      <line x1="50" y1="1" x2="50" y2="99" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3"/><circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3"/>
      <rect x="1" y="25" width="14" height="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" rx="1"/><rect x="85" y="25" width="14" height="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" rx="1"/>
      {allPos.map((p,i)=>{const px=mirror?100-p.x:p.x;return(<g key={i}><circle cx={px} cy={p.y} r="3.5" fill={color} opacity="0.15"/><circle cx={px} cy={p.y} r="2.2" fill={color} filter={`url(#${filterId})`} opacity="0.85"/><circle cx={px} cy={p.y} r="1" fill="white" opacity="0.9"/></g>);})}
      <text x={mirror?10:90} y="96" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="5" fontWeight="bold" fontFamily="JetBrains Mono" style={{transform: mirror ? 'scaleX(-1)' : 'none', transformOrigin: '50px 96px'}}>{formation}</text>
    </svg>
  );
};

// Enhanced pitch with role labels — replaces TacticalPitchSVG in tactical tab
const TacticalPitchWithRoles = ({ formation, color = '#22d3ee', mirror = false, teamName = '', width = 240, height = 300 }) => {
  const pos = FORMATION_POSITIONS[formation];
  const roleLabels = FORMATION_ROLE_LABELS[formation];
  if (!pos) return <div className="text-slate-400 text-base text-center py-8">Formation unavailable</div>;

  // Build ordered position list matching role label array
  const positions = [
    { x: 8, y: 50 },
    ...(pos.def||[]).map(p => ({ x: p[0], y: p[1] })),
    ...(pos.mid||[]).map(p => ({ x: p[0], y: p[1] })),
    ...(pos.fwd||[]).map(p => ({ x: p[0], y: p[1] })),
  ];

  const VW = 100, VH = 130; // viewBox dimensions — taller than wide for portrait pitch
  const gId = `rpg${mirror?'m':'h'}${formation.replace(/-/g,'')}`;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width={width} height={height} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d5a36" stopOpacity="0.7"/>
          <stop offset="50%" stopColor="#0a4a2c" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#0d5a36" stopOpacity="0.7"/>
        </linearGradient>
      </defs>

      {/* Pitch background */}
      <rect x="1" y="1" width={VW-2} height={VH-2} rx="3" fill={`url(#${gId})`} stroke="rgba(255,255,255,0.15)" strokeWidth="0.4"/>

      {/* Pitch markings */}
      <line x1="50" y1="1" x2="50" y2={VH-1} stroke="rgba(255,255,255,0.08)" strokeWidth="0.3"/>
      <circle cx="50" cy={VH/2} r="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3"/>
      {/* Penalty boxes */}
      <rect x="1" y="38" width="12" height="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" rx="1"/>
      <rect x={VW-13} y="38" width="12" height="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" rx="1"/>
      {/* Goal areas */}
      <rect x="1" y="47" width="5" height="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3"/>
      <rect x={VW-6} y="47" width="5" height="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3"/>
      {/* Goals */}
      <rect x="-1" y="54" width="2" height="22" fill="rgba(255,255,255,0.15)" rx="0.5"/>
      <rect x={VW-1} y="54" width="2" height="22" fill="rgba(255,255,255,0.15)" rx="0.5"/>

      {/* Players — flip x for mirror, but keep text readable */}
      {positions.map((p, i) => {
        // For mirror: flip x coordinate in JS instead of CSS transform (keeps text readable)
        const rawX = mirror ? 100 - p.x : p.x;
        const py = (p.y / 100) * VH;
        const role = roleLabels?.[i] || (i === 0 ? 'GK' : 'P');

        return (
          <g key={i}>
            {/* Glow ring */}
            <circle cx={rawX} cy={py} r="5.5" fill={color} opacity="0.12"/>
            {/* Player dot */}
            <circle cx={rawX} cy={py} r="4" fill={color} opacity="0.95"/>
            <circle cx={rawX} cy={py} r="1.5" fill="white" opacity="0.9"/>
            {/* Role label below dot */}
            <text
              x={rawX} y={py + 8.5}
              textAnchor="middle"
              fill="rgba(255,255,255,0.75)"
              fontSize="4.8"
              fontWeight="700"
              fontFamily="JetBrains Mono"
              letterSpacing="0"
            >{role}</text>
          </g>
        );
      })}

      {/* Team name at bottom */}
      {teamName && (
        <text x={VW/2} y={VH-2} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="4.5" fontWeight="700" fontFamily="Outfit">{teamName.length > 14 ? teamName.substring(0,12)+'…' : teamName}</text>
      )}
    </svg>
  );
};

const RadarChart = ({ data1, data2, labels, color1='#22d3ee', color2='#a855f7', name1='A', name2='B' }) => {
  const size=220,cx=size/2,cy=size/2,r=80,n=labels.length;
  const pt=(i,v)=>{const a=(Math.PI*2*i)/n-Math.PI/2;const d=(v/100)*r;return{x:cx+d*Math.cos(a),y:cy+d*Math.sin(a)};};
  const path=(data)=>data.map((v,i)=>{const p=pt(i,v);return `${i===0?'M':'L'} ${p.x} ${p.y}`;}).join(' ')+'Z';
  return (<div className="flex flex-col items-center"><svg width={size} height={size}>{[20,40,60,80,100].map(lv=><polygon key={lv} points={labels.map((_,i)=>{const p=pt(i,lv);return `${p.x},${p.y}`;}).join(' ')} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>)}{labels.map((_,i)=>{const p=pt(i,100);return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>;})}<path d={path(data1)} fill={color1} fillOpacity="0.12" stroke={color1} strokeWidth="2"/><path d={path(data2)} fill={color2} fillOpacity="0.12" stroke={color2} strokeWidth="2"/>{data1.map((v,i)=>{const p=pt(i,v);return <circle key={`a${i}`} cx={p.x} cy={p.y} r="3" fill={color1} stroke="white" strokeWidth="0.8"/>;})}{data2.map((v,i)=>{const p=pt(i,v);return <circle key={`b${i}`} cx={p.x} cy={p.y} r="3" fill={color2} stroke="white" strokeWidth="0.8"/>;})}{labels.map((l,i)=>{const p=pt(i,118);return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="Outfit">{l}</text>;})}</svg><div className="flex gap-5 mt-1"><div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{background:color1}}/><span className="text-base text-slate-400">{name1}</span></div><div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{background:color2}}/><span className="text-base text-slate-400">{name2}</span></div></div></div>);
};

const VsStatBar = ({ label, valA, valB, rawA, rawB }) => {
  const aW = (rawA ?? valA) > (rawB ?? valB);
  const bW = (rawB ?? valB) > (rawA ?? valA);
  const widthA = Math.max(valA ?? 0, 5);
  const widthB = Math.max(valB ?? 0, 5);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className={`text-base font-bold ${aW ? 'text-cyan-400' : 'text-slate-300'}`} style={{ fontFamily: 'JetBrains Mono' }}>
          {rawA != null ? rawA : (valA != null ? valA.toFixed(1) : '0.0')}
        </span>
        <span className="text-base text-slate-400">{label}</span>
        <span className={`text-base font-bold ${bW ? 'text-purple-400' : 'text-slate-300'}`} style={{ fontFamily: 'JetBrains Mono' }}>
          {rawB != null ? rawB : (valB != null ? valB.toFixed(1) : '0.0')}
        </span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 bg-white/5 rounded-full overflow-hidden flex justify-end">
          <div className={`h-full rounded-full transition-all duration-1000 ${aW ? 'bg-gradient-to-l from-cyan-400 to-cyan-500' : 'bg-slate-700/60'}`} style={{ width: `${widthA}%` }}/>
        </div>
        <div className="flex-1 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${bW ? 'bg-gradient-to-r from-purple-400 to-purple-500' : 'bg-slate-700/60'}`} style={{ width: `${widthB}%` }}/>
        </div>
      </div>
    </div>
  );
};

const deriveTeamStats = (pred, side = 'home') => {
  if (!pred) return { attack:50,defense:50,form:50,xg:0,momentum:50,winProb:0.33,formSeq:[],keyFactors:[],crest:null,teamName:'' };
  const isH = side === 'home';
  let myXg = (isH ? pred.home_expected_goals : pred.away_expected_goals) || 0;
  let oppXg = (isH ? pred.away_expected_goals : pred.home_expected_goals) || 0;
  if (!myXg && pred.key_factors) {
    const xgFac = pred.key_factors.find(f => /expected goals/i.test(f));
    if (xgFac) {
      const nums = xgFac.match(/[\d.]+/g);
      if (nums && nums.length >= 2) { myXg = parseFloat(isH ? nums[0] : nums[1]) || 0; oppXg = parseFloat(isH ? nums[1] : nums[0]) || 0; }
    }
  }
  const winProb = (isH ? pred.home_win : pred.away_win) || 0.33;
  const formRaw = (isH ? pred.home_form_sequence : pred.away_form_sequence) || [];
  const formArr = Array.isArray(formRaw) ? formRaw : (typeof formRaw === 'string' ? formRaw.replace(/[^WDL]/gi,'').split('').filter(Boolean) : []);
  let formScore = 50;
  if (formArr.length > 0) {
    const pts = formArr.reduce((s,c,i)=>{const w=Math.pow(0.85,formArr.length-1-i);return s+(c==='W'?3:c==='D'?1:0)*w;},0);
    const max = formArr.reduce((s,_,i)=>s+3*Math.pow(0.85,formArr.length-1-i),0);
    formScore = max>0?(pts/max)*100:50;
  }
  return {
    attack: Math.min(Math.max(myXg*38,15),95), defense: Math.min(Math.max(100-oppXg*35,15),95),
    form: formScore, xg: myXg, momentum: Math.min(Math.max(winProb*130,10),95), winProb,
    formSeq: formArr, keyFactors: pred.key_factors||[],
    crest: (isH?pred.home_crest:pred.away_crest)||null, teamName: (isH?pred.home_team_name:pred.away_team_name)||'',
  };
};

/* ═══════════════════════════════════════════════
   SCOUT REPORT TAB
   Comprehensive player scout analysis with
   percentile rankings vs position peers
   ═══════════════════════════════════════════════ */

// Role detector (mirrors AnalyticsPage logic)
const detectScoutRole = (p) => {
  const pos = (p.position || '').toLowerCase();
  if (pos.includes('goalkeeper')) return 'goalkeeper';
  if (pos.includes('defender')) {
    const a90 = (Number(p.assists)||0) / Math.max(Number(p.minutes)||1,1) * 90;
    const kp90 = (Number(p.keyPasses)||0) / Math.max(Number(p.minutes)||1,1) * 90;
    return (a90 > 0.12 || kp90 > 0.7) ? 'fullback' : 'centreback';
  }
  if (pos.includes('midfielder')) {
    const mins = Math.max(Number(p.minutes)||1,1);
    const tack90 = (Number(p.tacklesTotal)||0) / mins * 90;
    const inter90 = (Number(p.interceptions)||0) / mins * 90;
    const kp90 = (Number(p.keyPasses)||0) / mins * 90;
    const g90 = (Number(p.goals)||0) / mins * 90;
    if (tack90 + inter90 > 4.2) return 'cdm';
    if (kp90 > 1.3 || g90 > 0.22) return 'cam';
    return 'cm';
  }
  if (pos.includes('attacker') || pos.includes('forward')) {
    const drb = Number(p.dribbleSuccessPct)||0;
    const mins = Math.max(Number(p.minutes)||1,1);
    const a90 = (Number(p.assists)||0) / mins * 90;
    const kp90 = (Number(p.keyPasses)||0) / mins * 90;
    return (drb > 40 || (a90 > 0.22 && kp90 > 0.7)) ? 'winger' : 'striker';
  }
  return 'general';
};

// Role config: which stats matter per position
const SCOUT_ROLE_CONFIG = {
  striker: {
    label: 'Centre Forward / Striker',
    color: '#f43f5e',
    metrics: [
      { key: 'goals',          label: 'Goals',         scale: 30,   higherBetter: true },
      { key: 'xG',             label: 'xG',            scale: 25,   higherBetter: true },
      { key: 'goalsPerNinety', label: 'Goals/90',      scale: 1.2,  higherBetter: true },
      { key: 'xGPerNinety',    label: 'xG/90',         scale: 1.0,  higherBetter: true },
      { key: 'shotAccuracy',   label: 'Shot Conv%',    scale: 40,   higherBetter: true },
      { key: 'shotsTotal',     label: 'Total Shots',   scale: 150,  higherBetter: true },
      { key: 'npxG',           label: 'Non-Pen xG',    scale: 20,   higherBetter: true },
      { key: 'aerialWon',      label: 'Aerials Won',   scale: 80,   higherBetter: true },
    ],
    radar: ['Goals','xG','Conv%','Shots/90','Aerial','Assists','Pressing','Linkup'],
    radarKeys: ['goals','xG','shotAccuracy','shotsTotal','aerialWon','assists','interceptions','keyPasses'],
    radarScales: [30,25,40,150,80,15,30,50],
  },
  winger: {
    label: 'Wide Forward / Winger',
    color: '#f59e0b',
    metrics: [
      { key: 'goals',             label: 'Goals',        scale: 20,  higherBetter: true },
      { key: 'assists',           label: 'Assists',      scale: 15,  higherBetter: true },
      { key: 'dribbleSuccessPct', label: 'Dribble%',     scale: 80,  higherBetter: true },
      { key: 'keyPasses',         label: 'Key Passes',   scale: 80,  higherBetter: true },
      { key: 'goalsPerNinety',    label: 'Goals/90',     scale: 0.8, higherBetter: true },
      { key: 'assistsPerNinety',  label: 'Assists/90',   scale: 0.6, higherBetter: true },
      { key: 'shotsTotal',        label: 'Total Shots',  scale: 120, higherBetter: true },
      { key: 'foulsDrawn',        label: 'Fouls Won',    scale: 80,  higherBetter: true },
    ],
    radar: ['Goals','Assists','Dribble%','Key Passes','Shots/90','xA','Pressing','xG'],
    radarKeys: ['goals','assists','dribbleSuccessPct','keyPasses','shotsTotal','xA','interceptions','xG'],
    radarScales: [20,15,80,80,120,12,30,15],
  },
  cam: {
    label: 'Attacking Midfielder / CAM',
    color: '#8b5cf6',
    metrics: [
      { key: 'assists',           label: 'Assists',      scale: 15,  higherBetter: true },
      { key: 'keyPasses',         label: 'Key Passes',   scale: 90,  higherBetter: true },
      { key: 'xA',               label: 'xA',           scale: 12,  higherBetter: true },
      { key: 'goals',             label: 'Goals',        scale: 18,  higherBetter: true },
      { key: 'xG',               label: 'xG',           scale: 15,  higherBetter: true },
      { key: 'dribbleSuccessPct', label: 'Dribble%',     scale: 75,  higherBetter: true },
      { key: 'passAccuracy',      label: 'Pass Acc%',    scale: 95,  higherBetter: true },
      { key: 'foulsDrawn',        label: 'Fouls Won',    scale: 70,  higherBetter: true },
    ],
    radar: ['Assists','Key Pass','xA','Goals','Dribble%','Pass%','Pressing','xG'],
    radarKeys: ['assists','keyPasses','xA','goals','dribbleSuccessPct','passAccuracy','interceptions','xG'],
    radarScales: [15,90,12,18,75,95,30,15],
  },
  cm: {
    label: 'Central Midfielder / CM',
    color: '#3b82f6',
    metrics: [
      { key: 'keyPasses',     label: 'Key Passes',   scale: 80,  higherBetter: true },
      { key: 'passAccuracy',  label: 'Pass Acc%',    scale: 95,  higherBetter: true },
      { key: 'goals',         label: 'Goals',        scale: 12,  higherBetter: true },
      { key: 'assists',       label: 'Assists',      scale: 10,  higherBetter: true },
      { key: 'tacklesTotal',  label: 'Tackles',      scale: 80,  higherBetter: true },
      { key: 'interceptions', label: 'Intercepts',   scale: 50,  higherBetter: true },
      { key: 'duelsWon',      label: 'Duels Won',    scale: 150, higherBetter: true },
      { key: 'xA',           label: 'xA',           scale: 8,   higherBetter: true },
    ],
    radar: ['Key Pass','Pass%','Goals','Assists','Tackles','Intercepts','Duels','xA'],
    radarKeys: ['keyPasses','passAccuracy','goals','assists','tacklesTotal','interceptions','duelsWon','xA'],
    radarScales: [80,95,12,10,80,50,150,8],
  },
  cdm: {
    label: 'Defensive Midfielder / CDM',
    color: '#10b981',
    metrics: [
      { key: 'tacklesTotal',   label: 'Tackles',       scale: 100, higherBetter: true },
      { key: 'interceptions',  label: 'Intercepts',    scale: 60,  higherBetter: true },
      { key: 'duelsWon',       label: 'Duels Won',     scale: 180, higherBetter: true },
      { key: 'duelWinPct',     label: 'Duel Win%',     scale: 70,  higherBetter: true },
      { key: 'passAccuracy',   label: 'Pass Acc%',     scale: 95,  higherBetter: true },
      { key: 'blocks',         label: 'Blocks',        scale: 40,  higherBetter: true },
      { key: 'aerialWon',      label: 'Aerials Won',   scale: 80,  higherBetter: true },
      { key: 'yellowCards',    label: 'Yellow Cards',  scale: 10,  higherBetter: false },
    ],
    radar: ['Tackles','Intercepts','Duels','Duel%','Pass%','Blocks','Aerial','Pressing'],
    radarKeys: ['tacklesTotal','interceptions','duelsWon','duelWinPct','passAccuracy','blocks','aerialWon','keyPasses'],
    radarScales: [100,60,180,70,95,40,80,30],
  },
  centreback: {
    label: 'Centre-Back / CB',
    color: '#22d3ee',
    metrics: [
      { key: 'tacklesTotal',   label: 'Tackles',       scale: 80,  higherBetter: true },
      { key: 'interceptions',  label: 'Intercepts',    scale: 60,  higherBetter: true },
      { key: 'aerialWon',      label: 'Aerials Won',   scale: 120, higherBetter: true },
      { key: 'duelWinPct',     label: 'Duel Win%',     scale: 70,  higherBetter: true },
      { key: 'passAccuracy',   label: 'Pass Acc%',     scale: 95,  higherBetter: true },
      { key: 'blocks',         label: 'Blocks',        scale: 40,  higherBetter: true },
      { key: 'duelsWon',       label: 'Duels Won',     scale: 150, higherBetter: true },
      { key: 'yellowCards',    label: 'Yellow Cards',  scale: 10,  higherBetter: false },
    ],
    radar: ['Tackles','Intercepts','Aerials','Duel%','Pass%','Blocks','Goals','Duels'],
    radarKeys: ['tacklesTotal','interceptions','aerialWon','duelWinPct','passAccuracy','blocks','goals','duelsWon'],
    radarScales: [80,60,120,70,95,40,8,150],
  },
  fullback: {
    label: 'Full-Back / Wing-Back',
    color: '#38bdf8',
    metrics: [
      { key: 'assists',           label: 'Assists',      scale: 12,  higherBetter: true },
      { key: 'keyPasses',         label: 'Key Passes',   scale: 60,  higherBetter: true },
      { key: 'tacklesTotal',      label: 'Tackles',      scale: 80,  higherBetter: true },
      { key: 'interceptions',     label: 'Intercepts',   scale: 50,  higherBetter: true },
      { key: 'dribbleSuccessPct', label: 'Dribble%',     scale: 70,  higherBetter: true },
      { key: 'passAccuracy',      label: 'Pass Acc%',    scale: 95,  higherBetter: true },
      { key: 'aerialWon',         label: 'Aerials Won',  scale: 60,  higherBetter: true },
      { key: 'foulsCommitted',    label: 'Fouls',        scale: 40,  higherBetter: false },
    ],
    radar: ['Assists','Key Pass','Tackles','Intercepts','Dribble%','Pass%','Aerial','xA'],
    radarKeys: ['assists','keyPasses','tacklesTotal','interceptions','dribbleSuccessPct','passAccuracy','aerialWon','xA'],
    radarScales: [12,60,80,50,70,95,60,8],
  },
  goalkeeper: {
    label: 'Goalkeeper / GK',
    color: '#fbbf24',
    metrics: [
      { key: 'rating',       label: 'Season Rating',  scale: 10,  higherBetter: true },
      { key: 'saves',        label: 'Saves',          scale: 120, higherBetter: true },
      { key: 'passAccuracy', label: 'Pass Acc%',      scale: 95,  higherBetter: true },
      { key: 'aerialWon',    label: 'Aerials Won',    scale: 60,  higherBetter: true },
      { key: 'goalsConceded',label: 'Goals Conceded', scale: 50,  higherBetter: false },
      { key: 'keyPasses',    label: 'Key Passes',     scale: 20,  higherBetter: true },
      { key: 'penaltiesSaved',label:'Pens Saved',     scale: 5,   higherBetter: true },
      { key: 'appearances',  label: 'Appearances',    scale: 38,  higherBetter: true },
    ],
    radar: ['Rating','Saves','Pass%','Aerials','Distribution','Pens Saved','Lineups','Clean*'],
    radarKeys: ['rating','saves','passAccuracy','aerialWon','passesTotal','penaltiesSaved','lineups','appearances'],
    radarScales: [10,120,95,60,500,5,38,38],
  },
  general: {
    label: 'General',
    color: '#94a3b8',
    metrics: [
      { key: 'goals',         label: 'Goals',        scale: 25,  higherBetter: true },
      { key: 'assists',       label: 'Assists',      scale: 15,  higherBetter: true },
      { key: 'xG',           label: 'xG',           scale: 20,  higherBetter: true },
      { key: 'xA',           label: 'xA',           scale: 10,  higherBetter: true },
      { key: 'keyPasses',     label: 'Key Passes',   scale: 60,  higherBetter: true },
      { key: 'passAccuracy',  label: 'Pass Acc%',    scale: 95,  higherBetter: true },
      { key: 'tacklesTotal',  label: 'Tackles',      scale: 80,  higherBetter: true },
      { key: 'rating',        label: 'Rating',       scale: 10,  higherBetter: true },
    ],
    radar: ['Goals','Assists','xG','xA','Key Pass','Pass%','Tackles','Rating'],
    radarKeys: ['goals','assists','xG','xA','keyPasses','passAccuracy','tacklesTotal','rating'],
    radarScales: [25,15,20,10,60,95,80,10],
  },
};

function ScoutReportTab({ selectedLeague }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [scoutData, setScoutData] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loadingScout, setLoadingScout] = useState(false);
  const [loadingPool, setLoadingPool] = useState(false);
  const [aiText, setAiText] = useState('');
  const [err, setErr] = useState('');
  const [poolLoaded, setPoolLoaded] = useState(false);
  const dropRef = useRef(null);
  const timerRef = useRef(null);

  // Load player pool once for percentiles
  useEffect(() => {
    if (poolLoaded) return;
    setLoadingPool(true);
    fetchWithTimeout(`${API_BASE}/players-stats/all`)
      .then(r => r.json())
      .then(data => { setAllPlayers(Array.isArray(data) ? data : []); setPoolLoaded(true); })
      .catch(() => {})
      .finally(() => setLoadingPool(false));
  }, [poolLoaded]);

  // Typeahead
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); setShowDrop(false); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const r = await fetchWithTimeout(`${API_BASE}/players/search?q=${encodeURIComponent(query)}&limit=30`);
        if (r.ok) { const d = await r.json(); setSuggestions(d); setShowDrop(d.length > 0); }
      } catch { setSuggestions([]); }
    }, 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  // Click outside close
  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const runAnalysis = async (playerName) => {
    setLoadingScout(true); setScoutData(null); setAiText(''); setErr('');
    setQuery(''); // clear input after selection
    try {
      const data = await analyzePlayer(playerName, selectedLeague);
      setScoutData(data);
      // Fetch AI analysis in parallel
      const prompt = `You are a professional football scout writing a detailed report for a club's sporting director.

  Player: ${playerName} (${data.position || 'Unknown'}) at ${data.team || 'Unknown'} in ${selectedLeague}.
  Stats: Goals ${data.goals||0}, Assists ${data.assists||0}, xG ${(data.xG||0).toFixed(1)}, xA ${(data.xA||0).toFixed(1)}, Rating ${(data.rating||0).toFixed(1)}, Pass% ${data.passAccuracy||0}%, Key Passes ${data.keyPasses||0}

      Write a professional scout report covering:
      ## Technical Profile
      ## Tactical Role & Movement
      ## Statistical Verdict (mention xG performance specifically)
      ## Scouting Recommendation

      Be specific, use exact stat numbers. Max 400 words. No generic statements — this must read like a real scout report.`;
      const resp = await fetchWithTimeout(`${API_BASE}/api/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      const d = await resp.json();
      const txt = (d?.content||[]).filter(i=>i?.type==='text').map(i=>i.text).join('\n');
      setAiText(txt);
    } catch (e) { setErr(e.message || 'Analysis failed'); }
    finally { setLoadingScout(false); }
  };

  // Percentile rank: where does this player sit among position peers?
  const getPercentile = (value, key, role, higherBetter = true) => {
    const peers = allPlayers.filter(p => detectScoutRole(p) === role);
    if (peers.length < 5) return null;
    const vals = peers.map(p => Number(p[key]) || 0).filter(v => v > 0).sort((a,b) => a - b);
    if (vals.length === 0) return null;
    const val = Number(value) || 0;
    const rank = vals.filter(v => v <= val).length;
    return Math.round((rank / vals.length) * 100);
  };

  const pctColor = (pct) => {
    if (pct == null) return 'rgba(148,163,184,0.5)';
    if (pct >= 90) return '#22d3ee';
    if (pct >= 75) return '#10b981';
    if (pct >= 50) return '#f59e0b';
    if (pct >= 25) return '#94a3b8';
    return '#ef4444';
  };

  const pctLabel = (pct) => {
    if (pct == null) return '';
    if (pct >= 90) return 'Elite';
    if (pct >= 75) return 'Very Good';
    if (pct >= 50) return 'Above Avg';
    if (pct >= 25) return 'Average';
    return 'Below Avg';
  };

  // xG intelligence
  const xgDiff = scoutData ? ((scoutData.goals||0) - (scoutData.xG||0)) : 0;
  const xaDiff = scoutData ? ((scoutData.assists||0) - (scoutData.xA||0)) : 0;
  const xgEfficiency = scoutData && (scoutData.xG||0) > 0
    ? Math.round(((scoutData.goals||0) / (scoutData.xG||1)) * 100)
    : null;

  const role = scoutData ? detectScoutRole(scoutData) : 'general';
  const roleConfig = SCOUT_ROLE_CONFIG[role] || SCOUT_ROLE_CONFIG.general;

  // Mini radar SVG
  const renderRadar = (data, config) => {
    const sz = 200, cx = sz/2, cy = sz/2, r = 72;
    const n = config.radar.length;
    const pts = config.radar.map((label, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const key = config.radarKeys[i];
      const scale = config.radarScales[i];
      const val = Math.min((Number(data[key])||0) / scale, 1);
      return {
        x: cx + Math.cos(angle) * r * val,
        y: cy + Math.sin(angle) * r * val,
        lx: cx + Math.cos(angle) * (r + 20),
        ly: cy + Math.sin(angle) * (r + 20),
        label,
      };
    });
    const path = pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';
    const gridPoints = (frac) => config.radar.map((_,i) => {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      return `${(cx + Math.cos(a)*r*frac).toFixed(1)},${(cy + Math.sin(a)*r*frac).toFixed(1)}`;
    }).join(' ');
    return (
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
        {[0.25,0.5,0.75,1.0].map((f,i) => (
          <polygon key={i} points={gridPoints(f)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>
        ))}
        {config.radar.map((_,i) => {
          const a = (Math.PI * 2 * i) / n - Math.PI / 2;
          return <line key={i} x1={cx} y1={cy} x2={cx+Math.cos(a)*r} y2={cy+Math.sin(a)*r} stroke="rgba(255,255,255,0.04)" strokeWidth="0.8"/>;
        })}
        <path d={path} fill={`${roleConfig.color}18`} stroke={roleConfig.color} strokeWidth="2"/>
        {pts.map((p,i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill={roleConfig.color} strokeWidth="0"/>
            <text x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.45)" fontSize="8" fontFamily="Outfit" fontWeight="600">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="space-y-4">

      {/* ── Search bar ── */}
      <div ref={dropRef} className="relative">
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all"
          style={{background:'rgba(14,24,46,0.9)', borderColor:'rgba(34,211,238,0.2)', boxShadow:'0 0 0 1px rgba(34,211,238,0.05)'}}>
          <SearchIcon className="w-5 h-5 text-cyan-400 flex-shrink-0"/>
          <input type="text" value={query} onChange={e=>setQuery(e.target.value)}
            onFocus={()=>suggestions.length>0&&setShowDrop(true)}
            placeholder="Search any player — Haaland, Salah, Van Dijk..."
            className="flex-1 bg-transparent text-white text-base placeholder-slate-500 outline-none"/>
          {query && <button onClick={()=>{setQuery('');setShowDrop(false);}} className="text-slate-400 hover:text-white transition-colors"><XIcon className="w-4 h-4"/></button>}
          {loadingPool && <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin flex-shrink-0"/>}
        </div>
        {showDrop && suggestions.length>0 && (
         <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl z-50 overflow-y-auto max-h-72"
  style={{background:'rgba(8,12,24,0.98)',borderColor:'rgba(34,211,238,0.15)',animation:'slideDown 0.15s ease-out',scrollbarWidth:'thin',scrollbarColor:'#1e293b transparent'}}>
         {suggestions.map((p,i)=>(
              <button key={p.id||i} onClick={()=>{setShowDrop(false);runAnalysis(p.name);}}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-all text-left border-b border-white/[0.05] last:border-0">
                {p.photo
                  ? <img src={p.photo} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0"/>
                  : <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-400 font-bold text-base">{(p.name||'?')[0]}</span>
                    </div>}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-base truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.teamLogo&&<img src={p.teamLogo} alt="" className="w-3.5 h-3.5"/>}
                    <span className="text-slate-400 text-sm truncate">{p.team}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500 text-sm">{p.position}</span>
                  </div>
                </div>
                {p.rating>0&&<span className="text-sm font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg flex-shrink-0" style={{fontFamily:'JetBrains Mono'}}>{p.rating.toFixed(1)}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Loading ── */}
     {loadingScout && <AppLoader title="Building Scout Report" sub="Fetching stats and computing percentile rankings…" color="#22d3ee"/>}

      {/* ── Error ── */}
      {err && (
        <div className="rounded-2xl p-4 border border-red-500/20 flex items-start gap-3" style={{background:'rgba(239,68,68,0.06)'}}>
          <AlertIcon className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"/>
          <p className="text-red-300 text-base">{err}</p>
        </div>
      )}

      {/* ── Scout Report ── */}
      {scoutData && !loadingScout && (
        <div className="space-y-4" style={{animation:'fadeSlideIn 0.4s ease-out'}}>

          {/* ── PLAYER HERO — same structure as Simulator champion card ── */}
          <div className="relative p-2 md:p4 rounded-3xl overflow-hidden">
            <div className="absolute inset-0" style={{background:`linear-gradient(135deg,${roleConfig.color}18,${roleConfig.color}06,transparent)`}}/>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px]" style={{background:`${roleConfig.color}12`}}/>
            <div className="relative p-2 md:p4  border rounded-3xl p-6 md:p-8" style={{borderColor:`${roleConfig.color}30`}}>
              <div className="flex items-center gap-2 mb-5">
                <UserCheckIcon className="w-4 h-4" style={{color:roleConfig.color}}/>
                <span className="font-bold text-sm uppercase tracking-[0.2em]" style={{color:roleConfig.color}}>Scout Report</span>
                <div className="ml-auto px-3 py-1 rounded-full text-xs font-bold border"
                  style={{background:`${roleConfig.color}10`,borderColor:`${roleConfig.color}30`,color:roleConfig.color}}>
                  {roleConfig.label}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Photo + identity */}
                <div className="flex items-start gap-5">
                  <div className="relative flex-shrink-0">
                    {scoutData.photo
                      ? <img src={scoutData.photo} alt="" className="w-24 h-24 rounded-2xl object-cover border" style={{boxShadow:`0 0 40px ${roleConfig.color}30`,borderColor:`${roleConfig.color}40`}}/>
                      : <div className="w-24 h-24 rounded-2xl flex items-center justify-center border" style={{background:`${roleConfig.color}15`,borderColor:`${roleConfig.color}30`}}>
                          <span className="text-5xl font-black" style={{color:roleConfig.color}}>{(scoutData.player_name||'?')[0]}</span>
                        </div>}
                    {scoutData.overall_rating!=null && (
                      <div className="absolute -bottom-2 -right-2 w-7 h-7 md:w-9 md:h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-lg"
                        style={{background:`linear-gradient(135deg,${roleConfig.color},${roleConfig.color}cc)`,fontFamily:'JetBrains Mono'}}>
                        {scoutData.overall_rating?.toFixed(0)||'—'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-white font-black text-2xl md:text-3xl leading-tight mb-1">{scoutData.player_name}</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      {scoutData.teamLogo&&<img src={scoutData.teamLogo} alt="" className="w-5 h-5"/>}
                      <span className="text-slate-300 text-base font-semibold">{scoutData.team}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-base font-bold px-2 py-0.5 rounded-lg" style={{background:`${roleConfig.color}15`,color:roleConfig.color}}>{scoutData.position||roleConfig.label}</span>
                    </div>
                    {/* Quick stats row */}
                    <div className="flex items-center gap-5 mt-3">
                      {[
                        {l:'Apps',   v:scoutData.appearances||0},
                        {l:'Goals',  v:scoutData.goals||0},
                        {l:'Assists',v:scoutData.assists||0},
                        {l:'Rating', v:(scoutData.rating||0).toFixed(1)},
                      ].map(s=>(
                        <div key={s.l}>
                          <div className="text-white font-black text-xl" style={{fontFamily:'JetBrains Mono'}}>{s.v}</div>
                          <div className="text-slate-500 text-xs uppercase tracking-widest">{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Radar */}
                <div className="flex-shrink-0 flex justify-center md:justify-end">
                  {renderRadar(scoutData, roleConfig)}
                </div>
              </div>
            </div>
          </div>

          {/* ── xG INTELLIGENCE — 3 stat cards ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label:'xG Differential', icon:TargetIcon,
                value:`${xgDiff>=0?'+':''}${xgDiff.toFixed(1)}`,
                sub: xgDiff>2?'Clinical finisher':xgDiff>0?'Overperforming xG':xgDiff>-2?'Slightly wasteful':'Underperforming xG',
                color: xgDiff>=0?'#10b981':'#ef4444',
                grad: xgDiff>=0?'from-emerald-500/15 to-emerald-600/5':'from-red-500/15 to-red-600/5',
              },
              {
                label:'xA Differential', icon:ZapIcon,
                value:`${xaDiff>=0?'+':''}${xaDiff.toFixed(1)}`,
                sub: xaDiff>1.5?'Elite creator':xaDiff>=0?'Efficient provider':'Teammates underconverting',
                color: xaDiff>=0?'#a855f7':'#ef4444',
                grad: xaDiff>=0?'from-purple-500/15 to-purple-600/5':'from-red-500/15 to-red-600/5',
              },
              {
                label:'Shot Efficiency', icon:CrosshairIcon,
                value: xgEfficiency!=null?`${xgEfficiency}%`:'—',
                sub: xgEfficiency!=null?(xgEfficiency>=120?'Clinical':xgEfficiency>=90?'Efficient':xgEfficiency>=70?'Average':'Wasteful'):'Insufficient data',
                color: xgEfficiency!=null?(xgEfficiency>=100?'#10b981':'#f59e0b'):'#475569',
                grad:'from-amber-500/15 to-amber-600/5',
              },
            ].map((s,i)=>(
              <div key={i} className={`bg-gradient-to-br ${s.grad} rounded-2xl p-4 border border-white/12 relative overflow-hidden`}
                style={{animation:`fadeSlideIn 0.3s ease-out ${i*0.07}s both`}}>
                <div className="absolute top-0 right-0 w-16 h-16" style={{background:`radial-gradient(circle,${s.color}15,transparent)`}}/>
                <s.icon className="w-4 h-4 mb-2" style={{color:s.color}}/>
                <p className="text-2xl font-black text-white mb-0.5" style={{fontFamily:'JetBrains Mono',color:s.color}}>{s.value}</p>
                <p className="text-sm text-slate-400">{s.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── PERCENTILE RANKINGS ── */}
          <div className="rounded-2xl border overflow-hidden" style={{background:'rgba(10,14,26,0.85)',borderColor:`${roleConfig.color}25`}}>
            <div className="h-px" style={{background:`linear-gradient(90deg,transparent,${roleConfig.color}70,transparent)`}}/>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{borderColor:`${roleConfig.color}15`,background:`${roleConfig.color}07`}}>
              <div className="flex items-center gap-2">
                <BarChartIcon className="w-4 h-4" style={{color:roleConfig.color}}/>
                <span className="text-white font-black text-base uppercase tracking-widest">Percentile Rankings</span>
              </div>
              <span className="text-sm text-slate-400 font-semibold">
                vs {allPlayers.filter(p=>detectScoutRole(p)===role).length} {roleConfig.label.split('/')[0].trim()}s
              </span>
            </div>
            <div className="p-5 space-y-3">
              {roleConfig.metrics.map((metric,i)=>{
                const val = Number(scoutData[metric.key])||0;
                const pct = getPercentile(val, metric.key, role, metric.higherBetter);
                const displayVal = typeof val==='number'&&val%1!==0 ? val.toFixed(1) : val;
                const barColor = pctColor(pct);
                const barPct = metric.higherBetter ? (pct??0) : (100-(pct??100));
                return (
                  <div key={metric.key} className="flex items-center gap-4">
                    <div className="w-16 sm:w-28 flex-shrink-0 text-right">
                      <span className="text-slate-300 text-sm font-semibold">{metric.label}</span>
                    </div>
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
                      <div className="h-full rounded-full transition-all duration-1000" style={{width:`${barPct}%`,backgroundColor:barColor}}/>
                    </div>
                    <div className="w-10 sm:w-12 text-right flex-shrink-0">
                      <span className="font-black text-sm" style={{fontFamily:'JetBrains Mono',color:barColor}}>
                        {displayVal}{metric.key.includes('Pct')||metric.key.includes('Accuracy')?'%':''}
                      </span>
                    </div>
                    <div className="w-16 sm:w-24 flex-shrink-0">
                      {pct!=null ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black" style={{fontFamily:'JetBrains Mono',color:barColor}}>{pct}th</span>
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{background:`${barColor}15`,color:barColor}}>{pctLabel(pct)}</span>
                        </div>
                      ) : <span className="text-sm text-slate-500">No data</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── ML ATTRIBUTE RATINGS ── */}
          {(scoutData.attacking!=null||scoutData.defending!=null) && (
            <div className="rounded-2xl border border-white/12 overflow-hidden" style={{background:'rgba(10,14,26,0.85)'}}>
              <div className="px-5 py-3.5 border-b border-white/12 flex items-center gap-2" style={{background:'rgba(168,85,247,0.05)'}}>
                <AwardIcon className="w-4 h-4 text-purple-400"/>
                <span className="text-white font-black text-base uppercase tracking-widest">ML Attribute Ratings</span>
                <span className="ml-auto text-sm text-slate-400">0–10 scale</span>
              </div>
              <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  {key:'attacking',label:'Attacking',color:'#f43f5e'},
                  {key:'defending',label:'Defending',color:'#10b981'},
                  {key:'passing',  label:'Passing',  color:'#22d3ee'},
                  {key:'physical', label:'Physical',  color:'#a855f7'},
                ].map(attr=>{
                  const val = scoutData[attr.key]||0;
                  const pct = Math.min(val*10, 100);
                  const grade = pct>=80?'Elite':pct>=65?'Good':pct>=50?'Avg':'Low';
                  return (
                    <div key={attr.key}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{background:attr.color,boxShadow:`0 0 6px ${attr.color}`}}/>
                          <span className="text-white text-sm font-semibold">{attr.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{background:`${attr.color}15`,color:attr.color,border:`1px solid ${attr.color}25`}}>{grade}</span>
                          <span className="text-white text-sm font-black" style={{fontFamily:'JetBrains Mono'}}>{val.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{width:`${pct}%`,background:`linear-gradient(90deg,${attr.color}70,${attr.color})`}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STRENGTHS & WEAKNESSES ── */}
          {(scoutData.strengths?.length>0||scoutData.weaknesses?.length>0) && (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              <div className="rounded-2xl overflow-hidden" style={{background:'rgba(4,18,10,0.85)',border:'1px solid rgba(16,185,129,0.22)'}}>
                <div className="h-px" style={{background:'linear-gradient(90deg,transparent,rgba(16,185,129,0.7),transparent)'}}/>
                <div className="px-4 py-3 border-b border-emerald-500/12 flex items-center gap-2" style={{background:'rgba(16,185,129,0.08)'}}>
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-400"/>
                  <span className="text-emerald-400 text-sm font-black uppercase tracking-widest">Strengths</span>
                </div>
                <div className="p-4 space-y-2.5">
                  {scoutData.strengths?.map((s,i)=>(
                    <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-xl" style={{background:'rgba(16,185,129,0.07)',border:'1px solid rgba(16,185,129,0.12)'}}>
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:'rgba(16,185,129,0.2)',border:'1px solid rgba(16,185,129,0.3)'}}>
                        <span className="text-emerald-400 text-xs font-black">{i+1}</span>
                      </div>
                      <p className="text-white text-sm leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{background:'rgba(18,4,8,0.85)',border:'1px solid rgba(239,68,68,0.22)'}}>
                <div className="h-px" style={{background:'linear-gradient(90deg,transparent,rgba(239,68,68,0.7),transparent)'}}/>
                <div className="px-4 py-3 border-b border-red-500/12 flex items-center gap-2" style={{background:'rgba(239,68,68,0.08)'}}>
                  <AlertIcon className="w-3.5 h-3.5 text-red-400"/>
                  <span className="text-red-400 text-sm font-black uppercase tracking-widest">Weaknesses</span>
                </div>
                <div className="p-4 space-y-2.5">
                  {scoutData.weaknesses?.map((w,i)=>(
                    <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-xl" style={{background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.12)'}}>
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:'rgba(239,68,68,0.2)',border:'1px solid rgba(239,68,68,0.3)'}}>
                        <span className="text-red-400 text-xs font-black">{i+1}</span>
                      </div>
                      <p className="text-slate-200 text-sm leading-relaxed">{w}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── AI SCOUT REPORT ── */}
          {aiText && (
            <div className="rounded-2xl overflow-hidden" style={{background:'rgba(8,6,28,0.88)',border:'1px solid rgba(139,92,246,0.22)',boxShadow:'0 0 40px rgba(139,92,246,0.08)'}}>
              <div className="h-px" style={{background:'linear-gradient(90deg,transparent,rgba(139,92,246,0.8),transparent)'}}/>
              <div className="px-5 py-4 border-b flex items-center gap-3" style={{borderColor:'rgba(139,92,246,0.15)',background:'rgba(139,92,246,0.07)'}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'rgba(139,92,246,0.2)',border:'1px solid rgba(139,92,246,0.3)'}}>
                  <BrainIcon className="w-5 h-5 text-purple-400"/>
                </div>
                <div>
                  <h3 className="text-white font-black text-base">AI Scout Report</h3>
                  <span className="text-slate-400 text-sm">Professional analysis by Gemini AI</span>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border" style={{background:'rgba(16,185,129,0.08)',borderColor:'rgba(16,185,129,0.2)'}}>
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
                  <span className="text-emerald-400 text-xs font-semibold">Live</span>
                </div>
              </div>
              <div className="p-5 max-h-96 overflow-y-auto space-y-3" style={{scrollbarWidth:'thin',scrollbarColor:'#1e293b transparent'}}>
                {aiText.split('\n').map((line,i)=>{
                  if(/^#{1,3}\s+/.test(line)){
                    const t=line.replace(/^#{1,3}\s+/,'');
                    return <h4 key={i} className="text-white font-black text-base mt-4 first:mt-0 flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full bg-purple-400 flex-shrink-0"/>
                      {t}
                    </h4>;
                  }
                  if(line.trim()) return <p key={i} className="text-slate-300 text-sm leading-relaxed">{line.replace(/\*\*(.*?)\*\*/g,'$1')}</p>;
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {!scoutData && !loadingScout && (
        <div className="rounded-3xl border border-white/12 text-center py-14 px-8 relative overflow-hidden" style={{background:'rgba(10,14,26,0.7)'}}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full blur-[80px] opacity-20" style={{background:'#22d3ee'}}/>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-[80px] opacity-15" style={{background:'#a855f7'}}/>
          </div>
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center" style={{background:'linear-gradient(135deg,rgba(34,211,238,0.12),rgba(168,85,247,0.08))',border:'1px solid rgba(255,255,255,0.1)'}}>
              <UserCheckIcon className="w-9 h-9 text-cyan-400/50"/>
            </div>
            <h2 className="text-white font-black text-xl mb-2">Search any player</h2>
            <p className="text-slate-400 text-base mb-6 max-w-sm mx-auto">Percentile rankings vs position peers · xG intelligence · AI scout report</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {['Erling Haaland','Mohamed Salah','Virgil van Dijk','Rodri','Alisson Becker','Trent Alexander-Arnold'].map(name=>(
                <button key={name} onClick={()=>runAnalysis(name)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:text-cyan-400 hover:border-cyan-500/30"
                  style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.1)',color:'#94a3b8'}}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   XG INTELLIGENCE TAB
   The metrics football fans never see:
   - Who's beating / being beaten by xG
   - xA efficiency
   - League-wide expected metrics
   ═══════════════════════════════════════════════ */

function XGLabTab({ selectedLeague }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterLeague, setFilterLeague] = useState('');
  const [filterPos, setFilterPos] = useState('');
  const [minMins, setMinMins] = useState(450);
  const [view, setView] = useState('overperformers');
  const LEAGUES = ['Premier League','La Liga','Bundesliga','Serie A','Ligue 1','Primeira Liga','Champions League'];
  const LEAGUE_COLORS = {'Premier League':'#22d3ee','La Liga':'#f59e0b','Bundesliga':'#ef4444','Serie A':'#a855f7','Ligue 1':'#10b981','Primeira Liga':'#f59e0b','Champions League':'#1d4ed8'};
  const LEAGUE_FLAGS = {'Premier League':'https://media.api-sports.io/football/leagues/39.png','La Liga':'https://media.api-sports.io/football/leagues/140.png','Bundesliga':'https://media.api-sports.io/football/leagues/78.png','Serie A':'https://media.api-sports.io/football/leagues/135.png','Ligue 1':'https://media.api-sports.io/football/leagues/61.png','Primeira Liga':'https://media.api-sports.io/football/leagues/94.png','Champions League':'https://media.api-sports.io/football/leagues/2.png'};

  useEffect(()=>{
    setLoading(true);
    fetchWithTimeout(`${API_BASE}/players-stats/all`).then(r=>r.json()).then(d=>setPlayers(Array.isArray(d)?d:[])).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const qualified = players.filter(p=>{
    if((Number(p.minutes)||0)<minMins) return false;
    if(filterLeague&&p.league!==filterLeague) return false;
    if(filterPos&&!((p.position||'').includes(filterPos))) return false;
    return true;
  });

  const withXgDiff = qualified.map(p=>({
    ...p,
    xgDiff:(Number(p.goals)||0)-(Number(p.xG)||0),
    xaDiff:(Number(p.assists)||0)-(Number(p.xA)||0),
    xgEff:(Number(p.xG)||0)>0?Math.round(((Number(p.goals)||0)/(Number(p.xG)||1))*100):null,
    xaEff:(Number(p.xA)||0)>0?Math.round(((Number(p.assists)||0)/(Number(p.xA)||1))*100):null,
  }));

  const leagueAverages = LEAGUES.map(league=>{
    const lp=qualified.filter(p=>p.league===league&&(Number(p.xG)||0)>0);
    if(!lp.length) return {league,avgXgDiff:'0.00',avgXg:'0.00',avgGoals:'0.00',color:LEAGUE_COLORS[league]||'#22d3ee'};
    const avgXg=lp.reduce((s,p)=>s+(Number(p.xG)||0),0)/lp.length;
    const avgGoals=lp.reduce((s,p)=>s+(Number(p.goals)||0),0)/lp.length;
    return{league,avgXg:avgXg.toFixed(2),avgGoals:avgGoals.toFixed(2),avgXgDiff:(avgGoals-avgXg).toFixed(2),color:LEAGUE_COLORS[league]||'#22d3ee'};
  });

  const VIEWS=[
    {id:'overperformers',label:'xG Overperformers',color:'#10b981',desc:'Players scoring significantly more than their xG — elite clinical finishing'},
    {id:'underperformers',label:'xG Underperformers',color:'#ef4444',desc:'Players underdelivering vs their xG — wasteful finishing or poor luck'},
    {id:'xa',label:'xA Intelligence',color:'#a855f7',desc:'Creative players sorted by assists minus expected assists'},
    {id:'efficiency',label:'Shot Efficiency',color:'#f59e0b',desc:'Goals scored per unit of xG — minimum 3 xG to qualify'},
    {id:'league',label:'League DNA',color:'#22d3ee',desc:'Which leagues over or underperform expected goals on average'},
  ];
  const activeView = VIEWS.find(v=>v.id===view)||VIEWS[0];

  const listConfig = {
    overperformers: {data:[...withXgDiff].filter(p=>p.xgDiff>0 && (Number(p.xG)||0)>0).sort((a,b)=>b.xgDiff-a.xgDiff).slice(0,20),valKey:'xgDiff',positive:true},
    underperformers:{data:[...withXgDiff].filter(p=>p.xgDiff<0).sort((a,b)=>a.xgDiff-b.xgDiff).slice(0,20),valKey:'xgDiff',positive:false},
    xa:             {data:[...withXgDiff].sort((a,b)=>b.xaDiff-a.xaDiff).slice(0,20),valKey:'xaDiff',positive:true},
    efficiency:     {data:[...withXgDiff].filter(p=>(Number(p.xG)||0)>=3&&p.xgEff!=null).sort((a,b)=>b.xgEff-a.xgEff).slice(0,20),valKey:'xgEff',positive:true},
  }[view];

  return (
    <div className="space-y-4">

      {/* ── FILTER PANEL ── */}
      <div className="rounded-2xl border border-white/12 overflow-hidden" style={{background:'rgba(10,14,26,0.85)'}}>
        <div className="h-px" style={{background:'linear-gradient(90deg,transparent,rgba(34,211,238,0.5),rgba(168,85,247,0.4),transparent)'}}/>
        <div className="p-5">
          {/* League cards */}
          <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.15em] mb-3">Filter by League</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 mb-4 sm:mb-5">
            <button onClick={()=>setFilterLeague('')}
              className="relative p-3 rounded-2xl border transition-all text-center"
              style={{
                background:!filterLeague?'linear-gradient(135deg,rgba(34,211,238,0.12),rgba(168,85,247,0.05))':'rgba(255,255,255,0.02)',
                borderColor:!filterLeague?'rgba(34,211,238,0.3)':'rgba(255,255,255,0.08)',
                boxShadow:!filterLeague?'0 4px 20px rgba(34,211,238,0.1)':'none',
              }}>
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-full flex items-center justify-center" style={{background:'rgba(255,255,255,0.08)'}}>
                <span className="text-xs font-black" style={{color:!filterLeague?'#22d3ee':'#64748b'}}>ALL</span>
              </div>
              <p className="text-xs font-semibold" style={{color:!filterLeague?'white':'#64748b'}}>All</p>
              {!filterLeague&&<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{background:'linear-gradient(90deg,#22d3ee,#a855f7)'}}/>}
            </button>
            {LEAGUES.map(l=>{
              const isActive=filterLeague===l;
              const c=LEAGUE_COLORS[l];
              return (
                <button key={l} onClick={()=>setFilterLeague(isActive?'':l)}
                  className="relative p-3 rounded-2xl border transition-all text-center"
                  style={{
                    background:isActive?`linear-gradient(135deg,${c}15,${c}05)`:'rgba(255,255,255,0.02)',
                    borderColor:isActive?`${c}35`:'rgba(255,255,255,0.08)',
                    boxShadow:isActive?`0 4px 20px ${c}12`:'none',
                  }}>
                  <img src={LEAGUE_FLAGS[l]} alt={l} className="w-7 h-7 mx-auto mb-1.5 object-contain transition-all"
                    style={{opacity:isActive?1:0.4,transform:isActive?'scale(1.1)':'scale(1)'}}/>
                  <p className="text-xs font-semibold" style={{color:isActive?'white':'#64748b'}}>{l.replace(' League','').replace('Premier','EPL')}</p>
                  {isActive&&<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{background:`linear-gradient(90deg,transparent,${c},transparent)`}}/>}
                </button>
              );
            })}
          </div>

          {/* Minutes filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 font-semibold">Min. minutes:</span>
            {[450,900,1350].map(m=>(
              <button key={m} onClick={()=>setMinMins(m)}
                className="px-4 py-1.5 rounded-xl text-sm font-bold transition-all border"
                style={{
                  background:minMins===m?'rgba(34,211,238,0.1)':'rgba(255,255,255,0.03)',
                  borderColor:minMins===m?'rgba(34,211,238,0.3)':'rgba(255,255,255,0.08)',
                  color:minMins===m?'#22d3ee':'#64748b',
                }}>
                {m}
              </button>
            ))}
            <span className="text-sm text-slate-500 ml-auto">{qualified.length} qualifying players</span>
          </div>
        </div>
      </div>

      {/* ── VIEW TABS ── */}
      <div className="flex gap-1 sm:gap-1.5 rounded-2xl p-1 sm:p-1.5 border border-white/12 overflow-x-auto" style={{background:'rgba(10,14,26,0.6)'}}>
        {VIEWS.map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)}
            className="relative flex-1 py-2.5 rounded-xl text-sm font-bold transition-all text-center overflow-hidden"
            style={{
              background:view===v.id?`${v.color}18`:'transparent',
              border:view===v.id?`1px solid ${v.color}35`:'1px solid transparent',
              color:view===v.id?v.color:'#64748b',
              boxShadow:view===v.id?`0 4px 20px ${v.color}12`:'none',
            }}>
            {view===v.id&&<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{background:`linear-gradient(90deg,transparent,${v.color},transparent)`}}/>}
            {v.label}
          </button>
        ))}
      </div>

      {/* Active view description */}
      <div className="flex items-center gap-2.5 px-1">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:activeView.color,boxShadow:`0 0 8px ${activeView.color}`}}/>
        <p className="text-slate-300 text-sm">{activeView.desc}</p>
      </div>

      {/* ── LOADING ── */}
   {loading && <AppLoader title="Loading Player Pool" sub="Fetching all player data across leagues…" color="#a855f7"/>}

      {/* ── LEAGUE DNA VIEW ── */}
      {!loading && view==='league' && (
        <div className="space-y-3">
          {leagueAverages.map((l,i)=>{
            const diff=Number(l.avgXgDiff);
            const overperforming=diff>=0;
            return (
              <div key={l.league} className="relative rounded-2xl p-5 overflow-hidden border"
                style={{
                  background:`linear-gradient(135deg,${l.color}0a,rgba(10,14,26,0.92))`,
                  borderColor:`${l.color}25`,
                  animation:`fadeSlideIn 0.3s ease-out ${i*0.08}s both`,
                }}>
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{background:l.color}}/>
                <div className="absolute top-0 right-0 w-32 h-full" style={{background:`radial-gradient(ellipse at right center,${l.color}08,transparent 70%)`}}/>
                <div className="flex items-center gap-4 mb-4">
                  <img src={LEAGUE_FLAGS[l.league]} alt={l.league} className="w-8 h-8 object-contain flex-shrink-0"/>
                  <div>
                    <h3 className="text-white font-black text-base">{l.league}</h3>
                    <p className="text-slate-400 text-sm">Players with xG {'>'}; 0</p>
                  </div>
                  <div className="ml-auto flex items-center gap-6">
                    {[{lbl:'Avg xG',v:l.avgXg},{lbl:'Avg Goals',v:l.avgGoals}].map(s=>(
                      <div key={s.lbl} className="text-center">
                        <div className="font-black text-base text-white" style={{fontFamily:'JetBrains Mono'}}>{s.v}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide">{s.lbl}</div>
                      </div>
                    ))}
                    <div className="text-center px-4 py-2 rounded-xl border" style={{
                      background:overperforming?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)',
                      borderColor:overperforming?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)',
                    }}>
                      <div className="font-black text-lg" style={{fontFamily:'JetBrains Mono',color:overperforming?'#10b981':'#ef4444'}}>
                        {diff>=0?'+':''}{l.avgXgDiff}
                      </div>
                      <div className="text-xs uppercase tracking-wide" style={{color:overperforming?'#10b981':'#ef4444'}}>
                        {overperforming?'Over':'Under'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
                  <div className="h-full rounded-full transition-all duration-1000" style={{width:`${Math.min(Number(l.avgXg)/1.5*100,100)}%`,background:`linear-gradient(90deg,${l.color}60,${l.color})`}}/>
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-slate-400">xG base</span>
                  <span className="text-xs font-semibold" style={{color:overperforming?'#10b981':'#ef4444'}}>
                    {overperforming?'Overperforming':'Underperforming'} xG on average
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LEADERBOARD VIEWS — same medal treatment as Simulator standings ── */}
      {!loading && listConfig && (
        <div className="rounded-2xl border overflow-hidden" style={{background:'rgba(10,14,26,0.88)',borderColor:`${activeView.color}20`}}>
          <div className="h-px" style={{background:`linear-gradient(90deg,transparent,${activeView.color}70,transparent)`}}/>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{borderColor:`${activeView.color}12`,background:`${activeView.color}07`}}>
            <span className="text-white font-black text-base uppercase tracking-widest">{activeView.label}</span>
            <span className="text-sm text-slate-400">{listConfig.data.length} players</span>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b" style={{borderColor:'rgba(255,255,255,0.05)',background:'rgba(255,255,255,0.02)'}}>
            <div className="col-span-1 text-center text-xs text-slate-500 uppercase tracking-widest font-bold">#</div>
            <div className="col-span-5 text-xs text-slate-500 uppercase tracking-widest font-bold">Player</div>
            <div className="col-span-2 text-center text-xs text-slate-500 uppercase tracking-widest font-bold">xG</div>
            <div className="col-span-2 text-center text-xs text-slate-500 uppercase tracking-widest font-bold">Goals</div>
            <div className="col-span-2 text-center text-xs text-slate-500 uppercase tracking-widest font-bold">
              {view==='efficiency'?'Eff%':view==='xa'?'xA Diff':'xG Diff'}
            </div>
          </div>

          <div className="divide-y" style={{borderColor:'rgba(255,255,255,0.04)'}}>
            {listConfig.data.map((p,idx)=>{
              const raw=p[listConfig.valKey];
              const val=raw!=null?(listConfig.valKey==='xgEff'?`${raw}%`:(raw>=0?`+${Number(raw).toFixed(1)}`:Number(raw).toFixed(1))):'—';
              const isPos=listConfig.positive?(raw>=0):(raw<=0);
              const col=isPos?activeView.color:'#ef4444';
              const maxAbs=Math.max(...listConfig.data.map(d=>Math.abs(Number(d[listConfig.valKey])||0)),1);
              const barW=Math.abs(Number(raw)||0)/maxAbs*100;
              const isTop3=idx<3;
              const medalGrads=[
                'linear-gradient(135deg,#f59e0b,#d97706)',
                'linear-gradient(135deg,#94a3b8,#64748b)',
                'linear-gradient(135deg,#b45309,#92400e)',
              ];
              return (
                <div key={p.id||idx}
                  className="grid grid-cols-12 gap-2 px-5 py-3 items-center transition-all hover:bg-white/[0.02]"
                  style={isTop3?{background:`${col}06`}:{}}>
                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">
                    {isTop3
                      ? <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black text-white" style={{background:medalGrads[idx]}}>{idx+1}</div>
                      : <span className="text-sm text-slate-400 font-black" style={{fontFamily:'JetBrains Mono'}}>{idx+1}</span>}
                  </div>
                  {/* Player */}
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    {p.photo
                      ? <img src={p.photo} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" onError={e=>e.target.style.display='none'}/>
                      : <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${col}12`}}>
                          <span className="font-black text-sm" style={{color:col}}>{(p.name||'?')[0]}</span>
                        </div>}
                    <div className="min-w-0">
                      <p className={`font-bold text-sm truncate ${isTop3?'text-white':'text-slate-200'}`}>{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.teamLogo&&<img src={p.teamLogo} alt="" className="w-3 h-3 flex-shrink-0"/>}
                        <span className="text-xs text-slate-400 truncate">{p.team}</span>
                      </div>
                    </div>
                  </div>
                  {/* xG */}
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-black text-slate-300" style={{fontFamily:'JetBrains Mono'}}>{(Number(p.xG)||0).toFixed(1)}</span>
                  </div>
                  {/* Goals */}
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-black text-white" style={{fontFamily:'JetBrains Mono'}}>{Number(p.goals)||0}</span>
                  </div>
                  {/* Main value + bar */}
                  <div className="col-span-2">
                    <div className="flex justify-end mb-1.5">
                      <span className="font-black text-base" style={{fontFamily:'JetBrains Mono',color:col}}>{val}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
                      <div className="h-full rounded-full transition-all duration-700" style={{width:`${barW}%`,backgroundColor:col,opacity:isTop3?1:0.6}}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {listConfig.data.length===0 && (
            <div className="py-14 text-center text-slate-400 text-base">No players match the current filters.</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══ MAIN ═══ */
function AnalysisPage({ onNavigate, navParams = {} }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('match');
  const [input, setInput] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('Premier League');
  const [analysis, setAnalysis] = useState('');
  const [mlData, setMlData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [mlError, setMlError] = useState('');
  const [homeImgFailed, setHomeImgFailed] = useState(false);
  const [awayImgFailed, setAwayImgFailed] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [savedPredictions, setSavedPredictions] = useState([]);
  const [toast, setToast] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [h2hData, setH2hData] = useState(null);
  const [homeFixtures, setHomeFixtures] = useState(null);
  const [awayFixtures, setAwayFixtures] = useState(null);
  const recognitionRef = useRef(null);
  const [autoResults, setAutoResults] = useState([]);
  const [showAuto, setShowAuto] = useState(false);
  const autoTimerRef = useRef(null);
  const LEAGUES = ['Premier League','La Liga','Bundesliga','Serie A','Ligue 1','Primeira Liga','Champions League'];
  const [compData, setCompData] = useState(null);
  const [teamsList, setTeamsList] = useState([]);
  const [compTeamA, setCompTeamA] = useState('');
  const [compTeamB, setCompTeamB] = useState('');
  const [matchHome, setMatchHome] = useState('');
  const [matchAway, setMatchAway] = useState('');
  const [tactFormation, setTactFormation] = useState('4-3-3');
  const [oppFormation, setOppFormation] = useState('4-4-2');
  const [tactData, setTactData] = useState(null);
  const [showExplain, setShowExplain] = useState(false);
  const [activeScenario, setActiveScenario] = useState('neutral');
  const [scorersData, setScorersData] = useState(null);

  useEffect(() => { checkBackend().then(setBackendOnline); }, []);
  useEffect(() => {
    if (activeTab === 'team' || activeTab === 'match') {
      getTeams(selectedLeague).then(data => {
        const list = Array.isArray(data) ? data : (data?.teams || []);
        setTeamsList(list.map(t => typeof t === 'string' ? t : (t.name || t.team || '')).filter(Boolean));
      }).catch(() => setTeamsList([]));
    }
  }, [selectedLeague, activeTab]);
  useEffect(() => { try { const s=localStorage.getItem('fa-saved-predictions'); if(s) setSavedPredictions(JSON.parse(s)); } catch(e){} }, []);

  // Auto-render tactical analysis the moment formations change — no Analyze click needed
  useEffect(() => {
    if (activeTab === 'tactical') {
      setTactData({ team: '', formation: tactFormation, oppFormation, stats: null, pred: null });
      setShowExplain(false);
    }
  }, [tactFormation, oppFormation, activeTab]); // eslint-disable-line

  useEffect(() => {
    if (activeTab !== 'player' || input.length < 2) { setAutoResults([]); setShowAuto(false); return; }
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    autoTimerRef.current = setTimeout(async () => {
      try {
        const resp = await fetchWithTimeout(`${API_BASE}/players/search?q=${encodeURIComponent(input)}&limit=30`);
        if (resp.ok) { const data = await resp.json(); setAutoResults(data); setShowAuto(data.length > 0); }
      } catch { setAutoResults([]); }
    }, 250);
    return () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current); };
  }, [input, activeTab]);

useEffect(() => {
  if (!navParams?.prefillQuery) return;
  const query = navParams.prefillQuery;
  // Switch tab first
  if (navParams.activeTab) {
    setActiveTab(navParams.activeTab);
  } else {
    const parts = query.split(/\s+vs\s+/i);
    if (parts.length === 2) {
      setMatchHome(parts[0].trim());
      setMatchAway(parts[1].trim());
      setActiveTab('match');
    } else {
      setActiveTab('scout');
    }
  }
  // Set input after tab switch with a delay so tab's setInput('') doesn't overwrite it
  setTimeout(() => setInput(query), 50);
}, [navParams]);

const analysisTypes = [
  {id:'match',    name:'Match Prediction', shortName:'Match',    icon:TrendingUpIcon,  placeholder:'Arsenal vs Chelsea',
    prompt:'Predict this match with detailed reasoning'},
  {id:'team',     name:'Team Comparison',  shortName:'Compare',  icon:CompareIcon,     placeholder:'Man City vs Arsenal',
    prompt:'Compare these two teams in depth'},
  {id:'scout',    name:'Scout Report',     shortName:'Scout',    icon:UserCheckIcon,   placeholder:'',
    prompt:''},
  {id:'xglab',    name:'xG Intelligence',  shortName:'xG Lab',   icon:TargetIcon,      placeholder:'',
    prompt:''},
  {id:'tactical', name:'Tactical Analysis',shortName:'Tactical', icon:LayersIcon,      placeholder:'4-3-3 vs 3-5-2',
    prompt:'Provide tactical analysis for this scenario'},
];
  const activeType = analysisTypes.find(t=>t.id===activeTab);

  const toggleVoice = useCallback(() => {
    if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){setMlError('Voice not supported');return;}
    if(isListening){recognitionRef.current?.stop();setIsListening(false);return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;const rec=new SR();
    rec.continuous=false;rec.interimResults=false;rec.lang='en-US';
    rec.onresult=(e)=>{setInput(e.results[0][0].transcript);setIsListening(false);};
    rec.onerror=()=>setIsListening(false);rec.onend=()=>setIsListening(false);
    recognitionRef.current=rec;rec.start();setIsListening(true);
  },[isListening]);

  const savePrediction = () => {
    if(!mlData&&!analysis)return;
    const entry={id:Date.now(),date:new Date().toLocaleDateString(),tab:activeTab,query:input,league:selectedLeague,mlData,analysisSummary:analysis?analysis.substring(0,200)+'...':''};
    const upd=[entry,...savedPredictions].slice(0,20);
    setSavedPredictions(upd);localStorage.setItem('fa-saved-predictions',JSON.stringify(upd));
    setToast('Prediction saved!'); setTimeout(() => setToast(''), 2500);
    if(activeTab==='match'&&mlData){
      if (user) { saveToSupabase({homeTeam:mlData.home_team_name||input.split(/\s+vs\s+/i)[0]?.trim()||matchHome,awayTeam:mlData.away_team_name||input.split(/\s+vs\s+/i)[1]?.trim()||matchAway,league:selectedLeague,home_win:mlData.home_win,draw:mlData.draw,away_win:mlData.away_win,predicted_outcome:mlData.predicted_outcome,predicted_score:mlData.predicted_score,matchDate:new Date().toISOString(),source:'analysis'}, user.id).catch(()=>{}); }
    }
  };

  const deleteSaved = (id) => { const u=savedPredictions.filter(p=>p.id!==id);setSavedPredictions(u);localStorage.setItem('fa-saved-predictions',JSON.stringify(u)); };

  const fetchH2H = async (home,away) => {
    try {
      const resp = await fetchWithTimeout(`${API_BASE}/h2h/${encodeURIComponent(home)}/${encodeURIComponent(away)}?league=${encodeURIComponent(selectedLeague)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.matches && data.matches.length > 0) {
          const matches = data.matches.slice(0, 8);
          const homeWins = matches.filter(m => { const isHome = m.homeTeam.toLowerCase().includes(home.toLowerCase()); return isHome ? m.homeGoals > m.awayGoals : m.awayGoals > m.homeGoals; }).length;
          const awayWins = matches.filter(m => { const isAway = m.awayTeam.toLowerCase().includes(away.toLowerCase()); return isAway ? m.awayGoals > m.homeGoals : m.homeGoals > m.awayGoals; }).length;
          const draws = matches.filter(m => m.homeGoals === m.awayGoals).length;
          setH2hData({ matches, homeWins, draws, awayWins, homeName: home, awayName: away });
        }
      }
    } catch (e) { console.error('H2H fetch failed:', e); }
  };

  const fetchTeamFixtures = async (teamName, setter) => {
    try {
const resp = await fetchWithTimeout(`${API_BASE}/team-fixtures?team=${encodeURIComponent(teamName)}&last=10&league=${encodeURIComponent(selectedLeague)}`);      if (resp.ok) { const data = await resp.json(); if (data.fixtures && data.fixtures.length > 0) setter(data); }
    } catch (e) { console.error('Fixtures fetch failed:', e); }
  };

  const getMLPrediction = async () => {
    if(!backendOnline)return null;
    try{
      if(activeTab==='match'){
        const home=matchHome||input.split(/\s+vs\s+/i)[0]?.trim();
        const away=matchAway||input.split(/\s+vs\s+/i)[1]?.trim();if(home&&away)
        {const cleanName=(n)=>n.replace(/^fc\s+/i,'').replace(/^afc\s+/i,'').replace(/\s+fc$/i,'').replace(/\s+afc$/i,'').replace(/\s+cf$/i,'').replace(/\s+sc$/i,'').trim();
        const r=await predictMatch(home,away,selectedLeague);fetchH2H(cleanName(home),cleanName(away));fetchTeamFixtures(home,setHomeFixtures);
        fetchTeamFixtures(away,setAwayFixtures);
        fetchWithTimeout(`${API_BASE}/predicted-scorers/${encodeURIComponent(cleanName(home))}/${encodeURIComponent(cleanName(away))}?league=${encodeURIComponent(selectedLeague)}`).then(r => r.json()).then(setScorersData).catch(() => {});
        return r;}}
      if(activeTab==='team'){
        const tA = compTeamA || input.split(/\s+vs\s+/i)[0]?.trim();
        const tB = compTeamB || input.split(/\s+vs\s+/i)[1]?.trim();
        if(tA && tB){
          const [resAB] = await Promise.allSettled([predictMatch(tA, tB, selectedLeague)]);
          const predAB = resAB.status==='fulfilled' ? resAB.value : null;
          fetchH2H(tA, tB); fetchTeamFixtures(tA, setHomeFixtures); fetchTeamFixtures(tB, setAwayFixtures);
          if (predAB) { setCompData({ teamA:{name:tA,...deriveTeamStats(predAB,'home')}, teamB:{name:tB,...deriveTeamStats(predAB,'away')}, predAB }); }
          else { setCompData(null); throw new Error(`Could not find one or both teams in ${selectedLeague}`); }
          return predAB;
        }
      }
      if(activeTab==='player'){
        if(input.trim()){ try { const r = await analyzePlayer(input.trim(), selectedLeague); return r; } catch(e) { throw new Error(e.message); } }
      }
      if(activeTab==='tactical'){
        const team = input.trim();
        const isFormation = /^[\d][-\d\s]+[\d]/.test(team);
        const isValidTeam = team && !isFormation && teamsList.includes(team);
        if(isValidTeam){ try { const pred = await predictMatch(team, selectedLeague, selectedLeague); setTactData({team, formation:tactFormation, oppFormation, stats:deriveTeamStats(pred,'home'), pred}); return pred; } catch(e) { setTactData({team, formation:tactFormation, oppFormation, stats:null, pred:null}); return null; } }
        else { setTactData({ team: isFormation ? '' : (team || 'Select a team'), formation: tactFormation, oppFormation, stats: null, pred: null }); return null; }
      }
    }catch(e){throw new Error(e.message);}return null;
  };

  const getAIAnalysis = async (mlResult) => {
    let mlContext = '';
    if (mlResult && activeTab === 'match') { mlContext = `\nStatistical data:\n- ${mlResult.key_factors?.join('\n- ') || ''}\n- Predicted: ${mlResult.predicted_outcome} (${(mlResult.confidence * 100).toFixed(1)}%)\n`; }
    if (mlResult && activeTab === 'player') { mlContext = `\nML Rating: Overall ${mlResult.overall_rating}, Attack ${mlResult.attacking}, Defense ${mlResult.defending}\n`; }
    let managerContext = '';
    if (activeTab === 'match' || activeTab === 'team') {
      const parts = input.split(/\s+vs\s+/i);
      if (parts.length === 2) {
        const managerMap = {'real madrid':'Álvaro Arbeloa (appointed Jan 2026, promoted from Castilla. Style: passionate, tactical, uses 4-3-3)','barcelona':'Hansi Flick (Style: high press, quick transitions, 4-2-3-1)','atletico':'Diego Simeone (Style: defensive solidity, 4-4-2)','arsenal':'Mikel Arteta (Style: high press, positional play, 4-3-3)','manchester city':'Pep Guardiola (Style: possession, positional play, fluid formations)','liverpool':'Arne Slot (Style: controlled possession, 4-2-3-1)','chelsea':'Liam Rosenior (appointed Jan 2026, replaced Enzo Maresca)','manchester united':'Michael Carrick (appointed Jan 2026, replaced Ruben Amorim)','newcastle':'Eddie Howe (Style: aggressive counter-press, 4-3-3)','aston villa':'Unai Emery (Style: intense pressing, 4-2-3-1)','tottenham':'Caretaker manager (Thomas Frank sacked Feb 2026)','psg':'Luis Enrique (Style: high-tempo possession, 4-3-3)','bayern':'Vincent Kompany (Style: possession, high line, 4-2-3-1)','inter':'Simone Inzaghi (Style: tactical versatility, 3-5-2)','napoli':'Antonio Conte (Style: defensive organization, 3-5-2)','juventus':'Thiago Motta (Style: controlled possession, 4-2-3-1)','ac milan':'Massimiliano Allegri (returned 2025, pragmatic)','dortmund':'Nuri Şahin (Style: attacking transitions, 4-2-3-1)','leverkusen':'Kasper Hjulmand (replaced Ten Hag after 62 days)','marseille':'Roberto De Zerbi (Style: progressive build-up, 3-4-3)','wolves':'Rob Edwards','brighton':'Fabian Hürzeler','bournemouth':'Andoni Iraola','fulham':'Marco Silva','crystal palace':'Oliver Glasner','west ham':'Nuno Espírito Santo'};
        const transferMap = {'real madrid':'KEY: Trent Alexander-Arnold joined from Liverpool (summer 2025). Mbappé is the star forward. Bellingham, Vinicius Jr., Rodrygo in attack. Rüdiger & Militão in defense.','barcelona':'KEY: Marcus Rashford joined from Man United (Jan 2026). Lamine Yamal is breakout star. Lewandowski, Raphinha in attack. Pedri, Gavi in midfield.','liverpool':'KEY: Florian Wirtz joined from Leverkusen (summer 2025). Trent Alexander-Arnold LEFT to Real Madrid. Salah, Diaz in attack. Van Dijk in defense.','manchester city':'KEY: De Bruyne LEFT to Napoli. Haaland remains the focal point. Foden, Bernardo Silva, Rodri in midfield.','napoli':'KEY: Kevin De Bruyne joined from Man City. Osimhen or Lukaku as striker.','chelsea':'KEY: Manager changed Jan 2026 (Maresca to Rosenior). Palmer, Nkunku in attack.','manchester united':'KEY: Rashford LEFT to Barcelona (Jan 2026). Manager changed Jan 2026 (Amorim to Carrick). Hojlund, Bruno Fernandes, Garnacho.'};
        const findManager = (name) => { const lower = name.toLowerCase().trim(); for (const [key, mgr] of Object.entries(managerMap)) { if (lower.includes(key)) return mgr; } return null; };
        const findTransfers = (name) => { const lower = name.toLowerCase().trim(); for (const [key, info] of Object.entries(transferMap)) { if (lower.includes(key)) return info; } return null; };
        const hMgr = findManager(parts[0]); const aMgr = findManager(parts[1]);
        const hTransfers = findTransfers(parts[0]); const aTransfers = findTransfers(parts[1]);
        managerContext = '\n\nCRITICAL CONTEXT (2025-26 season — you MUST use this info):\n';
        if (hMgr) managerContext += `${parts[0].trim()} manager: ${hMgr}\n`;
        if (aMgr) managerContext += `${parts[1].trim()} manager: ${aMgr}\n`;
        if (hTransfers) managerContext += `${parts[0].trim()} squad: ${hTransfers}\n`;
        if (aTransfers) managerContext += `${parts[1].trim()} squad: ${aTransfers}\n`;
        managerContext += '\nRULES:\n- Do NOT mention Carlo Ancelotti for Real Madrid (he left May 2025)\n- Do NOT mention Xabi Alonso for Real Madrid (sacked Jan 2026)\n- Do NOT mention Enzo Maresca for Chelsea (left Jan 2026)\n- Do NOT mention Ruben Amorim for Man United (sacked Jan 2026)\n- Do NOT mention De Bruyne at Man City (transferred to Napoli)\n- Do NOT mention Trent at Liverpool (transferred to Real Madrid)\n- Do NOT mention Rashford at Man United (transferred to Barcelona Jan 2026)\n- Use ONLY the managers and players listed above\n';
      }
    }
    const prompt = `You are a professional football analyst writing for a top sports publication.\n\nIMPORTANT RULES:\n- 
    DO NOT say you lack data or cannot predict\n-
    DO NOT mention training cutoffs or knowledge limitations\n- 
    DO NOT show bias toward any team — analyze BOTH sides fairly\n- Give EQUAL attention to both teams' strengths AND weaknesses\n-
     If data suggests the away team is stronger, say so clearly\n-
      Base your analysis on the statistical data provided below\n\nLeague: ${selectedLeague}\nTask: ${activeType.prompt}: ${input}\n${mlContext}${managerContext}\nWrite a focused, confident analysis. Keep it concise but insightful. Use specific player names. Format with markdown headers. MAX 500 words.\n\n${activeTab === 'match' ? `Cover:\n## Form Analysis (both teams equally)\n## Key Matchups (3-4 critical player battles)\n## Tactical Setup (each manager's likely approach)\n## Prediction (specific scoreline with reasoning)` : ''}${activeTab === 'player' ? `Cover:\n## Current Form & Stats\n## Strengths & Weaknesses\n## Tactical Role\n## Verdict` : ''}${activeTab === 'team' ? `Cover:\n## Squad Comparison\n## Tactical Identity\n## Key Advantage\n## Verdict` : ''}${activeTab === 'tactical' ? `Cover:\n## Formation Structure\n## Key Player Roles\n## Strengths & Vulnerabilities\n## Counter-Tactics` : ''}\n\nBe opinionated. If one team is clearly better, say so.`;
    const resp = await fetchWithTimeout(`${API_BASE}/api/analyze`, {method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: prompt }], tools: [{ type: "google_search" }] }) });
    const data = await resp.json();
    let full = '';
    if (data?.content && Array.isArray(data.content)) full = data.content.filter(i => i?.type === 'text').map(i => i.text).join('\n');
    return full || 'Unable to generate analysis.';
  };

  const analyzeFootball = async () => {
    if(activeTab==='team'&&!compTeamA&&!compTeamB&&!input.includes('vs'))return;
    if(activeTab!=='team'&&!input.trim())return;
    setLoading(true);setAnalysis('');setMlData(null);setMlError('');setH2hData(null);setHomeFixtures(null);setAwayFixtures(null);setScorersData(null);setCompData(null);setTactData(null);setScorersData(null);
    setHomeImgFailed(false);setAwayImgFailed(false);setCompData(null);setTactData(null);setMatchHome('');setMatchAway('');
    let mlResult = null;
    try {
      mlResult = await getMLPrediction();
      if (mlResult) {
        setMlData(mlResult);
        if (activeTab === 'match' && user) { saveToSupabase({ homeTeam: input.split(/\s+vs\s+/i)[0]?.trim() || matchHome, awayTeam: input.split(/\s+vs\s+/i)[1]?.trim() || matchAway, league: selectedLeague, home_win: mlResult.home_win, draw: mlResult.draw, away_win: mlResult.away_win, predicted_outcome: mlResult.predicted_outcome, predicted_score: mlResult.predicted_score }, user.id).catch(() => {}); }
      }
    } catch (e) { setMlError(e.message || 'ML prediction failed'); }
    try { const aiResult = await getAIAnalysis(mlResult); setAnalysis(aiResult); } catch (e) { setAnalysis('Unable to generate AI analysis.'); }
    setLoading(false);
    setInput(''); // clear search bar after analysis completes
  };

  /* Markdown Renderer (UNCHANGED) */
  const renderMarkdown = (text) => {
    if(!text)return null;
    const fmt=(s)=>s.replace(/\*\*\*(.*?)\*\*\*/g,'<strong class="text-cyan-300"><em>$1</em></strong>').replace(/\*\*(.*?)\*\*/g,'<strong class="text-white font-semibold">$1</strong>').replace(/\*(.*?)\*/g,'<em class="text-cyan-400/70">$1</em>');
    const sections=[];let cur={title:'',level:0,content:[]};
    text.split('\n').forEach(line=>{const t=line.trim();if(/^#{1,3}\s+/.test(t)){if(cur.title||cur.content.length)sections.push({...cur});const lv=t.startsWith('### ')?3:t.startsWith('## ')?2:1;cur={title:t.replace(/^#{1,3}\s+/,'').replace(/\*\*/g,''),level:lv,content:[]};}else if(t)cur.content.push(t);});
    if(cur.title||cur.content.length)sections.push(cur);
    const getTheme=(title)=>{const t=title.toLowerCase();
      if(/form|recent|momentum/.test(t))return{bar:'from-emerald-500 to-emerald-400',icon:<BarChartIcon className="w-4 h-4 text-emerald-400"/>,badge:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',glow:'shadow-emerald-500/5'};
      if(/predict|scoreline|verdict|outcome/.test(t))return{bar:'from-yellow-500 to-amber-400',icon:<TargetIcon className="w-4 h-4 text-yellow-400"/>,badge:'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',glow:'shadow-yellow-500/10'};
      if(/tactic|formation|setup|consideration|approach/.test(t))return{bar:'from-cyan-500 to-blue-400',icon:<LayersIcon className="w-4 h-4 text-cyan-400"/>,badge:'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',glow:'shadow-cyan-500/5'};
      if(/key|matchup|battle|critical|factor|duel/.test(t))return{bar:'from-orange-500 to-red-400',icon:<ZapIcon className="w-4 h-4 text-orange-400"/>,badge:'bg-orange-500/10 text-orange-400 border-orange-500/20',glow:'shadow-orange-500/5'};
      if(/strength|weakness|comparison/.test(t))return{bar:'from-purple-500 to-violet-400',icon:<AwardIcon className="w-4 h-4 text-purple-400"/>,badge:'bg-purple-500/10 text-purple-400 border-purple-500/20',glow:'shadow-purple-500/5'};
      if(/player|squad|lineup|team/.test(t))return{bar:'from-blue-500 to-indigo-400',icon:<UserCheckIcon className="w-4 h-4 text-blue-400"/>,badge:'bg-blue-500/10 text-blue-400 border-blue-500/20',glow:'shadow-blue-500/5'};
      if(/conclusion|summary|overall|verdict|final/.test(t))return{bar:'from-emerald-400 to-teal-400',icon:<FlagIcon className="w-4 h-4 text-emerald-400"/>,badge:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',glow:'shadow-emerald-500/5'};
      if(/overview|intro|context/.test(t))return{bar:'from-slate-400 to-slate-300',icon:<CrosshairIcon className="w-4 h-4 text-slate-400"/>,badge:'bg-white/5 text-slate-400 border-white/20',glow:''};
      return{bar:'from-slate-500 to-slate-400',icon:<CrosshairIcon className="w-4 h-4 text-slate-400"/>,badge:'bg-white/5 text-slate-400 border-white/20',glow:''};
    };
    const renderLines=(lines)=>{const els=[];let list=[];let lk=0;
      const flush=()=>{if(list.length){els.push(<div key={`l-${lk++}`} className="space-y-1 my-2.5">{list.map((item,i)=><div key={i} className="flex items-start gap-3 group"><div className="w-1 h-1 bg-cyan-400/60 rounded-full mt-2 flex-shrink-0 group-hover:bg-cyan-400 transition-colors"/><span className="text-slate-300 text-[15px] leading-[1.75]" dangerouslySetInnerHTML={{__html:fmt(item)}}/></div>)}</div>);list=[];}};
      lines.forEach((line,i)=>{
        if(/^\d+\.\s+/.test(line)){flush();const c=line.replace(/^\d+\.\s+/,'');const n=line.match(/^(\d+)/)[1];els.push(<div key={`n-${i}`} className="flex items-start gap-3 my-2"><span className="w-6 h-6 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400 text-base font-bold flex-shrink-0 mt-0.5" style={{fontFamily:'JetBrains Mono'}}>{n}</span><span className="text-slate-300 text-[15px] leading-[1.75]" dangerouslySetInnerHTML={{__html:fmt(c)}}/></div>);}
        else if(/^[-*•]\s+/.test(line)) list.push(line.replace(/^[-*•]\s+/,''));
        else{flush();els.push(<p key={`p-${i}`} className="text-slate-300 text-[15px] leading-[1.75] my-1.5" dangerouslySetInnerHTML={{__html:fmt(line)}}/>);}
      });flush();return els;};
    const intro=sections.length>0&&!sections[0].title?sections.shift():null;
    const isPred=(t)=>/predict|scoreline|verdict|outcome/i.test(t);
    return(
      <div className="space-y-5">
        {intro?.content.length>0&&(<div className="relative pl-4 border-l-2 border-white/20"><div className="text-slate-300 text-[15px] leading-[1.8]">{intro.content.map((l,i)=><p key={i} className="my-1" dangerouslySetInnerHTML={{__html:fmt(l)}}/>)}</div></div>)}
        {sections.map((s,idx)=>{const th=getTheme(s.title);const prediction=isPred(s.title);return(<div key={idx} className={`relative rounded-xl overflow-hidden ${th.glow} transition-all`} style={{animation:`fadeSlideIn 0.3s ease-out ${idx*0.08}s both`}}><div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${th.bar}`}/><div className={`ml-1 ${prediction?'bg-gradient-to-br from-yellow-500/[0.06] via-[#111827]/90 to-amber-500/[0.03]':'bg-[#111827]/70'} border border-white/12 rounded-r-xl`}><div className={`px-5 py-3.5 flex items-center gap-3`}><div className={`w-8 h-8 rounded-lg ${th.badge} border flex items-center justify-center flex-shrink-0`}>{th.icon}</div><div className="flex-1 min-w-0"><h3 className={`font-bold text-white ${s.level===1?'text-base':'text-based'} leading-tight`}>{s.title}</h3></div>{prediction&&(<span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-400 text-base font-bold uppercase tracking-wider">Verdict</span>)}</div>{s.content.length>0&&(<div className={`px-5 pb-4 ${prediction?'':'border-t border-white/20 pt-2'}`}>{prediction?(<div className="bg-black/20 rounded-lg p-4 border border-yellow-500/10 mt-1">{renderLines(s.content)}</div>):renderLines(s.content)}</div>)}</div></div>);})}
      </div>
    );
  };

  /* ═══════════════════════════════════════
     MATCH PREDICTION — COMPLETELY UNCHANGED
     ═══════════════════════════════════════ */
  const renderMatchPrediction = () => {
    if (!mlData || activeTab !== 'match') return null;
    const { home_win, draw, away_win, predicted_outcome, confidence, key_factors,
            home_form_sequence, away_form_sequence, home_crest, away_crest,
            home_team_name, away_team_name } = mlData;
    const teams  = { home: home_team_name || 'Home', away: away_team_name || 'Away' };
    const homeForm = home_form_sequence || [];
    const awayForm = away_form_sequence || [];
    const streaks  = key_factors?.filter(f => /streak|declining|improving|above|below/i.test(f)) || [];
    const tableFac = key_factors?.find(f => f.includes('Table:'));
    const xgFac    = key_factors?.find(f => f.includes('Season xG'));
    const homeFormation = '4-3-3';
    const awayFormation = '4-2-3-1';

    const winnerIsHome = (home_win||0) > (away_win||0);
    const isDraw       = Math.abs((home_win||0) - (away_win||0)) < 0.08;
    const winnerTeam   = isDraw ? null : winnerIsHome ? teams.home : teams.away;
    const winnerCrest  = isDraw ? null : winnerIsHome ? home_crest : away_crest;
    const winnerColor  = isDraw ? '#f59e0b' : winnerIsHome ? '#22d3ee' : '#a855f7';
    const winnerPct    = isDraw ? (draw*100).toFixed(1) : winnerIsHome ? (home_win*100).toFixed(1) : (away_win*100).toFixed(1);

    return (
      <div className="space-y-4 mb-6" style={{animation:'fadeSlideIn 0.4s ease-out'}}>

        {/* ══ PREDICTED WINNER HERO — mirrors Simulator champion card ══ */}
        <div className="relative rounded-3xl overflow-hidden" style={{animation:'fadeSlideIn 0.5s ease-out'}}>
          <div className="absolute inset-0" style={{
            background: isDraw
              ? 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.04),transparent)'
              : `linear-gradient(135deg,${winnerColor}18,${winnerColor}06,transparent)`,
          }}/>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px]" style={{background:`${winnerColor}10`}}/>
          <div className="relative border rounded-3xl p-4 md:p-8 overflow-visible" style={{
            borderColor: isDraw ? 'rgba(245,158,11,0.2)' : `${winnerColor}30`,
          }}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
              <ZapIcon className="w-4 h-4" style={{color: winnerColor}}/>
              <span className="font-bold text-sm uppercase tracking-[0.2em]" style={{color: winnerColor}}>
                {isDraw ? 'Draw Predicted' : 'Predicted Winner'}
              </span>
              <span className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                style={{background:'rgba(34,211,238,0.06)',borderColor:'rgba(34,211,238,0.2)',color:'#22d3ee'}}>
                <CheckIcon className="w-3 h-3"/> Poisson v2.1
              </span>
            </div>

            {/* Teams face-off */}
{/* Teams face-off */}
{/* MOBILE: donut top, teams bottom row */}
{/* DESKTOP: home | donut | away side by side */}
<div className="hidden sm:flex items-center gap-8">
  {/* Home */}
  <div className="flex items-center gap-4 flex-1 min-w-0">
    <div className="w-20 h-20 rounded-2xl flex items-center justify-center p-2.5 flex-shrink-0 border"
      style={{background:'rgba(255,255,255,0.05)',borderColor:winnerIsHome&&!isDraw?`${winnerColor}40`:'rgba(255,255,255,0.1)'}}>
      {home_crest && !homeImgFailed
        ? <img src={home_crest} alt="" className="w-full h-full object-contain" onError={()=>setHomeImgFailed(true)}/>
        : <ShieldIcon className="w-8 h-8 text-cyan-400/40"/>}
    </div>
    <div>
      <p className="text-white font-black text-2xl leading-tight">{teams.home}</p>
      <p className="text-sm font-semibold mt-0.5" style={{color:'rgba(34,211,238,0.7)'}}>Home</p>
      {winnerIsHome && !isDraw && (
        <div className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full inline-flex"
          style={{background:`${winnerColor}15`,border:`1px solid ${winnerColor}30`}}>
          <AwardIcon className="w-3 h-3" style={{color:winnerColor}}/>
          <span className="text-xs font-bold" style={{color:winnerColor}}>Predicted</span>
        </div>
      )}
    </div>
  </div>
  {/* Donut */}
  <div className="flex flex-col items-center gap-2 flex-shrink-0">
    <DonutChart homeWin={home_win} draw={draw} awayWin={away_win} homeName={teams.home} awayName={teams.away} size={130}/>
    <div className="text-center">
      <p className="text-white font-black text-lg" style={{fontFamily:'JetBrains Mono'}}>{predicted_outcome}</p>
      {mlData?.confidence_level && <ConfidenceLevelBadge level={mlData.confidence_level}/>}
    </div>
  </div>
  {/* Away */}
  <div className="flex items-center gap-4 flex-1 min-w-0 flex-row-reverse">
    <div className="w-20 h-20 rounded-2xl flex items-center justify-center p-2.5 flex-shrink-0 border"
      style={{background:'rgba(255,255,255,0.05)',borderColor:!winnerIsHome&&!isDraw?'rgba(168,85,247,0.4)':'rgba(255,255,255,0.1)'}}>
      {away_crest && !awayImgFailed
        ? <img src={away_crest} alt="" className="w-full h-full object-contain" onError={()=>setAwayImgFailed(true)}/>
        : <ShieldIcon className="w-8 h-8 text-red-400/40"/>}
    </div>
    <div className="text-right">
      <p className="text-white font-black text-2xl leading-tight">{teams.away}</p>
      <p className="text-sm font-semibold mt-0.5" style={{color:'rgba(239,68,68,0.7)'}}>Away</p>
      {!winnerIsHome && !isDraw && (
        <div className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full inline-flex"
          style={{background:'rgba(168,85,247,0.15)',border:'1px solid rgba(168,85,247,0.3)'}}>
          <AwardIcon className="w-3 h-3 text-purple-400"/>
          <span className="text-xs font-bold text-purple-400">Predicted</span>
        </div>
      )}
    </div>
  </div>
</div>

{/* MOBILE ONLY */}
<div className="flex flex-col items-center gap-3 sm:hidden">
  <DonutChart homeWin={home_win} draw={draw} awayWin={away_win} homeName={teams.home} awayName={teams.away} size={160}/>
  <div className="text-center">
    <p className="text-white font-black text-lg" style={{fontFamily:'JetBrains Mono'}}>{predicted_outcome}</p>
    {mlData?.confidence_level && <ConfidenceLevelBadge level={mlData.confidence_level}/>}
  </div>
  <div className="flex items-center justify-between w-full px-2 mt-1">
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center p-1.5 border flex-shrink-0"
        style={{background:'rgba(255,255,255,0.05)',borderColor:'rgba(255,255,255,0.1)'}}>
        {home_crest && !homeImgFailed
          ? <img src={home_crest} alt="" className="w-full h-full object-contain" onError={()=>setHomeImgFailed(true)}/>
          : <ShieldIcon className="w-5 h-5 text-cyan-400/40"/>}
      </div>
      <div>
        <p className="text-white font-bold text-xs leading-tight">{teams.home}</p>
        <p className="text-cyan-400 text-xs">Home</p>
      </div>
    </div>
    <div className="flex items-center gap-2 flex-row-reverse">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center p-1.5 border flex-shrink-0"
        style={{background:'rgba(255,255,255,0.05)',borderColor:'rgba(255,255,255,0.1)'}}>
        {away_crest && !awayImgFailed
          ? <img src={away_crest} alt="" className="w-full h-full object-contain" onError={()=>setAwayImgFailed(true)}/>
          : <ShieldIcon className="w-5 h-5 text-red-400/40"/>}
      </div>
      <div className="text-right">
        <p className="text-white font-bold text-xs leading-tight">{teams.away}</p>
        <p className="text-red-400 text-xs">Away</p>
      </div>
    </div>
  </div>
</div>
          </div>
        </div>

        {/* ══ 4 STAT CARDS — mirrors Simulator summary grid ══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label:'Win Probability', icon:TargetIcon,
              value:`${winnerPct}%`,
              sub: isDraw ? 'Draw favoured' : `${winnerTeam} favoured`,
              color:'#22d3ee',
              grad:'from-cyan-500/15 to-cyan-600/5',
            },
            {
              label:'Predicted Score', icon:ZapIcon,
              value: mlData?.predicted_score || '—',
              sub:'Most likely scoreline',
              color:'#a855f7',
              grad:'from-purple-500/15 to-purple-600/5',
            },
            {
              label:'Expected Goals', icon:BarChartIcon,
              value:`${mlData?.home_expected_goals?.toFixed(1)||'—'} – ${mlData?.away_expected_goals?.toFixed(1)||'—'}`,
              sub:`${teams.home} vs ${teams.away}`,
              color:'#f59e0b',
              grad:'from-amber-500/15 to-amber-600/5', 
            },
            {
              label:'Match Difficulty', icon:ShieldIcon,
              value:`${mlData?.match_difficulty||5}/10`,
              sub:(mlData?.match_difficulty||5)>=8?'Razor-thin':(mlData?.match_difficulty||5)>=6?'Highly competitive':'Competitive',
              color:'#10b981',
              grad:'from-emerald-500/15 to-emerald-600/5',
            },
          ].map((s,i) => (
            <div key={i} className={`bg-gradient-to-br ${s.grad} rounded-2xl p-4 border border-white/12 relative overflow-hidden`}
              style={{animation:`fadeSlideIn 0.3s ease-out ${i*0.08}s both`}}>
              <div className="absolute top-0 right-0 w-16 h-16" style={{background:`radial-gradient(circle,${s.color}15,transparent)`}}/>
              <s.icon className="w-4 h-4 mb-2" style={{color:s.color}}/>
              <p className="text-2xl font-black text-white mb-0.5" style={{fontFamily:'JetBrains Mono'}}>{s.value}</p>
              <p className="text-sm text-slate-400 leading-tight">{s.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ══ WIN PROBABILITY BARS ══ */}
        <div className="rounded-2xl border border-white/12 overflow-hidden" style={{background:'rgba(10,14,26,0.8)'}}>
          <div className="px-5 py-3.5 border-b border-white/12 flex items-center gap-2" style={{background:'rgba(34,211,238,0.04)'}}>
            <BarChartIcon className="w-4 h-4 text-cyan-400"/>
            <span className="text-white font-bold text-sm uppercase tracking-widest">Win Probabilities</span>
          </div>
          <div className="p-5 space-y-3">
            {[
              {l:teams.home, v:home_win, c:'#22d3ee', bg:'from-cyan-500/20 to-cyan-600/5', bar:'bg-cyan-500'},
              {l:'Draw',     v:draw,     c:'#f59e0b', bg:'from-amber-500/20 to-amber-600/5', bar:'bg-amber-500'},
              {l:teams.away, v:away_win, c:'#a855f7', bg:'from-purple-500/20 to-purple-600/5', bar:'bg-purple-500'},
            ].map(p => (
              <div key={p.l} className={`bg-gradient-to-r ${p.bg} rounded-xl p-3.5 border border-white/12`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-semibold text-sm">{p.l}</span>
                  <span className="text-lg font-black" style={{fontFamily:'JetBrains Mono',color:p.c}}>{(p.v*100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full ${p.bar} transition-all duration-1000`} style={{width:`${p.v*100}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ xG + CONFIDENCE + DIFFICULTY ══ */}
        <div className="grid grid-cols-1 gap-4">
          {/* Left — xG split + Confidence */}
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/12 overflow-hidden" style={{background:'rgba(10,14,26,0.8)'}}>
              <div className="px-4 py-3 border-b border-white/12 flex items-center gap-2" style={{background:'rgba(245,158,11,0.05)'}}>
                <TargetIcon className="w-4 h-4 text-amber-400"/>
                <span className="text-white font-bold text-sm uppercase tracking-widest">Expected Goals</span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-cyan-400 font-black text-2xl" style={{fontFamily:'JetBrains Mono'}}>{mlData?.home_expected_goals?.toFixed(2)||'—'}</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden flex" style={{background:'rgba(255,255,255,0.06)'}}>
                    <div className="h-full rounded-l-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-1000"
                      style={{width:`${((mlData?.home_expected_goals||0)/((mlData?.home_expected_goals||0.01)+(mlData?.away_expected_goals||0.01)))*100}%`}}/>
                    <div className="h-full rounded-r-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-1000"
                      style={{width:`${((mlData?.away_expected_goals||0)/((mlData?.home_expected_goals||0.01)+(mlData?.away_expected_goals||0.01)))*100}%`}}/>
                  </div>
                  <span className="text-purple-400 font-black text-2xl" style={{fontFamily:'JetBrains Mono'}}>{mlData?.away_expected_goals?.toFixed(2)||'—'}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{teams.home}</span>
                  <span>{teams.away}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/12 overflow-hidden" style={{background:'rgba(10,14,26,0.8)'}}>
              <div className="px-4 py-3 border-b border-white/12 flex items-center gap-2" style={{background:'rgba(16,185,129,0.05)'}}>
                <ShieldIcon className="w-4 h-4 text-emerald-400"/>
                <span className="text-white font-bold text-sm uppercase tracking-widest">Match Difficulty</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  {Array.from({length:10},(_,i)=>(
                    <div key={i} className={`rounded-full transition-all duration-700 ${
                      i<(mlData?.match_difficulty||5)
                        ? (mlData?.match_difficulty||5)>=8 ? 'w-4 h-4 bg-red-500'
                          : (mlData?.match_difficulty||5)>=6 ? 'w-4 h-4 bg-amber-500'
                          : 'w-4 h-4 bg-emerald-500'
                        : 'w-3 h-3 bg-white/10'
                    }`} style={{transitionDelay:`${i*50}ms`}}/>
                  ))}
                </div>
                <p className="text-center text-white font-bold text-base">
                  {(mlData?.match_difficulty||5)>=9?'Razor-thin':(mlData?.match_difficulty||5)>=7?'Highly competitive':(mlData?.match_difficulty||5)>=5?'Competitive':'One-sided'}
                </p>
              </div>
            </div>
          </div>

          {/* Right — Confidence + Scorelines */}
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/12 overflow-hidden" style={{background:'rgba(10,14,26,0.8)'}}>
              <div className="px-4 py-3 border-b border-white/12 flex items-center gap-2" style={{background:'rgba(168,85,247,0.05)'}}>
                <ZapIcon className="w-4 h-4 text-purple-400"/>
                <span className="text-white font-bold text-sm uppercase tracking-widest">Confidence & Scorelines</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-center mb-4">
                  <ConfidenceGauge confidence={confidence}/>
                </div>
                {mlData?.top_scorelines?.slice(0,3).map((s,i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl mb-1.5 border border-white/12"
                    style={{background: i===0 ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.02)'}}>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">#{i+1} Most Likely</span>
                    <span className="font-black text-white text-base" style={{fontFamily:'JetBrains Mono'}}>{s.score}</span>
                    <span className="text-xs font-bold" style={{color: i===0?'#a855f7':'#64748b'}}>{s.probability}%</span>
                  </div>
                ))}
                {!mlData?.top_scorelines && mlData?.predicted_score && (
                  <div className="text-center">
                    <p className="text-4xl font-black text-white" style={{fontFamily:'JetBrains Mono'}}>{mlData.predicted_score}</p>
                    <p className="text-slate-400 text-sm mt-1">Predicted score</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══ FORM MOMENTUM ══ */}
        <div className="rounded-2xl border border-white/12 overflow-hidden" style={{background:'rgba(10,14,26,0.8)'}}>
          <div className="px-5 py-3.5 border-b border-white/12 flex items-center gap-2" style={{background:'rgba(255,255,255,0.02)'}}>
            <BarChartIcon className="w-4 h-4 text-cyan-400"/>
            <span className="text-white font-bold text-sm uppercase tracking-widest">Form Momentum</span>
          </div>
          <div className="p-4 space-y-4">
            <FormMomentum form={mlData?.home_form_sequence} fixtures={homeFixtures} teamName={teams.home} color="#22d3ee"/>
            <div className="h-px" style={{background:'rgba(255,255,255,0.06)'}}/>
            <FormMomentum form={mlData?.away_form_sequence} fixtures={awayFixtures} teamName={teams.away} color="#a855f7"/>
          </div>
        </div>

        {/* ══ LIKELY GOALSCORERS ══ */}
        {scorersData && (scorersData.home?.length>0 || scorersData.away?.length>0) && (
          <div className="rounded-2xl border border-white/12 overflow-hidden" style={{background:'rgba(10,14,26,0.8)'}}>
            <div className="px-5 py-3.5 border-b border-white/12 flex items-center gap-2" style={{background:'rgba(16,185,129,0.05)'}}>
              <TargetIcon className="w-4 h-4 text-emerald-400"/>
              <span className="text-white font-bold text-sm uppercase tracking-widest">Likely Goalscorers</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
              {[{players:scorersData.home,label:teams.home,color:'#22d3ee'},{players:scorersData.away,label:teams.away,color:'#a855f7'}].map(({players,label,color},si)=>(
                <div key={si} className="p-4">
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color}}>{label}</p>
                  <div className="space-y-2.5">
                    {(players||[]).map((p,i)=>(
                      <div key={i} className="flex items-center gap-3">
                        {p.photo
                          ? <img src={p.photo} alt="" className="w-8 h-8 rounded-xl object-cover flex-shrink-0" onError={e=>e.target.style.display='none'}/>
                          : <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/12" style={{background:`${color}15`}}>
                              <span className="text-sm font-bold" style={{color}}>{(p.name||'?')[0]}</span>
                            </div>}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{p.name.split(' ').pop()}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div className="h-1.5 rounded-full transition-all duration-1000" style={{width:`${p.scoreProbability}%`,background:color}}/>
                            </div>
                            <span className="text-xs font-black flex-shrink-0" style={{fontFamily:'JetBrains Mono',color}}>{p.scoreProbability}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TACTICAL DNA ══ */}
        <div className="rounded-2xl border border-white/12 overflow-hidden" style={{background:'rgba(10,14,26,0.8)'}}>
          <div className="px-5 py-3.5 border-b border-white/12 flex items-center gap-2" style={{background:'rgba(34,211,238,0.04)'}}>
            <LayersIcon className="w-4 h-4 text-cyan-400"/>
            <span className="text-white font-bold text-sm uppercase tracking-widest">Tactical DNA</span>
            <span className="ml-auto text-xs text-slate-400">Hover to explore</span>
          </div>
          <div className="p-4 space-y-4">
            <TacticalDNA mlData={mlData} side="home"/>
            <div className="h-px" style={{background:'rgba(255,255,255,0.06)'}}/>
            <TacticalDNA mlData={mlData} side="away"/>
          </div>
        </div>

        {/* ══ RECENT FORM + H2H ══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[{team:teams.home,fixtures:homeFixtures,mlForm:homeForm,color:'#22d3ee'},{team:teams.away,fixtures:awayFixtures,mlForm:awayForm,color:'#a855f7'}].map((side,si)=>{
            const fixes=side.fixtures?.fixtures||[];
            const form=side.fixtures?.form||side.mlForm||[];
            const summary=side.fixtures?.summary;
            return(
              <div key={si} className="rounded-2xl border border-white/12 overflow-hidden" style={{background:'rgba(10,14,26,0.8)'}}>
                <div className="px-4 py-3 border-b border-white/12 flex items-center justify-between" style={{background:`${side.color}08`}}>
                  <div className="flex items-center gap-2">
                    {side.fixtures?.logo && <img src={side.fixtures.logo} alt="" className="w-5 h-5"/>}
                    <span className="text-white font-bold text-sm">{side.fixtures?.team||side.team}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {summary && (
                      <span className="text-sm font-bold">
                        <span className="text-emerald-400">{summary.wins}W </span>
                        <span className="text-amber-400">{summary.draws}D </span>
                        <span className="text-red-400">{summary.losses}L</span>
                      </span>
                    )}
                    <div className="flex gap-1">{form.slice(0,5).map((r,j)=><FormBadge key={j} result={r}/>)}</div>
                  </div>
                </div>
                {fixes.length>0
                  ? <div className="divide-y divide-white/[0.04]">
                      {fixes.slice(0,6).map((m,i)=>{
                        const dateStr=new Date(m.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
                        const rc={W:'text-emerald-400 bg-emerald-500/12',D:'text-amber-400 bg-amber-500/12',L:'text-red-400 bg-red-500/12'};
                        return(
                          <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-all">
                            <span className="text-slate-400 text-xs w-10 flex-shrink-0">{dateStr}</span>
                            <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0 ${rc[m.result]}`}>{m.result}</span>
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              {m.opponentLogo && <img src={m.opponentLogo} alt="" className="w-4 h-4 flex-shrink-0"/>}
                              <span className="text-sm text-slate-300 truncate">{m.venue==='Home'?'vs':'@'} {m.opponent?.replace(' FC','').replace(' CF','')}</span>
                            </div>
                            <span className="text-sm font-black text-white flex-shrink-0" style={{fontFamily:'JetBrains Mono'}}>{m.homeGoals}-{m.awayGoals}</span>
                          </div>
                        );
                      })}
                    </div>
                  : <div className="p-4">
                      <div className="flex gap-1.5 flex-wrap mb-2">
                        {form.length ? form.map((r,j)=><FormBadge key={j} result={r}/>) : <span className="text-slate-400 text-sm">No data</span>}
                      </div>
                      <Sparkline form={form} width={140} height={30}/>
                    </div>
                }
              </div>
            );
          })}
        </div>

        {/* ══ H2H ══ */}
        {h2hData && (
          <div className="rounded-2xl border border-white/12 overflow-hidden" style={{background:'rgba(10,14,26,0.8)'}}>
            <div className="px-5 py-3.5 border-b border-white/12 flex items-center gap-2" style={{background:'rgba(168,85,247,0.04)'}}>
              <HistoryIcon className="w-4 h-4 text-purple-400"/>
              <span className="text-white font-bold text-sm uppercase tracking-widest">Head-to-Head (Last {h2hData.matches.length})</span>
              <div className="ml-auto flex gap-3 text-sm font-bold">
                <span className="text-cyan-400">{h2hData.homeWins}W</span>
                <span className="text-amber-400">{h2hData.draws}D</span>
                <span className="text-red-400">{h2hData.awayWins}L</span>
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {h2hData.matches.map((m,i)=>{
                const dateStr=new Date(m.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'});
                const isDraw=m.homeGoals===m.awayGoals;
                const homeWon=m.homeGoals>m.awayGoals;
                return(
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-all">
                    <div className="w-16 flex-shrink-0">
                      <span className="text-slate-400 text-xs block">{dateStr}</span>
                      <span className="text-slate-500 text-xs block truncate">{m.competition}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                      {m.homeLogo && <img src={m.homeLogo} alt="" className="w-4 h-4 flex-shrink-0"/>}
                      <span className={`text-sm font-semibold truncate ${homeWon?'text-white':'text-slate-400'}`}>{m.homeTeam.replace(' FC','')}</span>
                    </div>
                    <span className={`font-black text-base px-3 py-1.5 rounded-xl flex-shrink-0 border ${
                      isDraw?'text-amber-400 bg-amber-500/12 border-amber-500/20'
                      :homeWon?'text-cyan-400 bg-cyan-500/12 border-cyan-500/20'
                      :'text-purple-400 bg-purple-500/12 border-purple-500/20'
                    }`} style={{fontFamily:'JetBrains Mono',minWidth:'52px',textAlign:'center'}}>{m.homeGoals} – {m.awayGoals}</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {m.awayLogo && <img src={m.awayLogo} alt="" className="w-4 h-4 flex-shrink-0"/>}
                      <span className={`text-sm font-semibold truncate ${!homeWon&&!isDraw?'text-white':'text-slate-400'}`}>{m.awayTeam.replace(' FC','')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ INSIGHTS ══ */}
        {(streaks.length>0 || tableFac || xgFac) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {streaks.length>0 && (
              <div className="rounded-2xl border border-white/12 overflow-hidden" style={{background:'rgba(10,14,26,0.8)'}}>
                <div className="px-5 py-3.5 border-b border-white/12 flex items-center gap-2" style={{background:'rgba(245,158,11,0.04)'}}>
                  <BarChartIcon className="w-4 h-4 text-amber-400"/>
                  <span className="text-white font-bold text-sm uppercase tracking-widest">Key Insights</span>
                </div>
                <div className="p-4 space-y-2">
                  {streaks.map((f,i)=>(
                    <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-white/12" style={{background:'rgba(255,255,255,0.02)'}}>
                      <ChevronIcon className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0"/>
                      <span className="text-slate-300 text-sm leading-relaxed">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(tableFac || xgFac) && (
              <div className="space-y-2">
                {tableFac && (
                  <div className="rounded-2xl border border-white/12 p-4" style={{background:'rgba(10,14,26,0.8)'}}>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1.5">League Standing</p>
                    <p className="text-white text-sm font-semibold">{tableFac.replace('Table: ','')}</p>
                  </div>
                )}
                {xgFac && (
                  <div className="rounded-2xl border border-white/12 p-4" style={{background:'rgba(10,14,26,0.8)'}}>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1.5">Season xG</p>
                    <p className="text-white text-sm font-semibold">{xgFac.replace('Season xG/game: ','')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════
     PLAYER ANALYSIS — IMPROVED UI/UX
     ═══════════════════════════════════════ */
  const renderPlayerRating = () => {
    if (!mlData || activeTab !== 'player') return null;
    const p = mlData;
    const posColor = {
      Forward:    'text-red-400 bg-red-500/10 border-red-500/20',
      Attacker:   'text-red-400 bg-red-500/10 border-red-500/20',
      Midfielder: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      Defender:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      Goalkeeper: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    };
    const pos       = p.position || 'Forward';
    const isAttacker= pos === 'Forward' || pos === 'Attacker';
    const isMid     = pos === 'Midfielder';
    const isDef     = pos === 'Defender';
    const isGK      = pos === 'Goalkeeper';

    // Attribute colours
    const ATTR = [
      { key: 'attacking',  label: 'Attacking',  color: '#f43f5e', icon: '⚡' },
      { key: 'defending',  label: 'Defending',  color: '#10b981', icon: '🛡' },
      { key: 'passing',    label: 'Passing',    color: '#22d3ee', icon: '🎯' },
      { key: 'physical',   label: 'Physical',   color: '#a855f7', icon: '💪' },
    ];

    // Role-appropriate headline stats
    const HEADLINE = isGK ? [
      { l: 'Rating',   v: (p.rating||0).toFixed(1),   c: '#fbbf24', icon: '⭐' },
      { l: 'Apps',     v: p.appearances||0,             c: '#10b981', icon: '👤' },
      { l: 'Minutes',  v: (p.minutes||0).toLocaleString(), c: '#a855f7', icon: '⏱' },
      { l: 'Pass %',   v: `${p.passAccuracy||0}%`,    c: '#22d3ee', icon: '🎯' },
    ] : isDef ? [
      { l: 'Tackles',  v: p.tacklesTotal||0,            c: '#10b981', icon: '🛡' },
      { l: 'Intercepts',v: p.interceptions||0,          c: '#22d3ee', icon: '✂️' },
      { l: 'Apps',     v: p.appearances||0,             c: '#a855f7', icon: '👤' },
      { l: 'Pass %',   v: `${p.passAccuracy||0}%`,    c: '#f59e0b', icon: '🎯' },
    ] : [
      { l: 'Goals',    v: p.goals||0,                   c: '#22d3ee', icon: '⚽' },
      { l: 'Assists',  v: p.assists||0,                 c: '#f59e0b', icon: '🅰️' },
      { l: 'Apps',     v: p.appearances||0,             c: '#10b981', icon: '👤' },
      { l: 'Rating',   v: (p.rating||0).toFixed(1),    c: '#fbbf24', icon: '⭐' },
    ];

    return (
      <div className="space-y-4 mb-6">
        {/* ── Hero Card ── */}
        <div className="rounded-2xl overflow-hidden border border-white/15" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #050810 100%)' }}>
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500" />

          <div className="p-5 md:p-6">
            <div className="flex flex-col sm:flex-row gap-5 mb-5">
              {/* Photo + OVR ring */}
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  {p.photo
                    ? <img src={p.photo} alt="" className="w-24 h-24 rounded-2xl object-cover border border-white/20" style={{ boxShadow: '0 0 30px rgba(34,211,238,0.2)' }}/>
                    : <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center border border-white/20"><span className="text-4xl font-black text-cyan-400/50">{(p.player_name||'?')[0]}</span></div>
                  }
                  {/* OVR badge overlaid */}
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 border-2 border-[#050810]">
                    <span className="text-[15px] font-black text-white leading-none" style={{ fontFamily: 'JetBrains Mono' }}>{(p.overall_rating||0).toFixed(0)}</span>
                  </div>
                </div>

                {/* Identity */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-black text-white leading-tight mb-1">{p.player_name}</h2>
                  <div className="flex items-center gap-2 mb-2">
                    {p.teamLogo && <img src={p.teamLogo} alt="" className="w-5 h-5 flex-shrink-0"/>}
                    <span className="text-slate-300 text-base font-semibold">{p.team}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-xl text-base font-bold border ${posColor[pos]||'text-slate-400 bg-white/5 border-white/20'}`}>{pos}</span>
                    {p.nationality && <span className="text-slate-300 text-base">{p.nationality}</span>}
                    {p.age > 0 && <span className="text-slate-400 text-base">· Age {p.age}</span>}
                    {p.league && <span className="text-slate-400 text-base">· {p.league}</span>}
                  </div>
                  {p.rating > 0 && (
                    <div className="flex items-center gap-2 mt-2.5">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <span className="text-yellow-400 text-base">⭐</span>
                        <span className="text-yellow-400 text-base font-black" style={{ fontFamily: 'JetBrains Mono' }}>{(p.rating||0).toFixed(1)}</span>
                        <span className="text-slate-400 text-base">season rating</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/15">
                        <span className="text-slate-300 text-base">{p.appearances||0} apps</span>
                        <span className="text-slate-300 text-base">·</span>
                        <span className="text-slate-300 text-base">{(p.minutes||0).toLocaleString()} mins</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attribute radar */}
              <div className="flex-shrink-0 flex justify-center sm:justify-end">
                {(() => {
                  const sz = 150, cx = sz/2, cy = sz/2, r = 52;
                  const pts = ATTR.map((a, i) => {
                    const angle = (Math.PI * 2 * i) / ATTR.length - Math.PI / 2;
                    const val = Math.min((p[a.key]||0)/10, 1);
                    return { x: cx + Math.cos(angle)*r*val, y: cy + Math.sin(angle)*r*val, lx: cx + Math.cos(angle)*(r+18), ly: cy + Math.sin(angle)*(r+18), label: a.label, color: a.color };
                  });
                  const path = pts.map((pt,i) => `${i===0?'M':'L'}${pt.x},${pt.y}`).join(' ') + 'Z';
                  return (
                    <svg width={sz} height={sz}>
                      {[0.25,0.5,0.75,1].map((lv,li) =>
                        <polygon key={li} points={ATTR.map((_,i)=>{const a=(Math.PI*2*i)/ATTR.length-Math.PI/2;return`${cx+Math.cos(a)*r*lv},${cy+Math.sin(a)*r*lv}`;}).join(' ')} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                      )}
                      {ATTR.map((_,i) => {
                        const a = (Math.PI*2*i)/ATTR.length-Math.PI/2;
                        return <line key={i} x1={cx} y1={cy} x2={cx+Math.cos(a)*r} y2={cy+Math.sin(a)*r} stroke="rgba(255,255,255,0.04)"/>;
                      })}
                      <path d={path} fill="rgba(34,211,238,0.12)" stroke="#22d3ee" strokeWidth="2"/>
                      {pts.map((pt,i) => (
                        <g key={i}>
                          <circle cx={pt.x} cy={pt.y} r="3.5" fill={pt.color} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
                          <text x={pt.lx} y={pt.ly} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="Outfit" fontWeight="700">{pt.label}</text>
                        </g>
                      ))}
                    </svg>
                  );
                })()}
              </div>
            </div>

            {/* Headline stats */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {HEADLINE.map(s => (
                <div key={s.l} className="rounded-2xl p-3 text-center border border-white/12 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${s.c}08, rgba(5,8,16,0.95))` }}>
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${s.c}50, transparent)` }}/>
                  <div className="text-lg mb-1">{s.icon}</div>
                  <div className="font-black text-lg leading-tight" style={{ fontFamily: 'JetBrains Mono', color: s.c }}>{s.v}</div>
                  <div className="text-[15px] text-slate-400 uppercase tracking-wide mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Attribute bars */}
            <div className="grid grid-cols-2 gap-x-5 gap-y-3">
              {ATTR.map(a => {
                const pct = Math.min((p[a.key]||0) * 10, 100);
                const grade = pct >= 80 ? 'Elite' : pct >= 65 ? 'Good' : pct >= 50 ? 'Average' : 'Poor';
                return (
                  <div key={a.key}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }}/>
                        <span className="text-slate-400 text-base font-semibold">{a.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{ backgroundColor: `${a.color}15`, color: a.color, border: `1px solid ${a.color}25` }}>
                          {grade}
                        </span>
                        <span className="text-white text-base font-black" style={{ fontFamily: 'JetBrains Mono' }}>
                          {(p[a.key]||0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full rounded-full h-2 bg-white/5 overflow-hidden">
                      <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${a.color}80, ${a.color})` }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Detailed stats grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Per 90 */}
          <div className="rounded-2xl border border-white/12 overflow-hidden" style={{ background: 'rgba(16,26,50,0.85)' }}>
            <div className="px-4 py-3 border-b border-white/12 flex items-center gap-2" style={{ background: 'rgba(34,211,238,0.05)' }}>
              <div className="w-1 h-4 rounded-full bg-cyan-400"/>
              <span className="text-cyan-400 text-base font-black uppercase tracking-widest">Per 90 Minutes</span>
            </div>
            <div className="p-4 space-y-3">
              {[
                { l: 'Goals/90',    v: (p.goalsPerNinety||0).toFixed(2),   c: '#22d3ee',  pct: Math.min((p.goalsPerNinety||0)*100, 100) },
                { l: 'Assists/90',  v: (p.assistsPerNinety||0).toFixed(2), c: '#f59e0b',  pct: Math.min((p.assistsPerNinety||0)*100, 100) },
                { l: 'G+A / 90',    v: ((p.goalsPerNinety||0)+(p.assistsPerNinety||0)).toFixed(2), c: '#fff', pct: Math.min(((p.goalsPerNinety||0)+(p.assistsPerNinety||0))*60, 100) },
                { l: 'Mins/Game',   v: p.appearances>0?Math.round((p.minutes||0)/(p.appearances||1)):0, c: '#94a3b8', pct: Math.min((p.appearances>0?Math.round((p.minutes||0)/(p.appearances||1)):0)/90*100, 100) },
              ].map(s => (
                <div key={s.l}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300 text-base">{s.l}</span>
                    <span className="font-black text-base" style={{ fontFamily: 'JetBrains Mono', color: s.c }}>{s.v}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.pct}%`, backgroundColor: s.c, opacity: 0.7 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Position-specific stats */}
          <div className="rounded-2xl border border-white/12 overflow-hidden" style={{ background: 'rgba(16,26,50,0.85)' }}>
            <div className={`px-4 py-3 border-b border-white/12 flex items-center gap-2`} style={{ background: isAttacker||isMid ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)' }}>
              <div className={`w-1 h-4 rounded-full ${isAttacker||isMid?'bg-red-400':'bg-emerald-400'}`}/>
              <span className={`text-base font-black uppercase tracking-widest ${isAttacker||isMid?'text-red-400':'text-emerald-400'}`}>
                {isGK ? 'Goalkeeper' : isAttacker||isMid ? 'Shooting' : 'Defensive'}
              </span>
            </div>
            <div className="p-4 space-y-3">
              {(isAttacker||isMid ? [
                { l: 'Total Shots',   v: p.shotsTotal||0,         c: '#f43f5e', pct: Math.min((p.shotsTotal||0)/150*100, 100) },
                { l: 'On Target',     v: Math.round((p.shotsTotal||0)*(p.shotAccuracy||0)/100), c: '#fb923c', pct: Math.min(Math.round((p.shotsTotal||0)*(p.shotAccuracy||0)/100)/100*100, 100) },
                { l: 'Conversion %',  v: `${p.shotAccuracy||0}%`,  c: '#f59e0b', pct: p.shotAccuracy||0 },
                { l: 'Key Passes',    v: p.keyPasses||0,           c: '#22d3ee', pct: Math.min((p.keyPasses||0)/80*100, 100) },
              ] : isGK ? [
                { l: 'Pass Acc %',    v: `${p.passAccuracy||0}%`,  c: '#38bdf8', pct: p.passAccuracy||0 },
                { l: 'Aerials Won',   v: p.aerialWon||0,           c: '#10b981', pct: Math.min((p.aerialWon||0)/50*100, 100) },
                { l: 'Key Passes',    v: p.keyPasses||0,           c: '#a855f7', pct: Math.min((p.keyPasses||0)/20*100, 100) },
                { l: 'Appearances',   v: p.appearances||0,         c: '#fbbf24', pct: Math.min((p.appearances||0)/38*100, 100) },
              ] : [
                { l: 'Tackles',       v: p.tacklesTotal||0,        c: '#10b981', pct: Math.min((p.tacklesTotal||0)/100*100, 100) },
                { l: 'Interceptions', v: p.interceptions||0,       c: '#34d399', pct: Math.min((p.interceptions||0)/60*100, 100) },
                { l: 'Blocks',        v: p.blocks||0,              c: '#6ee7b7', pct: Math.min((p.blocks||0)/30*100, 100) },
                { l: 'Duel Win %',    v: `${p.duelWinPct||0}%`,    c: (p.duelWinPct||0)>=50?'#10b981':'#ef4444', pct: p.duelWinPct||0 },
              ]).map(s => (
                <div key={s.l}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300 text-base">{s.l}</span>
                    <span className="font-black text-base" style={{ fontFamily: 'JetBrains Mono', color: s.c }}>{s.v}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.pct}%`, backgroundColor: s.c, opacity: 0.7 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Creativity & Discipline */}
          <div className="rounded-2xl border border-white/12 overflow-hidden" style={{ background: 'rgba(16,26,50,0.85)' }}>
            <div className="px-4 py-3 border-b border-white/12 flex items-center gap-2" style={{ background: 'rgba(168,85,247,0.05)' }}>
              <div className="w-1 h-4 rounded-full bg-purple-400"/>
              <span className="text-purple-400 text-base font-black uppercase tracking-widest">
                {isAttacker||isMid ? 'Creativity' : 'Distribution'}
              </span>
            </div>
            <div className="p-4 space-y-3">
              {(isAttacker||isMid ? [
                { l: 'Dribble %',    v: `${p.dribbleSuccessPct||0}%`,  c: (p.dribbleSuccessPct||0)>=50?'#a855f7':'#f59e0b', pct: p.dribbleSuccessPct||0 },
                { l: 'Dribbles/G',   v: p.appearances>0?((p.dribblesAttempted||0)/(p.appearances||1)).toFixed(1):'0', c: '#c084fc', pct: Math.min(p.appearances>0?((p.dribblesAttempted||0)/(p.appearances||1))*20:0, 100) },
                { l: 'Fouls Drawn',  v: p.foulsDrawn||0,               c: '#38bdf8', pct: Math.min((p.foulsDrawn||0)/80*100, 100) },
                { l: 'Pass Acc %',   v: `${p.passAccuracy||0}%`,       c: '#22d3ee', pct: p.passAccuracy||0 },
              ] : [
                { l: 'Pass Acc %',   v: `${p.passAccuracy||0}%`,       c: '#22d3ee', pct: p.passAccuracy||0 },
                { l: 'Key Passes',   v: p.keyPasses||0,                c: '#a855f7', pct: Math.min((p.keyPasses||0)/50*100, 100) },
                { l: 'Yellow Cards', v: p.yellowCards||0,              c: (p.yellowCards||0)>=5?'#f59e0b':'#94a3b8', pct: Math.min((p.yellowCards||0)/10*100, 100) },
                { l: 'Red Cards',    v: p.redCards||0,                 c: (p.redCards||0)>0?'#ef4444':'#94a3b8', pct: Math.min((p.redCards||0)*50, 100) },
              ]).map(s => (
                <div key={s.l}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300 text-base">{s.l}</span>
                    <span className="font-black text-base" style={{ fontFamily: 'JetBrains Mono', color: s.c }}>{s.v}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.pct}%`, backgroundColor: s.c, opacity: 0.7 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Strengths & Weaknesses ── */}
        {(p.strengths?.length > 0 || p.weaknesses?.length > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-500/15 overflow-hidden" style={{ background: 'rgba(16,26,50,0.85)' }}>
              <div className="px-4 py-3 border-b border-emerald-500/10 flex items-center gap-2" style={{ background: 'rgba(16,185,129,0.05)' }}>
                <CheckIcon className="w-3.5 h-3.5 text-emerald-400"/>
                <span className="text-emerald-400 text-base font-black uppercase tracking-widest">Strengths</span>
              </div>
              <div className="p-4 space-y-2.5">
                {p.strengths?.map((s,i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-400 text-[15px] font-black">{i+1}</span>
                    </div>
                    <p className="text-slate-300 text-base leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-red-500/15 overflow-hidden" style={{ background: 'rgba(16,26,50,0.85)' }}>
              <div className="px-4 py-3 border-b border-red-500/10 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.05)' }}>
                <AlertIcon className="w-3.5 h-3.5 text-red-400"/>
                <span className="text-red-400 text-base font-black uppercase tracking-widest">Weaknesses</span>
              </div>
              <div className="p-4 space-y-2.5">
                {p.weaknesses?.map((w,i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-400 text-[15px] font-black">{i+1}</span>
                    </div>
                    <p className="text-slate-300 text-base leading-relaxed">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════
     TEAM COMPARISON — IMPROVED + BUG FIXED
     ═══════════════════════════════════════ */
  const renderTeamComparison = () => {
    if (!compData) return null;
    const { teamA, teamB, predAB } = compData;
    const rLabels = ['Attack','Defense','Form','Momentum','xG×30'];
    const rA = [teamA.attack, teamA.defense, teamA.form, teamA.momentum, Math.min(teamA.xg*30,95)];
    const rB = [teamB.attack, teamB.defense, teamB.form, teamB.momentum, Math.min(teamB.xg*30,95)];

    // xG split — fixed from original broken template literal
    const totalXg  = (teamA.xg + teamB.xg) || 0.01;
    const xgPctA   = Math.round((teamA.xg / totalXg) * 100);
    const xgPctB   = 100 - xgPctA;

    // Determine leaders per metric
    const metrics = [
      { label: 'Attack',   valA: teamA.attack,   valB: teamB.attack,   rawA: null,                   rawB: null },
      { label: 'Defense',  valA: teamA.defense,  valB: teamB.defense,  rawA: null,                   rawB: null },
      { label: 'Form',     valA: teamA.form,     valB: teamB.form,     rawA: null,                   rawB: null },
      { label: 'xG/match', valA: teamA.xg*30,    valB: teamB.xg*30,   rawA: teamA.xg.toFixed(2),    rawB: teamB.xg.toFixed(2) },
      { label: 'Momentum', valA: teamA.momentum, valB: teamB.momentum, rawA: null,                   rawB: null },
    ];

    return (
      <div className="space-y-4 mb-6">

        {/* ── Team header cards ── */}
        <div className="rounded-2xl overflow-hidden border border-white/12" style={{ background: 'rgba(14,24,46,0.95)' }}>
          <div className="h-px bg-gradient-to-r from-cyan-500/50 via-white/10 to-purple-500/50"/>
          <div className="p-5">
            <div className="flex items-stretch gap-4">

              {/* Team A */}
              <div className="flex-1 rounded-2xl p-4 border border-cyan-500/15 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.06), rgba(5,8,16,0.95))' }}>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"/>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-cyan-500/20 p-2">
                    {teamA.crest ? <img src={teamA.crest} alt="" className="w-full h-full object-contain" onError={e=>e.target.style.display='none'}/> : <ShieldIcon className="w-8 h-8 text-cyan-400/40"/>}
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-black text-base">{teamA.name}</h3>
                    <span className="text-base text-cyan-400/70">Home</span>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-cyan-400" style={{ fontFamily: 'JetBrains Mono' }}>{(teamA.winProb*100).toFixed(0)}%</div>
                    <div className="text-[15px] text-slate-400 uppercase tracking-widest">Win Probability</div>
                  </div>
                  {teamA.formSeq.length > 0 && (
                    <div className="flex gap-1 flex-wrap justify-center">
                      {teamA.formSeq.slice(0,5).map((r,j) => <FormBadge key={j} result={r}/>)}
                    </div>
                  )}
                </div>
              </div>

              {/* VS center */}
              <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0 w-16">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/20">
                  <SwordsIcon className="w-4 h-4 text-slate-300"/>
                </div>
                {predAB?.predicted_score && (
                  <div className="text-center">
                    <div className="text-base font-black text-white" style={{ fontFamily: 'JetBrains Mono' }}>{predAB.predicted_score}</div>
                    <div className="text-base text-slate-300 uppercase tracking-widest">Score</div>
                  </div>
                )}
                <div className="text-[15px] text-slate-300 text-center">{(compData.predAB?.draw*100||0).toFixed(0)}%<br/><span className="text-base">draw</span></div>
              </div>

              {/* Team B */}
              <div className="flex-1 rounded-2xl p-4 border border-purple-500/15 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(5,8,16,0.95))' }}>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"/>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-purple-500/20 p-2">
                    {teamB.crest ? <img src={teamB.crest} alt="" className="w-full h-full object-contain" onError={e=>e.target.style.display='none'}/> : <ShieldIcon className="w-8 h-8 text-purple-400/40"/>}
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-black text-base">{teamB.name}</h3>
                    <span className="text-base text-purple-400/70">Away</span>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-purple-400" style={{ fontFamily: 'JetBrains Mono' }}>{(teamB.winProb*100).toFixed(0)}%</div>
                    <div className="text-[15px] text-slate-400 uppercase tracking-widest">Win Probability</div>
                  </div>
                  {teamB.formSeq.length > 0 && (
                    <div className="flex gap-1 flex-wrap justify-center">
                      {teamB.formSeq.slice(0,5).map((r,j) => <FormBadge key={j} result={r}/>)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* xG Split bar — FIXED */}
            <div className="mt-4 rounded-2xl p-4 border border-white/12" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-cyan-400 font-black text-base" style={{ fontFamily: 'JetBrains Mono' }}>{teamA.xg.toFixed(2)} xG</span>
                <span className="text-base text-slate-400 uppercase tracking-widest">Expected Goals</span>
                <span className="text-purple-400 font-black text-base" style={{ fontFamily: 'JetBrains Mono' }}>{teamB.xg.toFixed(2)} xG</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
                <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-l-full transition-all duration-1000" style={{ width: `${xgPctA}%` }}/>
                <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-r-full transition-all duration-1000" style={{ width: `${xgPctB}%` }}/>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[15px] text-slate-300">{xgPctA}%</span>
                <span className="text-[15px] text-slate-300">{xgPctB}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Radar + Head-to-head ── */}
        <div className="grid grid-cols-1 gap-4">
          {/* Radar */}
          <div className="rounded-2xl border border-white/12 overflow-hidden" style={{ background: 'rgba(14,24,46,0.92)' }}>
            <div className="px-4 py-3 border-b border-white/12 flex items-center gap-2">
              <TargetIcon className="w-3.5 h-3.5 text-cyan-400"/>
              <span className="text-white font-bold text-base">Statistical Radar</span>
            </div>
            <div className="p-4 flex justify-center">
              <RadarChart data1={rA} data2={rB} labels={rLabels} name1={teamA.name} name2={teamB.name}/>
            </div>
          </div>

          {/* Key Metrics H2H */}
          <div className="rounded-2xl border border-white/12 overflow-hidden" style={{ background: 'rgba(14,24,46,0.92)' }}>
            <div className="px-4 py-3 border-b border-white/12 flex items-center gap-2">
              <BarChartIcon className="w-3.5 h-3.5 text-purple-400"/>
              <span className="text-white font-bold text-base">Key Metrics</span>
            </div>
            <div className="p-4 space-y-3.5">
              {metrics.map((m, i) => (
                <VsStatBar key={i} label={m.label} valA={m.valA} valB={m.valB} rawA={m.rawA} rawB={m.rawB}/>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent form ── */}
        {(teamA.formSeq.length > 0 || teamB.formSeq.length > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
            {[{t:teamA,fix:homeFixtures},{t:teamB,fix:awayFixtures}].map((s,i) => (
              <div key={i} className="rounded-2xl border border-white/12 overflow-hidden" style={{ background: 'rgba(14,24,46,0.92)' }}>
                <div className="px-4 py-3 border-b border-white/12 flex items-center gap-2">
                  {s.fix?.logo && <img src={s.fix.logo} alt="" className="w-4 h-4"/>}
                  <span className="text-white font-semibold text-base">{s.t.name}</span>
                </div>
                <div className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap mb-3">{s.t.formSeq.slice(0,8).map((r,j)=><FormBadge key={j} result={r}/>)}</div>
                  <Sparkline form={s.t.formSeq} width={140} height={30}/>
                </div>
                {s.fix?.fixtures && (
                  <div className="border-t border-white/20 divide-y divide-white/[0.03]">
                    {s.fix.fixtures.slice(0,4).map((m,k) => {
                      const d = new Date(m.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
                      const rc = {W:'text-emerald-400 bg-emerald-500/10',D:'text-yellow-400 bg-yellow-500/10',L:'text-red-400 bg-red-500/10'};
                      return (
                        <div key={k} className="flex items-center gap-2 px-4 py-2 hover:bg-white/[0.02] transition-all">
                          <span className="text-slate-400 text-base w-10 flex-shrink-0">{d}</span>
                          <span className={`w-5 h-5 rounded text-base font-black flex items-center justify-center flex-shrink-0 ${rc[m.result]}`}>{m.result}</span>
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            {m.opponentLogo && <img src={m.opponentLogo} alt="" className="w-3.5 h-3.5 flex-shrink-0"/>}
                            <span className="text-base text-slate-400 truncate">{m.venue==='Home'?'vs':'@'} {m.opponent?.replace(' FC','')}</span>
                          </div>
                          <span className="text-base font-black text-white flex-shrink-0" style={{fontFamily:'JetBrains Mono'}}>{m.homeGoals}-{m.awayGoals}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── H2H ── */}
        {h2hData && (
          <div className="rounded-2xl border border-white/12 overflow-hidden" style={{ background: 'rgba(14,24,46,0.92)' }}>
            <div className="px-4 py-3 border-b border-white/12 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-3.5 h-3.5 text-purple-400"/>
                <span className="text-white font-semibold text-base">Head-to-Head (Last {h2hData.matches.length})</span>
              </div>
              <div className="flex items-center gap-3 text-base">
                <span className="text-cyan-400 font-bold">{h2hData.homeWins}W</span>
                <span className="text-yellow-400 font-bold">{h2hData.draws}D</span>
                <span className="text-red-400 font-bold">{h2hData.awayWins}L</span>
              </div>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {h2hData.matches.slice(0,6).map((m,i) => {
                const d = new Date(m.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'});
                const isDraw = m.homeGoals===m.awayGoals; const hw = m.homeGoals>m.awayGoals;
                return (
                  <div key={i} className="flex items-center gap-2 px-4 py-3 hover:bg-white/[0.02] transition-all">
                    <div className="w-16 flex-shrink-0">
                      <span className="text-slate-400 text-base block">{d}</span>
                      <span className="text-slate-300 text-[15px] block truncate">{m.competition}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                      {m.homeLogo && <img src={m.homeLogo} alt="" className="w-4 h-4 flex-shrink-0"/>}
                      <span className={`text-base font-semibold truncate ${hw?'text-white':'text-slate-300'}`}>{m.homeTeam.replace(' FC','').replace(' CF','')}</span>
                    </div>
                    <span className={`font-black text-base px-2.5 py-1 rounded-lg flex-shrink-0 ${isDraw?'text-yellow-400 bg-yellow-500/10':hw?'text-cyan-400 bg-cyan-500/10':'text-red-400 bg-red-500/10'}`} style={{fontFamily:'JetBrains Mono',minWidth:'42px',textAlign:'center'}}>{m.homeGoals} - {m.awayGoals}</span>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {m.awayLogo && <img src={m.awayLogo} alt="" className="w-4 h-4 flex-shrink-0"/>}
                      <span className={`text-base font-semibold truncate ${!hw&&!isDraw?'text-white':'text-slate-300'}`}>{m.awayTeam.replace(' FC','').replace(' CF','')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ML Insights ── */}
        {teamA.keyFactors.length > 0 && (
          <div className="rounded-2xl border border-white/12 overflow-hidden" style={{ background: 'rgba(14,24,46,0.92)' }}>
            <div className="px-4 py-3 border-b border-white/12 flex items-center gap-2">
              <ZapIcon className="w-3.5 h-3.5 text-yellow-400"/>
              <span className="text-white font-semibold text-base">ML Model Insights</span>
            </div>
            <div className="p-4 space-y-2">
              {teamA.keyFactors.map((f,i) => (
                <div key={i} className="flex items-start gap-2.5 py-1.5 px-3 rounded-xl bg-white/[0.02] border border-white/20">
                  <ChevronIcon className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0"/>
                  <span className="text-slate-400 text-base leading-relaxed">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════
     TACTICAL ANALYSIS — WORLD-CLASS REBUILD
     No clubs. Formations only. Instant render. Full intelligence.
     ═══════════════════════════════════════════════════════════ */
  const renderTacticalAnalysis = () => {
    if (!tactData) return null;
    const { formation, oppFormation: oF } = tactData;

    const meta       = FORMATION_META[formation] || { style:'Custom', strengths:[], weaknesses:[] };
    const oppMeta    = FORMATION_META[oF]        || { style:'Custom', strengths:[], weaknesses:[] };
    const ratings    = FORMATION_RATINGS[formation]  || { press:60, transition:60, setPiece:60, defensiveBlock:60 };
    const oppRatings = FORMATION_RATINGS[oF]         || { press:60, transition:60, setPiece:60, defensiveBlock:60 };
    const phases     = FORMATION_PHASES[formation]   || { inPoss:60, outPoss:60, pressing:60, transition:60, width:60, buildUp:60 };
    const oppPhases  = FORMATION_PHASES[oF]          || { inPoss:60, outPoss:60, pressing:60, transition:60, width:60, buildUp:60 };
    const space      = FORMATION_SPACE[formation]    || { creates:[], concedes:[] };
    const oppSpace   = FORMATION_SPACE[oF]           || { creates:[], concedes:[] };
    const duelKey    = `${formation}_vs_${oF}`;
    const altDuelKey = `${oF}_vs_${formation}`;
    const duels      = FORMATION_DUELS[duelKey] || FORMATION_DUELS[altDuelKey] || [
      `${formation} attack vs ${oF} defensive shape`,
      'Midfield control — who wins the central zones',
      'Defensive line vs pressing triggers',
    ];
    const recommendation = TACTICAL_RECOMMENDATIONS[formation] || 'Assess pressing intensity after 20 minutes.';
    const edgeData   = FORMATION_MATCHUP_EDGE[duelKey] || FORMATION_MATCHUP_EDGE[altDuelKey] || null;
    const scData     = SCENARIO_DATA[activeScenario] || SCENARIO_DATA.neutral;
    const scPlan     = scData.plans[formation] || scData.plans.default;
    const scAvoid    = scData.avoid[formation] || scData.avoid.default;

    const myTotal  = ratings.press + ratings.transition + ratings.setPiece + ratings.defensiveBlock;
    const oppTotal = oppRatings.press + oppRatings.transition + oppRatings.setPiece + oppRatings.defensiveBlock;
    const scoreDiff = myTotal - oppTotal;
    const edgePct  = Math.round((myTotal / (myTotal + oppTotal)) * 100);

    const myColor  = meta.color  || '#22d3ee';
    const oppColor = oppMeta.color || '#a855f7';

    // ── Inline DNA Radar ─────────────────────────────────────────────────
    const DNARadar = () => {
      const sz=220, cx=110, cy=110, r=72;
      const dims = [
        {key:'inPoss',label:'Possession'},{key:'outPoss',label:'Defense'},
        {key:'pressing',label:'Press'},{key:'transition',label:'Transit.'},
        {key:'width',label:'Width'},{key:'buildUp',label:'Build-Up'},
      ];
      const n = dims.length;
      const pt=(i,v)=>{const a=(Math.PI*2*i)/n-Math.PI/2;const d=(v/100)*r;return{x:cx+d*Math.cos(a),y:cy+d*Math.sin(a)};};
      const grid=(frac)=>dims.map((_,i)=>{const a=(Math.PI*2*i)/n-Math.PI/2;return`${(cx+Math.cos(a)*r*frac).toFixed(1)},${(cy+Math.sin(a)*r*frac).toFixed(1)}`;}).join(' ');
      const path=(data)=>dims.map(({key},i)=>{const p=pt(i,data[key]||50);return`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;}).join(' ')+'Z';
      return (
        <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
          {[0.25,0.5,0.75,1].map((f,i)=><polygon key={i} points={grid(f)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8"/>)}
          {dims.map((_,i)=>{const p=pt(i,100);return<line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.6"/>;})}
          <path d={path(phases)}    fill={`${myColor}12`}  stroke={myColor}  strokeWidth="2"/>
          <path d={path(oppPhases)} fill={`${oppColor}10`} stroke={oppColor} strokeWidth="1.5" strokeDasharray="3 2"/>
          {dims.map(({key},i)=>{const pm=pt(i,phases[key]||50);return<circle key={`m${i}`} cx={pm.x} cy={pm.y} r="3" fill={myColor}/>})}
          {dims.map(({key},i)=>{const po=pt(i,oppPhases[key]||50);return<circle key={`o${i}`} cx={po.x} cy={po.y} r="2.5" fill={oppColor}/>})}
          {dims.map(({label,key},i)=>{
            const lp=pt(i,124);
            const mV=phases[key]||50, oV=oppPhases[key]||50;
            const leader=mV>oV?myColor:oV>mV?oppColor:'#475569';
            return(
              <g key={`lbl${i}`}>
                <text x={lp.x} y={lp.y-3} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8.5" fontFamily="Outfit" fontWeight="600">{label}</text>
                <text x={lp.x} y={lp.y+6} textAnchor="middle" fill={leader} fontSize="7" fontFamily="monospace" fontWeight="700">{mV}·{oV}</text>
              </g>
            );
          })}
        </svg>
      );
    };

    // ── Phase bar component ───────────────────────────────────────────────
    const PhaseBar = ({label,myVal,oppVal,color}) => {
      const myW=myVal>oppVal, gap=Math.abs(myVal-oppVal);
      return (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-base font-black tabular-nums ${myW?'text-cyan-400':'text-slate-400'}`} style={{fontFamily:'JetBrains Mono'}}>{myVal}</span>
            <div className="text-center">
              <span className="text-[15px] text-slate-300 font-semibold uppercase tracking-wide block">{label}</span>
              {gap>=12&&<span className="text-base font-black" style={{color:myW?myColor:oppColor}}>{gap>=22?'Big edge':'Edge'}</span>}
            </div>
            <span className={`text-base font-black tabular-nums ${!myW&&gap>0?'text-purple-400':'text-slate-400'}`} style={{fontFamily:'JetBrains Mono'}}>{oppVal}</span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.03)'}}>
            <div className="h-full rounded-l-full transition-all duration-700" style={{width:`${myVal}%`,background:myW?`linear-gradient(90deg,${color}60,${color})`:'#1e293b'}}/>
            <div className="h-full rounded-r-full transition-all duration-700 ml-auto" style={{width:`${oppVal}%`,background:!myW&&gap>0?`linear-gradient(90deg,${oppColor}60,${oppColor})`:'#1e293b'}}/>
          </div>
        </div>
      );
    };

    // ── Mini pitch for selector button (compact, no labels) ──────────────
    const MiniPitch = ({formation:f, color:c, size=80}) => {
      const pos = FORMATION_POSITIONS[f];
      if (!pos) return null;
      const allPos = [{x:8,y:50},...(pos.def||[]).map(p=>({x:p[0],y:p[1]})),...(pos.mid||[]).map(p=>({x:p[0],y:p[1]})),...(pos.fwd||[]).map(p=>({x:p[0],y:p[1]}))];
      const VW=60,VH=80;
      return (
        <svg viewBox={`0 0 ${VW} ${VH}`} width={size} height={size*VH/VW}>
          <rect x="1" y="1" width={VW-2} height={VH-2} rx="2" fill="#0a3a20" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4"/>
          <line x1="30" y1="1" x2="30" y2={VH-1} stroke="rgba(255,255,255,0.06)" strokeWidth="0.3"/>
          <circle cx="30" cy={VH/2} r="7" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3"/>
          {allPos.map((p,i)=>{
            const px=(p.x/100)*VW, py=(p.y/100)*VH;
            return <circle key={i} cx={px} cy={py} r="2.2" fill={c} opacity="0.85"/>;
          })}
        </svg>
      );
    };

    return (
      <div className="space-y-4 mb-6" style={{animation:'fadeSlideIn 0.35s cubic-bezier(0.16,1,0.3,1)'}}>

        {/* ══ HERO: FORMATION SELECTOR ══════════════════════════════════════ */}
        <div className="rounded-3xl overflow-hidden relative" style={{
          background:`linear-gradient(135deg, ${myColor}0a 0%, rgba(4,8,16,0.95) 40%, rgba(4,8,16,0.95) 60%, ${oppColor}0a 100%)`,
          border:`1px solid rgba(255,255,255,0.1)`,
          boxShadow:`0 0 60px ${myColor}15, inset 0 0 60px ${oppColor}08`,
        }}>
          {/* Chromatic top bar */}
          <div className="h-0.5" style={{background:`linear-gradient(90deg,${myColor},${myColor}80 20%,rgba(255,255,255,0.15) 50%,${oppColor}80 80%,${oppColor})`}}/>
          {/* Deep ambient glows */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[100px]" style={{background:myColor,opacity:0.12}}/>
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px]" style={{background:oppColor,opacity:0.12}}/>
          </div>

          <div className="relative p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <LayersIcon className="w-4 h-4" style={{color:myColor}}/>
                <span className="text-white font-black text-base uppercase tracking-[0.12em]">Formation Matchup</span>
              </div>
              <span className="text-[15px] uppercase tracking-[0.1em] font-semibold" style={{color:'rgba(255,255,255,0.75)'}}>Click any card to switch</span>
            </div>

            <div className="grid grid-cols-1 gap-4 items-start">

              {/* YOUR formation */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full" style={{background:myColor,boxShadow:`0 0 6px ${myColor}`}}/>
                  <span className="text-[15px] font-black uppercase tracking-[0.15em]" style={{color:myColor}}>Your Formation</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-1 sm:gap-1.5">
                  {FORMATIONS_LIST.map(f => {
                    const fc = FORMATION_META[f]?.color || '#22d3ee';
                    const isSel = tactFormation === f;
                    return (
                      <button key={f} onClick={() => setTactFormation(f)}
                        className="relative flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all duration-200 overflow-hidden"
                        style={{
                          background: isSel ? `${fc}18` : 'rgba(255,255,255,0.03)',
                          border: isSel ? `1px solid ${fc}45` : '1px solid rgba(255,255,255,0.06)',
                          boxShadow: isSel ? `0 0 24px ${fc}20, inset 0 0 20px ${fc}08` : 'none',
                        }}>
                        {isSel && <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{background:`linear-gradient(90deg,transparent,${fc},transparent)`}}/>}
                        <MiniPitch formation={f} color={isSel ? fc : 'rgba(255,255,255,0.45)'} size={54}/>
                        <span style={{fontFamily:'JetBrains Mono', fontSize:10, fontWeight:900, color: isSel ? fc : 'rgba(255,255,255,0.60)'}}>{f}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VS divider */}
              <div className="flex flex-col items-center justify-center gap-3 pt-10 pb-2">
                <div className="w-px h-12 rounded-full" style={{background:`linear-gradient(180deg,${myColor}60,rgba(255,255,255,0.05))`}}/>
                <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.1)',
                  boxShadow:'0 0 20px rgba(255,255,255,0.05)',
                }}>
                  <SwordsIcon className="w-4 h-4" style={{color:'rgba(255,255,255,0.70)'}}/>
                </div>
                <div className="w-px h-12 rounded-full" style={{background:`linear-gradient(180deg,rgba(255,255,255,0.05),${oppColor}60)`}}/>
              </div>

              {/* OPPONENT formation */}
              <div>
                <div className="flex items-center justify-end gap-2 mb-3">
                  <span className="text-[15px] font-black uppercase tracking-[0.15em]" style={{color:oppColor}}>Opponent</span>
                  <div className="w-1.5 h-1.5 rounded-full" style={{background:oppColor,boxShadow:`0 0 6px ${oppColor}`}}/>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-1 sm:gap-1.5">
                  {FORMATIONS_LIST.map(f => {
                    const fc = FORMATION_META[f]?.color || '#a855f7';
                    const isSel = oppFormation === f;
                    return (
                      <button key={f} onClick={() => setOppFormation(f)}
                        className="relative flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all duration-200 overflow-hidden"
                        style={{
                          background: isSel ? `${oppColor}18` : 'rgba(255,255,255,0.03)',
                          border: isSel ? `1px solid ${oppColor}45` : '1px solid rgba(255,255,255,0.06)',
                          boxShadow: isSel ? `0 0 24px ${oppColor}20, inset 0 0 20px ${oppColor}08` : 'none',
                        }}>
                        {isSel && <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{background:`linear-gradient(90deg,transparent,${oppColor},transparent)`}}/>}
                        <MiniPitch formation={f} color={isSel ? oppColor : 'rgba(255,255,255,0.45)'} size={54}/>
                        <span style={{fontFamily:'JetBrains Mono', fontSize:10, fontWeight:900, color: isSel ? oppColor : 'rgba(255,255,255,0.60)'}}>{f}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Matchup verdict */}
            <div className="mt-6 pt-5 border-t" style={{borderColor:'rgba(255,255,255,0.06)'}}>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-3xl font-black" style={{fontFamily:'JetBrains Mono',color:myColor,textShadow:`0 0 20px ${myColor}60`}}>{formation}</div>
                  <div className="text-base font-bold mt-0.5" style={{color:`${myColor}90`}}>{meta.style}</div>
                </div>
                <div className="flex-1 px-2">
                  {edgeData && <p className="text-center text-[15px] font-semibold mb-2" style={{color:'rgba(255,255,255,0.70)'}}>
                    {edgeData.winner==='Even'?'Even contest':`${edgeData.winner} holds ${edgeData.margin.toLowerCase()} edge`}
                  </p>}
                  <div className="relative h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
                    <div className="absolute left-0 top-0 h-full rounded-l-full" style={{width:`${edgePct}%`,background:`linear-gradient(90deg,${myColor}80,${myColor})`,transition:'width 1.2s cubic-bezier(0.16,1,0.3,1)'}}/>
                    <div className="absolute right-0 top-0 h-full rounded-r-full" style={{width:`${100-edgePct}%`,background:`linear-gradient(90deg,${oppColor},${oppColor}80)`,transition:'width 1.2s cubic-bezier(0.16,1,0.3,1)'}}/>
                  </div>
                  {edgeData && <p className="text-center text-[15px] mt-2 leading-relaxed" style={{color:'rgba(255,255,255,0.82)'}}>{edgeData.reason}</p>}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black" style={{fontFamily:'JetBrains Mono',color:oppColor,textShadow:`0 0 20px ${oppColor}60`}}>{oF}</div>
                  <div className="text-base font-bold mt-0.5 text-right" style={{color:`${oppColor}90`}}>{oppMeta.style}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ MATCHUP INTELLIGENCE ══════════════════════════════════════════ */}
        <div className="rounded-2xl overflow-hidden relative" style={{
          background:'rgba(4,8,18,0.85)',
          backdropFilter:'blur(40px)',
          border:'1px solid rgba(255,255,255,0.08)',
          boxShadow:`0 0 40px ${myColor}10, 0 0 40px ${oppColor}10`,
        }}>
          <div className="h-px" style={{background:`linear-gradient(90deg,${myColor},${myColor}60 30%,rgba(255,255,255,0.1) 50%,${oppColor}60 70%,${oppColor})`}}/>
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <div className="absolute top-0 left-0 w-56 h-full" style={{background:`radial-gradient(ellipse at left center,${myColor}10,transparent 70%)`}}/>
            <div className="absolute top-0 right-0 w-56 h-full" style={{background:`radial-gradient(ellipse at right center,${oppColor}10,transparent 70%)`}}/>
          </div>
          <div className="relative grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 divide-x-0 sm:divide-x" style={{borderColor:'rgba(255,255,255,0.06)'}}>

            {/* Tactical Balance */}
            <div className="px-5 py-5">
              <p className="text-base font-black uppercase tracking-[0.15em] mb-4" style={{color:'rgba(255,255,255,0.82)'}}>Tactical Balance</p>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="text-[26px] font-black leading-none" style={{fontFamily:'JetBrains Mono',color:myColor,textShadow:`0 0 20px ${myColor}80`}}>{formation}</div>
                  <div className="text-base font-semibold mt-1" style={{color:`${myColor}70`}}>{meta.style}</div>
                </div>
                <div className="text-center">
                  <div className="text-[15px] font-semibold" style={{color:'rgba(255,255,255,0.80)'}}>
                    {scoreDiff>20?'clear edge':scoreDiff>8?'slight edge':'even contest'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[26px] font-black leading-none" style={{fontFamily:'JetBrains Mono',color:oppColor,textShadow:`0 0 20px ${oppColor}80`}}>{oF}</div>
                  <div className="text-base font-semibold mt-1 text-right" style={{color:`${oppColor}70`}}>{oppMeta.style}</div>
                </div>
              </div>
              <div className="relative h-8 flex items-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-[3px] rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
                    <div className="h-full" style={{width:`${edgePct}%`,background:`linear-gradient(90deg,${myColor}50,${myColor})`,transition:'width 1.2s cubic-bezier(0.16,1,0.3,1)'}}/>
                  </div>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[3px] rounded-r-full" style={{width:`${100-edgePct}%`,background:`linear-gradient(90deg,${oppColor},${oppColor}50)`,transition:'width 1.2s cubic-bezier(0.16,1,0.3,1)'}}/>
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10" style={{left:`${edgePct}%`,transition:'left 1.2s cubic-bezier(0.16,1,0.3,1)'}}>
                  <div className="w-3.5 h-3.5 rotate-45 rounded-sm" style={{
                    background: edgePct>52?myColor:edgePct<48?oppColor:'#f8fafc',
                    boxShadow:`0 0 12px ${edgePct>52?myColor:edgePct<48?oppColor:'#ffffff'}`,
                    border:'2px solid rgba(4,8,18,1)',
                  }}/>
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-base font-black" style={{fontFamily:'JetBrains Mono',color:myColor}}>{edgePct}%</span>
                <span className="text-base font-black" style={{fontFamily:'JetBrains Mono',color:oppColor}}>{100-edgePct}%</span>
              </div>
            </div>

            {/* Identity */}
            <div className="px-5 py-5 flex flex-col justify-between">
              <p className="text-base font-black uppercase tracking-[0.15em] mb-4" style={{color:'rgba(255,255,255,0.82)'}}>Identity</p>
              <div className="flex items-center gap-3">
                <div className="w-0.5 h-10 rounded-full flex-shrink-0" style={{background:`linear-gradient(180deg,${myColor},${myColor}20)`}}/>
                <div className="flex-1">
                  <div className="text-[20px] font-black leading-none text-white" style={{fontFamily:'JetBrains Mono'}}>{formation}</div>
                  <div className="text-base font-bold mt-1" style={{color:myColor}}>{meta.style}</div>
                </div>
                <div className="flex gap-1 items-end flex-shrink-0">
                  {[ratings.press,ratings.transition,ratings.defensiveBlock].map((v,i)=>(
                    <div key={i} className="w-2 rounded-full" style={{height:`${8+(v/100)*16}px`,background:`${myColor}${i===0?'ff':i===1?'88':'44'}`}}/>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px" style={{background:'rgba(255,255,255,0.06)'}}/>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <SwordsIcon className="w-3 h-3" style={{color:'rgba(255,255,255,0.80)'}}/>
                </div>
                <div className="flex-1 h-px" style={{background:'rgba(255,255,255,0.06)'}}/>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-0.5 h-10 rounded-full flex-shrink-0" style={{background:`linear-gradient(180deg,${oppColor},${oppColor}20)`}}/>
                <div className="flex-1">
                  <div className="text-[20px] font-black leading-none text-white" style={{fontFamily:'JetBrains Mono'}}>{oF}</div>
                  <div className="text-base font-bold mt-1" style={{color:oppColor}}>{oppMeta.style}</div>
                </div>
                <div className="flex gap-1 items-end flex-shrink-0">
                  {[oppRatings.press,oppRatings.transition,oppRatings.defensiveBlock].map((v,i)=>(
                    <div key={i} className="w-2 rounded-full" style={{height:`${8+(v/100)*16}px`,background:`${oppColor}${i===0?'ff':i===1?'88':'44'}`}}/>
                  ))}
                </div>
              </div>
            </div>

            {/* Press Battle */}
            <div className="px-5 py-5">
              <p className="text-base font-black uppercase tracking-[0.15em] mb-4" style={{color:'rgba(255,255,255,0.82)'}}>Press Battle</p>
              <div className="space-y-3">
                {[
                  {label:'Pressing',   myV:ratings.press,          oppV:oppRatings.press,          c:'#f43f5e'},
                  {label:'Transition', myV:ratings.transition,     oppV:oppRatings.transition,     c:'#f59e0b'},
                  {label:'Defense',    myV:ratings.defensiveBlock, oppV:oppRatings.defensiveBlock, c:'#10b981'},
                  {label:'Set Piece',  myV:ratings.setPiece,       oppV:oppRatings.setPiece,       c:'#a855f7'},
                ].map(({label,myV,oppV,c})=>{
                  const mW=myV>oppV;
                  return (
                    <div key={label}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[15px] font-black" style={{fontFamily:'JetBrains Mono',color:mW?myColor:'rgba(255,255,255,0.55)'}}>{myV}</span>
                        <span className="text-base font-bold uppercase tracking-widest" style={{color:'rgba(255,255,255,0.80)'}}>{label}</span>
                        <span className="text-[15px] font-black" style={{fontFamily:'JetBrains Mono',color:!mW?oppColor:'rgba(255,255,255,0.55)'}}>{oppV}</span>
                      </div>
                      <div className="flex items-center gap-px h-2">
                        <div className="flex-1 flex justify-end overflow-hidden rounded-l-full h-full" style={{background:'rgba(255,255,255,0.04)'}}>
                          <div className="h-full rounded-l-full" style={{width:`${myV}%`,background:mW?`linear-gradient(90deg,${myColor}40,${myColor})`:`${myColor}20`,transition:'width 0.8s ease'}}/>
                        </div>
                        <div className="w-px h-3 flex-shrink-0" style={{background:'rgba(255,255,255,0.15)'}}/>
                        <div className="flex-1 overflow-hidden rounded-r-full h-full" style={{background:'rgba(255,255,255,0.04)'}}>
                          <div className="h-full rounded-r-full" style={{width:`${oppV}%`,background:!mW?`linear-gradient(90deg,${oppColor},${oppColor}40)`:`${oppColor}20`,transition:'width 0.8s ease'}}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ══ DUAL PITCH + DNA RADAR ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4">

          {/* Dual Pitch — color-split */}
          <div className="rounded-2xl overflow-hidden relative" style={{
            border:`1px solid rgba(255,255,255,0.08)`,
            backdropFilter:'blur(20px)',
          }}>
            {/* Left half myColor, right half oppColor */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-0 top-0 w-1/2 h-full" style={{background:`linear-gradient(90deg,${myColor}10,transparent)`}}/>
              <div className="absolute right-0 top-0 w-1/2 h-full" style={{background:`linear-gradient(270deg,${oppColor}10,transparent)`}}/>
            </div>
            <div className="relative px-4 py-3.5 border-b flex items-center gap-2" style={{borderColor:'rgba(255,255,255,0.07)',background:'rgba(4,8,18,0.6)'}}>
              <MapIcon className="w-3.5 h-3.5" style={{color:myColor}}/>
              <span className="text-white font-black text-base uppercase tracking-[0.12em]">Formation View</span>
              <span className="ml-auto text-base font-semibold uppercase tracking-widest" style={{color:'rgba(255,255,255,0.75)'}}>Role labels on each player</span>
            </div>
            <div className="relative p-4 flex items-start justify-center gap-2">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="flex items-center gap-2 w-full justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{background:myColor,boxShadow:`0 0 6px ${myColor}`}}/>
                    <span className="text-[15px] font-bold" style={{color:myColor}}>{formation}</span>
                  </div>
                  <span className="text-base" style={{color:'rgba(255,255,255,0.80)'}}>{meta.style}</span>
                </div>
                <TacticalPitchWithRoles formation={formation} color={myColor} width={165} height={206}/>
              </div>
              <div className="flex flex-col items-center justify-center self-stretch py-4 gap-2">
                <div className="w-px flex-1 rounded-full" style={{background:`linear-gradient(180deg,${myColor}30,rgba(255,255,255,0.05),${oppColor}30)`}}/>
                <SwordsIcon className="w-3.5 h-3.5 flex-shrink-0" style={{color:'rgba(255,255,255,0.80)'}}/>
                <div className="w-px flex-1 rounded-full" style={{background:`linear-gradient(180deg,${oppColor}30,rgba(255,255,255,0.05),${myColor}30)`}}/>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="flex items-center gap-2 w-full justify-between px-1">
                  <span className="text-base" style={{color:'rgba(255,255,255,0.80)'}}>{oppMeta.style}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-bold" style={{color:oppColor}}>{oF}</span>
                    <div className="w-2 h-2 rounded-full" style={{background:oppColor,boxShadow:`0 0 6px ${oppColor}`}}/>
                  </div>
                </div>
                <TacticalPitchWithRoles formation={oF} color={oppColor} mirror width={165} height={206}/>
              </div>
            </div>
          </div>

          {/* DNA Radar — deep glass */}
          <div className="rounded-2xl overflow-hidden relative" style={{
            background:'rgba(10,6,30,0.75)',
            backdropFilter:'blur(30px)',
            border:'1px solid rgba(168,85,247,0.15)',
            boxShadow:'0 0 40px rgba(99,102,241,0.08)',
          }}>
            <div className="h-px" style={{background:`linear-gradient(90deg,transparent,${myColor}60,rgba(168,85,247,0.6),${oppColor}60,transparent)`}}/>
            <div className="px-4 py-3.5 border-b flex items-center gap-2" style={{borderColor:'rgba(168,85,247,0.12)',background:'rgba(99,102,241,0.06)'}}>
              <TargetIcon className="w-3.5 h-3.5" style={{color:'#a78bfa'}}/>
              <span className="text-white font-black text-base uppercase tracking-[0.12em]">Formation DNA</span>
              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{background:myColor,boxShadow:`0 0 6px ${myColor}`}}/>
                  <span className="text-[15px] font-semibold text-white">{formation}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full border-2" style={{borderColor:oppColor,boxShadow:`0 0 6px ${oppColor}`}}/>
                  <span className="text-[15px] font-semibold text-white">{oF}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center items-center p-2">
              <DNARadar/>
            </div>
            <div className="px-4 pb-3 text-center">
              <p className="text-base font-semibold" style={{color:'rgba(255,255,255,0.75)'}}>Score format: <span style={{color:myColor}}>{formation}</span> · <span style={{color:oppColor}}>{oF}</span></p>
            </div>
          </div>
        </div>

        {/* ══ TACTICAL SIMULATION ══════════════════════════════════════════ */}
        <TacticalSimulation formation={formation} oppFormation={oF} teamName="" oppName=""/>

        {/* ══ PHASE OF PLAY ════════════════════════════════════════════════ */}
        <div className="rounded-2xl overflow-hidden relative" style={{
          background:'rgba(12,22,42,0.85)',
          backdropFilter:'blur(20px)',
          border:'1px solid rgba(34,211,238,0.12)',
        }}>
          <div className="h-px" style={{background:`linear-gradient(90deg,transparent,#22d3ee60,transparent)`}}/>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{borderColor:'rgba(34,211,238,0.08)',background:'rgba(34,211,238,0.05)'}}>
            <div className="flex items-center gap-2">
              <BarChartIcon className="w-3.5 h-3.5 text-cyan-400"/>
              <span className="text-white font-black text-base uppercase tracking-[0.12em]">Phase of Play</span>
            </div>
            <div className="flex items-center gap-3 text-base font-black">
              <span style={{color:myColor,textShadow:`0 0 12px ${myColor}60`}}>{formation}</span>
              <span style={{color:'rgba(255,255,255,0.50)'}}>vs</span>
              <span style={{color:oppColor,textShadow:`0 0 12px ${oppColor}60`}}>{oF}</span>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 gap-x-10 gap-y-5">
            {[
              {label:'In Possession',myVal:phases.inPoss,   oppVal:oppPhases.inPoss,   color:'#22d3ee'},
              {label:'Out of Poss.', myVal:phases.outPoss,  oppVal:oppPhases.outPoss,  color:'#10b981'},
              {label:'Pressing',     myVal:phases.pressing, oppVal:oppPhases.pressing, color:'#f43f5e'},
              {label:'Transitions',  myVal:phases.transition,oppVal:oppPhases.transition,color:'#f59e0b'},
              {label:'Width',        myVal:phases.width,    oppVal:oppPhases.width,    color:myColor},
              {label:'Build-Up',     myVal:phases.buildUp,  oppVal:oppPhases.buildUp,  color:'#38bdf8'},
            ].map(({label,myVal,oppVal,color})=>(
              <PhaseBar key={label} label={label} myVal={myVal} oppVal={oppVal} color={color}/>
            ))}
          </div>
        </div>

        {/* ══ SPACE INTELLIGENCE ═══════════════════════════════════════════ */}
        <div className="rounded-2xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="h-px" style={{background:'linear-gradient(90deg,transparent,rgba(16,185,129,0.6),transparent)'}}/> 
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{borderColor:'rgba(16,185,129,0.1)',background:'rgba(16,185,129,0.06)'}}>
            <CrosshairIcon className="w-3.5 h-3.5 text-emerald-400"/>
            <span className="text-white font-black text-base uppercase tracking-[0.12em]">Space Intelligence</span>
            <span className="ml-auto text-base font-semibold uppercase tracking-widest" style={{color:'rgba(255,255,255,0.75)'}}>Where each formation creates and concedes space</span>
          </div>
          <div className="grid grid-cols-2 divide-x" style={{borderColor:'rgba(255,255,255,0.06)'}}>
            {[{form:formation,spaceData:space,color:myColor},{form:oF,spaceData:oppSpace,color:oppColor}].map(({form,spaceData,color},si)=>(
              <div key={si} className="p-5 relative overflow-hidden" style={{background:`${color}05`}}>
                <div className="absolute top-0 left-0 w-full h-px" style={{background:`linear-gradient(90deg,${color}40,transparent)`}}/>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full" style={{background:color,boxShadow:`0 0 6px ${color}`}}/>
                  <span className="text-[15px] font-black" style={{color,fontFamily:'JetBrains Mono'}}>{form}</span>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-base font-black uppercase tracking-[0.12em] mb-2" style={{color:'#10b981'}}>Creates space in</p>
                  {(spaceData.creates||[]).map((z,i)=>(
                    <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-xl" style={{background:'rgba(16,185,129,0.07)',border:'1px solid rgba(16,185,129,0.12)'}}>
                      <div className="w-1 h-1 rounded-full flex-shrink-0 mt-1.5" style={{background:'#10b981'}}/>
                      <p className="text-white text-base leading-snug">{z}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-base font-black uppercase tracking-[0.12em] mb-2" style={{color:'#f43f5e'}}>Concedes space</p>
                  {(spaceData.concedes||[]).map((z,i)=>(
                    <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-xl" style={{background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.1)'}}>
                      <div className="w-1 h-1 rounded-full flex-shrink-0 mt-1.5" style={{background:'#f43f5e'}}/>
                      <p className="text-slate-300 text-base leading-snug">{z}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ SCENARIO PLANNER ════════════════════════════════════════════ */}
        <div className="rounded-2xl overflow-hidden relative" style={{
          border:`1px solid ${scData.color}25`,
          backdropFilter:'blur(20px)',
          boxShadow:`0 0 40px ${scData.color}10`,
        }}>
          <div className="h-px" style={{background:`linear-gradient(90deg,transparent,${scData.color},transparent)`}}/>
          <div className="absolute inset-0 pointer-events-none" style={{background:`radial-gradient(ellipse at top center,${scData.color}08,transparent 60%)`}}/>
          <div className="relative px-5 py-4 border-b flex items-center gap-2" style={{borderColor:`${scData.color}15`,background:`${scData.color}08`}}>
            <ZapIcon className="w-3.5 h-3.5" style={{color:scData.color}}/>
            <span className="text-white font-black text-base uppercase tracking-[0.12em]">Scenario Planner</span>
            <span className="ml-auto text-base font-semibold uppercase tracking-widest" style={{color:'rgba(255,255,255,0.75)'}}>What to do in this situation</span>
          </div>
          {/* Scenario selector */}
          <div className="flex gap-2 px-4 py-3 border-b overflow-x-auto" style={{borderColor:'rgba(255,255,255,0.06)',background:'rgba(4,8,18,0.4)'}}>
            {Object.entries(SCENARIO_DATA).map(([key,sc])=>(
              <button key={key} onClick={()=>setActiveScenario(key)}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl text-base font-bold transition-all whitespace-nowrap"
                style={{
                  background: activeScenario===key ? `${sc.color}18` : 'rgba(255,255,255,0.03)',
                  border: activeScenario===key ? `1px solid ${sc.color}45` : '1px solid rgba(255,255,255,0.06)',
                  color: activeScenario===key ? sc.color : 'rgba(255,255,255,0.65)',
                  boxShadow: activeScenario===key ? `0 0 16px ${sc.color}20` : 'none',
                }}>
                <span className="block text-base font-semibold mb-0.5" style={{opacity:0.6}}>{sc.sub}</span>
                {sc.label}
              </button>
            ))}
          </div>
          {/* Plans */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckIcon className="w-3.5 h-3.5 text-emerald-400"/>
                <span className="text-[15px] font-black uppercase tracking-[0.12em] text-emerald-400">Do This</span>
              </div>
              <div className="space-y-2">
                {scPlan.map((item,i)=>(
                  <div key={i} className="flex items-start gap-3 px-3.5 py-2.5 rounded-xl" style={{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.15)'}}>
                    <div className="w-4 h-4 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:'rgba(16,185,129,0.2)',border:'1px solid rgba(16,185,129,0.3)'}}>
                      <span className="text-emerald-400 text-base font-black">{i+1}</span>
                    </div>
                    <span className="text-white text-base leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertIcon className="w-3.5 h-3.5 text-red-400"/>
                <span className="text-[15px] font-black uppercase tracking-[0.12em] text-red-400">Avoid This</span>
              </div>
              <div className="space-y-2 mb-3">
                {scAvoid.map((item,i)=>(
                  <div key={i} className="flex items-start gap-3 px-3.5 py-2.5 rounded-xl" style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.15)'}}>
                    <AlertIcon className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5"/>
                    <span className="text-slate-300 text-base leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
              <div className="px-3.5 py-3 rounded-xl" style={{background:`rgba(245,158,11,0.08)`,border:'1px solid rgba(245,158,11,0.2)'}}>
                <p className="text-base font-black uppercase tracking-[0.12em] mb-2" style={{color:'#f59e0b'}}>If Plan A Fails</p>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[15px] font-black" style={{fontFamily:'JetBrains Mono',color:myColor}}>{formation}</span>
                  <ArrowRightIcon className="w-3 h-3" style={{color:'rgba(255,255,255,0.80)'}}/>
                  <span className="text-[15px] font-black" style={{fontFamily:'JetBrains Mono',color:'#f59e0b'}}>
                    {recommendation.match(/switch to|shift to|move to/i)?recommendation.match(/[\d-]+(?:-[\d]+)*/)?.[0]||'4-2-3-1':'4-2-3-1'}
                  </span>
                </div>
                <p className="text-[15px] leading-relaxed" style={{color:'rgba(255,255,255,0.70)'}}>{recommendation}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ══ EXPLAIN PANEL ════════════════════════════════════════════════ */}
        <div className="rounded-2xl overflow-hidden" style={{
          background:'rgba(8,6,28,0.8)',
          backdropFilter:'blur(20px)',
          border:'1px solid rgba(99,102,241,0.2)',
          boxShadow:'0 0 40px rgba(99,102,241,0.08)',
        }}>
          <div className="h-px" style={{background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.8),transparent)'}}/> 
          <button onClick={()=>setShowExplain(v=>!v)}
            className="w-full px-5 py-4 flex items-center gap-3 transition-all"
            style={{background:'rgba(99,102,241,0.06)'}}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.3)'}}>
              <BrainIcon className="w-4 h-4" style={{color:'#818cf8'}}/>
            </div>
            <div className="text-left flex-1">
              <span className="text-white font-black text-base block">
                Why does <span style={{color:myColor}}>{formation}</span> {edgeData?.winner===formation?'beat':'match up with'} <span style={{color:oppColor}}>{oF}</span>?
              </span>
              <span className="text-[15px]" style={{color:'rgba(255,255,255,0.80)'}}>Tactical deep-dive</span>
            </div>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center transition-transform duration-200"
              style={{background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.3)',transform:showExplain?'rotate(90deg)':'none'}}>
              <ChevronIcon className="w-3.5 h-3.5" style={{color:'#818cf8'}}/>
            </div>
          </button>
          {showExplain && (
            <div className="p-5 space-y-3" style={{animation:'fadeSlideIn 0.2s ease-out'}}>
              {edgeData ? (<>
                <div className="flex items-center gap-4 px-4 py-4 rounded-2xl" style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)'}}>
                  <div className="flex-1">
                    <p className="text-base font-black uppercase tracking-[0.12em] mb-1.5" style={{color:'#818cf8'}}>Verdict</p>
                    <p className="text-white font-black text-base">{edgeData.verdict||`${edgeData.winner==='Even'?'Evenly matched':edgeData.winner+' holds '+edgeData.margin.toLowerCase()+' edge'}`}</p>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <div className="text-3xl font-black" style={{fontFamily:'JetBrains Mono',color:edgePct>52?myColor:edgePct<48?oppColor:'#f59e0b',textShadow:`0 0 20px ${edgePct>52?myColor:edgePct<48?oppColor:'#f59e0b'}60`}}>{edgePct}%</div>
                    <div className="text-base font-bold uppercase tracking-widest mt-0.5" style={{color:'rgba(255,255,255,0.80)'}}>Win rate</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-base font-black mb-2">
                    <span style={{color:myColor}}>{formation} · {edgePct}%</span>
                    <span style={{color:oppColor}}>{oF} · {100-edgePct}%</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden flex" style={{background:'rgba(255,255,255,0.05)'}}>
                    <div className="h-full rounded-l-full" style={{width:`${edgePct}%`,background:`linear-gradient(90deg,${myColor}60,${myColor})`,transition:'width 1s ease'}}/>
                    <div className="h-full rounded-r-full" style={{width:`${100-edgePct}%`,background:`linear-gradient(90deg,${oppColor},${oppColor}60)`}}/>
                  </div>
                </div>
                <div className="px-4 py-3.5 rounded-2xl" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>
                  <p className="text-base font-black uppercase tracking-[0.12em] mb-2" style={{color:'rgba(255,255,255,0.82)'}}>The tactical reason</p>
                  <p className="text-white text-base leading-relaxed">{edgeData.reason}</p>
                </div>
                <div className="px-4 py-3.5 rounded-2xl" style={{background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.18)'}}>
                  <p className="text-base font-black uppercase tracking-[0.12em] mb-2" style={{color:'#f59e0b'}}>The decisive battle</p>
                  <p className="text-white text-base leading-relaxed">{FORMATION_DUELS[duelKey]?.[1]||FORMATION_DUELS[altDuelKey]?.[1]||'The midfield battle — whoever wins the central zones controls the match.'}</p>
                </div>
              </>) : (
                <div className="text-center py-6 text-base" style={{color:'rgba(255,255,255,0.80)'}}>No historical data for {formation} vs {oF} yet.</div>
              )}
            </div>
          )}
        </div>

        {/* ══ POSITION BATTLES + STRENGTHS ════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4">

          {/* Position battles */}
          <div className="rounded-2xl overflow-hidden" style={{
            background:'rgba(12,22,42,0.85)',
            backdropFilter:'blur(20px)',
            border:'1px solid rgba(249,115,22,0.18)',
            boxShadow:'0 0 30px rgba(249,115,22,0.06)',
          }}>
            <div className="h-px" style={{background:'linear-gradient(90deg,transparent,rgba(249,115,22,0.8),transparent)'}}/>
            <div className="px-4 py-3.5 border-b flex items-center gap-2" style={{borderColor:'rgba(249,115,22,0.12)',background:'rgba(249,115,22,0.07)'}}>
              <SwordsIcon className="w-3.5 h-3.5 text-orange-400"/>
              <span className="text-white font-black text-base uppercase tracking-[0.12em]">Key Battles</span>
            </div>
            <div className="divide-y" style={{borderColor:'rgba(255,255,255,0.04)'}}>
              {duels.map((duel,i)=>{
                const zc=i===0?'#f43f5e':i===1?'#22d3ee':'#10b981';
                const zLabel=i===0?'ATTACK':i===1?'MIDFIELD':'DEFENSE';
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 transition-all hover:brightness-125" style={{background:`${zc}04`}}>
                    <div className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-base font-black uppercase tracking-widest min-w-[56px] text-center"
                      style={{color:zc,background:`${zc}18`,border:`1px solid ${zc}30`}}>{zLabel}</div>
                    <p className="text-white text-base flex-1 leading-snug">{duel}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-base font-black px-2 py-1 rounded-lg" style={{fontFamily:'JetBrains Mono',color:myColor,background:`${myColor}15`,border:`1px solid ${myColor}30`}}>{formation.split('-')[i]||'?'}</span>
                      <span className="text-base" style={{color:'rgba(255,255,255,0.50)'}}>v</span>
                      <span className="text-base font-black px-2 py-1 rounded-lg" style={{fontFamily:'JetBrains Mono',color:oppColor,background:`${oppColor}15`,border:`1px solid ${oppColor}30`}}>{oF.split('-')[i]||'?'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strengths + Vulnerabilities */}
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden" style={{
              background:'rgba(4,18,10,0.8)',
              backdropFilter:'blur(20px)',
              border:'1px solid rgba(16,185,129,0.2)',
              boxShadow:'0 0 30px rgba(16,185,129,0.06)',
            }}>
              <div className="h-px" style={{background:'linear-gradient(90deg,transparent,rgba(16,185,129,0.7),transparent)'}}/>
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{borderColor:'rgba(16,185,129,0.15)',background:'rgba(16,185,129,0.08)'}}>
                <CheckIcon className="w-3.5 h-3.5 text-emerald-400"/>
                <span className="font-black text-[15px] uppercase tracking-[0.12em] text-emerald-400">{formation} Strengths</span>
              </div>
              <div className="p-3 space-y-2">
                {meta.strengths.map((s,i)=>(
                  <div key={i} className="flex items-start gap-2.5 px-2.5 py-2 rounded-xl" style={{background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.1)'}}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{background:'#10b981',boxShadow:'0 0 4px #10b981'}}/>
                    <p className="text-white text-base leading-snug">{s}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{
              background:'rgba(18,4,8,0.8)',
              backdropFilter:'blur(20px)',
              border:'1px solid rgba(239,68,68,0.2)',
              boxShadow:'0 0 30px rgba(239,68,68,0.06)',
            }}>
              <div className="h-px" style={{background:'linear-gradient(90deg,transparent,rgba(239,68,68,0.7),transparent)'}}/>
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{borderColor:'rgba(239,68,68,0.15)',background:'rgba(239,68,68,0.08)'}}>
                <AlertIcon className="w-3.5 h-3.5 text-red-400"/>
                <span className="font-black text-[15px] uppercase tracking-[0.12em] text-red-400">{formation} Vulnerabilities</span>
              </div>
              <div className="p-3 space-y-2">
                {meta.weaknesses.map((w,i)=>(
                  <div key={i} className="flex items-start gap-2.5 px-2.5 py-2 rounded-xl" style={{background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.1)'}}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{background:'#f43f5e',boxShadow:'0 0 4px #f43f5e'}}/>
                    <p className="text-slate-200 text-base leading-snug">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  };




  /* ═══ RENDER ═══ */

  // Per-tab config — hero, accent colour, ambient glow
  const TAB_CONFIG = {
    match:    { label:'Match Prediction',  sub:'Poisson ML + Gemini AI deep analysis',          accent:'#22d3ee', glow1:'rgba(34,211,238,0.06)',  glow2:'rgba(168,85,247,0.04)' },
    team:     { label:'Team Comparison', sub:'Head-to-head stats · radar · H2H · form', accent:'#a855f7', glow1:'rgba(168,85,247,0.06)', glow2:'rgba(34,211,238,0.03)' },
    scout:    { label:'Scout Report',      sub:'Percentile rankings · xG intelligence · AI analysis', accent:'#10b981', glow1:'rgba(16,185,129,0.06)',  glow2:'rgba(34,211,238,0.03)' },
    xglab:    { label:'xG Intelligence',   sub:'Expected goals · shot efficiency · league DNA',  accent:'#a855f7', glow1:'rgba(168,85,247,0.06)',  glow2:'rgba(34,211,238,0.03)' },
    tactical: { label:'Tactical Analysis', sub:'Formation intelligence · scenarios · live simulation', accent:'#f59e0b', glow1:'rgba(245,158,11,0.05)',  glow2:'rgba(239,68,68,0.03)'  },
  };
  const tc = TAB_CONFIG[activeTab] || TAB_CONFIG.match;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden" style={{fontFamily:"'Outfit', sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>

      {/* ── Ambient background — changes per tab ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{zIndex:0}}>
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[120px] transition-all duration-1000" style={{background:tc.glow1}}/>
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[100px] transition-all duration-1000" style={{background:tc.glow2}}/>
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
      </div>

      <NavBar currentPage="analysis" onNavigate={onNavigate}>
        {/* Backend status pill */}
        {backendOnline
          ? <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border" style={{background:'rgba(16,185,129,0.08)',borderColor:'rgba(16,185,129,0.2)',color:'#10b981'}}>
              <CheckIcon className="w-3 h-3"/>Online
            </span>
          : <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border" style={{background:'rgba(245,158,11,0.08)',borderColor:'rgba(245,158,11,0.2)',color:'#f59e0b'}}>
              <AlertIcon className="w-3 h-3"/>Offline
            </span>}
      </NavBar>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-5 md:px-6 py-5 sm:py-8" style={{zIndex:1}}>

        {/* ── PAGE HERO — changes per tab ── */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{background:tc.accent}}/>
              <span className="text-sm font-bold uppercase tracking-[0.2em]" style={{color:tc.accent}}>
                Football Analyst AI
              </span>
            </div>
            {/* Saved predictions toggle — belongs here not in NavBar */}
            <button onClick={()=>setShowSaved(!showSaved)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border"
              style={showSaved
                ? {background:'rgba(34,211,238,0.1)',borderColor:'rgba(34,211,238,0.25)',color:'#22d3ee'}
                : {background:'rgba(255,255,255,0.04)',borderColor:'rgba(255,255,255,0.08)',color:'#64748b'}}>
              <SaveIcon className="w-4 h-4"/>
              <span className="hidden sm:inline">Saved</span>
              {savedPredictions.length > 0 && (
                <span className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center"
                  style={{background:'rgba(34,211,238,0.2)',color:'#22d3ee'}}>
                  {savedPredictions.length}
                </span>
              )}
            </button>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none mb-4">
            {activeTab === 'match' && <>Match<br/><span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">Prediction</span></>}
            {activeTab === 'team' && <>Team<br/><span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">Comparison</span></>}
            {activeTab === 'scout' && <>Scout<br/><span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">Report</span></>}
            {activeTab === 'xglab' && <>xG<br/><span className="bg-gradient-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">Intelligence</span></>}
            {activeTab === 'tactical' && <>Tactical<br/><span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">Analysis</span></>}
          </h1>
          <p className="text-slate-300 text-base max-w-lg leading-relaxed">{tc.sub}</p>
        </div>

        {/* ── SAVED PREDICTIONS PANEL ── */}
        {showSaved && (
          <div className="rounded-2xl border border-white/12 mb-6 overflow-hidden" style={{background:'rgba(14,24,46,0.95)',animation:'slideDown 0.2s ease-out'}}>
            <div className="px-5 py-4 border-b border-white/12 flex items-center justify-between" style={{background:'rgba(34,211,238,0.04)'}}>
              <div className="flex items-center gap-2">
                <SaveIcon className="w-4 h-4 text-cyan-400"/>
                <span className="text-white font-bold text-base">Saved Predictions</span>
                <span className="text-slate-400 text-base px-2 py-0.5 rounded-lg border border-white/12" style={{background:'rgba(255,255,255,0.03)'}}>{savedPredictions.length}</span>
              </div>
              <button onClick={()=>setShowSaved(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white border border-white/12 hover:border-white/20 transition-all" style={{background:'rgba(255,255,255,0.03)'}}>
                <XIcon className="w-3.5 h-3.5"/>
              </button>
            </div>
            {savedPredictions.length === 0
              ? <div className="py-10 text-center"><p className="text-slate-400 text-base">No saved predictions yet.</p></div>
              : <div className="divide-y divide-white/[0.04] max-h-64 overflow-y-auto" style={{scrollbarWidth:'thin',scrollbarColor:'#1e293b transparent'}}>
                  {savedPredictions.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base font-semibold truncate">{p.query}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-slate-400 text-base">{p.date}</span>
                          <span className="text-base" style={{color:tc.accent}}>{p.league}</span>
                          {p.mlData?.predicted_outcome && <span className="text-yellow-400 text-base font-bold">{p.mlData.predicted_outcome}</span>}
                        </div>
                      </div>
                      <button onClick={()=>{setInput(p.query);setActiveTab(p.tab);setSelectedLeague(p.league);setShowSaved(false);}}
                        className="px-3 py-1.5 rounded-lg text-base font-semibold border transition-all hover:opacity-80"
                        style={{background:'rgba(34,211,238,0.08)',borderColor:'rgba(34,211,238,0.2)',color:'#22d3ee'}}>
                        Load
                      </button>
                      <button onClick={()=>deleteSaved(p.id)} className="text-slate-400 hover:text-red-400 transition-all p-1">
                        <TrashIcon className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* ── TAB BAR ── */}
        <div className="flex gap-1 mb-8 rounded-2xl p-1.5 border border-white/12" style={{background:'rgba(10,14,26,0.6)'}}>
          {analysisTypes.map(type => {
            const isActive = activeTab === type.id;
            const cfg = TAB_CONFIG[type.id] || TAB_CONFIG.match;
            return (
              <button key={type.id}
                onClick={()=>{setActiveTab(type.id);setMlData(null);setAnalysis('');setMlError('');setH2hData(null);setHomeFixtures(null);setAwayFixtures(null);setInput('');}}
                className="relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 overflow-hidden"
                style={{
                  background: isActive ? `linear-gradient(135deg,${cfg.accent}22,${cfg.accent}08)` : 'transparent',
                  border: isActive ? `1px solid ${cfg.accent}35` : '1px solid transparent',
                  boxShadow: isActive ? `0 4px 20px ${cfg.accent}15` : 'none',
                }}>
                {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{background:`linear-gradient(90deg,transparent,${cfg.accent},transparent)`}}/>}
                <type.icon className="w-4 h-4 flex-shrink-0" style={{color: isActive ? cfg.accent : '#64748b'}}/>
                <span className="font-bold text-sm transition-colors hidden md:inline" style={{color: isActive ? cfg.accent : '#64748b'}}>
                  {type.name}
                </span>
                <span className="font-bold text-sm transition-colors md:hidden" style={{color: isActive ? cfg.accent : '#64748b'}}>
                  {type.shortName}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── MATCH PREDICTION INPUT PANEL ── */}
        {activeTab === 'match' && (
          <div className="mb-8">

            {/* League cards — same style as Simulator */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mb-5">
              {LEAGUES.map(l => {
                const isActive = selectedLeague === l;
                return (
                  <button key={l} onClick={() => setSelectedLeague(l)}
                    className="relative p-2 md:p4 rounded-2xl border transition-all text-center group"
                    style={{
                      background: isActive ? 'linear-gradient(135deg,rgba(34,211,238,0.12),rgba(168,85,247,0.05))' : 'rgba(255,255,255,0.02)',
                      borderColor: isActive ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)',
                      boxShadow: isActive ? '0 4px 24px rgba(34,211,238,0.12)' : 'none',
                    }}>
                    {LEAGUE_FLAG_IMG[l]
                      ? <img src={LEAGUE_FLAG_IMG[l]} alt={l}
                          className="w-9 h-9 mx-auto mb-2 object-contain transition-all"
                          style={{opacity: isActive ? 1 : 0.45, transform: isActive ? 'scale(1.1)' : 'scale(1)'}}/>
                      : <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-white/5"/>
                    }
                    <p className="text-sm font-semibold" style={{color: isActive ? 'white' : '#64748b'}}>
                      {l.replace(' League','').replace('Premier','EPL')}
                    </p>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full"
                        style={{background:'linear-gradient(90deg,#22d3ee,#a855f7)'}}/>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Team selectors */}
            {teamsList.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div>
                  <label className="text-sm text-slate-400 uppercase tracking-widest mb-2 block font-bold">Home Team</label>
                  <select value={matchHome} onChange={e=>{setMatchHome(e.target.value);const away=matchAway||'';if(e.target.value&&away)setInput(`${e.target.value} vs ${away}`);else if(e.target.value)setInput(e.target.value+' vs ');}}
                    className="w-full px-4 py-3.5 rounded-xl text-white text-base focus:outline-none appearance-none cursor-pointer border"
                    style={{background:'rgba(34,211,238,0.05)',borderColor:'rgba(34,211,238,0.2)'}}>
                    <option value="" className="bg-[#0a0e1a]">Select home team…</option>
                    {teamsList.map(t=><option key={t} value={t} className="bg-[#0a0e1a]">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 uppercase tracking-widest mb-2 block font-bold">Away Team</label>
                  <select value={matchAway} onChange={e=>{setMatchAway(e.target.value);const home=matchHome||'';if(home&&e.target.value)setInput(`${home} vs ${e.target.value}`);else if(e.target.value)setInput('vs '+e.target.value);}}
                    className="w-full px-4 py-3.5 rounded-xl text-white text-base focus:outline-none appearance-none cursor-pointer border"
                    style={{background:'rgba(239,68,68,0.05)',borderColor:'rgba(239,68,68,0.2)'}}>
                    <option value="" className="bg-[#0a0e1a]">Select away team…</option>
                    {teamsList.filter(t=>t!==matchHome).map(t=><option key={t} value={t} className="bg-[#0a0e1a]">{t}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Text input */}
            <div className="relative mb-4">
              <input
                type="text"
                value={input}
                onChange={e=>{setInput(e.target.value);if(activeTab!=='player')setShowAuto(false);}}
                onKeyPress={e=>{if(e.key==='Enter'){setShowAuto(false);analyzeFootball();}}}
                placeholder="e.g. Arsenal vs Chelsea"
                className="w-full px-5 py-4 rounded-2xl text-base text-white border focus:outline-none pr-14"
                style={{background:'rgba(255,255,255,0.05)',borderColor:'rgba(255,255,255,0.12)',fontSize:16}}
              />
              <button onClick={toggleVoice}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center transition-all border"
                style={isListening
                  ? {background:'rgba(239,68,68,0.15)',borderColor:'rgba(239,68,68,0.3)',color:'#ef4444'}
                  : {background:'rgba(255,255,255,0.05)',borderColor:'rgba(255,255,255,0.1)',color:'#64748b'}}>
                <MicIcon className="w-4 h-4"/>
              </button>
            </div>

            {/* Full-width gradient Analyse button */}
            <button
              onClick={()=>{setShowAuto(false);analyzeFootball();}}
              disabled={loading||!input.trim()}
              className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all relative overflow-hidden group disabled:opacity-30"
              style={{background:'linear-gradient(135deg,#22d3ee 0%,#a855f7 50%,#3b82f6 100%)',boxShadow:'0 4px 32px rgba(34,211,238,0.25)'}}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{background:'rgba(255,255,255,0.08)'}}/>
              <div className="relative flex items-center justify-center gap-2.5">
                {loading
                  ? <><LoaderIcon className="w-5 h-5 animate-spin"/>Analysing {selectedLeague}…</>
                  : <><SearchIcon className="w-5 h-5"/>Analyse Match</>}
              </div>
            </button>
          </div>
        )}
        {/* ── TEAM COMPARISON INPUT PANEL ── */}
{activeTab === 'team' && (
  <div className="mb-8">
    {/* League selector */}
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mb-5">
      {LEAGUES.map(l => {
        const isActive = selectedLeague === l;
        return (
          <button key={l} onClick={() => setSelectedLeague(l)}
            className="relative p-2 rounded-2xl border transition-all text-center"
            style={{
              background: isActive ? 'linear-gradient(135deg,rgba(168,85,247,0.12),rgba(34,211,238,0.05))' : 'rgba(255,255,255,0.02)',
              borderColor: isActive ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.08)',
              boxShadow: isActive ? '0 4px 24px rgba(168,85,247,0.12)' : 'none',
            }}>
            {LEAGUE_FLAG_IMG[l]
              ? <img src={LEAGUE_FLAG_IMG[l]} alt={l} className="w-9 h-9 mx-auto mb-2 object-contain transition-all"
                  style={{opacity: isActive ? 1 : 0.45, transform: isActive ? 'scale(1.1)' : 'scale(1)'}}/>
              : <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-white/5"/>}
            <p className="text-sm font-semibold" style={{color: isActive ? 'white' : '#64748b'}}>
              {l.replace(' League','').replace('Premier','EPL')}
            </p>
            {isActive && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full"
                style={{background:'linear-gradient(90deg,#a855f7,#22d3ee)'}}/>
            )}
          </button>
        );
      })}
    </div>

    {/* Team selectors */}
    {teamsList.length > 0 && (
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-sm text-slate-400 uppercase tracking-widest mb-2 block font-bold">Team A</label>
          <select value={compTeamA} onChange={e => { setCompTeamA(e.target.value); if (e.target.value && compTeamB) setInput(`${e.target.value} vs ${compTeamB}`); }}
            className="w-full px-4 py-3.5 rounded-xl text-white text-base focus:outline-none appearance-none cursor-pointer border"
            style={{background:'rgba(34,211,238,0.05)', borderColor:'rgba(34,211,238,0.2)'}}>
            <option value="" className="bg-[#0a0e1a]">Select Team A…</option>
            {teamsList.map(t => <option key={t} value={t} className="bg-[#0a0e1a]">{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-400 uppercase tracking-widest mb-2 block font-bold">Team B</label>
          <select value={compTeamB} onChange={e => { setCompTeamB(e.target.value); if (compTeamA && e.target.value) setInput(`${compTeamA} vs ${e.target.value}`); }}
            className="w-full px-4 py-3.5 rounded-xl text-white text-base focus:outline-none appearance-none cursor-pointer border"
            style={{background:'rgba(168,85,247,0.05)', borderColor:'rgba(168,85,247,0.2)'}}>
            <option value="" className="bg-[#0a0e1a]">Select Team B…</option>
            {teamsList.filter(t => t !== compTeamA).map(t => <option key={t} value={t} className="bg-[#0a0e1a]">{t}</option>)}
          </select>
        </div>
      </div>
    )}

    <button
      onClick={() => { setShowAuto(false); analyzeFootball(); }}
      disabled={loading || (!compTeamA && !compTeamB)}
      className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all relative overflow-hidden group disabled:opacity-30"
      style={{background:'linear-gradient(135deg,#a855f7 0%,#22d3ee 50%,#7c3aed 100%)', boxShadow:'0 4px 32px rgba(168,85,247,0.25)'}}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{background:'rgba(255,255,255,0.08)'}}/>
      <div className="relative flex items-center justify-center gap-2.5">
        {loading
          ? <><LoaderIcon className="w-5 h-5 animate-spin"/>Comparing teams…</>
          : <><CompareIcon className="w-5 h-5"/>Compare Teams</>}
      </div>
    </button>
  </div>
)}

        {/* ── SCOUT / xG TABS ── */}
        {activeTab === 'scout' && <ScoutReportTab selectedLeague={selectedLeague}/>}
        {activeTab === 'xglab' && <XGLabTab selectedLeague={selectedLeague}/>}

        {/* ── ERROR ── */}
        {mlError && (
          <div className="rounded-2xl p-4 mb-5 border border-red-500/20 flex items-start gap-3" style={{background:'rgba(239,68,68,0.06)'}}>
            <AlertIcon className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"/>
            <p className="text-red-300 text-base leading-relaxed">{mlError}</p>
          </div>
        )}

        {/* ── LOADING STATE — context-aware ── */}
       {loading && <AppLoader title="Running Analysis" sub="ML model + Gemini AI — this takes a few seconds" color={tc.accent}/>}

        {/* ── MATCH PREDICTION RESULTS ── */}
        {!loading && renderMatchPrediction()}

        {/* ── TACTICAL ANALYSIS ── */}
        {!loading && activeTab === 'tactical' && tactData && renderTacticalAnalysis()}

        {/* ── TEAM COMPARISON ── */}
        {!loading && activeTab === 'team' && compData && renderTeamComparison()}  
{/* ── MATCH ACTION BAR (Share / Export / Save) — MATCH ONLY ── */}
{!loading && activeTab === 'match' && (mlData || analysis) && (
  <div className="flex items-center justify-end gap-2 mb-5 flex-wrap">
    <button
      onClick={()=>{
        const homeN = mlData?.home_team_name||'', awayN = mlData?.away_team_name||'';
        const text = `Scorina AI ⚽\n${homeN} vs ${awayN}\n${homeN} ${(mlData?.home_win*100||0).toFixed(1)}% | Draw ${(mlData?.draw*100||0).toFixed(1)}% | ${awayN} ${(mlData?.away_win*100||0).toFixed(1)}%\nPrediction: ${mlData?.predicted_outcome||''} (${((mlData?.confidence||0)*100).toFixed(0)}%)\n\nscorainai.com`;
        if(navigator.share) navigator.share({title:'Scorina AI',text}).catch(()=>{});
        else navigator.clipboard.writeText(text).then(()=>alert('Copied to clipboard!'));
      }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:border-purple-500/30 hover:text-purple-400"
      style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.08)',color:'#64748b'}}>
      <ShareIcon className="w-3.5 h-3.5"/>Share
    </button>
    {mlData && (
      <button
        onClick={()=>exportShareCard(mlData,h2hData).catch(console.error)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:border-pink-500/30 hover:text-pink-400"
        style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.08)',color:'#64748b'}}>
        📲 Card
      </button>
    )}
    {mlData && (
      <ExportButton label="PDF" onClick={()=>exportMatchPrediction(mlData,h2hData,homeFixtures,awayFixtures,analysis,scorersData)}/>
    )}
    <button
      onClick={savePrediction}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:border-cyan-500/30 hover:text-cyan-400"
      style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.08)',color:'#64748b'}}>
      <SaveIcon className="w-3.5 h-3.5"/>Save
    </button>
  </div>
)}

        {/* ── AI ANALYSIS BLOCK — MATCH ONLY ── */}
        {!loading && activeTab === 'match' && analysis && (
          <div className="mb-6 rounded-2xl border border-white/12 overflow-hidden" style={{background:'rgba(14,24,46,0.92)'}}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/12 flex items-center justify-between" style={{background:'linear-gradient(90deg,rgba(34,211,238,0.06),rgba(168,85,247,0.04),transparent)'}}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border relative" style={{background:'rgba(34,211,238,0.1)',borderColor:'rgba(34,211,238,0.2)'}}>
                  <BrainIcon className="w-5 h-5 text-cyan-400"/>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#040810]"/>
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">Match Analysis</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-slate-300 text-base">Generated by</span>
                    <span className="text-base font-bold text-cyan-400">Gemini AI</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border" style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.06)'}}>
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
                  <span className="text-slate-400 text-base font-medium">Live</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg border" style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.06)'}}>
                  <span className="text-slate-300 text-base">{selectedLeague}</span>
                </div>
              </div>
            </div>
            {/* Body */}
            <div className="p-5 md:p-7 max-h-[650px] overflow-y-auto" style={{scrollbarWidth:'thin',scrollbarColor:'#1e293b transparent'}}>
              {renderMarkdown(analysis)}
            </div>
            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-white/20 flex flex-wrap items-center justify-between gap-3" style={{background:'rgba(0,0,0,0.2)'}}>
              <div className="flex items-center gap-4">
                {[{l:'Win',c:'#10b981'},{l:'Draw',c:'#f59e0b'},{l:'Loss',c:'#ef4444'}].map(x=>(
                  <div key={x.l} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{background:x.c}}/>
                    <span className="text-slate-300 text-base">{x.l}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full" style={{background:'linear-gradient(90deg,#22d3ee,#a855f7)'}}/>
                <span className="text-slate-400 text-base">Powered by Gemini · 2025/26 Season</span>
              </div>
            </div>
          </div>
        )}

        {/* ── MATCH EXAMPLES — MATCH ONLY ── */}
        {!analysis && !loading && !mlData && activeTab === 'match' && (
          <div className="rounded-2xl p-5 border border-white/12" style={{background:'rgba(8,14,26,0.6)'}}>
            <p className="text-slate-300 text-base font-semibold uppercase tracking-widest mb-3">Try an example</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {['Arsenal vs Chelsea','Real Madrid vs Barcelona','PSG vs Bayern Munich'].map((q,i)=>(
                <button key={i} onClick={()=>setInput(q)}
                  className="p-3.5 rounded-xl text-base text-left transition-all border flex items-center justify-between group"
                  style={{background:'rgba(255,255,255,0.02)',borderColor:'rgba(255,255,255,0.05)',color:'#64748b'}}>
                  <span className="group-hover:text-white transition-colors">{q}</span>
                  <ChevronIcon className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"/>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes slideDown  { from { opacity:0; transform:translateY(-8px);  } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeSlideIn{ from { opacity:0; transform:translateY(12px);  } to { opacity:1; transform:translateY(0); } }
        select option { background:#050810; }
        input::placeholder { color:#334155; }
      `}</style>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-white text-base font-semibold flex items-center gap-2 border"
          style={{background:'rgba(16,185,129,0.9)',borderColor:'rgba(16,185,129,0.4)',backdropFilter:'blur(16px)',boxShadow:'0 8px 32px rgba(16,185,129,0.25)',animation:'fadeSlideIn 0.3s ease-out'}}>
          <CheckIcon className="w-4 h-4"/>
          {toast}
        </div>
      )}
    </div>
  );
}

export default AnalysisPage;
