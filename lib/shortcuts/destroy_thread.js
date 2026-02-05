import { canManage } from '../perms.js';
import { purge } from '../purge.js';

function noPermsModal() {
  return {
    type: 'modal',
    title: { type: 'plain_text', text: 'Aw, Snap!', emoji: true },
    close: { type: 'plain_text', text: 'Close', emoji: true },
    blocks: [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':red-x: *You do not have permission to do this!* Only channel managers are able to use this bot. Try it again in a channel you manage.'
      }
    }]
  };
}

export default {
  callbackId: 'destroy_thread',
  viewCallbackId: 'destroy_thread_confirm',

  async execute({ shortcut, client, logger }) {
    if (!await canManage(client, shortcut.user.id, shortcut.channel.id)) {
      logger.warn(`${shortcut.user.id} denied for destroy_thread`);
      await client.views.open({ trigger_id: shortcut.trigger_id, view: noPermsModal() });
      return;
    }

    await client.views.open({
      trigger_id: shortcut.trigger_id,
      view: {
        type: 'modal',
        title: { type: 'plain_text', text: 'Hold up!', emoji: true },
        close: { type: 'plain_text', text: 'Abort!', emoji: true },
        submit: { type: 'plain_text', text: 'I am sure!', emoji: true },
        callback_id: 'destroy_thread_confirm',
        private_metadata: JSON.stringify({
          channel: shortcut.channel.id,
          messageTs: shortcut.message.ts,
          threadTs: shortcut.message.thread_ts || shortcut.message.ts
        }),
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Are you like 100% sure you want to do this?* Once you start deleting, there is no going back.'
          }
        }]
      }
    });
  },

  async handleView({ view, body, client, logger }) {
    const { channel, threadTs } = JSON.parse(view.private_metadata);
    const userId = body.user.id;

    if (!await canManage(client, userId, channel)) {
      logger.warn(`${userId} denied for destroy_thread handleView`);
      return;
    }

    await purge(client, logger, channel, threadTs);
  }
};
