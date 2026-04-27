import { requireAuthSession } from '../../utils/supabase-auth'

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
  const body = await readBody<{ name?: string, content?: string }>(event)
  const userId = user.id

  const content = body.content?.trim()
  const name = body.name?.trim() || 'Untitled page'

  if (!content) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Page content is required.'
    })
  }

  const slug = crypto.randomUUID()
  const payload: Record<string, unknown> = {
    slug,
    name,
    content,
    user_id: userId
  }

  let rows: PageRow[]
  try {
    rows = await $fetch<PageRow[]>(`${config.supabaseUrl}/rest/v1/pages`, {
      method: 'POST',
      query: {
        select: 'id,slug,name,content,created_at,updated_at'
      },
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=representation'
      },
      body: payload
    })
  } catch {
    throw createError({
      statusCode: 403,
      statusMessage: 'Deploy blocked by Supabase policy. Check insert policy for pages.'
    })
  }

  const page = rows[0]

  if (!page) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to deploy page.'
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
