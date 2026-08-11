import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpvhzlsnhunqkooyvjac.supabase.co';
const supabaseAnonKey = 'sb_publishable_Sv9P7iEdtU3b0iDXe05W2w_cvIDjt1r';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
