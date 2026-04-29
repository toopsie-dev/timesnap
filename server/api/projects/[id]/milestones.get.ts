import { getDb, rowToMilestone } from '../../../utils/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const db = getDb()
  const now = Date.now()

  const rows = db.prepare(`
    SELECT m.*,
      COALESCE(SUM(
        sf.total_ms +
        CASE WHEN sf.status = 'running' AND sf.started_at IS NOT NULL
          THEN (? - sf.started_at)
          ELSE 0
        END
      ), 0) AS total_ms
    FROM milestones m
    LEFT JOIN sub_features sf ON sf.milestone_id = m.id
    WHERE m.project_id = ?
    GROUP BY m.id
    ORDER BY m.created_at ASC
  `).all(now, id)

  return rows.map(rowToMilestone)
})
