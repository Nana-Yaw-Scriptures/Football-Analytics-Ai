import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const I = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const MailIcon   = p => <I {...p} d={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>}/>;
const LockIcon   = p => <I {...p} d={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}/>;
const EyeIcon    = p => <I {...p} d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}/>;
const EyeOffIcon = p => <I {...p} d={<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>}/>;
const AlertIcon  = p => <I {...p} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>;

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginPage({ onNavigate }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode,     setMode]     = useState('login'); // login | register
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const handleGoogle = async () => {
    try {
      setLoading(true); setError('');
      await signInWithGoogle();
    } catch (e) {
      setError(e.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        onNavigate('home');
      } else {
        await signUpWithEmail(email, password);
        setSuccess('Account created! Check your email to confirm your account.');
        setMode('login');
      }
    } catch (e) {
      setError(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center px-4"
      style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{ background: 'radial-gradient(circle,rgba(34,211,238,0.07) 0%,transparent 65%)' }}/>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 65%)' }}/>
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }}/>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/scorina_ai_logo.svg" alt="Scorina AI" className="w-10 h-10"
              onError={e => e.target.style.display='none'}/>
            <span className="text-2xl font-black text-white tracking-tight">Scorina AI</span>
          </div>
          <p className="text-slate-500 text-sm">Football analytics powered by AI</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/[0.08] overflow-hidden"
          style={{ background: 'rgba(10,14,26,0.95)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>

          {/* Top accent */}
          <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#22d3ee,#a855f7)' }}/>

          <div className="p-8">
            {/* Tab switcher */}
            <div className="flex gap-1 mb-8 rounded-2xl p-1.5 border border-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize"
                  style={{
                    background: mode === m ? 'rgba(34,211,238,0.12)' : 'transparent',
                    border: mode === m ? '1px solid rgba(34,211,238,0.25)' : '1px solid transparent',
                    color: mode === m ? '#22d3ee' : '#475569',
                  }}>
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {/* Google button */}
            <button onClick={handleGoogle} disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm transition-all mb-6 border border-white/[0.1] hover:border-white/[0.2]"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
              <GoogleIcon/>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }}/>
              <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }}/>
            </div>

            {/* Email form */}
            <form onSubmit={handleEmail} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"/>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-white placeholder-slate-600 outline-none transition-all border"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: email ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)' }}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"/>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm text-white placeholder-slate-600 outline-none transition-all border"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: password ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)' }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOffIcon className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/20"
                  style={{ background: 'rgba(239,68,68,0.08)' }}>
                  <AlertIcon className="w-4 h-4 text-red-400 flex-shrink-0"/>
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-500/20"
                  style={{ background: 'rgba(16,185,129,0.08)' }}>
                  <p className="text-emerald-400 text-sm">{success}</p>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#22d3ee,#0e7490)', color: '#000' }}>
                {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

        {/* Back to app */}
        <div className="text-center mt-6">
          <button onClick={() => onNavigate('home')}
            className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
            ← Back to Scorina AI
          </button>
        </div>
      </div>
    </div>
  );
}
