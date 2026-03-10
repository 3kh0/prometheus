import { addAppointedManager, removeAppointedManager, listAppointedManagers } from '../db.js';
import { isGlobalAdmin } from '../perms.js';

const parseUser = (s) => s?.replace(/[<@>]/g, '').split('|')[0];
const eph = (text) => ({ response_type: 'ephemeral', text });

export default {
  name: 'channelmanager',
  description: 'Manage channel managers',
  async execute({ command, args, respond }) {
    const u = command.user_id, ch = command.channel_id;
    const [action, target] = args;

    if (!isGlobalAdmin(u))
      return respond(eph(':loll: You do not have permission! :P'));

    switch (action) {
      case 'add': {
        const id = parseUser(target);
        if (!id) return respond(eph('Usage: `/pro channelmanager add @user [manager]`'));
        const role = args[2] === 'manager' ? 'manager' : 'moderator';
        addAppointedManager(id, ch, u, role);
        return respond(eph(`:white_check_mark: Added <@${id}> as channel ${role} for <#${ch}>.`));
      }
      case 'remove': {
        const id = parseUser(target);
        if (!id) return respond(eph('Usage: `/pro channelmanager remove @user`'));
        removeAppointedManager(id, ch);
        return respond(eph(`:white_check_mark: Removed <@${id}> from <#${ch}>.`));
      }
      case 'list': {
        const mgrs = listAppointedManagers(ch);
        return respond(eph(mgrs.length
          ? `*Channel roles for <#${ch}>:*\n${mgrs.map(m => `• <@${m.user_id}> — ${m.role}`).join('\n')}`
          : 'No channel roles set for this channel.'));
      }
      default:
        return respond(eph('Usage: `/pro channelmanager [add|remove|list] [@user] [manager]`'));
    }
  }
};
