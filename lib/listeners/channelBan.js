import { getChannelBan, removeChannelBan } from '../db.js';

const expired = (b) => b?.expires && b.expires <= Math.floor(Date.now() / 1000);

export default async function channelBanListener({ event, client, logger }) {
  if (!event || event.type !== 'message' || !event.user) return;
  if (event.subtype && ['bot_message', 'message_changed', 'message_deleted'].includes(event.subtype)) return;

  const ban = getChannelBan(event.user, event.channel);
  if (!ban) return;
  if (expired(ban)) {
    removeChannelBan(event.user, event.channel);
    return;
  }

  const msg = `Your message has been deleted because you're banned from this channel${ban.reason ? ` for the following reason: ${ban.reason}` : '.'}`;

  await Promise.all([
    client.chat.delete({ channel: event.channel, ts: event.ts }).catch((e) => {
      logger.warn(`channel ban delete failed: ${e.message}`);
    }),
    client.conversations.kick({ channel: event.channel, user: event.user }).catch((e) => {
      logger.warn(`channel ban kick failed: ${e.message}`);
    }),
    client.chat.postEphemeral({ channel: event.channel, user: event.user, text: msg }).catch((e) => {
      logger.warn(`channel ban notify failed: ${e.message}`);
    }),
  ]);
}
