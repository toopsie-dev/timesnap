import { getDb } from '../../utils/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const db = getDb()
  db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  return { success: true }
})
