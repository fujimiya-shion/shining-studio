import type { H3Event } from 'h3'

const ACCESS_COOKIE = 'sb-access-token'
const REFRESH_COOKIE = 'sb-refresh-token'
const ACCESS_TOKEN_REFRESH_WINDOW_SECONDS = 120

export function getSupabaseConfig() {
  const config = useRuntimeConfig()
  const supabaseUrl = config.supabaseUrl as string
  const supabaseKey = config.supabaseKey as string

  if (!supabaseUrl || !supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing SUPABASE_URL or SUPABASE_KEY runtime config.'
    })
  }

  return { supabaseUrl, supabaseKey }
}

export function setAuthCookies(event: H3Event, accessToken: string, refreshToken: string, expiresInSeconds: number) {
  const secure = process.env.NODE_ENV === 'production'

  setCookie(event, ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.max(expiresInSeconds, 60)
  })

  setCookie(event, REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })
}

export function clearAuthCookies(event: H3Event) {
  const secure = process.env.NODE_ENV === 'production'

  setCookie(event, ACCESS_COOKIE, '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  })

  setCookie(event, REFRESH_COOKIE, '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  })
}

export function readAuthCookies(event: H3Event) {
  return {
    accessToken: getCookie(event, ACCESS_COOKIE) || '',
    refreshToken: getCookie(event, REFRESH_COOKIE) || ''
  }
}

type PasswordGrantResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
}

type UserResponse = {
  id: string
  email?: string
}

export type AuthSession = {
  accessToken: string
  user: UserResponse
}

export async function signInWithPassword(email: string, password: string) {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig()

  return await $fetch<PasswordGrantResponse>(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Content-Type': 'application/json'
    },
    body: {
      email,
      password
    }
  })
}

export async function refreshWithToken(refreshToken: string) {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig()

  return await $fetch<PasswordGrantResponse>(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Content-Type': 'application/json'
    },
    body: {
      refresh_token: refreshToken
    }
  })
}

export async function getUserFromAccessToken(accessToken: string) {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig()

  return await $fetch<UserResponse>(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${accessToken}`
    }
  })
}

function parseJwtExpiry(accessToken: string) {
  try {
    const payload = accessToken.split('.')[1]
    if (!payload) {
      return null
    }

    const normalized = payload.replaceAll('-', '+').replaceAll('_', '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const decoded = Buffer.from(padded, 'base64').toString('utf-8')
    const parsed = JSON.parse(decoded) as { exp?: number }

    return typeof parsed.exp === 'number' ? parsed.exp : null
  } catch {
    return null
  }
}

function shouldRefreshAccessToken(accessToken: string) {
  const exp = parseJwtExpiry(accessToken)
  if (!exp) {
    return false
  }

  const now = Math.floor(Date.now() / 1000)
  return exp - now <= ACCESS_TOKEN_REFRESH_WINDOW_SECONDS
}

async function refreshSession(event: H3Event, refreshToken: string): Promise<AuthSession | null> {
  try {
    const refreshed = await refreshWithToken(refreshToken)
    setAuthCookies(event, refreshed.access_token, refreshed.refresh_token, refreshed.expires_in)
    const user = await getUserFromAccessToken(refreshed.access_token)

    return {
      accessToken: refreshed.access_token,
      user
    }
  } catch {
    clearAuthCookies(event)
    return null
  }
}

export async function resolveAuthSession(event: H3Event): Promise<AuthSession | null> {
  const { accessToken, refreshToken } = readAuthCookies(event)

  if (!accessToken) {
    return null
  }

  if (shouldRefreshAccessToken(accessToken) && refreshToken) {
    const refreshedSession = await refreshSession(event, refreshToken)
    if (refreshedSession) {
      return refreshedSession
    }
  }

  try {
    const user = await getUserFromAccessToken(accessToken)
    return {
      accessToken,
      user
    }
  } catch {
    if (!refreshToken) {
      clearAuthCookies(event)
      return null
    }

    return await refreshSession(event, refreshToken)
  }
}

export async function requireAuthSession(event: H3Event) {
  const session = await resolveAuthSession(event)

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  return session
}
