import {
  resolveAuthSession
} from '../../utils/supabase-auth'

export default defineEventHandler(async (event) => {
  const session = await resolveAuthSession(event)

  if (!session) {
    return { authenticated: false }
  }

  return {
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email || ''
    }
  }
})
