import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const I = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const AlertIcon    = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}/>;
const RefreshIcon  = p => <I {...p} d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>}/>;
const ShieldIcon   = p => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const UserIcon     = p => <I {...p} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>;
const SearchIcon   = p => <I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const GridIcon     = p => <I {...p} d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>}/>;
const ListIcon     = p => <I {...p} d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>}/>;
const ActivityIcon = p => <I {...p} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>;
const ZapIcon      = p => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const InfoIcon     = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>}/>;

const LEAGUES = [
  { name: 'Premier League', color: '#7c3aed', logo: 'https://media.api-sports.io/football/leagues/39.png'  },
  { name: 'La Liga',        color: '#dc2626', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { name: 'Bundesliga',     color: '#d97706', logo: 'https://media.api-sports.io/football/leagues/78.png'  },
  { name: 'Serie A',        color: '#059669', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { name: 'Ligue 1',        color: '#2563eb', logo: 'https://media.api-sports.io/football/leagues/61.png'  },
  { name: 'Primeira Liga',  color: '#10b981', logo: 'https://media.api-sports.io/football/leagues/94.png'  },
];

const SEVERITY_MAP = {
  'Hamstring': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  icon: '🦵', level: 'High'   },
  'Muscle':    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  icon: '💪', level: 'High'   },
  'Knee':      { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)', icon: '🦴', level: 'High'   },
  'ACL':       { color: '#dc2626', bg: 'rgba(220,38,38,0.15)',  border: 'rgba(220,38,38,0.3)',   icon: '🔴', level: 'Severe' },
  'Ankle':     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', icon: '🦶', level: 'Medium' },
  'Thigh':     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)', icon: '🦵', level: 'Medium' },
  'Calf':      { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', icon: '🦵', level: 'Medium' },
  'Groin':     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)', icon: '⚠️', level: 'Medium' },
  'Back':      { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', icon: '🔶', level: 'Medium' },
  'Shoulder':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', icon: '💛', level: 'Medium' },
  'Illness':   { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)', icon: '🤒', level: 'Low'    },
  'Doubtful':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  icon: '❓', level: 'Doubt'  },
  'Suspended': { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)', icon: '🟥', level: 'Susp'   },
  'default':   { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', icon: '⚪', level: 'Unknown'},
};

const getSeverity = type => {
  if (!type) return SEVERITY_MAP.default;
  const key = Object.keys(SEVERITY_MAP).find(k => type.toLowerCase().includes(k.toLowerCase()));
  return SEVERITY_MAP[key] || SEVERITY_MAP.default;
};

