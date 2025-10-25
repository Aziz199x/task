import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL is not set!');
  // You might want to throw an error or handle this more robustly in a production app
}
if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_ANON_KEY is not set!');
  // You might want to throw an error or handle this more robustly in a production app
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);