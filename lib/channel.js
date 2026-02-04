const POWERS = {
  MENTION: 'mention',
  DELETE: 'delete',
  BAN: 'ban',
  UNBAN: 'unban',
  LOCK: 'lock',
};

const ALL_POWERS = Object.values(POWERS);

// In-memory store until we add SQLite
const channelMods = new Map();

function getKey(channelId, userId) {
  return `${channelId}:${userId}`;
}

export function grantPower(channelId, userId, powers, grantedBy) {
  const key = getKey(channelId, userId);
  const existing = channelMods.get(key) || { powers: new Set(), grantedBy: null, createdAt: null };
  
  const powersToAdd = Array.isArray(powers) ? powers : [powers];
  powersToAdd.forEach(p => existing.powers.add(p));
  
  channelMods.set(key, {
    channelId,
    userId,
    powers: existing.powers,
    grantedBy: grantedBy || existing.grantedBy,
    createdAt: existing.createdAt || Date.now(),
    updatedAt: Date.now(),
  });
}

export function revokePower(channelId, userId, powers) {
  const key = getKey(channelId, userId);
  const existing = channelMods.get(key);
  if (!existing) return false;

  const powersToRemove = Array.isArray(powers) ? powers : [powers];
  powersToRemove.forEach(p => existing.powers.delete(p));

  if (existing.powers.size === 0) {
    channelMods.delete(key);
  } else {
    existing.updatedAt = Date.now();
  }
  return true;
}

export function revokeAll(channelId, userId) {
  return channelMods.delete(getKey(channelId, userId));
}

export function hasPower(channelId, userId, power) {
  const key = getKey(channelId, userId);
  const entry = channelMods.get(key);
  return entry?.powers.has(power) || false;
}

export function getPowers(channelId, userId) {
  const key = getKey(channelId, userId);
  const entry = channelMods.get(key);
  return entry ? Array.from(entry.powers) : [];
}

export function getChannelMods(channelId) {
  const mods = [];
  for (const [key, entry] of channelMods) {
    if (entry.channelId === channelId) {
      mods.push({
        userId: entry.userId,
        powers: Array.from(entry.powers),
        grantedBy: entry.grantedBy,
        createdAt: entry.createdAt,
      });
    }
  }
  return mods;
}

export function isSuperAdmin(userId) {
  const admins = (process.env.MODCHAN_SUPERADMINS || '').split(',').filter(Boolean);
  return admins.includes(userId);
}

export { POWERS, ALL_POWERS };
