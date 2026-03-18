import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import ExportButton from '../components/ExportButton';
import { exportSeasonSimulation } from '../utils/exportPDF';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const I = ({ d, className = "w-5 h-5" }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>);
const TrendingUpIcon = (p) => <I {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const TrendingDownIcon = (p) => <I {...p} d={<><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>}/>;
const MinusIcon = (p) => <I {...p} d={<line x1="5" y1="12" x2="19" y2="12"/>}/>;
const LoaderIcon = (p) => <I {...p} d={<><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>}/>;
const AlertIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}/>;
const PlayIcon = (p) => <I {...p} d={<polygon points="5 3 19 12 5 21 5 3"/>}/>;
const BarChartIcon = (p) => <I {...p} d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}/>;
const CalendarIcon = (p) => <I {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
const ShieldIcon = (p) => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const AwardIcon = (p) => <I {...p} d={<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>}/>;
const RefreshIcon = (p) => <I {...p} d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>}/>;
const TargetIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const ZapIcon = (p) => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const LayersIcon = (p) => <I {...p} d={<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>}/>;

const LEAGUE_IMG = {
  'Premier League': 'https://media.api-sports.io/football/leagues/39.png',
  'La Liga': 'https://media.api-sports.io/football/leagues/140.png',
  'Bundesliga': 'https://media.api-sports.io/football/leagues/78.png',
  'Serie A': 'https://media.api-sports.io/football/leagues/135.png',
  'Ligue 1': 'https://media.api-sports.io/football/leagues/61.png',
  'Primeira Liga': 'https://media.api-sports.io/football/leagues/94.png',
};
const LEAGUES = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Primeira Liga'];

const ZONE = {
  champions_league: { grad: 'from-blue-500/10 to-blue-600/5', border: 'border-l-blue-500', label: 'UCL', color: 'text-blue-400', bg: 'bg-blue-500', dot: '#3b82f6' },
  europa_league: { grad: 'from-orange-500/10 to-amber-600/5', border: 'border-l-orange-500', label: 'UEL', color: 'text-orange-400', bg: 'bg-orange-500', dot: '#f97316' },
  relegation: { grad: 'from-red-500/10 to-red-600/5', border: 'border-l-red-500', label: 'REL', color: 'text-red-400', bg: 'bg-red-500', dot: '#ef4444' },
  mid_table: { grad: '', border: 'border-l-transparent', label: '', color: '', bg: '', dot: '#334155' },
};

