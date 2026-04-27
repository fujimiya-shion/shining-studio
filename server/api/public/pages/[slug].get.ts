import { resolveAuthSession } from '../../../utils/supabase-auth'

type PublicPageRow = {
  slug: string
  name: string | null
  content: string | null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const slug = getRouterParam(event, 'slug')
  const serviceRoleKey = (config.supabaseServiceRoleKey as string | undefined)?.trim() || ''

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing slug'
    })
  }

  let rows: PublicPageRow[]

  const session = serviceRoleKey ? null : await resolveAuthSession(event)
  const apikey = serviceRoleKey || config.supabaseKey
  const authorization = serviceRoleKey
    ? `Bearer ${serviceRoleKey}`
    : session?.accessToken
      ? `Bearer ${session.accessToken}`
      : `Bearer ${config.supabaseKey}`

  try {
    rows = await $fetch<PublicPageRow[]>(`${config.supabaseUrl}/rest/v1/pages`, {
      method: 'GET',
      query: {
        select: 'slug,name,content',
        slug: `eq.${slug}`,
        deleted_at: 'is.null',
        limit: 1
      },
      headers: {
        apikey,
        Authorization: authorization
      }
    })
  } catch (error) {
    const fetchError = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: fetchError.statusCode || 403,
      statusMessage: fetchError.statusMessage || 'Cannot load public page. Check read policy for pages table.'
    })
  }

  const page = rows[0]

  if (!page) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found'
    })
  }

  return {
    page: {
      slug: page.slug,
      name: page.name || 'Untitled page',
      content: page.content || ''
    }
  }
})
