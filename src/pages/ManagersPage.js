import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import NavBar from '../components/NavBar';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/* ══════════════════════════════════════
   ICONS
══════════════════════════════════════ */
const I = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const SearchIcon   = p => <I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const TrophyIcon   = p => <I {...p} d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></>}/>;
const UsersIcon    = p => <I {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const GlobeIcon    = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}/>;
const CalendarIcon = p => <I {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
const ShieldIcon   = p => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const ZapIcon      = p => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const TargetIcon   = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const TrendingIcon = p => <I {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const BrainIcon    = p => <I {...p} d={<><path d="M9.5 2A5.5 5.5 0 0 0 5 6a5.5 5.5 0 0 0 .4 2A5.5 5.5 0 0 0 4 13.5a5.5 5.5 0 0 0 3.5 5.1V22h5v-3.4a5.5 5.5 0 0 0 3.5-5.1 5.5 5.5 0 0 0-1.4-5.5A5.5 5.5 0 0 0 15 6a5.5 5.5 0 0 0-5.5-4Z"/><path d="M12 2v20"/></>}/>;
const ChevronDnIcon= p => <I {...p} d={<polyline points="6 9 12 15 18 9"/>}/>;
const ChevronUpIcon= p => <I {...p} d={<polyline points="18 15 12 9 6 15"/>}/>;
const ArrowUpIcon  = p => <I {...p} d={<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>}/>;
const ArrowDnIcon  = p => <I {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>}/>;
const RefreshIcon  = p => <I {...p} d={<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>}/>;
const XIcon        = p => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const SwordsIcon   = p => <I {...p} d={<><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19.5 6.5L8 18v3H5L16.5 9.5"/></>}/>;
const CheckIcon    = p => <I {...p} d={<polyline points="20 6 9 17 4 12"/>}/>;
const FilterIcon   = p => <I {...p} d={<><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>}/>;

/* ══════════════════════════════════════
   CONSTANTS
══════════════════════════════════════ */
const LEAGUE_META = {
  'Premier League': { color:'#7c3aed', img:'https://media.api-sports.io/football/leagues/39.png'  },
  'La Liga':        { color:'#dc2626', img:'https://media.api-sports.io/football/leagues/140.png' },
  'Bundesliga':     { color:'#d97706', img:'https://media.api-sports.io/football/leagues/78.png'  },
  'Serie A':        { color:'#059669', img:'https://media.api-sports.io/football/leagues/135.png' },
  'Ligue 1':        { color:'#2563eb', img:'https://media.api-sports.io/football/leagues/61.png'  },
  'Primeira Liga':  { color:'#10b981', img:'https://media.api-sports.io/football/leagues/94.png'  },
};
const LEAGUES = ['All', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Primeira Liga'];
const ORDER   = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Primeira Liga'];

/* ══════════════════════════════════════
   HARDCODED DATA
   BUG FIX: removed duplicate "Ernesto Valverde" key
══════════════════════════════════════ */
const MANAGER_TROPHIES = {
  'Pep Guardiola':38, 'Mikel Arteta':3, 'Arne Slot':2, 'Eddie Howe':1,
  'Unai Emery':8, 'Oliver Glasner':2, 'Nuno Espírito Santo':1,
  'Hansi Flick':12, 'Diego Simeone':8, 'Ernesto Valverde':3,
  'Marcelino':3, 'Manuel Pellegrini':2, 'Matías Almeyda':2,
  'Vincent Kompany':1, 'Frank Schmidt':0, 'Simone Inzaghi':6,
  'Antonio Conte':10, 'Gian Piero Gasperini':2, 'Massimiliano Allegri':11,
  'Maurizio Sarri':3, 'Claudio Ranieri':4, 'Stefano Pioli':1,
  'Luis Enrique':14, 'Bruno Genesio':1, 'Laszlo Bölöni':2,
  'Roberto De Zerbi':1, 'Marco Silva':0, 'Andoni Iraola':0,
  'Fabian Hürzeler':0, 'Thomas Frank':0, 'Nuri Şahin':0,
};

const MANAGER_FORMATION = {
  'Pep Guardiola':'4-3-3',    'Mikel Arteta':'4-3-3',     'Arne Slot':'4-2-3-1',
  'Eddie Howe':'4-3-3',       'Unai Emery':'4-2-3-1',     'Oliver Glasner':'3-4-3',
  'Nuno Espírito Santo':'4-2-3-1', 'Marco Silva':'4-2-3-1','Andoni Iraola':'4-2-3-1',
  'Fabian Hürzeler':'4-2-3-1','David Moyes':'4-2-3-1',    'Daniel Farke':'4-2-3-1',
  'Scott Parker':'4-4-2',     'Keith Andrews':'3-5-2',     'Rob Edwards':'4-3-3',
  'Ryan Mason':'4-2-3-1',     'Hansi Flick':'4-2-3-1',    'Diego Simeone':'4-4-2',
  'Ernesto Valverde':'4-2-3-1','Marcelino':'4-4-2',        'Manuel Pellegrini':'4-2-3-1',
  'Matías Almeyda':'4-3-3',   'Míchel':'4-3-3',            'Jagoba Arrasate':'4-4-2',
  'José Bordalás':'4-4-2',    'Carlos Corberán':'4-2-3-1', 'Íñigo Pérez':'4-2-3-1',
  'Claudio Giráldez':'4-3-3', 'Vicente Moreno':'4-4-2',    'Manolo González':'4-4-2',
  'Eduardo Coudet':'4-2-3-1', 'Vincent Kompany':'4-2-3-1', 'Nuri Şahin':'4-2-3-1',
  'Sebastian Hoeneß':'4-2-3-1','Julian Schuster':'4-2-3-1','Frank Schmidt':'4-4-2',
  'Christian Ilzer':'4-3-3',  'Bo Svensson':'3-4-3',       'Dino Toppmöller':'4-2-3-1',
  'Alexander Blessin':'4-3-3','Jan Henriksen':'3-4-3',      'Jess Thorup':'4-4-2',
  'Simone Inzaghi':'3-5-2',   'Antonio Conte':'3-5-2',     'Thiago Motta':'4-2-3-1',
  'Gian Piero Gasperini':'3-4-3','Massimiliano Allegri':'4-3-3','Maurizio Sarri':'4-3-3',
  'Claudio Ranieri':'4-2-3-1','Stefano Pioli':'4-2-3-1',   'Cesc Fàbregas':'4-3-3',
  'Alessandro Nesta':'3-4-3', 'Kosta Runjaic':'3-5-2',     'Marco Giampaolo':'4-3-1-2',
  'Fabio Pecchia':'4-2-3-1',  'Luis Enrique':'4-3-3',      'Roberto De Zerbi':'3-4-3',
  'Bruno Genesio':'4-2-3-1',  'Pierre Sage':'4-3-3',       'Franck Haise':'4-3-3',
  'Habib Beye':'4-2-3-1',     'Eric Roy':'4-3-3',           'Laszlo Bölöni':'4-4-2',
  'Thomas Frank':'4-3-3',
};

const TACTICAL_DNA = {
  'Pep Guardiola':        { press:88, poss:67, counter:45, defLine:82, setPiece:62, flex:92, archetype:'Positional Master',      archetypeColor:'#22d3ee', buildUp:'Structured Positional',    sigStyle:'Inverted fullbacks creating midfield overloads — redefines every role on the pitch' },
  'Mikel Arteta':         { press:85, poss:58, counter:55, defLine:78, setPiece:74, flex:72, archetype:'Gegenpresser',            archetypeColor:'#10b981', buildUp:'Short & Compact',           sigStyle:'Set piece specialist — Premier League\'s top scorer from dead balls' },
  'Arne Slot':            { press:76, poss:55, counter:60, defLine:72, setPiece:60, flex:68, archetype:'Control Presser',         archetypeColor:'#22d3ee', buildUp:'Vertical Possession',       sigStyle:'4-3 defensive shape transitions to 2-3-5 in possession — Klopp successor' },
  'Eddie Howe':           { press:78, poss:48, counter:75, defLine:68, setPiece:65, flex:65, archetype:'Counter-Presser',         archetypeColor:'#10b981', buildUp:'Fast Vertical',             sigStyle:'Intense press designed to win back possession in transition zones' },
  'Unai Emery':           { press:80, poss:52, counter:68, defLine:70, setPiece:82, flex:85, archetype:'European Specialist',    archetypeColor:'#a855f7', buildUp:'Structured Press',          sigStyle:'Record 4 Europa League titles — best cup tactician in European football' },
  'Oliver Glasner':       { press:72, poss:46, counter:78, defLine:62, setPiece:58, flex:70, archetype:'Counter-Attack',          archetypeColor:'#fbbf24', buildUp:'Direct Vertical',           sigStyle:'3-4-3 with aggressive wing-backs who double as wingers on the overlap' },
  'Nuno Espírito Santo':  { press:52, poss:44, counter:72, defLine:48, setPiece:60, flex:58, archetype:'Compact Defender',       archetypeColor:'#f97316', buildUp:'Direct & Physical',         sigStyle:'Ultra-compact block that suffocates space in the final third' },
  'Marco Silva':          { press:65, poss:54, counter:62, defLine:65, setPiece:58, flex:68, archetype:'Progressive Passer',     archetypeColor:'#60a5fa', buildUp:'Short Progressive',         sigStyle:'High press triggers from goalkeeper — highest defensive line at Fulham' },
  'Andoni Iraola':        { press:84, poss:48, counter:70, defLine:74, setPiece:55, flex:62, archetype:'Gegenpresser',            archetypeColor:'#10b981', buildUp:'Direct Press',              sigStyle:'One of the highest PPDA ratings in the PL — relentless pressing windows' },
  'Fabian Hürzeler':      { press:75, poss:56, counter:58, defLine:70, setPiece:58, flex:72, archetype:'Positional Presser',     archetypeColor:'#22d3ee', buildUp:'Structured Positional',     sigStyle:'Youngest ever PL manager — fluid 4-2-3-1 to 4-3-3 shape transitions' },
  'Thomas Frank':         { press:76, poss:52, counter:65, defLine:68, setPiece:62, flex:74, archetype:'Counter-Presser',         archetypeColor:'#10b981', buildUp:'Vertical Transitions',      sigStyle:'Brentford\'s direct 4-3-3 built on set pieces and B-team data analytics' },
  'David Moyes':          { press:48, poss:46, counter:65, defLine:52, setPiece:62, flex:58, archetype:'Pragmatist',              archetypeColor:'#94a3b8', buildUp:'Direct & Set Pieces',       sigStyle:'Counter-pressing set piece routines from wide areas — proven survivor' },
  'Daniel Farke':         { press:72, poss:58, counter:55, defLine:68, setPiece:60, flex:65, archetype:'Possession Builder',     archetypeColor:'#22d3ee', buildUp:'Patient Recycling',         sigStyle:'5-4-1 out of possession expands to 3-2-5 in attack — methodical build' },
  'Vincent Kompany':      { press:82, poss:60, counter:52, defLine:78, setPiece:62, flex:72, archetype:'High Line Presser',      archetypeColor:'#10b981', buildUp:'Possession Press',          sigStyle:'Controversy-defying high defensive line at Bayern — 70m offside trap system' },
  'Nuri Şahin':           { press:72, poss:52, counter:68, defLine:66, setPiece:58, flex:68, archetype:'Transition Tactician',   archetypeColor:'#fbbf24', buildUp:'Vertical Transitions',      sigStyle:'Dortmund\'s signature fast break from deep defensive shape' },
  'Sebastian Hoeneß':     { press:80, poss:52, counter:70, defLine:72, setPiece:60, flex:68, archetype:'Aggressive Counter',     archetypeColor:'#ef4444', buildUp:'Press & Transition',        sigStyle:'Stuttgart\'s explosive counter-press that shocked the Bundesliga title race' },
  'Julian Schuster':      { press:60, poss:50, counter:62, defLine:58, setPiece:58, flex:65, archetype:'Disciplined Organizer',  archetypeColor:'#94a3b8', buildUp:'Structured Defensive',      sigStyle:'Freiburg continuity — Christian Streich defensive principles preserved' },
  'Frank Schmidt':        { press:52, poss:44, counter:72, defLine:48, setPiece:65, flex:55, archetype:'Direct & Physical',      archetypeColor:'#f43f5e', buildUp:'Direct Long Ball',          sigStyle:'20-year tenure — Heidenheim\'s direct 4-4-2 built across two decades' },
  'Dino Toppmöller':      { press:74, poss:50, counter:70, defLine:68, setPiece:60, flex:68, archetype:'Vertical Attacker',      archetypeColor:'#ef4444', buildUp:'Direct Vertical',           sigStyle:'Frankfurt\'s vertical 4-2-3-1 with explosive forward runs from deep' },
  'Alexander Blessin':    { press:82, poss:46, counter:68, defLine:72, setPiece:55, flex:62, archetype:'Gegenpresser',            archetypeColor:'#10b981', buildUp:'Intense High Press',        sigStyle:'Ostende → Genoa → St Pauli — identity built purely on relentless pressing' },
  'Simone Inzaghi':       { press:62, poss:52, counter:70, defLine:60, setPiece:68, flex:80, archetype:'3-5-2 Maestro',           archetypeColor:'#a855f7', buildUp:'Wing-back Overload',        sigStyle:'3-5-2 to 5-3-2 shape shifts — wing-backs as the primary attacking outlet' },
  'Antonio Conte':        { press:65, poss:48, counter:75, defLine:55, setPiece:72, flex:68, archetype:'Fortress Counter',        archetypeColor:'#f97316', buildUp:'Direct Counter Press',      sigStyle:'Invented the modern 3-5-2 — defensive organization used as an attacking weapon' },
  'Gian Piero Gasperini': { press:80, poss:50, counter:68, defLine:72, setPiece:65, flex:78, archetype:'Man-Marking System',     archetypeColor:'#ef4444', buildUp:'Aggressive Press',          sigStyle:'Last high-profile manager using zonal man-marking throughout the entire pitch' },
  'Massimiliano Allegri': { press:46, poss:46, counter:72, defLine:50, setPiece:75, flex:80, archetype:'Pragmatic Master',       archetypeColor:'#94a3b8', buildUp:'Organized Counter',         sigStyle:'5 consecutive Serie A titles — results over aesthetics, master of adaptation' },
  'Maurizio Sarri':       { press:78, poss:60, counter:48, defLine:72, setPiece:58, flex:60, archetype:'Sarrismo Architect',     archetypeColor:'#22d3ee', buildUp:'Structured Sarrismo',       sigStyle:'Invented Sarrismo — high possession with obsessive pressing width' },
  'Claudio Ranieri':      { press:48, poss:46, counter:72, defLine:48, setPiece:68, flex:82, archetype:'Pragmatic Legend',       archetypeColor:'#94a3b8', buildUp:'Adaptive Counter',          sigStyle:'Champions League miracle architect — master of tactical adaptation and calm' },
  'Thiago Motta':         { press:70, poss:58, counter:58, defLine:65, setPiece:60, flex:72, archetype:'Possession Organizer',   archetypeColor:'#22d3ee', buildUp:'Controlled Possession',     sigStyle:'Bologna positional play principles — build from goalkeeper outward always' },
  'Stefano Pioli':        { press:65, poss:52, counter:65, defLine:62, setPiece:60, flex:75, archetype:'Flexible Organizer',     archetypeColor:'#a855f7', buildUp:'Flexible Possession',       sigStyle:'3-4-3 & 4-2-3-1 fluid switching — plays to specific squad strengths each week' },
  'Cesc Fàbregas':        { press:68, poss:58, counter:58, defLine:62, setPiece:55, flex:72, archetype:'Technical Builder',      archetypeColor:'#22d3ee', buildUp:'Technical Possession',      sigStyle:'Youngest manager in Serie A — Barcelona DNA applied to Como\'s youth system' },
  'Luis Enrique':         { press:88, poss:62, counter:58, defLine:80, setPiece:62, flex:80, archetype:'Possession Gegenpresser',archetypeColor:'#22d3ee', buildUp:'High Press Possession',     sigStyle:'PSG revolution — gegenpressing overlay on top of possession football principles' },
  'Roberto De Zerbi':     { press:80, poss:58, counter:55, defLine:75, setPiece:58, flex:82, archetype:'Progressive Innovator',  archetypeColor:'#22d3ee', buildUp:'GK Build-up Positional',    sigStyle:'Goalkeeper as 11th outfield player — redefined modern GK distribution entirely' },
  'Bruno Genesio':        { press:65, poss:52, counter:65, defLine:62, setPiece:60, flex:68, archetype:'Balanced Organizer',     archetypeColor:'#94a3b8', buildUp:'Direct Balanced',           sigStyle:'Lille\'s direct 4-2-3-1 proven in Ligue 1 championship-winning campaign' },
  'Eric Roy':             { press:68, poss:46, counter:72, defLine:62, setPiece:60, flex:62, archetype:'Direct Aggressive',      archetypeColor:'#ef4444', buildUp:'Direct & Aggressive',       sigStyle:'Brest\'s Champions League qualification built on 4-3-3 directness and pace' },
  'Franck Haise':         { press:80, poss:50, counter:68, defLine:72, setPiece:60, flex:68, archetype:'High Press Attacker',    archetypeColor:'#10b981', buildUp:'Press & Attack',            sigStyle:'Lens\' Ligue 1 title challenge built entirely on sustained gegenpressing' },
  'Diego Simeone':        { press:55, poss:42, counter:85, defLine:38, setPiece:78, flex:72, archetype:'Fortress Builder',       archetypeColor:'#f97316', buildUp:'Deep Block & Counter',      sigStyle:'Invented modern 4-4-2 defensive block — 14 years shaping Atletico\'s identity' },
  'Hansi Flick':          { press:87, poss:62, counter:58, defLine:80, setPiece:65, flex:78, archetype:'Gegenpresser',            archetypeColor:'#10b981', buildUp:'High Press Positional',     sigStyle:'Revived Barcelona\'s tiki-taka with a modern high-press overlay' },
  'Ernesto Valverde':     { press:62, poss:52, counter:65, defLine:58, setPiece:62, flex:68, archetype:'Balanced Disciplined',   archetypeColor:'#94a3b8', buildUp:'Structured Possession',     sigStyle:'Basque-only pressing system — Athletic identity preserved across two spells' },
};

/* ══════════════════════════════════════
   FORMATION PITCH SVG
══════════════════════════════════════ */
const Pitch = ({ formation = '4-3-3', size = 64, color = '#22d3ee' }) => {
  const layouts = {
    '4-3-3':   [[1],[4],[3],[3]],
    '4-2-3-1': [[1],[4],[2],[3],[1]],
    '3-5-2':   [[1],[3],[5],[2]],
    '3-4-3':   [[1],[3],[4],[3]],
    '4-4-2':   [[1],[4],[4],[2]],
    '4-1-4-1': [[1],[4],[1],[4],[1]],
    '5-3-2':   [[1],[5],[3],[2]],
    '5-4-1':   [[1],[5],[4],[1]],
    '4-3-1-2': [[1],[4],[3],[1],[2]],
  };
  const rows = layouts[formation] || [[1],[4],[3],[3]];
  const rh   = size / (rows.length + 0.5);
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <rect x="1" y="1" width={size-2} height={size-2} rx="3"
        fill="rgba(13,74,46,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
      <line x1="1" y1={size/2} x2={size-1} y2={size/2} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
      <circle cx={size/2} cy={size/2} r={size/8} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
      {rows.map((row, ri) => {
        const count = row[0];
        const y = size - (ri + 1) * rh;
        return Array.from({ length: count }, (_, ci) => (
          <g key={`${ri}-${ci}`}>
            <circle cx={(size/(count+1))*(ci+1)} cy={y} r={size>80?5:3.5}
              fill={ri===0?'#fbbf24':color} opacity="0.15"/>
            <circle cx={(size/(count+1))*(ci+1)} cy={y} r={size>80?3.5:2.5}
              fill={ri===0?'#fbbf24':color} opacity="0.9"
              style={{ filter:`drop-shadow(0 0 4px ${ri===0?'#fbbf2460':color+'50'})` }}/>
          </g>
        ));
      })}
      <text x={size/2} y={size-2} textAnchor="middle"
        fill="rgba(255,255,255,0.25)" fontSize="5" fontWeight="bold" fontFamily="JetBrains Mono">
        {formation}
      </text>
    </svg>
  );
};

/* ══════════════════════════════════════
   DNA RADAR CHART
══════════════════════════════════════ */
const DNARadar = ({ dna, color = '#22d3ee', size = 200 }) => {
  const dims = [
    { key:'press',    label:'Press'    },
    { key:'poss',     label:'Poss'     },
    { key:'counter',  label:'Counter'  },
    { key:'defLine',  label:'Def Line' },
    { key:'setPiece', label:'Set Piece'},
    { key:'flex',     label:'Flex'     },
  ];
  const n = dims.length, r = size * 0.32, cx = size / 2, cy = size / 2;
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + Math.cos(a) * r * (v / 100), y: cy + Math.sin(a) * r * (v / 100) };
  };
  const gridPts = f => dims.map((_, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return `${(cx + Math.cos(a) * r * f).toFixed(1)},${(cy + Math.sin(a) * r * f).toFixed(1)}`;
  }).join(' ');
  const vals = dims.map(d => dna?.[d.key] || 50);
  const path = vals.map((v, i) => { const p = pt(i, v); return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ') + 'Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <polygon key={i} points={gridPts(f)} fill={f===1?`${color}04`:'none'}
          stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>
      ))}
      {dims.map((_, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy}
          x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r}
          stroke="rgba(255,255,255,0.05)" strokeWidth="0.6"/>;
      })}
      <path d={path} fill={`${color}14`} stroke={color} strokeWidth="2"
        style={{ filter:`drop-shadow(0 0 6px ${color}40)` }}/>
      {vals.map((v, i) => {
        const p = pt(i, v);
        return <circle key={i} cx={p.x} cy={p.y} r="3"
          fill={color} stroke="rgba(5,8,16,0.8)" strokeWidth="1.2"/>;
      })}
      {dims.map((d, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + Math.cos(a) * (r * 1.28);
        const ly = cy + Math.sin(a) * (r * 1.28);
        return (
          <g key={i}>
            <text x={lx} y={ly - 3} textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.45)" fontSize="8.5" fontWeight="600" fontFamily="Outfit">
              {d.label}
            </text>
            <text x={lx} y={ly + 5} textAnchor="middle" dominantBaseline="middle"
              fill={color} fontSize="7.5" fontFamily="monospace" fontWeight="700">
              {dna?.[d.key] || 50}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ══════════════════════════════════════
   DNA COMPARISON RADAR — two managers
══════════════════════════════════════ */
const CompareRadar = ({ dna1, dna2, color1 = '#22d3ee', color2 = '#a855f7', size = 240 }) => {
  const dims = [
    { key:'press', label:'Press' }, { key:'poss', label:'Poss' },
    { key:'counter', label:'Counter' }, { key:'defLine', label:'Def Line' },
    { key:'setPiece', label:'Set Piece' }, { key:'flex', label:'Flex' },
  ];
  const n = dims.length, r = size * 0.30, cx = size / 2, cy = size / 2;
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + Math.cos(a) * r * (v / 100), y: cy + Math.sin(a) * r * (v / 100) };
  };
  const gridPts = f => dims.map((_, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return `${(cx + Math.cos(a) * r * f).toFixed(1)},${(cy + Math.sin(a) * r * f).toFixed(1)}`;
  }).join(' ');
  const path = (dna) => dims.map((d, i) => {
    const p = pt(i, dna?.[d.key] || 50);
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ') + 'Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <polygon key={i} points={gridPts(f)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>
      ))}
      {dims.map((_, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx+Math.cos(a)*r} y2={cy+Math.sin(a)*r} stroke="rgba(255,255,255,0.04)" strokeWidth="0.6"/>;
      })}
      <path d={path(dna2)} fill={`${color2}10`} stroke={color2} strokeWidth="1.8" strokeDasharray="3 2"/>
      <path d={path(dna1)} fill={`${color1}14`} stroke={color1} strokeWidth="2"/>
      {dims.map((d, i) => {
        const p1 = pt(i, dna1?.[d.key]||50);
        const p2 = pt(i, dna2?.[d.key]||50);
        return (
          <g key={i}>
            <circle cx={p1.x} cy={p1.y} r="3" fill={color1} stroke="rgba(5,8,16,0.8)" strokeWidth="1"/>
            <circle cx={p2.x} cy={p2.y} r="2.5" fill={color2} stroke="rgba(5,8,16,0.8)" strokeWidth="1"/>
          </g>
        );
      })}
      {dims.map((d, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + Math.cos(a) * (r * 1.3);
        const ly = cy + Math.sin(a) * (r * 1.3);
        const v1 = dna1?.[d.key] || 50, v2 = dna2?.[d.key] || 50;
        const leader = v1 > v2 ? color1 : v2 > v1 ? color2 : 'rgba(255,255,255,0.4)';
        return (
          <g key={i}>
            <text x={lx} y={ly-4} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8.5" fontWeight="600" fontFamily="Outfit">{d.label}</text>
            <text x={lx} y={ly+4} textAnchor="middle" fill={leader} fontSize="7.5" fontFamily="monospace" fontWeight="700">{v1}·{v2}</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ══════════════════════════════════════
   METRIC BAR
══════════════════════════════════════ */
const MetricBar = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">{label}</span>
      <span className="text-[10px] font-black" style={{ color, fontFamily:'JetBrains Mono' }}>{value}</span>
    </div>
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.04)' }}>
      <div className="h-full rounded-full transition-all duration-1000"
        style={{ width:`${value}%`, background:`linear-gradient(90deg,${color}60,${color})` }}/>
    </div>
  </div>
);

/* ══════════════════════════════════════
   COMPARE MODAL
══════════════════════════════════════ */
const CompareModal = ({ a, b, onClose }) => {
  if (!a || !b) return null;
  const dims = ['press','poss','counter','defLine','setPiece','flex'];
  const labels = { press:'Press', poss:'Possession', counter:'Counter', defLine:'Def Line', setPiece:'Set Piece', flex:'Flexibility' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.8)', backdropFilter:'blur(12px)', animation:'mgFadeIn 0.2s ease-out' }}>
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/[0.1] overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background:'rgba(8,12,22,0.98)', boxShadow:'0 30px 80px rgba(0,0,0,0.6)' }}>
        <div className="h-0.5" style={{ background:'linear-gradient(90deg,#22d3ee,#a855f7)' }}/>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <SwordsIcon className="w-4 h-4 text-purple-400"/>
            <span className="text-white font-black text-base">DNA Comparison</span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-colors border border-white/[0.06]"
            style={{ background:'rgba(255,255,255,0.03)' }}>
            <XIcon className="w-3.5 h-3.5"/>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Manager headers */}
          <div className="grid grid-cols-2 gap-3">
            {[{ m:a, color:'#22d3ee' }, { m:b, color:'#a855f7' }].map(({ m, color }, i) => (
              <div key={i} className="rounded-2xl border p-4 text-center"
                style={{ background:`${color}08`, borderColor:`${color}25` }}>
                {m.photo ? (
                  <img src={m.photo} alt="" className="w-14 h-14 rounded-2xl object-cover mx-auto mb-2 border-2"
                    style={{ borderColor:`${color}40` }}/>
                ) : (
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-2 flex items-center justify-center border-2 font-black text-xl"
                    style={{ background:`${color}12`, borderColor:`${color}30`, color }}>
                    {m.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                  </div>
                )}
                <p className="text-white font-black text-sm">{m.name}</p>
                <p className="text-xs mt-0.5 font-bold" style={{ color }}>{m.team}</p>
                {m.dna && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black"
                    style={{ background:`${m.dna.archetypeColor}12`, color:m.dna.archetypeColor, border:`1px solid ${m.dna.archetypeColor}25` }}>
                    {m.dna.archetype}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Radar */}
          <div className="rounded-2xl border border-white/[0.07] p-4" style={{ background:'rgba(10,14,26,0.8)' }}>
            <CompareRadar dna1={a.dna} dna2={b.dna} size={240}/>
            <div className="flex items-center justify-center gap-5 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2.5 rounded-sm" style={{ background:'#22d3ee' }}/>
                <span className="text-[11px] text-slate-400">{a.name.split(' ').pop()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2.5 rounded-sm border-2" style={{ borderColor:'#a855f7' }}/>
                <span className="text-[11px] text-slate-400">{b.name.split(' ').pop()}</span>
              </div>
            </div>
          </div>

          {/* Stat by stat */}
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background:'rgba(10,14,26,0.85)' }}>
            <div className="px-4 py-3 border-b border-white/[0.06] text-[10px] text-slate-600 uppercase tracking-widest font-bold"
              style={{ background:'rgba(255,255,255,0.02)' }}>
              Head-to-Head DNA
            </div>
            <div className="p-4 space-y-3">
              {dims.map(key => {
                const v1 = a.dna?.[key] || 50, v2 = b.dna?.[key] || 50;
                const aW = v1 > v2, bW = v2 > v1;
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black" style={{ fontFamily:'JetBrains Mono', color: aW?'#22d3ee':'#475569' }}>{v1}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">{labels[key]}</span>
                      <span className="text-sm font-black" style={{ fontFamily:'JetBrains Mono', color: bW?'#a855f7':'#475569' }}>{v2}</span>
                    </div>
                    <div className="flex h-2 gap-1">
                      <div className="flex-1 rounded-full overflow-hidden flex justify-end" style={{ background:'rgba(255,255,255,0.04)' }}>
                        <div className="h-full rounded-full" style={{ width:`${v1}%`, background: aW?'linear-gradient(90deg,#22d3ee60,#22d3ee)':'rgba(71,85,105,0.3)' }}/>
                      </div>
                      <div className="flex-1 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.04)' }}>
                        <div className="h-full rounded-full" style={{ width:`${v2}%`, background: bW?'linear-gradient(90deg,#a855f7,#a855f760)':'rgba(71,85,105,0.3)' }}/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signature traits */}
          {(a.dna?.sigStyle || b.dna?.sigStyle) && (
            <div className="grid grid-cols-2 gap-3">
              {[{ m:a, color:'#22d3ee' }, { m:b, color:'#a855f7' }].map(({ m, color }, i) => (
                <div key={i} className="rounded-2xl p-3 border" style={{ background:`${color}06`, borderColor:`${color}20` }}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color }}>Signature</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{m.dna?.sigStyle || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   MANAGER CARD
══════════════════════════════════════ */
function Card({ m, lm, expanded, onToggle, compareMode, compareSelected, onCompareToggle }) {
  const [imgErr, setImgErr] = React.useState(false);
  const dna       = m.dna;
  const accent    = lm?.color || '#22d3ee';
  const since     = m.since ? new Date().getFullYear() - parseInt(m.since) : 0;
  const initials  = m.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
  const press     = dna?.press || 50;
  const pressColor = press >= 78 ? '#10b981' : press >= 60 ? '#fbbf24' : '#f97316';
  const isSelected = compareSelected?.name === m.name;

  return (
    <div
      className="group relative border rounded-2xl overflow-hidden transition-all cursor-pointer"
      style={{
        background: isSelected ? `${accent}08` : 'rgba(10,14,26,0.9)',
        borderColor: isSelected ? `${accent}45` : expanded ? `${accent}30` : 'rgba(255,255,255,0.07)',
        boxShadow: isSelected ? `0 0 0 2px ${accent}30, 0 0 30px ${accent}15` : expanded ? `0 0 30px ${accent}10` : 'none',
        transform: expanded ? 'none' : undefined,
      }}
      onClick={compareMode ? onCompareToggle : onToggle}>

      {/* Accent line */}
      <div className="h-[3px]" style={{ background:`linear-gradient(90deg,${accent},${accent}40)` }}/>

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start gap-3 mb-3">

          {/* Manager photo or team logo */}
          <div className="relative flex-shrink-0">
            {m.photo && !imgErr ? (
              <img src={m.photo} alt={m.name}
                className="w-14 h-14 rounded-2xl object-cover border-2"
                style={{ borderColor:`${accent}35`, boxShadow:`0 0 16px ${accent}20` }}
                onError={() => setImgErr(true)}/>
            ) : (
              <div className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center p-1.5"
                style={{ borderColor:`${accent}30`, background:`${accent}08` }}>
                {m.teamLogo
                  ? <img src={m.teamLogo} alt={m.team} className="w-10 h-10 object-contain"
                      onError={e => { e.target.style.display='none'; }}/>
                  : <span className="font-black text-base" style={{ color:accent }}>{initials}</span>}
              </div>
            )}
            {/* Compare checkbox */}
            {compareMode && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2"
                style={{
                  background: isSelected ? accent : 'rgba(10,14,26,0.95)',
                  borderColor: isSelected ? accent : 'rgba(255,255,255,0.2)',
                }}>
                {isSelected && <CheckIcon className="w-2.5 h-2.5 text-white"/>}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-black text-white truncate leading-tight">{m.name}</h3>
            <p className="text-sm font-semibold truncate mt-0.5" style={{ color:accent }}>{m.team}</p>
            {dna && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border"
                style={{ background:`${dna.archetypeColor}12`, borderColor:`${dna.archetypeColor}25`, color:dna.archetypeColor }}>
                <BrainIcon className="w-2.5 h-2.5"/>
                <span className="text-[9px] font-black uppercase tracking-wider">{dna.archetype}</span>
              </div>
            )}
          </div>

          <Pitch formation={m.formation} size={50} color={accent}/>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-500 border border-white/[0.05]"
            style={{ fontFamily:'JetBrains Mono' }}>{m.formation}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
            style={{ color:pressColor, background:`${pressColor}12`, border:`1px solid ${pressColor}25` }}>
            Press {press}
          </span>
          {m.trophies > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md border"
              style={{
                color: m.trophies > 10 ? '#fbbf24' : m.trophies > 4 ? '#94a3b8' : '#64748b',
                background: m.trophies > 10 ? 'rgba(251,191,36,0.12)' : 'rgba(148,163,184,0.08)',
                border: m.trophies > 10 ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(148,163,184,0.15)',
              }}>
              🏆 {m.trophies}
            </span>
          )}
        </div>

        {/* Press bar */}
        <div className="mb-3">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.04)' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width:`${press}%`, background:`linear-gradient(90deg,${pressColor}60,${pressColor})` }}/>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.05]">
          <div className="text-center">
            <GlobeIcon className="w-3 h-3 text-slate-600 mx-auto mb-0.5"/>
            <p className="text-[10px] font-semibold text-slate-500 truncate">{m.nationality || '—'}</p>
          </div>
          <div className="text-center">
            <TrophyIcon className="w-3 h-3 mx-auto mb-0.5"
              style={{ color:m.trophies>10?'#fbbf24':m.trophies>0?'#94a3b8':'#475569' }}/>
            <p className="text-[11px] font-black"
              style={{ color:m.trophies>10?'#fbbf24':m.trophies>0?'#94a3b8':'#475569', fontFamily:'JetBrains Mono' }}>
              {m.trophies}
            </p>
          </div>
          <div className="text-center">
            <CalendarIcon className="w-3 h-3 text-slate-600 mx-auto mb-0.5"/>
            <p className="text-[10px] font-semibold text-slate-500">
              {since < 1 ? 'New' : since === 1 ? '1yr' : `${since}yrs`}
            </p>
          </div>
        </div>

        {/* Expanded DNA panel */}
        {expanded && !compareMode && (
          <div className="mt-4 pt-4 border-t border-white/[0.05] space-y-4"
            style={{ animation:'mgExpandIn 0.25s ease-out' }}>

            {dna ? (
              <>
                <div className="flex items-center gap-2">
                  <BrainIcon className="w-3 h-3 text-purple-400"/>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Tactical DNA</span>
                </div>

                {/* Radar */}
                <DNARadar dna={dna} color={accent} size={190}/>

                {/* Metric bars */}
                <div className="space-y-2">
                  <MetricBar label="Press Intensity"   value={dna.press}    color={pressColor}/>
                  <MetricBar label="Possession Target" value={dna.poss}     color="#22d3ee"/>
                  <MetricBar label="Counter Speed"     value={dna.counter}  color="#fbbf24"/>
                  <MetricBar label="Defensive Line"    value={dna.defLine}  color="#a855f7"/>
                  <MetricBar label="Set Piece Focus"   value={dna.setPiece} color="#f43f5e"/>
                  <MetricBar label="Tactical Flex"     value={dna.flex}     color="#34d399"/>
                </div>

                {/* Build-up style */}
                <div className="rounded-xl p-3 border border-white/[0.06]" style={{ background:'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingIcon className="w-3 h-3 text-slate-500"/>
                    <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Build-up Style</span>
                  </div>
                  <p className="text-sm font-bold text-white">{dna.buildUp}</p>
                </div>

                {/* Signature trait */}
                <div className="rounded-xl p-3 border flex items-start gap-2.5"
                  style={{ background:`${accent}06`, borderColor:`${accent}20` }}>
                  <TargetIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color:accent }}/>
                  <div>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-1">Signature Trait</p>
                    <p className="text-[12px] text-slate-300 leading-relaxed">{dna.sigStyle}</p>
                  </div>
                </div>

                {/* Formation + contract */}
                <div className="rounded-xl p-3 border border-white/[0.06] flex items-center gap-4"
                  style={{ background:'rgba(255,255,255,0.02)' }}>
                  <Pitch formation={m.formation} size={64} color={accent}/>
                  <div>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-0.5">Preferred Formation</p>
                    <p className="text-xl font-black" style={{ color:accent, fontFamily:'JetBrains Mono' }}>{m.formation}</p>
                    {m.contractUntil && (
                      <p className="text-[10px] text-slate-600 mt-1">Contract until {m.contractUntil.slice(0,4)}</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-600 text-sm">
                Tactical DNA coming soon for {m.name.split(' ')[0]}
              </div>
            )}
          </div>
        )}

        {/* Expand hint */}
        {!compareMode && (
          <div className="flex justify-center mt-3 pt-2 border-t border-white/[0.04]">
            <div className={`flex items-center gap-1 text-[10px] font-bold transition-all ${expanded?'text-slate-500':'text-slate-700 group-hover:text-slate-500'}`}>
              {expanded
                ? <><ChevronUpIcon className="w-3 h-3"/> Hide DNA</>
                : <><ChevronDnIcon className="w-3 h-3"/> Tactical DNA</>}
            </div>
          </div>
        )}

        {compareMode && (
          <div className="flex justify-center mt-3 pt-2 border-t border-white/[0.04]">
            <div className={`text-[10px] font-bold ${isSelected?'text-cyan-400':'text-slate-700 group-hover:text-slate-500'}`}>
              {isSelected ? <span className="flex items-center gap-1"><CheckIcon className="w-3 h-3"/> Selected</span> : 'Select for comparison'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function ManagersPage({ onNavigate }) {
  const [managers,       setManagers]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [search,         setSearch]         = useState('');
  const [league,         setLeague]         = useState('All');
  const [archetypeFilter,setArchetypeFilter]= useState('All');
  const [sortBy,         setSortBy]         = useState('trophies');
  const [sortDir,        setSortDir]        = useState('desc');
  const [expanded,       setExpanded]       = useState(null);
  const [compareMode,    setCompareMode]    = useState(false);
  const [compareA,       setCompareA]       = useState(null);
  const [compareB,       setCompareB]       = useState(null);
  const [showCompare,    setShowCompare]    = useState(false);

  /* ── BUG FIX: loadManagers wrapped in useCallback ── */
  const loadManagers = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchWithTimeout(`${API_BASE}/managers/live`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        // Deduplicate by name + team
        const seen = new Set();
        const deduped = data.filter(m => {
          const key = `${m.name}-${m.team}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setManagers(deduped);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  /* ── BUG FIX: useEffect deps properly set ── */
  useEffect(() => { loadManagers(); }, [loadManagers]);

  /* ── Enrich managers with hardcoded DNA / trophies / formation ── */
  const enriched = useMemo(() => managers.map(m => {
    const dna = TACTICAL_DNA[m.name] ||
      Object.entries(TACTICAL_DNA).find(([k]) =>
        k.toLowerCase().includes(m.name.split(' ').pop().toLowerCase()) &&
        m.name.split(' ').pop().length > 4
      )?.[1];

    const trophies = MANAGER_TROPHIES[m.name] ??
      Object.entries(MANAGER_TROPHIES).find(([k]) =>
        k.toLowerCase().includes(m.name.split(' ').pop().toLowerCase())
      )?.[1] ?? 0;

    const formation = MANAGER_FORMATION[m.name] ??
      Object.entries(MANAGER_FORMATION).find(([k]) =>
        k.toLowerCase().includes(m.name.split(' ').pop().toLowerCase())
      )?.[1] ?? '4-3-3';

    const since = m.contractStart
      ? new Date(m.contractStart).getFullYear().toString()
      : (new Date().getFullYear() - 1).toString(); // fallback: assume started last year

    return { ...m, dna, trophies, formation, since };
  }), [managers]);

  /* ── Unique archetypes for filter ── */
  const archetypes = useMemo(() => {
    const set = new Set(enriched.map(m => m.dna?.archetype).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [enriched]);

  /* ── Sort + filter ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...enriched]
      .filter(m => (
        (!q || m.name.toLowerCase().includes(q) || m.team.toLowerCase().includes(q) || (m.nationality||'').toLowerCase().includes(q)) &&
        (league === 'All' || m.league === league) &&
        (archetypeFilter === 'All' || m.dna?.archetype === archetypeFilter)
      ))
      .sort((a, b) => {
        let diff;
        if (sortBy === 'trophies')  diff = b.trophies - a.trophies;
        else if (sortBy === 'press') diff = (b.dna?.press||50) - (a.dna?.press||50);
        else diff = a.name.localeCompare(b.name);
        return sortDir === 'asc' ? -diff : diff;
      });
  }, [enriched, search, league, archetypeFilter, sortBy, sortDir]);

  /* ── Compare selection ── */
  const handleCompareToggle = (m) => {
    if (compareA?.name === m.name) { setCompareA(null); return; }
    if (compareB?.name === m.name) { setCompareB(null); return; }
    if (!compareA) { setCompareA(m); return; }
    if (!compareB) { setCompareB(m); return; }
    // Both slots full — replace A
    setCompareA(m);
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(m => { if (!g[m.league]) g[m.league] = []; g[m.league].push(m); });
    return g;
  }, [filtered]);

  const avgPress = enriched.length > 0
    ? Math.round(enriched.reduce((s, m) => s + (m.dna?.press||50), 0) / enriched.length)
    : 0;
  const totalTrophies = enriched.reduce((s, m) => s + (m.trophies||0), 0);

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-[#050810] flex flex-col" style={{ fontFamily:"'Outfit',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
      <NavBar currentPage="managers" onNavigate={onNavigate}/>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-5 relative">
            <div className="absolute inset-0 rounded-full border-2" style={{ borderColor:'rgba(251,191,36,0.2)' }}/>
            <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor:'#fbbf24', borderTopColor:'transparent' }}/>
            <ShieldIcon className="w-6 h-6 text-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
          </div>
          <p className="text-white font-black text-lg">Loading Managers</p>
          <p className="text-slate-600 text-sm mt-1">Fetching live assignments…</p>
        </div>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="min-h-screen bg-[#050810] flex flex-col" style={{ fontFamily:"'Outfit',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
      <NavBar currentPage="managers" onNavigate={onNavigate}/>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <ShieldIcon className="w-14 h-14 text-slate-700 mx-auto"/>
          <p className="text-xl font-black text-white">Failed to load managers</p>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">{error}</p>
          <button onClick={loadManagers}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-bold text-sm border transition-all"
            style={{ background:'rgba(251,191,36,0.1)', borderColor:'rgba(251,191,36,0.25)', color:'#fbbf24' }}>
            <RefreshIcon className="w-4 h-4"/> Retry
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050810] text-white" style={{ fontFamily:"'Outfit',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[700px] h-[700px] rounded-full blur-[160px]"
          style={{ background:'radial-gradient(circle,rgba(251,191,36,0.05) 0%,transparent 65%)' }}/>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background:'radial-gradient(circle,rgba(34,211,238,0.04) 0%,transparent 65%)' }}/>
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize:'60px 60px' }}/>
      </div>

      <NavBar currentPage="managers" onNavigate={onNavigate}/>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-5 md:px-8 py-8">

        {/* ══ HEADER ══ */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldIcon className="w-3.5 h-3.5 text-yellow-400"/>
              <span className="text-yellow-400 text-[11px] font-bold uppercase tracking-[0.2em]">Live · 2025–26 Season</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[0.9] mb-3">
              The<br/>
              <span style={{ background:'linear-gradient(90deg,#fbbf24,#f97316)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                Managers
              </span>
            </h1>
            <p className="text-slate-500 text-base">
              <span className="text-white font-bold">{managers.length}</span> coaches ·
              Live assignments · Curated tactical DNA
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-3 flex-wrap">
            {[
              { label:'Live Coaches',     val:managers.length,  color:'#fbbf24', Icon:UsersIcon  },
              { label:'Avg Press Score',  val:avgPress,         color:'#10b981', Icon:ZapIcon    },
              { label:'Combined Trophies',val:totalTrophies,    color:'#a855f7', Icon:TrophyIcon },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] px-4 py-3 text-center"
                style={{ background:'rgba(255,255,255,0.03)' }}>
                <s.Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color:s.color }}/>
                <p className="text-xl font-black" style={{ color:s.color, fontFamily:'JetBrains Mono' }}>{s.val}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══ CONTROLS ══ */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search manager, team, nationality…"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none transition-all border"
              style={{ background:'rgba(255,255,255,0.04)', borderColor: search?'rgba(251,191,36,0.3)':'rgba(255,255,255,0.08)' }}/>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Sort */}
            {[
              { id:'trophies', label:'Trophies', Icon:TrophyIcon },
              { id:'press',    label:'Press',    Icon:ZapIcon    },
              { id:'name',     label:'A–Z',      Icon:ArrowUpIcon},
            ].map(s => (
              <button key={s.id} onClick={() => toggleSort(s.id)}
                className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all border"
                style={{
                  background: sortBy===s.id ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
                  borderColor: sortBy===s.id ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)',
                  color: sortBy===s.id ? '#fbbf24' : '#64748b',
                }}>
                <s.Icon className="w-3.5 h-3.5"/>
                {s.label}
                {sortBy===s.id && (sortDir==='desc' ? <ArrowDnIcon className="w-3 h-3"/> : <ArrowUpIcon className="w-3 h-3"/>)}
              </button>
            ))}

            {/* Compare toggle */}
            <button onClick={() => { setCompareMode(v => !v); setCompareA(null); setCompareB(null); }}
              className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all border"
              style={{
                background: compareMode ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                borderColor: compareMode ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.08)',
                color: compareMode ? '#a855f7' : '#64748b',
              }}>
              <SwordsIcon className="w-3.5 h-3.5"/>
              Compare
            </button>

            <button onClick={loadManagers}
              className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl text-sm font-bold border transition-all"
              style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.08)', color:'#64748b' }}>
              <RefreshIcon className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>

        {/* ══ LEAGUE TABS ══ */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {LEAGUES.map(l => {
            const lm = LEAGUE_META[l];
            const count = l === 'All' ? managers.length : managers.filter(m => m.league === l).length;
            const isActive = league === l;
            return (
              <button key={l} onClick={() => setLeague(l)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border flex-shrink-0"
                style={{
                  background: isActive ? (lm?`${lm.color}18`:'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.02)',
                  borderColor: isActive ? (lm?`${lm.color}40`:'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.06)',
                  color: isActive ? (lm?.color||'white') : '#64748b',
                }}>
                {l === 'All' ? <GlobeIcon className="w-4 h-4"/> : lm && <img src={lm.img} alt="" className="w-4 h-4 object-contain"/>}
                {l === 'All' ? 'All' : l.replace(' League','').replace('Premier','PL')}
                <span className="text-[10px] font-black opacity-50">{count}</span>
              </button>
            );
          })}
        </div>

        {/* ══ ARCHETYPE FILTER ══ */}
        {archetypes.length > 2 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <FilterIcon className="w-3 h-3 text-slate-600"/>
              <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Style:</span>
            </div>
            {archetypes.map(a => (
              <button key={a} onClick={() => setArchetypeFilter(a)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border flex-shrink-0"
                style={{
                  background: archetypeFilter===a ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.02)',
                  borderColor: archetypeFilter===a ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.06)',
                  color: archetypeFilter===a ? '#a855f7' : '#64748b',
                }}>
                {a}
              </button>
            ))}
          </div>
        )}

        {/* ══ COMPARE BAR ══ */}
        {compareMode && (
          <div className="rounded-2xl border border-purple-500/25 p-4 mb-5 flex items-center gap-4 flex-wrap"
            style={{ background:'rgba(168,85,247,0.06)', animation:'mgFadeIn 0.2s ease-out' }}>
            <SwordsIcon className="w-4 h-4 text-purple-400 flex-shrink-0"/>
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              {[compareA, compareB].map((m, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border flex-shrink-0"
                  style={{
                    background: m ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.03)',
                    borderColor: m ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.08)',
                  }}>
                  {m ? (
                    <>
                      <span className="text-sm font-bold text-white">{m.name.split(' ').pop()}</span>
                      <button onClick={() => i===0?setCompareA(null):setCompareB(null)}
                        className="text-slate-500 hover:text-white transition-colors">
                        <XIcon className="w-3 h-3"/>
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-600">Select manager {i+1}</span>
                  )}
                </div>
              ))}
            </div>
            {compareA && compareB && (
              <button onClick={() => setShowCompare(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all flex-shrink-0"
                style={{ background:'rgba(168,85,247,0.2)', borderColor:'rgba(168,85,247,0.4)', color:'#a855f7' }}>
                <SwordsIcon className="w-3.5 h-3.5"/>
                {compareA.dna && compareB.dna ? 'Compare DNA' : 'Compare'}
              </button>
            )}
          </div>
        )}

        {/* ══ DNA CALLOUT ══ */}
        <div className="rounded-2xl border border-white/[0.06] px-5 py-3 mb-6 flex items-center gap-3"
          style={{ background:'rgba(168,85,247,0.04)' }}>
          <BrainIcon className="w-4 h-4 text-purple-400 flex-shrink-0"/>
          <p className="text-sm text-slate-400">
            <span className="text-white font-bold">Live assignments</span> from football-data.org ·
            <span className="text-white font-bold ml-1">Tactical DNA</span> curated per manager.
            Click any card to expand. Use <span className="text-purple-400 font-bold">Compare</span> to pit two DNA profiles head-to-head.
          </p>
        </div>

        {/* ══ MANAGERS GRID ══ */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <UsersIcon className="w-12 h-12 text-slate-700 mx-auto mb-4"/>
            <p className="text-lg font-bold text-slate-500">No managers found</p>
            <p className="text-slate-600 text-sm mt-1">Try adjusting search or filters</p>
          </div>
        ) : league === 'All' ? (
          <div className="space-y-10">
            {ORDER.map(lg => {
              const group = grouped[lg];
              if (!group?.length) return null;
              const lm = LEAGUE_META[lg];
              return (
                <section key={lg}>
                  <div className="flex items-center gap-3 mb-5">
                    {lm && <img src={lm.img} alt="" className="w-7 h-7 object-contain"/>}
                    <h2 className="text-lg font-black text-white">{lg}</h2>
                    <span className="text-xs font-black px-2.5 py-1 rounded-xl"
                      style={{ background:`${lm?.color}15`, color:lm?.color }}>
                      {group.length}
                    </span>
                    <div className="flex-1 h-px" style={{ background:`linear-gradient(90deg,${lm?.color}40,transparent)` }}/>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.map(m => {
                      const key = `${m.name}-${m.team}`;
                      return (
                        <Card key={key} m={m} lm={lm}
                          expanded={expanded === key}
                          onToggle={() => setExpanded(expanded === key ? null : key)}
                          compareMode={compareMode}
                          compareSelected={compareA?.name===m.name ? compareA : compareB?.name===m.name ? compareB : null}
                          onCompareToggle={() => handleCompareToggle(m)}/>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(m => {
              const key = `${m.name}-${m.team}`;
              return (
                <Card key={key} m={m} lm={LEAGUE_META[m.league]}
                  expanded={expanded === key}
                  onToggle={() => setExpanded(expanded === key ? null : key)}
                  compareMode={compareMode}
                  compareSelected={compareA?.name===m.name ? compareA : compareB?.name===m.name ? compareB : null}
                  onCompareToggle={() => handleCompareToggle(m)}/>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ COMPARE MODAL ══ */}
      {showCompare && compareA && compareB && (
        <CompareModal a={compareA} b={compareB} onClose={() => setShowCompare(false)}/>
      )}

      <style>{`
        @keyframes mgFadeIn    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes mgExpandIn  { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}