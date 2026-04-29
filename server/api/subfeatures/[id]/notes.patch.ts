import { getDb, rowToSubFeature } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const db = getDb()
  const now = Date.now()

  db.prepare(`UPDATE sub_features SET notes = ?, updated_at = ? WHERE id = ?`).run(body.notes ?? '', now, id)

  const row = db.prepare('SELECT * FROM sub_features WHERE id = ?').get(id)
  return rowToSubFeature(row as Record<string, unknown>)
})
