import { getDb } from '../../utils/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const db = getDb()
  db.prepare('DELETE FROM sub_features WHERE id = ?').run(id)
  return { success: true }
})
