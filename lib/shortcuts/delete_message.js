import { canManage } from '../perms.js';
import { RateLimiter } from '../ratelimiter.js';

const rateLimiter = new RateLimiter(1000, 5);

function noPermsModal() {
  return {
    type: 'modal',
    title: { type: 'plain_text', text: 'Permission Denied', emoji: true },
    close: { type: 'plain_text', text: 'Close', emoji: true },
    blocks: [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':no_entry: *You do not have permission to use this action in this channel.*'
      }
    }]
  };
}

export default {
  callbackId: 'delete_message',

  async execute({ shortcut, client, logger }) {
    if (!await canManage(client, shortcut.user.id, shortcut.channel.id)) {
      logger.warn(`${shortcut.user.id} denied for delete_message`);
      await client.views.open({ trigger_id: shortcut.trigger_id, view: noPermsModal() });
      return;
    }

    try {
      await rateLimiter.exec(async () => {
        await client.chat.delete({
          channel: shortcut.channel.id,
          ts: shortcut.message.ts
        });
      });
      logger.info(`delete_message done ${shortcut.message.ts}`);
    } catch (error) {
      logger.error(`delete_message error deleting ${shortcut.message.ts}: ${error.message}`);
    }
  }
};
