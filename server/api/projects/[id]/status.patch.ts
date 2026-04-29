import { getDb, rowToProject } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event) as { status: string }

  const allowed = ['active', 'completed', 'cancelled']
  if (!allowed.includes(body.status)) {
    throw createError({ statusCode: 400, message: 'status must be active, completed, or cancelled' })
  }

  const db = getDb()
  const now = Date.now()

  db.prepare('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?')
    .run(body.status, now, id)

  const row = db.prepare(`
    SELECT p.*,
      COALESCE(SUM(
        CASE WHEN m.name != 'Idle' THEN sf.estimated_hours ELSE NULL END
      ), NULL) AS estimated_hours,
      COALESCE(SUM(
        CASE WHEN m.name != 'Idle' THEN sf.total_ms ELSE 0 END
      ), 0) AS total_ms
    FROM projects p
    LEFT JOIN milestones m ON m.project_id = p.id
    LEFT JOIN sub_features sf ON sf.milestone_id = m.id
    WHERE p.id = ?
    GROUP BY p.id
  `).get(id) as Record<string, unknown>

  return rowToProject(row)
})
