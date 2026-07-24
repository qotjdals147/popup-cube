const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

let client;

/**
 * 서버용 Supabase 클라이언트 — service_role 키 사용 (RLS 우회, 서버 전용).
 * 절대 브라우저/웹 코드에 이 키를 노출하지 않을 것.
 */
function getSupabaseAdmin() {
  if (!client) {
    if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
      throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not set (see server/.env.example)');
    }
    client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

module.exports = { getSupabaseAdmin };
