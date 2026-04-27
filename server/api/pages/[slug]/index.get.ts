import { requireAuthSession } from '../../../utils/supabase-auth'

type PageRow = {
  id: number
  slug: string
  name: string | null
  content: string | null
  created_at: string
  updated_at: string
}

export default defineEventHandler(async (event) => {
  const { accessToken, user } = await requireAuthSession(event)
  const config = useRuntimeConfig()
  const slug = getRouterParam(event, 'slug')
  const userId = user.id

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing slug'
    })
  }

  let rows: PageRow[]
  try {
    rows = await $fetch<PageRow[]>(`${config.supabaseUrl}/rest/v1/pages`, {
      method: 'GET',
      query: {
        select: 'id,slug,name,content,created_at,updated_at',
        slug: `eq.${slug}`,
        user_id: `eq.${userId}`,
        deleted_at: 'is.null',
        limit: 1
      },
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`
      }
    })
  } catch {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cannot load page. Check RLS policies for pages table.'
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
      ...page,
      name: page.name || 'Untitled page',
      content: page.content || ''
    }
  }
})
