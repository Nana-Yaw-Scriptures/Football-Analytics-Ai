import React, { useState, useEffect, useCallback } from 'react';
import NavBar from '../components/NavBar';
import jsPDF from 'jspdf';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const I = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const ZapIcon      = p => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const DownloadIcon = p => <I {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}/>;
const RefreshIcon  = p => <I {...p} d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>}/>;
const ShieldIcon   = p => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const TrophyIcon   = p => <I {...p} d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>}/>;
const StarIcon     = p => <I {...p} d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>;
const TargetIcon   = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const CalendarIcon = p => <I {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;

const LEAGUES = [
  { name: 'Premier League',  short: 'EPL',        color: '#22d3ee', logo: 'https://media.api-sports.io/football/leagues/39.png'  },
  { name: 'La Liga',         short: 'La Liga',    color: '#dc2626', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { name: 'Bundesliga',      short: 'BL',         color: '#ef4444', logo: 'https://media.api-sports.io/football/leagues/78.png'  },
  { name: 'Serie A',         short: 'Serie A',    color: '#a855f7', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { name: 'Ligue 1',         short: 'Ligue 1',    color: '#10b981', logo: 'https://media.api-sports.io/football/leagues/61.png'  },
  { name: 'Primeira Liga',   short: 'Liga Port.', color: '#f59e0b', logo: 'https://media.api-sports.io/football/leagues/94.png'  },
];

const CONFIDENCE_LABEL = pct =>
  pct >= 75 ? { label: 'Very High', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' } :
  pct >= 65 ? { label: 'High',      color: '#22d3ee', bg: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.25)' } :
  pct >= 55 ? { label: 'Medium',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' } :
              { label: 'Low',       color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)'  };

const cleanName = n => n
  .replace(/^FC\s+/i, '').replace(/\s+FC$/i, '')
  .replace(/^AFC\s+/i,'').replace(/\s+AFC$/i,'')
  .replace(/\s+CF$/i, '').replace(/\s+SC$/i, '')
  .trim();

function exportBestPicksPDF(picks, date) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const w   = doc.internal.pageSize.getWidth();
  const BG=[10,14,26],CARD=[17,24,39],CYAN=[34,211,238],PURPLE=[168,85,247],
        EMERALD=[16,185,129],AMBER=[245,158,11],WHITE=[255,255,255],
        S400=[148,163,184],S500=[100,116,139],S600=[71,85,105],S700=[51,65,85];
  const addPage=()=>{doc.addPage();doc.setFillColor(...BG);doc.rect(0,0,w,297,'F');};
  doc.setFillColor(...BG);doc.rect(0,0,w,297,'F');
  doc.setFillColor(...CYAN);doc.rect(0,0,w,2,'F');
  doc.setFillColor(...CARD);doc.rect(0,2,w,38,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...CYAN);
  doc.text('SCORINA AI',15,14);
  doc.setFontSize(7);doc.setTextColor(...S500);
  doc.text('Powered by Poisson v2.1 + ML Model',15,20);
  doc.text(new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}),w-15,14,{align:'right'});
  doc.setFontSize(28);doc.setTextColor(...WHITE);doc.text('Best Picks',15,65);
  doc.setFontSize(13);doc.setTextColor(...CYAN);doc.text('Daily Predictions Report',15,76);
  doc.setDrawColor(...CYAN);doc.setLineWidth(0.5);doc.line(15,80,100,80);
  const flat=Object.values(picks).flat();
  const tp=flat.length,ac=tp>0?Math.round(flat.reduce((s,p)=>s+p.topProb,0)/tp):0,hc=flat.filter(p=>p.topProb>=70).length;
  [{label:'Total Picks',value:String(tp),color:CYAN},{label:'Avg Confidence',value:`${ac}%`,color:EMERALD},
   {label:'High Conf (70%+)',value:String(hc),color:AMBER},{label:'Leagues',value:String(Object.keys(picks).length),color:PURPLE}
  ].forEach((s,i)=>{
    const sx=15+i*46;doc.setFillColor(...CARD);doc.roundedRect(sx,92,42,22,2,2,'F');
    doc.setFontSize(14);doc.setFont('helvetica','bold');doc.setTextColor(...s.color);doc.text(s.value,sx+21,103,{align:'center'});
    doc.setFontSize(6);doc.setTextColor(...S500);doc.text(s.label,sx+21,110,{align:'center'});
  });
  doc.setFontSize(7);doc.setTextColor(...S600);
  doc.text('These predictions are generated by AI models for informational purposes only.',w/2,130,{align:'center',maxWidth:w-30});
  let y=15,isFirst=true;
  Object.entries(picks).forEach(([lgName,lgPicks])=>{
    if(!lgPicks.length)return;
    const lg=LEAGUES.find(l=>l.name===lgName);
    const lc=lg?lg.color:'#22d3ee';
    const lcA=lc==='#22d3ee'?CYAN:lc==='#f59e0b'?AMBER:lc==='#ef4444'?[239,68,68]:lc==='#a855f7'?PURPLE:lc==='#10b981'?EMERALD:CYAN;
    if(isFirst){addPage();isFirst=false;}else if(y>220){addPage();y=15;}
    doc.setFillColor(...lcA);doc.rect(15,y,3,10,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(...WHITE);doc.text(lgName,22,y+7);
    doc.setFontSize(7);doc.setTextColor(...S500);doc.text(`${lgPicks.length} picks`,w-15,y+7,{align:'right'});
    y+=16;
    lgPicks.forEach((pick,idx)=>{
      if(y+38>280){addPage();y=15;}
      const cf=CONFIDENCE_LABEL(pick.topProb);
      const cfA=cf.color==='#10b981'?EMERALD:cf.color==='#22d3ee'?CYAN:cf.color==='#f59e0b'?AMBER:[239,68,68];
      // Card background
      doc.setFillColor(...CARD);doc.roundedRect(15,y,w-30,34,2,2,'F');
      // Left accent bar
      doc.setFillColor(...lcA);doc.rect(15,y,2,34,'F');
      // Rank badge
      doc.setFillColor(...lcA);doc.circle(25,y+17,6,'F');
      doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...BG);doc.text(String(idx+1),25,y+19.5,{align:'center'});
      // Home team
      doc.setFont('helvetica','bold');doc.setFontSize(10);
      if(pick.isHomeWin){doc.setTextColor(255,255,255);}else{doc.setTextColor(100,116,139);}
      doc.text((pick.homeTeam||'').replace(/ FC$| AFC$/i,'').substring(0,22),35,y+12);
      // vs
      doc.setFontSize(7);doc.setTextColor(...S500);doc.text('vs',35,y+18);
      // Away team
      doc.setFont('helvetica','bold');doc.setFontSize(10);
      if(!pick.isHomeWin){doc.setTextColor(255,255,255);}else{doc.setTextColor(100,116,139);}
      doc.text((pick.awayTeam||'').replace(/ FC$| AFC$/i,'').substring(0,22),35,y+26);
      // Date center
      doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...S500);
      const d=pick.date?new Date(pick.date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}):'—';
      doc.text(d,w/2,y+32,{align:'center'});
      // Winner name
      doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...cfA);
      doc.text((pick.winner||'').substring(0,18),w-17,y+10,{align:'right'});
      // Confidence label
      doc.setFontSize(8);doc.setTextColor(...cfA);
      doc.text(`${cf.label} · ${pick.topProb}%`,w-17,y+20,{align:'right'});
      // Score
      doc.setFontSize(7);doc.setTextColor(...S400);doc.text(`Pred: ${pick.score}`,w-17,y+30,{align:'right'});
      // Confidence bar
      const bx=w-62,by2=y+24,bw=44,bh=3;
      doc.setFillColor(...S700);doc.roundedRect(bx,by2,bw,bh,1,1,'F');
      doc.setFillColor(...cfA);doc.roundedRect(bx,by2,bw*(pick.topProb/100),bh,1,1,'F');
      y+=38;
    });
    y+=6;
  });
  const pages=doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){
    doc.setPage(i);doc.setFillColor(...CARD);doc.rect(0,285,w,12,'F');
    doc.setFontSize(7);doc.setTextColor(...S600);
    doc.text('Scorina AI — Best Picks Report',15,291);
    doc.text(`Page ${i} of ${pages}`,w-15,291,{align:'right'});
  }
  doc.save(`BestPicks_${date}.pdf`);
}

