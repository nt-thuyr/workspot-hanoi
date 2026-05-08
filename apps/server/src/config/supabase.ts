import { createClient } from '@supabase/supabase-js';

// Supabase local development
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // service_role key

export const supabase = createClient(supabaseUrl, supabaseKey);