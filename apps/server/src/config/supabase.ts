import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
// Supabase local development
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // service_role key

export const supabase = createClient(supabaseUrl, supabaseKey);