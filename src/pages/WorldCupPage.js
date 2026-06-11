import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import NavBar from '../components/NavBar';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/* ── Icons ── */
const I = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const TrophyIcon   = (p) => <I {...p} d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></>}/>;
const CalendarIcon = (p) => <I {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
const GridIcon     = (p) => <I {...p} d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>}/>;
const TargetIcon   = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const GitBranchIcon= (p) => <I {...p} d={<><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></>}/>;

/* ── Match status styling (mirrors LiveScoresPage) ── */
const LIVE = new Set(['1H', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT']);
const FINISHED = new Set(['FT', 'AET', 'PEN']);

const fmtKickoff = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const StatusBadge = ({ m }) => {
  if (LIVE.has(m.status)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold"
        style={{ background: 'rgba(239,68,68,0.14)', color: '#ef4444' }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
        {m.minute ? `${m.minute}'` : 'LIVE'}
      </span>
    );
  }
  if (m.status === 'HT') return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: 'rgba(245,158,11,0.14)', color: '#f59e0b' }}>HT</span>;
  if (FINISHED.has(m.status)) return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(100,116,139,0.12)', color: '#94a3b8' }}>{m.status}</span>;
  return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: 'rgba(34,211,238,0.10)', color: '#22d3ee' }}>{fmtKickoff(m.date)}</span>;
};

/* ── A single match row ── */
const MatchRow = ({ m }) => {
  const played = LIVE.has(m.status) || FINISHED.has(m.status) || m.status === 'HT';
  const Side = ({ name, logo, score, win }) => (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {logo && <img src={logo} alt="" width="22" height="22" loading="lazy" className="w-[22px] h-[22px] object-contain flex-shrink-0" />}
      <span className={`truncate text-sm ${win ? 'font-bold text-white' : 'text-white/85'}`}>{name || 'TBD'}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <Side name={m.homeTeam} logo={m.homeLogo} win={m.homeWin} />
        <Side name={m.awayTeam} logo={m.awayLogo} win={m.awayWin} />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {played ? (
          <>
            <span className="text-sm font-bold tabular-nums text-white">{m.homeScore ?? 0}</span>
            <span className="text-sm font-bold tabular-nums text-white">{m.awayScore ?? 0}</span>
          </>
        ) : (
          <StatusBadge m={m} />
        )}
      </div>
      {played && <div className="pl-2"><StatusBadge m={m} /></div>}
    </div>
  );
};

const KNOCKOUT_ORDER = ['Round of 32', 'Round of 16', 'Quarter-finals', 'Quarter-final', 'Semi-finals', 'Semi-final', '3rd Place Final', 'Final'];

