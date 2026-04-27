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

function parseSearch(value: unknown) {
  return String(value || '').trim()
}

function toIlikePattern(value: string) {
  return `*${value.replaceAll('*', '')}*`
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export default defineEventHandler(async (event) => {
  const { accessToken, user } = await requireAuthSession(event)
  const config = useRuntimeConfig()
  const userId = user.id
  const query = getQuery(event)
  const page = parsePage(query.page)
  const search = parseSearch(query.search)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let pages: PageListItem[] = []
  let totalItems = 0
  const baseQuery: Record<string, string | number> = {
    select: 'id,slug,name,created_at,updated_at',
    user_id: `eq.${userId}`,
    deleted_at: 'is.null',
    order: 'updated_at.desc'
  }

  if (search) {
    const pattern = toIlikePattern(search)
    baseQuery.or = isUuid(search)
      ? `(name.ilike.${pattern},slug.eq.${search})`
      : `name.ilike.${pattern}`
  }

  try {
    const response = await $fetch.raw<PageListItem[]>(`${config.supabaseUrl}/rest/v1/pages`, {
      method: 'GET',
      query: baseQuery,
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
