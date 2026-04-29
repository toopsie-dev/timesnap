import { getDb, rowToLog } from '../../../utils/db'

export default defineEventHandler((event) => {
  const projectId = getRouterParam(event, 'id')
  const db = getDb()

  const rows = db.prepare(`
    SELECT tl.*,
      sf.name  AS sf_name,
      m.name   AS milestone_name
    FROM time_logs tl
    JOIN sub_features sf ON sf.id = tl.sub_feature_id
    JOIN milestones   m  ON m.id  = sf.milestone_id
    WHERE m.project_id = ?
    ORDER BY tl.started_at DESC
    LIMIT 200
  `).all(projectId)

  return rows.map(r => rowToLog(r as Record<string, unknown>))
})
