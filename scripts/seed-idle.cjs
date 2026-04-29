const Database = require('better-sqlite3')
const { join } = require('path')
const { randomUUID } = require('crypto')

const db = new Database(join('C:/Users/melvin.lilis/Downloads/TimeSnap/data', 'timesnap.db'))
db.pragma('foreign_keys = ON')

try {
  db.exec("ALTER TABLE sub_features ADD COLUMN notes TEXT NOT NULL DEFAULT ''")
  console.log('Added notes column')
} catch (e) {
  console.log('notes column already exists:', e.message)
}

const project = db.prepare('SELECT * FROM projects LIMIT 1').get()
if (!project) {
  console.log('No project found')
  process.exit(0)
}
console.log('Project:', project.name)

const existing = db.prepare("SELECT * FROM milestones WHERE project_id = ? AND name = 'Idle'").get(project.id)
if (existing) {
  console.log('Idle milestone already exists — nothing to do')
  process.exit(0)
}

const now = Date.now()
const milestoneId = randomUUID()
db.prepare('INSERT INTO milestones (id, project_id, name, description, estimated_hours, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?)').run(milestoneId, project.id, 'Idle', 'Non-productive time tracking', now, now)

const sfs = [
  ['Meeting',     'Team meetings, standups, discussions'],
  ['CR Break',    'Comfort room break'],
  ['Lunch Break', 'Lunch break'],
  ['Break Time',  'Short rest break'],
  ['Others',      'Other idle time'],
]
for (const [name, desc] of sfs) {
  db.prepare("INSERT INTO sub_features (id, milestone_id, name, description, estimated_hours, status, total_ms, notes, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, 'idle', 0, '', ?, ?)").run(randomUUID(), milestoneId, name, desc, now, now)
}

console.log('Done! Idle milestone added with', sfs.length, 'sub-features.')
db.close()
