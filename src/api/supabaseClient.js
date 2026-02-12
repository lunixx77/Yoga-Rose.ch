import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

if (import.meta.env.DEV) {
  if (url && anonKey) console.log('[Supabase] Verbindung aktiv:', url);
  else if (url || anonKey) console.warn('[Supabase] Fehlende Umgebungsvariable: VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY müssen beide gesetzt sein.');
}

export const useSupabase = () => !!supabase;
