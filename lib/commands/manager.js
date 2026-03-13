const FIELD_ID = process.env.MANAGER_FIELD_ID;
const TOKEN = process.env.SLACK_USER_TOKEN;

const pull = async (uid) => {
  const r = await fetch(`https://slack.com/api/users.profile.get?user=${uid}`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  });
  const data = await r.json();
  const value = data.profile?.fields?.[FIELD_ID]?.value;
  return value ? value.split(',').filter(Boolean) : [];
};

const updateManagers = async (uid, managers) => {
  const r = await fetch('https://slack.com/api/users.profile.set', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
      'X-Slack-User': uid,
    },
    body: JSON.stringify({
      user: uid,
      profile: { fields: { [FIELD_ID]: { value: managers.join(','), alt: '' } } },
    }),
  });
  return r.json();
};

export default {
  name: 'manager',
  async execute({ command: cmd, args, respond }) {
    const err = (t) => respond({ response_type: 'ephemeral', text: t });
    const [action, target] = args;

    switch (action) {
      case 'add': {
        if (!target) return err(':red-x: Usage: `/pro manager add @manager`');
        const mid = target.replace(/[<@>]/g, '').split('|')[0];
        const current = await pull(cmd.user_id);
        if (current.includes(mid)) return err(`:red-x: <@${mid}> is already your manager?`);
        current.push(mid);
        const r = await updateManagers(cmd.user_id, current);
        if (!r.ok) return err(`:red-x: Slack error: ${r.error}`);
        if (r.warnings) return err(`:dead: ${r.warnings}`);
        return respond({ response_type: 'ephemeral', text: `:okay-1: Added <@${mid}> as your manager.` });
      }
      case 'remove': {
        if (!target) return err(':red-x: Usage: `/pro manager remove @manager`');
        const mid = target.replace(/[<@>]/g, '').split('|')[0];
        const current = await pull(cmd.user_id);
        if (!current.includes(mid)) return err(`:red-x: <@${mid}> is not your manager.`);
        const updated = current.filter((m) => m !== mid);
        const r = await updateManagers(cmd.user_id, updated);
        if (!r.ok) return err(`:red-x: Slack error: ${r.error}`);
        if (r.warnings) return err(`:dead: ${r.warnings}`);
        return respond({ response_type: 'ephemeral', text: `:okay-1: Removed <@${mid}> as your manager.` });
      }
      default:
        return err(':red-x: Usage: `/pro manager [add|remove] [@manager]`');
    }
  },
};
