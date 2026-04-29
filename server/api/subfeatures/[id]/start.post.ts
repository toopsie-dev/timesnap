import { getDb, rowToSubFeature } from '../../../utils/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const db = getDb()
  const now = Date.now()

  db.prepare(`
    UPDATE sub_features
    SET status = 'running', started_at = ?, updated_at = ?
    WHERE id = ?
  `).run(now, now, id)

  const row = db.prepare('SELECT * FROM sub_features WHERE id = ?').get(id)
  return rowToSubFeature(row as Record<string, unknown>)
})
