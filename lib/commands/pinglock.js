import { addPingLock, removePingLock, listPingLocks } from "../db.js";
import { canManage } from "../perms.js";

const parseGroup = (s) =>
  s?.match(/<!subteam\^(\w+)/)?.[1] || s?.replace(/[<>@!]/g, "");
const eph = (text) => ({ response_type: "ephemeral", text });

export default {
  name: "pinglock",
  description: "Manage automatic thread locking for user group pings",
  async execute({ command, args, respond, client }) {
    const u = command.user_id,
      ch = command.channel_id;
    const [action, target] = args;

    if (!(await canManage(client, u, ch))) {
      console.log(`[pinglock] ${u} denied in ${ch}`);
      return respond(eph(":loll: You do not have permission! :P"));
    }

    switch (action) {
      case "add": {
        const groupId = parseGroup(target);
        if (!groupId)
          return respond(eph("Usage: `/pro pinglock add @usergroup`"));
        addPingLock(ch, groupId, u);
        console.log(
          `[pinglock] ${u} added ping lock for group ${groupId} in ${ch}`,
        );
        return respond(
          eph(
            `:white_check_mark: Threads containing <!subteam^${groupId}> pings in <#${ch}> will now be auto-locked.`,
          ),
        );
      }
      case "remove": {
        const groupId = parseGroup(target);
        if (!groupId)
          return respond(eph("Usage: `/pro pinglock remove @usergroup`"));
        removePingLock(ch, groupId);
        console.log(
          `[pinglock] ${u} removed ping lock for group ${groupId} in ${ch}`,
        );
        return respond(
          eph(
            `:white_check_mark: Removed auto-lock for <!subteam^${groupId}> in <#${ch}>.`,
          ),
        );
      }
      case "list": {
        const locks = listPingLocks(ch);
        if (!locks.length)
          return respond(eph("No ping locks configured for this channel."));
        const lines = locks.map(
          (l) => `• <!subteam^${l.group_id}> — added by <@${l.added_by}>`,
        );
        return respond(eph(`*Ping locks for <#${ch}>:*\n${lines.join("\n")}`));
      }
      default:
        return respond(
          eph("Usage: `/pro pinglock [add|remove|list] [@usergroup]`"),
        );
    }
  },
};
