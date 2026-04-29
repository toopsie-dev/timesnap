import { getDb, rowToSubFeature } from '../../../utils/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM sub_features WHERE milestone_id = ? ORDER BY created_at ASC
  `).all(id)
  return rows.map(rowToSubFeature)
})
