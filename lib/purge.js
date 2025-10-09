export async function purge(client, logger, channel, threadTs) {
  const result = await client.conversations.replies({
    channel: channel,
    ts: threadTs,
  });

  let messages = result.messages || [];

  for (const message of messages) {
    try {
      await client.chat.delete({
        channel: channel,
        ts: message.ts,
      });
    } catch (error) {
      logger.error(`destroy_thread error deleting ${message.ts}: ${error.message}`);
    }
  }

  const next = await client.conversations.replies({
    channel: channel,
    ts: threadTs,
  });

  const n = next.messages || [];
  for (const message of n) {
    try {
      await client.chat.delete({
        channel: channel,
        ts: message.ts,
      });
    } catch (error) {
      logger.error(`destroy_thread error deleting ${message.ts}: ${error.message}`);
    }
  }

  logger.info(`destroy_thread deleted ${messages.length + n.length} messages`);
}
