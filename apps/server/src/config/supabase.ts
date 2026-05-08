import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
// Supabase local development
dotenv.config();

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // service_role key

export const supabase = createClient(supabaseUrl, supabaseKey);