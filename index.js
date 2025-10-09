import 'dotenv/config';
import { App } from '@slack/bolt';
import { purge } from './lib/purge.js';
import { check } from './lib/perms.js';

const app = new App({
  token: process.env.SLACK_USER_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true, // pc: i love socket mode
  appToken: process.env.SLACK_APP_TOKEN,
});

app.shortcut('destroy_thread', async ({ shortcut, ack, client, logger }) => {
  await ack();

  const allowed = await check(client, logger, shortcut.user.id, shortcut.channel.id);

  if (allowed === 'b') {
    logger.warn(`slack api block`);
    await client.views.open({
      trigger_id: shortcut.trigger_id,
      view: {
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'Aw, Snap!',
          emoji: true
        },
        close: {
          type: 'plain_text',
          text: 'Close',
          emoji: true
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: ':red-x: *Sorry, due to Slack API limits I can not operate in this channel.* Slack does not allow bots to delete messages from other users without a Workspace Admin token. If you want to use this bot, please invite <@U080A3QP42C> (Rowan).'
            }
          }
        ]
      }
    });
    return;
  } else if (!allowed) {
    logger.warn(`lmao ${shortcut.user.id} dont got perms :loll:`);
    await client.views.open({
      trigger_id: shortcut.trigger_id,
      view: {
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'Aw, Snap!',
          emoji: true
        },
        close: {
          type: 'plain_text',
          text: 'Close',
          emoji: true
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: ':red-x: *You do not have permission to do this!* Only channel managers are able to use this bot. Try it again in a channel you manage.'
            }
          }
        ]
      }
    });
    return;
  }

  await client.views.open({
    trigger_id: shortcut.trigger_id,
    view: {
      type: 'modal',
      title: {
        type: 'plain_text',
        text: 'Hold up!',
        emoji: true
      },
      close: {
        type: 'plain_text',
        text: 'Abort!',
        emoji: true
      },
      submit: {
        type: 'plain_text',
        text: 'I am sure!',
        emoji: true
      },
      callback_id: 'destroy_thread_confirm',
      private_metadata: JSON.stringify({
        channel: shortcut.channel.id,
        messageTs: shortcut.message.ts,
        threadTs: shortcut.message.thread_ts || shortcut.message.ts
      }),
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Are you like 100% sure you want to do this?* Once you start deleting, there is no going back.'
          }
        }
      ]
    }
  });
});

app.view('destroy_thread_confirm', async ({ ack, view, body, client, logger }) => {
  await ack();

  try {
    const { channel, threadTs } = JSON.parse(view.private_metadata);
    const userId = body.user.id;

    // sanity check??
    if (!await check(client, logger, userId, channel)) {
      logger.warn(`lmao ${userId} dont got perms :loll:`);
      return;
    }

    await purge(client, logger, channel, threadTs);

  } catch (error) {
    logger.error(`destroy_thread error ${error.message}`);
  }
});

app.shortcut('delete_message', async ({ shortcut, ack, client, logger }) => {
  await ack();

  const allowed = await check(client, logger, shortcut.user.id, shortcut.channel.id);

  if (allowed === 'b') {
    logger.warn(`slack api block`);
    await client.views.open({
      trigger_id: shortcut.trigger_id,
      view: {
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'Aw, Snap!',
          emoji: true
        },
        close: {
          type: 'plain_text',
          text: 'Close',
          emoji: true
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: ':red-x: *Sorry, due to Slack API limits I can not operate in this channel.* Slack does not allow bots to delete messages from other users without a Workspace Admin token. If you want to use this bot, please invite <@U080A3QP42C> (Rowan).'
            }
          }
        ]
      }
    });
    return;
  } else if (!allowed) {
    logger.warn(`lmao ${shortcut.user.id} dont got perms :loll:`);
    await client.views.open({
      trigger_id: shortcut.trigger_id,
      view: {
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'Permission Denied',
          emoji: true
        },
        close: {
          type: 'plain_text',
          text: 'Close',
          emoji: true
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: ':no_entry: *You do not have permission to use this action in this channel.*'
            }
          }
        ]
      }
    });
    return;
  }

  try {
    await client.chat.delete({
      channel: shortcut.channel.id,
      ts: shortcut.message.ts
    });
    logger.info(`delete_message done ${shortcut.message.ts}`);
  } catch (error) {
    logger.error(`delete_message error deleting ${shortcut.message.ts}: ${error.message}`);
  }
});

(async () => {
  await app.start();
  console.log(`fire stolen, legs broken`);
})();