const ChanceBar = ({ chance }) => {
  if (chance === null || chance === undefined) return null;
  const pct   = chance ?? 0;
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : pct >= 25 ? '#f97316' : '#ef4444';
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Chance of Playing</span>
        <span className="text-[11px] font-black" style={{ color, fontFamily: 'monospace' }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color}80,${color})` }}/>
      </div>
    </div>
  );
};

const InjuryCard = ({ injury, leagueColor, viewMode }) => {
  const sev         = getSeverity(injury.type);
  const isSuspended = (injury.type||'').toLowerCase().includes('suspen');
  const isDoubtful  = (injury.type||'').toLowerCase().includes('doubt') || (injury.reason||'').toLowerCase().includes('doubt');
  const hasNews     = injury.news && injury.news.length > 0;
  const statusColor = isSuspended ? '#a855f7' : isDoubtful ? '#f59e0b' : '#ef4444';
  const statusLabel = isSuspended ? 'Suspended' : isDoubtful ? 'Doubtful' : 'Out';

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:border-white/15"
        style={{ background: 'rgba(10,14,26,0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: sev.color }}/>
        <div className="relative flex-shrink-0">
          {injury.playerPhoto
            ? <img src={injury.playerPhoto} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10" onError={e=>e.target.style.display='none'}/>
            : <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10" style={{ background: sev.bg }}>
                <UserIcon className="w-4 h-4" style={{ color: sev.color }}/>
              </div>}
          {injury.teamLogo && <img src={injury.teamLogo} alt="" className="absolute -bottom-0.5 -right-0.5 w-4 h-4 object-contain rounded-full bg-[#080c14] border border-[#080c14]"/>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{injury.player}</p>
          <p className="text-slate-500 text-xs truncate">{(injury.team||'').replace(/ FC$| AFC$/,'')}</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color }}>
          {sev.icon} {injury.type || 'Injury'}
        </span>
        <div className="flex-shrink-0 text-right">
          <span className="text-xs font-black px-2 py-1 rounded-full"
            style={{ background: `${statusColor}10`, border: `1px solid ${statusColor}20`, color: statusColor }}>
            {statusLabel}
          </span>
          {injury.games_missed > 0 && <p className="text-[10px] text-slate-600 mt-0.5">{injury.games_missed}g missed</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border overflow-hidden transition-all hover:scale-[1.01] hover:border-white/12 relative"
      style={{ background: 'rgba(8,12,22,0.9)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg,${sev.color},${sev.color}40,transparent)` }}/>
      {injury.source && (
        <div className="absolute top-3 right-3 text-[9px] font-black px-1.5 py-0.5 rounded-md"
          style={{ background: injury.source==='FPL'?'rgba(34,211,238,0.1)':'rgba(255,255,255,0.06)',
                   color: injury.source==='FPL'?'#22d3ee':'#64748b',
                   border: `1px solid ${injury.source==='FPL'?'rgba(34,211,238,0.2)':'rgba(255,255,255,0.08)'}` }}>
          {injury.source}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="relative flex-shrink-0">
            {injury.playerPhoto
              ? <img src={injury.playerPhoto} alt="" className="w-14 h-14 rounded-xl object-cover border border-white/10" onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}/>
              : null}
            <div className="w-14 h-14 rounded-xl border border-white/10 items-center justify-center" style={{ background: sev.bg, display: injury.playerPhoto?'none':'flex' }}>
              <UserIcon className="w-6 h-6" style={{ color: sev.color }}/>
            </div>
            {injury.teamLogo && <img src={injury.teamLogo} alt="" className="absolute -bottom-1 -right-1 w-5 h-5 object-contain rounded-full bg-[#080c14] border border-[#080c14]"/>}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-white font-black text-sm leading-tight truncate">{injury.player}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {injury.teamLogo && <img src={injury.teamLogo} alt="" className="w-3.5 h-3.5 object-contain flex-shrink-0"/>}
              <span className="text-xs text-slate-500 truncate">{(injury.team||'').replace(/ FC$| AFC$/,'')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color }}>
            {sev.icon} {injury.type || 'Injury'}
          </span>
        </div>
        {hasNews && <p className="text-[11px] text-slate-500 leading-relaxed mb-2 line-clamp-2">{injury.news}</p>}
        {injury.chanceOfPlaying !== null && injury.chanceOfPlaying !== undefined && <ChanceBar chance={injury.chanceOfPlaying}/>}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.05]">
          <span className="text-[11px] text-slate-600">
            {injury.games_missed > 0 ? `${injury.games_missed} game${injury.games_missed>1?'s':''} missed` : ''}
          </span>
          <span className="text-xs font-black px-2 py-0.5 rounded-full"
            style={{ background: `${statusColor}10`, border: `1px solid ${statusColor}20`, color: statusColor }}>
            {statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function InjuryTracker() {
  const [injuries,     setInjuries]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [activeLeague, setActiveLeague] = useState('Premier League');
  const [search,       setSearch]       = useState('');
  const [filterType,   setFilterType]   = useState('All');
  const [viewMode,     setViewMode]     = useState('grid');

  const fetchInjuries = async league => {
    setLoading(true); setError('');
    try {
      const resp = await fetch(`${API_BASE}/injuries/${encodeURIComponent(league)}`);
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();
      setInjuries(Array.isArray(data) ? data : []);
    } catch {
      setError('Could not load injury data.');
      setInjuries([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchInjuries(activeLeague); }, [activeLeague]);

  const lg           = LEAGUES.find(l => l.name === activeLeague);
  const injuryTypes  = ['All', ...new Set(injuries.map(i => i.type).filter(Boolean))];
  const filtered     = injuries.filter(i => {
    const q = search.toLowerCase();
    return (!q || (i.player||'').toLowerCase().includes(q) || (i.team||'').toLowerCase().includes(q)) &&
           (filterType === 'All' || i.type === filterType);
  });

  const byTeam = {};
  filtered.forEach(i => {
    const t = i.team || 'Unknown';
    if (!byTeam[t]) byTeam[t] = { logo: i.teamLogo, players: [] };
    byTeam[t].players.push(i);
  });

  const totalOut   = filtered.filter(i => !(i.type||'').toLowerCase().includes('suspen') && !(i.type||'').toLowerCase().includes('doubt')).length;
  const totalSusp  = filtered.filter(i => (i.type||'').toLowerCase().includes('suspen')).length;
  const totalDoubt = filtered.filter(i => (i.type||'').toLowerCase().includes('doubt') || (i.reason||'').toLowerCase().includes('doubt')).length;
  const muscleCount= filtered.filter(i => (i.type||'').toLowerCase().includes('muscle') || (i.type||'').toLowerCase().includes('hamstring')).length;
  const fplCount   = filtered.filter(i => i.source === 'FPL').length;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* League tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {LEAGUES.map(l => (
          <button key={l.name} onClick={() => { setActiveLeague(l.name); setSearch(''); setFilterType('All'); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border"
            style={{ borderColor: activeLeague===l.name?`${l.color}40`:'rgba(255,255,255,0.08)', color: activeLeague===l.name?l.color:'#64748b', background: activeLeague===l.name?`${l.color}12`:'rgba(255,255,255,0.03)' }}>
            <img src={l.logo} alt="" className="w-4 h-4 object-contain"/>
            <span className="hidden sm:inline">{l.name.replace(' League','').replace('Primeira Liga','Liga Port.')}</span>
          </button>
        ))}
        <button onClick={() => fetchInjuries(activeLeague)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all border ml-auto"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#64748b' }}>
          <RefreshIcon className={`w-3.5 h-3.5 ${loading?'animate-spin':''}`}/>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stats */}
      {!loading && injuries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Injured',          value: totalOut,                   color: '#ef4444', icon: <AlertIcon className="w-4 h-4"/>    },
            { label: 'Doubtful',         value: totalDoubt,                 color: '#f59e0b', icon: <ZapIcon className="w-4 h-4"/>      },
            { label: 'Suspended',        value: totalSusp,                  color: '#a855f7', icon: <ShieldIcon className="w-4 h-4"/>   },
            { label: 'Muscle/Hamstring', value: muscleCount,                color: '#f97316', icon: <ActivityIcon className="w-4 h-4"/> },
            { label: 'Teams Affected',   value: Object.keys(byTeam).length, color: lg?.color||'#22d3ee', icon: <UserIcon className="w-4 h-4"/> },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-3 border border-white/[0.06] relative overflow-hidden"
              style={{ background: `linear-gradient(135deg,${s.color}08,rgba(8,12,22,0.95))` }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,${s.color}50,transparent)` }}/>
              <div className="flex items-center gap-1.5 mb-1" style={{ color: s.color }}>
                {s.icon}
                <span className="text-[10px] uppercase tracking-widest font-bold">{s.label}</span>
              </div>
              <p className="text-2xl font-black text-white" style={{ fontFamily: 'JetBrains Mono' }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* FPL notice */}
      {!loading && activeLeague === 'Premier League' && fplCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 border"
          style={{ background: 'rgba(34,211,238,0.05)', borderColor: 'rgba(34,211,238,0.15)' }}>
          <InfoIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0"/>
          <span className="text-xs text-cyan-300">Premier League data from the <strong>official FPL API</strong> — real-time updates including chance of playing %</span>
        </div>
      )}

      {/* Search + filter + view toggle */}
      {!loading && injuries.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap items-center">
          <div className="relative flex-1 min-w-[180px]">
            <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search player or team..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 border focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: search?'rgba(34,211,238,0.3)':'rgba(255,255,255,0.08)' }}/>
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm font-bold border focus:outline-none"
            style={{ background: 'rgba(8,12,22,0.9)', borderColor: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
            {injuryTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex rounded-xl border border-white/[0.08] overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {[{ id:'grid', Icon:GridIcon },{ id:'list', Icon:ListIcon }].map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                className="px-3 py-2.5 transition-all"
                style={{ background: viewMode===v.id?'rgba(34,211,238,0.12)':'transparent', color: viewMode===v.id?'#22d3ee':'#64748b' }}>
                <v.Icon className="w-4 h-4"/>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-20 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: lg?.color||'#22d3ee', borderTopColor: 'transparent' }}/>
          <p className="text-white font-bold">Loading {activeLeague} injuries…</p>
          <p className="text-slate-500 text-xs mt-1">Fetching from FPL API + Transfermarkt</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-2xl p-4 border border-red-500/20 mb-4 flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.06)' }}>
          <AlertIcon className="w-4 h-4 text-red-400 flex-shrink-0"/>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && injuries.length === 0 && (
        <div className="py-20 text-center rounded-2xl border border-white/8" style={{ background: 'rgba(17,24,39,0.5)' }}>
          <div className="text-4xl mb-3">✅</div>
          <p className="text-white font-bold text-lg mb-1">All Clear!</p>
          <p className="text-slate-500 text-sm">No injury reports for {activeLeague}</p>
        </div>
      )}

      {/* Injuries by team */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-6">
          {Object.entries(byTeam).sort((a,b) => b[1].players.length - a[1].players.length).map(([team, data]) => (
            <div key={team}>
              <div className="flex items-center gap-3 mb-3">
                {data.logo && <img src={data.logo} alt="" className="w-7 h-7 object-contain rounded-lg" onError={e=>e.target.style.display='none'}/>}
                <h3 className="text-white font-black text-sm">{team.replace(/ FC$| AFC$/,'')}</h3>
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg,${lg?.color||'#22d3ee'}25,transparent)` }}/>
                <div className="flex items-center gap-1.5">
                  {data.players.filter(p=>(p.type||'').toLowerCase().includes('suspen')).length > 0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
                      {data.players.filter(p=>(p.type||'').toLowerCase().includes('suspen')).length} susp
                    </span>
                  )}
                  <span className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{ color: lg?.color||'#22d3ee', background:`${lg?.color||'#22d3ee'}12`, border:`1px solid ${lg?.color||'#22d3ee'}20` }}>
                    {data.players.length} out
                  </span>
                </div>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.players.map((inj,i) => <InjuryCard key={i} injury={inj} leagueColor={lg?.color} viewMode="grid"/>)}
                </div>
              ) : (
                <div className="space-y-2">
                  {data.players.map((inj,i) => <InjuryCard key={i} injury={inj} leagueColor={lg?.color} viewMode="list"/>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-slate-600 text-xs text-center mt-8">
          {filtered.length} player{filtered.length!==1?'s':''} · Source: {activeLeague==='Premier League'?'FPL Official API':'Transfermarkt'}
        </p>
      )}
    </div>
  );
}