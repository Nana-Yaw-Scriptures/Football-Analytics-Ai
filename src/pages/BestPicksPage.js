import React, { useState, useEffect, useCallback, useRef } from 'react';
import NavBar from '../components/NavBar';
import { predictMatch } from '../services/api';
import jsPDF from 'jspdf';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ── Icons ────────────────────────────────────────────────────────────
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

// ── League config ────────────────────────────────────────────────────
const LEAGUES = [
  { name: 'Premier League',  short: 'EPL',        color: '#22d3ee', logo: 'https://media.api-sports.io/football/leagues/39.png'  },
  { name: 'La Liga',         short: 'La Liga',    color: '#f59e0b', logo: 'https://media.api-sports.io/football/leagues/140.png' },
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

// ── Clean team name for prediction engine ────────────────────────────
const cleanName = n => {
  const aliases = {
    'bayern münchen': 'Bayern Munich',
    'paris saint germain': 'Paris Saint-Germain',
    'borussia mönchengladbach': 'Borussia Monchengladbach',
    'atletico madrid': 'Atletico Madrid',
    'sporting cp': 'Sporting CP',
    'fsv mainz 05': 'Mainz',
    '1. fc köln': 'Köln',
    '1. fc heidenheim': 'Heidenheim',
    'stade brestois 29': 'Brest',
  };
  const cleaned = n
    .replace(/^FC\s+/i, '').replace(/\s+FC$/i, '')
    .replace(/^AFC\s+/i,'').replace(/\s+AFC$/i,'')
    .replace(/\s+CF$/i, '').replace(/\s+SC$/i, '')
    .trim();
  return aliases[cleaned.toLowerCase()] || cleaned;
};

// ── PDF Export ───────────────────────────────────────────────────────
function exportBestPicksPDF(picks, date) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const w   = doc.internal.pageSize.getWidth();
  const BG  = [10, 14, 26], CARD = [17, 24, 39], CYAN = [34, 211, 238],
        PURPLE = [168, 85, 247], EMERALD = [16, 185, 129], AMBER = [245, 158, 11],
        WHITE = [255, 255, 255], S300 = [203, 213, 225], S400 = [148, 163, 184],
        S500 = [100, 116, 139], S600 = [71, 85, 105], S700 = [51, 65, 85];

  const addPage = () => {
    doc.addPage();
    doc.setFillColor(...BG);
    doc.rect(0, 0, w, 297, 'F');
  };

  // ── Cover page ──
  doc.setFillColor(...BG);
  doc.rect(0, 0, w, 297, 'F');

  // Top accent bar
  doc.setFillColor(...CYAN);
  doc.rect(0, 0, w, 2, 'F');

  // Header
  doc.setFillColor(...CARD);
  doc.rect(0, 2, w, 38, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...CYAN);
  doc.text('FOOTBALL ANALYST AI', 15, 14);

  doc.setFontSize(7);
  doc.setTextColor(...S500);
  doc.text('Powered by Poisson v2.1 + ML Model', 15, 20);
  doc.text(new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), w - 15, 14, { align: 'right' });

  // Hero title
  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  doc.text('Best Picks', 15, 65);

  doc.setFontSize(13);
  doc.setTextColor(...CYAN);
  doc.text('Daily Predictions Report', 15, 76);

  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.5);
  doc.line(15, 80, 100, 80);

  // Stats summary
  const totalPicks = Object.values(picks).flat().length;
  const avgConf    = totalPicks > 0
    ? Math.round(Object.values(picks).flat().reduce((s, p) => s + p.topProb, 0) / totalPicks)
    : 0;
  const highConf   = Object.values(picks).flat().filter(p => p.topProb >= 70).length;

  const stats = [
    { label: 'Total Picks',    value: String(totalPicks), color: CYAN    },
    { label: 'Avg Confidence', value: `${avgConf}%`,      color: EMERALD },
    { label: 'High Conf (70%+)', value: String(highConf), color: AMBER   },
    { label: 'Leagues',        value: String(Object.keys(picks).length), color: PURPLE },
  ];

  let sx = 15;
  stats.forEach(s => {
    doc.setFillColor(...CARD);
    doc.roundedRect(sx, 92, 42, 22, 2, 2, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...s.color);
    doc.text(s.value, sx + 21, 103, { align: 'center' });
    doc.setFontSize(6);
    doc.setTextColor(...S500);
    doc.text(s.label, sx + 21, 110, { align: 'center' });
    sx += 46;
  });

  // Disclaimer
  doc.setFontSize(7);
  doc.setTextColor(...S600);
  const disclaimer = 'These predictions are generated by AI models for informational purposes only. Not financial advice.';
  doc.text(disclaimer, w / 2, 130, { align: 'center', maxWidth: w - 30 });

  // ── Picks pages ──
  let y = 15;
  let isFirstLeague = true;

  Object.entries(picks).forEach(([leagueName, leaguePicks]) => {
    if (!leaguePicks.length) return;
    const lg = LEAGUES.find(l => l.name === leagueName);
    const lc = lg ? lg.color : '#22d3ee';
    const lcArr = lc === '#22d3ee' ? CYAN : lc === '#f59e0b' ? AMBER : lc === '#ef4444' ? [239,68,68] : lc === '#a855f7' ? PURPLE : lc === '#10b981' ? EMERALD : CYAN;

    if (isFirstLeague) { addPage(); isFirstLeague = false; }
    else if (y > 220) { addPage(); y = 15; }

    // League header
    doc.setFillColor(...lcArr.map(v => Math.min(v, 255)));
    doc.rect(15, y, 3, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...WHITE);
    doc.text(leagueName, 22, y + 7);
    doc.setFontSize(7);
    doc.setTextColor(...S500);
    doc.text(`${leaguePicks.length} picks`, w - 15, y + 7, { align: 'right' });
    y += 16;

    leaguePicks.forEach((pick, idx) => {
      if (y + 32 > 280) { addPage(); y = 15; }

      const conf = CONFIDENCE_LABEL(pick.topProb);
      const confArr = conf.color === '#10b981' ? EMERALD : conf.color === '#22d3ee' ? CYAN : conf.color === '#f59e0b' ? AMBER : [239,68,68];

      // Pick card
      doc.setFillColor(...CARD);
      doc.roundedRect(15, y, w - 30, 28, 2, 2, 'F');

      // Rank badge
      doc.setFillColor(...lcArr);
      doc.circle(22, y + 14, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...BG);
      doc.text(String(idx + 1), 22, y + 16.5, { align: 'center' });

      // Teams
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...WHITE);
      doc.text(pick.homeTeam.replace(/ FC$| AFC$/i, ''), 32, y + 10);
      doc.setFontSize(7);
      doc.setTextColor(...S400);
      doc.text('vs', 32, y + 16);
      doc.setFontSize(9);
      doc.setTextColor(...WHITE);
      doc.text(pick.awayTeam.replace(/ FC$| AFC$/i, ''), 32, y + 22);

      // Date
      doc.setFontSize(7);
      doc.setTextColor(...S500);
      const d = pick.date ? new Date(pick.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
      doc.text(d, w / 2, y + 14, { align: 'center' });

      // Predicted winner
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...confArr);
      doc.text(pick.winner, w - 60, y + 10, { align: 'right' });

      // Score
      doc.setFontSize(7);
      doc.setTextColor(...S400);
      doc.text(`Score: ${pick.score}`, w - 60, y + 16, { align: 'right' });

      // Confidence bar
      const barX = w - 55, barY = y + 20, barW = 40, barH = 3;
      doc.setFillColor(...S700);
      doc.roundedRect(barX, barY, barW, barH, 1, 1, 'F');
      doc.setFillColor(...confArr);
      doc.roundedRect(barX, barY, barW * (pick.topProb / 100), barH, 1, 1, 'F');
      doc.setFontSize(6);
      doc.setTextColor(...confArr);
      doc.text(`${pick.topProb}%`, w - 15, y + 22, { align: 'right' });

      y += 32;
    });

    y += 6;
  });

  // Footer on all pages
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...CARD);
    doc.rect(0, 285, w, 12, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...S600);
    doc.text('Football Analyst AI — Best Picks Report', 15, 291);
    doc.text(`Page ${i} of ${pages}`, w - 15, 291, { align: 'right' });
  }

  doc.save(`BestPicks_${date}.pdf`);
}

