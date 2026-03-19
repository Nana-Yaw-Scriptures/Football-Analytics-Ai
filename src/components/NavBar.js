import React, { useState, useEffect, useRef, useCallback } from 'react';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import ZapIcon from '../assets/zapicon.png';

/* ══════════════════════════════════════
   ICONS
══════════════════════════════════════ */
const I = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const BrainIcon    = p => <I {...p} d={<><path d="M9.5 2A5.5 5.5 0 0 0 5 6a5.5 5.5 0 0 0 .4 2A5.5 5.5 0 0 0 4 13.5a5.5 5.5 0 0 0 3.5 5.1V22h5v-3.4a5.5 5.5 0 0 0 3.5-5.1 5.5 5.5 0 0 0-1.4-5.5A5.5 5.5 0 0 0 15 6a5.5 5.5 0 0 0-5.5-4Z"/><path d="M12 2v20"/></>}/>;
const BarChartIcon = p => <I {...p} d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}/>;
const UsersIcon    = p => <I {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const UserIcon     = p => <I {...p} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>;
const ActivityIcon = p => <I {...p} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>;
const GlobeIcon    = p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}/>;
const PlayIcon     = p => <I {...p} d={<polygon points="5 3 19 12 5 21 5 3"/>}/>;
const HistoryIcon  = p => <I {...p} d={<><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></>}/>;
const ChevronIcon  = p => <I {...p} d={<polyline points="6 9 12 15 18 9"/>}/>;
const ArrowLeftIcon= p => <I {...p} d={<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>}/>;
const MenuIcon     = p => <I {...p} d={<><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/></>}/>;
const XIcon        = p => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const SettingsIcon = p => <I {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}/>;

/* ══════════════════════════════════════
   CONFIG
══════════════════════════════════════ */
const NAV_LINKS = [
  { id:'analysis',  label:'Analysis',  icon:BrainIcon,    accent:'#22d3ee' },
  { id:'analytics', label:'Stats',     icon:BarChartIcon, accent:'#a78bfa' },
  { id:'players',   label:'Players',   icon:UsersIcon,    accent:'#34d399' },
  { id:'managers',  label:'Managers',  icon:UserIcon,     accent:'#fbbf24' },
  { id:'live',      label:'Live',      icon:ActivityIcon, accent:'#f87171', live:true },
  { id:'league',    label:'Leagues',   icon:GlobeIcon,    accent:'#60a5fa', dropdown:true },
  { id:'simulator', label:'Sim',       icon:PlayIcon,     accent:'#f59e0b' },
  { id:'history',   label:'History',   icon:HistoryIcon,  accent:'#c084fc' },
  { id:'picks', label:'Picks', icon:ZapIcon, accent:'#22d3ee' }
];

const LEAGUES = [
  { name:'Premier League',  short:'PL',  img:'https://media.api-sports.io/football/leagues/39.png',  color:'#7c3aed' },
  { name:'La Liga',         short:'LAL', img:'https://media.api-sports.io/football/leagues/140.png', color:'#dc2626' },
  { name:'Bundesliga',      short:'BUN', img:'https://media.api-sports.io/football/leagues/78.png',  color:'#d97706' },
  { name:'Serie A',         short:'SA',  img:'https://media.api-sports.io/football/leagues/135.png', color:'#059669' },
  { name:'Ligue 1',         short:'L1',  img:'https://media.api-sports.io/football/leagues/61.png',  color:'#2563eb' },
  { name:'Primeira Liga',   short:'PRI', img:'https://media.api-sports.io/football/leagues/94.png',  color:'#10b981' },
  { name:'Champions League',short:'UCL', img:'https://media.api-sports.io/football/leagues/2.png',   color:'#f59e0b' },
];

const PAGE_LABEL = {
  home:'Home', analysis:'AI Analysis', analytics:'Analytics',
  players:'Players', managers:'Managers', live:'Live Scores',
  league:'League', simulator:'Simulator', history:'Predictions',
  match:'Match Centre', admin:'Admin',
};

