import { addGlobalAdmin, removeGlobalAdmin, listGlobalAdmins } from '../db.js';
import { isGlobalAdmin, isWorkspaceAdmin } from '../perms.js';

const SUPERADMINS = (process.env.SUPERADMINS || '').split(',').filter(Boolean);
const isSuperAdmin = (id) => SUPERADMINS.includes(id);

export default {
  name: 'admin',
  description: 'Manage global admins',
  async execute({ command, args, respond, client }) {
    const userId = command.user_id;
    const [action, targetUser] = args;

    const allowed = isSuperAdmin(userId) || isGlobalAdmin(userId) || await isWorkspaceAdmin(client, userId);
    if (!allowed) {
      await respond({
        response_type: 'ephemeral',
        text: ':no_entry: You do not have permission! :P'
      });
      return;
    }

    switch (action) {
      case 'add': {
        if (!targetUser) {
          await respond({ response_type: 'ephemeral', text: 'Usage: `/pro admin add @user`' });
          return;
        }
        const id = targetUser.replace(/[<@>]/g, '').split('|')[0];
        addGlobalAdmin(id, userId);
        await respond({ response_type: 'ephemeral', text: `:white_check_mark: Added <@${id}> as global admin.` });
        break;
      }
      case 'remove': {
        if (!targetUser) {
          await respond({ response_type: 'ephemeral', text: 'Usage: `/pro admin remove @user`' });
          return;
        }
        const id = targetUser.replace(/[<@>]/g, '').split('|')[0];
        removeGlobalAdmin(id);
        await respond({ response_type: 'ephemeral', text: `:white_check_mark: Removed <@${id}> from global admins.` });
        break;
      }
      case 'list': {
        const admins = listGlobalAdmins();
        if (admins.length === 0) {
          await respond({ response_type: 'ephemeral', text: 'No global admins configured.' });
        } else {
          const list = admins.map(a => `• <@${a.user_id}>`).join('\n');
          await respond({ response_type: 'ephemeral', text: `*Global Admins:*\n${list}` });
        }
        break;
      }
      default:
        await respond({ response_type: 'ephemeral', text: 'Usage: `/pro admin [add|remove|list] [@user]`' });
    }
  }
};
