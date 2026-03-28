import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jiykqbxmgldxbgndvnhh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppeWtxYnhtZ2xkeGJnbmR2bmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDMyNTIsImV4cCI6MjA4NTk3OTI1Mn0.7LxXyl-N26b3x6e_sWtV6HhkFfjgkn4zHZyqx9PPoME';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);