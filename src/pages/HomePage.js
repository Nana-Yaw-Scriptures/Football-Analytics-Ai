import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { getPredictions } from '../services/supabaseService';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/* Minimal inline icons (no icon library, keeps the bundle small) */
const Icon = ({ d, c = 'w-4 h-4' }) => (
  <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const ArrowIcon    = p => <Icon {...p} d={<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>}/>;
const ActivityIcon = p => <Icon {...p} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>;
const UsersIcon    = p => <Icon {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const LayersIcon   = p => <Icon {...p} d={<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>}/>;
const PlayIcon     = p => <Icon {...p} d={<polygon points="5 3 19 12 5 21 5 3"/>}/>;
const TargetIcon   = p => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const TrendingIcon = p => <Icon {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>;
const BrainIcon    = p => <Icon {...p} d={<><path d="M9.5 2A5.5 5.5 0 0 0 5 6a5.5 5.5 0 0 0 .4 2A5.5 5.5 0 0 0 4 13.5a5.5 5.5 0 0 0 3.5 5.1V22h5v-3.4a5.5 5.5 0 0 0 3.5-5.1 5.5 5.5 0 0 0-1.4-5.5A5.5 5.5 0 0 0 15 6a5.5 5.5 0 0 0-5.5-4Z"/><path d="M12 2v20"/></>}/>;
const ShieldIcon   = p => <Icon {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;
const BarChartIcon = p => <Icon {...p} d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}/>;
const ClockIcon    = p => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;

const LEAGUES = [
  { name:'Premier League',   code:'Premier League',   img:'https://media.api-sports.io/football/leagues/39.png',  country:'England' },
  { name:'La Liga',          code:'La Liga',          img:'https://media.api-sports.io/football/leagues/140.png', country:'Spain' },
  { name:'Bundesliga',       code:'Bundesliga',       img:'https://media.api-sports.io/football/leagues/78.png',  country:'Germany' },
  { name:'Serie A',          code:'Serie A',          img:'https://media.api-sports.io/football/leagues/135.png', country:'Italy' },
  { name:'Ligue 1',          code:'Ligue 1',          img:'https://media.api-sports.io/football/leagues/61.png',  country:'France' },
  { name:'Primeira Liga',    code:'Primeira Liga',    img:'https://media.api-sports.io/football/leagues/94.png',  country:'Portugal' },
  { name:'Champions League', code:'Champions League', img:'https://media.api-sports.io/football/leagues/2.png',   country:'Europe' },
];

const FEATURES = [
  { icon:TrendingIcon, title:'Match Predictions', desc:'Win probabilities, predicted scores and confidence from a Poisson + xG model.', color:'#22d3ee', page:'analysis' },
  { icon:TargetIcon,   title:'xG Intelligence',   desc:'Expected goals, shot quality and over/under performers across every league.', color:'#a855f7', page:'analysis' },
  { icon:BrainIcon,    title:'Tactical Analysis', desc:'Formations, press intensity and phase-of-play breakdowns.', color:'#f59e0b', page:'analysis' },
  { icon:UsersIcon,    title:'Player Database',   desc:'3,000+ players with goals, xG, xA and passing — sortable and comparable.', color:'#34d399', page:'players' },
  { icon:ShieldIcon,   title:'Manager Profiles',  desc:'Tactical style, preferred formations and trophy counts for 96 coaches.', color:'#f87171', page:'managers' },
  { icon:PlayIcon,     title:'Season Simulator',  desc:'Monte Carlo projections for final standings and qualification odds.', color:'#fb923c', page:'simulator' },
  { icon:BarChartIcon, title:'League Dashboards', desc:'Standings, scorers, form and fixtures for every league in one place.', color:'#60a5fa', page:'league' },
  { icon:ActivityIcon, title:'Live Scores',       desc:'Real-time scores and match events across all seven leagues.', color:'#ef4444', page:'live' },
];

const QUICK = [
  { label:'Live Scores', page:'live',      color:'#ef4444', Icon:ActivityIcon, live:true },
  { label:'Players',     page:'players',   color:'#34d399', Icon:UsersIcon },
  { label:'Tactics',     page:'analysis',  color:'#f59e0b', Icon:LayersIcon },
  { label:'Simulator',   page:'simulator', color:'#a855f7', Icon:PlayIcon },
];

const STATS = [
  { v:'3,000+', label:'Players tracked',  sub:'Across 7 leagues',      color:'#22d3ee' },
  { v:'98',     label:'Teams covered',    sub:"Men's top flights",     color:'#a855f7' },
  { v:'50+',    label:'Stats per player', sub:'Updated daily',         color:'#f59e0b' },
  { v:'7',      label:'Leagues covered',  sub:'Top European football', color:'#34d399' },
];

/* Live / upcoming match row — plain card, no continuous animation */
const MatchPill = ({ m, onClick }) => {
  const live = ['1H','2H','HT','ET','P','LIVE'].includes(m.status) || m.minute;
  const time = m.time || (m.date ? new Date(m.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : 'vs');
  return (
    <button onClick={onClick}
      className="w-full rounded-2xl border border-white/[0.07] bg-[#0a0e1a]/80 px-4 py-3.5 text-left transition-colors hover:border-white/20">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {m.homeLogo && <img src={m.homeLogo} alt="" width="20" height="20" loading="lazy" decoding="async" className="w-5 h-5 object-contain flex-shrink-0"/>}
          <span className="text-sm font-bold text-white truncate">{(m.homeTeam || '').replace(' FC','')}</span>
        </div>
        <div className="px-3 text-center">
          {live ? (
            <>
              <p className="text-base font-black text-white" style={{ fontFamily:'JetBrains Mono' }}>{m.homeGoals ?? 0} – {m.awayGoals ?? 0}</p>
              <p className="text-[10px] font-bold text-red-400">{m.minute ? `${m.minute}'` : 'LIVE'}</p>
            </>
          ) : (
            <p className="text-sm font-black text-slate-400" style={{ fontFamily:'JetBrains Mono' }}>{time}</p>
          )}
        </div>
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <span className="text-sm font-bold text-white truncate">{(m.awayTeam || '').replace(' FC','')}</span>
          {m.awayLogo && <img src={m.awayLogo} alt="" width="20" height="20" loading="lazy" decoding="async" className="w-5 h-5 object-contain flex-shrink-0"/>}
        </div>
      </div>
    </button>
  );
};

export default function HomePage({ onNavigate }) {
  const { user } = useAuth();
  const [live, setLive]               = useState([]);
  const [upcoming, setUpcoming]       = useState([]);
  const [loadingLive, setLoadingLive] = useState(true);
  const [preds, setPreds]             = useState([]);

  /* Live scores — refresh every 60s */
  useEffect(() => {
    let on = true;
    const load = async () => {
      try {
        const r = await fetchWithTimeout(`${API_BASE}/live/now`);
        const d = r.ok ? await r.json() : [];
        if (on) setLive(Array.isArray(d) ? d.slice(0, 6) : []);
      } catch { /* silent */ }
      finally { if (on) setLoadingLive(false); }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { on = false; clearInterval(t); };
  }, []);

  /* Upcoming — shown only when nothing is live */
  useEffect(() => {
    fetchWithTimeout(`${API_BASE}/live/upcoming`)
      .then(r => (r.ok ? r.json() : []))
      .then(d => setUpcoming(Array.isArray(d) ? d.slice(0, 6) : []))
      .catch(() => {});
  }, []);

  /* Recent predictions — only when signed in */
  useEffect(() => {
    if (!user) { setPreds([]); return; }
    getPredictions(user.id).then(d => setPreds(Array.isArray(d) ? d.slice(0, 3) : [])).catch(() => {});
  }, [user]);

  return (
    <div className="min-h-screen bg-[#050810] text-white overflow-x-hidden" style={{ fontFamily:"'Outfit',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>

      {/* Static ambient tint — flat gradient, no blur filters */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background:
          'radial-gradient(820px 620px at 25% -8%, rgba(34,211,238,0.05), transparent 60%),' +
          'radial-gradient(620px 520px at 100% 40%, rgba(168,85,247,0.04), transparent 60%),' +
          'radial-gradient(520px 520px at 0% 100%, rgba(16,185,129,0.035), transparent 60%)'
      }}/>

      <NavBar currentPage="home" onNavigate={onNavigate}/>

      {/* ── HERO ── */}
      <section className="relative px-4 sm:px-6 md:px-8 pt-14 pb-12 md:pt-20 md:pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03]">
            <span className="w-2 h-2 rounded-full bg-emerald-400"/>
            <span className="text-slate-300 text-xs font-semibold tracking-wide">7 leagues · Live data · Updated daily</span>
          </div>

          <div className="flex items-baseline justify-center gap-1 mb-3">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none">Scorina</h1>
            <span className="hp-ai">Ai</span>
          </div>

          <p className="text-lg sm:text-xl font-semibold mb-4"
            style={{ background:'linear-gradient(90deg,#22d3ee,#a855f7 55%,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Football Analytics Intelligence
          </p>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8 font-light">
            AI-powered predictions, live scores, player analytics and league simulation — all in one place.
          </p>

          {/* AI Picks promo */}
          <button onClick={() => onNavigate('bestpicks')}
            className="w-full max-w-lg mx-auto flex items-center gap-3.5 rounded-2xl p-4 border text-left transition-transform hover:-translate-y-0.5 mb-7"
            style={{ background:'linear-gradient(120deg, rgba(34,211,238,0.12), rgba(168,85,247,0.12) 60%, rgba(255,255,255,0.02))', borderColor:'rgba(34,211,238,0.28)' }}>
            <span className="w-12 h-12 rounded-xl grid place-items-center flex-shrink-0" style={{ background:'linear-gradient(135deg,#22d3ee,#a855f7)' }}>
              <TargetIcon c="w-6 h-6 text-white"/>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-cyan-400">Updated daily</span>
              <span className="block text-white font-black text-base leading-tight">AI Picks</span>
              <span className="block text-slate-400 text-sm leading-snug">Our highest-confidence predictions, picked for you every day</span>
            </span>
            <span className="flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm" style={{ background:'linear-gradient(135deg,#2dd4ff,#62e3ff)', color:'#06101f' }}>View →</span>
          </button>

          {/* Quick nav */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {QUICK.map((b, i) => (
              <button key={i} onClick={() => onNavigate(b.page)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-300 text-sm font-semibold transition-colors hover:bg-white/[0.07] hover:text-white">
                <b.Icon c="w-3.5 h-3.5" style={{ color:b.color }}/>
                <span>{b.label}</span>
                {b.live && <span className="w-1.5 h-1.5 rounded-full bg-red-500"/>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative py-8 border-y border-white/[0.05] bg-white/[0.015] px-4 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl sm:text-4xl font-black" style={{ fontFamily:'JetBrains Mono', color:s.color }}>{s.v}</p>
              <p className="text-sm font-bold text-white mt-1">{s.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE NOW ── */}
      <section className="relative py-12 px-4 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-red-500"/>
              <h2 className="text-lg font-black uppercase tracking-[0.1em]">Live Now</h2>
            </div>
            <button onClick={() => onNavigate('live')} className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm font-semibold transition-colors">
              All matches <ArrowIcon c="w-4 h-4"/>
            </button>
          </div>

          {loadingLive ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[0,1,2].map(i => <div key={i} className="h-[64px] rounded-2xl border border-white/[0.05] bg-white/[0.02]"/>)}
            </div>
          ) : live.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {live.map((m, i) => <MatchPill key={i} m={m} onClick={() => onNavigate('match', { fixtureId: m.id })}/>)}
            </div>
          ) : upcoming.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-4 text-slate-500">
                <ClockIcon c="w-3.5 h-3.5"/>
                <span className="text-xs font-semibold uppercase tracking-widest">No live now · Upcoming</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcoming.map((m, i) => <MatchPill key={i} m={m} onClick={() => onNavigate('live')}/>)}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] py-10 text-center">
              <p className="text-slate-500 text-sm font-semibold">No matches scheduled right now</p>
              <button onClick={() => onNavigate('live')} className="mt-3 text-cyan-400 text-xs font-bold hover:text-cyan-300">View all fixtures →</button>
            </div>
          )}
        </div>
      </section>

      {/* ── LEAGUES ── */}
      <section className="relative py-12 px-4 sm:px-6 md:px-8 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] text-cyan-400 font-bold uppercase tracking-[0.18em] mb-2">Coverage</p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-7">Europe's Top Leagues</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {LEAGUES.map((lg, i) => (
              <button key={i} onClick={() => onNavigate('league', lg.code)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/[0.06] bg-[#0a0e1a]/60 transition-colors hover:border-white/20">
                <img src={lg.img} alt={lg.name} width="40" height="40" loading="lazy" decoding="async" className="w-10 h-10 object-contain"/>
                <span className="text-xs font-bold text-white text-center leading-tight">{lg.name}</span>
                <span className="text-[10px] text-slate-500">{lg.country}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative py-12 px-4 sm:px-6 md:px-8 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-9">
            <p className="text-[11px] text-purple-400 font-bold uppercase tracking-[0.18em] mb-2">Platform</p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Everything in one place</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURES.map((f, i) => (
              <button key={i} onClick={() => onNavigate(f.page)}
                className="text-left p-5 rounded-2xl border border-white/[0.06] bg-[#0a0e1a]/70 transition-colors hover:border-white/15">
                <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center mb-3" style={{ background:`${f.color}15`, border:`1px solid ${f.color}25` }}>
                  <f.icon c="w-4 h-4" style={{ color:f.color }}/>
                </span>
                <h3 className="text-base font-black mb-1.5">{f.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT PREDICTIONS ── */}
      <section className="relative py-12 px-4 sm:px-6 md:px-8 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black tracking-tight">Recent Predictions</h2>
            {user && preds.length > 0 && (
              <button onClick={() => onNavigate('history')} className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm font-semibold transition-colors">
                View all <ArrowIcon c="w-4 h-4"/>
              </button>
            )}
          </div>

          {!user ? (
            <div className="rounded-2xl border border-white/[0.07] p-8 text-center" style={{ background:'rgba(16,185,129,0.04)' }}>
              <p className="text-white font-black text-base mb-1">Track your predictions</p>
              <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">Sign in to save predictions and see your accuracy over time.</p>
              <button onClick={() => onNavigate('login')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border"
                style={{ background:'rgba(16,185,129,0.1)', borderColor:'rgba(16,185,129,0.25)', color:'#10b981' }}>Sign in to track →</button>
            </div>
          ) : preds.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.07] p-8 text-center bg-[#0a0e1a]/80">
              <p className="text-white font-black text-base mb-1">No predictions yet</p>
              <p className="text-slate-500 text-sm mb-5">Make your first prediction on the Analysis page.</p>
              <button onClick={() => onNavigate('analysis')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border"
                style={{ background:'rgba(34,211,238,0.1)', borderColor:'rgba(34,211,238,0.25)', color:'#22d3ee' }}>Start predicting →</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-3">
              {preds.map((p, i) => {
                const sc = p.resolved ? (p.correct ? '#10b981' : '#ef4444') : '#64748b';
                return (
                  <div key={i} className="p-4 rounded-2xl border border-white/[0.06] bg-[#0a0e1a]/80" style={{ borderTop:`2px solid ${sc}` }}>
                    <p className="text-sm font-bold text-white truncate">{p.homeTeam} vs {p.awayTeam}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 mb-3">{p.league}</p>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black text-slate-400" style={{ fontFamily:'JetBrains Mono' }}>{p.predictedScore || '—'}</span>
                      <span className="font-bold px-2 py-0.5 rounded-md" style={{ color:sc, background:`${sc}12` }}>
                        {p.resolved ? (p.correct ? 'Correct' : 'Wrong') : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-16 px-4 sm:px-6 md:px-8 border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-3 leading-none">
            Analyse <span style={{ background:'linear-gradient(135deg,#22d3ee,#a855f7,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>smarter.</span>
          </h2>
          <p className="text-slate-500 text-lg mb-8 font-light">Real data. Real predictions. Real intelligence.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button onClick={() => onNavigate('analysis')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-[15px]"
              style={{ background:'linear-gradient(135deg,#22d3ee,#0891b2)', color:'white' }}>
              Launch Scorina <ArrowIcon c="w-4 h-4"/>
            </button>
            <button onClick={() => onNavigate('live')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-[15px] border border-white/10 bg-white/5 text-white">
              <ActivityIcon c="w-4 h-4 text-red-400"/> Live Scores
            </button>
          </div>
        </div>
      </section>

      {/* ── SEO TEXT ── */}
      <section className="relative px-6 py-14" style={{ background:'rgba(5,8,16,0.95)', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-black text-white mb-3">AI-Powered Football Predictions & Analytics</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-3xl">
            Scorina AI uses machine learning and real-time data for football match predictions, live scores and player
            analytics across the Premier League, La Liga, Bundesliga, Serie A, Ligue 1 and Primeira Liga.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7">
            {[
              { title:'Match Predictions', text:'Team form, xG, head-to-head and Elo ratings combine into win probabilities and predicted scores for every fixture.' },
              { title:'Live Scores & xG',  text:'Follow matches in real time with scores, expected goals and event timelines across major leagues.' },
              { title:'Player Intelligence', text:'Browse 3,000+ players with detailed stats, position ratings and performance trends.' },
              { title:'Season Simulator',  text:'Monte Carlo simulations project final standings, European qualification and relegation odds.' },
              { title:'Free to Use',       text:'Create an account to unlock AI Picks, track your accuracy and compete on the leaderboard.' },
              { title:'Premier League',    text:'AI predictions for every Premier League match, with win probabilities and xG forecasts updated daily.' },
            ].map((item, i) => (
              <div key={i}>
                <h3 className="text-white font-bold text-sm mb-1.5">{item.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate}/>

      <style>{`
        .hp-ai {
          display:inline-flex; align-items:center; justify-content:center;
          background:linear-gradient(135deg,#22d3ee,#a855f7);
          border-radius:10px; padding:4px 10px; margin-left:4px;
          font-family:'JetBrains Mono',monospace; font-weight:900; font-size:28px;
          color:#fff; letter-spacing:-0.04em; line-height:1; position:relative; top:-6px;
        }
        @media (max-width:640px){ .hp-ai{ font-size:20px; top:-4px; padding:3px 8px; } }
      `}</style>
    </div>
  );
}