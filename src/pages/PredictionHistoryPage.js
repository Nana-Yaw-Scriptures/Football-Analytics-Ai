<<<<<<< HEAD
=======
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import NavBar from '../components/NavBar';
import { useAuth } from '../context/AuthContext';
import { getPredictions, deletePrediction as sbDelete, clearPredictions as sbClear, resolvePredictions } from '../services/supabaseService';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/* ══════════════════════════════════════
   ICONS
══════════════════════════════════════ */
const I = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const CheckIcon    = p => <I {...p} d={<polyline points="20 6 9 17 4 12"/>}/>;
const XIcon        = p => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const TargetIcon   = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const TrendingIcon = p => <I {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const BarChartIcon = p => <I {...p} d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}/>;
const ClockIcon    = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const RefreshIcon  = p => <I {...p} d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>}/>;
const ZapIcon      = p => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const AwardIcon    = p => <I {...p} d={<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>}/>;
const GlobeIcon    = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}/>;
const HistoryIcon  = p => <I {...p} d={<><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></>}/>;
const TrashIcon    = p => <I {...p} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>}/>;
const ArrowUpIcon  = p => <I {...p} d={<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>}/>;
const ArrowDnIcon  = p => <I {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>}/>;
const DownloadIcon = p => <I {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}/>;
const SearchIcon   = p => <I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const AlertIcon    = p => <I {...p} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>;

/* ══════════════════════════════════════
   CONSTANTS
══════════════════════════════════════ */
const LEAGUE_IMG = {
  'Premier League':   'https://media.api-sports.io/football/leagues/39.png',
  'La Liga':          'https://media.api-sports.io/football/leagues/140.png',
  'Bundesliga':       'https://media.api-sports.io/football/leagues/78.png',
  'Serie A':          'https://media.api-sports.io/football/leagues/135.png',
  'Ligue 1':          'https://media.api-sports.io/football/leagues/61.png',
  'Primeira Liga':    'https://media.api-sports.io/football/leagues/94.png',
  'Champions League': 'https://media.api-sports.io/football/leagues/2.png',
};
const LEAGUE_COLOR = {
  'Premier League':   '#7c3aed',
  'La Liga':          '#dc2626',
  'Bundesliga':       '#d97706',
  'Serie A':          '#059669',
  'Ligue 1':          '#2563eb',
  'Primeira Liga':    '#10b981',
  'Champions League': '#f59e0b',
};

/* ══════════════════════════════════════
   ACCURACY RING
══════════════════════════════════════ */
const AccuracyRing = ({ value = 0, size = 140 }) => {
  const r    = (size - 18) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(value, 100) / 100) * circ;
  const c    = value >= 60 ? '#10b981' : value >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="relative" style={{ width:size, height:size }}>
        <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth="12"
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
            style={{ filter:`drop-shadow(0 0 8px ${c}60)`, transition:'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white" style={{ fontFamily:'JetBrains Mono' }}>{value}%</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">accuracy</span>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   RESULT BADGE
══════════════════════════════════════ */
const ResultBadge = ({ result }) => {
  const cfg = {
    H: { label:'Home Win', color:'#22d3ee', bg:'rgba(34,211,238,0.12)',  border:'rgba(34,211,238,0.25)' },
    D: { label:'Draw',     color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.25)' },
    A: { label:'Away Win', color:'#a855f7', bg:'rgba(168,85,247,0.12)',  border:'rgba(168,85,247,0.25)' },
  };
  const c = cfg[result] || { label:result||'—', color:'#94a3b8', bg:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)' };
  return (
    <span className="text-[10px] font-black px-2 py-0.5 rounded-md whitespace-nowrap"
      style={{ color:c.color, background:c.bg, border:`1px solid ${c.border}` }}>
      {c.label}
    </span>
  );
};

/* ══════════════════════════════════════
   WIN PROBABILITY STRIP — restored from original
══════════════════════════════════════ */
const WinProbStrip = ({ home, draw, away }) => {
  const h = Math.round((home || 0) * 100);
  const d = Math.round((draw || 0) * 100);
  const a = Math.round((away || 0) * 100);
  return (
    <div className="flex items-center gap-0.5 text-[10px] font-black" style={{ fontFamily:'JetBrains Mono' }}>
      <span style={{ color:'#22d3ee' }}>{h}%</span>
      <span className="text-slate-700 mx-0.5">·</span>
      <span style={{ color:'#f59e0b' }}>{d}%</span>
      <span className="text-slate-700 mx-0.5">·</span>
      <span style={{ color:'#a855f7' }}>{a}%</span>
    </div>
  );
};

/* ══════════════════════════════════════
   CONFIDENCE BAR
══════════════════════════════════════ */
const ConfBar = ({ value }) => {
  const pct = Math.round((value || 0) * 100);
  const c   = pct >= 60 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#64748b';
  return (
    <div className="w-12 flex-shrink-0">
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
        <div className="h-full rounded-full" style={{ width:`${pct}%`, background:c }}/>
      </div>
      <p className="text-[9px] text-center mt-0.5" style={{ fontFamily:'JetBrains Mono', color:c }}>{pct}%</p>
    </div>
  );
};

/* ══════════════════════════════════════
   LEAGUE ACCURACY ROW
══════════════════════════════════════ */
const LeagueAccuracyRow = ({ league, correct, total, accuracy }) => {
  const c = LEAGUE_COLOR[league] || '#22d3ee';
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2 w-36 flex-shrink-0">
        {LEAGUE_IMG[league] && <img src={LEAGUE_IMG[league]} alt="" className="w-4 h-4 object-contain flex-shrink-0"/>}
        <span className="text-xs text-slate-300 truncate">{(league||'').replace(' League','').replace('Premier','EPL')}</span>
      </div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width:`${accuracy}%`, background:`linear-gradient(90deg,${c}70,${c})` }}/>
      </div>
      <span className="text-sm font-black w-10 text-right" style={{ fontFamily:'JetBrains Mono', color:c }}>{accuracy}%</span>
      <span className="text-[10px] text-slate-600 w-14 text-right">{correct}/{total}</span>
    </div>
  );
};

