import React, { useState, useRef, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const I = ({ d, className = "w-5 h-5" }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>);
const SearchIcon = (p) => <I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const XIcon = (p) => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const UserIcon = (p) => <I {...p} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>;
const LoaderIcon = (p) => <I {...p} d={<><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>}/>;
const BarChartIcon = (p) => <I {...p} d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}/>;
const ActivityIcon = (p) => <I {...p} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>;
const TargetIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const AwardIcon = (p) => <I {...p} d={<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>}/>;
const PlayIcon = (p) => <I {...p} d={<polygon points="5 3 19 12 5 21 5 3"/>}/>;
const UsersIcon = (p) => <I {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const HistoryIcon = (p) => <I {...p} d={<><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></>}/>;
const GlobeIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}/>;
const BrainIcon = (p) => <I {...p} d={<><path d="M9.5 2A5.5 5.5 0 0 0 5 6a5.5 5.5 0 0 0 .4 2A5.5 5.5 0 0 0 4 13.5a5.5 5.5 0 0 0 3.5 5.1V22h5v-3.4a5.5 5.5 0 0 0 3.5-5.1 5.5 5.5 0 0 0-1.4-5.5A5.5 5.5 0 0 0 15 6a5.5 5.5 0 0 0-5.5-4Z"/><path d="M12 2v20"/></>}/>;
const ChevronRightIcon = (p) => <I {...p} d={<polyline points="9 18 15 12 9 6"/>}/>;
const LayersIcon = (p) => <I {...p} d={<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>}/>;
const TrendingUpIcon = (p) => <I {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;

const POSITION_COLORS = {
  Attacker: 'text-red-400 bg-red-500/10 border-red-500/20',
  Forward: 'text-red-400 bg-red-500/10 border-red-500/20',
  Midfielder: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Defender: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Goalkeeper: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
};

const QUICK_ACTIONS = [
  { label: 'Match Prediction', desc: 'AI-powered match analysis', page: 'analysis', Icon: TargetIcon, color: '#22d3ee', gradient: 'from-cyan-500/10 to-cyan-600/5' },
  { label: 'Compare Players', desc: 'Side-by-side radar comparison', page: 'analytics', Icon: BarChartIcon, color: '#a855f7', gradient: 'from-purple-500/10 to-purple-600/5' },
  { label: 'Live Scores', desc: 'Real-time fixtures & results', page: 'live', Icon: ActivityIcon, color: '#ef4444', gradient: 'from-red-500/10 to-red-600/5' },
  { label: 'Season Simulator', desc: 'Predict final standings', page: 'simulator', Icon: PlayIcon, color: '#f59e0b', gradient: 'from-yellow-500/10 to-amber-600/5' },
];

const NAV_PAGES = [
  { label: 'AI Analysis', page: 'analysis', Icon: BrainIcon },
  { label: 'Player Analytics', page: 'analytics', Icon: BarChartIcon },
  { label: 'Players Database', page: 'players', Icon: UsersIcon },
  { label: 'Managers', page: 'managers', Icon: UserIcon },
  { label: 'League Dashboard', page: 'league', Icon: GlobeIcon },
  { label: 'Live Scores', page: 'live', Icon: ActivityIcon },
  { label: 'Season Simulator', page: 'simulator', Icon: PlayIcon },
  { label: 'Prediction History', page: 'history', Icon: HistoryIcon },
  { label: 'Top Performers', page: 'analytics', Icon: AwardIcon },
];

function GlobalSearch({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
    if (!open) { setQuery(''); setResults([]); setFocusIdx(-1); }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await fetch(`${API_BASE}/players/search?q=${encodeURIComponent(query)}&limit=8`);
        if (resp.ok) {
          const data = await resp.json();
          setResults(Array.isArray(data) ? data : []);
        }
      } catch {}
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Filter pages by query
  const filteredPages = query.length >= 1
    ? NAV_PAGES.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  const go = (page) => { setOpen(false); onNavigate(page); };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-500 hover:text-white hover:bg-white/[0.08] hover:border-white/15 transition-all group">
        <SearchIcon className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
        <span className="hidden lg:inline text-[11px] text-slate-600 group-hover:text-slate-400 transition-colors">Search...</span>
        <div className="hidden lg:flex items-center gap-0.5 ml-1">
          <kbd className="text-[8px] text-slate-700 bg-white/[0.04] px-1 py-0.5 rounded border border-white/[0.08] font-mono leading-none">Ctrl</kbd>
          <kbd className="text-[8px] text-slate-700 bg-white/[0.04] px-1 py-0.5 rounded border border-white/[0.08] font-mono leading-none">K</kbd>
        </div>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]" onClick={() => setOpen(false)}
        style={{ animation: 'gsFadeIn 0.15s ease-out' }} />

      {/* Modal */}
      <div className="fixed top-[12%] left-1/2 -translate-x-1/2 w-[92%] max-w-xl z-[101]"
        style={{ animation: 'gsSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)', fontFamily: "'Outfit', sans-serif" }}>
        <div className="bg-[#0c1222] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">

          {/* Input */}
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/15 to-purple-500/10 flex items-center justify-center flex-shrink-0 border border-white/[0.06]">
              <SearchIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <input ref={inputRef} type="text" value={query} onChange={e => { setQuery(e.target.value); setFocusIdx(-1); }}
              placeholder="Search players, teams, or pages..."
              className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-600 focus:outline-none" />
            {loading && <LoaderIcon className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />}
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/10 transition-all">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* Content */}
          <div className="max-h-[420px] overflow-y-auto py-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>

            {/* Player Results */}
            {results.length > 0 && (
              <div>
                <div className="px-5 py-1.5 flex items-center gap-2">
                  <UsersIcon className="w-3 h-3 text-slate-700" />
                  <span className="text-[11px] text-slate-600 uppercase tracking-[0.15em] font-bold">Players</span>
                  <span className="text-[11px] text-slate-700 ml-auto">{results.length} found</span>
                </div>
                {results.map((player, i) => (
                  <button key={player.id || i} onClick={() => go('analytics')}
                    className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.04] transition-all text-left group"
                    style={{ animation: `gsFadeSlide 0.15s ease-out ${i * 0.03}s both` }}>
                    {/* Photo */}
                    {player.photo ? (
                      <img src={player.photo} alt="" className="w-10 h-10 rounded-xl object-cover bg-white/5 flex-shrink-0 border border-white/[0.06]" onError={e => e.target.style.display = 'none'} />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/5 flex items-center justify-center flex-shrink-0 border border-white/[0.06]">
                        <span className="text-cyan-400/60 font-bold text-xs">{(player.name || '?')[0]}</span>
                      </div>
                    )}
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">{player.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {player.teamLogo && <img src={player.teamLogo} alt="" className="w-3.5 h-3.5" />}
                        <span className="text-[12px] text-slate-500 truncate">{player.team}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border ${POSITION_COLORS[player.position] || 'text-slate-400 bg-white/5 border-white/10'}`}>{player.position}</span>
                      </div>
                    </div>
                    {/* Stats */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-[12px] text-slate-500" style={{ fontFamily: 'JetBrains Mono' }}>{player.goals || 0}G {player.assists || 0}A</span>
                      </div>
                      {player.rating > 0 && (
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black text-white shadow-lg ${
                          player.rating >= 7.5 ? 'bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-emerald-500/20' :
                          player.rating >= 7.0 ? 'bg-gradient-to-br from-cyan-500 to-cyan-400 shadow-cyan-500/20' :
                          player.rating >= 6.5 ? 'bg-gradient-to-br from-yellow-500 to-yellow-400 shadow-yellow-500/20' :
                          'bg-gradient-to-br from-slate-500 to-slate-400'
                        }`} style={{ fontFamily: 'JetBrains Mono' }}>{player.rating?.toFixed(1)}</div>
                      )}
                      <ChevronRightIcon className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Page Results */}
            {filteredPages.length > 0 && (
              <div>
                {results.length > 0 && <div className="h-px bg-white/[0.04] mx-5 my-1" />}
                <div className="px-5 py-1.5 flex items-center gap-2">
                  <LayersIcon className="w-3 h-3 text-slate-700" />
                  <span className="text-[11px] text-slate-600 uppercase tracking-[0.15em] font-bold">Pages</span>
                </div>
                {filteredPages.map((p, i) => (
                  <button key={i} onClick={() => go(p.page)}
                    className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.04] transition-all text-left group">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 border border-white/[0.05] group-hover:border-white/10 transition-colors">
                      <p.Icon className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{p.label}</span>
                    <ChevronRightIcon className="w-3 h-3 text-slate-700 ml-auto group-hover:text-slate-400 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {query.length >= 2 && !loading && results.length === 0 && filteredPages.length === 0 && (
              <div className="px-5 py-10 text-center">
                <SearchIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm font-medium">No results for "{query}"</p>
                <p className="text-slate-700 text-[12px] mt-1">Try a player name, team, or page</p>
              </div>
            )}

            {/* Quick Actions (empty state) */}
            {!query && (
              <>
                <div className="px-5 py-1.5 flex items-center gap-2">
                  <TrendingUpIcon className="w-3 h-3 text-slate-700" />
                  <span className="text-[11px] text-slate-600 uppercase tracking-[0.15em] font-bold">Quick Actions</span>
                </div>
                <div className="px-4 pb-2 grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action, i) => (
                    <button key={i} onClick={() => go(action.page)}
                      className={`bg-gradient-to-br ${action.gradient} rounded-xl p-3.5 border border-white/[0.05] hover:border-white/10 transition-all text-left group`}
                      style={{ animation: `gsFadeSlide 0.2s ease-out ${i * 0.05}s both` }}>
                      <action.Icon className="w-4 h-4 mb-2 transition-colors" style={{ color: action.color }} />
                      <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">{action.label}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">{action.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="h-px bg-white/[0.04] mx-5 my-1" />

                <div className="px-5 py-1.5 flex items-center gap-2">
                  <LayersIcon className="w-3 h-3 text-slate-700" />
                  <span className="text-[11px] text-slate-600 uppercase tracking-[0.15em] font-bold">All Pages</span>
                </div>
                {NAV_PAGES.map((p, i) => (
                  <button key={i} onClick={() => go(p.page)}
                    className="w-full flex items-center gap-3 px-5 py-2 hover:bg-white/[0.04] transition-all text-left group">
                    <p.Icon className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    <span className="text-[11px] text-slate-500 group-hover:text-white transition-colors">{p.label}</span>
                    <ChevronRightIcon className="w-3 h-3 text-slate-800 ml-auto group-hover:text-slate-500 transition-colors" />
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="px-5 py-2.5 flex items-center gap-4 text-[11px] text-slate-700">
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.03] font-mono leading-none">Esc</kbd>
              <span>close</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.03] font-mono leading-none">Ctrl</kbd>
              <kbd className="px-1.5 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.03] font-mono leading-none">K</kbd>
              <span>search</span>
            </div>
            <span className="ml-auto text-slate-800">Football Analyst AI</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gsFadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes gsSlideIn{from{opacity:0;transform:translate(-50%,-16px) scale(0.98);}to{opacity:1;transform:translate(-50%,0) scale(1);}}
        @keyframes gsFadeSlide{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
      `}</style>
    </>
  );
}

export default GlobalSearch;