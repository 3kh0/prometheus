import {
  isGlobalAdmin,
  isAppointedManager as dbIsAppointedManager,
} from './db.js';

export { isGlobalAdmin };

export const isAppointedManager = (userId, channelId) => dbIsAppointedManager(userId, channelId);

export const isChannelManager = (_client, userId, channelId) => {
  return isAppointedManager(userId, channelId);
};

export const isWorkspaceAdmin = async (client, userId) => {
  try {
    const r = await client.users.info({ user: userId });
    return r.user?.is_admin || r.user?.is_owner;
  } catch { return false; }
};

// base level perms check
export const canManage = async (client, userId, channelId) =>
  isGlobalAdmin(userId) ||
  await isWorkspaceAdmin(client, userId) ||
  await isChannelManager(client, userId, channelId);