// ── Main Component ───────────────────────────────────────────────────
export default function BestPicksPage({ onNavigate }) {
  const [fixtures, setFixtures]     = useState([]);
  const [picks, setPicks]           = useState({});       // { leagueName: [pick,...] }
  const [loading, setLoading]       = useState(false);
  const [progress, setProgress]     = useState({ done: 0, total: 0 });
  const [error, setError]           = useState('');
  const [generated, setGenerated]   = useState('');
  const [activeLeague, setActiveLeague] = useState('all');
  const abortRef = useRef(false);

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fileDate = new Date().toISOString().slice(0, 10);

  // ── Fetch upcoming fixtures ────────────────────────────────────────
  const fetchFixtures = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/live/upcoming?days=3`);
      if (!resp.ok) throw new Error('Failed to fetch fixtures');
      const data = await resp.json();
      // Exclude Champions League
      const filtered = data.filter(f => f.league !== 'Champions League' && f.league !== 'UCL');
      setFixtures(filtered);
      return filtered;
    } catch (e) {
      setError('Could not load upcoming fixtures. Please try again.');
      return [];
    }
  }, []);

  // ── Run predictions in parallel (batched) ─────────────────────────
  const runPredictions = useCallback(async (fixtureList) => {
    if (!fixtureList.length) { setError('No upcoming fixtures found.'); return; }
    setLoading(true); setError(''); setPicks({}); abortRef.current = false;

    // Group by league, only known leagues
    const byLeague = {};
    LEAGUES.forEach(l => { byLeague[l.name] = []; });
    fixtureList.forEach(f => {
      if (byLeague[f.league]) byLeague[f.league].push(f);
    });

    const allFixtures = Object.values(byLeague).flat();
    setProgress({ done: 0, total: allFixtures.length });

    // Run all predictions in parallel with concurrency limit
    const CONCURRENCY = 4;
    const results = [];
    for (let i = 0; i < allFixtures.length; i += CONCURRENCY) {
      if (abortRef.current) break;
      const batch = allFixtures.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.allSettled(
        batch.map(async f => {
          try {
            const pred = await predictMatch(cleanName(f.homeTeam), cleanName(f.awayTeam), f.league);
            return { fixture: f, pred };
          } catch (e) {
            console.error('Prediction failed for', f.homeTeam, 'vs', f.awayTeam, e.message);
            return null;
            }
        })
      );
      batchResults.forEach(r => { if (r.status === 'fulfilled' && r.value) results.push(r.value); });
      setProgress(p => ({ ...p, done: Math.min(p.done + batch.length, allFixtures.length) }));
    }

    // Build top 5 per league
    const newPicks = {};
    LEAGUES.forEach(lg => {
      const leagueResults = results.filter(r => r.fixture.league === lg.name);
      const scored = leagueResults.map(r => {
        const { pred, fixture } = r;
        const homeWin = (pred.home_win || 0) * 100;
        const awayWin = (pred.away_win || 0) * 100;
        const topProb = Math.max(homeWin, awayWin);
        const winnerIsHome = homeWin >= awayWin;
        return {
          homeTeam:  fixture.homeTeam,
          awayTeam:  fixture.awayTeam,
          homeLogo:  fixture.homeLogo,
          awayLogo:  fixture.awayLogo,
          date:      fixture.date,
          league:    fixture.league,
          topProb:   Math.round(topProb),
          winner:    winnerIsHome ? cleanName(fixture.homeTeam) : cleanName(fixture.awayTeam),
          winnerLogo: winnerIsHome ? fixture.homeLogo : fixture.awayLogo,
          isHomeWin: winnerIsHome,
          homeWin:   Math.round(homeWin),
          draw:      Math.round((pred.draw || 0) * 100),
          awayWin:   Math.round(awayWin),
          score:     pred.predicted_score || '—',
          homeCrest: pred.home_crest || fixture.homeLogo,
          awayCrest: pred.away_crest || fixture.awayLogo,
          confidence: pred.confidence_level || 'Medium',
        };
      });
      // Sort by confidence descending, take top 5
      scored.sort((a, b) => b.topProb - a.topProb);
      newPicks[lg.name] = scored.slice(0, 5);
    });

    setPicks(newPicks);
    setGenerated(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    setLoading(false);
  }, []);

  // ── Auto-load on mount ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const fx = await fetchFixtures();
      if (fx.length) await runPredictions(fx);
    })();
    return () => { abortRef.current = true; };
  }, []);

  const handleRefresh = async () => {
    const fx = await fetchFixtures();
    if (fx.length) await runPredictions(fx);
  };

  const totalPicks  = Object.values(picks).flat().length;
  const avgConf     = totalPicks > 0 ? Math.round(Object.values(picks).flat().reduce((s, p) => s + p.topProb, 0) / totalPicks) : 0;
  const highConfPicks = Object.values(picks).flat().filter(p => p.topProb >= 70).length;

  const visibleLeagues = activeLeague === 'all'
    ? LEAGUES.filter(l => picks[l.name]?.length > 0)
    : LEAGUES.filter(l => l.name === activeLeague && picks[l.name]?.length > 0);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#060a14 0%,#080c18 50%,#06090f 100%)' }}>
      <NavBar currentPage="picks" onNavigate={onNavigate}/>

      <div className="max-w-6xl mx-auto px-4 pt-8 pb-24">

        {/* ── Hero Header ── */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 p-8"
          style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.08),rgba(168,85,247,0.04),transparent)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px]" style={{ background: 'rgba(34,211,238,0.06)' }}/>
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-[60px]" style={{ background: 'rgba(168,85,247,0.06)' }}/>

          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)' }}>
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
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
              <CalendarIcon className="w-4 h-4"/>
              <span>{today}</span>
            </div>

            {/* Stats row */}
            {totalPicks > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Picks',     value: totalPicks,          color: '#22d3ee', icon: <TargetIcon className="w-4 h-4"/> },
                  { label: 'Avg Confidence',  value: `${avgConf}%`,       color: '#10b981', icon: <TrophyIcon className="w-4 h-4"/> },
                  { label: 'High Conf (70%+)',value: highConfPicks,        color: '#f59e0b', icon: <StarIcon className="w-4 h-4"/>   },
                  { label: 'Leagues Covered', value: visibleLeagues.length + ' / 6', color: '#a855f7', icon: <ShieldIcon className="w-4 h-4"/> },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl p-4 border border-white/8 relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg,${s.color}10,rgba(10,14,26,0.9))` }}>
                    <div className="flex items-center gap-2 mb-1" style={{ color: s.color }}>{s.icon}<span className="text-xs uppercase tracking-widest font-bold">{s.label}</span></div>
                    <p className="text-2xl font-black text-white">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button onClick={handleRefresh} disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee' }}>
                <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
                {loading ? `Running… ${progress.done}/${progress.total}` : 'Refresh Picks'}
              </button>

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

        {/* ── Progress bar ── */}
        {loading && (
          <div className="mb-6 rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(17,24,39,0.8)' }}>
            <div className="px-5 py-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white font-bold text-sm">Running ML Predictions</span>
                <span className="text-cyan-400 font-black text-sm">{progress.done}/{progress.total}</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`, background: 'linear-gradient(90deg,#22d3ee,#a855f7)' }}/>
              </div>
              <p className="text-slate-400 text-xs mt-2">Analysing upcoming fixtures across 6 leagues…</p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 rounded-2xl p-4 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.06)' }}>
            <p className="text-red-400 font-semibold">{error}</p>
          </div>
        )}

        {/* ── League filter tabs ── */}
        {totalPicks > 0 && !loading && (
          <div className="flex gap-2 flex-wrap mb-6">
            <button onClick={() => setActiveLeague('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${activeLeague === 'all' ? 'border-cyan-500/40 text-cyan-400' : 'border-white/10 text-slate-400'}`}
              style={{ background: activeLeague === 'all' ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.03)' }}>
              All Leagues
            </button>
            {LEAGUES.filter(l => picks[l.name]?.length > 0).map(lg => (
              <button key={lg.name} onClick={() => setActiveLeague(lg.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border`}
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

        {/* ── Picks by league ── */}
        {!loading && totalPicks > 0 && visibleLeagues.map(lg => {
          const leaguePicks = picks[lg.name] || [];
          if (!leaguePicks.length) return null;
          return (
            <div key={lg.name} className="mb-8">
              {/* League header */}
              <div className="flex items-center gap-3 mb-4">
                <img src={lg.logo} alt={lg.name} className="w-7 h-7 object-contain"/>
                <h2 className="text-white font-black text-lg">{lg.name}</h2>
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg,${lg.color}30,transparent)` }}/>
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ color: lg.color, background: `${lg.color}12`, border: `1px solid ${lg.color}25` }}>
                  {leaguePicks.length} picks
                </span>
              </div>

              {/* Pick cards */}
              <div className="space-y-3">
                {leaguePicks.map((pick, idx) => {
                  const conf = CONFIDENCE_LABEL(pick.topProb);
                  return (
                    <div key={idx} className="relative rounded-2xl border overflow-hidden transition-all hover:scale-[1.005] group"
                      style={{
                        borderColor: idx === 0 ? `${lg.color}35` : 'rgba(255,255,255,0.08)',
                        background: idx === 0
                          ? `linear-gradient(135deg,${lg.color}08,rgba(10,14,26,0.95))`
                          : 'rgba(17,24,39,0.7)',
                      }}>

                      {/* Rank indicator */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                        style={{ background: idx === 0 ? `linear-gradient(180deg,${lg.color},${lg.color}60)` : 'rgba(255,255,255,0.06)' }}/>

                      {idx === 0 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black"
                          style={{ background: `${lg.color}15`, border: `1px solid ${lg.color}30`, color: lg.color }}>
                          <TrophyIcon className="w-3 h-3"/> Top Pick
                        </div>
                      )}

                      <div className="ml-1 px-5 py-4">
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                            style={{ background: idx === 0 ? `${lg.color}20` : 'rgba(255,255,255,0.05)', color: idx === 0 ? lg.color : '#64748b' }}>
                            {idx + 1}
                          </div>

                          {/* Teams */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              {/* Home */}
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {pick.homeCrest && <img src={pick.homeCrest} alt="" className="w-7 h-7 object-contain flex-shrink-0" onError={e=>e.target.style.display='none'}/>}
                                <span className={`font-bold text-sm truncate ${pick.isHomeWin ? 'text-white' : 'text-slate-400'}`}>
                                  {cleanName(pick.homeTeam)}
                                </span>
                                {pick.isHomeWin && <ZapIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: lg.color }}/>}
                              </div>

                              <span className="text-slate-600 text-xs font-bold flex-shrink-0">vs</span>

                              {/* Away */}
                              <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
                                {pick.awayCrest && <img src={pick.awayCrest} alt="" className="w-7 h-7 object-contain flex-shrink-0" onError={e=>e.target.style.display='none'}/>}
                                <span className={`font-bold text-sm truncate text-right ${!pick.isHomeWin ? 'text-white' : 'text-slate-400'}`}>
                                  {cleanName(pick.awayTeam)}
                                </span>
                                {!pick.isHomeWin && <ZapIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: lg.color }}/>}
                              </div>
                            </div>

                            {/* Date & score */}
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <CalendarIcon className="w-3 h-3"/>
                              <span>{pick.date ? new Date(pick.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                              <span className="text-slate-700">·</span>
                              <span className="font-bold text-slate-400">Pred: {pick.score}</span>
                            </div>
                          </div>

                          {/* Confidence */}
                          <div className="flex-shrink-0 text-right">
                            <div className="flex items-center gap-2 justify-end mb-1.5">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: conf.bg, border: `1px solid ${conf.border}`, color: conf.color }}>
                                {conf.label}
                              </span>
                              <span className="text-xl font-black" style={{ color: conf.color, fontFamily: 'monospace' }}>
                                {pick.topProb}%
                              </span>
                            </div>
                            {/* Mini prob bars */}
                            <div className="flex items-center gap-1 text-xs">
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

        {/* ── Empty state ── */}
        {!loading && totalPicks === 0 && !error && (
          <div className="text-center py-20 rounded-3xl border border-white/8" style={{ background: 'rgba(17,24,39,0.5)' }}>
            <ZapIcon className="w-12 h-12 mx-auto mb-4 text-slate-600"/>
            <h3 className="text-white font-bold text-xl mb-2">No picks available</h3>
            <p className="text-slate-400 mb-6">No upcoming fixtures found for the next few days.</p>
            <button onClick={handleRefresh}
              className="px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee' }}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}