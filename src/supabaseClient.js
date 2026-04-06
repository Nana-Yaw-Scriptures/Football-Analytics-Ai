import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL  || 'https://jiykqbxmgldxbgndvnhh.supabase.co';
<<<<<<< HEAD
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// Safe client — won't crash if key is missing
let supabaseClient;
try {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON);
} catch (e) {
  console.warn('[Supabase] Failed to initialize:', e.message);
  // Return a safe no-op client
  supabaseClient = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOAuth: async () => ({ error: new Error('Supabase not configured') }),
      signInWithPassword: async () => ({ error: new Error('Supabase not configured') }),
      signUp: async () => ({ error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) }),
      insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
      update: () => ({ eq: () => ({ data: null, error: null }) }),
      delete: () => ({ eq: () => ({ data: null, error: null }) }),
    }),
  };
=======
// Empty string fallback so the try-catch fires cleanly instead of using a broken placeholder JWT
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON || '';

const noopClient = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithOAuth: async () => ({ error: new Error('Supabase not configured') }),
    signInWithPassword: async () => ({ error: new Error('Supabase not configured') }),
    signUp: async () => ({ error: new Error('Supabase not configured') }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) }),
    insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
    update: () => ({ eq: () => ({ data: null, error: null }) }),
    delete: () => ({ eq: () => ({ data: null, error: null }) }),
  }),
};

let supabaseClient;
try {
  if (!SUPABASE_ANON) throw new Error('Missing REACT_APP_SUPABASE_ANON env variable');
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON);
} catch (e) {
  console.warn('[Supabase] Failed to initialize:', e.message);
  supabaseClient = noopClient;
>>>>>>> 403398d (fix: add fetch timeouts and Supabase session timeout for African mobile networks)
}

export const supabase = supabaseClient;
