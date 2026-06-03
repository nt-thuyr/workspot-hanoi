import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[Supabase] Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env');
}

console.log('[Supabase Config] URL:', supabaseUrl);
console.log('[Supabase Config] Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
};

/**
 * Client dành cho Admin API + DB operations (register, profile, cafe, v.v.)
 * このクライアントで signInWithPassword を絶対に呼び出さないこと —
 * vì signInWithPassword sẽ ghi user session vào bộ nhớ, làm mất service_role
 * và khiến các DB query sau bị chặn bởi RLS.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, clientOptions);

/**
 * Client riêng CHỈ dành cho signInWithPassword (login).
 * ユーザーのセッションが上のsupabaseクライアントに影響を与えないように分離する。
 */
export const supabaseAuth = createClient(supabaseUrl, supabaseKey, clientOptions);