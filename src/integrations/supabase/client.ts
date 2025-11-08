import { createClient } from '@supabase/supabase-js';

// For Capacitor builds, we need to use hardcoded values
// since environment variables are not available in the final build
const supabaseUrl = 'https://jqrhvrahhocszjoqngji.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxcmh2cmFoaG9jc3pqb3FuZ2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMjQ3NzQsImV4cCI6MjA3NDgwMDc3NH0.87ntyFgfuInBtiXrZa_gymS049Y0YyULsowgIagw2ro';

console.log('Supabase URL being used:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});