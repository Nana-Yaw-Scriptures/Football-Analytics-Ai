import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState('free'); // 'free' | 'pro' — subscription-ready

  // Derive plan from user metadata (future: fetch from Supabase subscriptions table)
  const isPro = userPlan === 'pro';
  const canSeeAIPicks = !!user; // Phase 1: auth only. Phase 2: isPro

  useEffect(() => {
<<<<<<< HEAD
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
=======
    // Get initial session — timeout after 6 s so slow networks never freeze the app
    const SESSION_TIMEOUT = 6000;
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise(resolve =>
      setTimeout(() => resolve({ data: { session: null } }), SESSION_TIMEOUT)
    );
    Promise.race([sessionPromise, timeoutPromise]).then(({ data: { session } }) => {
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      // After OAuth redirect, go to home if on empty hash
      if (event === 'SIGNED_IN') {
        const hash = window.location.hash.replace('#/', '').replace('#', '');
        if (!hash || hash === 'login') {
          window.location.hash = '/home';
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUpWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Reset to home after logout
    window.location.hash = '/home';
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, userPlan, isPro, canSeeAIPicks, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
