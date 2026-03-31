import React, { useState } from 'react';

const I = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const XIcon      = p => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const ShieldIcon = p => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;

/* ── Social Icons ── */
const TwitterX = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const Facebook = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
const Instagram = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
);
const TikTok = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
  </svg>
);
const YouTube = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.75 15.5V8.5l6.5 3.5-6.5 3.5z"/>
  </svg>
);
const Snapchat = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.166 0c.93 0 4.064.268 5.55 3.69.46 1.063.35 2.86.276 4.087l-.006.09c-.005.09-.01.178-.013.264.234-.05.485-.13.715-.24.162-.08.34-.12.516-.12.37 0 .782.19.97.55.217.414.116.892-.298 1.208-.044.034-.45.316-1.124.52-.116.036-.23.073-.344.11a5.95 5.95 0 0 0-.42.162c.025.073.055.153.09.24.368.93 1.08 1.727 2.11 2.367.46.284.95.497 1.457.63.287.076.454.368.376.655-.065.236-.233.43-.457.518-.53.207-1.084.368-1.653.476-.065.013-.124.05-.16.105-.062.09-.07.204-.024.304.073.163.15.332.205.497.05.147.036.308-.04.444a.633.633 0 0 1-.384.295c-.168.045-.34.015-.484-.082-.262-.176-.503-.243-.77-.243-.263 0-.538.065-.847.195-.52.22-1.064.33-1.617.33-.603 0-1.198-.138-1.747-.41-.535-.267-1.044-.403-1.512-.403-.254 0-.49.042-.702.125-.308.12-.563.185-.798.185-.263 0-.506-.066-.766-.24a.636.636 0 0 1-.386-.296.589.589 0 0 1-.038-.445c.055-.165.132-.334.205-.497.046-.1.038-.214-.024-.304a.248.248 0 0 0-.16-.105 10.16 10.16 0 0 1-1.653-.476.635.635 0 0 1-.457-.518c-.078-.287.09-.58.376-.655a5.5 5.5 0 0 0 1.457-.63c1.03-.64 1.742-1.437 2.11-2.368.035-.086.065-.166.09-.24a5.95 5.95 0 0 0-.42-.16c-.114-.038-.228-.075-.344-.112-.674-.204-1.08-.486-1.124-.52-.414-.315-.515-.793-.298-1.207.188-.36.6-.55.97-.55.175 0 .354.04.516.12.23.11.48.19.715.24-.003-.086-.008-.174-.013-.264l-.006-.09c-.075-1.226-.184-3.024.276-4.087C8.102.268 11.236 0 12.166 0z"/>
  </svg>
);

