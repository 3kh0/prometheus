import { Database } from 'bun:sqlite';

const db = new Database('prometheus.db');

db.run('PRAGMA journal_mode = WAL;');

db.run(`
  CREATE TABLE IF NOT EXISTS global_admins (
    user_id TEXT PRIMARY KEY,
    added_by TEXT NOT NULL,
    added_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

const statements = {
  isAdmin: db.query('SELECT 1 FROM global_admins WHERE user_id = $userId'),
  addAdmin: db.query('INSERT OR IGNORE INTO global_admins (user_id, added_by) VALUES ($userId, $addedBy)'),
  removeAdmin: db.query('DELETE FROM global_admins WHERE user_id = $userId'),
  listAdmins: db.query('SELECT user_id, added_by, added_at FROM global_admins'),
};

export function isGlobalAdmin(userId) {
  return !!statements.isAdmin.get({ $userId: userId });
}

export function addGlobalAdmin(userId, addedBy) {
  statements.addAdmin.run({ $userId: userId, $addedBy: addedBy });
}

export function removeGlobalAdmin(userId) {
  statements.removeAdmin.run({ $userId: userId });
}

export function listGlobalAdmins() {
  return statements.listAdmins.all();
}

export default db;
