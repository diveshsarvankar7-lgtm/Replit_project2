import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * True only when Supabase credentials are present. When false, the app runs in
 * a fully functional "offline" mode: the simulator still works end-to-end,
 * analytics are simply skipped instead of crashing the page.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}

/**
 * Returns a browser Supabase client, or `null` when credentials are missing.
 * Callers MUST handle the null case. This prevents the hard crash that occurred
 * on deployments without Supabase env vars (createBrowserClient throws when the
 * URL/key are undefined).
 */
export function createClient() {
  if (!url || !anonKey) return null
  return createBrowserClient(url, anonKey, {
    // Secure cookies in production; not in dev, so localhost still works.
    cookieOptions: { secure: process.env.NODE_ENV === 'production' },
  })
}
