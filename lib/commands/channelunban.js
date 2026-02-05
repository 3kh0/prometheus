import { canManage } from '../perms.js';
import { removeChannelBan } from '../db.js';

const parseId = (t, r) => t?.match(r)?.[1];

export default {
  name: 'channelunban',
  slash: '/channelunban',
  description: 'Remove a channel ban',

  async execute({ command: cmd, args, respond, client }) {
    const err = (t) => respond({ response_type: 'ephemeral', text: t });

    if (!await canManage(client, cmd.user_id, cmd.channel_id))
      return err(':no_entry: You do not have permission to use this command.');

    const [rawUser, rawChannel] = args;
    const userId = parseId(rawUser, /<@([A-Z0-9]+)\|?.*>/);
    const channelId = parseId(rawChannel, /<#([A-Z0-9]+)\|?.*>/) || cmd.channel_id;

    if (!userId || !channelId)
      return err(':x: Usage: `/pro channelunban @user [#channel]`');

    removeChannelBan(userId, channelId);

    await respond({
      response_type: 'ephemeral',
      text: `:white_check_mark: Unbanned <@${userId}> from <#${channelId}>.`
    });
  }
};
