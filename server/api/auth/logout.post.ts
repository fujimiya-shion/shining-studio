import { clearAuthCookies } from '../../utils/supabase-auth'

export default defineEventHandler((event) => {
  clearAuthCookies(event)
  return { ok: true }
})
