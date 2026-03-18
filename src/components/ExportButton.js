import React, { useState } from 'react';

const I = ({ d, className = "w-5 h-5" }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>);
const DownloadIcon = (p) => <I {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}/>;
const LoaderIcon = (p) => <I {...p} d={<><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>}/>;
const CheckIcon = (p) => <I {...p} d={<><polyline points="20 6 9 17 4 12"/></>}/>;

function ExportButton({ onClick, label = 'Export PDF', size = 'md' }) {
  const [status, setStatus] = useState('idle'); // idle | loading | done

  const handleClick = async () => {
    setStatus('loading');
    try {
      await onClick();
      setStatus('done');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (e) {
      console.error('Export failed:', e);
      setStatus('idle');
    }
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[12px] gap-1.5',
    md: 'px-4 py-2 text-xs gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2',
  };

  return (
    <button onClick={handleClick} disabled={status === 'loading'}
      className={`flex items-center ${sizes[size]} rounded-xl font-semibold transition-all ${
        status === 'done'
          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5'
      } disabled:opacity-40`}>
      {status === 'loading' ? <LoaderIcon className="w-3.5 h-3.5 animate-spin" />
        : status === 'done' ? <CheckIcon className="w-3.5 h-3.5" />
        : <DownloadIcon className="w-3.5 h-3.5" />}
      {status === 'done' ? 'Downloaded!' : status === 'loading' ? 'Generating...' : label}
    </button>
  );
}

export default ExportButton;