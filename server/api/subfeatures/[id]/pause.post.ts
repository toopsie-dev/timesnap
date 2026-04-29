import { randomUUID } from 'crypto'
import { getDb, rowToSubFeature } from '../../../utils/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const db = getDb()
  const now = Date.now()

  const row = db.prepare('SELECT * FROM sub_features WHERE id = ?').get(id) as Record<string, unknown>
  if (!row) throw createError({ statusCode: 404 })

  const elapsed = row.started_at ? now - (row.started_at as number) : 0

  db.prepare(`
    UPDATE sub_features
    SET status = 'paused', total_ms = total_ms + ?, started_at = NULL, updated_at = ?
    WHERE id = ?
  `).run(elapsed, now, id)

  if (elapsed > 0 && row.started_at) {
    db.prepare(`
      INSERT INTO time_logs (id, sub_feature_id, started_at, stopped_at, duration_ms)
      VALUES (?, ?, ?, ?, ?)
    `).run(randomUUID(), id, row.started_at, now, elapsed)
  }

  const updated = db.prepare('SELECT * FROM sub_features WHERE id = ?').get(id)
  return rowToSubFeature(updated as Record<string, unknown>)
})