/* ── Disclaimer Modal ── */
export function DisclaimerModal({ onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-[60]" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}/>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-2xl rounded-3xl overflow-hidden pointer-events-auto"
          style={{
            background: 'linear-gradient(145deg,#070a17,#050810)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
            animation: 'disclaimerIn 0.3s cubic-bezier(0.16,1,0.3,1)',
            maxHeight: '90vh',
          }}>

          {/* Modal header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.07]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <ShieldIcon className="w-5 h-5 text-yellow-400"/>
              </div>
              <div>
                <p className="text-white font-black text-base">Legal Disclaimer</p>
                <p className="text-slate-400 text-sm">Please read before using Scorina AI</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
              <XIcon className="w-4 h-4"/>
            </button>
          </div>

          {/* Modal body */}
          <div className="overflow-y-auto px-7 py-6 space-y-5" style={{ maxHeight: 'calc(90vh - 160px)' }}>

            <div className="rounded-2xl border p-5" style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
              <p className="text-yellow-400 font-black text-base mb-2">⚠️ Not Gambling or Betting Advice</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                Scorina AI is an <strong className="text-white">entertainment and analytical platform only</strong>.
                Predictions, statistics, and insights are generated by artificial intelligence and are intended solely
                for informational and entertainment purposes. <strong className="text-white">Nothing on this platform
                constitutes gambling advice, betting tips, or financial recommendations</strong> of any kind.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-white font-black text-base mb-2">🌍 Gambling Laws & Regulations</p>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                Online gambling and sports betting are regulated differently across jurisdictions.
                It is your sole responsibility to ensure that your use of any third-party betting or gambling service
                complies with the laws applicable in your country, state, or region. Scorina AI does not facilitate,
                promote, or endorse any form of real-money wagering.
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                If you use AI-generated predictions in conjunction with betting activities, you do so entirely at your
                own risk. Scorina AI accepts no liability for any financial losses, legal consequences, or damages
                arising from such use.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-white font-black text-base mb-2">🤖 AI Output Accuracy</p>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                All predictions and analyses are generated by machine learning models trained on historical football
                data. These models do not have access to real-time injury news, team selection, weather conditions,
                or other match-day variables that may materially affect outcomes.
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                <strong className="text-white">AI predictions are probabilistic — never guarantees.</strong> Past
                accuracy does not guarantee future results. Scorina AI makes no warranty regarding the accuracy,
                completeness, or fitness of any AI-generated content for any particular purpose.
              </p>
            </div>

            <div className="rounded-2xl border p-5" style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}>
              <p className="text-emerald-400 font-black text-base mb-2">💚 Responsible Gaming</p>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Gambling can be addictive and harmful. If you or someone you know is experiencing problems, please seek help:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'GamCare (UK)',                  url: 'https://www.gamcare.org.uk'           },
                  { name: 'BeGambleAware',                 url: 'https://www.begambleaware.org'        },
                  { name: 'National Problem Gambling (US)', url: 'https://www.ncpgambling.org'         },
                  { name: 'Gambling Therapy',              url: 'https://www.gamblingtherapy.org'      },
                ].map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:text-emerald-300"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', color: '#34d399' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"/>
                    {r.name}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-5" style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.15)' }}>
              <p className="text-red-400 font-black text-base mb-2">🔞 Age Restriction</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                Scorina AI is intended for users aged <strong className="text-white">18 years and older</strong>.
                By using this platform, you confirm that you are of legal age in your jurisdiction to access
                sports analytics and prediction services.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-white font-black text-base mb-2">© Intellectual Property</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                All AI models, prediction algorithms, platform design, and content produced by Scorina AI are
                proprietary. Football statistics and league data are sourced from licensed third-party providers.
                Club names, logos, and trademarks belong to their respective owners and are used for
                informational purposes only.
              </p>
            </div>

            <p className="text-slate-600 text-xs text-center pb-1">
              Last updated: March 2026 · By using Scorina AI you agree to these terms.
            </p>
          </div>

          {/* Modal footer */}
          <div className="px-7 py-5 border-t border-white/[0.07]">
            <button onClick={onClose}
              className="w-full py-3.5 rounded-2xl font-black text-base transition-all"
              style={{
                background: 'linear-gradient(135deg,#22d3ee,#0891b2)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(34,211,238,0.25)',
              }}>
              I Understand — Continue to Scorina AI
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes disclaimerIn{from{opacity:0;transform:scale(0.96) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </>
  );
}