/* Pages that always snap back to a specific destination */
const FORCED_BACK = { match:'live' };

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function NavBar({ currentPage, onNavigate, children }) {
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [leagueOpen,   setLeagueOpen]   = useState(false);
  const [leagueSearch, setLeagueSearch] = useState('');
  const [scrolled,     setScrolled]     = useState(false);
  const [logoErr,      setLogoErr]      = useState(false);
  const dropRef      = useRef(null);
  const searchRef    = useRef(null);
  const historyStack = useRef([]);
  const prevPage     = useRef(currentPage);

  /* Scroll — navbar tightens on scroll */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', fn, { passive:true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* History stack */
  useEffect(() => {
    const prev = prevPage.current, next = currentPage;
    if (prev !== next) {
      const stack = historyStack.current;
      if (stack[stack.length - 1] !== prev) historyStack.current = [...stack, prev];
      prevPage.current = next;
    }
    setMobileOpen(false);
    setLeagueOpen(false);
  }, [currentPage]);

  /* Close dropdown on outside click */
  useEffect(() => {
    if (!leagueOpen) { setLeagueSearch(''); return; }
    const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setLeagueOpen(false); };
    document.addEventListener('mousedown', h);
    // Auto-focus search input when dropdown opens
    setTimeout(() => searchRef.current?.focus(), 50);
    return () => document.removeEventListener('mousedown', h);
  }, [leagueOpen]);

  const goBack = useCallback(() => {
    if (FORCED_BACK[currentPage]) { onNavigate(FORCED_BACK[currentPage]); return; }
    const stack = historyStack.current;
    if (!stack.length) { onNavigate('home'); return; }
    const prev = stack[stack.length - 1];
    historyStack.current = stack.slice(0, -1);
    prevPage.current = prev;
    onNavigate(prev);
  }, [currentPage, onNavigate]);

  const go = useCallback((page, params) => {
    onNavigate(page, params);
    setMobileOpen(false);
    setLeagueOpen(false);
  }, [onNavigate]);

  // Back button shows only when:
  // a) there's a forced destination (e.g. match → live), OR
  // b) there's actual history in the stack to go back to
  // Never shows just to mirror the logo's "go home" function
  const canBack = FORCED_BACK[currentPage] != null || historyStack.current.length > 0;
  const backLabel = FORCED_BACK[currentPage]
    ? PAGE_LABEL[FORCED_BACK[currentPage]]
    : historyStack.current.length
    ? PAGE_LABEL[historyStack.current[historyStack.current.length - 1]] || 'Back'
    : 'Home';

  const activeAccent = NAV_LINKS.find(l => l.id === currentPage)?.accent || '#22d3ee';

  const filteredLeagues = leagueSearch.trim()
    ? LEAGUES.filter(l => l.name.toLowerCase().includes(leagueSearch.toLowerCase()))
    : LEAGUES;

  return (
    <>
      <header className="nb-root" data-scrolled={scrolled} style={{ fontFamily:"'Outfit',sans-serif" }}>

        {/* Chromatic top line — shifts colour with active page */}
        <div className="nb-topline" style={{ '--accent': activeAccent }}/>

        <div className="nb-inner">

          {/* ── LEFT ── */}
          <div className="nb-left">
            {canBack && (
              <button className="nb-back" onClick={goBack}>
                <ArrowLeftIcon className="w-3.5 h-3.5"/>
                <span className="nb-back-label">{backLabel}</span>
              </button>
            )}

            <button className="nb-logo" onClick={() => go('home')}>
              <div className="nb-logo-mark">
                {!logoErr
                  ? <img src="/scriptiq_logo.svg" alt="ScriptIQ" className="nb-logo-img" onError={() => setLogoErr(true)}/>
                  : <BrainIcon className="w-3.5 h-3.5 text-white"/>}
              </div>
              <span className="nb-wordmark">ScriptIQ</span>
              <span className="nb-wordmark-dot" style={{ background: activeAccent, boxShadow: `0 0 8px ${activeAccent}` }}/>
            </button>

            {currentPage !== 'home' && PAGE_LABEL[currentPage] && (
              <div className="nb-crumb">
                <span className="nb-crumb-sep">/</span>
                <span className="nb-crumb-text">{PAGE_LABEL[currentPage]}</span>
              </div>
            )}
          </div>

          {/* ── CENTER — desktop nav ── */}
          <nav className="nb-nav">
            {NAV_LINKS.map(link => {
              const isActive = currentPage === link.id;
              const Icon = link.icon;

              if (link.dropdown) {
                return (
                  <div key={link.id} className="nb-drop-root" ref={dropRef}>
                    <button
                      className={`nb-item ${isActive ? 'nb-item-on' : ''}`}
                      style={{ '--a': link.accent }}
                      onClick={() => setLeagueOpen(v => !v)}>
                      <Icon className="nb-icon"/>
                      <span>{link.label}</span>
                      <ChevronIcon className={`nb-chevron ${leagueOpen ? 'nb-chevron-open' : ''}`}/>
                    </button>

                    {leagueOpen && (
                      <div className="nb-drop">
                        <div className="nb-drop-head">Select League</div>
                        {/* Search input */}
                        <div className="nb-drop-search-wrap">
                          <svg className="nb-drop-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          </svg>
                          <input
                            ref={searchRef}
                            type="text"
                            value={leagueSearch}
                            onChange={e => setLeagueSearch(e.target.value)}
                            placeholder="Search leagues…"
                            className="nb-drop-search"
                            onKeyDown={e => {
                              if (e.key === 'Enter' && filteredLeagues.length === 1) {
                                go('league', filteredLeagues[0].name);
                              }
                              if (e.key === 'Escape') setLeagueOpen(false);
                            }}
                          />
                          {leagueSearch && (
                            <button className="nb-drop-search-clear" onClick={() => { setLeagueSearch(''); searchRef.current?.focus(); }}>
                              ×
                            </button>
                          )}
                        </div>
                        <div className="nb-drop-grid">
                          {filteredLeagues.length > 0 ? filteredLeagues.map((lg, i) => (
                            <button key={lg.name} className="nb-drop-row"
                              style={{ '--c': lg.color, animationDelay:`${i*0.03}s` }}
                              onClick={() => go('league', lg.name)}>
                              <div className="nb-drop-crest">
                                <img src={lg.img} alt="" className="nb-drop-img"/>
                              </div>
                              <div className="nb-drop-info">
                                <span className="nb-drop-name">{lg.name}</span>
                                <span className="nb-drop-tag">{lg.short}</span>
                              </div>
                              <span className="nb-drop-pip"/>
                            </button>
                          )) : (
                            <div className="nb-drop-empty">No leagues found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button key={link.id}
                  className={`nb-item ${isActive ? 'nb-item-on' : ''} ${link.live ? 'nb-item-live' : ''}`}
                  style={{ '--a': link.accent }}
                  onClick={() => go(link.id)}>
                  <Icon className="nb-icon"/>
                  <span>{link.label}</span>
                  {link.live && <span className="nb-pulse"><span className="nb-ping"/></span>}
                  {isActive && <span className="nb-bar" style={{ background: link.accent, boxShadow: `0 0 6px ${link.accent}` }}/>}
                </button>
              );
            })}
          </nav>

          {/* ── RIGHT ── */}
          <div className="nb-right">
            <GlobalSearch onNavigate={go}/>
            <NotificationBell onNavigate={go}/>
            {children}
            <button className="nb-burger lg:hidden" onClick={() => setMobileOpen(v => !v)}>
              {mobileOpen ? <XIcon className="w-4 h-4"/> : <MenuIcon className="w-4 h-4"/>}
            </button>
          </div>
        </div>

        {/* ── MOBILE OVERLAY ── */}
        {mobileOpen && (
          <div className="nb-mob">
            {canBack && (
              <button className="nb-mob-back" onClick={goBack}>
                <ArrowLeftIcon className="w-3.5 h-3.5"/>
                Back to {backLabel}
              </button>
            )}

            <div className="nb-mob-grid">
              {NAV_LINKS.filter(l => !l.dropdown).map((link, i) => {
                const isActive = currentPage === link.id;
                const Icon = link.icon;
                return (
                  <button key={link.id}
                    className={`nb-mob-item ${isActive ? 'nb-mob-on' : ''}`}
                    style={{ '--a': link.accent, animationDelay:`${i*0.025}s` }}
                    onClick={() => go(link.id)}>
                    <div className="nb-mob-ico">
                      <Icon className="w-4 h-4"/>
                    </div>
                    <span className="nb-mob-lbl">{link.label}</span>
                    {link.live && <span className="nb-pulse nb-pulse-sm ml-auto"><span className="nb-ping"/></span>}
                  </button>
                );
              })}
            </div>

            <div>
              <p className="nb-mob-sec">Leagues</p>
              <div className="nb-mob-leagues">
                {LEAGUES.map((lg, i) => (
                  <button key={lg.name} className="nb-mob-league"
                    style={{ '--c': lg.color, animationDelay:`${i*0.02}s` }}
                    onClick={() => go('league', lg.name)}>
                    <img src={lg.img} alt="" className="w-5 h-5 object-contain flex-shrink-0"/>
                    <span className="nb-mob-lg-name">
                      {lg.name.replace(' League','').replace('Premier','PL')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button className="nb-mob-admin" onClick={() => go('admin')}>
              <SettingsIcon className="w-3.5 h-3.5"/> Admin Panel
            </button>
          </div>
        )}
      </header>

      <style>{`
        /* ════════════════════════════════
           ROOT
        ════════════════════════════════ */
        .nb-root {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(5,8,16,0.88);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
        .nb-root[data-scrolled="true"] {
          background: rgba(5,8,16,0.96);
          box-shadow: 0 1px 0 rgba(255,255,255,0.04), 0 8px 40px rgba(0,0,0,0.5);
        }

        /* Chromatic top line */
        .nb-topline {
          height: 1.5px;
          background: linear-gradient(90deg, transparent 0%, var(--accent) 35%, rgba(168,85,247,0.7) 65%, transparent 100%);
          opacity: 0.65;
          transition: background 0.6s ease;
        }

        /* Inner */
        .nb-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 20px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        /* ════════════════════════════════
           LEFT
        ════════════════════════════════ */
        .nb-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* Back */
        .nb-back {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px 4px 7px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.04);
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
          transition: all 0.15s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .nb-back:hover { color: #e2e8f0; background: rgba(255,255,255,0.07); transform: translateX(-1px); }
        .nb-back-label { display: none; }
        @media (min-width: 540px) { .nb-back-label { display: inline; } }

        /* Logo */
        .nb-logo {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 3px 5px;
          border-radius: 9px;
          transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .nb-logo:hover { opacity: 0.78; }

        .nb-logo-mark {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: linear-gradient(135deg, #22d3ee, #a855f7);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 16px rgba(34,211,238,0.22);
          flex-shrink: 0;
        }
        .nb-logo-img { height: 17px; width: auto; object-fit: contain; }

        .nb-wordmark {
          font-size: 15px;
          font-weight: 900;
          color: #f1f5f9;
          letter-spacing: -0.025em;
          display: none;
        }
        @media (min-width: 440px) { .nb-wordmark { display: inline; } }

        .nb-wordmark-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          display: none;
          transition: background 0.5s, box-shadow 0.5s;
        }
        @media (min-width: 440px) { .nb-wordmark-dot { display: inline-block; } }

        /* Breadcrumb */
        .nb-crumb { display: none; align-items: center; gap: 6px; }
        @media (min-width: 768px) { .nb-crumb { display: flex; } }
        .nb-crumb-sep { color: rgba(255,255,255,0.1); font-size: 14px; font-weight: 200; }
        .nb-crumb-text { font-size: 11px; font-weight: 600; color: #475569; letter-spacing: 0.02em; }

        /* ════════════════════════════════
           NAV
        ════════════════════════════════ */
        .nb-nav { display: none; align-items: center; gap: 1px; }
        @media (min-width: 1024px) { .nb-nav { display: flex; } }

        .nb-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 8px;
          border: 1px solid transparent;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.01em;
          transition: color 0.15s, background 0.15s, border-color 0.15s, transform 0.15s;
          white-space: nowrap;
          cursor: pointer;
        }
        .nb-item:hover {
          color: #e2e8f0;
          background: rgba(255,255,255,0.055);
          transform: translateY(-1px);
        }
        .nb-item-on {
          color: var(--a, #22d3ee) !important;
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,255,255,0.09) !important;
        }
        .nb-item-live { color: #f87171; }
        .nb-item-live:hover { background: rgba(239,68,68,0.07) !important; }

        .nb-icon { width: 13px; height: 13px; flex-shrink: 0; transition: transform 0.15s; }
        .nb-item:hover .nb-icon { transform: scale(1.1); }

        .nb-chevron { width: 11px; height: 11px; color: #475569; transition: transform 0.2s; flex-shrink: 0; }
        .nb-chevron-open { transform: rotate(180deg); }

        /* Active bottom bar */
        .nb-bar {
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 2px;
          border-radius: 99px;
        }

        /* Live pulse */
        .nb-pulse {
          position: relative;
          display: inline-flex;
          width: 6px;
          height: 6px;
          flex-shrink: 0;
        }
        .nb-pulse-sm { width: 5px; height: 5px; }
        .nb-ping {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #ef4444;
        }
        .nb-ping::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #ef4444;
          opacity: 0.55;
          animation: nbPing 1.8s ease-in-out infinite;
        }

        /* ════════════════════════════════
           LEAGUE DROPDOWN
        ════════════════════════════════ */
        .nb-drop-root { position: relative; }

        .nb-drop {
          position: absolute;
          top: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          width: 330px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(6,10,22,0.98);
          backdrop-filter: blur(40px);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 24px 64px rgba(0,0,0,0.7), 0 0 60px rgba(34,211,238,0.04);
          overflow: hidden;
          z-index: 100;
          animation: nbDropIn 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .nb-drop-head {
          padding: 10px 14px 8px;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: #334155;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
        }

        /* Search */
        .nb-drop-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          padding: 8px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
          gap: 6px;
        }
        .nb-drop-search-icon {
          width: 12px;
          height: 12px;
          color: #475569;
          flex-shrink: 0;
        }
        .nb-drop-search {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 12px;
          font-weight: 500;
          color: #e2e8f0;
          font-family: 'Outfit', sans-serif;
          min-width: 0;
        }
        .nb-drop-search::placeholder { color: #334155; }
        .nb-drop-search-clear {
          color: #475569;
          font-size: 14px;
          line-height: 1;
          padding: 1px 4px;
          border-radius: 4px;
          flex-shrink: 0;
          transition: color 0.1s;
        }
        .nb-drop-search-clear:hover { color: #94a3b8; }
        .nb-drop-empty {
          grid-column: span 2;
          padding: 16px;
          text-align: center;
          font-size: 11px;
          color: #334155;
          font-weight: 500;
        }
        .nb-drop-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: rgba(255,255,255,0.04);
          padding: 1px;
        }
        .nb-drop-row {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 12px;
          background: rgba(6,10,22,0.95);
          transition: background 0.12s;
          text-align: left;
          animation: nbFadeSlide 0.14s ease-out both;
          cursor: pointer;
        }
        .nb-drop-row:hover { background: rgba(255,255,255,0.055); }
        .nb-drop-row:hover .nb-drop-name { color: #f1f5f9; }

        .nb-drop-crest {
          width: 30px; height: 30px; border-radius: 7px;
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .nb-drop-img { width: 18px; height: 18px; object-fit: contain; }
        .nb-drop-info { flex: 1; min-width: 0; }
        .nb-drop-name {
          display: block; font-size: 11.5px; font-weight: 600; color: #94a3b8;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color 0.12s;
        }
        .nb-drop-tag {
          display: block; font-size: 9.5px; font-weight: 700;
          color: var(--c, #475569); letter-spacing: 0.1em;
          margin-top: 1px; font-family: 'JetBrains Mono', monospace;
        }
        .nb-drop-pip {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--c, #334155); opacity: 0.65; flex-shrink: 0;
        }

        /* ════════════════════════════════
           RIGHT
        ════════════════════════════════ */
        .nb-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

        .nb-burger {
          width: 34px; height: 34px; border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #64748b;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .nb-burger:hover { color: #e2e8f0; background: rgba(255,255,255,0.08); }

        /* ════════════════════════════════
           MOBILE
        ════════════════════════════════ */
        .nb-mob {
          background: rgba(5,8,16,0.98);
          border-top: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(40px);
          padding: 12px 16px 20px;
          display: flex; flex-direction: column; gap: 12px;
          animation: nbSlideDown 0.22s cubic-bezier(0.16,1,0.3,1);
        }
        .nb-mob-back {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.04);
          color: #64748b; font-size: 13px; font-weight: 600;
          width: 100%; transition: all 0.15s;
        }
        .nb-mob-back:hover { color: #e2e8f0; background: rgba(255,255,255,0.07); }

        .nb-mob-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 6px; }

        .nb-mob-item {
          display: flex; align-items: center; gap: 9px;
          padding: 10px 13px; border-radius: 11px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          color: #64748b; font-size: 12.5px; font-weight: 600;
          transition: all 0.15s;
          animation: nbMobItem 0.24s ease-out both;
          cursor: pointer;
        }
        .nb-mob-item:hover { color: #e2e8f0; background: rgba(255,255,255,0.07); }
        .nb-mob-on {
          color: var(--a, #22d3ee) !important;
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .nb-mob-ico {
          width: 28px; height: 28px; border-radius: 7px;
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .nb-mob-lbl { font-size: 12px; font-weight: 600; }

        .nb-mob-sec {
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.13em;
          text-transform: uppercase; color: #334155;
          margin-bottom: 7px; padding: 0 2px;
        }
        .nb-mob-leagues { display: grid; grid-template-columns: repeat(2,1fr); gap: 5px; }
        .nb-mob-league {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 11px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
          color: #64748b; transition: all 0.15s;
          animation: nbMobItem 0.24s ease-out both;
          cursor: pointer;
        }
        .nb-mob-league:hover { color: var(--c, #e2e8f0); background: rgba(255,255,255,0.05); }
        .nb-mob-lg-name { font-size: 11px; font-weight: 600; }

        .nb-mob-admin {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 13px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
          color: #475569; font-size: 12px; font-weight: 600;
          transition: all 0.15s;
        }
        .nb-mob-admin:hover { color: #94a3b8; background: rgba(255,255,255,0.05); }

        /* ════════════════════════════════
           LIGHT THEME
        ════════════════════════════════ */
        [data-theme="light"] .nb-root {
          background: rgba(255,255,255,0.92);
          border-color: rgba(0,0,0,0.08);
        }
        [data-theme="light"] .nb-root[data-scrolled="true"] {
          background: rgba(255,255,255,0.97);
          box-shadow: 0 2px 20px rgba(0,0,0,0.08);
        }
        [data-theme="light"] .nb-wordmark { color: #0f172a; }
        [data-theme="light"] .nb-back { color: #94a3b8; border-color: rgba(0,0,0,0.08); background: rgba(0,0,0,0.03); }
        [data-theme="light"] .nb-back:hover { color: #0f172a; background: rgba(0,0,0,0.06); }
        [data-theme="light"] .nb-crumb-sep { color: rgba(0,0,0,0.12); }
        [data-theme="light"] .nb-crumb-text { color: #94a3b8; }
        [data-theme="light"] .nb-item { color: #64748b; }
        [data-theme="light"] .nb-item:hover { color: #0f172a; background: rgba(0,0,0,0.04); }
        [data-theme="light"] .nb-item-on { background: rgba(0,0,0,0.05) !important; border-color: rgba(0,0,0,0.08) !important; }
        [data-theme="light"] .nb-chevron { color: #94a3b8; }
        [data-theme="light"] .nb-burger { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.08); color: #64748b; }
        [data-theme="light"] .nb-burger:hover { color: #0f172a; }
        [data-theme="light"] .nb-drop { background: rgba(255,255,255,0.99); border-color: rgba(0,0,0,0.1); box-shadow: 0 8px 40px rgba(0,0,0,0.14); }
        [data-theme="light"] .nb-drop-head { color: #94a3b8; border-color: rgba(0,0,0,0.06); background: rgba(0,0,0,0.02); }
        [data-theme="light"] .nb-drop-search-wrap { border-color: rgba(0,0,0,0.06); background: rgba(0,0,0,0.02); }
        [data-theme="light"] .nb-drop-search { color: #0f172a; }
        [data-theme="light"] .nb-drop-search::placeholder { color: #cbd5e1; }
        [data-theme="light"] .nb-drop-search-icon { color: #94a3b8; }
        [data-theme="light"] .nb-drop-grid { background: rgba(0,0,0,0.06); }
        [data-theme="light"] .nb-drop-row { background: #fff; }
        [data-theme="light"] .nb-drop-row:hover { background: rgba(0,0,0,0.03); }
        [data-theme="light"] .nb-drop-name { color: #475569; }
        [data-theme="light"] .nb-drop-crest { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.06); }
        [data-theme="light"] .nb-mob { background: rgba(255,255,255,0.99); border-color: rgba(0,0,0,0.08); }
        [data-theme="light"] .nb-mob-back { color: #64748b; border-color: rgba(0,0,0,0.08); background: rgba(0,0,0,0.03); }
        [data-theme="light"] .nb-mob-item { color: #475569; border-color: rgba(0,0,0,0.06); background: rgba(0,0,0,0.02); }
        [data-theme="light"] .nb-mob-item:hover { color: #0f172a; background: rgba(0,0,0,0.05); }
        [data-theme="light"] .nb-mob-on { background: rgba(0,0,0,0.06) !important; }
        [data-theme="light"] .nb-mob-ico { background: rgba(0,0,0,0.04); }
        [data-theme="light"] .nb-mob-sec { color: #94a3b8; }
        [data-theme="light"] .nb-mob-league { color: #475569; border-color: rgba(0,0,0,0.05); }
        [data-theme="light"] .nb-mob-league:hover { background: rgba(0,0,0,0.04); }
        [data-theme="light"] .nb-mob-admin { color: #94a3b8; border-color: rgba(0,0,0,0.05); }

        /* ════════════════════════════════
           ANIMATIONS
        ════════════════════════════════ */
        @keyframes nbDropIn {
          from { opacity:0; transform:translateX(-50%) translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes nbFadeSlide {
          from { opacity:0; transform:translateY(-4px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes nbSlideDown {
          from { opacity:0; transform:translateY(-10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes nbMobItem {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes nbPing {
          0%,100% { transform:scale(1); opacity:0.55; }
          50%     { transform:scale(2.4); opacity:0; }
        }
      `}</style>
    </>
  );
}