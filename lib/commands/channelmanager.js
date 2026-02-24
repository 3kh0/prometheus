import { addAppointedManager, removeAppointedManager, listAppointedManagers } from '../db.js';
import { isGlobalAdmin, isWorkspaceAdmin } from '../perms.js';

const parseUser = (s) => s?.replace(/[<@>]/g, '').split('|')[0];
const eph = (text) => ({ response_type: 'ephemeral', text });

export default {
  name: 'channelmanager',
  description: 'Manage channel managers',
  async execute({ command, args, respond, client }) {
    const u = command.user_id, ch = command.channel_id;
    const [action, target] = args;

    if (!isGlobalAdmin(u) && !(await isWorkspaceAdmin(client, u)))
      return respond(eph(':no_entry: You do not have permission! :P'));

    switch (action) {
      case 'add': {
        const id = parseUser(target);
        if (!id) return respond(eph('Usage: `/pro channelmanager add @user`'));
        addAppointedManager(id, ch, u);
        return respond(eph(`:white_check_mark: Added <@${id}> as channel manager for <#${ch}>.`));
      }
      case 'remove': {
        const id = parseUser(target);
        if (!id) return respond(eph('Usage: `/pro channelmanager remove @user`'));
        removeAppointedManager(id, ch);
        return respond(eph(`:white_check_mark: Removed <@${id}> as channel manager for <#${ch}>.`));
      }
      case 'list': {
        const mgrs = listAppointedManagers(ch);
        return respond(eph(mgrs.length
          ? `*Channel Managers for <#${ch}>:*\n${mgrs.map(m => `• <@${m.user_id}>`).join('\n')}`
          : 'No channel managers for this channel.'));
      }
      default:
        return respond(eph('Usage: `/pro channelmanager [add|remove|list] [@user]`'));
    }
  }
};