/* ══════════════════════════════════════
   CONFIRM MODAL — new feature
══════════════════════════════════════ */
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
    style={{ background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)' }}>
    <div className="rounded-2xl border border-white/[0.1] p-6 max-w-sm w-full"
      style={{ background:'rgba(10,14,26,0.98)', boxShadow:'0 20px 60px rgba(0,0,0,0.5)', animation:'phFadeIn 0.2s ease-out' }}>
      <AlertIcon className="w-8 h-8 text-red-400 mx-auto mb-3"/>
      <p className="text-white font-black text-base text-center mb-1">Are you sure?</p>
      <p className="text-slate-400 text-sm text-center mb-5">{message}</p>
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all"
          style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.1)', color:'#94a3b8' }}>
          Cancel
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all"
          style={{ background:'rgba(239,68,68,0.15)', borderColor:'rgba(239,68,68,0.3)', color:'#ef4444' }}>
          Delete All
        </button>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function PredictionHistoryPage({ onNavigate }) {
  const [history,      setHistory]      = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [resolving,    setResolving]    = useState(false);
  const [filterLeague, setFilterLeague] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');  // all | correct | wrong | pending
  const [sortBy,       setSortBy]       = useState('date'); // date | confidence | result
  const [sortDir,      setSortDir]      = useState('desc');
  const [activeTab,    setActiveTab]    = useState('overview');
  const [sourceTab,    setSourceTab]    = useState('all'); // 'all' | 'pickem' | 'analysis'
  const [deletingId,   setDeletingId]   = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [teamSearch,   setTeamSearch]   = useState('');
  const [toast,        setToast]        = useState({ msg:'', type:'success' });

  const { user } = useAuth();

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'success' }), 2800);
  }, []);

  /* ── Fetch data from Supabase ── */
  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getPredictions(user.id, filterLeague || null);
      setHistory(Array.isArray(data) ? data : []);
      // Accuracy still from backend
      const lqOnly = filterLeague ? `?league=${encodeURIComponent(filterLeague)}` : '';
<<<<<<< HEAD
      const sR = await fetch(`${API_BASE}/predictions/accuracy${lqOnly}`).then(r => r.json()).catch(() => null);
