import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// NOTE: this is a *live binding*. Controllers import `supabase` and always see the
// current value, which lets the automated tests swap in an in-memory fake
// (see test/fakeSupabase.js) without touching any controller code.
export let supabase = (env.supabaseUrl && env.supabaseServiceRoleKey)
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

/** Test seam only. Never called by application code. */
export function __setSupabaseForTests(client) {
  supabase = client;
}
