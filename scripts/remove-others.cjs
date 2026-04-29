const Database = require('better-sqlite3')

const db = new Database('C:/Users/melvin.lilis/Downloads/TimeSnap/data/timesnap.db')
db.pragma('foreign_keys = ON')

// Remove "Others" sub-feature from any Idle milestone
const result = db.prepare(`
  DELETE FROM sub_features
  WHERE name = 'Others'
    AND milestone_id IN (SELECT id FROM milestones WHERE name = 'Idle')
`).run()

console.log(`Deleted ${result.changes} "Others" sub-feature(s) from Idle milestones.`)
db.close()
