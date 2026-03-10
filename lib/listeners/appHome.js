import { isGlobalAdmin, listGlobalAdmins, listAllAppointedManagers, addGlobalAdmin, removeGlobalAdmin, addAppointedManager, removeAppointedManager } from '../db.js';

export const event = 'app_home_opened';

// --- block builders ---

const hdr = (text) => ({ type: 'header', text: { type: 'plain_text', text } });
const md = (text) => ({ type: 'section', text: { type: 'mrkdwn', text } });
const divider = { type: 'divider' };
const ctx = (text) => ({ type: 'context', elements: [{ type: 'mrkdwn', text }] });

function adminBlocks(admins) {
  const blocks = [hdr('Global Admins')];
  if (!admins.length) {
    blocks.push(md("_No global admins yet_"));
  } else {
    for (const a of admins) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `<@${a.user_id}>` },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: 'Remove' },
          style: 'danger',
          action_id: `home_remove_admin_${a.user_id}`,
          confirm: {
            title: { type: 'plain_text', text: 'Remove Admin?' },
            text: { type: 'plain_text', text: `Strip global admin from this user?` },
            confirm: { type: 'plain_text', text: 'Do it' },
            deny: { type: 'plain_text', text: 'Nah' },
          },
        },
      });
    }
  }
  blocks.push({
    type: 'actions',
    elements: [{
      type: 'button',
      text: { type: 'plain_text', text: 'Add Global Admin' },
      action_id: 'home_add_admin',
    }],
  });
  return blocks;
}

function channelRoleBlocks(managers) {
  const blocks = [hdr('Channel Roles')];
  if (!managers.length) {
    blocks.push(md("_No channel roles assigned. The channels govern themselves... somehow._"));
  } else {
    const byChannel = {};
    for (const m of managers) {
      (byChannel[m.channel_id] ||= []).push(m);
    }
    for (const [ch, members] of Object.entries(byChannel)) {
      blocks.push(md(`*<#${ch}>*`));
      for (const m of members) {
        const emoji = m.role === 'manager' ? ':baldfols:' : ':bonk:';
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `${emoji} <@${m.user_id}> — _${m.role}_` },
          accessory: {
            type: 'button',
            text: { type: 'plain_text', text: 'Remove' },
            style: 'danger',
            action_id: `home_remove_chrole_${m.user_id}_${m.channel_id}`,
            confirm: {
              title: { type: 'plain_text', text: 'Remove Channel Role?' },
              text: { type: 'plain_text', text: `Remove this user's role in this channel?` },
              confirm: { type: 'plain_text', text: 'Yeet them' },
              deny: { type: 'plain_text', text: 'Keep them' },
            },
          },
        });
      }
    }
  }
  blocks.push({
    type: 'actions',
    elements: [{
      type: 'button',
      text: { type: 'plain_text', text: 'Add Channel Role' },
      action_id: 'home_add_chrole',
    }],
  });
  return blocks;
}

function buildHome() {
  return [
    md('_Welcome to the :prometheus: Prometheus dashboard. You see this because you\'re one of the cool ones._'),
    divider,
    ...adminBlocks(listGlobalAdmins()),
    divider,
    ...channelRoleBlocks(listAllAppointedManagers()),
  ];
}

const normie = [
  md("Nothing to see here, move along! :eyes:"),
  ctx("_If you think you should have access, complain to someone important._"),
];

export default async function ({ event: ev, client }) {
  if (ev.tab !== 'home') return;
  const blocks = isGlobalAdmin(ev.user) ? buildHome() : normie;
  try {
    await client.views.publish({ user_id: ev.user, view: { type: 'home', blocks } });
  } catch (e) {
    console.error('[home] views.publish failed:', e.data || e.message);
  }
}

async function refreshHome(client, userId) {
  if (!isGlobalAdmin(userId)) return;
  await client.views.publish({ user_id: userId, view: { type: 'home', blocks: buildHome() } });
}

export const actions = [
  {
    pattern: /^home_remove_admin_(.+)$/,
    async execute({ action, body, client }) {
      const target = action.action_id.match(/^home_remove_admin_(.+)$/)[1];
      removeGlobalAdmin(target);
      await refreshHome(client, body.user.id);
    },
  },
  {
    pattern: /^home_remove_chrole_(.+?)_(.+)$/,
    async execute({ action, body, client }) {
      const [, uid, ch] = action.action_id.match(/^home_remove_chrole_(.+?)_(.+)$/);
      removeAppointedManager(uid, ch);
      await refreshHome(client, body.user.id);
    },
  },
  {
    actionId: 'home_add_admin',
    async execute({ body, client }) {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'home_add_admin_modal',
          title: { type: 'plain_text', text: 'Add Global Admin' },
          submit: { type: 'plain_text', text: 'Add' },
          blocks: [{
            type: 'input',
            block_id: 'user_block',
            label: { type: 'plain_text', text: 'User' },
            element: { type: 'users_select', action_id: 'user_select' },
          }],
          private_metadata: body.user.id,
        },
      });
    },
  },
  {
    actionId: 'home_add_chrole',
    async execute({ body, client }) {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'home_add_chrole_modal',
          title: { type: 'plain_text', text: 'Add Channel Role' },
          submit: { type: 'plain_text', text: 'Add' },
          blocks: [
            {
              type: 'input',
              block_id: 'user_block',
              label: { type: 'plain_text', text: 'User' },
              element: { type: 'users_select', action_id: 'user_select' },
            },
            {
              type: 'input',
              block_id: 'channel_block',
              label: { type: 'plain_text', text: 'Channel' },
              element: { type: 'channels_select', action_id: 'channel_select' },
            },
            {
              type: 'input',
              block_id: 'role_block',
              label: { type: 'plain_text', text: 'Role' },
              element: {
                type: 'static_select',
                action_id: 'role_select',
                options: [
                  { text: { type: 'plain_text', text: 'Moderator' }, value: 'moderator' },
                  { text: { type: 'plain_text', text: 'Manager' }, value: 'manager' },
                ],
                initial_option: { text: { type: 'plain_text', text: 'Moderator' }, value: 'moderator' },
              },
            },
          ],
          private_metadata: body.user.id,
        },
      });
    },
  },
];

export const views = [
  {
    callbackId: 'home_add_admin_modal',
    async handleView({ view, client }) {
      const invoker = view.private_metadata;
      const target = view.state.values.user_block.user_select.selected_user;
      addGlobalAdmin(target, invoker);
      await refreshHome(client, invoker);
    },
  },
  {
    callbackId: 'home_add_chrole_modal',
    async handleView({ view, client }) {
      const invoker = view.private_metadata;
      const v = view.state.values;
      const uid = v.user_block.user_select.selected_user;
      const ch = v.channel_block.channel_select.selected_channel;
      const role = v.role_block.role_select.selected_option.value;
      addAppointedManager(uid, ch, invoker, role);
      await refreshHome(client, invoker);
    },
  },
];
