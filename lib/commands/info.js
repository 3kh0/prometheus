export default {
  name: 'info',
  description: 'Display info about a Slack user',
  async execute({ args, command, respond, client }) {
    const mention = args[0];
    const userId = mention
      ? mention.replace(/^<@/, '').replace(/>$/, '')
      : command.user_id;

    let user;
    try {
      const result = await client.users.info({ user: userId });
      user = result.user;
    } catch {
      return respond({ response_type: 'ephemeral', text: ':red-x: I could not find that user... Something went wrong.' });
    }

    const tz = user.tz || 'Unknown';
    const email = user.profile?.email || 'Not available';
    const username = user.name || 'Unknown';

    const lines = [
      `*User Info for <@${userId}>:*`,
      `- :earth_americas: Timezone: ${tz}`,
      `- :slack: Slack Email: ${email}`,
      `- :slack: Slack Username: ${username}`,
      `- :slack: Slack ID: ${userId}`,
    ];

    await respond({ response_type: 'ephemeral', text: lines.join('\n') });
  },
};
