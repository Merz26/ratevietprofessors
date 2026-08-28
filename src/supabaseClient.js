import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const supabaseUrl = (envUrl && isValidUrl(envUrl) && envUrl !== 'your_actual_supabase_url_here') 
  ? envUrl 
  : 'https://hpvhzlsnhunqkooyvjac.supabase.co';

const supabaseAnonKey = (envKey && envKey !== 'your_actual_anon_key_here')
  ? envKey
  : 'sb_publishable_Sv9P7iEdtU3b0iDXe05W2w_cvIDjt1r';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