function SeasonSimulatorPage({ onNavigate }) {
  const [selectedLeague, setSelectedLeague] = useState('Premier League');
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('table');
  const [expandedRow, setExpandedRow] = useState(null);

  const runSimulation = async (fresh = false) => {
    setLoading(true); setError(''); setSimulation(null); setExpandedRow(null);
    try {
      const url = `${API_BASE}/simulate/${encodeURIComponent(selectedLeague)}${fresh ? '?fresh=1' : ''}`;
      const resp = await fetch(url);
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.detail || 'Simulation failed'); }
      setSimulation(await resp.json());
    } catch (e) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const PosChange = ({ change }) => {
    if (change > 0) return <div className="flex items-center gap-0.5"><TrendingUpIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" /><span className="text-emerald-400 text-[10px] sm:text-[11px] font-black" style={{ fontFamily: 'JetBrains Mono' }}>+{change}</span></div>;
    if (change < 0) return <div className="flex items-center gap-0.5"><TrendingDownIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" /><span className="text-red-400 text-[10px] sm:text-[11px] font-black" style={{ fontFamily: 'JetBrains Mono' }}>{change}</span></div>;
    return <div className="flex items-center"><MinusIcon className="w-3 h-3 text-slate-600" /></div>;
  };

  const PointsBar = ({ current, simulated, max }) => {
    const pctCurrent = (current / max) * 100;
    const pctSim = (simulated / max) * 100;
    return (
      <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden flex">
        <div className="h-full bg-cyan-500/60 transition-all duration-1000" style={{ width: `${pctCurrent}%` }} />
        <div className="h-full bg-purple-500/80 transition-all duration-1000" style={{ width: `${pctSim}%` }} />
      </div>
    );
  };

  const champion = simulation?.predictedTable?.[0];
  const maxPts = champion?.points || 100;

  return (
    <div className="theme-page min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-purple-500/[0.04] rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-cyan-500/[0.03] rounded-full blur-[180px]" />
      </div>

      <NavBar currentPage="simulator" onNavigate={onNavigate} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-5 md:px-6 py-6 sm:py-8">

        {/* ═══ HEADER ═══ */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-purple-400 text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.2em]">ML-Powered Predictions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none mb-3">
            Season<br /><span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">Simulator</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md">Simulate every remaining fixture to predict final league standings using Poisson regression and Elo ratings.</p>
        </div>

        {/* ═══ LEAGUE SELECTOR — 3 cols mobile → 6 cols desktop ═══ */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 mb-5 sm:mb-6">
          {LEAGUES.map(l => (
            <button key={l} onClick={() => { setSelectedLeague(l); setSimulation(null); }}
              className={`relative p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all text-center group ${
                selectedLeague === l
                  ? 'bg-gradient-to-b from-purple-500/15 to-cyan-500/5 border-purple-500/30 shadow-lg shadow-purple-500/10'
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
              }`}>
              {LEAGUE_IMG[l] && <img src={LEAGUE_IMG[l]} alt="" className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-1.5 object-contain transition-all ${selectedLeague === l ? 'scale-110' : 'opacity-50 group-hover:opacity-80'}`} />}
              <p className={`text-[10px] sm:text-[12px] font-semibold leading-tight ${selectedLeague === l ? 'text-white' : 'text-slate-600'}`}>
                {l.replace(' League', '').replace('Premier', 'EPL')}
              </p>
              {selectedLeague === l && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full" />}
            </button>
          ))}
        </div>

        {/* ═══ RUN BUTTON ═══ */}
        <button onClick={runSimulation} disabled={loading}
          className="w-full py-3.5 sm:py-4 mb-6 sm:mb-8 rounded-2xl font-bold text-sm transition-all relative overflow-hidden group disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 50%, #8b5cf6 100%)', backgroundSize: '200% 200%' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-cyan-600/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-center gap-2">
            {loading ? <><LoaderIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />Simulating {selectedLeague.replace(' League','').replace('Premier','EPL')}…</> : <><PlayIcon className="w-4 h-4 sm:w-5 sm:h-5" />Simulate Season</>}
          </div>
          {loading && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
              <div className="h-full bg-white/30 rounded-full" style={{ animation: 'loadPulse 2s ease-in-out infinite', width: '60%' }} />
            </div>
          )}
        </button>

        {/* ═══ LOADING STATE ═══ */}
        {loading && (
          <div className="text-center py-10 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 relative">
              <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-cyan-500/20" />
              <div className="absolute inset-2 rounded-full border-2 border-cyan-500 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              <TargetIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-white font-bold text-sm">Running Poisson Simulation</p>
            <p className="text-slate-600 text-xs mt-1">Predicting all remaining matches...</p>
          </div>
        )}

        {/* ═══ ERROR ═══ */}
        {error && <div className="bg-red-500/10 rounded-2xl p-4 sm:p-5 mb-6 border border-red-500/20 flex items-start gap-3"><AlertIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mt-0.5 flex-shrink-0" /><div><p className="text-red-300 text-sm font-semibold">{error}</p><p className="text-red-400/50 text-xs mt-1">Try again or select a different league.</p></div></div>}

        {/* ═══ RESULTS ═══ */}
        {simulation && (
          <>
            {/* Champion Hero */}
            {champion && (
              <div className="relative mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl overflow-hidden" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent" />
                <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-yellow-500/5 rounded-full blur-[60px]" />
                <div className="relative border border-yellow-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <AwardIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                    <span className="text-yellow-400 text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.2em]">Predicted Champions</span>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex-shrink-0">
                      {LEAGUE_IMG[simulation.league] ? (
                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 sm:p-3">
                          <img src={LEAGUE_IMG[simulation.league]} alt="" className="w-full h-full object-contain" />
                        </div>
                      ) : <ShieldIcon className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-400/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1 truncate">{champion.team?.replace(/ FC$| AFC$| CF$| SC$/, '')}</h2>
                      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        <div><span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent" style={{ fontFamily: 'JetBrains Mono' }}>{champion.points}</span><span className="text-slate-500 text-xs ml-1">pts</span></div>
                        <div className="h-5 w-px bg-white/10 hidden sm:block" />
                        <div className="hidden sm:block"><span className="text-base sm:text-lg font-bold text-white" style={{ fontFamily: 'JetBrains Mono' }}>{champion.won}W {champion.drawn}D {champion.lost}L</span></div>
                        <div className="h-5 w-px bg-white/10 hidden sm:block" />
                        <div><span className={`text-base sm:text-lg font-bold ${champion.goalDifference > 0 ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontFamily: 'JetBrains Mono' }}>{champion.goalDifference > 0 ? '+' : ''}{champion.goalDifference}</span><span className="text-slate-500 text-xs ml-1">GD</span></div>
                      </div>
                      <div className="flex items-center gap-3 sm:hidden mt-1">
                        <span className="text-sm font-bold text-white" style={{ fontFamily: 'JetBrains Mono' }}>{champion.won}W {champion.drawn}D {champion.lost}L</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Stats — 2 cols mobile → 4 cols md */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6">
              {[
                { label: 'Matches Simulated', value: simulation.totalSimulated, icon: CalendarIcon, color: '#a855f7', gradient: 'from-purple-500/10 to-purple-600/5' },
                { label: 'Remaining Fixtures', value: simulation.totalRemaining, icon: LayersIcon, color: '#22d3ee', gradient: 'from-cyan-500/10 to-cyan-600/5' },
                { label: 'Title Race Gap', value: simulation.predictedTable?.length >= 2 ? `${simulation.predictedTable[0].points - simulation.predictedTable[1].points} pts` : '-', icon: ZapIcon, color: '#f59e0b', gradient: 'from-yellow-500/10 to-amber-600/5' },
                { label: 'Top Scorer (pts)', value: simulation.predictedTable?.[0]?.points || 0, icon: AwardIcon, color: '#10b981', gradient: 'from-emerald-500/10 to-emerald-600/5' },
              ].map((s, i) => (
                <div key={i} className={`bg-gradient-to-br ${s.gradient} rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/5 relative overflow-hidden`} style={{ animation: `fadeSlideIn 0.3s ease-out ${i * 0.08}s both` }}>
                  <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16" style={{ background: `radial-gradient(circle, ${s.color}10, transparent)` }} />
                  <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-1.5 sm:mb-2" style={{ color: s.color }} />
                  <p className="text-xl sm:text-2xl font-black text-white" style={{ fontFamily: 'JetBrains Mono' }}>{s.value}</p>
                  <p className="text-[10px] sm:text-[12px] text-slate-500 mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Tabs — scrollable on mobile */}
            <div className="flex gap-1 sm:gap-1.5 mb-4 sm:mb-5 bg-[#111827]/40 rounded-xl p-1 border border-white/5 overflow-x-auto">
              {[
                { id: 'table', label: 'Standings', shortLabel: 'Table', icon: BarChartIcon },
                { id: 'matches', label: `Matches (${simulation.totalSimulated})`, shortLabel: `Matches`, icon: CalendarIcon },
                { id: 'insights', label: 'Insights', shortLabel: 'Insights', icon: ZapIcon },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap min-w-0 px-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/10 text-white border border-purple-500/20'
                      : 'text-slate-500 hover:text-white'
                  }`}>
                  <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              ))}
            </div>

            {/* ═══ STANDINGS TABLE ═══ */}
            {activeTab === 'table' && (
              <div className="rounded-2xl overflow-hidden border border-white/5" style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
                <div className="bg-gradient-to-r from-purple-500/8 to-cyan-500/5 px-3 sm:px-5 py-3 sm:py-4 border-b border-white/5 flex items-center gap-2 sm:gap-3 flex-wrap">
                  {LEAGUE_IMG[simulation.league] && <img src={LEAGUE_IMG[simulation.league]} alt="" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />}
                  <h2 className="text-white font-bold text-xs sm:text-sm flex-1 min-w-0 truncate">{simulation.league} — Predicted Table</h2>
                  <span className="text-[11px] sm:text-[12px] text-slate-600 hidden sm:block">2025/26</span>
                  <button onClick={() => { setSimulation(null); setTimeout(runSimulation, 100); }}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-[12px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all">
                    <RefreshIcon className="w-3 h-3" /> Re-run
                  </button>
                  {simulation && <ExportButton label="PDF" onClick={() => exportSeasonSimulation(simulation)} />}
                </div>

                {/* Table header — mobile hides D column */}
                <div className="grid px-3 sm:px-5 py-2 bg-white/[0.02] text-[8px] sm:text-[9px] text-slate-600 uppercase tracking-[0.12em] font-bold border-b border-white/5"
                  style={{ gridTemplateColumns: '28px 1fr 28px 28px 28px 28px 36px 40px' }}>
                  <div className="text-center">#</div>
                  <div>Team</div>
                  <div className="text-center">P</div>
                  <div className="text-center">W</div>
                  <div className="text-center hidden sm:block">D</div>
                  <div className="text-center">L</div>
                  <div className="text-center hidden sm:block">GD</div>
                  <div className="text-center">Pts</div>
                </div>

                {simulation.predictedTable.map((team, idx) => {
                  const z = ZONE[team.zone] || ZONE.mid_table;
                  const isExpanded = expandedRow === idx;
                  const isChampion = idx === 0;
                  const isTop4 = idx < (simulation.config?.cl || 4);
                  const isRel = idx >= simulation.predictedTable.length - (simulation.config?.relegation || 3);

                  return (
                    <div key={idx} style={{ animation: `fadeSlideIn 0.2s ease-out ${idx * 0.025}s both` }}>
                      <div
                        onClick={() => setExpandedRow(isExpanded ? null : idx)}
                        className={`grid px-3 sm:px-5 py-2.5 sm:py-3 items-center cursor-pointer transition-all border-l-[3px] ${z.border} ${
                          isChampion ? 'bg-gradient-to-r from-yellow-500/[0.06] to-transparent' : ''
                        } hover:bg-white/[0.03]`}
                        style={{ gridTemplateColumns: '28px 1fr 28px 28px 28px 28px 36px 40px' }}>

                        {/* Position */}
                        <div className="text-center">
                          {isChampion ? (
                            <div className="w-5 h-5 sm:w-7 sm:h-7 mx-auto rounded-md sm:rounded-lg bg-gradient-to-br from-yellow-500 to-amber-400 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                              <span className="text-[10px] sm:text-[12px] font-black text-white">1</span>
                            </div>
                          ) : (
                            <span className={`text-[11px] sm:text-xs font-black ${isTop4 ? 'text-blue-400' : isRel ? 'text-red-400' : 'text-slate-500'}`} style={{ fontFamily: 'JetBrains Mono' }}>
                              {team.predictedPosition}
                            </span>
                          )}
                        </div>

                        {/* Team */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[11px] sm:text-xs font-semibold truncate ${isChampion ? 'text-yellow-100' : 'text-white'}`}>
                            {team.team?.replace(/ FC$| AFC$| CF$| SC$/, '')}
                          </span>
                          {z.label && <span className={`text-[7px] font-bold px-1 py-0.5 rounded hidden sm:inline ${z.color} border border-current/20`} style={{ backgroundColor: z.dot + '15' }}>{z.label}</span>}
                        </div>

                        {/* Stats */}
                        <div className="text-center text-[11px] sm:text-xs text-slate-400" style={{ fontFamily: 'JetBrains Mono' }}>{team.played}</div>
                        <div className="text-center text-[11px] sm:text-xs text-emerald-400/70" style={{ fontFamily: 'JetBrains Mono' }}>{team.won}</div>
                        <div className="text-center text-[11px] sm:text-xs text-yellow-400/60 hidden sm:block" style={{ fontFamily: 'JetBrains Mono' }}>{team.drawn}</div>
                        <div className="text-center text-[11px] sm:text-xs text-red-400/60" style={{ fontFamily: 'JetBrains Mono' }}>{team.lost}</div>
                        <div className="text-center text-[11px] sm:text-xs font-bold hidden sm:block" style={{ fontFamily: 'JetBrains Mono', color: team.goalDifference > 0 ? '#10b981' : team.goalDifference < 0 ? '#ef4444' : '#475569' }}>
                          {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                        </div>
                        <div className="text-center">
                          <span className="text-xs sm:text-sm font-black text-white" style={{ fontFamily: 'JetBrains Mono' }}>{team.points}</span>
                        </div>
                      </div>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div className="px-3 sm:px-5 py-3 sm:py-4 bg-white/[0.02] border-t border-white/[0.03]" style={{ animation: 'fadeSlideIn 0.2s ease-out' }}>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            <div className="bg-white/[0.03] rounded-xl p-2.5 sm:p-3">
                              <p className="text-[10px] sm:text-[11px] text-slate-600 uppercase tracking-widest mb-1">Current</p>
                              <p className="text-xs text-slate-400">{team.currentPlayed}P · {team.currentPoints}pts · #{team.currentPosition}</p>
                            </div>
                            <div className="bg-purple-500/5 rounded-xl p-2.5 sm:p-3 border border-purple-500/10">
                              <p className="text-[10px] sm:text-[11px] text-purple-400 uppercase tracking-widest mb-1">Simulated</p>
                              <p className="text-xs text-white font-bold">+{team.simWins}W +{team.simDraws}D +{team.simLosses}L</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-2.5 sm:p-3">
                              <p className="text-[10px] sm:text-[11px] text-slate-600 uppercase tracking-widest mb-1">Points Gained</p>
                              <p className="text-sm font-black text-purple-400" style={{ fontFamily: 'JetBrains Mono' }}>+{team.simPoints}</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-2.5 sm:p-3">
                              <p className="text-[10px] sm:text-[11px] text-slate-600 uppercase tracking-widest mb-1">Goals</p>
                              <p className="text-xs"><span className="text-emerald-400 font-bold">{team.goalsFor}</span> scored · <span className="text-red-400 font-bold">{team.goalsAgainst}</span> conceded</p>
                            </div>
                          </div>
                          <div className="mt-2.5 sm:mt-3">
                            <PointsBar current={team.currentPoints} simulated={team.simPoints} max={maxPts} />
                            <div className="flex justify-between mt-1">
                              <span className="text-[11px] text-cyan-400/60">Current: {team.currentPoints}</span>
                              <span className="text-[11px] text-purple-400/60">+{team.simPoints} simulated</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Legend */}
                <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-white/5 flex flex-wrap gap-2 sm:gap-4 bg-white/[0.01]">
                  {[
                    { color: 'bg-blue-500', label: 'Champions League' },
                    { color: 'bg-orange-500', label: 'Europa League' },
                    { color: 'bg-red-500', label: 'Relegation' },
                  ].map((z, i) => (
                    <div key={i} className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-sm ${z.color}`} /><span className="text-[11px] sm:text-[12px] text-slate-500">{z.label}</span></div>
                  ))}
                  <span className="text-[11px] sm:text-[12px] text-slate-600 ml-auto hidden sm:block">Click a row for details</span>
                </div>
              </div>
            )}

            {/* ═══ SIMULATED MATCHES ═══ */}
            {activeTab === 'matches' && (
              <div className="rounded-2xl overflow-hidden border border-white/5" style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
                <div className="max-h-[500px] sm:max-h-[650px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {simulation.simulatedMatches.map((m, i) => {
                    const isH = m.predictedResult === 'H', isA = m.predictedResult === 'A', isD = m.predictedResult === 'D';
                    return (
                      <div key={i} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-all"
                        style={{ animation: `fadeSlideIn 0.15s ease-out ${Math.min(i * 0.02, 0.5)}s both` }}>
                        <span className="text-[8px] text-slate-700 w-8 sm:w-12 truncate flex-shrink-0 hidden xs:block" style={{ fontFamily: 'JetBrains Mono' }}>{m.round?.replace('Regular Season - ', 'GW ')}</span>
                        <div className="flex-1 text-right min-w-0"><span className={`text-[10px] sm:text-[11px] font-semibold truncate ${isH ? 'text-white' : 'text-slate-500'}`}>{m.homeTeam?.replace(/ FC$| AFC$| CF$/, '')}</span></div>
                        <div className="w-14 sm:w-20 flex-shrink-0 text-center">
                          <div className="flex items-center justify-center gap-0.5 mb-0.5">
                            <span className={`text-[8px] font-bold ${isH ? 'text-cyan-400' : 'text-slate-700'}`}>{m.homeWinProb ? (m.homeWinProb * 100).toFixed(0) : '?'}%</span>
                            <span className={`text-[8px] font-bold ${isD ? 'text-yellow-400' : 'text-slate-700'} hidden sm:inline`}>{m.drawProb ? (m.drawProb * 100).toFixed(0) : '?'}%</span>
                            <span className={`text-[8px] font-bold ${isA ? 'text-purple-400' : 'text-slate-700'}`}>{m.awayWinProb ? (m.awayWinProb * 100).toFixed(0) : '?'}%</span>
                          </div>
                          <span className="text-xs font-black text-white" style={{ fontFamily: 'JetBrains Mono' }}>{m.predictedScore}</span>
                        </div>
                        <div className="flex-1 text-left min-w-0"><span className={`text-[10px] sm:text-[11px] font-semibold truncate ${isA ? 'text-white' : 'text-slate-500'}`}>{m.awayTeam?.replace(/ FC$| AFC$| CF$/, '')}</span></div>
                        <span className={`text-[8px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                          isH ? 'bg-cyan-500/15 text-cyan-400' : isA ? 'bg-purple-500/15 text-purple-400' : 'bg-yellow-500/15 text-yellow-400'
                        }`}>{m.predictedResult}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ INSIGHTS ═══ */}
            {activeTab === 'insights' && (
              <div className="space-y-3 sm:space-y-4" style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="rounded-2xl border border-emerald-500/10 overflow-hidden">
                    <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-emerald-500/5 border-b border-emerald-500/10 flex items-center gap-2">
                      <TrendingUpIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /><h3 className="text-white font-bold text-xs">Biggest Climbers</h3>
                    </div>
                    <div className="divide-y divide-white/[0.03]">
                      {[...simulation.predictedTable].sort((a, b) => b.positionChange - a.positionChange).slice(0, 5).map((t, i) => (
                        <div key={i} className="flex items-center justify-between px-4 sm:px-5 py-2 sm:py-2.5">
                          <span className="text-xs text-white font-medium truncate flex-1 mr-2">{t.team?.replace(/ FC$| AFC$| CF$/, '')}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[11px] sm:text-[12px] text-slate-600" style={{ fontFamily: 'JetBrains Mono' }}>{t.currentPosition}→{t.predictedPosition}</span>
                            <PosChange change={t.positionChange} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-red-500/10 overflow-hidden">
                    <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-red-500/5 border-b border-red-500/10 flex items-center gap-2">
                      <TrendingDownIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" /><h3 className="text-white font-bold text-xs">Biggest Fallers</h3>
                    </div>
                    <div className="divide-y divide-white/[0.03]">
                      {[...simulation.predictedTable].sort((a, b) => a.positionChange - b.positionChange).slice(0, 5).map((t, i) => (
                        <div key={i} className="flex items-center justify-between px-4 sm:px-5 py-2 sm:py-2.5">
                          <span className="text-xs text-white font-medium truncate flex-1 mr-2">{t.team?.replace(/ FC$| AFC$| CF$/, '')}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[11px] sm:text-[12px] text-slate-600" style={{ fontFamily: 'JetBrains Mono' }}>{t.currentPosition}→{t.predictedPosition}</span>
                            <PosChange change={t.positionChange} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Points Distribution */}
                <div className="rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white/[0.02] border-b border-white/5 flex items-center gap-2 flex-wrap">
                    <BarChartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" /><h3 className="text-white font-bold text-xs">Points Distribution</h3>
                    <div className="ml-auto flex items-center gap-3 text-[10px] sm:text-[11px]">
                      <span className="flex items-center gap-1"><div className="w-2 h-1 bg-cyan-500/60 rounded" />Current</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-1 bg-purple-500 rounded" />Simulated</span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 space-y-2">
                    {simulation.predictedTable.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 sm:gap-3">
                        <span className="text-[11px] sm:text-[12px] text-slate-500 w-4 text-right flex-shrink-0" style={{ fontFamily: 'JetBrains Mono' }}>{t.predictedPosition}</span>
                        <span className="text-[11px] sm:text-[12px] text-slate-400 w-20 sm:w-24 truncate flex-shrink-0">{t.team?.replace(/ FC$| AFC$| CF$/, '')}</span>
                        <div className="flex-1"><PointsBar current={t.currentPoints} simulated={t.simPoints} max={maxPts} /></div>
                        <span className="text-[11px] sm:text-[12px] font-bold text-white w-6 sm:w-8 text-right flex-shrink-0" style={{ fontFamily: 'JetBrains Mono' }}>{t.points}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Relegation Battle */}
                <div className="rounded-2xl border border-red-500/10 p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" /><h3 className="text-white font-bold text-xs">Relegation Battle</h3>
                  </div>
                  <div className="space-y-2">
                    {simulation.predictedTable.slice(-(simulation.config?.relegation || 3) - 2).map((t, i) => {
                      const isRel = t.zone === 'relegation';
                      return (
                        <div key={i} className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl ${isRel ? 'bg-red-500/8 border border-red-500/15' : 'bg-white/[0.02]'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-xs font-black flex-shrink-0 ${isRel ? 'text-red-400' : 'text-slate-400'}`} style={{ fontFamily: 'JetBrains Mono' }}>{t.predictedPosition}</span>
                            <span className={`text-xs font-semibold truncate ${isRel ? 'text-red-200' : 'text-slate-300'}`}>{t.team?.replace(/ FC$| AFC$| CF$/, '')}</span>
                            {isRel && <span className="text-[7px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded flex-shrink-0">REL</span>}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <span className="text-sm font-black text-white" style={{ fontFamily: 'JetBrains Mono' }}>{t.points}</span>
                            <PosChange change={t.positionChange} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!simulation && !loading && !error && (
          <div className="text-center py-12 sm:py-16">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 sm:mb-6 relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 to-cyan-500/5 border border-white/5" />
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400/30" />
              </div>
            </div>
            <h2 className="text-white font-bold text-base sm:text-lg mb-2">Ready to Simulate</h2>
            <p className="text-slate-500 text-xs sm:text-sm mb-1 max-w-sm mx-auto">Select a league above and hit Run to predict the final standings using Poisson regression.</p>
            <p className="text-slate-700 text-xs">Each run produces unique results based on weighted randomness.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes loadPulse{0%{transform:translateX(-100%);}50%{transform:translateX(60%);}100%{transform:translateX(200%);}}
      `}</style>
    </div>
  );
}

export default SeasonSimulatorPage;