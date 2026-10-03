import { createClient } from '@supabase/supabase-js'
import config from './index.js'

/**
 * Service-role client: bypasses RLS, so it must never be exposed to the browser.
 */
export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export default supabase