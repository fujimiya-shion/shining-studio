import { requireAuthSession } from '../../utils/supabase-auth'

type DeletedPageRow = {
  id: number
}

export default defineEventHandler(async (event) => {
  const { accessToken, user } = await requireAuthSession(event)
  const config = useRuntimeConfig()
  const body = await readBody<{ ids?: unknown }>(event)
  const userId = user.id
  const rawIds = Array.isArray(body.ids) ? body.ids : []
  const ids = rawIds
    .map(value => Number.parseInt(String(value), 10))
    .filter(value => Number.isFinite(value) && value > 0)

  if (ids.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Page ids are required.'
    })
  }

  const uniqueIds = [...new Set(ids)]
  const deletedAt = new Date().toISOString()
  let rows: DeletedPageRow[]

  try {
    rows = await $fetch<DeletedPageRow[]>(`${config.supabaseUrl}/rest/v1/pages`, {
      method: 'PATCH',
      query: {
        user_id: `eq.${userId}`,
        id: `in.(${uniqueIds.join(',')})`,
        deleted_at: 'is.null',
        select: 'id'
      },
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=representation'
      },
      body: {
        deleted_at: deletedAt
      }
    })
  } catch {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cannot delete pages. Check update policy for pages table.'
    })
  }

  return {
    deletedIds: (rows || []).map(row => row.id)
  }
})
