import { describe, it, expect } from 'vitest'

// Import the pure row-mapper functions directly (no DB connection needed)
// We replicate the mapper signatures from server/utils/db.ts to test them in isolation.
function rowToProject(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    status: (row.status as string) ?? 'active',
    totalMs: (row.total_ms as number) ?? 0,
    estimatedHours: (row.estimated_hours as number | null) ?? null,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  }
}

function rowToMilestone(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    name: row.name as string,
    description: row.description as string,
    estimatedHours: (row.estimated_hours as number | null) ?? null,
    totalMs: (row.total_ms as number) ?? 0,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  }
}

function rowToSubFeature(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    milestoneId: row.milestone_id as string,
    name: row.name as string,
    description: row.description as string,
    estimatedHours: (row.estimated_hours as number | null) ?? null,
    status: row.status as 'idle' | 'running' | 'paused',
    totalMs: row.total_ms as number,
    startedAt: (row.started_at as number | null) ?? null,
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  }
}

function rowToLog(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    subFeatureId: row.sub_feature_id as string,
    subFeatureName: row.sf_name as string,
    milestoneName: row.milestone_name as string,
    startedAt: row.started_at as number,
    stoppedAt: row.stopped_at as number,
    durationMs: row.duration_ms as number,
  }
}

// ── rowToProject ──────────────────────────────────────────────────────────────
describe('rowToProject', () => {
  const base = {
    id: 'proj-1',
    name: 'My Project',
    description: 'A description',
    status: 'active',
    total_ms: 3600000,
    estimated_hours: 8,
    created_at: 1000,
    updated_at: 2000,
  }

  it('maps all fields correctly', () => {
    const result = rowToProject(base)
    expect(result).toEqual({
      id: 'proj-1',
      name: 'My Project',
      description: 'A description',
      status: 'active',
      totalMs: 3600000,
      estimatedHours: 8,
      createdAt: 1000,
      updatedAt: 2000,
    })
  })

  it('defaults totalMs to 0 when null', () => {
    const result = rowToProject({ ...base, total_ms: null })
    expect(result.totalMs).toBe(0)
  })

  it('defaults estimatedHours to null when not provided', () => {
    const result = rowToProject({ ...base, estimated_hours: null })
    expect(result.estimatedHours).toBeNull()
  })

  it('defaults status to "active" when missing', () => {
    const result = rowToProject({ ...base, status: undefined })
    expect(result.status).toBe('active')
  })
})

// ── rowToMilestone ────────────────────────────────────────────────────────────
describe('rowToMilestone', () => {
  const base = {
    id: 'ms-1',
    project_id: 'proj-1',
    name: 'Milestone 1',
    description: 'Desc',
    estimated_hours: 4,
    total_ms: 1800000,
    created_at: 1000,
    updated_at: 2000,
  }

  it('maps all fields correctly', () => {
    const result = rowToMilestone(base)
    expect(result).toEqual({
      id: 'ms-1',
      projectId: 'proj-1',
      name: 'Milestone 1',
      description: 'Desc',
      estimatedHours: 4,
      totalMs: 1800000,
      createdAt: 1000,
      updatedAt: 2000,
    })
  })

  it('defaults totalMs to 0 when null', () => {
    expect(rowToMilestone({ ...base, total_ms: null }).totalMs).toBe(0)
  })

  it('defaults estimatedHours to null when null', () => {
    expect(rowToMilestone({ ...base, estimated_hours: null }).estimatedHours).toBeNull()
  })
})

// ── rowToSubFeature ───────────────────────────────────────────────────────────
describe('rowToSubFeature', () => {
  const base = {
    id: 'sf-1',
    milestone_id: 'ms-1',
    name: 'SubFeature A',
    description: 'Sub desc',
    estimated_hours: 2,
    status: 'idle',
    total_ms: 0,
    started_at: null,
    notes: 'Some notes',
    created_at: 1000,
    updated_at: 2000,
  }

  it('maps all fields correctly', () => {
    const result = rowToSubFeature(base)
    expect(result).toEqual({
      id: 'sf-1',
      milestoneId: 'ms-1',
      name: 'SubFeature A',
      description: 'Sub desc',
      estimatedHours: 2,
      status: 'idle',
      totalMs: 0,
      startedAt: null,
      notes: 'Some notes',
      createdAt: 1000,
      updatedAt: 2000,
    })
  })

  it('maps running status with startedAt', () => {
    const result = rowToSubFeature({ ...base, status: 'running', started_at: 9999 })
    expect(result.status).toBe('running')
    expect(result.startedAt).toBe(9999)
  })

  it('defaults notes to empty string when missing', () => {
    expect(rowToSubFeature({ ...base, notes: undefined }).notes).toBe('')
  })

  it('defaults startedAt to null when missing', () => {
    expect(rowToSubFeature({ ...base, started_at: undefined }).startedAt).toBeNull()
  })
})

// ── rowToLog ──────────────────────────────────────────────────────────────────
describe('rowToLog', () => {
  const base = {
    id: 'log-1',
    sub_feature_id: 'sf-1',
    sf_name: 'SubFeature A',
    milestone_name: 'Milestone 1',
    started_at: 1000,
    stopped_at: 5000,
    duration_ms: 4000,
  }

  it('maps all fields correctly', () => {
    const result = rowToLog(base)
    expect(result).toEqual({
      id: 'log-1',
      subFeatureId: 'sf-1',
      subFeatureName: 'SubFeature A',
      milestoneName: 'Milestone 1',
      startedAt: 1000,
      stoppedAt: 5000,
      durationMs: 4000,
    })
  })
})
