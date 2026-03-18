import { Database } from 'bun:sqlite';

const dbPath = process.env.DATABASE_PATH || 'prometheus.db';
const db = new Database(dbPath);
console.log(`[db] opened database at ${dbPath}`);

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
    role TEXT NOT NULL DEFAULT 'moderator',
    PRIMARY KEY (user_id, channel_id)
  )
`);

// migration: add role column to existing tables, backfill as 'manager'
try {
  db.run(`ALTER TABLE appointed_managers ADD COLUMN role TEXT NOT NULL DEFAULT 'manager'`);
} catch { /* column already exists */ }

db.run(`
  CREATE TABLE IF NOT EXISTS channel_bans (
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    banned_by TEXT NOT NULL,
    reason TEXT,
    expires INTEGER,
    PRIMARY KEY (user_id, channel_id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS join_messages (
    channel_id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'ephemeral',
    set_by TEXT NOT NULL,
    set_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS ping_locks (
    channel_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    added_by TEXT NOT NULL,
    added_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (channel_id, group_id)
  )
`);

// seed SUPERADMINS into global_admins table
const superadmins = (process.env.SUPERADMINS || "").split(",").filter(Boolean);
for (const uid of superadmins) {
  db.run(
    "INSERT OR IGNORE INTO global_admins (user_id, added_by) VALUES (?, 'SUPERADMINS')",
    [uid],
  );
}
if (superadmins.length) {
  console.log(
    `[db] seeded ${superadmins.length} superadmins into global_admins`,
  );
}


const statements = {
  isAdmin: db.query('SELECT 1 FROM global_admins WHERE user_id = $userId'),
  addAdmin: db.query('INSERT OR IGNORE INTO global_admins (user_id, added_by) VALUES ($userId, $addedBy)'),
  removeAdmin: db.query('DELETE FROM global_admins WHERE user_id = $userId'),
  listAdmins: db.query('SELECT user_id, added_by, added_at FROM global_admins'),

  hasChannelRole: db.query('SELECT 1 FROM appointed_managers WHERE user_id = $userId AND channel_id = $channelId'),
  isAppointedManager: db.query('SELECT 1 FROM appointed_managers WHERE user_id = $userId AND channel_id = $channelId AND role = $role'),
  addAppointedManager: db.query('INSERT OR REPLACE INTO appointed_managers (user_id, channel_id, added_by, role) VALUES ($userId, $channelId, $addedBy, $role)'),
  removeAppointedManager: db.query('DELETE FROM appointed_managers WHERE user_id = $userId AND channel_id = $channelId'),
  listAppointedManagers: db.query('SELECT user_id, role, added_by, added_at FROM appointed_managers WHERE channel_id = $channelId'),
  listAllAppointedManagers: db.query('SELECT user_id, channel_id, role, added_by, added_at FROM appointed_managers ORDER BY channel_id'),
  hasAppointedManager: db.query('SELECT 1 FROM appointed_managers WHERE channel_id = $channelId'),

  getChannelBan: db.query('SELECT user_id, channel_id, banned_by, reason, expires FROM channel_bans WHERE user_id = $userId AND channel_id = $channelId'),
  setChannelBan: db.query('INSERT OR REPLACE INTO channel_bans (user_id, channel_id, banned_by, reason, expires) VALUES ($userId, $channelId, $bannedBy, $reason, $expires)'),
  removeChannelBan: db.query('DELETE FROM channel_bans WHERE user_id = $userId AND channel_id = $channelId'),
  listChannelBans: db.query('SELECT user_id, channel_id, banned_by, reason, expires FROM channel_bans WHERE channel_id = $channelId'),
  listUserBans: db.query('SELECT user_id, channel_id, banned_by, reason, expires FROM channel_bans WHERE user_id = $userId'),
  listAllChannelBans: db.query('SELECT user_id, channel_id, banned_by, reason, expires FROM channel_bans ORDER BY channel_id'),

  getwelcome: db.query('SELECT channel_id, message, mode, set_by, set_at FROM join_messages WHERE channel_id = $channelId'),
  setwelcome: db.query('INSERT OR REPLACE INTO join_messages (channel_id, message, mode, set_by) VALUES ($channelId, $message, $mode, $setBy)'),
  removewelcome: db.query('DELETE FROM join_messages WHERE channel_id = $channelId'),

  getPingLock: db.query('SELECT 1 FROM ping_locks WHERE channel_id = $channelId AND group_id = $groupId'),
  addPingLock: db.query('INSERT OR IGNORE INTO ping_locks (channel_id, group_id, added_by) VALUES ($channelId, $groupId, $addedBy)'),
  removePingLock: db.query('DELETE FROM ping_locks WHERE channel_id = $channelId AND group_id = $groupId'),
  listPingLocks: db.query('SELECT group_id, added_by, added_at FROM ping_locks WHERE channel_id = $channelId'),
  getPingLockChannels: db.query('SELECT channel_id FROM ping_locks WHERE group_id = $groupId'),
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

export function hasChannelRole(userId, channelId) {
  return !!statements.hasChannelRole.get({ $userId: userId, $channelId: channelId });
}

export function isAppointedManager(userId, channelId) {
  return !!statements.isAppointedManager.get({ $userId: userId, $channelId: channelId, $role: 'manager' });
}

export function addAppointedManager(userId, channelId, addedBy, role = 'moderator') {
  statements.addAppointedManager.run({ $userId: userId, $channelId: channelId, $addedBy: addedBy, $role: role });
}

export function removeAppointedManager(userId, channelId) {
  statements.removeAppointedManager.run({ $userId: userId, $channelId: channelId });
}

export function listAppointedManagers(channelId) {
  return statements.listAppointedManagers.all({ $channelId: channelId });
}

export function listAllAppointedManagers() {
  return statements.listAllAppointedManagers.all();
}

export function hasAppointedManager(channelId) {
  return !!statements.hasAppointedManager.get({ $channelId: channelId });
}

export function getChannelBan(userId, channelId) {
  return statements.getChannelBan.get({ $userId: userId, $channelId: channelId });
}

export function setChannelBan(userId, channelId, bannedBy, reason, expires) {
  statements.setChannelBan.run({
    $userId: userId,
    $channelId: channelId,
    $bannedBy: bannedBy,
    $reason: reason,
    $expires: expires ?? null,
  });
}

export function removeChannelBan(userId, channelId) {
  statements.removeChannelBan.run({ $userId: userId, $channelId: channelId });
}

export function listChannelBans(channelId) {
  return statements.listChannelBans.all({ $channelId: channelId });
}

export function listUserBans(userId) {
  return statements.listUserBans.all({ $userId: userId });
}

export function listAllChannelBans() {
  return statements.listAllChannelBans.all();
}

export function getwelcome(channelId) {
  return statements.getwelcome.get({ $channelId: channelId });
}

export function setwelcome(channelId, message, mode, setBy) {
  statements.setwelcome.run({ $channelId: channelId, $message: message, $mode: mode, $setBy: setBy });
}

export function removewelcome(channelId) {
  statements.removewelcome.run({ $channelId: channelId });
}

export function getPingLock(channelId, groupId) {
  return !!statements.getPingLock.get({
    $channelId: channelId,
    $groupId: groupId,
  });
}

export function addPingLock(channelId, groupId, addedBy) {
  statements.addPingLock.run({
    $channelId: channelId,
    $groupId: groupId,
    $addedBy: addedBy,
  });
}

export function removePingLock(channelId, groupId) {
  statements.removePingLock.run({ $channelId: channelId, $groupId: groupId });
}

export function listPingLocks(channelId) {
  return statements.listPingLocks.all({ $channelId: channelId });
}

export function getPingLockChannels(groupId) {
  return statements.getPingLockChannels.all({ $groupId: groupId });
}

export default db;
