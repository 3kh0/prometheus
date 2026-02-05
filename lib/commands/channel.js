import { WebClient } from '@slack/web-api';

const bot = new WebClient(process.env.SLACK_BOT_TOKEN);

export default {
  name: 'channel',
  description: 'Send a message with @channel',

  async execute({ command: cmd, args, respond, client, logger }) {
    const msg = args.join(' ');
    const err = (t) => respond({ response_type: 'ephemeral', text: t });

    if (!msg) return err(':x: Usage: `/pro channel <message>`');

    try {
      const u = (await client.users.info({ user: cmd.user_id })).user;
      const opts = {
        channel: cmd.channel_id,
        text: `<!channel> ${msg}`,
        username: u.profile.display_name || u.real_name || u.name,
        icon_url: u.profile.image_192
      };

      const post = () => bot.chat.postMessage(opts);
      try {
        await post();
      } catch (e) {
        if (e.data?.error !== 'not_in_channel') throw e;
        try {
          await bot.conversations.join({ channel: cmd.channel_id });
          await post();
        } catch {
          return err(':x: I need to be in this channel! Use `/invite @Prometheus` to add me.');
        }
      }
    } catch (e) {
      logger.error(`channel command error: ${e.message}`);
      await err(`:x: Failed to send message: ${e.message}`);
    }
  }
};
