import { signInWithPassword, setAuthCookies } from '../../utils/supabase-auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string, password?: string }>(event)
  const email = body.email?.trim()
  const password = body.password

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required.'
    })
  }

  try {
    const session = await signInWithPassword(email, password)
    setAuthCookies(event, session.access_token, session.refresh_token, session.expires_in)

    return { ok: true }
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password.'
    })
  }
})