/* ══════════════════════════════════════
   MAIN FOOTER
══════════════════════════════════════ */
export default function Footer({ onNavigate }) {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const year = new Date().getFullYear();

  const SOCIAL = [
    { name: 'X',         Icon: TwitterX,   href: 'https://x.com/ScorinaA67179',          color: '#e7e9ea',  bg: 'rgba(231,233,234,0.08)' },
    { name: 'Facebook',  Icon: Facebook,   href: 'https://facebook.com/scorinai',         color: '#1877f2',  bg: 'rgba(24,119,242,0.08)'  },
    { name: 'Instagram', Icon: Instagram,  href: 'https://instagram.com/scorinai',        color: '#e1306c',  bg: 'rgba(225,48,108,0.08)'  },
    { name: 'TikTok',    Icon: TikTok,     href: 'https://tiktok.com/@scorinai',          color: '#fe2c55',  bg: 'rgba(254,44,85,0.08)'   },
    { name: 'YouTube',   Icon: YouTube,    href: 'https://youtube.com/@scorinai',         color: '#ff0000',  bg: 'rgba(255,0,0,0.08)'     },
    { name: 'Snapchat',  Icon: Snapchat,   href: 'https://snapchat.com/add/scorinai',     color: '#fffc00',  bg: 'rgba(255,252,0,0.08)'   },
  ];

  const cols = [
    {
      title: 'Platform',
      links: [
        { label: 'AI Analysis',     action: () => onNavigate('analysis')    },
        { label: 'Live Scores',     action: () => onNavigate('live')        },
        { label: 'Player Database', action: () => onNavigate('players')     },
        { label: 'Managers',        action: () => onNavigate('managers')    },
        { label: 'Best Picks',      action: () => onNavigate('bestpicks')   },
        { label: 'Season Simulator',action: () => onNavigate('simulator')   },
        { label: 'My Picks',        action: () => onNavigate('pickem')      },
        { label: 'Leaderboard',     action: () => onNavigate('leaderboard') },
      ],
    },
    {
      title: 'Leagues',
      links: [
        { label: 'Premier League',   action: () => onNavigate('league', 'Premier League')   },
        { label: 'La Liga',          action: () => onNavigate('league', 'La Liga')          },
        { label: 'Bundesliga',       action: () => onNavigate('league', 'Bundesliga')       },
        { label: 'Serie A',          action: () => onNavigate('league', 'Serie A')          },
        { label: 'Ligue 1',          action: () => onNavigate('league', 'Ligue 1')          },
        { label: 'Primeira Liga',    action: () => onNavigate('league', 'Primeira Liga')    },
        { label: 'Champions League', action: () => onNavigate('league', 'Champions League') },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Disclaimer',         action: () => setShowDisclaimer(true) },
        { label: 'Terms of Use',       action: () => setShowDisclaimer(true) },
        { label: 'Privacy Policy',     action: () => setShowDisclaimer(true) },
        { label: 'Cookie Policy',      action: () => setShowDisclaimer(true) },
        { label: 'Responsible Gaming', action: () => setShowDisclaimer(true) },
        { label: 'AI Content Policy',  action: () => setShowDisclaimer(true) },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'GamCare',          href: 'https://www.gamcare.org.uk'       },
        { label: 'BeGambleAware',    href: 'https://www.begambleaware.org'    },
        { label: 'Gambling Therapy', href: 'https://www.gamblingtherapy.org'  },
        { label: 'GamStop (UK)',     href: 'https://www.gamstop.co.uk'        },
        { label: 'NCPG (US)',        href: 'https://www.ncpgambling.org'      },
      ],
    },
  ];

  return (
    <>
      {showDisclaimer && <DisclaimerModal onClose={() => setShowDisclaimer(false)}/>}

      <footer style={{ background: '#020407', fontFamily: "'Outfit',sans-serif", borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        {/* ── Disclaimer banner ── */}
        <div style={{ background: 'rgba(245,158,11,0.05)', borderBottom: '1px solid rgba(245,158,11,0.12)' }}>
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <ShieldIcon className="w-4 h-4 text-yellow-500"/>
              <span className="text-yellow-500 text-sm font-black uppercase tracking-widest">Disclaimer</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed flex-1">
              Scorina AI is for <strong className="text-slate-200">entertainment & analytics only</strong> — not
              gambling advice. AI predictions do not guarantee outcomes. Always gamble responsibly. 18+ only.
            </p>
            <button onClick={() => setShowDisclaimer(true)}
              className="text-sm font-bold flex-shrink-0 px-4 py-2 rounded-xl transition-all hover:bg-yellow-500/20"
              style={{ color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.08)' }}>
              Read Full Disclaimer
            </button>
          </div>
        </div>

        {/* ── Main body ── */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-14 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-10 mb-14">

            {/* ── Brand column ── */}
            <div className="md:col-span-2">
              {/* Logo */}
              <div className="flex items-baseline gap-1.5 mb-5">
                <span className="text-3xl font-black text-white tracking-tight">Scorina</span>
                <div style={{
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  background:'linear-gradient(135deg,#22d3ee,#a855f7)',
                  borderRadius:'9px', padding:'3px 9px', marginLeft:'2px',
                  boxShadow:'0 0 20px rgba(34,211,238,0.3)', position:'relative', top:'-3px',
                }}>
                  <span style={{ fontSize:'16px', fontWeight:900, color:'white', letterSpacing:'-0.03em', fontFamily:'JetBrains Mono,monospace' }}>AI</span>
                </div>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed mb-6" style={{ maxWidth: 300 }}>
                AI-powered football analytics across Europe's top 7 leagues.
                Predictions, live scores, player intelligence, fantasy picks and
                competitive rankings — all in one platform.
              </p>

              {/* Social links */}
              <p className="text-xs font-black text-slate-600 uppercase tracking-[0.2em] mb-3">Follow Us</p>
              <div className="flex items-center gap-2 flex-wrap">
                {SOCIAL.map(s => (
                  <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                    title={s.name}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:-translate-y-0.5"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#475569' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = s.bg;
                      e.currentTarget.style.borderColor = `${s.color}50`;
                      e.currentTarget.style.color = s.color;
                      e.currentTarget.style.boxShadow = `0 4px 16px ${s.color}30`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                      e.currentTarget.style.color = '#475569';
                      e.currentTarget.style.boxShadow = 'none';
                    }}>
                    <s.Icon className="w-4 h-4"/>
                  </a>
                ))}
              </div>
            </div>

            {/* ── Link columns ── */}
            {cols.map((col, ci) => (
              <div key={ci} className="md:col-span-1">
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-5">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map((lk, li) => (
                    <li key={li}>
                      {lk.href ? (
                        <a href={lk.href} target="_blank" rel="noopener noreferrer"
                          className="text-slate-400 text-sm transition-colors hover:text-white flex items-center gap-1.5 group">
                          <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-emerald-400 transition-colors flex-shrink-0"/>
                          {lk.label}
                        </a>
                      ) : (
                        <button onClick={lk.action}
                          className="text-slate-400 text-sm transition-colors hover:text-white text-left flex items-center gap-1.5 group w-full">
                          <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-cyan-400 transition-colors flex-shrink-0"/>
                          {lk.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>

                {/* 18+ badge under Support column */}
                {col.title === 'Support' && (
                  <div className="mt-6 inline-flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <span className="text-red-400 font-black text-base">18+</span>
                    <span className="text-slate-500 text-xs">Play Responsibly</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Divider ── */}
          <div className="h-px mb-8"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)' }}/>

          {/* ── Bottom row ── */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
              <p className="text-slate-500 text-sm">© {year} Scorina AI. All rights reserved.</p>
              <span className="hidden sm:block text-slate-800">|</span>
              <p className="text-slate-500 text-sm">
                Data by{' '}
                <a href="https://www.api-football.com" target="_blank" rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors underline underline-offset-2">API-Football</a>
                {' '}&{' '}
                <a href="https://understat.com" target="_blank" rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors underline underline-offset-2">Understat</a>
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
              <span className="text-emerald-400 text-sm font-semibold">All systems operational</span>
            </div>
          </div>

          {/* ── Legal fine print ── */}
          <div className="rounded-2xl p-5 border border-white/[0.05]"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            <p className="text-slate-500 text-sm leading-relaxed">
              <strong className="text-slate-400">Important Notice:</strong> Scorina AI provides football analytics
              and AI-generated predictions for entertainment purposes only. This platform is not affiliated with any
              football league, club, or governing body. All club badges, names, and trademarks are the property of
              their respective owners. Scorina AI does not promote or endorse gambling. Any use of our predictions
              in conjunction with real-money wagering is done entirely at the user's own risk and discretion.
              Users are responsible for complying with the gambling laws in their jurisdiction.
              Please gamble responsibly — if gambling is affecting you or someone you know, seek help immediately.
              <button onClick={() => setShowDisclaimer(true)}
                className="ml-2 text-cyan-500 hover:text-cyan-400 transition-colors font-semibold underline underline-offset-2">
                View full disclaimer
              </button>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}