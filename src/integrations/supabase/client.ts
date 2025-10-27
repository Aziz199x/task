import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not set!');
}
if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not set!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage, // Explicitly use localStorage for session storage
    persistSession: true, // Ensure session persistence is enabled
    autoRefreshToken: true, // Automatically refresh tokens
    detectSessionInUrl: true, // Detect session from URL (useful for redirects)
  },
});