import { createClient } from '@supabase/supabase-js';

// Use production variables for Capacitor builds
const supabaseUrl = 'https://jqrhvrahhocszjoqngji.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxcmh2cmFoaG9jc3pqb3FuZ2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMjQ3NzQsImV4cCI6MjA3NDgwMDc3NH0.87ntyFgfuInBtiXrZa_gymS049Y0YyULsowgIagw2ro';

if (!supabaseUrl) {
  console.error('Supabase URL is not set!');
  throw new Error('Supabase URL is not set!');
}
if (!supabaseAnonKey) {
  console.error('Supabase Anon Key is not set!');
  throw new Error('Supabase Anon Key is not set!');
}

console.log('Supabase URL being used:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});