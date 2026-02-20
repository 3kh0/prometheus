const FIELD_ID = 'Xf09727DH1J8';
const TOKEN = process.env.SLACK_USER_TOKEN;

const setField = async (uid, value) => {
  const r = await fetch('https://slack.com/api/users.profile.set', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
      'X-Slack-User': uid,
    },
    body: JSON.stringify({
      user: uid,
      profile: { fields: { [FIELD_ID]: { value, alt: '' } } },
    }),
  });
  return r.json();
};

export default {
  name: 'manager',
  description: 'Set or remove the manager field on your profile',
  async execute({ command: cmd, args, respond }) {
    const err = (t) => respond({ response_type: 'ephemeral', text: t });
    const [action, target] = args;

    switch (action) {
      case 'add': {
        if (!target) return err(':x: Usage: `/pro manager add @manager`');
        const mid = target.replace(/[<@>]/g, '').split('|')[0];
        const r = await setField(cmd.user_id, mid);
        if (!r.ok) return err(`:x: Slack error: ${r.error}`);
        return respond({ response_type: 'ephemeral', text: `:white_check_mark: Set your manager to <@${mid}>.` });
      }
      case 'remove': {
        const r = await setField(cmd.user_id, '');
        if (!r.ok) return err(`:x: Slack error: ${r.error}`);
        return respond({ response_type: 'ephemeral', text: ':white_check_mark: Removed your manager.' });
      }
      default:
        return err(':x: Usage: `/pro manager [add|remove] [@manager]`');
    }
  },
};
