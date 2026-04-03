import { canManage } from '../perms.js';

const txt = (text) => ({ type: 'plain_text', text, emoji: true });

function noPermsModal() {
  return {
    type: 'modal',
    title: txt('Aw, Snap!'),
    close: txt('Close'),
    blocks: [{
      type: 'section',
      text: { type: 'mrkdwn', text: ':red-x: *You do not have permission to do this!* Only channel managers are able to use this bot. Try it again in a channel you manage.' }
    }]
  };
}

export default {
  callbackId: 'clear_embeds',

  async execute({ shortcut, client, context, logger }) {
    if (!await canManage(context.userClient, shortcut.user.id, shortcut.channel.id)) {
      logger.warn(`${shortcut.user.id} denied for clear_embeds`);
      await client.views.open({ trigger_id: shortcut.trigger_id, view: noPermsModal() });
      return;
    }

    const msg = shortcut.message;

    if (!msg.attachments?.length) {
      await client.views.open({
        trigger_id: shortcut.trigger_id,
        view: {
          type: 'modal',
          title: { type: 'plain_text', text: 'Error', emoji: true },
          close: { type: 'plain_text', text: 'Close', emoji: true },
          blocks: [{
            type: 'section',
            text: { type: 'mrkdwn', text: 'This message has no embeds to clear!' }
          }]
        }
      });
      return;
    }

    try {
      await context.userClient.chat.update({
        channel: shortcut.channel.id,
        ts: msg.ts,
        text: msg.text || '',
        attachments: [],
        unfurl_links: false,
        unfurl_media: false,
      });
      logger.info(`clear_embeds done ${msg.ts} by ${shortcut.user.id}`);
    } catch (error) {
      logger.error(`clear_embeds error on ${msg.ts}: ${error.message}`);
      try {
        await client.views.open({
          trigger_id: shortcut.trigger_id,
          view: {
            type: 'modal',
            title: { type: 'plain_text', text: 'Error', emoji: true },
            close: { type: 'plain_text', text: 'Close', emoji: true },
            blocks: [{
              type: 'section',
              text: { type: 'mrkdwn', text: `:x: Failed to clear embeds: ${error.message}` }
            }]
          }
        });
      } catch { /* trigger_id may have expired */ }
    }
  }
};
