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

db.run(`
  CREATE TABLE IF NOT EXISTS appointed_managers (
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    added_by TEXT NOT NULL,
    added_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (user_id, channel_id)
  )
`);

const statements = {
  isAdmin: db.query('SELECT 1 FROM global_admins WHERE user_id = $userId'),
  addAdmin: db.query('INSERT OR IGNORE INTO global_admins (user_id, added_by) VALUES ($userId, $addedBy)'),
  removeAdmin: db.query('DELETE FROM global_admins WHERE user_id = $userId'),
  listAdmins: db.query('SELECT user_id, added_by, added_at FROM global_admins'),

  isAppointedManager: db.query('SELECT 1 FROM appointed_managers WHERE user_id = $userId AND channel_id = $channelId'),
  addAppointedManager: db.query('INSERT OR IGNORE INTO appointed_managers (user_id, channel_id, added_by) VALUES ($userId, $channelId, $addedBy)'),
  removeAppointedManager: db.query('DELETE FROM appointed_managers WHERE user_id = $userId AND channel_id = $channelId'),
  listAppointedManagers: db.query('SELECT user_id, added_by, added_at FROM appointed_managers WHERE channel_id = $channelId'),
  hasAppointedManager: db.query('SELECT 1 FROM appointed_managers WHERE channel_id = $channelId'),
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

export function isAppointedManager(userId, channelId) {
  return !!statements.isAppointedManager.get({ $userId: userId, $channelId: channelId });
}

export function addAppointedManager(userId, channelId, addedBy) {
  statements.addAppointedManager.run({ $userId: userId, $channelId: channelId, $addedBy: addedBy });
}

export function removeAppointedManager(userId, channelId) {
  statements.removeAppointedManager.run({ $userId: userId, $channelId: channelId });
}

export function listAppointedManagers(channelId) {
  return statements.listAppointedManagers.all({ $channelId: channelId });
}

export function hasAppointedManager(channelId) {
  return !!statements.hasAppointedManager.get({ $channelId: channelId });
}

export default db;
