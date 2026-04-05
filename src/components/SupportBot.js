import React, { useState, useRef, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const I = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const MessageIcon = p => <I {...p} d={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>}/>;
const XIcon       = p => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const SendIcon    = p => <I {...p} d={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>}/>;
const BotIcon     = p => <I {...p} d={<><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></>}/>;

const QUICK_QUESTIONS = [
  'How do predictions work?',
  'What leagues are covered?',
  'How do I track my picks?',
  'Is it free to use?',
];

export default function SupportBot() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm Rina, your AI support assistant ⚽\n\nHow can I help you today?",
    }
  ]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [unread,   setUnread]   = useState(0);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const resp = await fetch(`${API_BASE}/support/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });

      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment or check our help section at scorinai.com ⚽",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl z-50 transition-all hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #22d3ee, #a855f7)',
          boxShadow: '0 8px 32px rgba(34,211,238,0.35)',
        }}>
        {open
          ? <XIcon className="w-6 h-6 text-white"/>
          : <MessageIcon className="w-6 h-6 text-white"/>
        }
        {!open && unread > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-[10px] font-black text-white">{unread}</span>
          </div>
        )}
      </button>

      {/* ── Chat Panel ── */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl z-50 flex flex-col"
          style={{
            background: 'rgba(6,10,20,0.98)',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '520px',
            animation: 'botSlideIn 0.2s cubic-bezier(0.16,1,0.3,1)',
            fontFamily: "'Outfit', sans-serif",
          }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]"
            style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(168,85,247,0.08))' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#22d3ee,#a855f7)' }}>
              <BotIcon className="w-4 h-4 text-white"/>
            </div>
            <div>
              <p className="text-white font-black text-sm">Rina</p>
              <p className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"/>
                AI Assistant · Online
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-slate-600 hover:text-white transition-colors">
              <XIcon className="w-4 h-4"/>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 340, scrollbarWidth: 'none' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center mr-2 flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg,#22d3ee,#a855f7)' }}>
                    <BotIcon className="w-3 h-3 text-white"/>
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'rounded-tr-sm text-white'
                    : 'rounded-tl-sm text-slate-300'
                }`}
                  style={{
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg,#22d3ee,#0891b2)'
                      : 'rgba(255,255,255,0.06)',
                  }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center mr-2 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#22d3ee,#a855f7)' }}>
                  <BotIcon className="w-3 h-3 text-white"/>
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-500"
                        style={{ animation: `botDot 1.2s ease-in-out ${i*0.2}s infinite` }}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  className="text-[10px] px-2.5 py-1 rounded-full border transition-all hover:border-cyan-400/50 hover:text-cyan-400"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#64748b', background: 'rgba(255,255,255,0.03)' }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 border border-white/[0.08]"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask me anything…"
                className="flex-1 bg-transparent text-white text-xs placeholder-slate-600 outline-none"
              />
              <button onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: input.trim() && !loading ? 'linear-gradient(135deg,#22d3ee,#a855f7)' : 'rgba(255,255,255,0.05)',
                }}>
                <SendIcon className="w-3 h-3 text-white"/>
              </button>
            </div>
            <p className="text-[9px] text-slate-700 text-center mt-1.5">Rina · Powered by Claude AI</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes botSlideIn { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes botDot { 0%,80%,100% { transform:scale(0.6); opacity:0.4; } 40% { transform:scale(1); opacity:1; } }
      `}</style>
    </>
  );
}
