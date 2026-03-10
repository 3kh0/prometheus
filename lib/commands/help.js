import { isGlobalAdmin, isWorkspaceAdmin, isChannelModerator, isChannelManager } from '../perms.js';

const EVERYONE = [
  { cmd: '/pro ping', desc: 'See if I\'m awake (and how slow I am)' },
  { cmd: '/pro manager [add|remove] [@manager]', desc: 'Set who your manager is on your profile' },
  { cmd: '/pro info [@user]', desc: 'Look up info about a Slack user' },
  { cmd: '/pro help', desc: 'You\'re looking at it :)' },
];

const MODERATOR_CMDS = [
  { cmd: '/pro here <message>', desc: 'Ping all online members in this channel' },
  { cmd: '/pro channel <message>', desc: 'Ping literally everyone, use wisely or face the wrath' },
  { cmd: '/pro channelban @user [#channel] [duration] reason', desc: 'Banish someone from a channel' },
  { cmd: '/pro channelunban @user [#channel]', desc: 'Grant them mercy' },
];

const MANAGER_CMDS = [
  { cmd: '/pro welcome [set|remove|view]', desc: 'Manage the welcome message for new peeps!' },
];

const CHANNEL_SHORTCUTS = [
  { cmd: 'Delete Message', desc: 'Right-click → Message shortcuts. Poof, gone.' },
  { cmd: 'Destory Thread', desc: 'Right-click → Message shortcuts. Nukes an entire thread.' },
];

const ADMIN_CMDS = [
  { cmd: '/pro admin [add|remove|list] [@user]', desc: 'Manage the chosen ones (global admins)' },
  { cmd: '/pro channelmanager add @user [manager]', desc: 'Appoint a moderator (ban-only) or full manager' },
  { cmd: '/pro channelmanager [remove|list] [@user]', desc: 'Remove or list channel roles' },
];

const section = (title, items) =>
  `*${title}*\n${items.map(i => `> \`${i.cmd}\` — ${i.desc}`).join('\n')}`;

export default {
  name: 'help',
  description: 'Show what you can do with Prometheus',
  async execute({ command, respond, client }) {
    const userId = command.user_id;
    const channelId = command.channel_id;

    const admin = isGlobalAdmin(userId) || await isWorkspaceAdmin(client, userId);
    const moderator = admin || isChannelModerator(client, userId, channelId);
    const manager = admin || isChannelManager(client, userId, channelId);

    const blocks = [];

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':prometheus: *Prometheus*\nPrometheus is a moderation bot for the community. Here\'s what you can do in <#' + channelId + '>.',
      },
    });

    blocks.push({ type: 'divider' });

    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: section(':hii: For Everyone', EVERYONE) },
    });

    if (moderator) {
      blocks.push({ type: 'divider' });
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: section(':hammer: Channel Moderation', MODERATOR_CMDS) },
      });
    }

    if (manager) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: section(':adminabooz: Channel Management', MANAGER_CMDS) },
      });
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: section(':shortcuts: Message Shortcuts — the fun stuff', CHANNEL_SHORTCUTS) },
      });
    }

    if (admin) {
      blocks.push({ type: 'divider' });
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: section('Admin — with great power...', ADMIN_CMDS) },
      });
    }

    if (!moderator) {
      blocks.push({ type: 'divider' });
      blocks.push({
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: '_That\'s all you have here. Need more power? Ask eps to run `/pro channelmanager add @you` in this channel._',
        }],
      });
    }

    await respond({ response_type: 'ephemeral', blocks });
  },
};
