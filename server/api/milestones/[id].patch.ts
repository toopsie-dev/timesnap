import { getDb, rowToMilestone } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event) as { name?: string }

  const name = (body.name ?? '').trim()
  if (!name) throw createError({ statusCode: 400, message: 'name is required' })

  const db = getDb()
  const now = Date.now()

  db.prepare('UPDATE milestones SET name = ?, updated_at = ? WHERE id = ?').run(name, now, id)

  const row = db.prepare(`
    SELECT m.*,
      COALESCE(SUM(sf.total_ms), 0) AS total_ms
    FROM milestones m
    LEFT JOIN sub_features sf ON sf.milestone_id = m.id
    WHERE m.id = ?
    GROUP BY m.id
  `).get(id) as Record<string, unknown>

  return rowToMilestone(row)
})
