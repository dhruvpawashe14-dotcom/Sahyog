// Single Supabase client instance — everything else imports from here.
// Credentials come from Vite env vars, never hardcoded.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fail loudly in dev rather than silently returning a null client.
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Check your .env.');
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