=======
      const sR = await fetchWithTimeout(`${API_BASE}/predictions/accuracy${lqOnly}`).then(r => r.json()).catch(() => null);
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
      if (sR) setStats(sR);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterLeague, user]);

  // Auto-resolve pending predictions on load
  useEffect(() => {
    if (!user) return;
    fetchData().then(() => {
      // Silently try to resolve any pending predictions
      resolvePredictions(user.id, API_BASE)
        .then(result => {
          if (result.resolved > 0) fetchData();
        })
        .catch(() => {});
    });
  }, [user]); // eslint-disable-line

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Resolve results — FIX: show error toast on failure ── */
  const resolveAll = async () => {
    if (!user) return;
    setResolving(true);
    try {
      const result = await resolvePredictions(user.id, API_BASE);
      await fetchData();
      if (result.resolved > 0) {
        showToast(`${result.resolved} result${result.resolved !== 1 ? 's' : ''} updated!`);
      } else {
        showToast('No new results available yet', 'success');
      }
    } catch {
      showToast('Failed to check results', 'error');
    } finally { setResolving(false); }
  };

  /* ── Delete one via Supabase ── */
  const deletePrediction = async (id) => {
    if (!id || !user) return;
    setDeletingId(id);
    try {
      const ok = await sbDelete(id, user.id);
      if (ok) {
        setHistory(prev => prev.filter(p => p.id !== id));
        showToast('Prediction deleted');
      } else {
        showToast('Failed to delete', 'error');
      }
    } catch {
      showToast('Failed to delete', 'error');
    } finally { setDeletingId(null); }
  };

  /* ── Clear all via Supabase ── */
  const clearAll = async () => {
    setConfirmClear(false);
    if (!user) return;
    try {
      const ok = await sbClear(user.id);
      if (ok) {
        setHistory([]);
        setStats(null);
        showToast('All predictions cleared');
      } else {
        showToast('Failed to clear', 'error');
      }
    } catch {
      showToast('Failed to clear', 'error');
    }
  };

  /* ── Export CSV — new feature — includes win probs ── */
  const exportCSV = () => {
    const rows = [
      ['Date','Home','Away','League','Predicted','H%','D%','A%','Pred Score','Actual','Correct','Confidence'],
      ...history.map(p => [
        p.timestamp ? new Date(p.timestamp).toLocaleDateString('en-GB') : '',
        p.homeTeam || '', p.awayTeam || '', p.league || '',
        { H:'Home Win', D:'Draw', A:'Away Win' }[p.predictedResult] || (p.predictedResult || ''),
        Math.round((p.homeWinProb || 0) * 100) + '%',
        Math.round((p.drawProb    || 0) * 100) + '%',
        Math.round((p.awayWinProb || 0) * 100) + '%',
        p.predictedScore || '',
        p.actualScore    || '',
        p.resolved ? (p.correct ? 'Yes' : 'No') : 'Pending',
        Math.round((p.confidence  || 0) * 100) + '%',
      ]),
    ];
    const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'scorina_predictions.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!');
  };

  /* ── Filter + sort — using useMemo for perf ── */
  const filteredHistory = useMemo(() => {
    return history
      .filter(p => {
        // Filter by source tab
        if (sourceTab === 'all') return true;
        const src = p.source || 'analysis';
        if (sourceTab === 'pickem' && src !== 'pickem') return false;
        if (sourceTab === 'analysis' && src === 'pickem') return false;
        return true;
      })
      .filter(p => {
        if (filterStatus === 'correct') return p.resolved && p.correct;
        if (filterStatus === 'wrong')   return p.resolved && !p.correct;
        if (filterStatus === 'pending') return !p.resolved;
        return true;
      })
      .filter(p => {
        if (!teamSearch.trim()) return true;
        const q = teamSearch.toLowerCase();
        return (p.homeTeam || '').toLowerCase().includes(q) || (p.awayTeam || '').toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sortBy === 'confidence') {
          const diff = (a.confidence || 0) - (b.confidence || 0);
          return sortDir === 'desc' ? -diff : diff;
        }
        if (sortBy === 'result') {
          const av = a.predictedResult || '', bv = b.predictedResult || '';
          return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        // date sort — use getTime() for reliable numeric comparison
        const at = new Date(a.timestamp || 0).getTime();
        const bt = new Date(b.timestamp || 0).getTime();
        return sortDir === 'desc' ? bt - at : at - bt;
      });
  }, [history, filterStatus, teamSearch, sortBy, sortDir, sourceTab]);

  /* ── BUG FIX: sort by date before computing streaks ── */
  const { bestStreak, currentStreakCalc } = useMemo(() => {
    const resolved = [...history]
      .filter(p => p.resolved)
      .sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
    let best = 0, cur = 0;
    resolved.forEach(p => {
      if (p.correct) { cur++; if (cur > best) best = cur; }
      else cur = 0;
    });
    return { bestStreak: best, currentStreakCalc: cur };
  }, [history]);

  /* ── League breakdown — computed client-side, always from full history ── */
  const leagueBreakdown = useMemo(() => {
    return Object.entries(
      history.filter(p => p.resolved).reduce((acc, p) => {
        const l = p.league || 'Unknown';
        if (!acc[l]) acc[l] = { correct:0, total:0 };
        acc[l].total++;
        if (p.correct) acc[l].correct++;
        return acc;
      }, {})
    )
      .map(([league, { correct, total }]) => ({
        league, correct, total,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [history]);

  /* ── Derived counts — FIX: pendingCount from full history not filtered view ── */
  const pendingCount  = useMemo(() => history.filter(p => !p.resolved).length, [history]);
  const resolvedCount = useMemo(() => history.filter(p => p.resolved).length, [history]);
  const correctCount  = useMemo(() => history.filter(p => p.correct).length, [history]);
  const overallAcc    = resolvedCount > 0 ? Math.round((correctCount / resolvedCount) * 100) : 0;

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  return (
    <div className="min-h-screen bg-[#050810] text-white" style={{ fontFamily:"'Outfit',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[700px] h-[700px] rounded-full blur-[160px]"
          style={{ background:'radial-gradient(circle,rgba(16,185,129,0.06) 0%,transparent 65%)' }}/>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background:'radial-gradient(circle,rgba(34,211,238,0.04) 0%,transparent 65%)' }}/>
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize:'60px 60px' }}/>
      </div>

      <NavBar currentPage="history" onNavigate={onNavigate}/>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-5 md:px-8 py-8">

        {/* ══ HEADER ══ */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400"/>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">Track Your Accuracy</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-2">
                Prediction<br/>
                <span style={{ background:'linear-gradient(90deg,#10b981,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  History
                </span>
              </h1>
              <p className="text-slate-500 text-sm">Every prediction logged. Every result tracked.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {history.length > 0 && (
                <>
                  <button onClick={exportCSV}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border"
                    style={{ background:'rgba(34,211,238,0.08)', borderColor:'rgba(34,211,238,0.2)', color:'#22d3ee' }}>
                    <DownloadIcon className="w-3.5 h-3.5"/>Export CSV
                  </button>
                  <button onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border"
                    style={{ background:'rgba(239,68,68,0.08)', borderColor:'rgba(239,68,68,0.2)', color:'#ef4444' }}>
                    <TrashIcon className="w-3.5 h-3.5"/>Clear All
                  </button>
                </>
              )}
              <button onClick={resolveAll} disabled={resolving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border disabled:opacity-40"
                style={{ background:'rgba(16,185,129,0.1)', borderColor:'rgba(16,185,129,0.25)', color:'#10b981' }}>
                <RefreshIcon className={`w-4 h-4 ${resolving ? 'animate-spin' : ''}`}/>
                {resolving ? 'Checking…' : `Check Results${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
              </button>
            </div>
          </div>
        </div>

        {/* ══ LEAGUE FILTER ══ */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <button onClick={() => setFilterLeague('')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 border"
            style={{
              background: !filterLeague ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
              borderColor: !filterLeague ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)',
              color: !filterLeague ? '#10b981' : '#64748b',
            }}>
            <GlobeIcon className="w-3.5 h-3.5"/>All
          </button>
          {Object.keys(LEAGUE_IMG).map(l => {
            const isActive = filterLeague === l;
            const c = LEAGUE_COLOR[l] || '#22d3ee';
            return (
              <button key={l} onClick={() => setFilterLeague(l)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 border"
                style={{
                  background: isActive ? `${c}12` : 'rgba(255,255,255,0.03)',
                  borderColor: isActive ? `${c}30` : 'rgba(255,255,255,0.07)',
                  color: isActive ? c : '#64748b',
                }}>
                <img src={LEAGUE_IMG[l]} alt="" className="w-4 h-4 object-contain" style={{ opacity:isActive?1:0.5 }}/>
                <span className="hidden sm:inline">{l.replace(' League','').replace('Premier','EPL')}</span>
              </button>
            );
          })}
        </div>

        {/* ══ NOT LOGGED IN ══ */}
        {!user && !loading && (
          <div className="rounded-2xl border border-white/[0.07] p-12 text-center"
            style={{ background:'rgba(10,14,26,0.8)' }}>
            <HistoryIcon className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
            <p className="text-white font-black text-lg mb-1">Sign in to track predictions</p>
            <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">
              Create an account to save your prediction history, track accuracy and compare results over time.
            </p>
            <button onClick={() => onNavigate('login')}
              className="px-6 py-3 rounded-xl font-bold text-sm border transition-all"
              style={{ background:'rgba(34,211,238,0.1)', borderColor:'rgba(34,211,238,0.25)', color:'#22d3ee' }}>
              Sign In →
            </button>
          </div>
        )}

        {/* ══ LOADING ══ */}
        {user && loading && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-5 relative">
              <div className="absolute inset-0 rounded-full border-2" style={{ borderColor:'rgba(16,185,129,0.2)' }}/>
              <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor:'#10b981', borderTopColor:'transparent' }}/>
              <HistoryIcon className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
            </div>
            <p className="text-white font-black text-lg">Loading History</p>
            <p className="text-slate-600 text-sm mt-1">Fetching predictions…</p>
          </div>
        )}

        {user && !loading && (
          <>
            {/* ══ TABS ══ */}
            <div className="flex gap-1 mb-6 rounded-2xl p-1.5 border border-white/[0.06]"
              style={{ background:'rgba(10,14,26,0.7)' }}>
              {[
                { id:'overview', label:'Overview',                         Icon:BarChartIcon },
                { id:'history',  label:`Predictions (${history.length})`, Icon:HistoryIcon  },
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className="relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: isActive ? 'rgba(16,185,129,0.12)' : 'transparent',
                      border: isActive ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent',
                      color: isActive ? '#10b981' : '#475569',
                    }}>
                    {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-emerald-400"/>}
                    <tab.Icon className="w-3.5 h-3.5 flex-shrink-0"/>
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ══════════════════════════════
                OVERVIEW TAB
            ══════════════════════════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-4" style={{ animation:'phFadeIn 0.35s ease-out' }}>

                {history.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.07] p-12 text-center"
                    style={{ background:'rgba(10,14,26,0.8)' }}>
                    <HistoryIcon className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
                    <p className="text-white font-black text-lg mb-1">No Predictions Yet</p>
                    <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">
                      Go to Analysis and make your first match prediction.
                    </p>
                    <button onClick={() => onNavigate('analysis')}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm border transition-all"
                      style={{ background:'rgba(16,185,129,0.1)', borderColor:'rgba(16,185,129,0.25)', color:'#10b981' }}>
                      Go to Analysis →
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Quick stats — always visible even with 0 resolved */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label:'Total',    value:history.length,    color:'#a855f7', Icon:TargetIcon,  sub:`${pendingCount} pending`         },
                        { label:'Resolved', value:resolvedCount,     color:'#22d3ee', Icon:CheckIcon,   sub:`${pendingCount} awaiting`        },
                        { label:'Correct',  value:correctCount,      color:'#10b981', Icon:AwardIcon,   sub:`${overallAcc}% accuracy`         },
                        { label:'Streak',   value:currentStreakCalc, color:'#f59e0b', Icon:ZapIcon,     sub:`Best ever: ${bestStreak}`        },
                      ].map((s, i) => (
                        <div key={i} className="rounded-2xl border border-white/[0.07] p-4 relative overflow-hidden"
                          style={{ background:`${s.color}08` }}>
                          <div className="absolute top-0 left-0 right-0 h-0.5"
                            style={{ background:`linear-gradient(90deg,transparent,${s.color}60,transparent)` }}/>
                          <s.Icon className="w-4 h-4 mb-2" style={{ color:s.color }}/>
                          <p className="text-2xl font-black text-white" style={{ fontFamily:'JetBrains Mono' }}>{s.value ?? '—'}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
                          <p className="text-[10px] text-slate-600">{s.sub}</p>
                        </div>
                      ))}
                    </div>

                    {resolvedCount === 0 ? (
                      /* Has predictions but none resolved yet */
                      <div className="rounded-2xl border border-white/[0.07] p-8 text-center"
                        style={{ background:'rgba(10,14,26,0.8)' }}>
                        <ClockIcon className="w-8 h-8 text-yellow-400 mx-auto mb-2"/>
                        <p className="text-white font-bold text-base mb-1">Waiting for results</p>
                        <p className="text-slate-500 text-sm mb-4 max-w-sm mx-auto">
                          You have {pendingCount} prediction{pendingCount !== 1 ? 's' : ''} pending. Click "Check Results" to resolve them.
                        </p>
                        <button onClick={resolveAll} disabled={resolving}
                          className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl font-bold text-sm border transition-all disabled:opacity-40"
                          style={{ background:'rgba(16,185,129,0.1)', borderColor:'rgba(16,185,129,0.25)', color:'#10b981' }}>
                          <RefreshIcon className={`w-4 h-4 ${resolving ? 'animate-spin' : ''}`}/>
                          {resolving ? 'Checking…' : 'Check Results Now'}
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Hero accuracy */}
                        <div className="rounded-2xl overflow-hidden border border-white/[0.07] relative"
                          style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(5,8,16,0.95))', boxShadow:'0 0 50px rgba(16,185,129,0.08)' }}>
                          <div className="h-0.5" style={{ background:'linear-gradient(90deg,transparent,#10b981,transparent)' }}/>
                          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-8">
                            <AccuracyRing value={overallAcc} size={140}/>
                            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                              {[
                                { label:'Result Accuracy',  value:`${overallAcc}%`,                color:'#10b981', sub:'Correct winner/draw'    },
                                { label:'Exact Score',      value:`${stats?.scoreAccuracy ?? 0}%`, color:'#22d3ee', sub:'Exact scoreline hit'     },
                                { label:'Best Streak',      value:bestStreak,                      color:'#f59e0b', sub:'Consecutive correct'     },
                                { label:'Avg Confidence',   value:`${stats?.avgConfidence ?? 0}%`, color:'#a855f7', sub:'Model certainty'         },
                              ].map((s, i) => (
                                <div key={i} className="text-center sm:text-left">
                                  <p className="text-xl font-black" style={{ fontFamily:'JetBrains Mono', color:s.color }}>{s.value}</p>
                                  <p className="text-xs text-white font-bold mt-0.5">{s.label}</p>
                                  <p className="text-[10px] text-slate-600">{s.sub}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* By result type */}
                        <div className="rounded-2xl border border-white/[0.07] overflow-hidden"
                          style={{ background:'rgba(10,14,26,0.85)' }}>
                          <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2"
                            style={{ background:'rgba(255,255,255,0.02)' }}>
                            <BarChartIcon className="w-4 h-4 text-cyan-400"/>
                            <span className="text-white font-black text-sm">Accuracy by Result Type</span>
                          </div>
                          <div className="grid grid-cols-3 divide-x divide-white/[0.05]">
                            {[
                              { key:'H', label:'Home Wins', color:'#22d3ee' },
                              { key:'D', label:'Draws',     color:'#f59e0b' },
                              { key:'A', label:'Away Wins', color:'#a855f7' },
                            ].map(r => {
                              const d = stats?.byResult?.[r.key] || { total:0, correct:0, accuracy:0 };
                              return (
                                <div key={r.key} className="p-5 text-center">
                                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">{r.label}</p>
                                  <p className="text-3xl font-black mb-1" style={{ fontFamily:'JetBrains Mono', color:r.color }}>{d.accuracy}%</p>
                                  <p className="text-[11px] text-slate-600">{d.correct}/{d.total}</p>
                                  <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width:`${d.accuracy}%`, background:r.color }}/>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Recent form dots */}
                        {stats?.recentForm?.length > 0 && (
                          <div className="rounded-2xl border border-white/[0.07] p-5"
                            style={{ background:'rgba(10,14,26,0.85)' }}>
                            <div className="flex items-center gap-2 mb-4">
                              <TrendingIcon className="w-4 h-4 text-cyan-400"/>
                              <span className="text-white font-black text-sm">Recent Form</span>
                              <span className="ml-auto text-[11px] text-slate-500">
                                {stats.recentForm.filter(r => r.correct).length}/{stats.recentForm.length} correct
                              </span>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              {stats.recentForm.map((r, i) => (
                                <div key={i} className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{
                                    background: r.correct ? '#10b981' : '#ef4444',
                                    boxShadow: r.correct ? '0 0 5px rgba(16,185,129,0.5)' : '0 0 5px rgba(239,68,68,0.35)',
                                  }}/>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* League breakdown — client-side, accurate even when league filter is active */}
                        {leagueBreakdown.length > 1 && (
                          <div className="rounded-2xl border border-white/[0.07] overflow-hidden"
                            style={{ background:'rgba(10,14,26,0.85)' }}>
                            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2"
                              style={{ background:'rgba(255,255,255,0.02)' }}>
                              <GlobeIcon className="w-4 h-4 text-cyan-400"/>
                              <span className="text-white font-black text-sm">Accuracy by League</span>
                            </div>
                            <div className="px-5 py-4 space-y-1">
                              {leagueBreakdown.map((l, i) => <LeagueAccuracyRow key={i} {...l}/>)}
                            </div>
                          </div>
                        )}

                        {/* Confidence calibration */}
                        {stats?.byConfidence?.length > 0 && (
                          <div className="rounded-2xl border border-white/[0.07] overflow-hidden"
                            style={{ background:'rgba(10,14,26,0.85)' }}>
                            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between"
                              style={{ background:'rgba(255,255,255,0.02)' }}>
                              <div className="flex items-center gap-2">
                                <TargetIcon className="w-4 h-4 text-purple-400"/>
                                <span className="text-white font-black text-sm">Confidence Calibration</span>
                              </div>
                              <span className="text-[11px] text-slate-500">
                                Avg: <span className="text-white font-bold" style={{ fontFamily:'JetBrains Mono' }}>{stats.avgConfidence}%</span>
                              </span>
                            </div>
                            <div className="p-5 space-y-3">
                              <p className="text-[11px] text-slate-600 mb-3">
                                Well-calibrated: when model is 70% confident, it should be ~70% accurate
                              </p>
                              {stats.byConfidence.map((b, i) => {
                                const rangeLow = parseInt((b.range || '0').split('-')[0]) || 0;
                                const diff     = b.accuracy - rangeLow;
                                const isGood   = Math.abs(diff) <= 10;
                                const barColor = b.accuracy >= 60 ? '#10b981' : b.accuracy >= 40 ? '#f59e0b' : '#ef4444';
                                return (
                                  <div key={i} className="flex items-center gap-3">
                                    <span className="text-[11px] text-slate-400 w-28 flex-shrink-0">
                                      {b.label} <span className="text-slate-700">({b.range})</span>
                                    </span>
                                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
                                      <div className="h-full rounded-full transition-all duration-1000"
                                        style={{ width:`${b.accuracy}%`, background:barColor }}/>
                                    </div>
                                    <span className="text-sm font-black w-10 text-right" style={{ fontFamily:'JetBrains Mono', color:barColor }}>{b.accuracy}%</span>
                                    <span className="text-[10px] text-slate-600 w-12 text-right">{b.correct}/{b.total}</span>
                                    <span className="text-[10px] w-14 text-right" style={{ color: isGood ? '#10b981' : '#f59e0b' }}>
                                      {isGood ? '✓ Good' : diff > 0 ? `↑ +${diff}%` : `↓ ${diff}%`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ══════════════════════════════
                HISTORY TAB
            ══════════════════════════════ */}
            {activeTab === 'history' && (
              <div style={{ animation:'phFadeIn 0.35s ease-out' }}>

                {/* Source tabs — My Picks vs AI Predictions */}
                <div className="flex gap-1 mb-4 rounded-2xl p-1 border border-white/[0.06]"
                  style={{ background:'rgba(10,14,26,0.7)' }}>
                  {[
                    { id:'all',      label:'📋 All',             sub:'All predictions' },
                    { id:'pickem',   label:'🎯 My Picks',       sub:'Your own predictions' },
                    { id:'analysis', label:'🤖 AI Predictions',  sub:'From Analysis page' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setSourceTab(t.id)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border"
                      style={{
                        background:  sourceTab === t.id ? 'rgba(168,85,247,0.12)' : 'transparent',
                        borderColor: sourceTab === t.id ? 'rgba(168,85,247,0.25)' : 'transparent',
                        color:       sourceTab === t.id ? '#a855f7' : '#475569',
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Controls */}
                <div className="space-y-3 mb-4">
                  {/* Team search — new feature */}
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/[0.07]"
                    style={{ background:'rgba(10,14,26,0.8)' }}>
                    <SearchIcon className="w-4 h-4 text-slate-500 flex-shrink-0"/>
                    <input
                      type="text"
                      value={teamSearch}
                      onChange={e => setTeamSearch(e.target.value)}
                      placeholder="Search by team name…"
                      className="flex-1 bg-transparent text-white text-sm placeholder-slate-600 outline-none"
                    />
                    {teamSearch && (
                      <button onClick={() => setTeamSearch('')} className="text-slate-600 hover:text-white transition-colors">
                        <XIcon className="w-3.5 h-3.5"/>
                      </button>
                    )}
                  </div>

                  {/* Status filter + sort */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1 rounded-xl p-1 border border-white/[0.06]" style={{ background:'rgba(10,14,26,0.7)' }}>
                      {[
                        { id:'all',     label:'All'                      },
                        { id:'correct', label:'✓ Correct'                },
                        { id:'wrong',   label:'✗ Wrong'                  },
                        { id:'pending', label:`⏳ Pending (${pendingCount})` },
                      ].map(f => (
                        <button key={f.id} onClick={() => setFilterStatus(f.id)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                          style={{
                            background: filterStatus===f.id ? 'rgba(16,185,129,0.15)' : 'transparent',
                            border: filterStatus===f.id ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
                            color: filterStatus===f.id ? '#10b981' : '#475569',
                          }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      {[
                        { id:'date',       label:'Date'       },
                        { id:'confidence', label:'Confidence' },
                        { id:'result',     label:'Result'     },
                      ].map(s => (
                        <button key={s.id} onClick={() => toggleSort(s.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border"
                          style={{
                            background: sortBy===s.id ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.03)',
                            borderColor: sortBy===s.id ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.07)',
                            color: sortBy===s.id ? '#22d3ee' : '#64748b',
                          }}>
                          {s.label}
                          {sortBy===s.id && (sortDir==='desc' ? <ArrowDnIcon className="w-3 h-3"/> : <ArrowUpIcon className="w-3 h-3"/>)}
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-600">{filteredHistory.length} shown</span>
                  </div>
                </div>

                {/* List */}
                {filteredHistory.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.07] py-16 text-center"
                    style={{ background:'rgba(10,14,26,0.8)' }}>
                    <HistoryIcon className="w-8 h-8 text-slate-700 mx-auto mb-3"/>
                    <p className="text-white font-black text-base mb-1">
                      {history.length === 0 ? 'No Predictions Yet' : 'No matches for this filter'}
                    </p>
                    <p className="text-slate-500 text-sm">
                      {history.length === 0 ? 'Make predictions on the Analysis page.' : 'Try adjusting the filters.'}
                    </p>
                    {history.length === 0 && (
                      <button onClick={() => onNavigate('analysis')}
                        className="mt-4 px-5 py-2.5 rounded-xl font-bold text-sm border transition-all"
                        style={{ background:'rgba(16,185,129,0.1)', borderColor:'rgba(16,185,129,0.25)', color:'#10b981' }}>
                        Go to Analysis →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/[0.07] overflow-hidden"
                    style={{ background:'rgba(8,12,22,0.9)' }}>
                    {/* Desktop header */}
                    <div className="hidden md:grid items-center px-5 py-3 border-b border-white/[0.06] text-[10px] text-slate-600 uppercase tracking-widest font-bold"
                      style={{ gridTemplateColumns:'2fr 2fr 130px 85px 70px 60px 60px 48px 36px', gap:8, background:'rgba(255,255,255,0.02)' }}>
                      <div>Home</div>
                      <div>Away</div>
                      <div>League</div>
                      <div>H% · D% · A%</div>
                      <div className="text-center">Predicted</div>
                      <div className="text-center">Score</div>
                      <div className="text-center">Actual</div>
                      <div className="text-center">Conf</div>
                      <div/>
                    </div>

                    {filteredHistory.map((pred, idx) => {
                      const isCorrect   = pred.resolved && pred.correct;
                      const isWrong     = pred.resolved && !pred.correct;
                      const statusColor = isCorrect ? '#10b981' : isWrong ? '#ef4444' : '#475569';
                      const leagueC     = LEAGUE_COLOR[pred.league] || '#22d3ee';

                      return (
                        <div key={pred.id || idx}
                          className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015] transition-all"
                          style={{ animation:`phFadeIn 0.2s ease-out ${Math.min(idx * 0.02, 0.4)}s both` }}>

                          {/* Desktop row */}
                          <div className="hidden md:grid items-center px-5 py-3"
                            style={{ gridTemplateColumns:'2fr 2fr 130px 85px 70px 60px 60px 48px 36px', gap:8 }}>

                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background:`${statusColor}15`, border:`1px solid ${statusColor}25` }}>
                                {isCorrect ? <CheckIcon className="w-3 h-3" style={{ color:statusColor }}/>
                                  : isWrong ? <XIcon className="w-3 h-3" style={{ color:statusColor }}/>
                                  : <ClockIcon className="w-3 h-3" style={{ color:statusColor }}/>}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{pred.homeTeam || '—'}</p>
                                <p className="text-[10px] text-slate-600">
                                  {pred.timestamp ? new Date(pred.timestamp).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'}) : '—'}
                                </p>
                              </div>
                            </div>

                            <p className="text-sm font-semibold text-white truncate">{pred.awayTeam || '—'}</p>

                            <div className="flex items-center gap-1.5 min-w-0">
                              {LEAGUE_IMG[pred.league] && <img src={LEAGUE_IMG[pred.league]} alt="" className="w-3.5 h-3.5 object-contain flex-shrink-0"/>}
                              <span className="text-[11px] truncate" style={{ color:`${leagueC}90` }}>
                                {(pred.league || '').replace(' League','').replace('Premier','EPL')}
                              </span>
                            </div>

                            {/* Win probs — restored */}
                            <WinProbStrip home={pred.homeWinProb} draw={pred.drawProb} away={pred.awayWinProb}/>

                            <div className="flex justify-center">
                              <ResultBadge result={pred.predictedResult}/>
                            </div>

                            <div className="text-center">
                              <span className="text-xs font-black text-slate-400" style={{ fontFamily:'JetBrains Mono' }}>
                                {pred.predictedScore || '—'}
                              </span>
                            </div>

                            <div className="text-center">
                              {pred.resolved
                                ? <span className="text-xs font-black" style={{ fontFamily:'JetBrains Mono', color:statusColor }}>{pred.actualScore || '—'}</span>
                                : <span className="text-[10px] text-slate-600">pending</span>}
                            </div>

                            <div className="flex justify-center">
                              <ConfBar value={pred.confidence}/>
                            </div>

                            <button onClick={() => deletePrediction(pred.id)}
                              disabled={deletingId === pred.id || !pred.id}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 mx-auto">
                              <TrashIcon className="w-3 h-3"/>
                            </button>
                          </div>

                          {/* Mobile row */}
                          <div className="md:hidden flex items-start gap-3 px-4 py-3">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background:`${statusColor}15`, border:`1px solid ${statusColor}25` }}>
                              {isCorrect ? <CheckIcon className="w-3 h-3" style={{ color:statusColor }}/>
                                : isWrong ? <XIcon className="w-3 h-3" style={{ color:statusColor }}/>
                                : <ClockIcon className="w-3 h-3" style={{ color:statusColor }}/>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-bold text-white">{pred.homeTeam || '—'}</span>
                                <span className="text-slate-600 text-xs">vs</span>
                                <span className="text-sm font-bold text-white">{pred.awayTeam || '—'}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {LEAGUE_IMG[pred.league] && <img src={LEAGUE_IMG[pred.league]} alt="" className="w-3 h-3 object-contain"/>}
                                <span className="text-[10px] text-slate-600">{pred.league || '—'}</span>
                                {pred.timestamp && <span className="text-[10px] text-slate-700">{new Date(pred.timestamp).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>}
                              </div>
                              <div className="mt-1.5">
                                <WinProbStrip home={pred.homeWinProb} draw={pred.drawProb} away={pred.awayWinProb}/>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              <ResultBadge result={pred.predictedResult}/>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-500" style={{ fontFamily:'JetBrains Mono' }}>
                                  {pred.predictedScore || '—'}
                                </span>
                                {pred.resolved && (
                                  <span className="text-[10px] font-black" style={{ fontFamily:'JetBrains Mono', color:statusColor }}>
                                    → {pred.actualScore || '?'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button onClick={() => deletePrediction(pred.id)}
                              disabled={deletingId === pred.id || !pred.id}
                              className="text-slate-700 hover:text-red-400 transition-colors disabled:opacity-30 flex-shrink-0 p-1 mt-0.5">
                              <TrashIcon className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ CONFIRM MODAL ══ */}
      {confirmClear && (
        <ConfirmModal
          message={`This will permanently delete all ${history.length} predictions. This cannot be undone.`}
          onConfirm={clearAll}
          onCancel={() => setConfirmClear(false)}
        />
      )}

      {/* ══ TOAST — now typed (success / error) ══ */}
      {toast.msg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold border"
          style={{
            background: toast.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)',
            borderColor: toast.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)',
            backdropFilter:'blur(16px)',
            boxShadow:`0 8px 32px ${toast.type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
            animation:'phFadeIn 0.3s ease-out',
          }}>
          {toast.type === 'error' ? <AlertIcon className="w-4 h-4"/> : <CheckIcon className="w-4 h-4"/>}
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes phFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}