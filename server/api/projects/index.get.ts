import { getDb, rowToProject } from '../../utils/db'

export default defineEventHandler(() => {
  const db = getDb()
  const now = Date.now()

  const rows = db.prepare(`
    SELECT p.*,
      COALESCE(SUM(
        CASE WHEN m.name != 'Idle' THEN
          sf.total_ms +
          CASE WHEN sf.status = 'running' AND sf.started_at IS NOT NULL
            THEN (? - sf.started_at)
            ELSE 0
          END
        ELSE 0 END
      ), 0) AS total_ms,
      COALESCE(SUM(
        CASE WHEN m.name != 'Idle' THEN sf.estimated_hours ELSE NULL END
      ), NULL) AS estimated_hours
    FROM projects p
    LEFT JOIN milestones m ON m.project_id = p.id
    LEFT JOIN sub_features sf ON sf.milestone_id = m.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all(now)

  return rows.map(rowToProject)
})
