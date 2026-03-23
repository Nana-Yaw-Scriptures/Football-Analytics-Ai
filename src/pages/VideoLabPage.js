import React, { useState, useRef, useCallback } from 'react';
import NavBar from '../components/NavBar';

// ── Icons ────────────────────────────────────────────────────────────
const I = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const UploadIcon   = p => <I {...p} d={<><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>}/>;
const VideoIcon    = p => <I {...p} d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>}/>;
const ZapIcon      = p => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const EyeIcon      = p => <I {...p} d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}/>;
const TargetIcon   = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const ActivityIcon = p => <I {...p} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>;
const LayersIcon   = p => <I {...p} d={<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>}/>;
const CpuIcon      = p => <I {...p} d={<><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>}/>;
const TrendingIcon = p => <I {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const UsersIcon    = p => <I {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const MapIcon      = p => <I {...p} d={<><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>}/>;
const ClockIcon    = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const LockIcon     = p => <I {...p} d={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}/>;
const CheckIcon    = p => <I {...p} d={<polyline points="20 6 9 17 4 12"/>}/>;
const XIcon        = p => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const PlayIcon     = p => <I {...p} d={<polygon points="5 3 19 12 5 21 5 3"/>}/>;
const FlaskIcon    = p => <I {...p} d={<><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v8m0 0H5m4 0h10m0-8v8m0 0h4M9 11v8a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-8"/></>}/>;

// ── Demo clips data ──────────────────────────────────────────────────
const DEMO_CLIPS = [
  {
    id: 1,
    title: 'Manchester City vs Arsenal',
    competition: 'Premier League',
    date: 'Mar 2026',
    duration: '4:32',
    thumbnail: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=600&h=340&fit=crop',
    stats: {
      playersDetected: 22,
      ballTracked: '94%',
      passes: 847,
      pressureEvents: 134,
      avgSpeed: '8.4 km/h',
      distanceCovered: '112 km',
      possession: { home: 58, away: 42 },
      heatZones: ['High press', 'Wide play', 'Counter-attack'],
    },
    highlights: ['Tactical press detected at 12:34', 'High speed run: Salah 34.2 km/h', 'Goal chance cluster: 78-82 min'],
    models: ['YOLOv8x', 'ByteTrack', 'Homography v2'],
  },
  {
    id: 2,
    title: 'Real Madrid vs Barcelona',
    competition: 'La Liga — El Clásico',
    date: 'Feb 2026',
    duration: '3:18',
    thumbnail: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=340&fit=crop',
    stats: {
      playersDetected: 22,
      ballTracked: '97%',
      passes: 1124,
      pressureEvents: 98,
      avgSpeed: '7.9 km/h',
      distanceCovered: '109 km',
      possession: { home: 44, away: 56 },
      heatZones: ['Tiki-taka midfield', 'Left flank dominance', 'Set pieces'],
    },
    highlights: ['Barcelona pressing trap: 23:10', 'Vinicius Jr sprint: 36.1 km/h', '8 consecutive passes: 67 min'],
    models: ['YOLOv8x', 'ByteTrack', 'Homography v2'],
  },
  {
    id: 3,
    title: 'Bayern München vs Dortmund',
    competition: 'Bundesliga — Der Klassiker',
    date: 'Mar 2026',
    duration: '5:14',
    thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=340&fit=crop',
    stats: {
      playersDetected: 22,
      ballTracked: '91%',
      passes: 763,
      pressureEvents: 167,
      avgSpeed: '9.1 km/h',
      distanceCovered: '118 km',
      possession: { home: 62, away: 38 },
      heatZones: ['High line defense', 'Wing overloads', 'Transition speed'],
    },
    highlights: ['Bayern gegenpressing: 34:22', 'Kane header zone cluster', 'High defensive line exposed: 71 min'],
    models: ['YOLOv8x', 'ByteTrack', 'Homography v2'],
  },
];

// ── Analysis options ─────────────────────────────────────────────────
const ANALYSIS_OPTS = [
  { id: 'player',    label: 'Player Tracking',    icon: UsersIcon,    color: '#22d3ee', desc: 'Track all 22 players across every frame' },
  { id: 'ball',      label: 'Ball Tracking',       icon: TargetIcon,   color: '#f59e0b', desc: 'Detect and track ball trajectory' },
  { id: 'heatmap',   label: 'Heatmaps',            icon: MapIcon,      color: '#ef4444', desc: 'Player movement density maps' },
  { id: 'pressing',  label: 'Pressing Analysis',   icon: ActivityIcon, color: '#a855f7', desc: 'Detect pressing triggers and intensity' },
  { id: 'formation', label: 'Formation Detection', icon: LayersIcon,   color: '#10b981', desc: 'Identify tactical shape in real-time' },
  { id: 'speed',     label: 'Speed Analysis',      icon: ZapIcon,      color: '#f97316', desc: 'Calculate player speed per frame' },
];

// ── Pitch heatmap SVG ─────────────────────────────────────────────────
const PitchHeatmap = ({ possession }) => (
  <svg viewBox="0 0 400 260" className="w-full rounded-xl" style={{ background: '#1a2e1a' }}>
    {/* Pitch outline */}
    <rect x="10" y="10" width="380" height="240" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" rx="2"/>
    {/* Center circle */}
    <circle cx="200" cy="130" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
    <line x1="200" y1="10" x2="200" y2="250" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
    {/* Goal areas */}
    <rect x="10" y="85" width="55" height="90" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
    <rect x="335" y="85" width="55" height="90" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
    <rect x="10" y="105" width="25" height="50" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
    <rect x="365" y="105" width="25" height="50" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>

    {/* Heatmap zones — home team (left) */}
    <ellipse cx="80" cy="130" rx="60" ry="70" fill="rgba(34,211,238,0.15)"/>
    <ellipse cx="120" cy="100" rx="40" ry="35" fill="rgba(34,211,238,0.2)"/>
    <ellipse cx="120" cy="160" rx="40" ry="35" fill="rgba(34,211,238,0.2)"/>
    <ellipse cx="160" cy="130" rx="30" ry="50" fill="rgba(34,211,238,0.25)"/>

    {/* Heatmap zones — away team (right) */}
    <ellipse cx="320" cy="130" rx="60" ry="70" fill="rgba(168,85,247,0.15)"/>
    <ellipse cx="280" cy="110" rx="40" ry="30" fill="rgba(168,85,247,0.2)"/>
    <ellipse cx="250" cy="130" rx="35" ry="45" fill="rgba(168,85,247,0.25)"/>

    {/* Hot zone */}
    <ellipse cx="145" cy="130" rx="20" ry="30" fill="rgba(239,68,68,0.3)"/>
    <ellipse cx="255" cy="130" rx="20" ry="30" fill="rgba(239,68,68,0.25)"/>

    {/* Possession label */}
    <text x="80" y="248" textAnchor="middle" fill="rgba(34,211,238,0.8)" fontSize="10" fontFamily="monospace">{possession.home}%</text>
    <text x="320" y="248" textAnchor="middle" fill="rgba(168,85,247,0.8)" fontSize="10" fontFamily="monospace">{possession.away}%</text>
    <text x="200" y="248" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">POSSESSION</text>
  </svg>
);

// ── Main Page ─────────────────────────────────────────────────────────
export default function VideoLabPage({ onNavigate }) {
  const [selectedDemo,    setSelectedDemo]    = useState(null);
  const [activeTab,       setActiveTab]       = useState('demos');   // 'demos' | 'upload'
  const [selectedOpts,    setSelectedOpts]    = useState(['player', 'ball', 'heatmap']);
  const [dragOver,        setDragOver]        = useState(false);
  const [uploadedFile,    setUploadedFile]    = useState(null);
  const [showComingSoon,  setShowComingSoon]  = useState(false);
  const fileRef = useRef(null);

  const toggleOpt = id => setSelectedOpts(prev =>
    prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
  );

  const handleDrop = useCallback(e => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) setUploadedFile(file);
  }, []);

  const handleFileSelect = e => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  const handleAnalyze = () => setShowComingSoon(true);

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg,#040810 0%,#060c14 50%,#030608 100%)', fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full blur-[160px]" style={{ background: 'radial-gradient(circle,rgba(34,211,238,0.06) 0%,transparent 70%)' }}/>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: 'radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 70%)' }}/>
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle,rgba(16,185,129,0.04) 0%,transparent 70%)' }}/>
      </div>

      <NavBar currentPage="videolab" onNavigate={onNavigate}/>

      <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-24">

        {/* ── Hero ── */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em]">AI-Powered · Computer Vision</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-4">
            Video<br/>
            <span style={{ background: 'linear-gradient(90deg,#22d3ee,#10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Lab
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mb-8">
            Football intelligence through computer vision. Track players, detect formations, analyse pressing intensity — powered by YOLOv8 and ByteTrack.
          </p>

          {/* Tech badges */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'YOLOv8x', color: '#22d3ee' },
              { label: 'ByteTrack', color: '#10b981' },
              { label: 'OpenCV', color: '#f59e0b' },
              { label: 'Homography', color: '#a855f7' },
              { label: 'Pose Estimation', color: '#ef4444' },
            ].map((t, i) => (
              <span key={i} className="text-xs font-black px-3 py-1 rounded-full border"
                style={{ color: t.color, background: `${t.color}10`, borderColor: `${t.color}25` }}>
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Detection Accuracy', value: '94.7%',  color: '#22d3ee', icon: <EyeIcon className="w-4 h-4"/> },
            { label: 'Players Tracked',    value: '22/22',  color: '#10b981', icon: <UsersIcon className="w-4 h-4"/> },
            { label: 'Frames/Second',      value: '30 FPS', color: '#f59e0b', icon: <VideoIcon className="w-4 h-4"/> },
            { label: 'Model',              value: 'YOLOv8x', color: '#a855f7', icon: <CpuIcon className="w-4 h-4"/> },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 border border-white/8"
              style={{ background: `linear-gradient(135deg,${s.color}10,rgba(4,8,16,0.9))` }}>
              <div className="flex items-center gap-2 mb-1" style={{ color: s.color }}>
                {s.icon}
                <span className="text-xs uppercase tracking-widest font-bold">{s.label}</span>
              </div>
              <p className="text-2xl font-black text-white" style={{ fontFamily: 'JetBrains Mono' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Main tabs ── */}
        <div className="flex gap-2 mb-8 rounded-2xl p-1.5 border border-white/[0.06]" style={{ background: 'rgba(10,14,26,0.6)' }}>
          {[
            { id: 'demos',  label: '🎬 Demo Analyses', color: '#22d3ee' },
            { id: 'upload', label: '⬆️ Upload Video',  color: '#10b981' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border"
              style={{
                background:  activeTab === tab.id ? `${tab.color}15` : 'transparent',
                borderColor: activeTab === tab.id ? `${tab.color}35` : 'transparent',
                color:       activeTab === tab.id ? tab.color : '#64748b',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── DEMOS TAB ── */}
        {activeTab === 'demos' && (
          <div>
            {!selectedDemo ? (
              <div>
                <p className="text-slate-400 text-sm mb-5">Click a match to view the full CV analysis report.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {DEMO_CLIPS.map(clip => (
                    <div key={clip.id} onClick={() => setSelectedDemo(clip)}
                      className="rounded-2xl border overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:border-cyan-500/30 group"
                      style={{ background: 'rgba(10,14,26,0.8)', borderColor: 'rgba(255,255,255,0.08)' }}>
                      <div className="relative overflow-hidden">
                        <img src={clip.thumbnail} alt="" className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"/>
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,transparent 40%,rgba(4,8,16,0.9))' }}/>
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold"
                          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
                          <CheckIcon className="w-3 h-3"/> Analysed
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                          style={{ background: 'rgba(0,0,0,0.6)', color: '#94a3b8' }}>
                          <ClockIcon className="w-3 h-3"/> {clip.duration}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-white font-black text-sm">{clip.title}</p>
                          <p className="text-slate-400 text-xs">{clip.competition} · {clip.date}</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Players', value: clip.stats.playersDetected },
                            { label: 'Ball', value: clip.stats.ballTracked },
                            { label: 'Passes', value: clip.stats.passes },
                          ].map((s, i) => (
                            <div key={i} className="text-center p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                              <p className="text-sm font-black text-cyan-400" style={{ fontFamily: 'JetBrains Mono' }}>{s.value}</p>
                              <p className="text-[10px] text-slate-600 uppercase">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Demo detail view ── */
              <div>
                <button onClick={() => setSelectedDemo(null)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
                  ← Back to demos
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Video preview */}
                  <div className="rounded-2xl overflow-hidden border border-white/8 relative group cursor-pointer"
                    style={{ background: 'rgba(10,14,26,0.8)' }}>
                    <img src={selectedDemo.thumbnail} alt="" className="w-full h-64 object-cover"/>
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-white/30 group-hover:border-cyan-400 transition-all"
                        style={{ background: 'rgba(34,211,238,0.15)' }}>
                        <PlayIcon className="w-6 h-6 text-white ml-1"/>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: 'linear-gradient(0deg,rgba(4,8,16,0.95),transparent)' }}>
                      <p className="text-white font-black">{selectedDemo.title}</p>
                      <p className="text-slate-400 text-xs">{selectedDemo.competition} · {selectedDemo.date} · {selectedDemo.duration}</p>
                    </div>
                  </div>

                  {/* Pitch heatmap */}
                  <div className="rounded-2xl border border-white/8 p-4" style={{ background: 'rgba(10,14,26,0.8)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <MapIcon className="w-4 h-4 text-emerald-400"/>
                      <span className="text-white font-black text-sm">Movement Heatmap</span>
                    </div>
                    <PitchHeatmap possession={selectedDemo.stats.possession}/>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-400"/>
                        <span className="text-xs text-slate-400">Home team</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-400"/>
                        <span className="text-xs text-slate-400">Away team</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"/>
                        <span className="text-xs text-slate-400">Hot zones</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  {[
                    { label: 'Players Detected', value: selectedDemo.stats.playersDetected, color: '#22d3ee' },
                    { label: 'Ball Tracked',      value: selectedDemo.stats.ballTracked,     color: '#f59e0b' },
                    { label: 'Total Passes',      value: selectedDemo.stats.passes,          color: '#10b981' },
                    { label: 'Pressure Events',   value: selectedDemo.stats.pressureEvents,  color: '#ef4444' },
                    { label: 'Avg Speed',         value: selectedDemo.stats.avgSpeed,        color: '#a855f7' },
                    { label: 'Dist. Covered',     value: selectedDemo.stats.distanceCovered, color: '#f97316' },
                  ].map((s, i) => (
                    <div key={i} className="rounded-2xl p-3 text-center border border-white/8"
                      style={{ background: `linear-gradient(135deg,${s.color}10,rgba(4,8,16,0.9))` }}>
                      <p className="text-base font-black" style={{ color: s.color, fontFamily: 'JetBrains Mono' }}>{s.value}</p>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Highlights + Models */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/8 p-5" style={{ background: 'rgba(10,14,26,0.8)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <ZapIcon className="w-4 h-4 text-yellow-400"/>
                      <span className="text-white font-black text-sm">CV Highlights</span>
                    </div>
                    <div className="space-y-3">
                      {selectedDemo.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                          <ZapIcon className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5"/>
                          <span className="text-sm text-slate-300">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 p-5" style={{ background: 'rgba(10,14,26,0.8)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <CpuIcon className="w-4 h-4 text-cyan-400"/>
                      <span className="text-white font-black text-sm">Models Used</span>
                    </div>
                    <div className="space-y-2 mb-4">
                      {selectedDemo.models.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.12)' }}>
                          <CheckIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0"/>
                          <span className="text-sm text-slate-300">{m}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <p className="text-xs text-emerald-400 font-bold mb-1">Tactical zones detected</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedDemo.stats.heatZones.map((z, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded-full text-emerald-300" style={{ background: 'rgba(16,185,129,0.12)' }}>{z}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── UPLOAD TAB ── */}
        {activeTab === 'upload' && (
          <div>
            {/* Coming soon banner */}
            <div className="rounded-2xl p-4 mb-6 flex items-center gap-4 border"
              style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <LockIcon className="w-5 h-5 text-yellow-400"/>
              </div>
              <div>
                <p className="text-yellow-400 font-black text-sm">Processing Coming Soon</p>
                <p className="text-slate-400 text-xs mt-0.5">Upload and configure your analysis below. GPU processing will be enabled in the next release.</p>
              </div>
              <span className="ml-auto px-3 py-1 rounded-full text-xs font-black flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                Phase 2
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload zone */}
              <div>
                <p className="text-white font-black text-sm mb-3">Upload Video Clip</p>
                <div
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: dragOver ? '#22d3ee' : uploadedFile ? '#10b981' : 'rgba(255,255,255,0.12)',
                    background:  dragOver ? 'rgba(34,211,238,0.05)' : uploadedFile ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                  }}>
                  <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect}/>
                  {uploadedFile ? (
                    <div>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <VideoIcon className="w-7 h-7 text-emerald-400"/>
                      </div>
                      <p className="text-emerald-400 font-black">{uploadedFile.name}</p>
                      <p className="text-slate-500 text-xs mt-1">{(uploadedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      <button onClick={e => { e.stopPropagation(); setUploadedFile(null); }}
                        className="mt-3 text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 mx-auto">
                        <XIcon className="w-3 h-3"/> Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}>
                        <UploadIcon className="w-7 h-7 text-cyan-400"/>
                      </div>
                      <p className="text-white font-bold mb-1">Drop your video here</p>
                      <p className="text-slate-500 text-sm">or click to browse</p>
                      <p className="text-slate-700 text-xs mt-3">MP4, MOV, AVI · Max 500MB · Min 30 seconds</p>
                    </div>
                  )}
                </div>

                {/* Analysis options */}
                <p className="text-white font-black text-sm mt-5 mb-3">Analysis Options</p>
                <div className="grid grid-cols-2 gap-2">
                  {ANALYSIS_OPTS.map(opt => {
                    const active = selectedOpts.includes(opt.id);
                    return (
                      <button key={opt.id} onClick={() => toggleOpt(opt.id)}
                        className="flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all"
                        style={{
                          background:  active ? `${opt.color}10` : 'rgba(255,255,255,0.02)',
                          borderColor: active ? `${opt.color}30` : 'rgba(255,255,255,0.07)',
                        }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: active ? `${opt.color}20` : 'rgba(255,255,255,0.05)' }}>
                          <opt.icon className="w-3.5 h-3.5" style={{ color: active ? opt.color : '#475569' }}/>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: active ? 'white' : '#64748b' }}>{opt.label}</p>
                        </div>
                        {active && <CheckIcon className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: opt.color }}/>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview + Run */}
              <div>
                <p className="text-white font-black text-sm mb-3">Analysis Preview</p>
                <div className="rounded-2xl border border-white/8 p-5 mb-4" style={{ background: 'rgba(10,14,26,0.8)' }}>
                  <div className="space-y-3">
                    {ANALYSIS_OPTS.filter(o => selectedOpts.includes(o.id)).map(opt => (
                      <div key={opt.id} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: `${opt.color}08`, border: `1px solid ${opt.color}18` }}>
                        <opt.icon className="w-4 h-4 flex-shrink-0" style={{ color: opt.color }}/>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{opt.label}</p>
                          <p className="text-xs text-slate-500">{opt.desc}</p>
                        </div>
                        <CheckIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: opt.color }}/>
                      </div>
                    ))}
                    {selectedOpts.length === 0 && (
                      <p className="text-slate-600 text-sm text-center py-4">Select analysis options</p>
                    )}
                  </div>
                </div>

                {/* Estimated time */}
                <div className="rounded-2xl border border-white/8 p-4 mb-4" style={{ background: 'rgba(10,14,26,0.8)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 uppercase tracking-widest">Estimated Processing</span>
                    <span className="text-cyan-400 font-black text-sm" style={{ fontFamily: 'JetBrains Mono' }}>~2-4 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 uppercase tracking-widest">GPU</span>
                    <span className="text-emerald-400 font-black text-sm">Tesla T4 (16GB)</span>
                  </div>
                </div>

                {/* Run button */}
                <button onClick={handleAnalyze}
                  className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.15),rgba(16,185,129,0.15))', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.05),transparent)' }}/>
                  <CpuIcon className="w-5 h-5"/>
                  Run Analysis
                  <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                    Coming Soon
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Coming soon modal ── */}
        {showComingSoon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-md rounded-3xl border border-white/10 p-8 text-center"
              style={{ background: 'rgba(8,12,24,0.98)', animation: 'modalIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                <FlaskIcon className="w-8 h-8 text-cyan-400"/>
              </div>
              <h3 className="text-white font-black text-2xl mb-2">Coming in Phase 2</h3>
              <p className="text-slate-400 mb-6">GPU processing for user-uploaded videos is being built. Check out our pre-analysed demo matches in the meantime.</p>
              <div className="space-y-2 mb-6 text-left">
                {['YOLOv8 player detection', 'ByteTrack multi-object tracking', 'Heatmap generation', 'Formation detection', 'Speed analysis'].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0"/>
                    {f}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowComingSoon(false); setActiveTab('demos'); }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg,#22d3ee,#0e7490)', color: '#000' }}>
                  View Demos
                </button>
                <button onClick={() => setShowComingSoon(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm border border-white/10 text-slate-400">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalIn { from{opacity:0;transform:scale(0.95) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>
    </div>
  );
}