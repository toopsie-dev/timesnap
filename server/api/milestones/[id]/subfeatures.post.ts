import { randomUUID } from 'crypto'
import { getDb, rowToSubFeature } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const milestoneId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const db = getDb()
  const now = Date.now()
  const id = randomUUID()

  db.prepare(`
    INSERT INTO sub_features (id, milestone_id, name, description, estimated_hours, status, total_ms, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'idle', 0, '', ?, ?)
  `).run(id, milestoneId, body.name, body.description ?? '', body.estimatedHours ?? null, now, now)

  const row = db.prepare('SELECT * FROM sub_features WHERE id = ?').get(id)
  return rowToSubFeature(row as Record<string, unknown>)
})
