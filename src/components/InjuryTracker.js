import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ── Icons ────────────────────────────────────────────────────────────
const I = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const AlertIcon    = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}/>;
const CalendarIcon = p => <I {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
const RefreshIcon  = p => <I {...p} d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>}/>;
const ShieldIcon   = p => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const UserIcon     = p => <I {...p} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>;

// ── Constants ────────────────────────────────────────────────────────
const LEAGUES = [
  { name: 'Premier League', id: 39,  color: '#7c3aed', logo: 'https://media.api-sports.io/football/leagues/39.png'  },
  { name: 'La Liga',        id: 140, color: '#dc2626', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { name: 'Bundesliga',     id: 78,  color: '#d97706', logo: 'https://media.api-sports.io/football/leagues/78.png'  },
  { name: 'Serie A',        id: 135, color: '#059669', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { name: 'Ligue 1',        id: 61,  color: '#2563eb', logo: 'https://media.api-sports.io/football/leagues/61.png'  },
  { name: 'Primeira Liga',  id: 94,  color: '#10b981', logo: 'https://media.api-sports.io/football/leagues/94.png'  },
];

const SEVERITY = {
  'Muscle Injury':    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   label: 'Muscle'    },
  'Knee Injury':      { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)',  label: 'Knee'      },
  'Hamstring':        { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   label: 'Hamstring' },
  'Ankle':            { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  label: 'Ankle'     },
  'Illness':          { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)',  label: 'Illness'   },
  'Suspended':        { color: '#a855f7', bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.3)',  label: 'Suspended' },
  'Groin':            { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)',  label: 'Groin'     },
  'Back':             { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  label: 'Back'      },
  'default':          { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', label: 'Injury'    },
};

const getSeverity = (type) => {
  if (!type) return SEVERITY.default;
  for (const key of Object.keys(SEVERITY)) {
    if (type.toLowerCase().includes(key.toLowerCase())) return SEVERITY[key];
  }
  return SEVERITY.default;
};

// ── Injury Card ──────────────────────────────────────────────────────
const InjuryCard = ({ injury }) => {
  const sev = getSeverity(injury.type);
  return (
    <div className="rounded-2xl border overflow-hidden transition-all hover:scale-[1.01]"
      style={{ background: 'rgba(10,14,26,0.85)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Player photo */}
          <div className="relative flex-shrink-0">
            {injury.playerPhoto
              ? <img src={injury.playerPhoto} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10"
                  onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}/>
              : null}
            <div className="w-12 h-12 rounded-xl border border-white/10 items-center justify-center"
              style={{ background: sev.bg, display: injury.playerPhoto ? 'none' : 'flex' }}>
              <UserIcon className="w-5 h-5" style={{ color: sev.color }}/>
            </div>
            {/* Team logo */}
            {injury.teamLogo && (
              <img src={injury.teamLogo} alt="" className="absolute -bottom-1 -right-1 w-5 h-5 object-contain rounded-full bg-[#0a0e1a] border border-[#0a0e1a]"/>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-sm truncate">{injury.player}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {injury.teamLogo && <img src={injury.teamLogo} alt="" className="w-3.5 h-3.5 object-contain flex-shrink-0"/>}
              <span className="text-xs text-slate-500 truncate">{(injury.team||'').replace(/ FC$| AFC$/, '')}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color }}>
                {injury.type || 'Unknown'}
              </span>
              {injury.reason && injury.reason !== injury.type && (
                <span className="text-xs text-slate-500 truncate">{injury.reason}</span>
              )}
            </div>
          </div>

      {/* Status */}
<div className="flex-shrink-0 text-right">
  <span className="text-xs font-bold px-2 py-1 rounded-full"
    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
    Currently Out
  </span>
  {injury.games_missed > 1 && (
    <p className="text-[10px] text-slate-600 mt-1">{injury.games_missed} games missed</p>
  )}
</div>

        </div>
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────
export default function InjuryTracker() {
  const [injuries,      setInjuries]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [activeLeague,  setActiveLeague]  = useState('Premier League');
  const [search,        setSearch]        = useState('');
  const [filterType,    setFilterType]    = useState('All');

  const fetchInjuries = async (league) => {
    setLoading(true); setError('');
    try {
      const resp = await fetch(`${API_BASE}/injuries/${encodeURIComponent(league)}`);
      if (!resp.ok) throw new Error('Failed to fetch injuries');
      const data = await resp.json();
      setInjuries(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Could not load injury data. Please try again.');
      setInjuries([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchInjuries(activeLeague); }, [activeLeague]);

  const lg = LEAGUES.find(l => l.name === activeLeague);

  // Get unique injury types for filter
  const injuryTypes = ['All', ...new Set(injuries.map(i => i.type).filter(Boolean))];

  const filtered = injuries.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || (i.player||'').toLowerCase().includes(q) || (i.team||'').toLowerCase().includes(q);
    const matchType = filterType === 'All' || i.type === filterType;
    return matchSearch && matchType;
  });

  // Group by team
  const byTeam = {};
  filtered.forEach(i => {
    const team = i.team || 'Unknown';
    if (!byTeam[team]) byTeam[team] = { logo: i.teamLogo, players: [] };
    byTeam[team].players.push(i);
  });

  const totalOut = filtered.filter(i => !(i.type||'').toLowerCase().includes('suspen')).length;
  const totalSusp = filtered.filter(i => (i.type||'').toLowerCase().includes('suspen')).length;
  const muscleCount = filtered.filter(i => (i.type||'').toLowerCase().includes('muscle') || (i.type||'').toLowerCase().includes('hamstring')).length;

  return (
    <div>
      {/* League tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {LEAGUES.map(l => (
          <button key={l.name} onClick={() => { setActiveLeague(l.name); setSearch(''); setFilterType('All'); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border"
            style={{
              borderColor: activeLeague === l.name ? `${l.color}40` : 'rgba(255,255,255,0.08)',
              color:       activeLeague === l.name ? l.color : '#64748b',
              background:  activeLeague === l.name ? `${l.color}12` : 'rgba(255,255,255,0.03)',
            }}>
            <img src={l.logo} alt="" className="w-4 h-4 object-contain"/>
            {l.name.replace(' League', '').replace('Primeira Liga', 'Liga Port.')}
          </button>
        ))}
        <button onClick={() => fetchInjuries(activeLeague)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all border ml-auto"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#64748b' }}>
          <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/>
          Refresh
        </button>
      </div>

      {/* Stats row */}
      {!loading && injuries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Injured',   value: totalOut,        color: '#ef4444', icon: <AlertIcon className="w-4 h-4"/> },
            { label: 'Suspended',       value: totalSusp,       color: '#a855f7', icon: <ShieldIcon className="w-4 h-4"/> },
            { label: 'Muscle/Hamstring',value: muscleCount,     color: '#f97316', icon: <UserIcon className="w-4 h-4"/> },
            { label: 'Teams Affected',  value: Object.keys(byTeam).length, color: lg?.color || '#22d3ee', icon: <CalendarIcon className="w-4 h-4"/> },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 border border-white/8"
              style={{ background: `linear-gradient(135deg,${s.color}10,rgba(10,14,26,0.9))` }}>
              <div className="flex items-center gap-2 mb-1" style={{ color: s.color }}>
                {s.icon}
                <span className="text-xs uppercase tracking-widest font-bold">{s.label}</span>
              </div>
              <p className="text-2xl font-black text-white">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + filter */}
      {!loading && injuries.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search player or team..."
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 border focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}/>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm font-bold border focus:outline-none"
            style={{ background: 'rgba(10,14,26,0.9)', borderColor: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
            {injuryTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-20 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mx-auto mb-4"/>
          <p className="text-slate-400">Loading injury reports for {activeLeague}…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-2xl p-4 border border-red-500/20 mb-4" style={{ background: 'rgba(239,68,68,0.06)' }}>
          <p className="text-red-400 font-semibold">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && injuries.length === 0 && (
        <div className="py-20 text-center rounded-2xl border border-white/8" style={{ background: 'rgba(17,24,39,0.5)' }}>
          <ShieldIcon className="w-10 h-10 text-emerald-400 mx-auto mb-3"/>
          <p className="text-white font-bold text-lg mb-1">No injuries reported</p>
          <p className="text-slate-500 text-sm">All players in {activeLeague} are fit!</p>
        </div>
      )}

      {/* Injuries by team */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-6">
          {Object.entries(byTeam).sort((a, b) => b[1].players.length - a[1].players.length).map(([team, data]) => (
            <div key={team}>
              <div className="flex items-center gap-3 mb-3">
                {data.logo && <img src={data.logo} alt="" className="w-6 h-6 object-contain"/>}
                <h3 className="text-white font-black text-sm">{team.replace(/ FC$| AFC$/, '')}</h3>
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg,${lg?.color || '#22d3ee'}30,transparent)` }}/>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ color: lg?.color || '#22d3ee', background: `${lg?.color || '#22d3ee'}12`, border: `1px solid ${lg?.color || '#22d3ee'}25` }}>
                  {data.players.length} out
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.players.map((inj, i) => <InjuryCard key={i} injury={inj}/>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}