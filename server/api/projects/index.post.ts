import { randomUUID } from 'crypto'
import { getDb, rowToProject } from '../../utils/db'

const IDLE_SUB_FEATURES = [
  { name: 'Meeting',     description: 'Team meetings, standups, discussions' },
  { name: 'CR Break',    description: 'Comfort room break' },
  { name: 'Lunch Break', description: 'Lunch break' },
  { name: 'Break Time',  description: 'Short rest break' },
]

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = getDb()
  const now = Date.now()
  const projectId = randomUUID()

  db.prepare(`
    INSERT INTO projects (id, name, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(projectId, body.name, body.description ?? '', now, now)

  const milestones: Array<{ name: string; description?: string; estimatedHours?: number; subFeatures?: Array<{ name: string; description?: string; estimatedHours?: number }> }> = body.milestones ?? []

  for (const m of milestones) {
    const milestoneId = randomUUID()
    db.prepare(`
      INSERT INTO milestones (id, project_id, name, description, estimated_hours, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(milestoneId, projectId, m.name, m.description ?? '', m.estimatedHours ?? null, now, now)

    for (const sf of m.subFeatures ?? []) {
      db.prepare(`
        INSERT INTO sub_features (id, milestone_id, name, description, estimated_hours, status, total_ms, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'idle', 0, '', ?, ?)
      `).run(randomUUID(), milestoneId, sf.name, sf.description ?? '', sf.estimatedHours ?? null, now, now)
    }
  }

  // Auto-create the Idle milestone for every project
  const idleMilestoneId = randomUUID()
  db.prepare(`
    INSERT INTO milestones (id, project_id, name, description, estimated_hours, created_at, updated_at)
    VALUES (?, ?, 'Idle', 'Non-productive time tracking', NULL, ?, ?)
  `).run(idleMilestoneId, projectId, now, now)

  for (const sf of IDLE_SUB_FEATURES) {
    db.prepare(`
      INSERT INTO sub_features (id, milestone_id, name, description, estimated_hours, status, total_ms, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, NULL, 'idle', 0, '', ?, ?)
    `).run(randomUUID(), idleMilestoneId, sf.name, sf.description, now, now)
  }

  const row = db.prepare(`
    SELECT p.*, 0 AS total_ms,
      COALESCE(SUM(CASE WHEN m.name != 'Idle' THEN sf.estimated_hours ELSE NULL END), NULL) AS estimated_hours
    FROM projects p
    LEFT JOIN milestones m ON m.project_id = p.id
    LEFT JOIN sub_features sf ON sf.milestone_id = m.id
    WHERE p.id = ?
    GROUP BY p.id
  `).get(projectId)
  return rowToProject(row as Record<string, unknown>)
})
