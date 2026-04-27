import { requireAuthSession } from '../../utils/supabase-auth'

type PageListItem = {
  id: number
  slug: string
  name: string | null
  created_at: string
  updated_at: string
}

const PAGE_SIZE = 20

function parsePage(value: unknown) {
  const page = Number.parseInt(String(value || '1'), 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

export default defineEventHandler(async (event) => {
  const { accessToken, user } = await requireAuthSession(event)
  const config = useRuntimeConfig()
  const userId = user.id
  const query = getQuery(event)
  const page = parsePage(query.page)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let pages: PageListItem[] = []
  let totalItems = 0

  try {
    const response = await $fetch.raw<PageListItem[]>(`${config.supabaseUrl}/rest/v1/pages`, {
      method: 'GET',
      query: {
        select: 'id,slug,name,created_at,updated_at',
        user_id: `eq.${userId}`,
        order: 'updated_at.desc'
      },
      headers: {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'count=exact',
        'Range-Unit': 'items',
        'Range': `${from}-${to}`
      }
    })

    pages = response._data || []

    const contentRange = response.headers.get('content-range') || ''
    const totalPart = contentRange.split('/')[1]
    const parsedTotal = Number.parseInt(totalPart || '0', 10)
    totalItems = Number.isFinite(parsedTotal) ? parsedTotal : pages.length
  } catch {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cannot load pages. Check RLS policies for pages table.'
    })
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  return {
    pages: pages.map(page => ({
      ...page,
      name: page.name || 'Untitled page'
    })),
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      totalItems,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages
    }
  }
})
