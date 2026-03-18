/**
 * TacticalSimulation.js — v2
 *
 * Bugs fixed:
 * - border-white/6, border-white/8 → border-white/[0.06] etc (non-standard Tailwind fractions)
 * - rAF loop used phaseIdx in deps causing restarts; moved to ref to avoid stale-closure churn
 * - Radar SVG was 220×220 in a 190px panel → now uses responsive viewBox with width="100%"
 * - MetricBar transition was "none" string — kept intentionally; verified correct
 * - Phase switcher manual click didn't reset startRef properly in all paths → fixed
 *
 * Improvements:
 * - Speed control (0.5×/1×/2×)
 * - Formation selector dropdowns in header (home + opp)
 * - Player token shows jersey number on hover
 * - Dual-team radar overlay when "vs Opp" is active
 * - Passing lane arrows now animate with stroke-dashoffset
 * - Matchup summary badge ("3-5-2 exploits width vs 4-3-3")
 * - Consistent card/border/bg tokens matching rest of app
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Icon helper ────────────────────────────────────────────────────
const Ic = ({ d, className = 'w-4 h-4', sw = 1.8 }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const PlayIcon     = p => <Ic {...p} d={<polygon points="5 3 19 12 5 21 5 3"/>}/>;
const PauseIcon    = p => <Ic {...p} d={<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>}/>;
const AlertTriIcon = p => <Ic {...p} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>;
const ChevronIcon  = p => <Ic {...p} d={<polyline points="6 9 12 15 18 9"/>}/>;
const SpeedIcon    = p => <Ic {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;

// ── Formations ─────────────────────────────────────────────────────
const ALL_FORMATIONS = ['4-3-3','4-4-2','4-2-3-1','3-5-2','3-4-3','4-1-4-1','5-3-2','5-4-1','4-3-1-2'];

const POSITION_LABELS = {
  '4-3-3':   ['GK','RB','RCB','LCB','LB','RCM','CM','LCM','RW','ST','LW'],
  '4-4-2':   ['GK','RB','RCB','LCB','LB','RM','RCM','LCM','LM','RST','LST'],
  '4-2-3-1': ['GK','RB','RCB','LCB','LB','RDM','LDM','RAM','CAM','LAM','ST'],
  '3-5-2':   ['GK','RCB','CB','LCB','RWB','RCM','CM','LCM','LWB','RST','LST'],
  '3-4-3':   ['GK','RCB','CB','LCB','RWB','RCM','LCM','LWB','RW','ST','LW'],
  '4-1-4-1': ['GK','RB','RCB','LCB','LB','DM','RM','RCM','LCM','LM','ST'],
  '5-3-2':   ['GK','RWB','RCB','CB','LCB','LWB','RCM','CM','LCM','RST','LST'],
  '5-4-1':   ['GK','RWB','RCB','CB','LCB','LWB','RM','RCM','LCM','LM','ST'],
  '4-3-1-2': ['GK','RB','RCB','LCB','LB','RCM','CM','LCM','CAM','RST','LST'],
};

// ── Formation matchup intelligence ─────────────────────────────────
const MATCHUP_NOTES = {
  '4-3-3|4-4-2':   { note: 'Wingers vs flat 4 — wide channels exploitable',   edge: 'home' },
  '4-4-2|4-3-3':   { note: 'Compact 4-4-2 blocks CM triangle',                edge: 'away' },
  '4-2-3-1|4-3-3': { note: 'Double pivot overloads central zone',              edge: 'home' },
  '3-5-2|4-3-3':   { note: 'Wing-backs pin fullbacks; midfield overload',      edge: 'home' },
  '4-3-3|3-5-2':   { note: 'Wingers exploit 3-back width on transition',       edge: 'away' },
  '5-4-1|4-3-3':   { note: 'Low block absorbs pressure; counters via flanks',  edge: 'away' },
  '4-3-3|4-2-3-1': { note: '#10 pockets between lines, disrupts press shape',  edge: 'away' },
};

// ── Phase data ─────────────────────────────────────────────────────
const FORMATION_PHASES = {
  '4-3-3': {
    buildup:    { label:'Build-Up',      desc:'GK plays short, CBs split, fullbacks push, CM triangle receives',     color:'#22d3ee', positions:[[50,92],[80,80],[62,82],[38,82],[20,80],[65,65],[50,58],[35,65],[78,40],[50,30],[22,40]], ball:[50,88], pressLine:70, metrics:{width:82,depth:62,pressHeight:30,compactness:65} },
    press:      { label:'Press Trigger', desc:'Wingers press CBs on signal, striker blocks pivot, shape compresses', color:'#f59e0b', positions:[[50,92],[78,72],[62,78],[38,78],[22,72],[62,55],[50,50],[38,55],[72,25],[50,20],[28,25]], ball:[30,22], pressLine:55, metrics:{width:72,depth:72,pressHeight:20,compactness:55} },
    attack:     { label:'Attacking',     desc:'High wide positions, fullbacks overlap, 3 forwards pin back 4',      color:'#10b981', positions:[[50,92],[85,52],[62,68],[38,68],[15,52],[68,42],[50,35],[32,42],[82,15],[50,10],[18,15]], ball:[50,22], pressLine:40, metrics:{width:95,depth:82,pressHeight:10,compactness:40} },
    transition: { label:'Transition',    desc:'Immediate counter-press on loss, wingers drop, midfield covers',     color:'#a855f7', positions:[[50,92],[75,65],[62,72],[38,72],[25,65],[65,52],[50,48],[35,52],[72,35],[50,28],[28,35]], ball:[65,52], pressLine:50, metrics:{width:72,depth:64,pressHeight:28,compactness:58} },
    defend:     { label:'Defensive',     desc:'Mid-block 4-3-3, wingers screen fullbacks, midfield compact',       color:'#ef4444', positions:[[50,92],[80,78],[62,80],[38,80],[20,78],[68,62],[50,60],[32,62],[65,50],[50,48],[35,50]], ball:[62,32], pressLine:62, metrics:{width:60,depth:44,pressHeight:48,compactness:78} },
  },
  '4-4-2': {
    buildup:    { label:'Build-Up',      desc:'Wide mids provide build width, strikers occupy CBs, flat 4 holds',   color:'#22d3ee', positions:[[50,92],[82,78],[62,82],[38,82],[18,78],[82,55],[62,58],[38,58],[18,55],[62,35],[38,35]], ball:[50,88], pressLine:65, metrics:{width:85,depth:57,pressHeight:35,compactness:62} },
    press:      { label:'Press Trigger', desc:'Wide mids press fullbacks high, strikers cut passing lanes to CBs',  color:'#f59e0b', positions:[[50,92],[82,68],[62,75],[38,75],[18,68],[82,42],[60,52],[40,52],[18,42],[60,28],[40,28]], ball:[38,75], pressLine:50, metrics:{width:85,depth:64,pressHeight:28,compactness:52} },
    attack:     { label:'Attacking',     desc:'Wide mids push as wingers, two strikers stretch, fullbacks overlap', color:'#10b981', positions:[[50,92],[88,50],[62,65],[38,65],[12,50],[88,28],[62,42],[38,42],[12,28],[62,14],[38,14]], ball:[62,20], pressLine:35, metrics:{width:98,depth:78,pressHeight:14,compactness:38} },
    transition: { label:'Transition',    desc:'Two banks of 4 reform quickly, strikers hold as outlet',            color:'#a855f7', positions:[[50,92],[80,68],[62,72],[38,72],[20,68],[78,52],[58,52],[42,52],[22,52],[58,35],[42,35]], ball:[78,52], pressLine:55, metrics:{width:78,depth:57,pressHeight:35,compactness:62} },
    defend:     { label:'Defensive',     desc:'Classic 4-4-2 deep block, compact shape, strikers ready to counter',color:'#ef4444', positions:[[50,92],[82,78],[62,80],[38,80],[18,78],[80,65],[60,65],[40,65],[20,65],[60,52],[40,52]], ball:[65,42], pressLine:68, metrics:{width:72,depth:40,pressHeight:52,compactness:82} },
  },
  '4-2-3-1': {
    buildup:    { label:'Build-Up',      desc:'Double pivot receives from CBs, wide attackers stretch, #10 links',  color:'#22d3ee', positions:[[50,92],[82,75],[62,80],[38,80],[18,75],[65,62],[35,62],[72,45],[50,40],[28,45],[50,28]], ball:[65,62], pressLine:60, metrics:{width:80,depth:64,pressHeight:28,compactness:60} },
    press:      { label:'Press Trigger', desc:'#10 presses pivot on signal, wide attackers close fullbacks',        color:'#f59e0b', positions:[[50,92],[80,68],[62,75],[38,75],[20,68],[65,55],[35,55],[72,32],[50,28],[28,32],[50,18]], ball:[38,75], pressLine:45, metrics:{width:75,depth:74,pressHeight:18,compactness:50} },
    attack:     { label:'Attacking',     desc:'Fullbacks push high, #10 in the hole, wide cuts inside, pivot anchors',color:'#10b981',positions:[[50,92],[85,50],[62,65],[38,65],[15,50],[65,55],[35,55],[78,25],[50,22],[22,25],[50,12]], ball:[50,15], pressLine:38, metrics:{width:92,depth:80,pressHeight:12,compactness:42} },
    transition: { label:'Transition',    desc:'#10 presses immediately, wide players track runs, pivot holds shape',color:'#a855f7', positions:[[50,92],[78,65],[62,70],[38,70],[22,65],[65,55],[35,55],[72,38],[50,35],[28,38],[50,25]], ball:[65,45], pressLine:48, metrics:{width:75,depth:67,pressHeight:25,compactness:55} },
    defend:     { label:'Defensive',     desc:'Compact 4-2-4 block, double pivot shields 4, #10 becomes extra mid', color:'#ef4444', positions:[[50,92],[80,78],[62,80],[38,80],[20,78],[62,65],[38,65],[72,55],[50,52],[28,55],[50,45]], ball:[72,35], pressLine:65, metrics:{width:62,depth:47,pressHeight:45,compactness:80} },
  },
  '3-5-2': {
    buildup:    { label:'Build-Up',      desc:'CB trio circulates, wing-backs provide width, midfield triangle receives',color:'#22d3ee',positions:[[50,92],[72,80],[50,82],[28,80],[85,58],[65,62],[50,55],[35,62],[15,58],[62,35],[38,35]], ball:[50,82], pressLine:62, metrics:{width:90,depth:57,pressHeight:35,compactness:60} },
    press:      { label:'Press Trigger', desc:'Wing-backs press fullbacks, striker-pair pins CBs, CM drops to cover',color:'#f59e0b', positions:[[50,92],[70,75],[50,78],[30,75],[88,42],[65,55],[50,50],[35,55],[12,42],[65,25],[35,25]], ball:[30,75], pressLine:48, metrics:{width:95,depth:67,pressHeight:25,compactness:50} },
    attack:     { label:'Attacking',     desc:'Wing-backs become wingers, 5-wide attack, 3 CMs box-to-box',         color:'#10b981', positions:[[50,92],[70,72],[50,75],[30,72],[90,32],[65,48],[50,40],[35,48],[10,32],[62,15],[38,15]], ball:[62,20], pressLine:35, metrics:{width:100,depth:77,pressHeight:15,compactness:38} },
    transition: { label:'Transition',    desc:'Wing-backs recover urgently, midfield trio presses as unit',          color:'#a855f7', positions:[[50,92],[70,76],[50,78],[30,76],[85,52],[65,55],[50,50],[35,55],[15,52],[62,32],[38,32]], ball:[85,42], pressLine:55, metrics:{width:90,depth:60,pressHeight:32,compactness:58} },
    defend:     { label:'Defensive',     desc:'Wing-backs tuck in for back 5, 3-man mid shields, compact 5-3-2',   color:'#ef4444', positions:[[50,92],[82,78],[65,80],[50,82],[35,80],[18,78],[62,65],[50,63],[38,65],[62,52],[38,52]], ball:[62,38], pressLine:68, metrics:{width:72,depth:40,pressHeight:52,compactness:85} },
  },
  '3-4-3': {
    buildup:    { label:'Build-Up',      desc:'3 CBs circulate, wing-backs push early, 2 CMs manage possession',    color:'#22d3ee', positions:[[50,92],[68,80],[50,82],[32,80],[85,55],[38,62],[62,62],[15,55],[78,35],[50,28],[22,35]], ball:[50,82], pressLine:60, metrics:{width:92,depth:54,pressHeight:28,compactness:58} },
    press:      { label:'Press Trigger', desc:'3 forwards press CB trio simultaneously, wing-backs cut lanes',      color:'#f59e0b', positions:[[50,92],[68,75],[50,78],[32,75],[88,38],[38,52],[62,52],[12,38],[72,22],[50,18],[28,22]], ball:[32,75], pressLine:42, metrics:{width:96,depth:72,pressHeight:18,compactness:48} },
    attack:     { label:'Attacking',     desc:'5-wide attack via WBs and 3 forwards, CMs link play centrally',     color:'#10b981', positions:[[50,92],[68,72],[50,75],[32,72],[90,28],[35,45],[65,45],[10,28],[75,15],[50,10],[25,15]], ball:[75,18], pressLine:32, metrics:{width:100,depth:80,pressHeight:10,compactness:36} },
    transition: { label:'Transition',    desc:'Wing-backs recover hard, forwards drop to press immediately',        color:'#a855f7', positions:[[50,92],[68,76],[50,78],[32,76],[85,48],[38,55],[62,55],[15,48],[78,30],[50,25],[22,30]], ball:[85,38], pressLine:50, metrics:{width:92,depth:62,pressHeight:25,compactness:52} },
    defend:     { label:'Defensive',     desc:'WBs drop for back 5, 2 CMs shield, 3 forwards hold press line',    color:'#ef4444', positions:[[50,92],[78,80],[62,82],[50,82],[38,80],[22,80],[62,65],[38,65],[72,52],[50,48],[28,52]], ball:[65,35], pressLine:65, metrics:{width:68,depth:42,pressHeight:48,compactness:82} },
  },
  '4-1-4-1': {
    buildup:    { label:'Build-Up',      desc:'DM receives from CBs, 4 midfielders fan wide, lone striker holds',  color:'#22d3ee', positions:[[50,92],[82,78],[62,82],[38,82],[18,78],[50,65],[78,55],[62,50],[38,50],[22,55],[50,35]], ball:[50,65], pressLine:62, metrics:{width:78,depth:57,pressHeight:35,compactness:65} },
    press:      { label:'Press Trigger', desc:'4 midfielders press simultaneously, DM covers the pivot space',     color:'#f59e0b', positions:[[50,92],[80,68],[62,75],[38,75],[20,68],[50,58],[78,38],[60,45],[40,45],[22,38],[50,22]], ball:[38,75], pressLine:45, metrics:{width:78,depth:70,pressHeight:22,compactness:55} },
    attack:     { label:'Attacking',     desc:'4 midfielders push as 4-wide, fullbacks overlap, DM anchors deep', color:'#10b981', positions:[[50,92],[85,52],[62,65],[38,65],[15,52],[50,60],[82,28],[62,35],[38,35],[18,28],[50,15]], ball:[50,18], pressLine:38, metrics:{width:88,depth:77,pressHeight:15,compactness:45} },
    transition: { label:'Transition',    desc:'DM first shield, 4 midfielders recover quickly, striker pins high', color:'#a855f7', positions:[[50,92],[80,65],[62,70],[38,70],[20,65],[50,58],[78,45],[60,48],[40,48],[22,45],[50,30]], ball:[78,45], pressLine:52, metrics:{width:78,depth:62,pressHeight:30,compactness:60} },
    defend:     { label:'Defensive',     desc:'4-1-4-1 deep block, DM in front of 4, midfield 4 screens lanes',   color:'#ef4444', positions:[[50,92],[80,78],[62,80],[38,80],[20,78],[50,68],[78,62],[60,60],[40,60],[22,62],[50,50]], ball:[70,35], pressLine:68, metrics:{width:65,depth:42,pressHeight:50,compactness:85} },
  },
  '5-3-2': {
    buildup:    { label:'Build-Up',      desc:'Wing-backs provide all width, 3 CMs triangulate, 2 strikers hold',  color:'#22d3ee', positions:[[50,92],[88,68],[70,80],[50,82],[30,80],[12,68],[65,62],[50,55],[35,62],[62,35],[38,35]], ball:[50,82], pressLine:65, metrics:{width:92,depth:57,pressHeight:35,compactness:62} },
    press:      { label:'Press Trigger', desc:'2 strikers press CBs, CM drops to cover, WBs hold shape',          color:'#f59e0b', positions:[[50,92],[88,62],[70,75],[50,78],[30,75],[12,62],[62,52],[50,48],[38,52],[62,28],[38,28]], ball:[30,75], pressLine:48, metrics:{width:92,depth:64,pressHeight:28,compactness:52} },
    attack:     { label:'Attacking',     desc:'WBs push as extra wingers, 3 CMs box-to-box, 2 strikers as targets',color:'#10b981',positions:[[50,92],[90,48],[70,72],[50,75],[30,72],[10,48],[65,48],[50,40],[35,48],[62,18],[38,18]], ball:[62,22], pressLine:38, metrics:{width:100,depth:74,pressHeight:18,compactness:40} },
    transition: { label:'Transition',    desc:'WBs recover to back 5, CMs press as unit, strikers stay as outlet', color:'#a855f7', positions:[[50,92],[88,65],[70,76],[50,78],[30,76],[12,65],[62,55],[50,50],[38,55],[62,32],[38,32]], ball:[88,52], pressLine:58, metrics:{width:92,depth:60,pressHeight:32,compactness:60} },
    defend:     { label:'Defensive',     desc:'Compact 5-3-2 deep block, WBs as back 5, 3-man mid shield',        color:'#ef4444', positions:[[50,92],[85,78],[68,80],[50,82],[32,80],[15,78],[62,65],[50,62],[38,65],[62,52],[38,52]], ball:[65,38], pressLine:70, metrics:{width:78,depth:40,pressHeight:52,compactness:88} },
  },
  '5-4-1': {
    buildup:    { label:'Build-Up',      desc:'WBs provide width, 4-man mid receives patiently, ST holds line',    color:'#22d3ee', positions:[[50,92],[88,70],[70,80],[50,82],[30,80],[12,70],[80,58],[60,55],[40,55],[20,58],[50,38]], ball:[50,82], pressLine:68, metrics:{width:88,depth:54,pressHeight:38,compactness:70} },
    press:      { label:'Press Trigger', desc:'ST presses high on mistake, 4 mids shift, WBs hold back 5 shape',  color:'#f59e0b', positions:[[50,92],[88,65],[70,75],[50,78],[30,75],[12,65],[78,50],[58,52],[42,52],[22,50],[50,28]], ball:[30,75], pressLine:50, metrics:{width:88,depth:66,pressHeight:28,compactness:58} },
    attack:     { label:'Attacking',     desc:'WBs push as wingers, 4 mids attack in waves, ST holds line',       color:'#10b981', positions:[[50,92],[90,50],[70,72],[50,75],[30,72],[10,50],[82,35],[60,42],[40,42],[18,35],[50,20]], ball:[82,30], pressLine:40, metrics:{width:98,depth:72,pressHeight:20,compactness:42} },
    transition: { label:'Transition',    desc:'WBs recover fast, 4 mids reform block, ST is lone pressing outlet', color:'#a855f7', positions:[[50,92],[88,68],[70,76],[50,78],[30,76],[12,68],[78,58],[58,55],[42,55],[22,58],[50,38]], ball:[88,48], pressLine:60, metrics:{width:88,depth:54,pressHeight:38,compactness:65} },
    defend:     { label:'Defensive',     desc:'Ultra-compact 5-4-1, WBs in back 5, 4-mid wall, minimal pressing', color:'#ef4444', positions:[[50,92],[85,80],[68,82],[50,82],[32,82],[15,80],[78,68],[60,65],[40,65],[22,68],[50,55]], ball:[68,35], pressLine:75, metrics:{width:72,depth:37,pressHeight:55,compactness:95} },
  },
  '4-3-1-2': {
    buildup:    { label:'Build-Up',      desc:'3-man midfield receives, CAM links strikers, fullbacks support wide',color:'#22d3ee', positions:[[50,92],[82,78],[62,82],[38,82],[18,78],[68,65],[50,60],[32,65],[50,48],[62,32],[38,32]], ball:[50,60], pressLine:62, metrics:{width:76,depth:60,pressHeight:32,compactness:68} },
    press:      { label:'Press Trigger', desc:'CAM presses pivot, 2 strikers pin CBs, midfield 3 covers centrally',color:'#f59e0b', positions:[[50,92],[80,70],[62,75],[38,75],[20,70],[65,55],[50,50],[35,55],[50,35],[62,22],[38,22]], ball:[38,75], pressLine:45, metrics:{width:72,depth:70,pressHeight:22,compactness:55} },
    attack:     { label:'Attacking',     desc:'Diamond overloads center, fullbacks provide only width, 2 STs stretch',color:'#10b981',positions:[[50,92],[85,55],[62,65],[38,65],[15,55],[65,52],[50,42],[35,52],[50,30],[62,15],[38,15]], ball:[50,18], pressLine:35, metrics:{width:85,depth:77,pressHeight:15,compactness:45} },
    transition: { label:'Transition',    desc:'CAM presses first, midfield 3 funnels play inside, STs stay high',  color:'#a855f7', positions:[[50,92],[80,68],[62,72],[38,72],[20,68],[65,58],[50,52],[35,58],[50,40],[62,28],[38,28]], ball:[65,48], pressLine:50, metrics:{width:76,depth:64,pressHeight:28,compactness:60} },
    defend:     { label:'Defensive',     desc:'CAM becomes extra CM, diamond compresses, 2 STs as pressing triggers',color:'#ef4444',positions:[[50,92],[80,78],[62,80],[38,80],[20,78],[65,65],[50,62],[35,65],[50,55],[62,48],[38,48]], ball:[68,35], pressLine:65, metrics:{width:62,depth:44,pressHeight:48,compactness:82} },
  },
};

const PHASE_COLORS = {
  buildup:    { border:'border-cyan-500/30',    bg:'bg-cyan-500/10',    text:'text-cyan-400',    dot:'bg-cyan-500',    hex:'#22d3ee' },
  press:      { border:'border-yellow-500/30',  bg:'bg-yellow-500/10',  text:'text-yellow-400',  dot:'bg-yellow-500',  hex:'#f59e0b' },
  attack:     { border:'border-emerald-500/30', bg:'bg-emerald-500/10', text:'text-emerald-400', dot:'bg-emerald-500', hex:'#10b981' },
  transition: { border:'border-purple-500/30',  bg:'bg-purple-500/10',  text:'text-purple-400',  dot:'bg-purple-500',  hex:'#a855f7' },
  defend:     { border:'border-red-500/30',     bg:'bg-red-500/10',     text:'text-red-400',     dot:'bg-red-500',     hex:'#ef4444' },
};

// ── Sub-components ─────────────────────────────────────────────────
const MetricBar = ({ label, value, color }) => (
  <div className="space-y-0.5">
    <div className="flex justify-between items-center">
      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">{label}</span>
      <span className="text-[10px] font-black" style={{ color, fontFamily:'JetBrains Mono' }}>{Math.round(value)}</span>
    </div>
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.04)' }}>
      <div className="h-full rounded-full" style={{ width:`${Math.min(100,value)}%`, backgroundColor:color, transition:'none' }}/>
    </div>
  </div>
);

const FormationSelect = ({ value, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black transition-all"
        style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.1)', color:'#94a3b8' }}>
        <span className="text-[9px] text-slate-600 mr-0.5">{label}</span>
        <span className="text-white">{value}</span>
        <ChevronIcon className="w-2.5 h-2.5 text-slate-600"/>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 rounded-xl border overflow-hidden min-w-[90px]"
          style={{ background:'rgba(8,14,26,0.98)', borderColor:'rgba(255,255,255,0.1)', boxShadow:'0 8px 32px rgba(0,0,0,0.6)' }}>
          {ALL_FORMATIONS.map(f => (
            <button key={f} onClick={() => { onChange(f); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-[10px] font-bold transition-all hover:bg-white/5"
              style={{ color: f === value ? '#22d3ee' : '#64748b', fontFamily:'JetBrains Mono' }}>
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────
export default function TacticalSimulation({
  formation:    initFormation    = '4-3-3',
  oppFormation: initOppFormation = '4-4-2',
  teamName      = '',
  oppName       = '',
}) {
  const [formation,    setFormation]    = useState(initFormation);
  const [oppFormation, setOppFormation] = useState(initOppFormation);

  const phases    = FORMATION_PHASES[formation]    || FORMATION_PHASES['4-3-3'];
  const oppPhases = FORMATION_PHASES[oppFormation] || FORMATION_PHASES['4-4-2'];
  const phaseKeys = Object.keys(phases);
  const posLabels = POSITION_LABELS[formation]    || Array.from({length:11},(_,i) => i===0?'GK':String(i));

  const [phaseIdx,  setPhaseIdx]  = useState(0);
  const [progress,  setProgress]  = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [showOpp,   setShowOpp]   = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [speed,     setSpeed]     = useState(1);
  const [hoveredPlayer, setHoveredPlayer] = useState(null);

  const rafRef      = useRef(null);
  const startRef    = useRef(null);
  const phaseIdxRef = useRef(0);
  const progressRef = useRef(0);
  const PHASE_MS    = 5000;

  // Keep ref in sync with state
  useEffect(() => { phaseIdxRef.current = phaseIdx; }, [phaseIdx]);

  // ── rAF loop — uses refs to avoid stale closure restarts ────────
  const animate = useCallback((ts) => {
    if (!startRef.current) startRef.current = ts;
    const elapsed = (ts - startRef.current) * speed;
    const t       = Math.min(elapsed / PHASE_MS, 1);
    progressRef.current = t;
    setProgress(t);
    if (t >= 1) {
      startRef.current = null;
      const next = (phaseIdxRef.current + 1) % phaseKeys.length;
      phaseIdxRef.current = next;
      setPhaseIdx(next);
      setProgress(0);
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [speed, phaseKeys.length]); // eslint-disable-line

  useEffect(() => {
    if (!isPlaying) { cancelAnimationFrame(rafRef.current); return; }
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, animate]);

  // Reset on formation change
  useEffect(() => {
    setPhaseIdx(0); setProgress(0); startRef.current = null; phaseIdxRef.current = 0;
  }, [formation, oppFormation]);

  const ease  = (t) => t < 0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;
  const eased = ease(progress);
  const lerp  = (a, b, t) => a + (b - a) * t;

  const currKey = phaseKeys[phaseIdx] || 'buildup';
  const nextKey = phaseKeys[(phaseIdx + 1) % phaseKeys.length];
  const curr    = phases[currKey] || phases[Object.keys(phases)[0]];
  const next    = phases[nextKey] || curr;

  const oppCurrKey = oppPhases[currKey] ? currKey : Object.keys(oppPhases)[0];
  const oppNextKey = oppPhases[nextKey] ? nextKey  : Object.keys(oppPhases)[0];
  const oppCurr    = oppPhases[oppCurrKey];
  const oppNext    = oppPhases[oppNextKey];

  const interpPos = (c, n) => c.map(([x,y],i) => {
    const [nx,ny] = n[i] || [x,y];
    return [lerp(x,nx,eased), lerp(y,ny,eased)];
  });

  const homePos = interpPos(curr.positions, next.positions);
  const ballPos = [lerp(curr.ball[0],next.ball[0],eased), lerp(curr.ball[1],next.ball[1],eased)];
  const mirrorPos = (pos) => pos.map(([x,y]) => [100-x, 100-y]);
  const oppPos  = showOpp ? interpPos(mirrorPos(oppCurr.positions), mirrorPos(oppNext.positions)) : [];

  const buildShapeLines = (positions) => {
    const bands = { def:[], mid:[], att:[] };
    positions.forEach(([x,y],i) => {
      if (i===0) return;
      if      (y > 70) bands.def.push([x,y]);
      else if (y > 45) bands.mid.push([x,y]);
      else             bands.att.push([x,y]);
    });
    const lines = [];
    Object.values(bands).forEach(band => {
      const s = [...band].sort((a,b) => a[0]-b[0]);
      for (let i=0; i<s.length-1; i++) lines.push([s[i], s[i+1]]);
    });
    return lines;
  };

  const shapeLines = showLines ? buildShapeLines(homePos) : [];
  const pressLineY = lerp(curr.pressLine, next.pressLine, eased);
  const metrics    = {
    width:       lerp(curr.metrics.width,       next.metrics.width,       eased),
    depth:       lerp(curr.metrics.depth,       next.metrics.depth,       eased),
    pressHeight: lerp(curr.metrics.pressHeight, next.metrics.pressHeight, eased),
    compactness: lerp(curr.metrics.compactness, next.metrics.compactness, eased),
  };

  const cc = PHASE_COLORS[currKey] || PHASE_COLORS.attack;

  // Radar
  const radarAxes = ['Width','Press','Depth','Tempo','Compact','Direct'];
  const radarVals = [
    metrics.width,
    100 - metrics.pressHeight,
    metrics.depth,
    currKey==='attack'?85:currKey==='press'?90:currKey==='buildup'?55:currKey==='transition'?75:40,
    metrics.compactness,
    currKey==='attack'?80:currKey==='press'?70:currKey==='buildup'?45:currKey==='transition'?65:35,
  ];
  // Opp radar vals (mirrored from opp formation's same phase)
  const oppMetrics = {
    width:       lerp(oppCurr.metrics.width,       oppNext.metrics.width,       eased),
    depth:       lerp(oppCurr.metrics.depth,       oppNext.metrics.depth,       eased),
    pressHeight: lerp(oppCurr.metrics.pressHeight, oppNext.metrics.pressHeight, eased),
    compactness: lerp(oppCurr.metrics.compactness, oppNext.metrics.compactness, eased),
  };
  const oppRadarVals = [
    oppMetrics.width, 100-oppMetrics.pressHeight, oppMetrics.depth,
    currKey==='attack'?75:currKey==='press'?85:55,
    oppMetrics.compactness,
    currKey==='attack'?70:currKey==='press'?65:50,
  ];

  const keyRoleIdx  = { buildup:5, press:8, attack:9, transition:6, defend:1 };
  const keyRole     = posLabels[keyRoleIdx[currKey] ?? 5] || 'CM';
  const keyRoleDesc = {
    buildup:    'Receives from CBs, dictates tempo and direction of play',
    press:      'Initiates press on signal, cuts passing lane to pivot',
    attack:     'Runs in behind, stretches defense, creates space for runners',
    transition: 'First to press, wins second ball, protects shape on turnover',
    defend:     'Reads danger, organises backline, wins headers and duels',
  };
  const vulnerabilityDesc = {
    buildup:    'High fullbacks leave wide channels open for counter-press',
    press:      'Long ball over press line bypasses entire structure',
    attack:     'Fullbacks pushed high — fast counter down flanks is dangerous',
    transition: 'Midfield stretched, space between lines exploitable',
    defend:     'Deep block invites pressure — limited outlet, set pieces conceded',
  };

  const pressIntensityLabel = { press:'MAX', attack:'HIGH', buildup:'MED', transition:'HIGH', defend:'LOW' };
  const pressRings  = [1, 0.65, 0.35];
  const pressOpacity = (i) => {
    const base = {press:0.65,attack:0.45,buildup:0.30,transition:0.40,defend:0.15}[currKey] || 0.25;
    return Math.max(0, base - i * 0.15);
  };

  const matchupKey  = `${formation}|${oppFormation}`;
  const matchupNote = MATCHUP_NOTES[matchupKey];

  // Inline radar render helper
  const renderRadar = (vals, color, oppVals, sz=200) => {
    const cx=sz/2, cy=sz/2, r=sz*0.32, n=radarAxes.length;
    const pt = (i,v) => {
      const a = (Math.PI*2*i)/n - Math.PI/2;
      const d = (v/100)*r;
      return { x: cx+d*Math.cos(a), y: cy+d*Math.sin(a) };
    };
    const lp = (i) => {
      const a = (Math.PI*2*i)/n - Math.PI/2;
      return { x: cx+(r+sz*0.1)*Math.cos(a), y: cy+(r+sz*0.1)*Math.sin(a) };
    };
    const pathStr = vals.map((v,i) => { const p=pt(i,v); return `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ')+'Z';
    const oppStr  = oppVals ? oppVals.map((v,i) => { const p=pt(i,v); return `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ')+'Z' : null;
    const gridPts = (lv) => Array.from({length:n},(_,i)=>{ const p=pt(i,lv); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');
    return (
      <svg width="100%" viewBox={`0 0 ${sz} ${sz}`} style={{ overflow:'visible' }}>
        {[25,50,75,100].map(lv => <polygon key={lv} points={gridPts(lv)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>)}
        {Array.from({length:n},(_,i) => { const p=pt(i,100); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>; })}
        {oppStr && <path d={oppStr} fill="rgba(168,85,247,0.06)" stroke="#a855f7" strokeWidth="1" strokeDasharray="2 2"/>}
        <path d={pathStr} fill={`${color}18`} stroke={color} strokeWidth="1.5"/>
        {vals.map((v,i) => { const p=pt(i,v); return <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} stroke="white" strokeWidth="0.6"/>; })}
        {radarAxes.map((a,i) => { const p=lp(i); return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.35)" fontSize={sz*0.036} fontFamily="Outfit">{a}</text>; })}
      </svg>
    );
  };

  return (
    <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background:'rgba(8,14,26,0.97)' }}>

      {/* ── Header ── */}
      <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center flex-wrap gap-2"
        style={{ background:'rgba(34,211,238,0.025)' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"/>
            <span className="text-white font-black text-[11px] uppercase tracking-widest">Tactical Sim</span>
          </div>
          {/* Formation selectors */}
          <FormationSelect value={formation}    onChange={setFormation}    label="Home"/>
          <span className="text-slate-700 text-[10px] font-bold">vs</span>
          <FormationSelect value={oppFormation} onChange={setOppFormation} label="Away"/>
        </div>

        {/* Matchup note */}
        {matchupNote && (
          <span className="text-[9px] px-2 py-0.5 rounded-md border hidden lg:inline-flex items-center"
            style={{ background:'rgba(251,191,36,0.06)', borderColor:'rgba(251,191,36,0.2)', color:'#fbbf24' }}>
            {matchupNote.note}
          </span>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Speed */}
          <div className="flex items-center gap-0.5 rounded-lg border overflow-hidden"
            style={{ borderColor:'rgba(255,255,255,0.08)' }}>
            {[0.5,1,2].map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                className="px-1.5 py-0.5 text-[9px] font-black transition-all"
                style={{
                  background: speed===s ? 'rgba(34,211,238,0.12)' : 'transparent',
                  color:      speed===s ? '#22d3ee' : '#475569',
                  fontFamily: 'JetBrains Mono',
                }}>
                {s}×
              </button>
            ))}
          </div>
          {/* Toggles */}
          {[
            { label:'Shape', val:showLines, set:setShowLines },
            { label:'Zones', val:showZones, set:setShowZones },
            { label:'Opp',   val:showOpp,   set:setShowOpp   },
          ].map(({ label, val, set }) => (
            <button key={label} onClick={() => set(v => !v)}
              className="text-[10px] px-2 py-1 rounded-lg border transition-all font-semibold"
              style={{
                background:   val ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.02)',
                borderColor:  val ? 'rgba(34,211,238,0.2)'  : 'rgba(255,255,255,0.08)',
                color:        val ? '#22d3ee' : '#475569',
              }}>
              {label}
            </button>
          ))}
          <button onClick={() => setIsPlaying(v => !v)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b' }}>
            {isPlaying ? <PauseIcon className="w-3 h-3"/> : <PlayIcon className="w-3 h-3"/>}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">

        {/* ── Phase banner ── */}
        <div className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl border ${cc.bg} ${cc.border}`}>
          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
            <div className={`w-2 h-2 rounded-full ${cc.dot} ${isPlaying ? 'animate-pulse' : ''}`}/>
            <span className={`text-[11px] font-black ${cc.text} uppercase tracking-widest`}>{curr.label}</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed flex-1">{curr.desc}</p>
          <div className="flex-shrink-0 w-14">
            <div className="h-1 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width:`${progress*100}%`, backgroundColor:curr.color, transition:'none' }}/>
            </div>
            <p className="text-[8px] text-slate-700 mt-0.5 text-right" style={{ fontFamily:'JetBrains Mono' }}>
              {Math.round(progress*PHASE_MS/1000/speed)}s
            </p>
          </div>
        </div>

        {/* ── Main grid: pitch | metrics | intelligence ── */}
        <div className="flex flex-col md:grid md:grid-cols-[1fr_96px_186px] gap-3">

          {/* ── PITCH ── */}
          <div className="relative rounded-xl overflow-hidden"
            style={{
              aspectRatio:'65/100',
              background:`
                radial-gradient(ellipse at 50% 0%,   rgba(13,74,46,0.8) 0%, transparent 60%),
                radial-gradient(ellipse at 50% 100%, rgba(10,53,32,0.8) 0%, transparent 60%),
                linear-gradient(180deg, #0e5030 0%, #0d4a2e 25%, #0b4028 50%, #0d4a2e 75%, #0a3520 100%)
              `,
              border:'1px solid rgba(255,255,255,0.1)',
            }}>

            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
              style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
              {/* Stripes */}
              {[0,1,2,3,4,5,6,7].map(i => (
                <rect key={i} x="0" y={i*12.5} width="100" height="12.5"
                  fill={i%2===0?'rgba(255,255,255,0.015)':'rgba(0,0,0,0.01)'}/>
              ))}
              {/* Border */}
              <rect x="2" y="1.5" width="96" height="97" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
              {/* Halfway */}
              <line x1="2" y1="50" x2="98" y2="50" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4"/>
              {/* Centre */}
              <circle cx="50" cy="50" r="9.15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4"/>
              <circle cx="50" cy="50" r="0.7"  fill="rgba(255,255,255,0.5)"/>
              {/* Penalty boxes */}
              <rect x="21.1" y="1.5"  width="57.8" height="16.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4"/>
              <rect x="36.8" y="1.5"  width="26.4" height="5.5"  fill="none" stroke="rgba(255,255,255,0.1)"  strokeWidth="0.3"/>
              <circle cx="50" cy="11.5" r="0.7" fill="rgba(255,255,255,0.4)"/>
              <rect x="21.1" y="82"   width="57.8" height="16.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4"/>
              <rect x="36.8" y="93"   width="26.4" height="5.5"  fill="none" stroke="rgba(255,255,255,0.1)"  strokeWidth="0.3"/>
              <circle cx="50" cy="88.5" r="0.7" fill="rgba(255,255,255,0.4)"/>
              {/* Goals */}
              <rect x="-0.5" y="42.5" width="2.5" height="15" fill="rgba(255,255,255,0.2)" rx="0.5"/>
              <rect x="98"   y="42.5" width="2.5" height="15" fill="rgba(255,255,255,0.2)" rx="0.5"/>
              {/* Corners */}
              {[[2,1.5],[98,1.5],[2,98.5],[98,98.5]].map(([cx,cy],i) => (
                <circle key={i} cx={cx} cy={cy} r="3" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3"/>
              ))}

              {/* Zone overlay */}
              {showZones && <>
                <rect x="2" y={pressLineY} width="96" height={100-pressLineY-2}
                  fill="rgba(239,68,68,0.04)"/>
                <line x1="2" y1={pressLineY} x2="98" y2={pressLineY}
                  stroke={curr.color} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.6"/>
                <text x="4" y={pressLineY-1.5} fontSize="2.8" fill={curr.color} opacity="0.7" fontFamily="sans-serif">PRESS LINE</text>
                <rect x="2" y="1.5" width="96" height={Math.min(pressLineY-5,60)}
                  fill="rgba(16,185,129,0.03)"/>
              </>}

              {/* Shape lines */}
              {shapeLines.map(([[x1,y1],[x2,y2]],i) => (
                <line key={i} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
                  stroke={curr.color} strokeWidth="0.5" opacity="0.25" strokeDasharray="1.5 1.5"/>
              ))}

              {/* Passing lanes */}
              {homePos.slice(7).map(([px,py],i) => {
                const dist = Math.sqrt((px-ballPos[0])**2 + (py-ballPos[1])**2);
                if (dist < 8 || dist > 45) return null;
                return (
                  <line key={`pass-${i}`}
                    x1={`${ballPos[0]}%`} y1={`${ballPos[1]}%`}
                    x2={`${px}%`}        y2={`${py}%`}
                    stroke="#facc15" strokeWidth="0.4" opacity="0.22" strokeDasharray="2 3"/>
                );
              })}

              {/* Opp shape lines */}
              {showOpp && showLines && buildShapeLines(oppPos).map(([[x1,y1],[x2,y2]],i) => (
                <line key={`ol-${i}`} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
                  stroke="#a855f7" strokeWidth="0.5" opacity="0.18" strokeDasharray="1.5 1.5"/>
              ))}
            </svg>

            {/* Home players */}
            {homePos.map(([x,y],i) => {
              const label = posLabels[i] || String(i);
              const isGK  = i === 0;
              const isHov = hoveredPlayer === i;
              return (
                <div key={`hp-${i}`}
                  onMouseEnter={() => setHoveredPlayer(i)}
                  onMouseLeave={() => setHoveredPlayer(null)}
                  style={{ position:'absolute', left:`${x}%`, top:`${y}%`, transform:'translate(-50%,-50%)', zIndex:3, transition:'none' }}>
                  <div style={{
                    width:  isGK ? '28px' : '22px',
                    height: isGK ? '28px' : '22px',
                    borderRadius:'50%',
                    backgroundColor: isGK ? '#0a1628' : curr.color,
                    border: `2px solid ${isGK ? curr.color : 'rgba(255,255,255,0.9)'}`,
                    boxShadow: `0 0 ${isHov?12:isGK?8:5}px ${curr.color}${isHov?'cc':'80'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'6px', fontWeight:'900',
                    color: isGK ? curr.color : '#060c18',
                    fontFamily:'JetBrains Mono',
                    cursor:'pointer',
                    transform: isHov ? 'scale(1.25)' : 'scale(1)',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                  }}>
                    {label}
                  </div>
                </div>
              );
            })}

            {/* Opp players */}
            {showOpp && oppPos.map(([x,y],i) => {
              const oppLabels = POSITION_LABELS[oppFormation] || posLabels;
              return (
                <div key={`ap-${i}`} style={{ position:'absolute', left:`${x}%`, top:`${y}%`, transform:'translate(-50%,-50%)', zIndex:3, transition:'none' }}>
                  <div style={{
                    width:'18px', height:'18px', borderRadius:'50%',
                    backgroundColor:'transparent',
                    border:'2px solid #a855f7',
                    boxShadow:'0 0 5px rgba(168,85,247,0.5)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'5.5px', fontWeight:'900', color:'#a855f7', fontFamily:'JetBrains Mono',
                  }}>
                    {oppLabels[i] || String(i)}
                  </div>
                </div>
              );
            })}

            {/* Ball */}
            <div style={{ position:'absolute', left:`${ballPos[0]}%`, top:`${ballPos[1]}%`, transform:'translate(-50%,-50%)', zIndex:5, transition:'none' }}>
              <div style={{
                width:'10px', height:'10px', borderRadius:'50%',
                backgroundColor:'white',
                boxShadow:'0 0 8px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.5)',
                border:'1px solid rgba(0,0,0,0.25)',
              }}/>
            </div>

            {/* Hovered player tooltip */}
            {hoveredPlayer !== null && (() => {
              const [x,y] = homePos[hoveredPlayer];
              const label = posLabels[hoveredPlayer];
              return (
                <div style={{
                  position:'absolute', left:`${x}%`, top:`${Math.max(8, y-8)}%`,
                  transform:'translate(-50%,-100%)', zIndex:10, pointerEvents:'none',
                }}>
                  <div className="px-2 py-1 rounded-lg text-[9px] font-black text-white whitespace-nowrap"
                    style={{ background:'rgba(8,14,26,0.95)', border:`1px solid ${curr.color}40`, fontFamily:'JetBrains Mono' }}>
                    #{hoveredPlayer} {label}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── METRICS ── */}
          <div className="flex flex-col gap-2">
            <div className="rounded-xl p-3 border border-white/[0.06] flex-1 space-y-2"
              style={{ background:'rgba(0,0,0,0.3)' }}>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Live Metrics</p>
              <MetricBar label="Width"   value={metrics.width}       color="#22d3ee"/>
              <MetricBar label="Depth"   value={metrics.depth}       color="#a855f7"/>
              <MetricBar label="Press"   value={metrics.pressHeight} color={curr.color}/>
              <MetricBar label="Compact" value={metrics.compactness} color="#10b981"/>
            </div>
            <div className="rounded-xl p-2.5 border border-white/[0.06] text-center"
              style={{ background:'rgba(0,0,0,0.3)' }}>
              <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-1">Phase</p>
              <p className="text-white font-black text-sm" style={{ fontFamily:'JetBrains Mono' }}>
                {phaseIdx+1}<span className="text-slate-700">/{phaseKeys.length}</span>
              </p>
              <p className={`text-[9px] font-bold mt-0.5 ${cc.text}`}>{curr.label}</p>
            </div>
            <div className="rounded-xl p-2.5 border border-white/[0.06] space-y-1.5"
              style={{ background:'rgba(0,0,0,0.3)' }}>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor:curr.color, border:'1.5px solid rgba(255,255,255,0.8)' }}/>
                <span className="text-[8px] text-slate-500 truncate" style={{ fontFamily:'JetBrains Mono' }}>{formation}</span>
              </div>
              {showOpp && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ border:'2px solid #a855f7' }}/>
                  <span className="text-[8px] text-slate-500 truncate" style={{ fontFamily:'JetBrains Mono' }}>{oppFormation}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white" style={{ boxShadow:'0 0 5px rgba(255,255,255,0.8)' }}/>
                <span className="text-[8px] text-slate-600">Ball</span>
              </div>
            </div>
          </div>

          {/* ── INTELLIGENCE ── */}
          <div className="flex flex-col gap-2">

            {/* Radar — responsive width="100%" */}
            <div className="rounded-xl p-3 border border-white/[0.06]" style={{ background:'rgba(0,0,0,0.3)' }}>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-1">
                Tactical Radar {showOpp && <span className="text-purple-600 ml-1">+ Opp</span>}
              </p>
              {renderRadar(radarVals, curr.color, showOpp ? oppRadarVals : null)}
            </div>

            {/* Key role */}
            <div className={`rounded-xl p-3 border ${cc.border}`} style={{ background:'rgba(0,0,0,0.3)' }}>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-1.5">Key Role</p>
              <p className={`text-[12px] font-black ${cc.text} mb-1`}>{keyRole}</p>
              <p className="text-slate-500 text-[10px] leading-relaxed">{keyRoleDesc[currKey]}</p>
            </div>

            {/* Vulnerability */}
            <div className="rounded-xl p-3 border border-red-500/20" style={{ background:'rgba(0,0,0,0.3)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriIcon className="w-3 h-3 text-red-400 flex-shrink-0"/>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Exposed</p>
              </div>
              <p className="text-red-300/80 text-[10px] leading-relaxed">{vulnerabilityDesc[currKey]}</p>
            </div>

            {/* Press intensity rings */}
            <div className="rounded-xl p-3 border border-white/[0.06] text-center" style={{ background:'rgba(0,0,0,0.3)' }}>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-2">Press Intensity</p>
              <div style={{ position:'relative', width:48, height:48, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {pressRings.map((scale,i) => (
                  <div key={i} className={isPlaying && (currKey==='press'||currKey==='attack') ? 'animate-pulse' : ''} style={{
                    position:'absolute',
                    width: `${scale*48}px`, height:`${scale*48}px`,
                    borderRadius:'50%',
                    border:`1px solid ${curr.color}`,
                    opacity: pressOpacity(i),
                  }}/>
                ))}
                <span className={`text-[10px] font-black relative z-10 ${cc.text}`} style={{ fontFamily:'JetBrains Mono' }}>
                  {pressIntensityLabel[currKey]||'MED'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Phase switcher ── */}
        <div className="flex gap-1.5">
          {phaseKeys.map((key,i) => {
            const c   = PHASE_COLORS[key] || PHASE_COLORS.attack;
            const ph  = phases[key];
            const act = phaseIdx === i;
            return (
              <button key={key}
                onClick={() => { setPhaseIdx(i); setProgress(0); startRef.current=null; phaseIdxRef.current=i; }}
                className={`flex-1 py-2 px-1 rounded-xl border text-center transition-all ${
                  act ? `${c.bg} ${c.border}` : 'hover:bg-white/[0.02]'
                }`}
                style={{ borderColor: act ? undefined : 'rgba(255,255,255,0.05)' }}>
                <div className={`w-1.5 h-1.5 rounded-full ${c.dot} mx-auto mb-1`}/>
                <p className={`text-[9px] font-bold leading-tight ${act ? c.text : 'text-slate-600'}`}>
                  {ph.label.split(' ')[0]}
                </p>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}