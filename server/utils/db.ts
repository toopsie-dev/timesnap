import Database from 'better-sqlite3'
import { join } from 'path'
import { mkdirSync } from 'fs'

let _db: Database.Database | null = null

export function getDb() {
  if (_db) return _db

  // Allow overriding the DB path via environment variable (e.g. for Railway volume mounts)
  const dbPath = process.env.DATABASE_PATH ?? join(process.cwd(), 'data', 'timesnap.db')
  mkdirSync(join(dbPath, '..'), { recursive: true })

  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  _db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      estimated_hours REAL,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id               TEXT PRIMARY KEY,
      project_id       TEXT NOT NULL,
      name             TEXT NOT NULL,
      description      TEXT NOT NULL DEFAULT '',
      estimated_hours  REAL,
      created_at       INTEGER NOT NULL,
      updated_at       INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sub_features (
      id               TEXT PRIMARY KEY,
      milestone_id     TEXT NOT NULL,
      name             TEXT NOT NULL,
      description      TEXT NOT NULL DEFAULT '',
      estimated_hours  REAL,
      status           TEXT NOT NULL DEFAULT 'idle',
      total_ms         INTEGER NOT NULL DEFAULT 0,
      started_at       INTEGER,
      notes            TEXT NOT NULL DEFAULT '',
      created_at       INTEGER NOT NULL,
      updated_at       INTEGER NOT NULL,
      FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS time_logs (
      id             TEXT PRIMARY KEY,
      sub_feature_id TEXT NOT NULL,
      started_at     INTEGER NOT NULL,
      stopped_at     INTEGER NOT NULL,
      duration_ms    INTEGER NOT NULL,
      FOREIGN KEY (sub_feature_id) REFERENCES sub_features(id) ON DELETE CASCADE
    );
  `)

  // Safe migration: add notes column to existing databases
  try { _db.exec(`ALTER TABLE sub_features ADD COLUMN notes TEXT NOT NULL DEFAULT ''`) } catch {}
  // Safe migration: add estimated_hours to projects
  try { _db.exec(`ALTER TABLE projects ADD COLUMN estimated_hours REAL`) } catch {}
  // Safe migration: add status to projects
  try { _db.exec(`ALTER TABLE projects ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`) } catch {}

  return _db
}

export function rowToProject(row: Record<string, unknown>) {
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

export function rowToMilestone(row: Record<string, unknown>) {
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

export function rowToSubFeature(row: Record<string, unknown>) {
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

export function rowToLog(row: Record<string, unknown>) {
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
