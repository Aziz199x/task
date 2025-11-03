import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL is not set!');
  throw new Error('VITE_SUPABASE_URL is not set!');
}
if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_ANON_KEY is not set!');
  throw new Error('VITE_SUPABASE_ANON_KEY is not set!');
}

console.log('Supabase URL being used:', supabaseUrl); // Added for debugging

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage, 
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});