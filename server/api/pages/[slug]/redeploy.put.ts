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
  const body = await readBody<{ name?: string, content?: string }>(event)
  const userId = user.id

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing slug'
    })
  }

  const content = body.content?.trim()
  const name = body.name?.trim() || 'Untitled page'

  if (!content) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Page content is required.'
    })
  }

  let rows: PageRow[]
  try {
    rows = await $fetch<PageRow[]>(`${config.supabaseUrl}/rest/v1/pages`, {
      method: 'PATCH',
      query: {
        slug: `eq.${slug}`,
        user_id: `eq.${userId}`,
        select: 'id,slug,name,content,created_at,updated_at'
      },
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=representation'
      },
      body: {
        name,
        content
      }
    })
  } catch {
    throw createError({
      statusCode: 403,
      statusMessage: 'Re-deploy blocked by Supabase policy. Check update policy for pages.'
    })
  }

  const page = rows[0]

  if (!page) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found or not permitted.'
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
