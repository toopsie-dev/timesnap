import { getDb, rowToSubFeature } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event) as { name?: string; estimatedHours?: number | null }

  const name = (body.name ?? '').trim()
  if (!name) throw createError({ statusCode: 400, message: 'name is required' })

  const db = getDb()
  const now = Date.now()

  const eh = body.estimatedHours != null && !isNaN(Number(body.estimatedHours))
    ? Number(body.estimatedHours)
    : null

  db.prepare('UPDATE sub_features SET name = ?, estimated_hours = ?, updated_at = ? WHERE id = ?')
    .run(name, eh, now, id)

  const row = db.prepare('SELECT * FROM sub_features WHERE id = ?').get(id)
  return rowToSubFeature(row as Record<string, unknown>)
})
