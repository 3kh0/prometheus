import {
  isGlobalAdmin,
  isAppointedManager as dbIsAppointedManager,
  hasAppointedManager,
} from './db.js';

export { isGlobalAdmin };

const isNativeChannelManager = async (client, userId, channelId) => {
  try {
    const info = await client.conversations.info({ channel: channelId });
    return info.channel?.creator === userId;
  } catch { return false; }
};

export const isAppointedManager = (userId, channelId) => dbIsAppointedManager(userId, channelId);

export const isChannelManager = async (client, userId, channelId) => {
  if (hasAppointedManager(channelId)) {
    return isAppointedManager(userId, channelId);
  }
  return isNativeChannelManager(client, userId, channelId);
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
