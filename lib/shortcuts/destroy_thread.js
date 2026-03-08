import { canManage } from '../perms.js';
import { purge } from '../purge.js';
import { hideThread, areWeEnterprise } from '../moderation.js';

const txt = (text) => ({ type: 'plain_text', text, emoji: true });
const opt = (text, value) => ({ text: txt(text), value });

const hideOpt = opt('Hide Thread (tombstone)', 'hide');
const deleteOpt = opt('Fully Delete (permanent)', 'delete');

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

function signoff() {
  const blocks = [{
    type: 'section',
    text: { type: 'mrkdwn', text: '*Are you like 100% sure you want to do this?* Once you start, there is no going back.' }
  }];

  if (areWeEnterprise) {
    blocks.push({
      type: 'input',
      block_id: 'destroy_mode',
      label: txt('Destruction method'),
      element: {
        type: 'static_select',
        action_id: 'destroy_mode_select',
        initial_option: hideOpt,
        options: [hideOpt, deleteOpt],
      },
      hint: txt('Thanks to the power of Slack\'s moderation tools, you can choose to hide the thread (tombstone) or perform a full delete (permanent).'),
    });
  }

  return blocks;
}

export default {
  callbackId: 'destroy_thread',
  viewCallbackId: 'destroy_thread_confirm',

  async execute({ shortcut: s, client, logger }) {
    const open = (view) => client.views.open({ trigger_id: s.trigger_id, view });

    if (!await canManage(client, s.user.id, s.channel.id)) {
      logger.warn(`${s.user.id} denied for destroy_thread`);
      return open(noPermsModal());
    }

    await open({
      type: 'modal',
      title: txt('Hold up!'),
      close: txt('Abort!'),
      submit: txt('I am sure!'),
      callback_id: 'destroy_thread_confirm',
      private_metadata: JSON.stringify({
        channel: s.channel.id,
        messageTs: s.message.ts,
        threadTs: s.message.thread_ts || s.message.ts
      }),
      blocks: signoff()
    });
  },

  async handleView({ view, body, client, logger }) {
    const { channel, threadTs } = JSON.parse(view.private_metadata);
    const uid = body.user.id;

    if (!await canManage(client, uid, channel)) {
      logger.warn(`${uid} denied for destroy_thread handleView`);
      return;
    }

    const mode = view.state?.values?.destroy_mode?.destroy_mode_select?.selected_option?.value || 'delete';
    logger.info(`destroy_thread: mode=${mode} channel=${channel} threadTs=${threadTs} by=${uid}`);

    if (mode === 'hide') {
      await hideThread(channel, threadTs);
      logger.info(`destroy_thread: thread ${threadTs} hidden in ${channel} by ${uid}`);
    } else {
      await purge(client, logger, channel, threadTs, uid);
    }
  }
};
