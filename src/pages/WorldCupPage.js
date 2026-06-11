import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import NavBar from '../components/NavBar';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WC_BADGE = 'https://media.api-sports.io/football/leagues/1.png';

const LIVE = new Set(['1H', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT']);
const FINISHED = new Set(['FT', 'AET', 'PEN']);
const KO_ORDER = ['Round of 32', 'Round of 16', 'Quarter', 'Semi', '3rd Place', 'Final'];

const fmtKick = (iso) => { if (!iso) return ''; try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
const fmtDay = (iso) => { if (!iso) return 'TBD'; try { return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }); } catch { return 'TBD'; } };

const STYLES = `
.wc-root{min-height:100vh;color:#eef2fb;font-family:'Inter',system-ui,sans-serif;position:relative;background:#080b16;-webkit-font-smoothing:antialiased}
.wc-bg{position:absolute;inset:0;pointer-events:none;background:
  radial-gradient(620px 460px at 8% 2%, rgba(155,124,255,.32), transparent 60%),
  radial-gradient(620px 460px at 95% 6%, rgba(45,212,255,.24), transparent 58%),
  radial-gradient(720px 520px at 72% 100%, rgba(219,39,119,.20), transparent 60%)}
.wc-wrap{position:relative;max-width:1180px;margin:0 auto;padding:0 18px 90px}
.wc-disp{font-family:'Oswald',sans-serif}
.wc-glass{background:rgba(255,255,255,.055);backdrop-filter:blur(18px) saturate(150%);-webkit-backdrop-filter:blur(18px) saturate(150%);border:1px solid rgba(255,255,255,.12);border-radius:20px}
.wc-hero{display:flex;align-items:center;gap:18px;padding:24px 26px;margin-top:14px;flex-wrap:wrap}
.wc-badge{width:62px;height:62px;border-radius:18px;background:rgba(255,255,255,.94);display:grid;place-items:center;padding:9px;flex-shrink:0}
.wc-badge img{width:100%;height:100%;object-fit:contain}
.wc-eyebrow{font-family:'Oswald';letter-spacing:.26em;text-transform:uppercase;font-size:12px;color:#2dd4ff;font-weight:600}
.wc-h1{font-family:'Oswald';font-weight:700;font-size:38px;line-height:.98;text-transform:uppercase;margin:5px 0 6px}
.wc-sub{color:#9aa4bd;font-size:14px;font-weight:500}
.wc-lv{margin-left:auto;display:flex;align-items:center;gap:8px;font-family:'Oswald';text-transform:uppercase;letter-spacing:.1em;font-size:13px;color:#fff;padding:8px 14px;border-radius:999px;background:rgba(255,59,92,.16);border:1px solid rgba(255,59,92,.4)}
.wc-pulse{width:8px;height:8px;border-radius:50%;background:#ff3b5c;animation:wcpulse 1.4s infinite}
@keyframes wcpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}
.wc-tabbar{display:flex;gap:6px;margin:18px 0 22px;padding:7px;width:fit-content;max-width:100%;overflow-x:auto}
.wc-tab{display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:13px;font-family:'Oswald';text-transform:uppercase;letter-spacing:.07em;font-size:14px;font-weight:600;color:#9aa4bd;cursor:pointer;border:none;background:transparent;white-space:nowrap}
.wc-tab.on{color:#06101f;background:linear-gradient(135deg,#2dd4ff,#62e3ff)}
.wc-ggrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.wc-group{overflow:hidden}
.wc-ghead{font-family:'Oswald';text-transform:uppercase;letter-spacing:.12em;font-size:14px;font-weight:600;padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.12);color:#2dd4ff}
.wc-tbl{width:100%;border-collapse:collapse;font-size:14px}
.wc-tbl thead th{font-size:11px;color:#9aa4bd;font-weight:500;text-transform:uppercase;letter-spacing:.05em;padding:8px 6px;text-align:center}
.wc-tbl thead th.l{text-align:left;padding-left:16px}
.wc-tbl tbody td{padding:10px 6px;text-align:center;font-variant-numeric:tabular-nums;border-top:1px solid rgba(255,255,255,.06)}
.wc-tbl tbody td.tm{text-align:left;padding-left:16px}
.wc-tbl tbody tr.q td{background:rgba(45,212,255,.06)}
.wc-tbl tbody tr.q td:first-child{box-shadow:inset 3px 0 0 #2dd4ff}
.wc-tcell{display:flex;align-items:center;gap:9px}
.wc-tcell img{width:21px;height:14px;border-radius:2px;object-fit:cover}
.wc-tcell .r{color:#9aa4bd;font-size:12px;width:12px}
.wc-tcell .nm{font-family:'Oswald';font-weight:500;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px}
.wc-pts{font-family:'Oswald';font-weight:700;color:#fff}
.wc-legend{color:#9aa4bd;font-size:12px;font-style:italic;margin:16px 4px 0}
.wc-dayhdr{font-family:'Oswald';text-transform:uppercase;letter-spacing:.16em;font-size:13px;color:#9aa4bd;font-weight:600;margin:18px 4px 12px}
.wc-fxgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.wc-card{padding:15px 18px;overflow:hidden}
.wc-card.live{border-color:rgba(255,59,92,.4)}
.wc-cgrid{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center}
.wc-teams{display:flex;flex-direction:column;gap:10px}
.wc-team{display:flex;align-items:center;gap:11px}
.wc-team img{width:28px;height:20px;border-radius:3px;object-fit:cover;box-shadow:0 0 0 1px rgba(255,255,255,.08)}
.wc-team .nm{font-family:'Oswald';font-weight:600;font-size:18px}
.wc-team.lose .nm{color:#9aa4bd}
.wc-score{font-family:'Oswald';font-weight:700;font-size:24px;line-height:1.3;text-align:center;min-width:22px;font-variant-numeric:tabular-nums}
.wc-pill{font-family:'Oswald';text-transform:uppercase;letter-spacing:.1em;font-size:12px;font-weight:600;padding:5px 11px;border-radius:999px;white-space:nowrap}
.wc-pill.lv{color:#fff;background:rgba(255,59,92,.18);border:1px solid rgba(255,59,92,.42);display:flex;align-items:center;gap:7px}
.wc-pill.tm{color:#2dd4ff;background:rgba(45,212,255,.12);border:1px solid rgba(45,212,255,.28)}
.wc-tbd{font-family:'Inter';font-weight:500;font-size:14px;font-style:italic;color:#9aa4bd}
.wc-scgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.wc-lead{overflow:hidden}
.wc-lhead{font-family:'Oswald';text-transform:uppercase;letter-spacing:.1em;font-size:14px;font-weight:600;padding:13px 18px;border-bottom:1px solid rgba(255,255,255,.12)}
.wc-lhead.g{color:#ffce5c}.wc-lhead.a{color:#2dd4ff}
.wc-lrow{display:flex;align-items:center;gap:12px;padding:11px 18px;border-top:1px solid rgba(255,255,255,.05)}
.wc-lrow:first-of-type{border-top:none}
.wc-lr{font-family:'Oswald';color:#9aa4bd;font-size:15px;width:18px;text-align:center}
.wc-av{width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;background:#1a2138}
.wc-linfo{flex:1;min-width:0}
.wc-lname{font-family:'Oswald';font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wc-lteam{display:flex;align-items:center;gap:7px;color:#9aa4bd;font-size:12px;margin-top:1px}
.wc-lteam img{width:16px;height:11px;border-radius:2px;object-fit:cover}
.wc-lbig{font-family:'Oswald';font-weight:700;font-size:22px;text-align:center}
.wc-lbig.g{color:#ffce5c}.wc-lbig.a{color:#2dd4ff}
.wc-lsub{font-size:10px;color:#9aa4bd;text-transform:uppercase;text-align:center}
.wc-basis{display:flex;align-items:center;gap:8px;color:#9aa4bd;font-size:12px;font-style:italic;margin:0 4px 16px}
.wc-pfeat{padding:22px 24px;margin-bottom:14px}
.wc-pmatch{display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:20px}
.wc-pside{display:flex;flex-direction:column;align-items:center;gap:8px;width:130px}
.wc-pside img{width:46px;height:32px;border-radius:4px;object-fit:cover;box-shadow:0 0 0 1px rgba(255,255,255,.12)}
.wc-pside .pn{font-family:'Oswald';font-weight:600;font-size:16px;text-align:center}
.wc-pvs{font-family:'Oswald';color:#9aa4bd;font-size:13px}
.wc-ptop{display:grid;grid-template-columns:auto 1fr;gap:26px;align-items:center;margin-bottom:18px}
.wc-ring{width:144px;height:144px;border-radius:50%;display:grid;place-items:center;position:relative}
.wc-ring .hole{position:absolute;width:102px;height:102px;border-radius:50%;background:#0c1120}
.wc-ring .rc{position:relative;text-align:center}
.wc-ring .rp{font-family:'Oswald';font-weight:700;font-size:28px;line-height:1}
.wc-ring .rl{font-size:11px;color:#2dd4ff;text-transform:uppercase;letter-spacing:.08em;margin-top:3px}
.wc-plegend{display:flex;flex-direction:column;gap:9px}
.wc-plg{display:flex;align-items:center;gap:9px;font-size:13px}
.wc-plg .sw{width:11px;height:11px;border-radius:3px}.wc-plg b{font-family:'Oswald';font-weight:600;margin-left:auto;font-size:15px}
.wc-conf{margin-top:13px}
.wc-confhead{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#9aa4bd;margin-bottom:6px}
.wc-conftag{font-family:'Oswald';text-transform:uppercase;letter-spacing:.07em;font-weight:600}
.wc-confbar{height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
.wc-confbar i{display:block;height:100%;background:linear-gradient(90deg,#2dd4ff,#27e0a3)}
.wc-pforms{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:4px 0 16px}
.wc-fl{font-size:11px;color:#9aa4bd;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px}
.wc-fbs{display:flex;gap:6px}
.wc-fb{width:23px;height:23px;border-radius:7px;display:grid;place-items:center;font-family:'Oswald';font-weight:600;font-size:12px}
.wc-fb.W{background:rgba(39,224,163,.18);color:#27e0a3}.wc-fb.D{background:rgba(250,204,21,.18);color:#facc15}.wc-fb.L{background:rgba(255,107,130,.18);color:#ff6b82}
.wc-pstats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:16px}
.wc-pstat{padding:10px 6px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);text-align:center}
.wc-pstat .v{font-family:'Oswald';font-weight:700;font-size:16px}
.wc-pstat .k{font-size:9px;color:#9aa4bd;text-transform:uppercase;letter-spacing:.03em;margin-top:3px}
.wc-pscores{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.wc-pscores .sl{font-size:11px;color:#9aa4bd;text-transform:uppercase;letter-spacing:.06em;margin-right:2px}
.wc-psc{font-family:'Oswald';font-size:13px;padding:5px 11px;border-radius:999px;background:rgba(45,212,255,.1);border:1px solid rgba(45,212,255,.24);color:#2dd4ff}
.wc-pmini{display:flex;align-items:center;gap:14px;padding:13px 18px;margin-bottom:10px;cursor:pointer;border:1px solid transparent}
.wc-pmini.sel{border-color:rgba(45,212,255,.35)}
.wc-pmini .mt{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.wc-pmini .mteam{display:flex;align-items:center;gap:9px;font-family:'Oswald';font-weight:500;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wc-pmini .mteam img{width:22px;height:15px;border-radius:2px;object-fit:cover;flex-shrink:0}
.wc-mbar{width:148px;flex-shrink:0}
.wc-mbar .b{display:flex;height:9px;border-radius:999px;overflow:hidden}
.wc-mbar .b i{display:block}.wc-mbar .h{background:#2dd4ff}.wc-mbar .d{background:#46506a}.wc-mbar .a{background:#9b7cff}
.wc-mbar .pct{display:flex;justify-content:space-between;font-family:'Oswald';font-size:11px;margin-top:5px;color:#9aa4bd}
.wc-skel{height:64px;border-radius:16px;background:rgba(255,255,255,.04);animation:wcpulse2 1.5s infinite}
@keyframes wcpulse2{0%,100%{opacity:.5}50%{opacity:.9}}
.wc-empty{text-align:center;padding:60px 20px;color:#9aa4bd;font-size:14px}
@media(max-width:980px){.wc-ggrid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:760px){.wc-fxgrid,.wc-scgrid{grid-template-columns:1fr}}
@media(max-width:560px){.wc-ggrid{grid-template-columns:1fr}.wc-h1{font-size:30px}.wc-ptop{grid-template-columns:1fr}.wc-pstats{grid-template-columns:repeat(3,1fr)}.wc-pmini{flex-wrap:wrap}.wc-mbar{width:100%}}
@media (prefers-reduced-motion:reduce){.wc-pulse,.wc-skel{animation:none}}
`;

const FormBadges = ({ form }) => (
  <div className="wc-fbs">
    {(form && form.length ? form : ['—', '—', '—', '—', '—']).map((r, i) => (
      <span key={i} className={`wc-fb ${r}`}>{r}</span>
    ))}
  </div>
);

const MatchRow = ({ m }) => {
  const played = LIVE.has(m.status) || FINISHED.has(m.status) || m.status === 'HT';
  const badge = LIVE.has(m.status)
    ? <span className="wc-pill lv"><span className="wc-pulse" />{m.minute ? `${m.minute}'` : 'LIVE'}</span>
    : m.status === 'HT' ? <span className="wc-pill lv">HT</span>
    : FINISHED.has(m.status) ? <span className="wc-pill tm">{m.status}</span>
    : <span className="wc-pill tm">{fmtKick(m.date)}</span>;
  return (
    <div className={`wc-card wc-glass ${LIVE.has(m.status) ? 'live' : ''}`}>
      <div className="wc-cgrid">
        <div className="wc-teams">
          <div className={`wc-team ${played && m.awayScore > m.homeScore ? 'lose' : ''}`}>
            {m.homeLogo && <img src={m.homeLogo} alt="" loading="lazy" />}<span className="nm">{m.homeTeam || 'TBD'}</span>
          </div>
          <div className={`wc-team ${played && m.homeScore > m.awayScore ? 'lose' : ''}`}>
            {m.awayLogo && <img src={m.awayLogo} alt="" loading="lazy" />}<span className="nm">{m.awayTeam || 'TBD'}</span>
          </div>
        </div>
        {played
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div><div className="wc-score">{m.homeScore ?? 0}</div><div className="wc-score">{m.awayScore ?? 0}</div></div>{badge}
            </div>
          : badge}
      </div>
    </div>
  );
};

const Leaderboard = ({ title, kind, rows, loading }) => (
  <div className="wc-lead wc-glass">
    <div className={`wc-lhead ${kind === 'a' ? 'a' : 'g'}`}>{title}</div>
    {loading ? <div style={{ padding: 16 }}><div className="wc-skel" /></div>
      : rows.length === 0 ? <div className="wc-empty">No data yet.</div>
      : rows.slice(0, 10).map((p, i) => (
        <div className="wc-lrow" key={`${p.name}-${i}`}>
          <span className="wc-lr">{i + 1}</span>
          <img className="wc-av" src={p.photo || ''} alt="" loading="lazy" />
          <div className="wc-linfo">
            <div className="wc-lname">{p.name}</div>
            <div className="wc-lteam">{p.teamLogo && <img src={p.teamLogo} alt="" loading="lazy" />}{p.team}</div>
          </div>
          <div><div className={`wc-lbig ${kind === 'a' ? 'a' : 'g'}`}>{(kind === 'a' ? p.assists : p.goals) ?? 0}</div><div className="wc-lsub">{kind === 'a' ? 'assists' : 'goals'}</div></div>
        </div>
      ))}
  </div>
);

const PredFeatured = ({ pr }) => {
  if (pr === 'loading') return <div className="wc-pfeat wc-glass"><div className="wc-skel" style={{ height: 220 }} /></div>;
  if (!pr || pr === 'error' || pr.error) return <div className="wc-pfeat wc-glass"><div className="wc-empty">Not enough recent data to predict this match yet.</div></div>;
  const { home, away, prob, expGoals, doubleChance, cleanSheet, topScores = [], over25, btts, form, confidence } = pr;
  const h = prob.home, d = prob.draw, a = prob.away;
  const lead = h >= d && h >= a ? { p: h, l: home.name } : (a >= d ? { p: a, l: away.name } : { p: d, l: 'Draw' });
  const cTag = confidence?.level === 'High' ? '#27e0a3' : confidence?.level === 'Medium' ? '#facc15' : '#9aa4bd';
  return (
    <div className="wc-pfeat wc-glass">
      <div className="wc-pmatch">
        <div className="wc-pside">{home.logo && <img src={home.logo} alt="" />}<span className="pn">{home.name}</span></div>
        <span className="wc-pvs">vs</span>
        <div className="wc-pside">{away.logo && <img src={away.logo} alt="" />}<span className="pn">{away.name}</span></div>
      </div>
      <div className="wc-ptop">
        <div className="wc-ring" style={{ background: `conic-gradient(#2dd4ff 0 ${h}%, #46506a ${h}% ${h + d}%, #9b7cff ${h + d}% 100%)` }}>
          <div className="hole" /><div className="rc"><div className="rp">{lead.p}%</div><div className="rl">{lead.l}</div></div>
        </div>
        <div>
          <div className="wc-plegend">
            <div className="wc-plg"><span className="sw" style={{ background: '#2dd4ff' }} />{home.name} win <b>{h}%</b></div>
            <div className="wc-plg"><span className="sw" style={{ background: '#46506a' }} />Draw <b>{d}%</b></div>
            <div className="wc-plg"><span className="sw" style={{ background: '#9b7cff' }} />{away.name} win <b>{a}%</b></div>
          </div>
          {confidence && (
            <div className="wc-conf">
              <div className="wc-confhead"><span>Model confidence</span><span className="wc-conftag" style={{ color: cTag }}>{confidence.level}</span></div>
              <div className="wc-confbar"><i style={{ width: `${confidence.value}%` }} /></div>
            </div>
          )}
        </div>
      </div>
      {form && (
        <div className="wc-pforms">
          <div><div className="wc-fl">{home.name} · last 5</div><FormBadges form={form.home} /></div>
          <div><div className="wc-fl">{away.name} · last 5</div><FormBadges form={form.away} /></div>
        </div>
      )}
      <div className="wc-pstats">
        <div className="wc-pstat"><div className="v">{expGoals.home} – {expGoals.away}</div><div className="k">Exp goals</div></div>
        <div className="wc-pstat"><div className="v">{over25}%</div><div className="k">Over 2.5</div></div>
        <div className="wc-pstat"><div className="v">{btts}%</div><div className="k">Both score</div></div>
        <div className="wc-pstat"><div className="v">{doubleChance?.home}%</div><div className="k">1X dbl chance</div></div>
        <div className="wc-pstat"><div className="v">{cleanSheet?.home}%</div><div className="k">Home clean sheet</div></div>
      </div>
      {topScores.length > 0 && (
        <div className="wc-pscores"><span className="sl">Likely scores</span>
          {topScores.map((s, i) => <span key={i} className="wc-psc">{s.score} · {s.prob}%</span>)}
        </div>
      )}
    </div>
  );
};

export default function WorldCupPage({ onNavigate }) {
  const [tab, setTab] = useState('groups');
  const [standings, setStandings] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [scorers, setScorers] = useState([]);
  const [assists, setAssists] = useState([]);
  const [live, setLive] = useState([]);
  const [loading, setLoading] = useState({ standings: true, fixtures: true, scorers: true, assists: true });
  const [preds, setPreds] = useState({});
  const [featuredId, setFeaturedId] = useState(null);

  useEffect(() => {
    const get = (path, set, key) => fetchWithTimeout(`${API_BASE}${path}`).then(r => r.ok ? r.json() : []).then(d => set(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(s => ({ ...s, [key]: false })));
    get('/wc/standings', setStandings, 'standings');
    get('/wc/fixtures', setFixtures, 'fixtures');
    get('/wc/scorers', setScorers, 'scorers');
    get('/wc/assists', setAssists, 'assists');
  }, []);

  const loadLive = useCallback(() => {
    fetchWithTimeout(`${API_BASE}/wc/live`).then(r => r.ok ? r.json() : []).then(d => setLive(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  useEffect(() => { loadLive(); const t = setInterval(loadLive, 45000); return () => clearInterval(t); }, [loadLive]);

  const knockout = useMemo(() => {
    const ko = fixtures.filter(f => f.stage === 'knockout');
    const by = {};
    ko.forEach(f => { (by[f.round] = by[f.round] || []).push(f); });
    const ord = (r) => { const i = KO_ORDER.findIndex(k => (r || '').toLowerCase().includes(k.toLowerCase())); return i === -1 ? 99 : i; };
    return Object.keys(by).sort((a, b) => ord(a) - ord(b)).map(r => ({ round: r, matches: by[r] }));
  }, [fixtures]);

  const fixturesByDay = useMemo(() => {
    const days = {};
    fixtures.forEach(f => { const k = fmtDay(f.date); (days[k] = days[k] || []).push(f); });
    return Object.entries(days);
  }, [fixtures]);

  const upcoming = useMemo(() => fixtures.filter(f => f.status === 'NS' || f.status === 'TBD').slice(0, 30), [fixtures]);
  useEffect(() => { if (featuredId == null && upcoming.length) setFeaturedId(upcoming[0].id); }, [upcoming, featuredId]);
  const featured = useMemo(() => upcoming.find(f => f.id === featuredId) || upcoming[0], [upcoming, featuredId]);

  const loadPred = useCallback((f) => {
    if (!f) return;
    setPreds(prev => prev[f.id] ? prev : { ...prev, [f.id]: 'loading' });
    fetchWithTimeout(`${API_BASE}/wc/predict?home=${encodeURIComponent(f.homeTeam || '')}&away=${encodeURIComponent(f.awayTeam || '')}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setPreds(prev => ({ ...prev, [f.id]: (d && !d.error) ? d : 'error' })))
      .catch(() => setPreds(prev => ({ ...prev, [f.id]: 'error' })));
  }, []);
  useEffect(() => { if (tab === 'predict' && featured && !preds[featured.id]) loadPred(featured); }, [tab, featured, preds, loadPred]);

  const TABS = ['groups', 'fixtures', 'bracket', 'scorers', 'predict'];
  const LABELS = { groups: 'Groups', fixtures: 'Fixtures', bracket: 'Bracket', scorers: 'Scorers', predict: 'Predict' };

  return (
    <div className="wc-root">
      <style>{STYLES}</style>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <div className="wc-bg" />
      <NavBar currentPage="worldcup" onNavigate={onNavigate} />

      <div className="wc-wrap">
        <div className="wc-hero wc-glass">
          <div className="wc-badge"><img src={WC_BADGE} alt="FIFA World Cup" /></div>
          <div>
            <div className="wc-eyebrow">Now playing · Group stage</div>
            <h1 className="wc-h1">FIFA World Cup 2026</h1>
            <div className="wc-sub">USA · Canada · Mexico — June 11 to July 19</div>
          </div>
          {live.length > 0 && <div className="wc-lv"><span className="wc-pulse" />{live.length} live</div>}
        </div>

        <div className="wc-tabbar wc-glass">
          {TABS.map(t => <button key={t} className={`wc-tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>{LABELS[t]}</button>)}
        </div>

        {tab === 'groups' && (
          loading.standings ? <div className="wc-ggrid">{[0,1,2,3,4,5].map(i => <div key={i} className="wc-skel" style={{ height: 180 }} />)}</div>
          : standings.length === 0 ? <div className="wc-empty">Group tables will appear once the data is published.</div>
          : <>
            <div className="wc-ggrid">
              {standings.map(g => (
                <div className="wc-group wc-glass" key={g.group}>
                  <div className="wc-ghead">{g.group}</div>
                  <table className="wc-tbl">
                    <thead><tr><th className="l">Team</th><th>P</th><th>GD</th><th>Pts</th></tr></thead>
                    <tbody>
                      {g.table.map((r, i) => (
                        <tr key={r.team} className={i < 2 ? 'q' : ''}>
                          <td className="tm"><div className="wc-tcell"><span className="r">{r.rank}</span>{r.logo && <img src={r.logo} alt="" loading="lazy" />}<span className="nm">{r.team}</span></div></td>
                          <td>{r.played ?? 0}</td><td>{r.gd > 0 ? `+${r.gd}` : (r.gd ?? 0)}</td><td className="wc-pts">{r.points ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
            <div className="wc-legend">Top two per group (cyan edge) advance, plus the eight best third-placed teams.</div>
          </>
        )}

        {tab === 'fixtures' && (
          loading.fixtures ? <div className="wc-fxgrid">{[0,1,2,3].map(i => <div key={i} className="wc-skel" />)}</div>
          : fixtures.length === 0 ? <div className="wc-empty">The match schedule will appear here.</div>
          : fixturesByDay.map(([day, ms]) => (
            <div key={day}>
              <div className="wc-dayhdr">{day}</div>
              <div className="wc-fxgrid">{ms.map(m => <MatchRow key={m.id} m={m} />)}</div>
            </div>
          ))
        )}

        {tab === 'bracket' && (
          loading.fixtures ? <div className="wc-fxgrid">{[0,1].map(i => <div key={i} className="wc-skel" />)}</div>
          : knockout.length === 0 ? <div className="wc-empty">The knockout bracket appears once the group stage ends.</div>
          : knockout.map(({ round, matches }) => (
            <div key={round}>
              <div className="wc-dayhdr" style={{ color: '#2dd4ff' }}>{round}</div>
              <div className="wc-fxgrid">{matches.map(m => <MatchRow key={m.id} m={m} />)}</div>
            </div>
          ))
        )}

        {tab === 'scorers' && (
          <>
            <div className="wc-scgrid">
              <Leaderboard title="Top scorers" kind="g" rows={scorers} loading={loading.scorers} />
              <Leaderboard title="Top assists" kind="a" rows={assists} loading={loading.assists} />
            </div>
            <div className="wc-legend">Goals and assists leaders across the tournament.</div>
          </>
        )}

        {tab === 'predict' && (
          loading.fixtures ? <div className="wc-skel" style={{ height: 220 }} />
          : upcoming.length === 0 ? <div className="wc-empty">Predictions show for upcoming matches.</div>
          : <>
            <div className="wc-basis">Form-based estimate from recent national-team results — not the club xG model.</div>
            {featured && <PredFeatured pr={preds[featured.id]} />}
            {upcoming.filter(f => !featured || f.id !== featured.id).slice(0, 12).map(f => {
              const pr = preds[f.id];
              const hasP = pr && typeof pr === 'object' && !pr.error;
              return (
                <div key={f.id} className={`wc-pmini wc-glass ${featured && f.id === featured.id ? 'sel' : ''}`}
                  onClick={() => { setFeaturedId(f.id); loadPred(f); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <div className="mt">
                    <div className="mteam">{f.homeLogo && <img src={f.homeLogo} alt="" loading="lazy" />}{f.homeTeam}</div>
                    <div className="mteam">{f.awayLogo && <img src={f.awayLogo} alt="" loading="lazy" />}{f.awayTeam}</div>
                  </div>
                  {hasP
                    ? <div className="wc-mbar"><div className="b"><i className="h" style={{ width: `${pr.prob.home}%` }} /><i className="d" style={{ width: `${pr.prob.draw}%` }} /><i className="a" style={{ width: `${pr.prob.away}%` }} /></div><div className="pct"><span>{pr.prob.home}%</span><span>{pr.prob.draw}%</span><span>{pr.prob.away}%</span></div></div>
                    : <span className="wc-pill tm">Predict</span>}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}