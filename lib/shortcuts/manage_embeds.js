import { canManage } from '../perms.js';
import { areWeEnterprise, deleteAttachment } from '../moderation.js';

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

function errorModal(message) {
  return {
    type: 'modal',
    title: txt('Error'),
    close: txt('Close'),
    blocks: [{
      type: 'section',
      text: { type: 'mrkdwn', text: message }
    }]
  };
}

export default {
  callbackId: 'manage_embeds',

  async execute({ shortcut, client, context, logger }) {
    if (!await canManage(context.userClient, shortcut.user.id, shortcut.channel.id)) {
      logger.warn(`${shortcut.user.id} denied for manage_embeds`);
      await client.views.open({ trigger_id: shortcut.trigger_id, view: noPermsModal() });
      return;
    }

    if (!areWeEnterprise) {
      logger.warn(`${shortcut.user.id} attempted to manage embeds but browser token and cookie are not provided`);
      await client.views.open({
        trigger_id: shortcut.trigger_id,
        view: errorModal(`:x: Slack browser token and cookie not provided`)
      });
      return;
    }

    const msg = shortcut.message;

    if (!msg.attachments?.length) {
      await client.views.open({
        trigger_id: shortcut.trigger_id,
        view: errorModal('This message has no embeds!')
      });
      return;
    }

    try {
      if (areWeEnterprise) {
        for (const attachment of msg.attachments) {
          await deleteAttachment(shortcut.channel.id, msg.ts, attachment.id);
        }
        logger.info(`clear_embeds done ${msg.ts} by ${shortcut.user.id}`);
        return;
      }

    } catch (error) {
      logger.error(`manage_embeds error on ${msg.ts}: ${error.message}`);
      try {
        await client.views.open({
          trigger_id: shortcut.trigger_id,
          view: errorModal(`:x: Failed to manage embeds: ${error.message}`)
        });
      } catch { /* trigger_id may have expired */ }
    }
  }
};