export default function BestPicksPage({ onNavigate }) {
  const [picks, setPicks]         = useState({});
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [generated, setGenerated] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [throttled,    setThrottled]    = useState(false);
  const [activeLeague, setActiveLeague] = useState('all');

  const today    = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fileDate = new Date().toISOString().slice(0, 10);

  const loadPicks = useCallback(async (forceRefresh = false) => {
    setLoading(true); setError('');
    try {
      const url = `${API_BASE}/best-picks${forceRefresh ? '?refresh=true' : ''}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to load picks');
      const data = await resp.json();
      setPicks(data.picks || {});
      setRegenerating(data.regenerating || false);
      setThrottled(data.throttled || false);
      if (data.generated_at) {
        setGenerated(new Date(data.generated_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      setError('Could not load best picks. Please try again.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPicks();
    // Auto-check every 30s — use ref to avoid stale closure on totalPicks
    const interval = setInterval(() => {
      setPicks(prev => {
        const count = Object.values(prev).flat().length;
        if (count === 0) loadPicks();
        return prev;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [loadPicks]);

  const handleRefresh = async () => {
    if (regenerating) return; // already running — don't fire duplicate
    await loadPicks(true);
  };

  const totalPicks    = Object.values(picks).flat().length;
  const avgConf       = totalPicks > 0 ? Math.round(Object.values(picks).flat().reduce((s, p) => s + p.topProb, 0) / totalPicks) : 0;
  const highConfPicks = Object.values(picks).flat().filter(p => p.topProb >= 70).length;
  const visibleLeagues = activeLeague === 'all'
    ? LEAGUES.filter(l => picks[l.name]?.length > 0)
    : LEAGUES.filter(l => l.name === activeLeague && picks[l.name]?.length > 0);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#060a14 0%,#080c18 50%,#06090f 100%)' }}>
      <NavBar currentPage="bestpicks" onNavigate={onNavigate}/>
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-24">

        {/* Hero */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 p-8"
          style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.08),rgba(168,85,247,0.04),transparent)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px]" style={{ background: 'rgba(34,211,238,0.06)' }}/>
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-[60px]" style={{ background: 'rgba(168,85,247,0.06)' }}/>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)' }}>
                <ZapIcon className="w-5 h-5 text-cyan-400"/>
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Best Picks</h1>
                <p className="text-cyan-400 text-sm font-semibold uppercase tracking-widest">Daily Prediction Report</p>
              </div>
              {generated && (
                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                  Generated {generated}
                  {regenerating && <span className="text-amber-400 ml-1">· Updating…</span>}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
              <CalendarIcon className="w-4 h-4"/>
              <span>{today}</span>
            </div>
            {totalPicks > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Picks',      value: totalPicks,                      color: '#22d3ee', icon: <TargetIcon className="w-4 h-4"/> },
                  { label: 'Avg Confidence',   value: `${avgConf}%`,                   color: '#10b981', icon: <TrophyIcon className="w-4 h-4"/> },
                  { label: 'High Conf (70%+)', value: highConfPicks,                   color: '#f59e0b', icon: <StarIcon className="w-4 h-4"/>   },
                  { label: 'Leagues Covered',  value: `${visibleLeagues.length} / 6`, color: '#a855f7', icon: <ShieldIcon className="w-4 h-4"/> },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl p-4 border border-white/8 relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg,${s.color}10,rgba(10,14,26,0.9))` }}>
                    <div className="flex items-center gap-2 mb-1" style={{ color: s.color }}>
                      {s.icon}<span className="text-xs uppercase tracking-widest font-bold">{s.label}</span>
                    </div>
                    <p className="text-2xl font-black text-white">{s.value}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button onClick={handleRefresh} disabled={loading || regenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee', opacity: (loading || regenerating) ? 0.5 : 1 }}>
                <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
                {loading ? 'Loading…' : regenerating ? 'Updating…' : 'Refresh Picks'}
              </button>
              {throttled && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                  ⏳ Refresh available in ~6h
                </div>
              )}
              {totalPicks > 0 && (
                <button onClick={() => exportBestPicksPDF(picks, fileDate)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#22d3ee,#0e7490)', color: '#000' }}>
                  <DownloadIcon className="w-4 h-4"/>
                  Download PDF
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mb-6 rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(17,24,39,0.8)' }}>
            <div className="px-5 py-6 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin flex-shrink-0"/>
              <div>
                <p className="text-white font-bold text-sm">Loading Best Picks</p>
                <p className="text-slate-400 text-xs mt-1">Fetching predictions across 6 leagues…</p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl p-4 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.06)' }}>
            <p className="text-red-400 font-semibold">{error}</p>
          </div>
        )}

        {/* League tabs */}
        {totalPicks > 0 && !loading && (
          <div className="flex gap-2 flex-wrap mb-6">
            <button onClick={() => setActiveLeague('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${activeLeague === 'all' ? 'border-cyan-500/40 text-cyan-400' : 'border-white/10 text-slate-400'}`}
              style={{ background: activeLeague === 'all' ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.03)' }}>
              All Leagues
            </button>
            {LEAGUES.filter(l => picks[l.name]?.length > 0).map(lg => (
              <button key={lg.name} onClick={() => setActiveLeague(lg.name)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border"
                style={{
                  borderColor: activeLeague === lg.name ? `${lg.color}40` : 'rgba(255,255,255,0.1)',
                  color:       activeLeague === lg.name ? lg.color : '#64748b',
                  background:  activeLeague === lg.name ? `${lg.color}10` : 'rgba(255,255,255,0.03)',
                }}>
                <img src={lg.logo} alt="" className="w-4 h-4 object-contain"/>
                {lg.short}
              </button>
            ))}
          </div>
        )}

        {/* Picks */}
        {!loading && totalPicks > 0 && visibleLeagues.map(lg => {
          const leaguePicks = picks[lg.name] || [];
          if (!leaguePicks.length) return null;
          return (
            <div key={lg.name} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <img src={lg.logo} alt={lg.name} className="w-7 h-7 object-contain"/>
                <h2 className="text-white font-black text-lg">{lg.name}</h2>
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg,${lg.color}30,transparent)` }}/>
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ color: lg.color, background: `${lg.color}12`, border: `1px solid ${lg.color}25` }}>
                  {leaguePicks.length} picks
                </span>
              </div>
              <div className="space-y-3">
                {leaguePicks.map((pick, idx) => {
                  const conf = CONFIDENCE_LABEL(pick.topProb);
                  return (
                    <div key={idx} className="relative rounded-2xl border overflow-hidden transition-all hover:scale-[1.005]"
                      style={{
                        borderColor: idx === 0 ? `${lg.color}35` : 'rgba(255,255,255,0.08)',
                        background:  idx === 0 ? `linear-gradient(135deg,${lg.color}08,rgba(10,14,26,0.95))` : 'rgba(17,24,39,0.7)',
                      }}>
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                        style={{ background: idx === 0 ? `linear-gradient(180deg,${lg.color},${lg.color}60)` : 'rgba(255,255,255,0.06)' }}/>
                      <div className="ml-1 px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                            style={{ background: idx === 0 ? `${lg.color}20` : 'rgba(255,255,255,0.05)', color: idx === 0 ? lg.color : '#64748b' }}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {pick.homeCrest && <img src={pick.homeCrest} alt="" className="w-7 h-7 object-contain flex-shrink-0" onError={e=>e.target.style.display='none'}/>}
                                <span className={`font-bold text-sm truncate ${pick.isDraw ? 'text-amber-400' : pick.isHomeWin ? 'text-white' : 'text-slate-400'}`}>{cleanName(pick.homeTeam)}</span>
                                {pick.isHomeWin && !pick.isDraw && <ZapIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: lg.color }}/>}
                              </div>
                              <span className="text-slate-600 text-xs font-bold flex-shrink-0">{pick.isDraw ? '≈' : 'vs'}</span>
                              <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
                                {pick.awayCrest && <img src={pick.awayCrest} alt="" className="w-7 h-7 object-contain flex-shrink-0" onError={e=>e.target.style.display='none'}/>}
                                <span className={`font-bold text-sm truncate text-right ${pick.isDraw ? 'text-amber-400' : !pick.isHomeWin ? 'text-white' : 'text-slate-400'}`}>{cleanName(pick.awayTeam)}</span>
                                {!pick.isHomeWin && !pick.isDraw && <ZapIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: lg.color }}/>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <CalendarIcon className="w-3 h-3"/>
                              <span>{pick.date ? new Date(pick.date).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</span>
                              <span className="text-slate-700">·</span>
                              <span className="font-bold text-slate-400">Pred: {pick.score}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right min-w-[120px]">
                            {/* Confidence % — always on top */}
                            <div className="text-2xl font-black mb-1" style={{ color: conf.color, fontFamily: 'monospace' }}>
                              {pick.topProb}%
                            </div>
                            {/* Confidence label */}
                            <div className="flex justify-end mb-1">
                              <span className="text-xs font-black px-3 py-1 rounded-full"
                                style={{ background: conf.bg, border: `1px solid ${conf.border}`, color: conf.color }}>
                                {conf.label}
                              </span>
                            </div>
                            {/* Top Pick badge — only for #1 */}
                            {idx === 0 && (
                              <div className="flex justify-end mb-1">
                                <span className="flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full"
                                  style={{ background: `${lg.color}15`, border: `1px solid ${lg.color}35`, color: lg.color }}>
                                  <TrophyIcon className="w-3 h-3"/>Top Pick
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs justify-end">
                              <span className="text-cyan-400 font-bold w-6 text-right">{pick.homeWin}%</span>
                              <div className="flex h-1.5 w-20 rounded-full overflow-hidden bg-white/5">
                                <div className="h-full bg-cyan-500 rounded-l-full" style={{ width: `${pick.homeWin}%` }}/>
                                <div className="h-full bg-amber-500" style={{ width: `${pick.draw}%` }}/>
                                <div className="h-full bg-purple-500 rounded-r-full" style={{ width: `${pick.awayWin}%` }}/>
                              </div>
                              <span className="text-purple-400 font-bold w-6">{pick.awayWin}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {!loading && totalPicks === 0 && !error && (
          <div className="text-center py-20 rounded-3xl border border-white/8" style={{ background: 'rgba(17,24,39,0.5)' }}>
            <ZapIcon className="w-12 h-12 mx-auto mb-4 text-slate-600"/>
            <h3 className="text-white font-bold text-xl mb-2">Generating picks…</h3>
            <p className="text-slate-400 mb-6">The backend is running predictions. This takes about 60 seconds on first load. Please wait and refresh.</p>
            <button onClick={handleRefresh}
              className="px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee' }}>
              Check Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}