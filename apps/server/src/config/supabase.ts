import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
// Supabase local development
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ozqmbwwefmfwaxkhltxq.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_9Jr_98HYgUbANMoo02O9Ng_zPdFT-bj';

console.log('[Supabase Config] URL:', supabaseUrl);
console.log('[Supabase Config] Key (first 20 chars):', supabaseKey?.substring(0, 20) + '...');

export const supabase = createClient(supabaseUrl, supabaseKey);