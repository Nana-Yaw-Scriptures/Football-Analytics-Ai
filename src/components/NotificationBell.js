import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const I = ({ d, className = "w-5 h-5" }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>);
const BellIcon = (p) => <I {...p} d={<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>}/>;
const XIcon = (p) => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const ActivityIcon = (p) => <I {...p} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>;
const TargetIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>;
const CheckIcon = (p) => <I {...p} d={<><polyline points="20 6 9 17 4 12"/></>}/>;
const AlertIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}/>;
const ZapIcon = (p) => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>;
const ClockIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const TrashIcon = (p) => <I {...p} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>}/>;

function NotificationBell({ onNavigate }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [liveCount, setLiveCount] = useState(0);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const panelRef = useRef(null);
  const pollRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    const notifs = [];

    // 1. Live matches
    try {
      const resp = await fetch(`${API_BASE}/live/now`);
      if (resp.ok) {
        const data = await resp.json();
        const live = Array.isArray(data) ? data : [];
        setLiveCount(live.length);
        if (live.length > 0) {
          notifs.push({
            id: 'live-count',
            type: 'live',
            icon: ActivityIcon,
            color: '#ef4444',
            title: `${live.length} Match${live.length > 1 ? 'es' : ''} Live Now`,
            desc: live.slice(0, 3).map(f => `${f.homeTeam} ${f.homeGoals ?? 0}-${f.awayGoals ?? 0} ${f.awayTeam}`).join(' · '),
            time: 'Now',
            action: () => { onNavigate('live'); setOpen(false); },
          });
          // Individual goal alerts for live matches
          live.forEach(f => {
            if ((f.homeGoals || 0) + (f.awayGoals || 0) > 0) {
              notifs.push({
                id: `live-${f.id}`,
                type: 'goal',
                icon: ZapIcon,
                color: '#f59e0b',
                title: `${f.homeTeam} ${f.homeGoals}-${f.awayGoals} ${f.awayTeam}`,
                desc: `${f.elapsed || '?'}' · ${f.status === 'HT' ? 'Half Time' : 'In Progress'}`,
                time: `${f.elapsed}'`,
                action: () => { onNavigate('match', { fixtureId: f.id }); setOpen(false); },
              });
            }
          });
        }
      }
    } catch {}

    // 2. Unresolved predictions — fetch from Supabase (user's own only)
    if (user) {
      try {
        const { supabase } = await import('../supabaseClient');
        const { data } = await supabase
          .from('predictions')
          .select('id, resolved, correct')
          .eq('user_id', user.id);

        const all = data || [];
        const unresolved = all.filter(p => !p.resolved).length;
        const resolved   = all.filter(p => p.resolved).length;
        const correct    = all.filter(p => p.correct).length;
        const accuracy   = resolved > 0 ? Math.round((correct / resolved) * 100) : 0;

        setUnresolvedCount(unresolved);

        if (unresolved > 0) {
          notifs.push({
            id: 'unresolved',
            type: 'prediction',
            icon: ClockIcon,
            color: '#a855f7',
            title: `${unresolved} Prediction${unresolved > 1 ? 's' : ''} Pending`,
            desc: 'Open History to check results against actual scores',
            time: 'Action needed',
            action: () => { onNavigate('history'); setOpen(false); },
          });
        }
        if (resolved > 0) {
          notifs.push({
            id: 'accuracy',
            type: 'accuracy',
            icon: TargetIcon,
            color: '#10b981',
            title: `Your Accuracy: ${accuracy}%`,
            desc: `${correct}/${resolved} correct predictions`,
            time: 'Updated',
            action: () => { onNavigate('history'); setOpen(false); },
          });
        }
      } catch {}
    } else {
      setUnresolvedCount(0);
    }

    setNotifications(notifs);
  };

  // Initial fetch + polling every 2 minutes — re-run when auth changes
  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 120000);
    return () => clearInterval(pollRef.current);
  }, [user]); // eslint-disable-line

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const totalBadge = liveCount + unresolvedCount;
  const clearAll = () => { setNotifications([]); setLiveCount(0); setUnresolvedCount(0); };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.08] transition-all group">
        <BellIcon className="w-4 h-4 group-hover:text-cyan-400 transition-colors" />
        {totalBadge > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center px-1 shadow-lg shadow-red-500/30"
            style={{ animation: 'bellPulse 2s ease-in-out infinite' }}>
            <span className="text-[11px] font-black text-white" style={{ fontFamily: 'JetBrains Mono' }}>{totalBadge > 9 ? '9+' : totalBadge}</span>
          </div>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-[#0c1222] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
          style={{ animation: 'notifDropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)', fontFamily: "'Outfit', sans-serif" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <BellIcon className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">Notifications</span>
              {totalBadge > 0 && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400" style={{ fontFamily: 'JetBrains Mono' }}>{totalBadge}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-slate-600 hover:text-slate-400 transition-colors p-1 rounded-lg hover:bg-white/5">
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
            {notifications.length > 0 ? (
              notifications.map((notif, i) => {
                const NotifIcon = notif.icon;
                return (
                  <button key={notif.id} onClick={notif.action}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-all text-left border-b border-white/[0.03]"
                    style={{ animation: `notifFadeIn 0.15s ease-out ${i * 0.04}s both` }}>
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: notif.color + '15' }}>
                      <NotifIcon className="w-4 h-4" style={{ color: notif.color }} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{notif.title}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{notif.desc}</p>
                    </div>
                    {/* Time */}
                    <div className="flex-shrink-0">
                      <span className="text-[11px] text-slate-600 whitespace-nowrap">{notif.time}</span>
                      {notif.type === 'live' && (
                        <div className="flex justify-end mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-10 text-center">
                <BellIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-xs font-medium">No notifications</p>
                <p className="text-slate-700 text-[12px] mt-0.5">You're all caught up</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between">
              <button onClick={() => { onNavigate('live'); setOpen(false); }}
                className="text-[12px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">View Live Scores</button>
              <button onClick={() => { onNavigate('history'); setOpen(false); }}
                className="text-[12px] text-purple-400 hover:text-purple-300 font-semibold transition-colors">Prediction History</button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bellPulse{0%,100%{transform:scale(1);}50%{transform:scale(1.1);}}
        @keyframes notifDropIn{from{opacity:0;transform:translateY(-8px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes notifFadeIn{from{opacity:0;transform:translateX(8px);}to{opacity:1;transform:translateX(0);}}
      `}</style>
    </div>
  );
}

export default NotificationBell;