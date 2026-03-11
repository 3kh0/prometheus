import { listPingLocks } from "../db.js";
import { canManage } from "../perms.js";
import { lockThread, areWeEnterprise } from "../moderation.js";

const SUBTEAM_RE = /<!subteam\^(\w+)/g;

export default async function pingLockListener({
  event,
  context: _context,
  client,
  logger,
}) {
  if (!event || event.type !== "message" || !event.user) return;
  if (event.subtype) return;
  if (event.thread_ts) return;
  if (!areWeEnterprise) return;

  const text = event.text || "";
  const mentioned = [...text.matchAll(SUBTEAM_RE)].map((m) => m[1]);
  if (!mentioned.length) return;

  const locks = listPingLocks(event.channel);
  if (!locks.length) return;

  const lockedGroups = new Set(locks.map((l) => l.group_id));
  const matched = mentioned.filter((g) => lockedGroups.has(g));
  if (!matched.length) return;

  // triggered only by cms
  if (!(await canManage(client, event.user, event.channel))) return;

  console.log(
    `[pinglock] auto-locking thread ${event.ts} in ${event.channel} (groups: ${matched.join(", ")})`,
  );

  try {
    // you have to put a message before locking to create the thread
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: ":lock: This thread has been automatically locked.",
    });

    await lockThread(event.channel, event.ts);

    console.log(
      `[pinglock] successfully locked thread ${event.ts} in ${event.channel}`,
    );
  } catch (e) {
    logger?.error(
      `[pinglock] failed to auto-lock thread ${event.ts}: ${e.message}`,
    );
  }
}
