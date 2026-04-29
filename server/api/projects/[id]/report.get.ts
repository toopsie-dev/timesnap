import { getDb } from '../../../utils/db'

export default defineEventHandler((event) => {
  const projectId = getRouterParam(event, 'id')!
  const db = getDb()

  const project = db.prepare(`
    SELECT p.*,
      COALESCE(SUM(
        CASE WHEN m.name != 'Idle' THEN sf.total_ms ELSE 0 END
      ), 0) AS total_ms,
      COALESCE(SUM(
        CASE WHEN m.name != 'Idle' THEN sf.estimated_hours ELSE NULL END
      ), NULL) AS estimated_hours
    FROM projects p
    LEFT JOIN milestones m ON m.project_id = p.id
    LEFT JOIN sub_features sf ON sf.milestone_id = m.id
    WHERE p.id = ? AND p.status = 'completed'
    GROUP BY p.id
  `).get(projectId) as Record<string, unknown> | undefined

  if (!project) {
    throw createError({ statusCode: 404, message: 'Project not found or not completed' })
  }

  const milestones = db.prepare(`
    SELECT m.id, m.name, m.estimated_hours,
      COALESCE(SUM(sf.total_ms), 0) AS total_ms
    FROM milestones m
    LEFT JOIN sub_features sf ON sf.milestone_id = m.id
    WHERE m.project_id = ? AND m.name != 'Idle'
    GROUP BY m.id
    ORDER BY m.created_at ASC
  `).all(projectId) as Record<string, unknown>[]

  const subFeatures = db.prepare(`
    SELECT sf.id, sf.name, sf.estimated_hours, sf.total_ms, sf.notes, m.id AS milestone_id
    FROM sub_features sf
    JOIN milestones m ON m.id = sf.milestone_id
    WHERE m.project_id = ? AND m.name != 'Idle'
    ORDER BY m.created_at ASC, sf.created_at ASC
  `).all(projectId) as Record<string, unknown>[]

  const logs = db.prepare(`
    SELECT tl.started_at, tl.stopped_at, tl.duration_ms,
      sf.name AS task_name, m.name AS milestone_name
    FROM time_logs tl
    JOIN sub_features sf ON sf.id = tl.sub_feature_id
    JOIN milestones m ON m.id = sf.milestone_id
    WHERE m.project_id = ? AND m.name != 'Idle'
    ORDER BY tl.started_at ASC
  `).all(projectId) as Record<string, unknown>[]

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    estimatedHours: project.estimated_hours ?? null,
    totalMs: project.total_ms,
    updatedAt: project.updated_at,
    createdAt: project.created_at,
    milestones: milestones.map(m => ({
      id: m.id,
      name: m.name,
      estimatedHours: m.estimated_hours ?? null,
      totalMs: m.total_ms,
      subFeatures: subFeatures
        .filter(sf => sf.milestone_id === m.id)
        .map(sf => ({
          id: sf.id,
          name: sf.name,
          estimatedHours: sf.estimated_hours ?? null,
          totalMs: sf.total_ms,
          notes: sf.notes,
        })),
    })),
    logs: logs.map(l => ({
      milestoneName: l.milestone_name,
      taskName: l.task_name,
      startedAt: l.started_at,
      stoppedAt: l.stopped_at,
      durationMs: l.duration_ms,
    })),
  }
})
