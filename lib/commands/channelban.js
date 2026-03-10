import { canBan } from '../perms.js';
import { setChannelBan } from '../db.js';

const parseId = (t, r) => t?.match(r)?.[1];
const parseDuration = (t) => {
  if (!t) return null;
  const m = t.match(/^(\d+)([smhdw])$/i);
  if (!m) return null;
  const n = Number(m[1]);
  const mult = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };
  return Math.floor(Date.now() / 1000) + n * mult[m[2].toLowerCase()];
};

export default {
  name: 'channelban',
  description: 'Ban a user from a channel',

  async execute({ command: cmd, args, respond, context }) {
    const err = (t) => respond({ response_type: 'ephemeral', text: t });

    if (!await canBan(context.userClient, cmd.user_id, cmd.channel_id))
      return err(':loll: You do not have permission to use this command.');

    const [rawUser, rawChannel, ...rest] = args;
    const userId = parseId(rawUser, /<@([A-Z0-9]+)\|?.*>/);
    const channelId = parseId(rawChannel, /<#([A-Z0-9]+)\|?.*>/) || cmd.channel_id;
    const remaining = rawChannel && channelId !== cmd.channel_id ? rest : [rawChannel, ...rest];
    const expires = parseDuration(remaining[0]);
    const reason = (expires ? remaining.slice(1) : remaining).join(' ').trim();

    if (!userId || !channelId || !reason)
      return err(':red-x: Usage: `/pro channelban @user [#channel] [duration] reason`');

    setChannelBan(userId, channelId, cmd.user_id, reason, expires);

    await respond({
      response_type: 'ephemeral',
      text: `:bonk: Banned <@${userId}> from <#${channelId}>${expires ? ` until <t:${expires}:f>` : ''}.`
    });
  }
};
