import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
  throw new Error(
    'Please click the "Connect to Supabase" button in the top right corner to set up your Supabase project.'
  );
}

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase anon key. Please connect your Supabase project.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'dochelper-ai@1.0.0'
    }
  },
  db: {
    schema: 'public'
  }
});

// Add connection state management
let isConnected = false;
let connectionError: Error | null = null;

export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    isConnected = true;
    connectionError = null;
    return true;
  } catch (error) {
    isConnected = false;
    connectionError = error as Error;
    return false;
  }
};

export const getConnectionState = () => ({
  isConnected,
  connectionError
});