export default function WorldCupPage({ onNavigate }) {
  const [tab, setTab] = useState('groups');
  const [standings, setStandings] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [scorers, setScorers] = useState([]);
  const [live, setLive] = useState([]);
  const [loading, setLoading] = useState({ standings: true, fixtures: true, scorers: true });

  useEffect(() => {
    fetchWithTimeout(`${API_BASE}/wc/standings`).then(r => r.ok ? r.json() : []).then(d => setStandings(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(s => ({ ...s, standings: false })));
    fetchWithTimeout(`${API_BASE}/wc/fixtures`).then(r => r.ok ? r.json() : []).then(d => setFixtures(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(s => ({ ...s, fixtures: false })));
    fetchWithTimeout(`${API_BASE}/wc/scorers`).then(r => r.ok ? r.json() : []).then(d => setScorers(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(s => ({ ...s, scorers: false })));
  }, []);

  // Live poll
  const loadLive = useCallback(() => {
    fetchWithTimeout(`${API_BASE}/wc/live`).then(r => r.ok ? r.json() : []).then(d => setLive(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  useEffect(() => {
    loadLive();
    const t = setInterval(loadLive, 45000);
    return () => clearInterval(t);
  }, [loadLive]);

  const knockout = useMemo(() => {
    const ko = fixtures.filter(f => f.stage === 'knockout');
    const byRound = {};
    ko.forEach(f => { (byRound[f.round] = byRound[f.round] || []).push(f); });
    const order = (r) => { const i = KNOCKOUT_ORDER.findIndex(k => r.toLowerCase().includes(k.toLowerCase())); return i === -1 ? 99 : i; };
    return Object.keys(byRound).sort((a, b) => order(a) - order(b)).map(r => ({ round: r, matches: byRound[r] }));
  }, [fixtures]);

  const fixturesByDay = useMemo(() => {
    const days = {};
    fixtures.forEach(f => {
      const key = f.date ? new Date(f.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD';
      (days[key] = days[key] || []).push(f);
    });
    return Object.entries(days);
  }, [fixtures]);

  const TABS = [
    { id: 'groups', label: 'Groups', icon: GridIcon },
    { id: 'fixtures', label: 'Fixtures', icon: CalendarIcon },
    { id: 'bracket', label: 'Bracket', icon: GitBranchIcon },
    { id: 'scorers', label: 'Scorers', icon: TargetIcon },
  ];

  return (
    <div className="min-h-screen bg-[#050810] text-white overflow-x-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <NavBar currentPage="worldcup" onNavigate={onNavigate} />

      <div className="max-w-3xl mx-auto px-4 pt-5 pb-24">
        {/* Hero */}
        <div className="rounded-2xl border border-white/[0.07] p-5 mb-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.10), rgba(155,108,245,0.10), rgba(5,8,16,0.9))' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <TrophyIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight">FIFA World Cup 2026</h1>
              <p className="text-sm text-white/60">USA · Canada · Mexico — Jun 11 to Jul 19, 2026</p>
            </div>
          </div>
        </div>

        {/* Live strip */}
        {live.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#ef4444' }}>Live now</span>
            </div>
            <div className="flex flex-col gap-2">
              {live.map(m => <MatchRow key={m.id} m={m} />)}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5 rounded-2xl p-1.5 border border-white/[0.06] overflow-x-auto" style={{ background: 'rgba(10,14,26,0.6)' }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors"
                style={active ? { background: 'rgba(34,211,238,0.15)', color: '#22d3ee' } : { color: 'rgba(255,255,255,0.6)' }}>
                <Icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </div>

        {/* GROUPS */}
        {tab === 'groups' && (
          loading.standings ? <Loading /> :
          standings.length === 0 ? <Empty text="Group tables will appear once the tournament data is published." /> :
          <div className="grid sm:grid-cols-2 gap-4">
            {standings.map(g => (
              <div key={g.group} className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: 'rgba(17,24,39,0.4)' }}>
                <div className="px-4 py-2.5 text-sm font-bold" style={{ background: 'rgba(255,255,255,0.04)' }}>{g.group}</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] text-white/40">
                      <th className="text-left font-medium px-3 py-1.5">Team</th>
                      <th className="font-medium px-1.5">P</th><th className="font-medium px-1.5">GD</th><th className="font-medium px-2">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.table.map((r, i) => (
                      <tr key={r.team} className="border-t border-white/[0.04]" style={i < 2 ? { background: 'rgba(34,211,238,0.05)' } : {}}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-white/35 text-xs w-3">{r.rank}</span>
                            {r.logo && <img src={r.logo} alt="" width="18" height="18" loading="lazy" className="w-[18px] h-[18px] object-contain" />}
                            <span className="truncate">{r.team}</span>
                          </div>
                        </td>
                        <td className="text-center text-white/70 px-1.5">{r.played}</td>
                        <td className="text-center text-white/70 px-1.5">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                        <td className="text-center font-bold px-2">{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* FIXTURES */}
        {tab === 'fixtures' && (
          loading.fixtures ? <Loading /> :
          fixtures.length === 0 ? <Empty text="The match schedule will appear here." /> :
          <div className="flex flex-col gap-5">
            {fixturesByDay.map(([day, matches]) => (
              <div key={day}>
                <div className="text-xs font-bold uppercase tracking-wide text-white/40 mb-2">{day}</div>
                <div className="flex flex-col gap-2">{matches.map(m => <MatchRow key={m.id} m={m} />)}</div>
              </div>
            ))}
          </div>
        )}

        {/* BRACKET */}
        {tab === 'bracket' && (
          loading.fixtures ? <Loading /> :
          knockout.length === 0 ? <Empty text="The knockout bracket appears once the group stage ends." /> :
          <div className="flex flex-col gap-5">
            {knockout.map(({ round, matches }) => (
              <div key={round}>
                <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#22d3ee' }}>{round}</div>
                <div className="flex flex-col gap-2">{matches.map(m => <MatchRow key={m.id} m={m} />)}</div>
              </div>
            ))}
          </div>
        )}

        {/* SCORERS */}
        {tab === 'scorers' && (
          loading.scorers ? <Loading /> :
          scorers.length === 0 ? <Empty text="Top scorers will appear once matches are played." /> :
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: 'rgba(17,24,39,0.4)' }}>
            {scorers.map((p, i) => (
              <div key={`${p.name}-${i}`} className="flex items-center gap-3 px-4 py-2.5 border-t border-white/[0.04] first:border-t-0">
                <span className="text-white/35 text-sm w-5 text-center">{i + 1}</span>
                {p.photo && <img src={p.photo} alt="" width="32" height="32" loading="lazy" className="w-8 h-8 rounded-full object-cover" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-white/50 flex items-center gap-1.5">
                    {p.teamLogo && <img src={p.teamLogo} alt="" width="14" height="14" loading="lazy" className="w-3.5 h-3.5 object-contain" />}
                    {p.team}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold" style={{ color: '#22d3ee' }}>{p.goals ?? 0}</div>
                  <div className="text-[10px] text-white/40 uppercase">goals</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const Loading = () => (
  <div className="flex flex-col gap-2">
    {[0, 1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
  </div>
);

const Empty = ({ text }) => (
  <div className="text-center py-16 rounded-2xl border border-white/[0.06]" style={{ background: 'rgba(17,24,39,0.4)' }}>
    <p className="text-white/50 text-sm px-6">{text}</p>
  </div>
);
